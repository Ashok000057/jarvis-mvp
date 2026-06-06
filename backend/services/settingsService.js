import { supabase } from "./supabaseClient.js";

export async function getAssistantSettings(userId) {
  const { data, error } = await supabase
    .from("assistant_settings")
    .select("assistant_name, personality, character_brain, reaction_style")
    .eq("user_id", userId)
    .single();

  if (error) {
    return {
      assistant_name: "Jarvis",
      personality: "friendly",
      character_brain: "default",
      reaction_style: "cool",
    };
  }

  return {
    assistant_name: data.assistant_name || "Jarvis",
    personality: data.personality || "friendly",
    character_brain: data.character_brain || "default",
    reaction_style: data.reaction_style || "realistic",
  };
}

export async function saveAssistantSettings(
  userId,
  assistantName,
  personality,
  characterBrain = "default",
  reactionStyle = "cool"
) {
  const { data: existing } = await supabase
    .from("assistant_settings")
    .select("id")
    .eq("user_id", userId)
    .single();

  const payload = {
    assistant_name: assistantName,
    personality,
    character_brain: characterBrain,
    reaction_style: reactionStyle,
  };

  if (existing) {
    const { error } = await supabase
      .from("assistant_settings")
      .update(payload)
      .eq("user_id", userId);

    if (error) {
      console.error("Settings update error:", error.message);
      throw new Error("Failed to update assistant settings");
    }

    return true;
  }

  const { error } = await supabase.from("assistant_settings").insert([
    {
      user_id: userId,
      ...payload,
    },
  ]);

  if (error) {
    console.error("Settings insert error:", error.message);
    throw new Error("Failed to save assistant settings");
  }

  return true;
}
