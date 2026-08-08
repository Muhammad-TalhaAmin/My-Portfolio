Portfolio Website (Flask)

The portfolio is now served as a Flask application while preserving the existing UI, layout, responsiveness, animations, and chatbot front-end behavior.

## Run locally

1. Install dependencies:
   - `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and fill in your values (including `GROQ_API_KEY`).
3. Start the app from the project root:
   - `python app.py` (or `start-dev.bat` on Windows)
4. Open:
   - `http://127.0.0.1:5000`

## Routes

- `/` (home)
- `/about`
- `/projects`
- `/contact`

Legacy `.html` URLs are also supported (`/index.html`, `/about.html`, `/projects.html`, `/contact.html`).
