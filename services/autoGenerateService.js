const {
  generateTrendingTopicsWithQuestions,
} = require("./trendingTopicService");
const {
  generateQuickTake,
  generateFastFacts,
  getExpertQuote,
  generateKeyIdeas,
  extractQuestionsFromTopicV2,
} = require("./openaiService"); // adjust this import based on how you structured it
const Topic = require("../models/TopicV3");

const autoGenerateAndStoreTopics = async () => {
  const topics = await generateTrendingTopicsWithQuestions();

  for (const topicObj of topics) {
    const { topic, questions } = topicObj;
    const insights = [];

    for (const q of questions) {
      const quickTake = await generateQuickTake(q);
      const fastFacts = await generateFastFacts(q);
      const expertQuote = await getExpertQuote(q);
      const keyIdeas = await generateKeyIdeas(q);
      const followUp = await extractQuestionsFromTopicV2(topic, q);
      insights.push({
        question: q,
        quickTake,
        expertQuote,
        fastFacts,
        keyIdeas,
        followUpQuestion: followUp[0], // Just one question instead of 4
      });
    }

    await Topic.create({ topic, insights });
  }

  console.log("✅ Topics and insights stored in DB.");
};

module.exports = { autoGenerateAndStoreTopics };
