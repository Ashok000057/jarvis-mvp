import express from "express";
import axios from "axios";
import { verifyUser } from "../middleware/authMiddleware.js";
import { getAIResponse } from "../services/aiService.js";
import { getAssistantSettings } from "../services/settingsService.js";

const router = express.Router();

router.post("/search", verifyUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: "Search query is required",
      });
    }

    if (!process.env.SERPAPI_KEY) {
      return res.status(500).json({
        success: false,
        error: "SERPAPI_KEY missing in backend .env",
      });
    }

    const searchQuery = query.trim();

    const searchResponse = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: searchQuery,
        api_key: process.env.SERPAPI_KEY,
        num: 5,
      },
      timeout: 25000,
    });

    const organicResults = searchResponse.data.organic_results || [];

    const sources = organicResults.slice(0, 5).map((item, index) => ({
      index: index + 1,
      title: item.title || "Untitled",
      link: item.link || "",
      snippet: item.snippet || "",
    }));

    const settings = await getAssistantSettings(userId);

    const sourceText = sources
      .map(
        (source) =>
          `${source.index}. ${source.title}\nURL: ${source.link}\nSnippet: ${source.snippet}`
      )
      .join("\n\n");

    const aiPrompt = `
You are a real-time web research assistant.

User query:
${searchQuery}

Search results:
${sourceText || "No search results found."}

Task:
- Give a clear and useful answer based on the search results.
- Mention that the information is based on live web search.
- Include important points.
- If search results are weak, say that clearly.
- Reply in the same language style as the user.
- At the end, list source titles with URLs.
`;

    const answer = await getAIResponse(aiPrompt, [], settings);

    res.json({
      success: true,
      query: searchQuery,
      answer,
      sources,
    });
  } catch (error) {
    console.error("Web search error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      error: error.message || "Web search failed",
    });
  }
});

export default router;