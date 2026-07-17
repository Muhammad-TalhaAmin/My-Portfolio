Portfolio Website (Flask)

This portfolio is now served as a Flask application while preserving the existing UI, layout, responsiveness, animations, and chatbot front-end behavior.

## Run locally

1. Install dependencies once:
   - `pip install flask`
   - in `chatbot/`: `npm install`
2. Start both Flask + chatbot from the project root with one command:
   - `start-dev.bat`
   - (This runs chatbot on an internal port and wires Flask automatically.)
3. Open:
   - `http://127.0.0.1:5000`

## Routes

- `/` (home)
- `/about`
- `/projects`
- `/contact`

Legacy `.html` URLs are also supported (`/index.html`, `/about.html`, `/projects.html`, `/contact.html`).
