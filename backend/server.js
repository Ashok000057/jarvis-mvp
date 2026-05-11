import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoute from "./routes/chat.js";
import settingsRoute from "./routes/settings.js";
import sessionsRoute from "./routes/sessions.js";
import memoryRoute from "./routes/memory.js";
import filesRoute from "./routes/files.js";
import imageRoute from "./routes/image.js";
import galleryRoute from "./routes/gallery.js";
import outputsRoute from "./routes/outputs.js";
import documentsRoute from "./routes/documents.js";
import webSearchRoute from "./routes/webSearch.js";
import projectsRoute from "./routes/projects.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("CORS blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Jarvis backend is running");
});

app.use("/api/chat", chatRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/sessions", sessionsRoute);
app.use("/api/memory", memoryRoute);
app.use("/api/files", filesRoute);
app.use("/api/image", imageRoute);
app.use("/api/gallery", galleryRoute);
app.use("/api/outputs", outputsRoute);
app.use("/api/documents", documentsRoute);
app.use("/api/web", webSearchRoute);
app.use("/api/projects", projectsRoute);

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Jarvis backend running on port ${PORT}`);
});