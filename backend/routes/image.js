import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { getAIResponse } from "../services/aiService.js";
import { getAssistantSettings } from "../services/settingsService.js";

const router = express.Router();

function cleanEnhancedPrompt(text, fallbackPrompt) {
  if (!text || typeof text !== "string") return fallbackPrompt;

  return text
    .replace(/Enhanced Prompt:/gi, "")
    .replace(/Prompt:/gi, "")
    .replace(/["`]/g, "")
    .trim()
    .slice(0, 900);
}

router.post("/generate", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: "Image prompt is required",
      });
    }

    const originalPrompt = prompt.trim();
    const settings = await getAssistantSettings(userId);

    let enhancedPrompt = originalPrompt;

    try {
      const enhancerPrompt = `
You are an expert AI image prompt engineer.

Improve this simple image idea into a high-quality image generation prompt.

Rules:
- Return ONLY the final enhanced prompt.
- Do not explain anything.
- Add visual details, style, lighting, camera angle, quality keywords.
- Keep it under 900 characters.
- Make it suitable for text-to-image generation.

User idea:
${originalPrompt}
`;

      const enhanced = await getAIResponse(enhancerPrompt, [], settings);
      enhancedPrompt = cleanEnhancedPrompt(enhanced, originalPrompt);
    } catch (error) {
      console.error("Prompt enhancement failed, using original:", error.message);
      enhancedPrompt = originalPrompt;
    }

    const params = new URLSearchParams({
      width: "1024",
      height: "1024",
      model: "flux",
      nologo: "true",
      enhance: "true",
      seed: String(Date.now()),
    });

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?${params.toString()}`;

    res.json({
      success: true,
      originalPrompt,
      enhancedPrompt,
      prompt: enhancedPrompt,
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