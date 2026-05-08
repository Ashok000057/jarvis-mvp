import { supabase } from "./supabaseClient.js";

export async function getMemory(userId, sessionId = null) {
  let query = supabase
    .from("chats")
    .select("message, response, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (sessionId) {
    query = query.eq("session_id", sessionId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Memory fetch error:", error.message);
    return [];
  }

  return data.reverse();
}

export async function saveMemory(userId, userMsg, aiMsg, sessionId = null) {
  const payload = {
    user_id: userId,
    message: userMsg,
    response: aiMsg,
  };

  if (sessionId) {
    payload.session_id = sessionId;
  }

  const { error } = await supabase.from("chats").insert([payload]);

  if (error) {
    console.error("Memory save error:", error.message);
    throw new Error("Failed to save memory");
  }

  return true;
}