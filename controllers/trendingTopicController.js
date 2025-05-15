const {
    generateTrendingTopicsWithQuestions,
    saveTrendingToFile,
    loadTrendingFromFile,
  } = require("../services/trendingTopicService");
  
  

  exports.refreshTrendingTopics = async (req, res) => {
    try {
      const topics = await generateTrendingTopicsWithQuestions();
      await saveTrendingToFile(topics);
      res.status(200).json({ message: "Topics refreshed", topics });
    } catch (err) {
      res.status(500).json({ message: "Error generating topics", error: err.message });
    }
  };
  
  exports.getTrendingTopics = async (req, res) => {
    try {
      const fileData = loadTrendingFromFile();
      if (!fileData) {
        return res.status(404).json({ message: "No trending topics found" });
      }
      res.status(200).json(fileData);
    } catch (err) {
      res.status(500).json({ message: "Error loading topics", error: err.message });
    }
  };
  