import express from "express";
import multer from "multer";
import fs from "fs";
import { PDFParse } from "pdf-parse";
import { verifyUser } from "../middleware/authMiddleware.js";
import { getAIResponse } from "../services/aiService.js";
import { getAssistantSettings } from "../services/settingsService.js";

const router = express.Router();

// Temporary in-memory file context
// Server restart hone ke baad ye memory clear ho jayegi
const fileMemory = new Map();

const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["text/plain", "application/pdf"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt and .pdf files are allowed"));
    }
  },
});

router.post("/summarize", verifyUser, upload.single("file"), async (req, res) => {
  let filePath = null;

  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "File is required",
      });
    }

    filePath = req.file.path;
    let fileText = "";

    if (req.file.mimetype === "text/plain") {
      fileText = fs.readFileSync(filePath, "utf-8");
    }

    if (req.file.mimetype === "application/pdf") {
      const pdfBuffer = fs.readFileSync(filePath);

      const parser = new PDFParse({
        data: pdfBuffer,
      });

      const result = await parser.getText();
      fileText = result.text || "";

      await parser.destroy();
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    if (!fileText.trim()) {
      return res.status(400).json({
        success: false,
        error: "File text could not be extracted or file is empty",
      });
    }

    // Save file text for Q&A
    fileMemory.set(userId, {
      fileName: req.file.originalname,
      text: fileText.slice(0, 20000),
      uploadedAt: new Date().toISOString(),
    });

    const settings = await getAssistantSettings(userId);

    const prompt = `
You are a document summarizer.

Summarize the following document clearly.

Return:
1. Short Summary
2. Key Points
3. Important Details
4. Suggested Next Questions

Document:
${fileText.slice(0, 5000)}
`;

    const summary = await getAIResponse(prompt, [], settings);

    res.json({
      success: true,
      fileName: req.file.originalname,
      summary,
      message: "File summarized and saved for Q&A",
    });
  } catch (error) {
    console.error("File summarize error:", error.message);

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post("/ask", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: "Question is required",
      });
    }

    const fileData = fileMemory.get(userId);

    if (!fileData) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded yet. Please upload a TXT/PDF first.",
      });
    }

    const settings = await getAssistantSettings(userId);

    const prompt = `
You are answering questions from an uploaded document.

Rules:
- Answer only using the document content when possible.
- If answer is not in the document, say: "This information is not available in the uploaded file."
- Keep the answer clear and useful.
- Reply in the same language style as user.

File name:
${fileData.fileName}

Document content:
${fileData.text.slice(0, 15000)}

User question:
${question}
`;

    const answer = await getAIResponse(prompt, [], settings);

    res.json({
      success: true,
      fileName: fileData.fileName,
      answer,
    });
  } catch (error) {
    console.error("File ask error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.delete("/clear", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;

    fileMemory.delete(userId);

    res.json({
      success: true,
      message: "Uploaded file context cleared",
    });
  } catch (error) {
    console.error("Clear file context error:", error.message);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;