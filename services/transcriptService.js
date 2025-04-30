const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp';

const AUDIO_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR);

const getTranscriptFromYouTube = async (videoId, fallbackDescription) => {
  const tempFilePath = path.join(AUDIO_DIR, `${videoId}-${Date.now()}.mp3`);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    console.log(`🎧 Downloading audio from ${videoUrl}`);
    const ytCommand = `"${YTDLP_PATH}" -f bestaudio[ext=m4a]/bestaudio --max-filesize 10M -o "${tempFilePath}" "${videoUrl}"`;
    execSync(ytCommand, { stdio: 'ignore' });

    console.log(`🔁 Uploading to Deepgram...`);
    const response = await axios({
      method: 'post',
      url: 'https://api.deepgram.com/v1/listen',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'audio/mp3',
      },
      data: fs.createReadStream(tempFilePath),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const transcript = response.data.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    return {
      text: transcript || fallbackDescription || 'No description available.',
      source: transcript ? 'Deepgram Transcript (downloaded audio)' : 'Fallback: snippet.description',
    };

  } catch (error) {
    console.warn('⚠️ Deepgram/ytdlp error:', error.message || error);
    return {
      text: fallbackDescription || 'No description available.',
      source: 'Fallback: snippet.description',
    };
  } finally {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
};

module.exports = { getTranscriptFromYouTube };
