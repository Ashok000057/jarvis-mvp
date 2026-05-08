import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const userId = user?.id;

  const [assistantName, setAssistantName] = useState("Jarvis");
  const [personality, setPersonality] = useState("friendly");

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello, I am Jarvis. Please login to start.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(true);
  const [liveMode, setLiveMode] = useState(false);

  const [fileMode, setFileMode] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userId) {
      loadSettings();
      loadSessions();
    }
  }, [userId]);

  const checkUser = async () => {
    const { data } = await supabase.auth.getSession();
    setUser(data.session?.user || null);
  };

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      throw new Error("No auth token found");
    }

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      alert("Email and password required");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });

        if (error) throw error;

        setUser(data.user);
        alert("Signup successful");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim(),
        });

        if (error) throw error;

        setUser(data.user);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();

    stopVoiceSystem();

    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
    setFileMode(false);
    setUploadedFileName("");
    setMessages([
      {
        role: "ai",
        text: "Logged out. Please login again.",
      },
    ]);
  };

  const loadSettings = async () => {
    if (!userId) return;

    try {
      const authConfig = await getAuthHeaders();

      const res = await axios.get(`${API_URL}/api/settings`, authConfig);

      if (res.data.success) {
        const name = res.data.settings.assistant_name || "Jarvis";
        const tone = res.data.settings.personality || "friendly";

        setAssistantName(name);
        setPersonality(tone);

        setMessages([
          {
            role: "ai",
            text: `Hello, I am ${name}. How can I help you today?`,
          },
        ]);
      }
    } catch (error) {
      console.error("Settings load error:", error);
    }
  };

  const loadSessions = async () => {
    if (!userId) return;

    try {
      const authConfig = await getAuthHeaders();

      const res = await axios.get(`${API_URL}/api/sessions`, authConfig);

      if (res.data.success) {
        setSessions(res.data.sessions || []);

        if (res.data.sessions?.length > 0 && !activeSessionId) {
          setActiveSessionId(res.data.sessions[0].id);
        }
      }
    } catch (error) {
      console.error("Load sessions error:", error);
    }
  };

  const createNewChat = async () => {
    if (!userId) return;

    try {
      const authConfig = await getAuthHeaders();

      const res = await axios.post(
        `${API_URL}/api/sessions`,
        { title: "New Chat" },
        authConfig
      );

      if (res.data.success) {
        const newSession = res.data.session;

        setActiveSessionId(newSession.id);
        setSessions((prev) => [newSession, ...prev]);

        setMessages([
          {
            role: "ai",
            text: `New chat started. I am ${assistantName}. How can I help you?`,
          },
        ]);
      }
    } catch (error) {
      console.error("Create new chat error:", error);
      alert("Failed to create new chat. Check backend.");
    }
  };

  const openSession = async (sessionId) => {
    if (!userId) return;

    try {
      const authConfig = await getAuthHeaders();

      setActiveSessionId(sessionId);

      const res = await axios.get(
        `${API_URL}/api/sessions/${sessionId}/messages`,
        authConfig
      );

      if (res.data.success) {
        const loadedMessages = [];

        res.data.messages.forEach((item) => {
          loadedMessages.push({
            role: "user",
            text: item.message,
          });

          loadedMessages.push({
            role: "ai",
            text: item.response,
          });
        });

        setMessages(
          loadedMessages.length > 0
            ? loadedMessages
            : [
                {
                  role: "ai",
                  text: `This chat is empty. I am ${assistantName}.`,
                },
              ]
        );
      }
    } catch (error) {
      console.error("Open session error:", error);
      alert("Failed to open chat. Check backend.");
    }
  };

  const togglePinChat = async (e, session) => {
    e.stopPropagation();

    try {
      const authConfig = await getAuthHeaders();

      await axios.patch(
        `${API_URL}/api/sessions/${session.id}/pin`,
        {
          pinned: !session.pinned,
        },
        authConfig
      );

      await loadSessions();
    } catch (error) {
      console.error("Pin chat error:", error);
      alert("Failed to pin/unpin chat. Check backend.");
    }
  };

  const deleteChat = async (e, sessionId) => {
    e.stopPropagation();

    const confirmDelete = window.confirm("Delete this chat permanently?");
    if (!confirmDelete) return;

    try {
      const authConfig = await getAuthHeaders();

      await axios.delete(`${API_URL}/api/sessions/${sessionId}`, authConfig);

      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([
          {
            role: "ai",
            text: `Chat deleted. Start a new chat with ${assistantName}.`,
          },
        ]);
      }
    } catch (error) {
      console.error("Delete chat error:", error);
      alert("Failed to delete chat. Check backend.");
    }
  };

  const clearCurrentChat = async () => {
    if (!activeSessionId) {
      alert("No active chat selected");
      return;
    }

    const confirmClear = window.confirm("Clear all messages from this chat?");
    if (!confirmClear) return;

    try {
      const authConfig = await getAuthHeaders();

      await axios.delete(
        `${API_URL}/api/memory/current/${activeSessionId}`,
        authConfig
      );

      setMessages([
        {
          role: "ai",
          text: `Current chat memory cleared. I am ${assistantName}.`,
        },
      ]);

      await loadSessions();
    } catch (error) {
      console.error("Clear current chat error:", error);
      alert("Failed to clear current chat. Check backend.");
    }
  };

  const clearAllMemory = async () => {
    const confirmClear = window.confirm(
      "This will permanently delete all your chats and memory. Continue?"
    );

    if (!confirmClear) return;

    try {
      const authConfig = await getAuthHeaders();

      await axios.delete(`${API_URL}/api/memory/all`, authConfig);

      setSessions([]);
      setActiveSessionId(null);
      setMessages([
        {
          role: "ai",
          text: `All memory cleared. I am ${assistantName}.`,
        },
      ]);
    } catch (error) {
      console.error("Clear all memory error:", error);
      alert("Failed to clear all memory. Check backend.");
    }
  };

  const exportCurrentChat = () => {
    if (!messages || messages.length === 0) {
      alert("No messages to export");
      return;
    }

    const chatText = messages
      .map((msg) => {
        const sender = msg.role === "user" ? "You" : assistantName;
        return `${sender}: ${msg.text}`;
      })
      .join("\n\n");

    const fileContent = `Chat Export
Assistant: ${assistantName}
Personality: ${personality}
Date: ${new Date().toLocaleString()}

${chatText}`;

    const blob = new Blob([fileContent], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${assistantName}-chat-export.txt`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summarizeTextFile = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    const allowedTypes = ["text/plain", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only .txt and .pdf files are supported right now");
      event.target.value = "";
      return;
    }

    try {
      const authConfig = await getAuthHeaders();

      const formData = new FormData();
      formData.append("file", file);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: `Uploaded file: ${file.name}`,
        },
      ]);

      setLoading(true);

      const res = await axios.post(
        `${API_URL}/api/files/summarize`,
        formData,
        {
          headers: {
            ...authConfig.headers,
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000,
        }
      );

      if (res.data.success) {
        setFileMode(true);
        setUploadedFileName(res.data.fileName || file.name);

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text:
              res.data.summary +
              `\n\n✅ File saved for Q&A. Now you can ask questions from this file.`,
          },
        ]);

        speakText(res.data.summary);
      }
    } catch (error) {
      console.error("File summary error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "File summarize failed. Check backend terminal.",
        },
      ]);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const askUploadedFile = async (question) => {
    if (!question.trim()) return;

    try {
      const authConfig = await getAuthHeaders();

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: question,
        },
      ]);

      setInput("");
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/api/files/ask`,
        {
          question,
        },
        authConfig
      );

      if (res.data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            text: res.data.answer,
          },
        ]);

        speakText(res.data.answer);
      }
    } catch (error) {
      console.error("File Q&A error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            error.response?.data?.error ||
            "File question failed. Upload a TXT/PDF first or check backend.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearUploadedFile = async () => {
    const confirmClear = window.confirm("Clear uploaded file context?");
    if (!confirmClear) return;

    try {
      const authConfig = await getAuthHeaders();

      await axios.delete(`${API_URL}/api/files/clear`, authConfig);

      setFileMode(false);
      setUploadedFileName("");

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Uploaded file context cleared.",
        },
      ]);
    } catch (error) {
      console.error("Clear uploaded file error:", error);
      alert("Failed to clear uploaded file context.");
    }
  };

  const speakText = (text, afterSpeak = null) => {
    if (!voiceOutput) {
      if (typeof afterSpeak === "function") {
        setTimeout(afterSpeak, 500);
      }
      return;
    }

    if (!("speechSynthesis" in window)) {
      console.warn("Text-to-speech not supported in this browser.");
      if (typeof afterSpeak === "function") {
        setTimeout(afterSpeak, 500);
      }
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "hi-IN";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      if (typeof afterSpeak === "function") {
        setTimeout(afterSpeak, 700);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const startVoiceInput = async () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Chrome ya Edge use karo.");
      return;
    }

    if (loading || listening) return;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }

      const recognition = new SpeechRecognition();

      recognition.lang = "hi-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        console.log("Voice recognition started");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("Voice transcript:", transcript);

        setInput(transcript);

        setTimeout(() => {
          if (fileMode) {
            askUploadedFile(transcript);
          } else {
            sendVoiceMessage(transcript);
          }
        }, 300);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition exact error:", event.error);
        setListening(false);

        if (event.error === "not-allowed") {
          alert("Mic permission blocked hai. Browser ke lock icon se Microphone Allow karo.");
        } else if (event.error === "no-speech") {
          console.log("No speech detected.");
        } else if (event.error === "audio-capture") {
          alert("Mic detect nahi hua. Windows mic settings check karo.");
        } else if (event.error === "network") {
          alert("Speech recognition network error. Internet ya browser speech service issue hai.");
        } else if (event.error === "aborted") {
          console.log("Voice input aborted.");
        } else {
          alert(`Voice input failed: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setListening(false);
        console.log("Voice recognition ended");
      };

      recognition.start();
    } catch (error) {
      console.error("Mic permission/start error:", error);
      setListening(false);

      if (error.name === "NotAllowedError") {
        alert("Microphone permission denied hai. Browser settings me mic allow karo.");
      } else if (error.name === "NotFoundError") {
        alert("Microphone nahi mila. Mic connected hai ya nahi check karo.");
      } else {
        alert(`Mic start failed: ${error.message}`);
      }
    }
  };

  const renameChat = async (e, session) => {
    e.stopPropagation();

    const newTitle = window.prompt("Enter new chat title:", session.title);
    if (!newTitle || !newTitle.trim()) return;

    try {
      const authConfig = await getAuthHeaders();

      await axios.patch(
        `${API_URL}/api/sessions/${session.id}/title`,
        {
          title: newTitle.trim(),
        },
        authConfig
      );

      await loadSessions();
    } catch (error) {
      console.error("Rename chat error:", error);
      alert("Failed to rename chat. Check backend.");
    }
  };

  const saveSettings = async () => {
    if (!userId) return;

    if (!assistantName.trim()) {
      alert("Assistant name required");
      return;
    }

    setSettingsLoading(true);

    try {
      const authConfig = await getAuthHeaders();

      await axios.post(
        `${API_URL}/api/settings`,
        {
          assistantName: assistantName.trim(),
          personality,
        },
        authConfig
      );

      setMessages([
        {
          role: "ai",
          text: `Settings saved. I am now ${assistantName}. Personality: ${personality}.`,
        },
      ]);
    } catch (error) {
      console.error("Settings save error:", error);
      alert("Failed to save settings. Check backend.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const sendVoiceMessage = async (voiceText) => {
    if (!userId) {
      alert("Please login first");
      return;
    }

    if (!voiceText.trim() || loading) return;

    const userMessage = voiceText.trim();
    let sessionId = activeSessionId;

    try {
      const authConfig = await getAuthHeaders();

      if (!sessionId) {
        const sessionRes = await axios.post(
          `${API_URL}/api/sessions`,
          {
            title:
              userMessage.length > 32
                ? userMessage.slice(0, 32) + "..."
                : userMessage,
          },
          authConfig
        );

        if (sessionRes.data.success) {
          sessionId = sessionRes.data.session.id;
          setActiveSessionId(sessionId);
          setSessions((prev) => [sessionRes.data.session, ...prev]);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: userMessage,
        },
      ]);

      setInput("");
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/api/chat`,
        {
          message: userMessage,
          sessionId,
        },
        authConfig
      );

      const nameFromBackend = res.data.assistantName || assistantName;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: res.data.reply,
        },
      ]);

      speakText(res.data.reply, () => {
        if (liveMode) {
          startVoiceInput();
        }
      });

      setAssistantName(nameFromBackend);
      await loadSessions();
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, something went wrong. Check backend terminal.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!userId) {
      alert("Please login first");
      return;
    }

    if (!input.trim() || loading) return;

    const userMessage = input.trim();

    if (fileMode) {
      await askUploadedFile(userMessage);
      return;
    }

    let sessionId = activeSessionId;

    try {
      const authConfig = await getAuthHeaders();

      if (!sessionId) {
        const sessionRes = await axios.post(
          `${API_URL}/api/sessions`,
          {
            title:
              userMessage.length > 32
                ? userMessage.slice(0, 32) + "..."
                : userMessage,
          },
          authConfig
        );

        if (sessionRes.data.success) {
          sessionId = sessionRes.data.session.id;
          setActiveSessionId(sessionId);
          setSessions((prev) => [sessionRes.data.session, ...prev]);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: userMessage,
        },
      ]);

      setInput("");
      setLoading(true);

      const res = await axios.post(
        `${API_URL}/api/chat`,
        {
          message: userMessage,
          sessionId,
        },
        authConfig
      );

      const nameFromBackend = res.data.assistantName || assistantName;

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: res.data.reply,
        },
      ]);

      speakText(res.data.reply, () => {
        if (liveMode) {
          startVoiceInput();
        }
      });

      setAssistantName(nameFromBackend);
      await loadSessions();
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Sorry, something went wrong. Check backend terminal.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stopVoiceSystem = () => {
    setLiveMode(false);
    setListening(false);
    window.speechSynthesis.cancel();
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="app auth-wrapper">
        <div className="auth-card">
          <h1>JARVIS</h1>
          <p>Login to your AI assistant</p>

          <input
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Email"
            type="email"
          />

          <input
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />

          <button onClick={handleAuth} disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Create Account"}
          </button>

          <span
            className="auth-switch"
            onClick={() =>
              setAuthMode(authMode === "login" ? "signup" : "login")
            }
          >
            {authMode === "login"
              ? "New user? Create account"
              : "Already have account? Login"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>{assistantName.toUpperCase()}</h2>

        <button className="new-chat" onClick={createNewChat}>
          + New Chat
        </button>

        <button className="logout-btn" onClick={logout}>
          Logout
        </button>

        <div className="settings-box">
          <p>Assistant Settings</p>

          <label>Assistant Name</label>
          <input
            value={assistantName}
            onChange={(e) => setAssistantName(e.target.value)}
            placeholder="Enter assistant name"
          />

          <label>Personality</label>
          <select
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
          >
            <option value="friendly">Friendly</option>
            <option value="professional">Professional</option>
            <option value="formal">Formal</option>
            <option value="sarcastic">Sarcastic</option>
          </select>

          <label>Voice Output</label>
          <select
            value={voiceOutput ? "on" : "off"}
            onChange={(e) => setVoiceOutput(e.target.value === "on")}
          >
            <option value="on">Voice On</option>
            <option value="off">Voice Off</option>
          </select>

          <label>Live Voice Mode</label>
          <select
            value={liveMode ? "on" : "off"}
            onChange={(e) => setLiveMode(e.target.value === "on")}
          >
            <option value="off">Live Mode Off</option>
            <option value="on">Live Mode On</option>
          </select>

          <button onClick={saveSettings} disabled={settingsLoading}>
            {settingsLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>

        <div className="memory-box">
          <p>Memory Controls</p>

          <button onClick={clearCurrentChat}>Clear Current Chat</button>

          <button className="export-memory" onClick={exportCurrentChat}>
            Export Current Chat
          </button>

          <button className="danger-memory" onClick={clearAllMemory}>
            Clear All Memory
          </button>
        </div>

        <div className="file-box">
          <p>File Tools</p>

          <label className="file-upload-btn">
            Upload TXT/PDF & Summarize
            <input
              type="file"
              accept=".txt,.pdf"
              onChange={summarizeTextFile}
              hidden
            />
          </label>

          {fileMode && (
            <button className="file-clear-btn" onClick={clearUploadedFile}>
              Clear File Q&A
            </button>
          )}

          {fileMode && uploadedFileName && (
            <small className="file-status">Active: {uploadedFileName}</small>
          )}
        </div>

        <div className="history">
          <p>Recent Chats</p>

          <input
            className="chat-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
          />

          {sessions.length === 0 ? (
            <div className="chat-item">No chats yet</div>
          ) : filteredSessions.length === 0 ? (
            <div className="chat-item">No matching chats</div>
          ) : (
            filteredSessions.map((session) => (
              <div
                key={session.id}
                className={`chat-item chat-row ${
                  activeSessionId === session.id ? "active-chat" : ""
                }`}
                onClick={() => openSession(session.id)}
              >
                <span className="chat-title">
                  {session.pinned ? "📌 " : ""}
                  {session.title}
                </span>

                <div className="chat-actions">
                  <button onClick={(e) => renameChat(e, session)}>Edit</button>

                  <button onClick={(e) => togglePinChat(e, session)}>
                    {session.pinned ? "Unpin" : "Pin"}
                  </button>

                  <button onClick={(e) => deleteChat(e, session.id)}>
                    Del
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="chat-area">
        <header className="topbar">
          <div>
            <h1>{assistantName} AI Assistant</h1>
            <span>
              Online • Memory Enabled • {personality}{" "}
              {liveMode ? "• Live Voice ON" : ""}
              {fileMode ? " • File Q&A ON" : ""}
            </span>
          </div>
        </header>

        <section className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.role === "user" ? "user" : "ai"}`}
            >
              <strong>{msg.role === "user" ? "You" : assistantName}</strong>
              <p>{msg.text}</p>
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <strong>{assistantName}</strong>
              <p>Thinking...</p>
            </div>
          )}
        </section>

        <footer className="input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleEnter}
            placeholder={
              fileMode
                ? `Ask about ${uploadedFileName || "uploaded file"}...`
                : `Message ${assistantName}...`
            }
          />

          <button
            className="voice-btn"
            onClick={startVoiceInput}
            disabled={loading || listening}
          >
            {listening ? "Listening..." : "🎙"}
          </button>

          <button className="voice-btn" onClick={stopVoiceSystem}>
            🔇
          </button>

          <button onClick={sendMessage} disabled={loading}>
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}