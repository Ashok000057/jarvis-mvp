import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function getAIResponse(message, memory = [], settings = {}) {
  const assistantName = settings.assistant_name || "Jarvis";
  const personality = settings.personality || "friendly";

  const memoryText = memory
    .map((item) => `User said: ${item.message}\nAssistant replied: ${item.response}`)
    .join("\n\n");

  const systemPrompt = `
You are an AI assistant.

IDENTITY RULES:
- Your assistant name is "${assistantName}".
- If user asks "tumhara naam kya hai", "what is your name", or similar, reply with "${assistantName}".
- Never say the user's name is your name.
- If memory says "my name is Ashok", it means the USER name is Ashok, not assistant name.
- Your personality is: ${personality}.

MEMORY RULES:
- Previous memory is about the USER and past conversation.
- Use memory only to understand the user.
- Do not confuse user identity with assistant identity.

RESPONSE RULES:
- Reply in the same language style as user.
- Keep answers clear and useful.
- Be honest if you do not know something.

Previous memory:
${memoryText || "No previous memory yet."}
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openrouter/free",
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
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "Jarvis MVP",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI API error:", error.response?.data || error.message);
    throw new Error("AI response failed");
  }
}