const Parser = require("rss-parser");
const { loadDomainConfig } = require("../utils/configLoader");

const parser = new Parser();

async function fetchRSSFeeds(domain) {
  const config = loadDomainConfig(domain);
  const feedUrls = config.feeds?.rss || [];

  const allPosts = [];
  const failedFeeds = [];
  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);

      const items = feed.items.map((item) => ({
        title: item.title,
        link: item.link,
        description: item.contentSnippet || item.content || "",
        publishedDate: item.pubDate,
        source: feed.title,
        domain,
        sourceType: "rss",
      }));

      allPosts.push(...items);
    } catch (err) {
      console.error(`Failed to parse RSS feed: ${url}`, err.message);
      failedFeeds.push({ url, error: err.message });
    }
  }

  return { posts: allPosts, failedFeeds };
}

module.exports = { fetchRSSFeeds };
