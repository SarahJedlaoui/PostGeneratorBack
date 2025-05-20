const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const setupSwagger = require('./swagger');
require("./utils/cron"); // Will start the scheduled task


const app = express();
app.use(cors({
    origin: [
      "*",  
      "http://localhost:3000",
      "https://sophiaa-seven.vercel.app",
      "https://sophia-post.vercel.app"
    ],
    credentials: true
  }));
  

// ✅ Enable parsing of form fields for multipart/form-data
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());


setupSwagger(app);

app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/persona', require('./routes/personaRoutes'));
app.use("/api/trending", require("./routes/trendingRoutes.js"));
app.use("/api/question", require("./routes/chatRoutes.js"));
app.use("/api/topics", require("./routes/trendingTopicRoutes.js"));
app.use("/api/rss", require("./routes/rssRoutes"));
app.use("/api/instagram", require("./routes/instagramRoutes"));
app.use("/api/topics", require("./routes/topicRoutes"));

// version 3 

app.use("/api/", require("./routes/topicRoutesV3"));
app.use("/api/auth", require("./routes/auth"));

app.use("/api/auth/linkedin", require("./routes/linkedin.js"));

module.exports = app;
