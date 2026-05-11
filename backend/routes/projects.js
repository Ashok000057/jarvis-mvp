import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

router.post("/", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      description = "",
      instructions = "",
      memoryMode = "new",
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: "Project name is required",
      });
    }

    const allowedModes = ["new", "all"];

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          user_id: userId,
          name: name.trim(),
          description,
          instructions,
          memory_mode: allowedModes.includes(memoryMode) ? memoryMode : "new",
        },
      ])
      .select("id, name, description, instructions, memory_mode, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      project: data,
    });
  } catch (error) {
    console.error("Create project error:", error.message);

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
      .from("projects")
      .select("id, name, description, instructions, memory_mode, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      projects: data || [],
    });
  } catch (error) {
    console.error("Get projects error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get("/:projectId", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const { data, error } = await supabase
      .from("projects")
      .select("id, name, description, instructions, memory_mode, created_at")
      .eq("user_id", userId)
      .eq("id", projectId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      project: data,
    });
  } catch (error) {
    console.error("Get project error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.patch("/:projectId", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const {
      name,
      description,
      instructions,
      memoryMode,
    } = req.body;

    const updatePayload = {};

    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (instructions !== undefined) updatePayload.instructions = instructions;
if (memoryMode !== undefined) {
  const allowedModes = ["new", "all"];
  updatePayload.memory_mode = allowedModes.includes(memoryMode)
    ? memoryMode
    : "new";
}
    const { data, error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("user_id", userId)
      .eq("id", projectId)
      .select("id, name, description, instructions, memory_mode, created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      project: data,
    });
  } catch (error) {
    console.error("Update project error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/:projectId", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("user_id", userId)
      .eq("id", projectId);

    if (error) {
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "Project deleted",
    });
  } catch (error) {
    console.error("Delete project error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;