# Chatbot Upgrade — Deliverables Summary

## Files modified

| File | Why |
|---|---|
| `chatbot/services/aiService.js` | Added `streamAI()` (token-by-token streaming via Groq's `stream: true`), request timeouts, and error classification so provider failures never crash the app or leak raw errors to users. `askAI()` (non-streaming) is kept for backward compatibility. |
| `chatbot/services/knowledgeService.js` | Added `loadCoreProfile()`, `loadProjectFiles()`, `getProjectIndex()` — targeted, cached readers used by the new router. Original `loadKnowledge()` is untouched and still works. |
| `chatbot/routes/chat.js` | Rewritten: input validation, hybrid system prompt, and dual response modes — plain JSON by default (unchanged contract), SSE stream when `?stream=1` is passed. |
| `app.py` | The `/api/chat` view now proxies the Node service as a live stream (`requests(stream=True)` → Flask `Response` generator) instead of buffering the whole reply with `urllib`. Same route, same method, same request body shape (`message`, now also accepts optional `history`). Removed the now-dead `urllib`/`json` imports this route used. |
| `static/assets/chatbot.js` | Consumes the SSE stream and updates the message bubble live; tracks conversation history client-side; aborts the previous stream if a new message is sent or the widget is closed; adds inline `` `code` `` / fenced ```` ```code``` ```` rendering. No HTML/CSS touched. |
| `chatbot/package.json` | `"main"` field pointed at `server.js` (was `knowledge.js`, which no longer exists). |

## New files

- `chatbot/services/knowledgeRouter.js` — the hybrid routing logic (see below).

## Files removed (dead code, confirmed unused)

- `chatbot/index.js`, `chatbot/knowledge.js`, `chatbot/main.js`, `chatbot/utils/index.js` — none were referenced by `server.js` (the real entrypoint used by both `npm start` and `start-dev.bat`).
- `chatbot/static/assets/chatbot.js` — an orphaned, broken prior attempt at a streaming frontend that targeted DOM classes (`.message`, `.typing-indicator`, `.hidden`) that don't exist in your actual templates. Not served by anything (`server.js` has no `express.static`), and your templates load `static/assets/chatbot.js` at the project root, not this one.

## New dependencies

**None.** `groq-sdk` (already installed) supports streaming out of the box, and `requests` (already used for Turnstile) handles the Flask-side streaming proxy.

## How streaming works

1. Frontend `fetch('/api/chat?stream=1', { headers: { Accept: 'text/event-stream' } })`.
2. Flask relays the request to the Node service with the same `?stream=1` flag and `stream=True` on the outbound `requests.post`, then re-streams each chunk to the browser as it arrives (`Response(relay(), mimetype='text/event-stream')`).
3. Node's `routes/chat.js` sees the stream flag, sets SSE headers, and forwards each token yielded by `streamAI()` as `data: {"token": "..."}\n\n`, ending with `data: {"done": true}\n\n` (or `data: {"error": "..."}\n\n` on failure).
4. The frontend reads the response body with `getReader()`, splits on blank lines, parses each `data:` line as JSON, and appends tokens into the same message bubble — no new DOM nodes per token, so there's no flicker.
5. **Backward compatible**: omit `?stream=1` (or the `Accept` header) and `/api/chat` still returns the original `{ "reply": "..." }` JSON in one shot.
6. **Cancellation**: an `AbortController` is aborted whenever a new message is sent while a previous stream is still running, or when the chat window is closed.

## How portfolio context is retrieved (the "RAG" layer)

`knowledgeRouter.js` avoids shipping the entire ~90KB knowledge base on every turn:

- **Always included**: a compact "core profile" (`about.md` + `education.md` + `skills.md`).
- **Named project detected** (aliases derived from filenames + title words, e.g. "gym booker", "password manager"): that project's full markdown file is added.
- **Follow-up reference** ("explain this project", "how does it work"): looks back through conversation history for the most recently named project and resolves to it.
- **Generic "tell me about your projects"**: includes a compact index (title + ~200-char summary per project) instead of every full file, and the assistant is instructed to ask which one to expand on.
- **Pure general CS/DS question** ("what is OOP?"): no project content is added at all — just the core profile plus the system prompt's instruction to answer from general knowledge.

This was verified directly (not just eyeballed) — a quick harness confirmed: a skills question pulls in the core profile only; "Explain the Gym Booker project" correctly matches `gym-booker.md`; "What is OOP?" pulls in the same minimal context as the skills question (i.e., no irrelevant project data); and "tell me about this project" after a prior mention of the Password Manager correctly resolves via history.

## The hybrid answering strategy

Rather than a brittle keyword classifier trying to bucket every possible phrasing of "personal" vs. "general" questions, the routing happens at two levels:

1. **Context selection** (above) — controls *what's retrieved*, for latency/cost.
2. **System prompt policy** — controls *how the model uses it*: answer strictly from CONTEXT for anything about Talha or a named project (say "I don't have that information yet" if it's missing, never invent), answer from general knowledge for CS/DS/programming concepts, and blend both when a question touches both (e.g., "which ML technique does your Music Recommender project use, and how does that technique work in general?").

This is deliberately the standard RAG pattern (retrieve relevant context, instruct the model on when to defer to it vs. its own knowledge) rather than a hand-rolled if/else router — it's far more robust to how people actually phrase questions.

## Robustness

- Input validation: non-string, empty, or >1000-character messages return a clean `400` before any model call.
- Model/provider errors (429 rate limits, 5xx, timeouts, empty responses) are caught and translated into short, friendly messages — verified live: with the LLM provider unreachable, both the JSON path (502 + friendly message) and the streaming path (`data: {"error": "..."}` event) responded correctly and **the server stayed up** for the next request.
- If the knowledge files are ever missing/unreadable, the router fails soft (empty context) rather than crashing the request — the assistant just falls back to general knowledge.
- Flask-side: connection errors, non-2xx upstream responses, and mid-stream interruptions are all caught and translated into either a JSON error or a clean stream close, never a raw stack trace.

## Validated

- All modified/new Node files pass `node --check`.
- `app.py` compiles cleanly (`py_compile`).
- Live tests against the running Node service confirmed: health check, all four validation cases (empty/non-string/missing/oversized message → `400`), the hybrid router's context selection (four scenarios), and graceful degradation for both the JSON and SSE paths when the LLM provider is unreachable — the process never crashed.
- **Not tested here**: an actual end-to-end reply from Groq (this sandbox's network doesn't reach `api.groq.com`) and the Flask app itself (several of its dependencies — `flask_sqlalchemy`, `flask_migrate`, `flask_wtf`, `flask_limiter`, `flask_talisman`, `wtforms` — aren't installed in this sandbox). I'd recommend running `python app.py` locally and sending a few real messages through the widget before deploying, just to confirm the live Groq streaming path end-to-end.

## Confirmed unchanged

Layout, CSS, colors, typography, animations, navigation, responsiveness, project cards, resume section, contact form, deployment configuration, SEO, and all backend logic unrelated to `/api/chat` (contact form, DB models, migrations, Talisman/CSP config, rate limiter) — none of these were touched.

## Optional future improvements (not implemented, out of scope for this task)

- Add a small "Stop generating" affordance in the UI (currently cancellation only happens implicitly on new message / close).
- Persist conversation history to `sessionStorage` so it survives a page reload (currently in-memory only, per the "no browser storage in artifacts" constraint doesn't apply here since this is your real site — but I kept scope tight and didn't add it unasked).
- Add a dedicated request-per-IP limiter on the Node service itself (Flask-Limiter currently only guards at the app level, 200/day, 50/hour, not chat-specific).
