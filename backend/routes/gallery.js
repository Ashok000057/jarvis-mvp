import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { supabase } from "../services/supabaseClient.js";

const router = express.Router();

router.post("/save", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { prompt, imageUrl } = req.body;

    if (!prompt || !imageUrl) {
      return res.status(400).json({
        success: false,
        error: "prompt and imageUrl are required",
      });
    }

    const { data, error } = await supabase
      .from("image_gallery")
      .insert([
        {
          user_id: userId,
          prompt,
          image_url: imageUrl,
        },
      ])
      .select("id, prompt, image_url, created_at")
      .single();

    if (error) {
      console.error("Save gallery error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      image: data,
      message: "Image saved to gallery",
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
      .from("image_gallery")
      .select("id, prompt, image_url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get gallery error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      images: data || [],
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
      .from("image_gallery")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Delete gallery error:", error.message);
      throw new Error(error.message);
    }

    res.json({
      success: true,
      message: "Image deleted from gallery",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;