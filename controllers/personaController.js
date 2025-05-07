const UserSession = require("../models/UserSession");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { extractToneFromInput } = require("../services/openaiService");
const { extractQuestionsFromTopic, generatePostFromSession, runFactCheck,extractQuestionsFromTopicV2,generateQuickTake,getExpertQuote, } = require("../services/openaiService");

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
    const post = await generatePostFromSession(sessionId);
    res.status(200).json({ post });
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
      return res.status(404).json({ message: "No post found for this session" });
    }

    const { generatedPost } = session;
    const { highlights, sources } = await runFactCheck(generatedPost);

    return res.status(200).json({
      post: generatedPost,
      highlights,
      sources,
    });
  } catch (err) {
    console.error("Fact-check error:", err.message);
    res.status(500).json({ message: "Failed to process fact-check" });
  }
};



exports.generateQuestions2 = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

  const session = await UserSession.findOne({ sessionId });
  if (!session) return res.status(404).json({ message: "Session not found" });

  const topic = session.topic;
  const question = session.chosenQuestion;
  if (!topic)
    return res.status(400).json({ message: "Session has no topic yet" });

  const questions = await extractQuestionsFromTopicV2(topic,question);

  session.questions = questions;
  await session.save();

  res.status(200).json({ questions });
};

exports.updateQuestion = async (req, res) => {
  const { sessionId, question } = req.body;

  if (!sessionId || !question) {
    return res.status(400).json({ message: "sessionId and question are required" });
  }

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.chosenQuestion = question;
    await session.save();

    res.status(200).json({ message: "chosenQuestion saved", chosenQuestion: question });
  } catch (err) {
    console.error("Error saving question:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.generateInsights = async (req, res) => {
  const { sessionId, question } = req.body;

  if (!sessionId || !question) return res.status(400).json({ error: "Missing input" });

  try {
    const quickTake = await generateQuickTake(question);
    console.log("quickTake:", quickTake);
    
    const expertQuote = await getExpertQuote(question);
    console.log("expertQuote:", expertQuote);
    
    const fastFacts = await generateFastFacts(question);
    console.log("fastFacts:", fastFacts);

    const session = await UserSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    session.insights = { quickTake, expertQuote, fastFacts };
    await session.save();
    console.log("Updated Session:", session);
    res.json({ session });
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

    res.json(session.insights || {});
  } catch (err) {
    console.error("Failed to fetch session:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
