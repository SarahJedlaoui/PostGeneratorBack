const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const setupSwagger = require('./swagger');


const app = express();
app.use(cors());

// ✅ Enable parsing of form fields for multipart/form-data
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.json());


setupSwagger(app);

app.use('/api/market', require('./routes/marketRoutes'));
app.use('/api/persona', require('./routes/personaRoutes'));
app.use("/api/trending", require("./routes/trendingRoutes.js"));

module.exports = app;
