const express = require("express");
const router = express.Router();
const controller = require("../controllers/imageController");

router.post("/generate-social-images", controller.generateImages);

module.exports = router;
