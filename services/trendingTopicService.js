const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

/** Initialise once and reuse */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const generateTrendingTopicsWithQuestions = async () => {
  const prompt = `
You are a tech-savvy social media analyst.
Find the 10 most trending topics right now in the tech and AI space based on what people are discussing on Instagram, LinkedIn, TikTok, and news headlines.

For each topic, write:
1. A short 4-word-or-less title.
2. 4 simple, reflective or opinion-based questions about the topic.

Format your response as JSON like this:
[
  {
    "topic": "AI in Healthcare",
    "questions": [
      "How is AI helping doctors?",
      "What are the risks involved?",
      "Can AI replace radiologists?",
      "Do patients trust machines?"
    ]
  },
  ...
]
Only return the JSON.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const raw = response.choices[0].message.content.trim();
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
