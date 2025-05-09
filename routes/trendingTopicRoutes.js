// routes/trendingRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/trendingTopicController");

router.get("/trending", controller.getTrendingTopics);
router.post("/trending/refresh", controller.refreshTrendingTopics);

module.exports = router;
