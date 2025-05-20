const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/linkedin/callback", authController.linkedinCallback);

module.exports = router;
