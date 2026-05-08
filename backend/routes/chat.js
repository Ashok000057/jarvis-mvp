import express from "express";
import { getAIResponse } from "../services/aiService.js";
import { getMemory, saveMemory } from "../services/memoryService.js";
import { getAssistantSettings } from "../services/settingsService.js";
import { updateSessionTitle } from "../services/sessionService.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "message is required",
      });
    }

    const memory = await getMemory(userId, sessionId);
    const settings = await getAssistantSettings(userId);

    const reply = await getAIResponse(message, memory, settings);

    await saveMemory(userId, message, reply, sessionId);

    if (sessionId) {
      const shortTitle =
        message.length > 32 ? message.slice(0, 32) + "..." : message;

      await updateSessionTitle(sessionId, shortTitle);
    }

    res.json({
      success: true,
      reply,
      assistantName: settings.assistant_name,
      personality: settings.personality,
    });
  } catch (error) {
    console.error("Chat route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;