const { scrapeInstagramByHashtag } = require("../services/instagramScraper");

exports.getInstagramPosts = async (req, res) => {
  try {
    const { domain } = req.params;
    const posts = await scrapeInstagramByHashtag(domain);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
