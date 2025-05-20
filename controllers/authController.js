const axios = require("axios");
const User = require("../models/User");

exports.linkedinCallback = async (req, res) => {
  const code = req.query.code;

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post("https://www.linkedin.com/oauth/v2/accessToken", null, {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Fetch profile from OpenID Connect (basic data)
    const userInfoRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const { sub: linkedinId, name, email, picture } = userInfoRes.data;

    // 3. Fetch full LinkedIn profile (to get the person URN)
    const meRes = await axios.get("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const linkedinPersonURN = `urn:li:person:${meRes.data.id}`;

    // 4. Save or update user in DB
    const user = await User.findOneAndUpdate(
      { linkedinId },
      {
        linkedinId,
        name,
        email,
        picture,
        accessToken,
        linkedinPersonURN, // required for posting later
      },
      { upsert: true, new: true }
    );

    // 5. Redirect to frontend with user._id
    return res.redirect(`${process.env.FRONTEND_URL}/topics?user=${user._id}`);
  } catch (err) {
    console.error("LinkedIn OAuth error:", err?.response?.data || err.message);
    return res.status(500).send("OAuth failed");
  }
};
