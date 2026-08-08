"""Groq-backed chat service for the portfolio's AI assistant.

Python port of chatbot/services/aiService.js plus the request validation,
prompt building and SSE framing that lived in chatbot/routes/chat.js.

The Groq API is only ever called from the server; the browser never sees
the API key.
"""

import os

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 700
TEMPERATURE = 0.3
REQUEST_TIMEOUT_SECONDS = 30.0
MAX_MESSAGE_LENGTH = 1000
MAX_HISTORY_MESSAGES = 8
MAX_HISTORY_MESSAGE_LENGTH = 2000

DEFAULT_ERROR_MESSAGE = (
    "Something went wrong while generating a response. Please try again."
)


class ChatbotError(Exception):
    """An error whose message is already safe to show to the user."""

    def __init__(self, message):
        self.message = message
        super().__init__(message)


_client = None


def _get_client():
    global _client

    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ChatbotError("The AI service is not configured.")
        _client = Groq(api_key=api_key, timeout=REQUEST_TIMEOUT_SECONDS)

    return _client


def to_user_facing_error(error):
    """Turns anything the Groq SDK throws into a short, user-safe message.

    Never surfaces a raw stack trace or provider error string.
    """
    if isinstance(error, ChatbotError):
        return error.message

    status = getattr(error, "status_code", None)

    if status:
        if status == 429:
            return (
                "I'm getting a lot of requests right now — please try again in "
                "a few seconds."
            )
        if status >= 500:
            return "The AI service is temporarily unavailable. Please try again shortly."

    message = getattr(error, "message", "") or str(error)
    lowered = message.lower()

    if "timed out" in lowered or "timeout" in lowered:
        return "That took too long to respond. Please try again."
    if "empty response" in lowered:
        return "The model returned an empty response. Please try again."

    return DEFAULT_ERROR_MESSAGE


def validate_message(message):
    """Returns an error string if the message is invalid, else None."""
    if not isinstance(message, str):
        return "Message is required and must be a string."

    trimmed = message.strip()
    if not trimmed:
        return "Message cannot be empty."
    if len(trimmed) > MAX_MESSAGE_LENGTH:
        return f"Message is too long (max {MAX_MESSAGE_LENGTH} characters)."

    return None


def sanitize_history(history):
    """Keeps only valid user/assistant string entries, limited to the tail."""
    if not isinstance(history, list):
        return []

    cleaned = []
    for entry in history:
        if not isinstance(entry, dict):
            continue
        role = entry.get("role")
        content = entry.get("content")
        if role in ("user", "assistant") and isinstance(content, str):
            cleaned.append(entry)

    return cleaned[-MAX_HISTORY_MESSAGES:]


def build_system_prompt(context=None):
    return (
        "You are Muhammad Talha Amin's professional AI portfolio assistant, "
        "embedded on his personal website.\n"
        "\n"
        "You have two sources of knowledge:\n"
        "1. CONTEXT below — verified facts about Talha: his education, skills, "
        "experience, certifications, achievements, contact info, and his "
        "individual projects.\n"
        "2. Your own general knowledge of computer science, data science, "
        "machine learning, and programming.\n"
        "\n"
        "How to decide which to use:\n"
        "- Questions about Talha himself, his background, resume, or a specific "
        "project: answer strictly from CONTEXT. If the answer isn't in CONTEXT, "
        "say \"I don't have that information yet.\" Never invent personal facts "
        "about him.\n"
        "- General technical or educational questions (e.g. explaining OOP, "
        "REST APIs, JWT, SQL vs NoSQL, Git, Docker, Linux, networking, "
        "operating systems, databases, algorithms, data structures, machine "
        "learning / deep learning concepts, or help with Python, C++, "
        "JavaScript, HTML, CSS, Flask, FastAPI, Node.js, SQL): answer "
        "accurately and educationally from your own knowledge, even if it "
        "isn't mentioned in CONTEXT.\n"
        "- Questions that combine both (e.g. \"which ML technique does your "
        "Music Recommender project use, and how does that technique work in "
        "general?\"): answer the project-specific part from CONTEXT and the "
        "general concept from your own knowledge, woven into one coherent "
        "answer.\n"
        "\n"
        "Formatting rules for the chat widget (it renders a limited subset of "
        "markdown):\n"
        "- Do NOT use markdown headers (#), tables, or blockquotes.\n"
        "- You may use **bold**, *italics*, \"-\" bullet lists, inline `code`, "
        "and fenced ```code blocks``` for snippets.\n"
        "- Keep answers concise and conversational — a short paragraph or a few "
        "bullet points, not a full essay.\n"
        "\n"
        "CONTEXT:\n"
        "\n"
        f"{context or '(no additional context needed for this question)'}"
    )


def build_messages(system_prompt, user_message, history=None):
    trimmed_history = sanitize_history(history)

    history_messages = []
    for entry in trimmed_history:
        content = entry.get("content") or ""
        history_messages.append(
            {"role": entry["role"], "content": content[:MAX_HISTORY_MESSAGE_LENGTH]}
        )

    return [
        {"role": "system", "content": system_prompt},
        *history_messages,
        {"role": "user", "content": user_message},
    ]


def ask_ai(system_prompt, user_message, history=None):
    """Non-streaming completion. Returns the full reply text."""
    messages = build_messages(system_prompt, user_message, history)

    try:
        client = _get_client()
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )
    except ChatbotError:
        raise
    except Exception as error:
        raise ChatbotError(to_user_facing_error(error)) from error

    choices = getattr(completion, "choices", None)
    if not choices:
        raise ChatbotError("The model returned an empty response. Please try again.")

    content = getattr(choices[0].message, "content", None)
    if not content:
        raise ChatbotError("The model returned an empty response. Please try again.")

    return content


def stream_ai(system_prompt, user_message, history=None):
    """Streaming completion. Yields plain text deltas as they arrive."""
    messages = build_messages(system_prompt, user_message, history)

    try:
        client = _get_client()
        stream = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            stream=True,
        )
    except ChatbotError:
        raise
    except Exception as error:
        raise ChatbotError(to_user_facing_error(error)) from error

    received_any = False

    try:
        for chunk in stream:
            choices = getattr(chunk, "choices", None)
            if not choices:
                continue
            delta = getattr(choices[0], "delta", None)
            content = getattr(delta, "content", None) if delta else None
            if content:
                received_any = True
                yield content
    except ChatbotError:
        raise
    except Exception as error:
        raise ChatbotError(to_user_facing_error(error)) from error

    if not received_any:
        raise ChatbotError("The model returned an empty response. Please try again.")
