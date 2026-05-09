import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

router.post("/save", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fileName, summary, fileType } = req.body;

    if (!fileName || !summary) {
      return res.status(400).json({
        success: false,
        error: "fileName and summary are required",
      });
    }

    const { data, error } = await supabase
      .from("document_library")
      .insert([
        {
          user_id: userId,
          file_name: fileName,
          summary,
          file_type: fileType || "general",
        },
      ])
      .select("id, file_name, summary, file_type, created_at")
      .single();

    if (error) {
      console.error("Save document error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      document: data,
      message: "Document saved",
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
      .from("document_library")
      .select("id, file_name, summary, file_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get documents error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      documents: data || [],
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
      .from("document_library")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete document error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;