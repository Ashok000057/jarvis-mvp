import { supabase } from "./supabaseClient.js";

export async function createSession(userId, title = "New Chat", projectId = null) {
  const payload = {
    user_id: userId,
    title,
    pinned: false,
  };

  if (projectId) {
    payload.project_id = projectId;
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert([payload])
    .select("id, user_id, title, pinned, project_id, created_at")
    .single();

  if (error) {
    console.error("Create session error:", error.message);
    throw new Error(error.message);
  }

  return data;
}

export async function getSessions(userId, projectId = null) {
  let query = supabase
    .from("chat_sessions")
    .select("id, title, pinned, project_id, created_at")
    .eq("user_id", userId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

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