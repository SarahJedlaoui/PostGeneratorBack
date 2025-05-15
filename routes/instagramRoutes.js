const express = require("express");
const router = express.Router();
const { getInstagramPosts } = require("../controllers/instagramController");

/**
 * @swagger
 * /api/instagram/{domain}:
 *   get:
 *     summary: Scrape Instagram by hashtags for a given domain
 *     tags: [Instagram]
 *     parameters:
 *       - in: path
 *         name: domain
 *         schema:
 *           type: string
 *         required: true
 *         description: Domain config (e.g., travel-advisors)
 *     responses:
 *       200:
 *         description: List of Instagram post metadata
 *       500:
 *         description: Server error
 */
router.get("/:domain", getInstagramPosts);

module.exports = router;
