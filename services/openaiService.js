const OpenAI = require("openai");
const UserSession = require("../models/UserSession");
const { jsonrepair } = require("jsonrepair");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const summarizeText = async (text) => {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
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
      model: "gpt-4o",
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
      model: "gpt-4o",
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
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    let content = response.choices[0].message.content.trim();

    // ✅ Strip markdown code wrapper if present
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

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
Your job is to write a short, authentic post (max 100 words) based on the topic and user input powered by facts.

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
- Use hashtags.

Output just the final crafted post.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
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

  let postText = completion.choices[0].message.content.trim();

  // ✅ Strip markdown-style code block wrapper if present
  if (postText.startsWith("```")) {
    postText = postText.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
  }

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
    }
  ],
  "sources": [
    {
      "title": "Source name",
      "snippet": "Short description",
      "url": "https://example.com"
    }
  ],
  "facts": [
    {
      "fact": "Concise, standalone factual statement found in or implied by the post."
    }
  ]
}

📌 A 'fact' is an objective, verifiable statement — for example:
✅ "The global edtech market is projected to reach $404B by 2025."  
✅ "AI can be used to create personalized learning experiences for students."

Do not return opinions, summaries, or speculation in the 'facts' array. Stick to concise, sourced, factual claims.

Post:
"""${postText}"""
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Return valid JSON only. Do not include markdown or code block formatting." },
      { role: "user", content: prompt }
    ],
    temperature: 0.5,
    max_tokens: 500,
  });

  let raw = completion.choices[0].message.content.trim();

  // ✅ Strip markdown-style code block wrapper if present
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
  }

  try {
    const repaired = jsonrepair(raw);
    const parsed = JSON.parse(repaired);
    return {
      highlights: parsed.highlights || [],
      sources: parsed.sources || [],
      facts: parsed.facts || [],
    };
  } catch (err) {
    console.error("❌ Failed to parse AI response as JSON:", raw);
    throw new Error("AI response was not valid JSON.");
  }
};



//prototype2

const extractQuestionsFromTopicV2 = async (topic, question) => {
  const prompt = `
You are a helpful AI assistant helping people write great, insightful social media posts.

Generate 3–4 deep, engaging, and reflective questions that someone could answer if they want to share their thoughts, experience, or opinion about the topic: "${topic}" specifically to understand this question : "${question}".

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
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5
    });

    let content = response.choices[0].message.content.trim();

    // Strip markdown-style code block if present
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

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


const generateQuickTake = async (question) => {
  const prompt = `
You are a helpful AI assistant that provides short, insightful context for a social media prompt.

The user is about to answer the following question in a post:
"${question}"

Write 1-2 concise sentences that emotionally frame the topic in an engaging and thoughtful way. Keep it short, human, and warm — no fluff, no technical jargon. The tone is professional and friendly.
Respond with a plain string, no JSON, no formatting.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    let content = response.choices[0].message.content.trim();

    // Remove accidental markdown code block wrapping (e.g. ``` or ```text)
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

    return content;
  } catch (err) {
    console.error("QuickTake generation failed:", err.message);
    return "People are rethinking how they design and communicate. The shift is from usability alone to emotional impact. Your thoughts on this topic can help inspire that shift.";
  }
};


const getExpertQuote = async (question) => {
  const prompt = `
You are an AI that surfaces quotes from fictional or anonymized experts to inspire social media posts.

Given this question: "${question}", create a short quote (1–2 sentences) from a made-up expert that sounds credible and reflective.

Then give a name and title for that expert (e.g., Jessica Lin, Product Designer @ Figma).

Respond in JSON format:
{
  "quote": "Your quote here",
  "author": "Jessica Lin",
  "title": "Product Designer @ Figma"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let content = response.choices[0].message.content.trim();

    // Remove surrounding markdown block if present
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

    return JSON.parse(content);
  } catch (err) {
    console.error("Expert quote generation failed:", err.message);
    return {
      quote: "This shift isn't about technology — it's about empathy and impact.",
      author: "Jamie Rivera",
      title: "Design Lead @ HumanWorks",
    };
  }
};


const generateFastFacts = async (question) => {
  const prompt = `
  You are a helpful assistant that gives concise, punchy fast facts to support a social media post.

  Only return a valid JSON array (nothing else). Do NOT add explanations.

  Give exactly 3 short facts or stats (no more, no less) that relate to this question:
  "${question}"

  The format must be:
  [
    "📊 85% of users engage with posts that start with a question.",
    "💡 Visuals increase engagement by 67%.",
    "🧠 LinkedIn posts with personal stories get 3x more responses."
  ]
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    let raw = completion.choices[0].message.content.trim();
    console.log("AI Raw Response:", raw);

    // Remove markdown-style code block if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Not an array");

    return parsed;
  } catch (err) {
    console.error("generateFastFacts failed to parse:", err.message);
    return ["📌 Fast Fact 1", "📌 Fast Fact 2", "📌 Fast Fact 3"];
  }
};


//prototype3

const getTrendingTopics = async () => {
  const prompt = `
You are an AI that helps identify trending social media discussion topics.

Give 5 short and popular content topics that are currently trending on social media platforms like Instagram, LinkedIn, TikTok, and Twitter. These should be the kind of topics professionals, creators, and thought leaders are discussing in 2024.

Return ONLY a JSON array of strings like:
[
  "AI in design",
  "Remote work burnout",
  "Instagram vs LinkedIn for creators",
  "Sustainable tech habits",
  "Rise of personal branding"
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let raw = completion.choices[0].message.content.trim();

    // Remove markdown-style code block if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

    const topics = JSON.parse(raw);

    if (!Array.isArray(topics)) throw new Error("OpenAI did not return an array");

    return topics;
  } catch (err) {
    console.error("❌ Failed to fetch trending topics from OpenAI:", err.message);
    return [
      "AI in design",
      "Remote work burnout",
      "Instagram vs LinkedIn for creators",
      "Sustainable tech habits",
      "Rise of personal branding"
    ]; // fallback
  }
};


const generateKeyIdeas = async (question) => {
  const prompt = `
You're an expert content strategist. Given this question:

"${question}"

Generate 3 short, clear learning objectives or key ideas someone might reflect on when answering this question.

Respond in this JSON format:
[
  "First idea here",
  "Second key idea",
  "Third reflection point"
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    let content = response.choices[0].message.content.trim();

    // Remove markdown-style code block if present
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

    return JSON.parse(content);
  } catch (err) {
    console.error("Key idea generation failed:", err.message);
    return ["Idea 1", "Idea 2", "Idea 3"];
  }
};



const runPostEdit = async (originalPost, instruction) => {
  const prompt = `
You are a professional social media assistant helping users refine their content.

Instruction: "${instruction}"

Here is the original post:
"""
${originalPost}
"""

Your responsibilities:
- Back up your post with facts or common knowledge.
- Keep it helpful, trustworthy, and user-aligned.
- End the post with a reflective question or engagement hook.
- Use hashtags.

Return your response as a JSON object like this:
{
  "post": "your revised post here",
  "changes": "summary of the modifications"
}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  let content = completion.choices[0].message.content.trim();

  // Remove markdown-style code block if present
  if (content.startsWith("```")) {
    content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
  }
 try {
    const parsed = JSON.parse(content);
    return {
      post: parsed.post || originalPost,
      changes: parsed.changes || "No changes summarized.",
    };
  } catch (err) {
    console.error("Failed to parse JSON from OpenAI:", content);
    return {
      post: originalPost,
      changes: "No changes due to a formatting error.",
    };
  }
};



//prototype3V2

const generateFollowUpQuestions = async (originalQuestion, previousAnswer) => {
  const prompt = `
You are a helpful assistant helping people reflect on a topic.

Here is the original question: "${originalQuestion}"
Here is the user's previous answer: "${previousAnswer}"

Generate 3 new reflective questions to help the user go deeper into their thoughts. Each question should be open-ended, personal, and not too technical.

Respond with a JSON array like:
[
  "How did that experience shape your thinking?",
  "What lesson did you take away from it?",
  "How has your view evolved since then?"
]
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    let content = response.choices[0].message.content.trim();

    // Strip markdown formatting if present
    if (content.startsWith("```")) {
      content = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed) || parsed.length !== 3) {
      throw new Error("Invalid format");
    }

    return parsed;
  } catch (err) {
    console.error("Failed to generate follow-up questions:", err.message);
    return [
      "What else do you remember about this?",
      "How has this changed your perspective?",
      "What would you do differently now?"
    ];
  }
};


const generatePostRatingFeedback = async (sessionId, post) => {
  const prompt = `You're a social media expert. Analyze this post and give only 2–3 sentences of clear, helpful feedback to improve clarity, engagement, and trust.\n\nPost:\n${post}\n\nBe specific and concise.`;

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful and concise social media coach. Your feedback must be short and actionable (2–3 sentences max).",
      },
      { role: "user", content: prompt },
    ],
    model: "gpt-4o",
    max_tokens: 120,
  });

  let feedback = completion.choices[0]?.message?.content?.trim() || "";

  // Remove markdown-style code block if present
  if (feedback.startsWith("```")) {
    feedback = feedback.replace(/^```[a-z]*\n?/, "").replace(/```$/, "").trim();
  }

  await UserSession.updateOne(
    { sessionId },
    { $set: { "rating.feedback": feedback } }
  );

  return feedback;
};



module.exports = { summarizeText, chatWithPersona, extractToneFromInput , extractQuestionsFromTopic,
   generatePostFromSession, runFactCheck, extractQuestionsFromTopicV2, generateQuickTake , getExpertQuote, 
   generateFastFacts, getTrendingTopics, generateKeyIdeas,runPostEdit, generateFollowUpQuestions , generatePostRatingFeedback};
