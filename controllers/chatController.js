const { chatWithPersona } = require('../services/openaiService');


exports.personaChat = async (req, res) => {
  const { personaType, message } = req.body;

  try {
    const response = await chatWithPersona(personaType, message);
    res.json({ reply: response });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate reply' });
  }
};