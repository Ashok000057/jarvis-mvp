import { supabase } from "./supabaseClient.js";

export async function clearCurrentChatMemory(userId, sessionId) {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (error) {
    console.error("Clear current chat memory error:", error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function clearAllUserMemory(userId) {
  const { error: chatsError } = await supabase
    .from("chats")
    .delete()
    .eq("user_id", userId);

  if (chatsError) {
    console.error("Clear all chats error:", chatsError.message);
    throw new Error(chatsError.message);
  }

  const { error: sessionsError } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("user_id", userId);

  if (sessionsError) {
    console.error("Clear all sessions error:", sessionsError.message);
    throw new Error(sessionsError.message);
  }

  return true;
}