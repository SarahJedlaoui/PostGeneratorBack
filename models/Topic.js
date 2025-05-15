const mongoose = require("mongoose");

const topicSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  topic: { type: String, required: true },
  keywords: [String],
  examplePost: String,
  sourcePlatform: String,
  sourceUrl: String,
  engagementScore: Number,
  metrics: {
    frequency: Number,
    likes: Number,
    comments: Number,
    recencyDays: Number,
    velocity: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Topic", topicSchema);
