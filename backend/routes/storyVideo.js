import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { getAIResponse } from "../services/aiService.js";
import { getAssistantSettings } from "../services/settingsService.js";

const router = express.Router();

router.post("/plan", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { story, duration = "10 minutes", style = "cinematic animated" } = req.body;

    if (!story || !story.trim()) {
      return res.status(400).json({
        success: false,
        error: "Story is required",
      });
    }

    const settings = await getAssistantSettings(userId);

    const prompt = `
You are a professional AI video director, story writer, scene planner, and prompt engineer.

Create a complete ${duration} video production plan from this story.

Video style:
${style}

Story:
${story}

IMPORTANT RULES:
- Keep character consistency very strong.
- Create a reusable Character Bible.
- Every scene prompt must repeat the same character details.
- Make the output practical for AI image/video generation.
- Reply in the same language style as the user when possible.

Return output in this format:

1. Video Title
Give 5 title options.

2. Short Story Summary
Summarize the full story in 5-8 lines.

3. Main Character Bible
Include:
- Character name
- Age/look
- Face details
- Hair
- Clothes
- Colors
- Personality
- Do-not-change details
- Consistency prompt

4. Supporting Characters
If needed, define their look and role.

5. 10-Minute Video Structure
Break the video into:
- Intro
- Setup
- Conflict
- Turning point
- Climax
- Ending

6. Scene-by-Scene Plan
Create 30 scenes.
For each scene include:
- Scene number
- Duration
- Location
- Visual description
- Camera angle
- Action
- Emotion
- Voiceover line
- Subtitle text
- Image generation prompt
- Video generation prompt

7. Voiceover Script
Full narration script in sequence.

8. Subtitle File Text
Short subtitle-style lines.

9. Background Music Suggestions
Suggest mood/music type for sections.

10. Thumbnail Prompt
Give a strong high-CTR thumbnail prompt.

11. Production Notes
Explain how to generate images and clips while keeping character consistent.
`;

    const plan = await getAIResponse(prompt, [], settings);

    res.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Story video plan error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Story video plan failed",
    });
  }
});

export default router;