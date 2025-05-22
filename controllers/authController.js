const axios = require("axios");
const User = require("../models/User"); // Your Mongoose model
const jwt = require("jsonwebtoken");

exports.linkedinCallback = async (req, res) => {
  const code = req.query.code;

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // Get profile info via OIDC
    const userInfoRes = await axios.get(
      "https://api.linkedin.com/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { sub: linkedinId, name, email, picture } = userInfoRes.data;

    // Upsert user
    const user = await User.findOneAndUpdate(
      { linkedinId },
      { linkedinId, name, email, picture, accessToken, authType: "linkedin" },
      { upsert: true, new: true }
    );
    //  Generate internal JWT for your app
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    //  Redirect to frontend with user ID or token
    return res.redirect(`${process.env.FRONTEND_URL}/topics?userId=${user._id}&token=${jwtToken}`);
  } catch (err) {
    console.error("LinkedIn OAuth error:", err.message);
    return res.status(500).send("OAuth failed");
  }
};
