const { generateOverlayImages } = require("../services/imageService");

exports.generateImages = async (req, res) => {
  const { post } = req.body;
  if (!post) return res.status(400).json({ error: "Missing post text" });

  try {
    const images = await generateOverlayImages(post);
    res.json({ images }); // base64-encoded PNGs
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: "Failed to generate images" });
  }
};
