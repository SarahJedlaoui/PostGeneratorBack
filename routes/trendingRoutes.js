// routes/trendingRoutes.js
const express = require("express");
const router = express.Router();
const { postTrending } = require("../controllers/trendingController");

/**
 * @swagger
 * /api/trending:
 *   post:
 *     summary: Get trending discussion titles for a topic
 *     tags: [Trending]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic the user is interested in.
 *                 example: UX & AI Evolution
 *     responses:
 *       200:
 *         description: Array of short, catchy discussion titles.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topic:
 *                   type: string
 *                 titles:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request – topic missing.
 */
router.post("/", postTrending); // POST /api/trending { topic: "..." }

module.exports = router;
