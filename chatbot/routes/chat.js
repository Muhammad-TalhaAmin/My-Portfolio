import express from "express";
import { askAI, streamAI } from "../services/aiService.js";
import { buildContext } from "../services/knowledgeRouter.js";

const router = express.Router();

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 8;

function buildSystemPrompt(context) {
  return `You are Muhammad Talha Amin's professional AI portfolio assistant, embedded on his personal website.

You have two sources of knowledge:
1. CONTEXT below — verified facts about Talha: his education, skills, experience, certifications, achievements, contact info, and his individual projects.
2. Your own general knowledge of computer science, data science, machine learning, and programming.

How to decide which to use:
- Questions about Talha himself, his background, resume, or a specific project: answer strictly from CONTEXT. If the answer isn't in CONTEXT, say "I don't have that information yet." Never invent personal facts about him.
- General technical or educational questions (e.g. explaining OOP, REST APIs, JWT, SQL vs NoSQL, Git, Docker, Linux, networking, operating systems, databases, algorithms, data structures, machine learning / deep learning concepts, or help with Python, C++, JavaScript, HTML, CSS, Flask, FastAPI, Node.js, SQL): answer accurately and educationally from your own knowledge, even if it isn't mentioned in CONTEXT.
- Questions that combine both (e.g. "which ML technique does your Music Recommender project use, and how does that technique work in general?"): answer the project-specific part from CONTEXT and the general concept from your own knowledge, woven into one coherent answer.

Formatting rules for the chat widget (it renders a limited subset of markdown):
- Do NOT use markdown headers (#), tables, or blockquotes.
- You may use **bold**, *italics*, "-" bullet lists, inline \`code\`, and fenced \`\`\`code blocks\`\`\` for snippets.
- Keep answers concise and conversational — a short paragraph or a few bullet points, not a full essay.

CONTEXT:

${context || "(no additional context needed for this question)"}`;
}

function validateMessage(message) {
  if (typeof message !== "string") {
    return "Message is required and must be a string.";
  }
  const trimmed = message.trim();
  if (!trimmed) {
    return "Message cannot be empty.";
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`;
  }
  return null;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (entry) =>
        entry && (entry.role === "user" || entry.role === "assistant") && typeof entry.content === "string"
    )
    .slice(-MAX_HISTORY_MESSAGES);
}

router.post("/", async (req, res) => {
  const body = req.body || {};
  const { message, history } = body;

  const validationError = validateMessage(message);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const trimmedMessage = message.trim();
  const safeHistory = sanitizeHistory(history);
  const wantsStream = req.query.stream === "1" || req.headers.accept === "text/event-stream";

  let context = "";
  try {
    context = await buildContext(trimmedMessage, safeHistory);
  } catch (error) {
    // Missing/unreadable knowledge files shouldn't crash the request — fall
    // back to answering with the model's general knowledge only.
    console.error("Knowledge load error:", error);
  }

  const systemPrompt = buildSystemPrompt(context);

  // Default JSON path — preserves the original response contract for any
  // existing caller that doesn't explicitly ask for a stream.
  if (!wantsStream) {
    try {
      const reply = await askAI(systemPrompt, trimmedMessage, safeHistory);
      return res.json({ reply });
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(502).json({ error: error.message || "Internal Server Error" });
    }
  }

  // Streaming (SSE) path.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let clientClosed = false;
  req.on("close", () => {
    clientClosed = true;
  });

  try {
    for await (const token of streamAI(systemPrompt, trimmedMessage, safeHistory)) {
      if (clientClosed) break;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }
    if (!clientClosed) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    }
  } catch (error) {
    console.error("Streaming error:", error);
    if (!clientClosed) {
      res.write(`data: ${JSON.stringify({ error: error.message || "Something went wrong." })}\n\n`);
    }
  } finally {
    if (!clientClosed) {
      res.end();
    }
  }
});

export default router;
