const OpenAI = require("openai");
const Session = require("../models/UserSession");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function continueConversation(sessionId, userMessage) {
  const session = await Session.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  // Initialize conversation array if first time
  const convo = session.conversation || [];

  // Add user message
  convo.push({ role: "user", content: userMessage });

  // Call OpenAI to get the AI’s next message (one follow-up question)
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a friendly coach who asks one follow-up question at a time, helping the user build out their narrative in depth."
      },
      ...convo
    ],
    max_tokens: 250,
    temperature: 0.7,
  });

  const aiMsg = completion.choices[0].message;
  convo.push(aiMsg);

  // Persist
  session.conversation = convo;
  await session.save();

  // Return only the new AI message and the last few turns
  return {
    aiResponse: aiMsg.content,
    conversation: convo
  };
}

module.exports = { continueConversation };
