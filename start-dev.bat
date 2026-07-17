@echo off
setlocal
cd /d "%~dp0"

set "CHATBOT_PORT=3100"
set "CHATBOT_API_URL=http://localhost:%CHATBOT_PORT%/api/chat"
start "Chatbot Backend" cmd /k "cd /d ""%~dp0chatbot"" && set PORT=%CHATBOT_PORT% && node server.js"
python app.py
