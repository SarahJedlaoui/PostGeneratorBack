const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authController = require("../controllers/authController");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Missing fields" });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(409).json({ error: "Email already exists" });

  const user = new User({ email, password, name, authType: "email" });
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.status(201).json({
    success: true,
    userId: user._id,
    token, // send the JWT to frontend
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !user.password)
    return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  res
    .cookie("token", token, { httpOnly: true })
    .json({ success: true, userId: user._id , token  });
});


//reset password request
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 1000 * 60 * 15; // 15 min

  user.resetToken = token;
  user.resetTokenExpiry = expiry;
  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  // Send email (simple setup using Gmail)
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  await transporter.sendMail({
    to: user.email,
    subject: "Reset your password",
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 15 minutes.</p>`,
  });

  res.json({ success: true, message: "Reset link sent" });
});
// Resets the password using token.
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ error: "Invalid or expired token" });

  user.password = await bcrypt.hash(password, 10);
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ success: true, message: "Password updated" });
});

router.get("/linkedin/callback", authController.linkedinCallback);

module.exports = router;
