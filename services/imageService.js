const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const { extractInsightsFromPost } = require("./openaiService");

const overlayTextOnImage = async (imagePath, text, fontSize = 54) => {
  const image = await loadImage(imagePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(image, 0, 0);
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `bold ${fontSize}px sans-serif`;

  const maxWidth = canvas.width * 0.8; // Leave 10% padding on sides
  const words = text.split(" ");
  const lines = [];
  let line = "";

  // ✅ Wrap text into lines
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && line.length > 0) {
      lines.push(line.trim());
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  // ✅ Vertical centering
  const lineSpacing = 100; // <-- you can tweak this value
  const lineHeight = fontSize + lineSpacing;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (canvas.height - totalTextHeight) / 2;

  // ✅ Draw each line centered
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width * 0.1, startY + index * lineHeight);
  });

  return canvas.toDataURL("image/png");
};
exports.generateOverlayImages = async (post) => {
  const { hook, statements } = await extractInsightsFromPost(post);

  const templatesPath = path.join(__dirname, "../public/templates");

  const img1 = await overlayTextOnImage(
    path.join(templatesPath, "title.png"),
    hook,
    360
  );
  const img2 = await overlayTextOnImage(
    path.join(templatesPath, "post1.png"), 
    statements[0],
    240
  );
  const img3 = await overlayTextOnImage(
    path.join(templatesPath, "post2.png"),
    statements[1],
    240
  );

  return [img1, img2, img3];
};
