// routes/topicRoutes.js
const express = require("express");
const { processTopics } = require("../controllers/topicController");

const router = express.Router();
router.post("/extract", processTopics);

module.exports = router;
