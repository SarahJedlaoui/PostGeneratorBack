// controllers/topicController.js
const { extractTopicsFromCaptions } = require("../services/nlp");

async function processTopics(req, res) {
  const { captions } = req.body; // Assume an array of captions from scraper

  if (!captions || !Array.isArray(captions)) {
    return res.status(400).json({ error: "Invalid captions array" });
  }

  const topics = await extractTopicsFromCaptions(captions);
  return res.json({ topics });
}

module.exports = { processTopics };
