const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema({
  domain: { type: String, required: true },
  hashtags: [String],
  rssFeeds: [String],
  tone: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Source", sourceSchema);
