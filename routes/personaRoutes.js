const multer = require("multer");
const express = require("express");
const router = express.Router();
const controller = require("../controllers/personaController");

const upload = multer({ dest: "./temp/" });

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
 *         required: false
 *         type: string
 *         description: User's style as notes or link
 *       - name: file
 *         in: formData
 *         required: false
 *         type: file
 *         description: Optional PDF/image/video file
 *     responses:
 *       201:
 *         description: Session created
 *         schema:
 *           type: object
 *           properties:
 *             sessionId:
 *               type: string
 */
router.post("/", upload.single("file"), controller.createSession);
router.put("/topic", controller.updateTopic);
router.post("/questions", controller.generateQuestions);
router.get("/session/:sessionId", controller.getSession);
router.put("/answers", controller.saveAnswers);

module.exports = router;
