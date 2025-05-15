const express = require("express");
const router = express.Router();
const { getRSSFeeds } = require("../controllers/rssController");

/**
 * @swagger
 * /api/rss/{domain}:
 *   get:
 *     summary: Get parsed RSS feed posts for a specific domain
 *     tags: [RSS]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Domain config name (e.g. travel-advisors)
 *     responses:
 *       200:
 *         description: List of parsed RSS feed items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   link:
 *                     type: string
 *                   description:
 *                     type: string
 *                   publishedDate:
 *                     type: string
 *                   source:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.get("/:domain", getRSSFeeds);

module.exports = router;
