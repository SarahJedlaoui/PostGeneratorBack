const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  styleNotes: String,
  fileName: String,
  toneSummary: { type: Object },
  topic: String,
  chosenQuestion: String,
  questions: [String],
  answers: [String],
  generatedPost: { type: String },
  insights: {
    quickTake: String,
    expertQuote: {
      quote: String,
      author: String,
      title: String
    },
    fastFacts: [String],
    keyIdeas: [String]
  },
  factCheck: {
    highlights: [Object],
    sources: [Object],
    facts: [Object]
  },
  postDrafts: [{ 
  content: String, 
  editedAt: { type: Date, default: Date.now } 
}]

});


module.exports = mongoose.model("UserSession", userSessionSchema);
