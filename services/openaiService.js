const OpenAI = require("openai");
const UserSession = require("../models/UserSession");

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

const generatePostFromSession = async (sessionId) => {
  const session = await UserSession.findOne({ sessionId });
  if (!session) throw new Error("Session not found");

  const { toneSummary, topic, answers, questions } = session;

  const tone = toneSummary?.tone || "neutral";
  const style = toneSummary?.style || "neutral";

  const prompt = `
You are an expert assistant that crafts high-quality social media posts for professionals.
Your job is to write a short, authentic post (max 100 words) based on the topic and user input.

Tone: ${tone}
Style: ${style}
Topic: ${topic}

Here are the user's answers to some topic-related questions:
${questions?.map((q, i) => `Q: ${q}\nA: ${answers?.[i] || ""}`).join("\n")}

Your responsibilities:
- Analyze the user’s responses.
- If any information is inaccurate, clarify or correct it.
- Back up your post with facts or common knowledge.
- Keep it helpful, trustworthy, and user-aligned.
- End the post with a reflective question or engagement hook.
- No hashtags unless absolutely essential.

Output just the final crafted post.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You write social media posts that sound natural, insightful, and accurate. You verify user input before writing."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 300,
    temperature: 0.8
  });

  const postText = completion.choices[0].message.content.trim();

  session.generatedPost = postText;
  await session.save();

  return postText;
};

const runFactCheck = async (postText) => {
  const prompt = `
You are an AI fact-checker.
Analyze the following social media post and return a JSON object like this:
{
  "highlights": [
    {
      "claim": "Text being checked",
      "verdict": "confirmed" | "partially confirmed" | "incorrect",
      "explanation": "Short justification",
      "source": {
        "title": "Source name",
        "url": "https://example.com"
      }
    },
    ...
  ],
  "sources": [
    {
      "title": "Source name",
      "snippet": "Short description",
      "url": "https://example.com"
    },
    ...
  ]
}

Post:
"""${postText}"""
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You return structured JSON only." },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 800
  });

  const raw = completion.choices[0].message.content.trim();

  try {
    const parsed = JSON.parse(raw);
    return {
      highlights: parsed.highlights || [],
      sources: parsed.sources || [],
    };
  } catch (err) {
    console.error("❌ Failed to parse AI response as JSON:", raw);
    throw new Error("AI response was not valid JSON.");
  }
};

module.exports = { summarizeText, chatWithPersona, extractToneFromInput , extractQuestionsFromTopic, generatePostFromSession, runFactCheck};
