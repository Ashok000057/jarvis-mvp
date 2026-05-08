import express from "express";
import {
  createSession,
  getSessions,
  updateSessionTitle,
  getSessionMessages,
  togglePinSession,
  deleteSession,
} from "../services/sessionService.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;

    const session = await createSession(userId, title || "New Chat");

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Create session route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await getSessions(userId);

    res.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error("Get sessions route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:sessionId/messages", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const messages = await getSessionMessages(userId, sessionId);

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get session messages route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.patch("/:sessionId/title", verifyUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "title is required",
      });
    }

    await updateSessionTitle(sessionId, title);

    res.json({
      success: true,
      message: "Chat title updated",
    });
  } catch (error) {
    console.error("Update session title route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.patch("/:sessionId/pin", verifyUser, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pinned } = req.body;

    await togglePinSession(sessionId, Boolean(pinned));

    res.json({
      success: true,
      message: pinned ? "Chat pinned" : "Chat unpinned",
    });
  } catch (error) {
    console.error("Pin session route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:sessionId", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    await deleteSession(userId, sessionId);

    res.json({
      success: true,
      message: "Chat deleted",
    });
  } catch (error) {
    console.error("Delete session route error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;