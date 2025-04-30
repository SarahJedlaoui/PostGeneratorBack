const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const summarizeText = async (text) => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `Summarize this: ${text}` }],
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI error:", error.response?.data || error.message);
    return "Summary unavailable";
  }
};

const chatWithPersona = async (personaType, message) => {
  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful and knowledgeable ${personaType}. Respond directly and naturally without introducing yourself.`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    return chat.choices[0].message.content;
  } catch (error) {
    console.error(
      "❌ OpenAI Chat Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

const extractToneFromInput = async (inputText) => {
  if (!inputText) return "";

  const prompt = `
  You are a helpful assistant that analyzes the tone and style of writing.
  
  Based on the following content, summarize the tone (e.g. humorous, serious, confident), the communication style (e.g. casual, formal, technical), and the perspective (e.g. first person, third person, opinionated, neutral). 
  
  Here is the content:
  """ 
  ${inputText}
  """
  
  Respond in this JSON format:
  {
    "tone": "",
    "style": "",
    "perspective": "",
    "summary": ""
  }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
  
  } catch (error) {
    console.error("Error analyzing tone with OpenAI:", error.message);
    return "Could not analyze tone.";
  }
};

const extractQuestionsFromTopic = async (topic) => {
  const prompt = `
You are a helpful AI assistant helping people write great, insightful social media posts.

Generate 3–4 deep, engaging, and reflective questions that someone could answer if they want to share their thoughts, experience, or opinion about the topic: "${topic}".

The user could be a developer, doctor, designer, or any knowledge professional. Make the questions inclusive, 
interesting, personal, and specific to the topic.

Respond with a JSON array like:
[
  "What drew you to this topic originally?",
  "How has your perspective on this topic evolved?",
  "What common misconceptions do you see around it?",
  "What advice or lessons would you share with others?"
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    const content = response.choices[0].message.content;

    return JSON.parse(content);
  } catch (err) {
    console.error("Question generation failed:", err.message);
    return [
      "What inspired you to talk about this topic?",
      "What’s one thing people misunderstand about it?",
      "How do you personally relate to this topic?",
      "What experience shaped your views on it?"
    ];
  }
};


module.exports = { summarizeText, chatWithPersona, extractToneFromInput , extractQuestionsFromTopic};
