const multer = require("multer");
const express = require("express");
const router = express.Router();
const controller = require("../controllers/personaController");

const upload = multer({ dest: "./temp/" });

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Persona session handling
 */

/**
 * @swagger
 * /api/persona:
 *   post:
 *     summary: Create a user session from style input
 *     tags: [Users]
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - name: styleNotes
 *         in: formData
 *         type: string
 *         required: false
 *         description: User's style notes or link
 *       - name: file
 *         in: formData
 *         type: file
 *         required: false
 *         description: Optional file (PDF, image, video)
 *     responses:
 *       201:
 *         description: Session created
 *         schema:
 *           type: object
 *           properties:
 *             sessionId:
 *               type: string
 */
router.post("/session", upload.single("file"), controller.createSession);

/**
 * @swagger
 * /api/persona/topic:
 *   put:
 *     summary: Add topic to user session
 *     tags: [Users]
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: topic
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - sessionId
 *             - topic
 *           properties:
 *             sessionId:
 *               type: string
 *             topic:
 *               type: string
 *     responses:
 *       200:
 *         description: Topic added
 */
router.put("/topic", controller.updateTopic);



/**
 * @swagger
 * /api/persona/questions:
 *   post:
 *     summary: Generate AI questions for the topic
 *     tags: [Users]
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: session
 *         schema:
 *           type: object
 *           required:
 *             - sessionId
 *           properties:
 *             sessionId:
 *               type: string
 *     responses:
 *       200:
 *         description: Questions generated
 */
router.post("/questions", controller.generateQuestions);

/**
 * @swagger
 * /api/persona/session/{sessionId}:
 *   get:
 *     summary: Retrieve session info
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         type: string
 *         description: The session ID
 *     responses:
 *       200:
 *         description: Session details returned
 */
router.get("/session/:sessionId", controller.getSession);

/**
 * @swagger
 * /api/persona/answers:
 *   put:
 *     summary: Save answers to session questions
 *     tags: [Users]
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: answers
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - sessionId
 *             - answers
 *           properties:
 *             sessionId:
 *               type: string
 *             answers:
 *               type: array
 *               items:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answers saved
 */
router.put("/answers", controller.saveAnswers);

/**
 * @swagger
 * /api/persona/generate:
 *   post:
 *     summary: Generate a tailored post using AI
 *     tags: [Users]
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: session
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - sessionId
 *           properties:
 *             sessionId:
 *               type: string
 *     responses:
 *       200:
 *         description: Post generated
 *         schema:
 *           type: object
 *           properties:
 *             post:
 *               type: string
 */
router.post("/generate", controller.generatePost);

/**
 * @swagger
 * /api/persona/fact-check:
 *   post:
 *     summary: Fact-check the user's generated post
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Returns fact-check results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 highlights:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       claim:
 *                         type: string
 *                       verdict:
 *                         type: string
 *                       explanation:
 *                         type: string
 *                       source:
 *                         type: object
 *                         properties:
 *                           title:
 *                             type: string
 *                           url:
 *                             type: string
 *       400:
 *         description: Missing sessionId
 *       500:
 *         description: Failed to run fact check
 */
router.post("/fact-check", controller.factCheck);



//prototype2

router.post("/questionsV2", controller.generateQuestions2);

router.put("/question", controller.updateQuestion);

router.post("/insights", controller.generateInsights);
router.get("/insights/:sessionId", controller.getInsights);


//prototype3

router.get("/trending", controller.getTrendingTopicsWithQuestions);
router.post("/edit-post", controller.editPost);
router.post("/drafts", controller.getPostDrafts);
router.post("/get-latest-post", controller.getGeneratedPost);

//prototype3V2

router.post("/deep-questions", controller.generateDeepQuestions);
router.put("/followup", controller.storeFollowUpQuestion);
router.post("/rate-post", controller.ratePost);
router.put("/save-post", controller.saveEditedPost);
router.post("/save-draft", controller.saveDraft);


router.post("/", controller.createSession2);
module.exports = router;
