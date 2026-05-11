import { supabase } from "./supabaseClient.js";

export async function getProjectById(userId, projectId) {
  if (!projectId) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, instructions, memory_mode")
    .eq("user_id", userId)
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Get project error:", error.message);
    return null;
  }

  return data;
}