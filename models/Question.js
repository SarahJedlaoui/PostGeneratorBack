const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: "Topic", required: true },
  domain: { type: String, required: true },
  topic: String,
  questions: [String],
  hashtags: [String],
  tone: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Question", questionSchema);
