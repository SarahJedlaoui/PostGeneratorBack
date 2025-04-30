const express = require('express');
const router = express.Router();
const { getTrending } = require('../controllers/marketController');

/**
 * @swagger
 * /api/market/trending:
 *   get:
 *     summary: Get trending YouTube videos with summaries from audio transcripts
 *     tags: [Market Intelligence]
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *         required: true
 *         description: Topic to search for trending content
 *     responses:
 *       200:
 *         description: List of summarized trending videos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   platform:
 *                     type: string
 *                     example: "YouTube"
 *                   title:
 *                     type: string
 *                     example: "How to Stay Fit at Home"
 *                   summary:
 *                     type: string
 *                     example: "Fitness tips and strategies for home workouts."
 *                   url:
 *                     type: string
 *                     example: "https://www.youtube.com/watch?v=abc123"
 *                   isShort:
 *                     type: boolean
 *                   source:
 *                     type: string
 */
router.get('/trending', getTrending);

module.exports = router;
