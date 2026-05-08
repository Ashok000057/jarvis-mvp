import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import {
  clearCurrentChatMemory,
  clearAllUserMemory,
} from "../services/memoryControlService.js";

const router = express.Router();

router.delete("/current/:sessionId", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    await clearCurrentChatMemory(userId, sessionId);

    res.json({
      success: true,
      message: "Current chat memory cleared",
    });
  } catch (error) {
    console.error("Clear current memory route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/all", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    await clearAllUserMemory(userId);

    res.json({
      success: true,
      message: "All memory cleared",
    });
  } catch (error) {
    console.error("Clear all memory route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;