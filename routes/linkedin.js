const express = require("express");
const router = express.Router();
const User = require("../models/User");
const axios = require("axios");
const UserSession = require("../models/UserSession");

router.post("/share", async (req, res) => {
  const { sessionId, postText } = req.body;

  if (!sessionId || !postText) {
    return res.status(400).json({ error: "Missing sessionId or postText" });
  }

  try {
    // 🔍 Step 1: Find the session first
    const session = await UserSession.findOne({ sessionId });
    if (!session || !session.user) {
      return res.status(404).json({ error: "Session or associated user not found" });
    }

    // 🔐 Step 2: Find the user using session.user
    const user = await User.findById(session.user);
    if (!user || !user.accessToken) {
      return res.status(403).json({ error: "User not found or missing access token" });
    }

    // Step 3: Get the LinkedIn profile URN
    const me = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const urn = me.data.id;

    // Step 4: Publish the post
    const response = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: `urn:li:person:${urn}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: postText },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      postUrl: `https://www.linkedin.com/feed/update/${response.data.id}`,
    });
  } catch (err) {
    console.error("LinkedIn Post Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to post on LinkedIn" });
  }
});

module.exports = router;