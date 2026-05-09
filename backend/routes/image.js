import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", verifyUser, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Image prompt is required",
      });
    }

    const cleanPrompt = prompt.trim();

    const params = new URLSearchParams({
      width: "1024",
      height: "1024",
      model: "flux",
      nologo: "true",
      enhance: "true",
      seed: String(Date.now()),
    });

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanPrompt
    )}?${params.toString()}`;

    res.json({
      success: true,
      prompt: cleanPrompt,
      imageUrl,
    });
  } catch (error) {
    console.error("Image generate error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;