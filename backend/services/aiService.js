import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const FREE_MODELS = [
  "openrouter/free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
];

export async function getAIResponse(message, memory = [], settings = {}) {
  const assistantName = settings.assistant_name || "Jarvis";
  const personality = settings.personality || "friendly";

  const memoryText = memory
    .map((item) => `User: ${item.message}\n${assistantName}: ${item.response}`)
    .join("\n\n");

  const systemPrompt = `
You are ${assistantName}, a smart personal AI assistant.

Personality:
${personality}

Rules:
- Your assistant name is ${assistantName}.
- Always behave according to the selected personality.
- Give clear, useful and practical answers.
- Use previous memory when helpful.
- If user asks you to remember something, treat it as important.
- Be honest if you do not know something.
- Reply in the same language style as user when possible.

Previous memory:
${memoryText || "No previous memory yet."}
`;

  let lastError = null;

  for (const model of FREE_MODELS) {
    try {
      console.log(`Trying AI model: ${model}`);

      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:5173",
            "X-Title": "Jarvis MVP",
          },
          timeout: 35000,
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      lastError = error.response?.data || error.message;
      console.error(`Model failed: ${model}`, lastError);
    }
  }

  throw new Error("AI models are slow or temporarily unavailable. Please retry.");
}