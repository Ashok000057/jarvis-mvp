import express from "express";
import {
  getAssistantSettings,
  saveAssistantSettings,
} from "../services/settingsService.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await getAssistantSettings(userId);

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { assistantName, personality } = req.body;

    if (!assistantName || !personality) {
      return res.status(400).json({
        success: false,
        error: "assistantName and personality are required",
      });
    }

    await saveAssistantSettings(userId, assistantName, personality);

    res.json({
      success: true,
      message: "Assistant settings saved",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;