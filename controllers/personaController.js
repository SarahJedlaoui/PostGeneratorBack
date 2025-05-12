const UserSession = require("../models/UserSession");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { extractToneFromInput } = require("../services/openaiService");
const {
  extractQuestionsFromTopic,
  generatePostFromSession,
  runFactCheck,
  extractQuestionsFromTopicV2,
  generateQuickTake,
  getExpertQuote,
  generateFastFacts,
  getTrendingTopics,
  generateKeyIdeas,
  runPostEdit,
} = require("../services/openaiService");

exports.createSession = async (req, res) => {
  try {
    const sessionId = uuidv4();
    const styleNotes = req.body?.styleNotes || "";
    console.log("styleNotes:", styleNotes);

    let fileName = null;
    console.log("file:", req.file);

    if (req.file) {
      const ext = path.extname(req.file.originalname);
      fileName = `${sessionId}${ext}`;
      fs.renameSync(req.file.path, `./temp/${fileName}`);
    }

    const toneRaw = await extractToneFromInput(styleNotes || fileName);

    // Try to parse it if it's in JSON format
    let toneSummary;
    try {
      toneSummary = JSON.parse(toneRaw);
    } catch (err) {
      toneSummary = { summary: toneRaw }; // fallback if it's plain text
    }
    const session = await UserSession.create({
      sessionId,
      styleNotes,
      fileName,
      toneSummary,
    });

    res.status(201).json({ sessionId });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTopic = async (req, res) => {
  const { sessionId, topic } = req.body;
  console.log("topic", topic);

  if (!sessionId || !topic) {
    return res
      .status(400)
      .json({ message: "sessionId and topic are required" });
  }

  try {
    const session = await UserSession.findOneAndUpdate(
      { sessionId },
      { topic },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ message: "Topic saved", topic });
  } catch (err) {
    console.error("Error saving topic:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.generateQuestions = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

  const session = await UserSession.findOne({ sessionId });
  if (!session) return res.status(404).json({ message: "Session not found" });

  const topic = session.topic;
  if (!topic)
    return res.status(400).json({ message: "Session has no topic yet" });

  const questions = await extractQuestionsFromTopic(topic);

  session.questions = questions;
  await session.save();

  res.status(200).json({ questions });
};

exports.getSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    res.json({
      questions: session.questions,
      topic: session.topic,
      toneSummary: session.toneSummary,
    });
  } catch (err) {
    console.error("Failed to fetch session:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.saveAnswers = async (req, res) => {
  const { sessionId, answers } = req.body;

  if (!sessionId || !Array.isArray(answers)) {
    return res.status(400).json({ message: "Missing sessionId or answers" });
  }

  try {
    const session = await UserSession.findOneAndUpdate(
      { sessionId },
      { answers },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({ message: "Answers saved", session });
  } catch (error) {
    console.error("Error saving answers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// POST /api/persona/generate
exports.generatePost = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    // ✅ Return saved post if it already exists
    if (session.generatedPost) {
      return res.status(200).json({ post: session.generatedPost });
    }

    // 🔄 Otherwise, generate a new one
    const post = await generatePostFromSession(sessionId);
    session.generatedPost = post;
    await session.save();

    return res.status(200).json({ post });
  } catch (err) {
    console.error("Error generating post:", err);
    res.status(500).json({ message: err.message || "Error generating post" });
  }
};

exports.factCheck = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session || !session.generatedPost) {
      return res
        .status(404)
        .json({ message: "No post found for this session" });
    }

    

    // ✅ Run new fact-check
    const { generatedPost } = session;
    const { highlights, sources, facts } = await runFactCheck(generatedPost);

    session.factCheck = { highlights, sources, facts };
    await session.save();

    return res.status(200).json({ highlights, sources, facts });
  } catch (err) {
    console.error("Fact-check error:", err.message);
    res.status(500).json({ message: "Failed to process fact-check" });
  }
};

//prototype2

exports.generateQuestions2 = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId)
    return res.status(400).json({ message: "Missing sessionId" });

  const session = await UserSession.findOne({ sessionId });
  if (!session) return res.status(404).json({ message: "Session not found" });

  const topic = session.topic;
  const question = session.chosenQuestion;
  if (!topic)
    return res.status(400).json({ message: "Session has no topic yet" });

  const questions = await extractQuestionsFromTopicV2(topic, question);
try {
  await UserSession.findOneAndUpdate(
    { sessionId },
    { questions },
    { new: true }
  );

  res.status(200).json({ questions });
  } catch (err) {
  console.error("Error updating session:", err.stack || err.message);
  res.status(500).json({ message: "Failed to update questions." });
}
};


exports.updateQuestion = async (req, res) => {
  const { sessionId, question } = req.body;

  if (!sessionId || !question) {
    return res
      .status(400)
      .json({ message: "sessionId and question are required" });
  }

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.chosenQuestion = question;
    await session.save();

    res
      .status(200)
      .json({ message: "chosenQuestion saved", chosenQuestion: question });
  } catch (err) {
    console.error("Error saving question:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.generateInsights = async (req, res) => {
  const { sessionId, question } = req.body;
  if (!sessionId || !question) {
    throw new Error("Missing sessionId or question");
  }

  let quickTake = "",
    expertQuote = {},
    fastFacts = [],
    keyIdeas = [];

  try {
    quickTake = await generateQuickTake(question);
  } catch (e) {
    console.error("quickTake failed:", e.message);
  }

  try {
    expertQuote = await getExpertQuote(question);
  } catch (e) {
    console.error("expertQuote failed:", e.message);
  }

  try {
    fastFacts = await generateFastFacts(question);
  } catch (e) {
    console.error("fastFacts failed:", e.message);
  }

  try {
    keyIdeas = await generateKeyIdeas(question);
  } catch (e) {
    console.error("keyIdeas failed:", e.message);
  }
  try {
    const updated = await UserSession.findOneAndUpdate(
      { sessionId },
      { insights: { quickTake, expertQuote, fastFacts, keyIdeas } },
      { new: true } // returns updated document
    );

    if (!updated) throw new Error("Session not found");
    res.json({ updated });
  } catch (err) {
    console.error("Insight generation failed:", err.message);
    res.status(500).json({ message: "Failed to generate insights" });
  }
};

exports.getInsights = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });
    console.log("session returned from get insights", session);
    res.json(session);
  } catch (err) {
    console.error("Failed to fetch session:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

//prototype3

// /controllers/trendingController.js

exports.getTrendingTopicsWithQuestions = async (req, res) => {
  try {
    const topics = await getTrendingTopics(); // Mocked or real API data
    const result = [];

    for (const topic of topics) {
      const questions = await extractQuestionsFromTopicV2(topic);
      result.push({ topic, questions });
    }

    res.status(200).json({ topics: result });
  } catch (err) {
    console.error("Error fetching trending topics:", err.message);
    res.status(500).json({ message: "Failed to fetch trending topics" });
  }
};

exports.editPost = async (req, res) => {
  const { sessionId, instruction } = req.body;
  if (!sessionId || !instruction) {
    return res
      .status(400)
      .json({ message: "Missing sessionId or instruction" });
  }

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session || !session.generatedPost) {
      return res.status(404).json({ message: "No post found to edit" });
    }
    const previousPost = session.generatedPost;
    const editedPost = await runPostEdit(previousPost, instruction);

    // Save old post as draft
    session.postDrafts = session.postDrafts || [];
    session.postDrafts.push({ content: previousPost });

    session.generatedPost = editedPost;
    await session.save();

    return res.status(200).json({ post: editedPost });
  } catch (err) {
    console.error("Error editing post:", err.message);
    res.status(500).json({ message: "Failed to process edit request" });
  }
};

exports.getPostDrafts = async (req, res) => {
  const { sessionId } = req.body;
   if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });
  const session = await UserSession.findOne({ sessionId });
  if (!session) return res.status(404).json({ message: "Session not found" });

  res.json({ drafts: session.postDrafts || [] });
};

exports.getGeneratedPost = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ message: "Missing sessionId" });
  }

  try {
    const session = await UserSession.findOne({ sessionId });

    if (!session || !session.generatedPost) {
      return res.status(404).json({ message: "No post found for this session" });
    }

    return res.status(200).json({ post: session.generatedPost });
  } catch (err) {
    console.error("Error retrieving generated post:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
