const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cron = require("node-cron");

dotenv.config();
connectDB();
const { generateTrendingTopicsWithQuestions, saveTrendingToFile } = require("./services/trendingService");
const app = require('./app');

//refresh trending topics each week
cron.schedule("0 0 * * 0", async () => {
    console.log("⏰ Weekly refresh of trending topics...");
    const topics = await generateTrendingTopicsWithQuestions();
    await saveTrendingToFile(topics);
    console.log("✅ Trending topics refreshed.");
  });



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



