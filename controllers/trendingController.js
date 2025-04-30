// controllers/trendingController.js
const { getTrendingTitles } = require("../services/trendingService");

/** POST /api/trending  – body { topic: "..." } */
const postTrending = async (req, res, next) => {
  try {
    const { topic } = req.body || {};

    if (!topic || typeof topic !== "string") {
      return res
        .status(400)
        .json({ error: "Field 'topic' (string) is required." });
    }

    const titles = await getTrendingTitles(topic);
    res.json({ topic, titles });
  } catch (err) {
    next(err); // forward to your global error middleware
  }
};

module.exports = { postTrending };
