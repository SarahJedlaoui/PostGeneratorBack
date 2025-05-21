const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authController = require("../controllers/authController");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Missing fields" });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(409).json({ error: "Email already exists" });

  const user = new User({ email, password, name, authType: "email" });
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

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

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("token", token, { httpOnly: true }).json({ success: true, userId: user._id });
});




router.get("/linkedin/callback", authController.linkedinCallback);

module.exports = router;
