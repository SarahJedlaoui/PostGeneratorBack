const express = require("express");
const router = express.Router();
const { getAllTopics } = require("../controllers/topicControllerV3");

/**
 * @swagger
 * /api/topicsV3:
 *   get:
 *     summary: Get all generated trending topics with questions and insights
 *     tags:
 *       - Topics
 *     responses:
 *       200:
 *         description: A list of topic objects with nested insights
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   topic:
 *                     type: string
 *                     example: "AI in Healthcare"
 *                   insights:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                         quickTake:
 *                           type: string
 *                         expertQuote:
 *                           type: object
 *                           properties:
 *                             quote:
 *                               type: string
 *                             author:
 *                               type: string
 *                             title:
 *                               type: string
 *                         fastFacts:
 *                           type: array
 *                           items:
 *                             type: string
 *                         keyIdeas:
 *                           type: array
 *                           items:
 *                             type: string
 *                         followUpQuestion:
 *                           type: string
 */
router.get("/topicsV3", getAllTopics);

/**
 * @swagger
 * /api/topicsV3/refresh-now:
 *   post:
 *     summary: Manually generate and store new trending topics
 *     tags:
 *       - Topics
 *     responses:
 *       200:
 *         description: Topics successfully generated and saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Topics generated manually!
 *       500:
 *         description: Server error during generation
 */
router.post("/topicsV3/refresh-now", async (req, res) => {
  const { autoGenerateAndStoreTopics } = require("../services/autoGenerateService");
  try {
    await autoGenerateAndStoreTopics();
    res.json({ message: "Topics generated manually!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
