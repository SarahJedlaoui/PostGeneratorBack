const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  linkedinId: { type: String },
  name: { type: String },
  email: { type: String, unique: true, required: true },
  password: { type: String }, // optional if logged in via LinkedIn
  picture: { type: String },
  authType: { type: String, enum: ["email", "linkedin"], required: true },
  accessToken: { type: String },
  resetToken:  { type: String },
  resetTokenExpiry: { type: String },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
