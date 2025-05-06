const express = require('express');
const router = express.Router();
const { personaChat,handleConversation } = require('../controllers/chatController');


/**
 * @swagger
 * /api/persona/chat:
 *   post:
 *     summary: Chat with an AI-generated customer persona
 *     tags: [Persona Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personaType:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Persona reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 */
router.post('/', personaChat);
router.post("/chat", handleConversation);

module.exports = router;
