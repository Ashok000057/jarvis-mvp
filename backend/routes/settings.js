import express from "express";
import {
  getAssistantSettings,
  saveAssistantSettings,
} from "../services/settingsService.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

const ALLOWED_CHARACTER_BRAINS = [
  "default",
  "grandfather",
  "grandmother",
  "father",
  "mother",
  "sister",
  "brother",
  "relative",
  "neighbour",
  "friend",
  "girlfriend",
  "boyfriend",
];

const ALLOWED_REACTION_STYLES = ["cool", "strict"];

router.get("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await getAssistantSettings(userId);

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      assistantName,
      personality,
      characterBrain = "default",
      reactionStyle = "cool",
    } = req.body;

    if (!assistantName || !personality) {
      return res.status(400).json({
        success: false,
        error: "assistantName and personality are required",
      });
    }

    const safeCharacterBrain = ALLOWED_CHARACTER_BRAINS.includes(characterBrain)
      ? characterBrain
      : "default";

    const safeReactionStyle = ALLOWED_REACTION_STYLES.includes(reactionStyle)
      ? reactionStyle
      : "cool";

    await saveAssistantSettings(
      userId,
      assistantName,
      personality,
      safeCharacterBrain,
      safeReactionStyle
    );

    res.json({ success: true, message: "Assistant settings saved" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
