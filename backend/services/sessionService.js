import { supabase } from "./supabaseClient.js";

export async function createSession(userId, title = "New Chat") {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert([
      {
        user_id: userId,
        title,
        pinned: false,
      },
    ])
    .select("id, user_id, title, pinned, created_at")
    .single();

  if (error) {
    console.error("Create session error:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function getSessions(userId) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, pinned, created_at")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get sessions error:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function updateSessionTitle(sessionId, title) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId);

  if (error) {
    console.error("Update session title error:", error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function getSessionMessages(userId, sessionId) {
  const { data, error } = await supabase
    .from("chats")
    .select("message, response, created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get session messages error:", error.message);
    throw new Error(error.message);
  }

  return data || [];
}

export async function togglePinSession(sessionId, pinned) {
  const { error } = await supabase
    .from("chat_sessions")
    .update({ pinned })
    .eq("id", sessionId);

  if (error) {
    console.error("Toggle pin session error:", error.message);
    throw new Error(error.message);
  }

  return true;
}

export async function deleteSession(userId, sessionId) {
  const { error: messagesError } = await supabase
    .from("chats")
    .delete()
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (messagesError) {
    console.error("Delete session messages error:", messagesError.message);
    throw new Error(messagesError.message);
  }

  const { error: sessionError } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("id", sessionId);

  if (sessionError) {
    console.error("Delete session error:", sessionError.message);
    throw new Error(sessionError.message);
  }

  return true;
}