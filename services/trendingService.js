// services/trendingService.js
const OpenAI = require("openai");

/** Initialise once and reuse */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Return an array of ↓6 catchy titles related to the supplied topic.
 * @param {string} topic
 * @param {number} n  – how many titles to return (default 6)
 */
const getTrendingTitles = async (topic, n = 6) => {
  const prompt = `
You are an industry trend scout. Provide ${n} short, punchy
discussion titles (max 8 words each) about "${topic}".
Return each title on its own line – no numbers or bullets.
  `.trim();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = completion.choices[0].message.content;

    /**  Clean each line, remove empty ones, and return an array */
    return raw
      .split("\n")
      .map((t) => t.replace(/^[\s\-\*\d\.]+/, "").trim())
      .filter(Boolean)
      .slice(0, n);
  } catch (err) {
    console.error("❌ OpenAI error:", err.response?.data || err.message);
    throw err;
  }
};

module.exports = { getTrendingTitles };
