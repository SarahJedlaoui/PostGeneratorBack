const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

/** Initialise once and reuse */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const generateTrendingTopicsWithQuestions = async () => {
  const prompt = `
You are a tech-savvy social media analyst working with medical professionals.
Find the 10 most trending medical and health-tech topics being discussed right now on platforms like Instagram, LinkedIn, TikTok, and news outlets.

For each topic, provide:
1. A short 4-word-or-less title.
2. 4 simple, reflective or opinion-based questions that a doctor might ask or respond to on social media.

Format your response as a JSON array like:
[
  {
    "topic": "AI in Diagnostics",
    "questions": [
      "How do you feel about AI diagnosing patients?",
      "Has AI changed your workflow?",
      "Do you trust machine predictions?",
      "What cases worked well with AI?"
    ]
  },
  ...
]
Only return the JSON. Do not wrap it in markdown or backticks.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const raw = response.choices[0].message.content.trim();
     // Remove surrounding triple backticks and optional "json" label
    if (raw.startsWith("```")) {
      raw = raw.replace(/```json\s*|```/g, "").trim();
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error("❌ Failed to generate trending topics:", err.message);
    return [];
  }
};

const saveTrendingToFile = async (topics) => {
  const filePath = path.join(__dirname, "../data/trending_topics.json");
  fs.writeFileSync(
    filePath,
    JSON.stringify({ topics, updatedAt: new Date().toISOString() }, null, 2)
  );
};

const loadTrendingFromFile = () => {
  const filePath = path.join(__dirname, "../data/trending_topics.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath);
  return JSON.parse(raw);
};

module.exports = {
  generateTrendingTopicsWithQuestions,
  saveTrendingToFile,
  loadTrendingFromFile,
};
