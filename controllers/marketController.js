const { fetchTrendingVideos } = require('../services/youtubeService');
const { summarizeText } = require('../services/openaiService');
const { getTranscriptFromYouTube } = require('../services/transcriptService');
require('dotenv').config();

exports.getTrending = async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic) {
      return res.status(400).json({ error: 'Missing topic query parameter' });
    }

    const videos = await fetchTrendingVideos(topic, 20);

    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(3); // Control concurrency

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Push headers immediately

    let sentCount = 0;

    const processingPromises = videos.map(video => limit(async () => {
      if (!video.videoId) {
        console.warn('⚠️ Missing videoId, skipping.');
        return;
      }

      try {
        const transcriptResult = await getTranscriptFromYouTube(video.videoId, video.description);
        const summary = await summarizeText(transcriptResult.text);

        const cleanSummary = (summary || '').toLowerCase();
        if (
          cleanSummary.includes('no information provided') ||
          cleanSummary.includes('no description available') ||
          cleanSummary.includes('no details are provided') ||
          cleanSummary.includes('summary: no information provided') ||
          cleanSummary.includes('there is no information') ||
          cleanSummary.trim().length < 30
        ) {
          console.warn('⚠️ Skipped low-quality summary');
          return;
        }

        const data = {
          platform: 'YouTube',
          title: video.title || 'Untitled',
          summary,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          isShort: video.isShort || false,
          source: transcriptResult.source,
        };

        res.write(`data: ${JSON.stringify(data)}\n\n`);
        sentCount++;

      } catch (err) {
        console.warn('⚠️ Error while processing one video:', err.message || err);
      }
    }));

    // When all videos are processed, close the connection
    await Promise.allSettled(processingPromises);

    res.write('event: done\n');
    res.write('data: All videos processed\n\n');
    res.end();

  } catch (err) {
    console.error('❌ Error in /trending route:', err.message);
    res.status(500).json({ error: 'Failed to get trends', details: err.message });
  }
};
