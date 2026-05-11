import { supabase } from "./supabaseClient.js";

export async function getMemory(
  userId,
  sessionId = null,
  projectId = null,
  memoryMode = "new"
) {
  let query = supabase
    .from("chats")
    .select("message, response, created_at, project_id, session_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(16);

  // Project-only memory: use only this project's chats
  if (projectId && memoryMode === "new") {
    query = query.eq("project_id", projectId);
  }

  // All memory mode: use all user chats
  // No project/session filter here

  // No active project: keep current chat context if available
  if (!projectId && sessionId && memoryMode !== "all") {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Memory fetch error:", error.message);
    return [];
  }

  return (data || []).reverse();
}

export async function saveMemory(
  userId,
  userMsg,
  aiMsg,
  sessionId = null,
  projectId = null
) {
  const payload = {
    user_id: userId,
    message: userMsg,
    response: aiMsg,
  };

  if (sessionId) {
    payload.session_id = sessionId;
  }

  if (projectId) {
    payload.project_id = projectId;
  }

  const { error } = await supabase.from("chats").insert([payload]);

  if (error) {
    console.error("Memory save error:", error.message);
    throw new Error("Failed to save memory");
  }

  return true;
}