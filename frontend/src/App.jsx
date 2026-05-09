import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CREATOR_TOOLS = [
  {
    id: "youtube_script",
    icon: "🎬",
    title: "YouTube Script",
    instruction:
      "Create a full YouTube video script with hook, intro, main points, examples, outro and CTA.",
  },
  {
    id: "shorts_script",
    icon: "📱",
    title: "Shorts/Reels Script",
    instruction:
      "Create a 30-60 second short video script with hook, quick value and strong ending.",
  },
  {
    id: "title_ideas",
    icon: "🔥",
    title: "Title Ideas",
    instruction:
      "Generate 10 high-CTR YouTube title ideas with curiosity and SEO value.",
  },
  {
    id: "thumbnail_prompt",
    icon: "🖼️",
    title: "Thumbnail Prompt",
    instruction:
      "Create a professional AI image prompt for a high-CTR YouTube thumbnail.",
  },
  {
    id: "description_tags",
    icon: "🏷️",
    title: "Description + Tags",
    instruction:
      "Create SEO-friendly YouTube description, hashtags and video tags.",
  },
  {
    id: "full_package",
    icon: "🚀",
    title: "Full Creator Package",
    instruction:
      "Create title ideas, hook, full script, shorts script, thumbnail prompt, description, tags and pinned comment.",
  },
];

const PROMPT_TEMPLATES = [
  {
    title: "YouTube Script",
    prompt:
      "Mere liye ek YouTube video script likho topic: [topic]. Isme strong hook, intro, main points, examples, outro aur CTA include karo.",
  },
  {
    title: "Study Notes",
    prompt:
      "Is topic par easy study notes banao: [topic]. Short explanation, bullet points, examples aur revision summary do.",
  },
  {
    title: "Email Writer",
    prompt:
      "Mere liye ek professional email likho. Context: [context]. Tone polite aur clear hona chahiye.",
  },
  {
    title: "Instagram Caption",
    prompt:
      "Is topic/product ke liye engaging Instagram caption likho: [topic]. Hashtags aur hook bhi add karo.",
  },
  {
    title: "Business Plan",
    prompt:
      "Mere business idea ke liye simple business plan banao: [idea]. Target audience, features, pricing aur marketing plan do.",
  },
  {
    title: "Code Helper",
    prompt:
      "Mujhe is coding problem me help karo: [problem]. Step-by-step explain karo aur working code do.",
  },
  {
    title: "Image Prompt",
    prompt:
      "Mere simple idea ko ek professional AI image prompt me convert karo: [idea]. Cinematic details, lighting, style aur quality keywords add karo.",
  },
  {
    title: "PDF Notes",
    prompt:
      "Uploaded PDF/file se short notes banao. Important points, summary, questions and answers, aur exam revision points do.",
  },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

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
  const [imageMode, setImageMode] = useState(false);
  const [visibleEnhancedPromptId, setVisibleEnhancedPromptId] = useState(null);
  const [creatorMode, setCreatorMode] = useState(false);

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [visiblePromptId, setVisiblePromptId] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [creatorPanelOpen, setCreatorPanelOpen] = useState(false);
  const [creatorTopic, setCreatorTopic] = useState("");
  const [creatorTool, setCreatorTool] = useState("full_package");
  
  const [libraryOpen, setLibraryOpen] = useState(false); 
  const [savedOutputs, setSavedOutputs] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [visibleOutputId, setVisibleOutputId] = useState(null);

  const [stats, setStats] = useState({
    totalChats: 0,
    savedImages: 0,
  });
  const fileInputRef = useRef(null);

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
    loadGallery();
    setCurrentView("dashboard");
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
    setImageMode(false);
    setCreatorMode(false);
    setSidebarOpen(false);

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
  const loadedSessions = res.data.sessions || [];

  setSessions(loadedSessions);
  setStats((prev) => ({
    ...prev,
    totalChats: loadedSessions.length,
  }));

  if (loadedSessions.length > 0 && !activeSessionId) {
    setActiveSessionId(loadedSessions[0].id);
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
        setSidebarOpen(false);
        setFileMode(false);
        setUploadedFileName("");
        setImageMode(false);

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
      setSidebarOpen(false);
      setImageMode(false);

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
        setFileMode(false);
        setUploadedFileName("");
        setImageMode(false);

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
      setFileMode(false);
      setUploadedFileName("");
      setImageMode(false);

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

    setAttachmentMenuOpen(false);
    setImageMode(false);

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
      setAttachmentMenuOpen(false);

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

  const goToChat = () => {
  setCurrentView("chat");
  setSidebarOpen(false);
};

const dashboardNewChat = async () => {
  setCurrentView("chat");
  await createNewChat();
};

const dashboardOpenGallery = async () => {
  setCurrentView("gallery");
  setGalleryOpen(true);
  await loadGallery();
};

const dashboardGenerateImage = () => {
  setCurrentView("chat");
  startImageMode();
};

const dashboardUploadFile = () => {
  setCurrentView("chat");
  setTimeout(() => {
    openFilePicker();
  }, 200);
};

const dashboardCreatorTools = () => {
  setCurrentView("chat");
  startCreatorMode();
};

  const openFilePicker = () => {
    setAttachmentMenuOpen(false);
    setImageMode(false);
    fileInputRef.current?.click();
  };

  const openCreatorPanel = () => {
  setAttachmentMenuOpen(false);
  setCreatorPanelOpen(true);
};

const closeCreatorPanel = () => {
  setCreatorPanelOpen(false);
  setCreatorTopic("");
};

const generateCreatorContent = async () => {
  if (!creatorTopic.trim()) {
    alert("Topic required");
    return;
  }

  const selectedTool =
    CREATOR_TOOLS.find((tool) => tool.id === creatorTool) ||
    CREATOR_TOOLS[0];

  const creatorPrompt = `
You are a professional content creator, YouTube strategist, script writer and social media expert.

Task:
${selectedTool.instruction}

Topic:
${creatorTopic}

Rules:
- Make output practical and ready to use.
- Use strong hooks.
- Use simple language.
- Reply in the same language style as user.
- Use clear headings.
- Add examples where helpful.
`;

  let sessionId = activeSessionId;

  try {
    const authConfig = await getAuthHeaders();

    if (!sessionId) {
      const sessionRes = await axios.post(
        `${API_URL}/api/sessions`,
        {
          title:
            creatorTopic.length > 32
              ? creatorTopic.slice(0, 32) + "..."
              : creatorTopic,
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
        text: `${selectedTool.title}: ${creatorTopic}`,
      },
    ]);

    setCreatorPanelOpen(false);
    setLoading(true);

    const res = await axios.post(
      `${API_URL}/api/chat`,
      {
        message: creatorPrompt,
        sessionId,
      },
      authConfig
    );

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: res.data.reply,
      },
    ]);

    speakText(res.data.reply);
    await loadSessions();
  } catch (error) {
    console.error("Creator tools error:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Creator tools failed. Check backend terminal.",
      },
    ]);
  } finally {
    setLoading(false);
  }
};

  const startImageMode = () => {
    setAttachmentMenuOpen(false);
    setFileMode(false);
    setImageMode(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Image mode ON. Chatbox me image prompt likho aur Send dabao.",
      },
    ]);
  };

  const startCreatorMode = () => {
  setAttachmentMenuOpen(false);
  setFileMode(false);
  setImageMode(false);
  setCreatorMode(true);

  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      text:
        "Creator Mode ON. Chatbox me topic likho, main YouTube title, script, thumbnail prompt, description, tags aur shorts idea bana dunga.",
    },
  ]);
};

const exitCreatorMode = () => {
  setCreatorMode(false);
  setAttachmentMenuOpen(false);

  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      text: "Creator Mode OFF. You can continue normal chat.",
    },
  ]);
};

const generateCreatorPackage = async (topic) => {
  if (!topic || !topic.trim()) return;

  const creatorPrompt = `
You are a professional YouTube content strategist and script writer.

Create a complete creator package for this topic:
${topic}

Return in this format:

1. Viral Title Ideas
- Give 5 strong YouTube title options.

2. Best Hook
- Write a powerful first 10 seconds hook.

3. Full YouTube Script
- Intro
- Main points
- Examples
- Smooth transitions
- Outro
- Call to action

4. Shorts/Reels Version
- 30-60 second short video script.

5. Thumbnail Text Ideas
- Give 5 short high-CTR thumbnail text options.

6. Thumbnail Image Prompt
- Give a professional AI image prompt for thumbnail generation.

7. Video Description
- SEO friendly description.

8. Tags
- Give relevant tags.

9. Pinned Comment
- Give an engaging pinned comment.

Keep it practical, clear, and creator-friendly.
Reply in the same language style as the user.
`;

  try {
    const authConfig = await getAuthHeaders();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `Creator topic: ${topic}`,
      },
    ]);

    setInput("");
    setLoading(true);

    const res = await axios.post(
      `${API_URL}/api/chat`,
      {
        message: creatorPrompt,
        sessionId: activeSessionId,
      },
      authConfig
    );

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: res.data.reply,
      },
    ]);

    speakText(res.data.reply);
    await loadSessions();
  } catch (error) {
    console.error("Creator tools error:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Creator package failed. Check backend terminal.",
      },
    ]);
  } finally {
    setLoading(false);
  }
};

  const exitImageMode = () => {
    setImageMode(false);
    setAttachmentMenuOpen(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Image mode OFF. You can continue normal chat.",
      },
    ]);
  };

  const loadContentLibrary = async () => {
  try {
    const authConfig = await getAuthHeaders();

    setLibraryLoading(true);

    const res = await axios.get(`${API_URL}/api/outputs`, authConfig);

    if (res.data.success) {
      setSavedOutputs(res.data.outputs || []);
    }
  } catch (error) {
    console.error("Load content library error:", error);
    alert("Failed to load content library.");
  } finally {
    setLibraryLoading(false);
  }
};

const openContentLibrary = async () => {
  setCurrentView("library");
  setLibraryOpen(true);
  setGalleryOpen(false);
  setSidebarOpen(false);
  setVisibleOutputId(null);
  await loadContentLibrary();
};

const saveOutputToLibrary = async (content, type = "general") => {
  if (!content || !content.trim()) {
    alert("Nothing to save");
    return;
  }

  const titleInput = window.prompt("Save title:", type + " output");

  if (!titleInput || !titleInput.trim()) return;

  try {
    const authConfig = await getAuthHeaders();

    const res = await axios.post(
      `${API_URL}/api/outputs/save`,
      {
        title: titleInput.trim(),
        content,
        type,
      },
      authConfig
    );

    if (res.data.success) {
      alert("Saved to Content Library ✅");
      await loadContentLibrary();
    }
  } catch (error) {
    console.error("Save output error:", error);
    alert("Failed to save output.");
  }
};

const deleteSavedOutput = async (id) => {
  const confirmDelete = window.confirm("Delete this saved output?");
  if (!confirmDelete) return;

  try {
    const authConfig = await getAuthHeaders();

    await axios.delete(`${API_URL}/api/outputs/${id}`, authConfig);

    setSavedOutputs((prev) => prev.filter((item) => item.id !== id));
  } catch (error) {
    console.error("Delete saved output error:", error);
    alert("Failed to delete saved output.");
  }
};

const copySavedOutput = async (content) => {
  try {
    await navigator.clipboard.writeText(content);
    alert("Copied ✅");
  } catch (error) {
    alert("Copy failed");
  }
};

  const generateImageFromPrompt = async (prompt) => {
  if (!prompt || !prompt.trim()) return;

  try {
    const authConfig = await getAuthHeaders();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: `Generate image: ${prompt}`,
      },
    ]);

    setInput("");
    setLoading(true);

    const res = await axios.post(
      `${API_URL}/api/image/generate`,
      {
        prompt,
      },
      authConfig
    );

    if (res.data.success) {
      const imageMessageId = `img-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        {
          id: imageMessageId,
          role: "ai_image",
          text: `Generated image for: ${res.data.originalPrompt || prompt}`,
          originalPrompt: res.data.originalPrompt || prompt,
          enhancedPrompt: res.data.enhancedPrompt || res.data.prompt || prompt,
          imageUrl: res.data.imageUrl,
        },
      ]);
    }
  } catch (error) {
    console.error("Image generation error:", error);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: "Image generation failed. Check backend terminal.",
      },
    ]);
  } finally {
    setLoading(false);
  }
};

  const loadGallery = async () => {
  try {
    const authConfig = await getAuthHeaders();

    setGalleryLoading(true);

    const res = await axios.get(`${API_URL}/api/gallery`, authConfig);

    if (res.data.success) {
  const images = res.data.images || [];

  setGalleryImages(images);
  setStats((prev) => ({
    ...prev,
    savedImages: images.length,
  }));
}
  } catch (error) {
    console.error("Load gallery error:", error);
    alert("Failed to load gallery. Check backend.");
  } finally {
    setGalleryLoading(false);
  }
};

const openGallery = async () => {
  setGalleryOpen(true);
  setSidebarOpen(false);
  setVisiblePromptId(null);
  await loadGallery();
};

const saveImageToGallery = async (prompt, imageUrl) => {
  try {
    const authConfig = await getAuthHeaders();

    const res = await axios.post(
      `${API_URL}/api/gallery/save`,
      {
        prompt,
        imageUrl,
      },
      authConfig
    );

    if (res.data.success) {
      alert("Image saved to gallery ✅");
      await loadGallery();
    }
  } catch (error) {
    console.error("Save image error:", error);
    alert("Failed to save image. Check backend.");
  }
};

const deleteGalleryImage = async (id) => {
  const confirmDelete = window.confirm("Delete this saved image?");
  if (!confirmDelete) return;

  try {
    const authConfig = await getAuthHeaders();

    await axios.delete(`${API_URL}/api/gallery/${id}`, authConfig);

    setGalleryImages((prev) => prev.filter((img) => img.id !== id));
  } catch (error) {
    console.error("Delete gallery image error:", error);
    alert("Failed to delete image. Check backend.");
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
          if (imageMode) {
            generateImageFromPrompt(transcript);
          } else if (fileMode) {
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

    if (creatorMode) {
  await generateCreatorPackage(userMessage);
  return;
}

if (imageMode) {
  await generateImageFromPrompt(userMessage);
  return;
}

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

  const applyPromptTemplate = (template) => {
  setImageMode(false);

  setInput(template.prompt);

  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      text: `Template selected: ${template.title}. Prompt ko edit karke Send dabao.`,
    },
  ]);
};

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user && !showAuth) {
  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div className="landing-logo">JARVIS</div>

        <button className="landing-login-btn" onClick={() => setShowAuth(true)}>
          Login / Signup
        </button>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">AI Assistant • Voice • PDF • Images</div>

          <h1>
            Your Personal <span>Jarvis AI</span> Assistant
          </h1>

          <p>
            Chat, summarize PDF/TXT files, ask questions from documents,
            generate images, use voice mode, save chats, and customize your own
            AI assistant name and personality.
          </p>

          <div className="hero-actions">
            <button onClick={() => setShowAuth(true)}>Get Started Free</button>

            <a href="#features">Explore Features</a>
          </div>
        </div>

        <div className="hero-card">
          <div className="orb"></div>
          <h3>Jarvis Core Online</h3>
          <p>Memory Enabled</p>
          <p>Voice Mode Ready</p>
          <p>File Q&A Active</p>
          <p>Image Generation Ready</p>
        </div>
      </section>

      <section id="features" className="features-section">
        <h2>What You Can Do</h2>

        <div className="features-grid">
          <div className="feature-card">
            <h3>AI Chat</h3>
            <p>Talk with your customizable personal assistant.</p>
          </div>

          <div className="feature-card">
            <h3>Smart Memory</h3>
            <p>Save chats, recent conversations, and assistant settings.</p>
          </div>

          <div className="feature-card">
            <h3>PDF/TXT Summary</h3>
            <p>Upload files and get summaries instantly.</p>
          </div>

          <div className="feature-card">
            <h3>File Q&A</h3>
            <p>Ask questions directly from uploaded documents.</p>
          </div>

          <div className="feature-card">
            <h3>Voice Mode</h3>
            <p>Speak to Jarvis and listen to AI replies.</p>
          </div>

          <div className="feature-card">
            <h3>Image Generator</h3>
            <p>Create images from prompts inside the chatbox.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2>Build, Learn, Create — Faster</h2>
        <p>Start using your AI assistant now.</p>
        <button onClick={() => setShowAuth(true)}>Start Free</button>
      </section>
    </div>
  );
}

if (!user && showAuth) {
  return (
    <div className="app auth-wrapper">
      <div className="auth-card">
        <button className="auth-back-btn" onClick={() => setShowAuth(false)}>
          ← Back
        </button>

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
      <button
        className={`sidebar-toggle ${sidebarOpen ? "hide-toggle" : ""}`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        ☰
      </button>

      

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>{assistantName.toUpperCase()}</h2>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <button
  className="dashboard-btn"
  onClick={() => {
    setCurrentView("dashboard");
    setSidebarOpen(false);
    setGalleryOpen(false);
  }}
>
  Dashboard
</button>

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
        <div className="library-box">
  <p>Content Library</p>

  <button onClick={openContentLibrary}>
    Open Saved Outputs
  </button>
</div>

<div className="gallery-box">
  <p>Image Gallery</p>

  <button onClick={openGallery}>
    Open Saved Gallery
  </button>
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
              {imageMode ? " • Image Mode ON" : ""}
              {creatorMode ? " • Creator Mode ON" : ""}

            </span>
          </div>
        </header>

        <div className="prompt-template-bar">
  {PROMPT_TEMPLATES.map((template) => (
    <button
      key={template.title}
      onClick={() => applyPromptTemplate(template)}
      disabled={loading}
    >
      {template.title}
    </button>
  ))}
</div>

<section className="messages">
  {creatorPanelOpen && currentView !== "dashboard" && currentView !== "library" && !galleryOpen && (
    <div className="creator-panel">
      <div className="creator-panel-header">
        <div>
          <h2>Creator Tools</h2>
          <p>Choose a tool, enter your topic, and generate ready-to-use content.</p>
        </div>

        <button onClick={closeCreatorPanel}>×</button>
      </div>

      <div className="creator-tools-grid">
        {CREATOR_TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={creatorTool === tool.id ? "active-creator-tool" : ""}
            onClick={() => setCreatorTool(tool.id)}
          >
            <span>{tool.icon}</span>
            {tool.title}
          </button>
        ))}
      </div>

      <div className="creator-topic-box">
        <label>Topic / Idea</label>

        <textarea
          value={creatorTopic}
          onChange={(e) => setCreatorTopic(e.target.value)}
          placeholder="Example: AI tools for students, how to make money online, best study apps..."
        />

        <button onClick={generateCreatorContent} disabled={loading}>
          {loading ? "Generating..." : "Generate Content"}
        </button>
      </div>
    </div>
  )}

  {currentView === "dashboard" ? (
    <div className="dashboard-view">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-badge">Welcome back</p>
          <h2>{assistantName} Dashboard</h2>
          <p>
            Your AI workspace for chat, files, voice, images, and creator tools.
          </p>
        </div>

        <button onClick={dashboardNewChat}>Start New Chat</button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span>Total Chats</span>
          <strong>{stats.totalChats}</strong>
        </div>

        <div className="stat-card">
          <span>Saved Images</span>
          <strong>{stats.savedImages}</strong>
        </div>

        <div className="stat-card">
          <span>Assistant</span>
          <strong>{assistantName}</strong>
        </div>

        <div className="stat-card">
          <span>Personality</span>
          <strong>{personality}</strong>
        </div>
      </div>

      <div className="quick-actions-section">
        <h3>Quick Actions</h3>

        <div className="quick-actions-grid">
          <button onClick={dashboardNewChat}>
            <span>💬</span>
            New Chat
          </button>

          <button onClick={dashboardUploadFile}>
            <span>📄</span>
            Upload PDF/TXT
          </button>

          <button onClick={dashboardGenerateImage}>
            <span>🎨</span>
            Generate Image
          </button>

          <button onClick={dashboardOpenGallery}>
            <span>🖼️</span>
            Open Gallery
          </button>

          <button onClick={dashboardCreatorTools}>
            <span>🎬</span>
            Creator Tools
          </button>

          <button onClick={goToChat}>
            <span>⚡</span>
            Continue Chat
          </button>
        </div>
      </div>

      <div className="dashboard-recent">
        <h3>Recent Chats</h3>

        {sessions.length === 0 ? (
          <p>No chats yet. Start your first conversation.</p>
        ) : (
          sessions.slice(0, 5).map((session) => (
            <button
              key={session.id}
              onClick={() => {
                setCurrentView("chat");
                openSession(session.id);
              }}
            >
              {session.pinned ? "📌 " : ""}
              {session.title}
            </button>
          ))
        )}
      </div>
    </div>
  ) : currentView === "library" ? (
    <div className="content-library-view">
      <div className="content-library-header">
        <div>
          <h2>Content Library</h2>
          <p>Your saved AI outputs are stored here.</p>
        </div>

        <button
          onClick={() => {
            setCurrentView("chat");
            setLibraryOpen(false);
            setVisibleOutputId(null);
          }}
        >
          Back to Chat
        </button>
      </div>

      {libraryLoading ? (
        <div className="library-empty">Loading saved outputs...</div>
      ) : savedOutputs.length === 0 ? (
        <div className="library-empty">No saved outputs yet.</div>
      ) : (
        <div className="library-list">
          {savedOutputs.map((item) => (
            <div className="library-card" key={item.id}>
              <div className="library-card-top">
                <div>
                  <h3>{item.title}</h3>
                  <span>{item.type}</span>
                </div>

                <small>{new Date(item.created_at).toLocaleDateString()}</small>
              </div>

              <div className="library-actions">
                <button
                  onClick={() =>
                    setVisibleOutputId(
                      visibleOutputId === item.id ? null : item.id
                    )
                  }
                >
                  {visibleOutputId === item.id ? "Hide" : "Open"}
                </button>

                <button onClick={() => copySavedOutput(item.content)}>
                  Copy
                </button>

                <button
                  className="delete-library-btn"
                  onClick={() => deleteSavedOutput(item.id)}
                >
                  Delete
                </button>
              </div>

              {visibleOutputId === item.id && (
                <div className="library-content">{item.content}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : galleryOpen ? (
    <div className="main-gallery-view">
      <div className="main-gallery-header">
        <div>
          <h2>Saved Image Gallery</h2>
          <p>Your generated images are saved here.</p>
        </div>

        <button
          onClick={() => {
            setGalleryOpen(false);
            setCurrentView("chat");
            setVisiblePromptId(null);
          }}
        >
          Back to Chat
        </button>
      </div>

      {galleryLoading ? (
        <div className="gallery-empty-main">Loading gallery...</div>
      ) : galleryImages.length === 0 ? (
        <div className="gallery-empty-main">No saved images yet.</div>
      ) : (
        <div className="main-gallery-grid">
          {galleryImages.map((img) => (
            <div className="main-gallery-card" key={img.id}>
              <img src={img.image_url} alt={img.prompt} />

              <div className="main-gallery-actions">
                <a href={img.image_url} target="_blank" rel="noreferrer">
                  Open
                </a>

                <button
                  onClick={() =>
                    setVisiblePromptId(
                      visiblePromptId === img.id ? null : img.id
                    )
                  }
                >
                  Prompt
                </button>

                <button
                  className="delete-gallery-btn"
                  onClick={() => deleteGalleryImage(img.id)}
                >
                  Delete
                </button>
              </div>

              {visiblePromptId === img.id && (
                <div className="gallery-prompt-box">{img.prompt}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : (
    <>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.role === "user" ? "user" : "ai"}`}
        >
          <strong>{msg.role === "user" ? "You" : assistantName}</strong>
          <p>{msg.text}</p>

          {msg.role === "ai" && (
            <div className="message-actions">
              <button onClick={() => saveOutputToLibrary(msg.text, "ai_output")}>
                Save Output
              </button>

              <button onClick={() => copySavedOutput(msg.text)}>Copy</button>
            </div>
          )}

          {msg.role === "ai_image" && msg.imageUrl && (
            <div className="generated-image-box">
              <a
                href={msg.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="generated-image-link"
              >
                <img
                  src={msg.imageUrl}
                  alt={msg.text}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </a>

              <div className="image-actions">
                <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                  Open Image
                </a>

                <button
                  onClick={() =>
                    saveImageToGallery(
                      msg.enhancedPrompt || msg.originalPrompt || msg.text,
                      msg.imageUrl
                    )
                  }
                >
                  Save Image
                </button>

                <button
                  onClick={() =>
                    setVisibleEnhancedPromptId(
                      visibleEnhancedPromptId === msg.id ? null : msg.id
                    )
                  }
                >
                  Prompt
                </button>
              </div>

              {visibleEnhancedPromptId === msg.id && (
                <div className="enhanced-prompt-box">
                  <strong>Original:</strong>
                  <p>{msg.originalPrompt}</p>

                  <strong>Enhanced:</strong>
                  <p>{msg.enhancedPrompt}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="message ai">
          <strong>{assistantName}</strong>
          <p>Thinking...</p>
        </div>
      )}
    </>
  )}
</section>

        <footer className="input-area">
          <div className="attachment-wrapper">
            <button
              className="plus-btn"
              onClick={() => setAttachmentMenuOpen((prev) => !prev)}
              disabled={loading}
              aria-label="Open attachments menu"
            >
              +
            </button>

            {currentView !== "dashboard" &&
  currentView !== "library" &&
  !galleryOpen && (
    <footer className="input-area">
      {/* tumhara existing input-area content yahin rahega */}
    </footer>
  )}

            {attachmentMenuOpen && (
              <div className="attachment-menu">
                <button onClick={openFilePicker}>Upload File</button>

                <button onClick={startImageMode}>Generate Image</button>
                <button onClick={openCreatorPanel}>Creator Tools</button>

{creatorMode && (
  <button className="danger-item" onClick={exitCreatorMode}>
    Exit Creator Mode
  </button>
)}
                {imageMode && (
                  <button className="danger-item" onClick={exitImageMode}>
                    Exit Image Mode
                  </button>
                )}

                {fileMode && (
                  <button className="danger-item" onClick={clearUploadedFile}>
                    Clear File Q&A
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf"
              onChange={summarizeTextFile}
              hidden
            />
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleEnter}
            placeholder={
  creatorMode
    ? "Enter your YouTube/video topic..."
    : imageMode
    ? "Describe image to generate..."
    : fileMode
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