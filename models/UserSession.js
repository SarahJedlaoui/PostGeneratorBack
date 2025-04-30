const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  styleNotes: String,
  fileName: String,
  toneSummary: { type: Object },
  topic: String,
  questions: [String], 
  answers: [String]   
});

module.exports = mongoose.model("UserSession", userSessionSchema);
