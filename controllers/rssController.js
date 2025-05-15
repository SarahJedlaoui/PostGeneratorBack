const { fetchRSSFeeds } = require("../services/rssFeedService");

exports.getRSSFeeds = async (req, res) => {
  try {
    const { domain } = req.params;
    const { posts } = await fetchRSSFeeds(domain);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
