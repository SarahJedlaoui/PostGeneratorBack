const mongoose = require("mongoose");

const InsightSchema = new mongoose.Schema({
  question: String,
  quickTake: String,
  expertQuote: {
    quote: String,
    author: String,
    title: String,
  },
  fastFacts: [String],
  keyIdeas: [String],
  followUpQuestion: String,
});

const TopicSchema = new mongoose.Schema({
  topic: String,
  insights: [InsightSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '3d' // Auto-deletes after 3 days if desired
  },
});

module.exports = mongoose.model("Topic", TopicSchema);
