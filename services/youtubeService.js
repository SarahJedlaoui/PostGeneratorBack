const axios = require('axios');
require('dotenv').config();

const fetchTrendingVideos = async (topic) => {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Step 1: Search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search`;
    const searchParams = {
      q: topic,
      part: 'snippet',
      type: 'video',
      maxResults: 20, // fetch more to allow cleaning
      order: 'viewCount',
      publishedAfter: thirtyDaysAgo,
      key: apiKey,
    };

    const searchResponse = await axios.get(searchUrl, { params: searchParams });
    const videoIds = searchResponse.data.items.map(video => video.id.videoId).filter(Boolean);

    if (videoIds.length === 0) {
      console.warn('⚠️ No videos found');
      return [];
    }

    // Step 2: Fetch video details (durations)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos`;
    const videosParams = {
      part: 'contentDetails,snippet',
      id: videoIds.join(','),
      key: apiKey,
    };

    const videosResponse = await axios.get(videosUrl, { params: videosParams });

    // Step 3: Process videos
    const videos = videosResponse.data.items.map(video => {
      const durationISO = video.contentDetails.duration; // example: PT45S
      const seconds = parseISODuration(durationISO);

      return {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description || 'No description available.',
        isShort: seconds <= 60,
        seconds, // keep it to filter later
      };
    });

    // Step 4: Filter only good ones (15s - 60s)
    const filtered = videos.filter(v => v.seconds >= 15 && v.seconds <= 60);

    return filtered;
  } catch (error) {
    console.error('❌ YouTube API error:', error.response?.data || error.message);
    throw error;
  }
};

// Small helper function to parse ISO 8601 duration (PT1M5S ➔ 65 seconds)
function parseISODuration(isoDuration) {
  const regex = /PT(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);

  const minutes = parseInt(matches[1] || '0', 10);
  const seconds = parseInt(matches[2] || '0', 10);

  return (minutes * 60) + seconds;
}

module.exports = { fetchTrendingVideos };
