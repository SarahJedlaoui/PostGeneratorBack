const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  linkedinId: String,
  name: String,
  email: String,
  picture: String,
  accessToken: String,
  linkedinPersonURN: { type: String },
});

module.exports = mongoose.model("User", userSchema);
