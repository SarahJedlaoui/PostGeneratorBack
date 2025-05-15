const axios = require("axios");

async function extractTopicsFromCaptions(captionsArray) {
  try {
    const res = await axios.post("http://localhost:5001/extract", {
      texts: captionsArray,
    });
    return res.data; // Array of { original: "...", keywords: [...] }
  } catch (err) {
    console.error("NLP extraction failed:", err.message);
    return [];
  }
}

module.exports = { extractTopicsFromCaptions };
