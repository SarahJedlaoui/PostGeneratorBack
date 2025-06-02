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
  generateFollowUpQuestions,
  generatePostRatingFeedback,
  createPostImage,
  extractTopicAndQuestionFromText
} = require("../services/openaiService");

exports.createSession = async (req, res) => {
  try {
    const sessionId = uuidv4();
   
    const session = await UserSession.create({
      sessionId,
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
  //  Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "https://sophia-post.vercel.app");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
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
     console.log("✅ /fact-check route hit");
    return res.status(200).json({ highlights, sources, facts });
  } catch (err) {
    console.error("Fact-check error:", err.message);
    res.status(500).json({ message: "Failed to process fact-check" });
  }
};

//prototype2

exports.generateQuestions2 = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) return res.status(400).json({ message: "Missing sessionId" });

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
    const { post, changes } = await runPostEdit(previousPost, instruction);

    // Save old post as draft
    session.postDrafts = session.postDrafts || [];
    session.postDrafts.push({ content: previousPost });

    session.generatedPost = post;
    await session.save();

    return res.status(200).json({ post, changes });
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
      return res
        .status(404)
        .json({ message: "No post found for this session" });
    }

    return res.status(200).json({ post: session.generatedPost });
  } catch (err) {
    console.error("Error retrieving generated post:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//prototypeV3V2

exports.generateDeepQuestions = async (req, res) => {
  const { sessionId, previousAnswer } = req.body;

  if (!sessionId || !previousAnswer) {
    return res.status(400).json({ message: "Missing sessionId or answer" });
  }

  try {
    const session = await UserSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const originalQuestion = session.chosenQuestion;

    // Call OpenAI to generate 3 follow-up questions
    const newQuestions = await generateFollowUpQuestions(
      originalQuestion,
      previousAnswer
    );

    // Optionally store these questions if not already present
    if (!session.questions || session.questions.length === 0) {
      session.questions = [session.insights.followUpQuestion, ...newQuestions];
      await session.save();
    }

    res.json(newQuestions);
  } catch (err) {
    console.error("generateDeepQuestions error:", err.message);
    res.status(500).json({ message: "Failed to generate follow-up questions" });
  }
};

exports.storeFollowUpQuestion = async (req, res) => {
  const { sessionId, followUpQuestion } = req.body;

  if (!sessionId || !followUpQuestion) {
    return res.status(400).json({ message: "Missing data" });
  }

  try {
    const updated = await UserSession.findOneAndUpdate(
      { sessionId },
      { $set: { questions: [followUpQuestion] } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Session not found" });

    res.json({
      message: "Follow-up question stored",
      questions: updated.questions,
    });
  } catch (err) {
    console.error("Failed to store follow-up question:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.ratePost = async (req, res) => {
  const { sessionId, post } = req.body;

  if (!sessionId || !post) {
    return res.status(400).json({ error: "Missing sessionId or post" });
  }

  try {
    const feedback = await generatePostRatingFeedback(sessionId, post);
    res.json({ feedback });
  } catch (err) {
    console.error("Error rating post:", err);
    res.status(500).json({ error: "Failed to rate post" });
  }
};

exports.saveEditedPost = async (req, res) => {
  const { sessionId, post } = req.body;
  if (!sessionId || !post) {
    return res.status(400).json({ error: "Missing sessionId or post" });
  }

  try {
    await UserSession.updateOne(
      { sessionId },
      { $set: { generatedPost: post } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save post:", err);
    res.status(500).json({ error: "Could not save post" });
  }
};

exports.saveDraft = async (req, res) => {
  const { sessionId, content } = req.body;

  if (!sessionId || !content) {
    return res.status(400).json({ error: "Missing sessionId or content" });
  }

  try {
    await UserSession.updateOne(
      { sessionId },
      {
        $push: {
          postDrafts: {
            content,
            editedAt: new Date(),
          },
        },
      }
    );

    res.json({ message: "Draft saved successfully." });
  } catch (err) {
    console.error("Error saving draft:", err);
    res.status(500).json({ error: "Failed to save draft." });
  }
};

exports.createSession2 = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
    const sessionId = `${userId}-${Date.now()}`;
  
    const session = await UserSession.create({
      sessionId,
      user: userId,
    });

    res.status(201).json({ sessionId });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.generateImage = async (req, res) => {
  const { post } = req.body;

  if (!post) {
    return res.status(400).json({ error: "Post text is required" });
  }

  try {
    const imageBase64 = await createPostImage(post);
   res.status(200).json({ image: imageBase64 });
  } catch (err) {
   console.error("Image generation error:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
};


// choose own topic 

exports.extractTopicAndQuestion = async (req, res) => {
  const { sessionId, text } = req.body;
  if (!sessionId || !text) {
    return res.status(400).json({ message: "Missing sessionId or text" });
  }

  try {
    const { topic, question, reflective } = await extractTopicAndQuestionFromText(text);

    const session = await UserSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.topic = topic;
    session.chosenQuestion = question;
    session.questions = [reflective];
    await session.save();

    return res.status(200).json({ topic, question, reflective });
  } catch (err) {
    console.error("Controller error:", err.message);
    return res.status(500).json({ message: "Failed to extract topic and question" });
  }
};