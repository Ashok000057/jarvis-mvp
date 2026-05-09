import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

router.post("/save", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content, type } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "title and content are required",
      });
    }

    const { data, error } = await supabase
      .from("saved_outputs")
      .insert([
        {
          user_id: userId,
          title,
          content,
          type: type || "general",
        },
      ])
      .select("id, title, content, type, created_at")
      .single();

    if (error) {
      console.error("Save output error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      output: data,
      message: "Output saved",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("saved_outputs")
      .select("id, title, content, type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get outputs error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      outputs: data || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:id", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from("saved_outputs")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete output error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "Output deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;