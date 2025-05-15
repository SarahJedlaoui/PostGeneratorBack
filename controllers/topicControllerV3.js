const Topic = require("../models/TopicV3");

exports.getAllTopics = async (req, res) => {
  try {
    const topics = await Topic.find().sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    console.error("Failed to fetch topics:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
