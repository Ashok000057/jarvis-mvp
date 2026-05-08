import { supabase } from "./supabaseClient.js";

export async function getAssistantSettings(userId) {
  const { data, error } = await supabase
    .from("assistant_settings")
    .select("assistant_name, personality")
    .eq("user_id", userId)
    .single();

  if (error) {
    return {
      assistant_name: "Jarvis",
      personality: "friendly",
    };
  }

  return data;
}

export async function saveAssistantSettings(userId, assistantName, personality) {
  const { data: existing } = await supabase
    .from("assistant_settings")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("assistant_settings")
      .update({
        assistant_name: assistantName,
        personality,
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error("Failed to update assistant settings");
    }

    return true;
  }

  const { error } = await supabase.from("assistant_settings").insert([
    {
      user_id: userId,
      assistant_name: assistantName,
      personality,
    },
  ]);

  if (error) {
    throw new Error("Failed to save assistant settings");
  }

  return true;
}