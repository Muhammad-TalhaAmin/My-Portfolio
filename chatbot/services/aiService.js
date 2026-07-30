import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";
const MAX_TOKENS = 700;
const TEMPERATURE = 0.3;
const REQUEST_TIMEOUT_MS = 30000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_MESSAGE_LENGTH = 2000;

function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Turns whatever the Groq SDK throws into a short, user-safe message so the
 * chat widget never surfaces a raw stack trace or provider error string.
 */
function toUserFacingError(error) {
  const status = error?.status || error?.response?.status;

  if (status === 429) {
    return "I'm getting a lot of requests right now — please try again in a few seconds.";
  }
  if (status && status >= 500) {
    return "The AI service is temporarily unavailable. Please try again shortly.";
  }
  if (error?.message?.includes("timed out")) {
    return "That took too long to respond. Please try again.";
  }
  if (error?.message?.includes("Empty response") || error?.message?.includes("empty response")) {
    return "The model returned an empty response. Please try again.";
  }
  return "Something went wrong while generating a response. Please try again.";
}

function buildMessages(systemPrompt, userMessage, history) {
  const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY_MESSAGES) : [];

  const historyMessages = trimmedHistory
    .filter(
      (entry) =>
        entry &&
        typeof entry.content === "string" &&
        (entry.role === "user" || entry.role === "assistant")
    )
    .map((entry) => ({
      role: entry.role,
      content: entry.content.slice(0, MAX_HISTORY_MESSAGE_LENGTH),
    }));

  return [
    { role: "system", content: systemPrompt },
    ...historyMessages,
    { role: "user", content: userMessage },
  ];
}

/**
 * Non-streaming completion. Kept alongside streamAI so the /api/chat route
 * can still serve a plain JSON reply for any caller that doesn't ask for
 * a stream, preserving the original response contract.
 */
export async function askAI(systemPrompt, userMessage, history = []) {
  const messages = buildMessages(systemPrompt, userMessage, history);

  try {
    const completion = await withTimeout(
      groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      }),
      REQUEST_TIMEOUT_MS,
      "Request timed out"
    );

    const content = completion?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from model");
    }
    return content;
  } catch (error) {
    throw new Error(toUserFacingError(error));
  }
}

/**
 * Streaming completion. Yields plain text deltas (token chunks) as they
 * arrive from the provider so the caller can forward them to the client
 * in near real time.
 */
export async function* streamAI(systemPrompt, userMessage, history = []) {
  const messages = buildMessages(systemPrompt, userMessage, history);

  let stream;
  try {
    stream = await withTimeout(
      groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        stream: true,
      }),
      REQUEST_TIMEOUT_MS,
      "Request timed out"
    );
  } catch (error) {
    throw new Error(toUserFacingError(error));
  }

  let receivedAny = false;

  try {
    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) {
        receivedAny = true;
        yield delta;
      }
    }
  } catch (error) {
    throw new Error(toUserFacingError(error));
  }

  if (!receivedAny) {
    throw new Error(toUserFacingError(new Error("Empty response from model")));
  }
}
