const fs = require("fs");
const path = require("path");

function loadDomainConfig(domain) {
  const configPath = path.join(__dirname, "..", "config", `${domain}.json`);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file for domain "${domain}" not found.`);
  }

  try {
    const rawData = fs.readFileSync(configPath);
    const config = JSON.parse(rawData);

    // Optional: basic validation
    if (!config.domain || !config.scraping || !config.prompt) {
      throw new Error("Invalid config format. Missing required fields.");
    }

    return config;
  } catch (err) {
    console.error(`Error loading config for domain "${domain}":`, err.message);
    throw err;
  }
}

module.exports = { loadDomainConfig };
