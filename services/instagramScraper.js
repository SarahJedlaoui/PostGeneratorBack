const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { loadDomainConfig } = require("../utils/configLoader");
require("dotenv").config();

puppeteer.use(StealthPlugin());

async function scrapeInstagramByHashtag(domain) {
  const config = loadDomainConfig(domain);
  const hashtags = config.scraping?.hashtags || [];

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  await page.setCookie({
    name: "sessionid",
    value: process.env.IG_SESSION_ID,
    domain: ".instagram.com",
    path: "/",
    httpOnly: true,
    secure: true,
  });

  const allPosts = [];

  for (const tag of hashtags) {
    const url = `https://www.instagram.com/explore/tags/${tag}/`;
    console.log(`Scraping tag: #${tag}`);

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

      // Scroll to load content
      await autoScroll(page);

      // Wait for post links to load
      await page.waitForSelector("a[href^='/p/']", { timeout: 15000 });

      const postLinks = await page.$$eval("a[href^='/p/']", (anchors) =>
        anchors
          .slice(0, 9)
          .map((a) => "https://www.instagram.com" + a.getAttribute("href"))
      );

      if (postLinks.length === 0) {
        console.warn(`⚠️ Skipping #${tag} — no posts found.`);
        continue;
      }

      for (const link of postLinks) {
        try {
          await page.goto(link, { waitUntil: "networkidle2", timeout: 0 });
          await page.waitForSelector("time", { timeout: 5000 });

          //  Add this to inspect the page structure
          const html = await page.content();
          require("fs").writeFileSync("debug-post.html", html);

          const post = await page.evaluate(() => {
            const caption =
              document
                .querySelector('meta[property="og:description"]')
                ?.getAttribute("content") || "";
            const time =
              document.querySelector("time")?.getAttribute("datetime") || "";
            const hashtags = caption.match(/#[\w]+/g) || [];

            return {
              caption,
              hashtags,
              timestamp: time,
              postUrl: window.location.href,
              sourcePlatform: "instagram",
            };
          });
          allPosts.push(post);
          await new Promise((res) => setTimeout(res, 1500));
        } catch (postErr) {
          console.error(`⚠️ Failed to scrape post: ${link}`, postErr.message);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Failed to load tag #${tag}:`, err.message);
      continue;
    }

    await new Promise((res) => setTimeout(res, 5000));
  }

  await browser.close();
  return allPosts;
}

// Function to auto-scroll the page
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

module.exports = { scrapeInstagramByHashtag };
