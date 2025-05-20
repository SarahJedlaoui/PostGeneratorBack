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
    const userSession = await UserSession.findOne({ sessionId }).populate("user");
    if (!userSession || !userSession.user) {
      return res.status(404).json({ error: "User not found for this session" });
    }

    const { accessToken, personURN } = userSession.user;

    const result = await axios.post(
      "https://api.linkedin.com/v2/ugcPosts",
      {
        author: personURN,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: postText },
            shareMediaCategory: "NONE"
          }
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
          "Content-Type": "application/json"
        }
      }
    );

    return res.status(200).json({ success: true, data: result.data });
  } catch (err) {
    console.error("LinkedIn Post Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to publish on LinkedIn" });
  }
});

module.exports = router;
