const { chatWithPersona } = require('../services/openaiService');
const { continueConversation } = require("../services/chatService");

exports.personaChat = async (req, res) => {
  const { personaType, message } = req.body;

  try {
    const response = await chatWithPersona(personaType, message);
    res.json({ reply: response });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate reply' });
  }
};



exports.handleConversation = async (req, res) => {
  const { sessionId, userMessage } = req.body;
  if (!sessionId || !userMessage) {
    return res.status(400).json({ message: "Missing sessionId or userMessage" });
  }

  try {
    const { aiResponse, conversation } = await continueConversation(
      sessionId,
      userMessage
    );
    res.json({ aiResponse, conversation });
  } catch (err) {
    console.error("AI Conversation error:", err);
    res.status(500).json({ message: "Failed to process conversation" });
  }
};
