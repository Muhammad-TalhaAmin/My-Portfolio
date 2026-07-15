(function () {
  const toggle = document.querySelector('.chatbot-toggle');
  const windowEl = document.querySelector('.chatbot-window');
  const closeBtn = document.querySelector('.chatbot-close');
  const bodyEl = document.querySelector('.chatbot-body');
  const inputEl = document.querySelector('.chatbot-input');
  const sendBtn = document.querySelector('.chatbot-send');
  const suggestionsWrap = document.querySelector('.chatbot-suggestions');
  const API_URL = 'http://localhost:3001/api/chat';
  const ERROR_MESSAGE = 'Sorry, something went wrong. Please try again.';

  let isOpen = false;
  let isWaiting = false;
  let hasUserMessage = false;

  function formatTime() {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function addMessage(message, isUser = false) {
    const row = document.createElement('div');
    row.className = `chatbot-message-row${isUser ? ' user' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';

    const text = document.createElement('p');
    text.innerHTML = formatMarkdown(message);
    bubble.appendChild(text);

    const time = document.createElement('span');
    time.className = 'chatbot-time';
    time.textContent = formatTime();
    bubble.appendChild(time);

    if (!isUser) {
      const avatar = document.createElement('div');
      avatar.className = 'chatbot-avatar-badge';
      avatar.textContent = 'T';
      row.appendChild(avatar);
    }
    row.appendChild(bubble);

    bodyEl.appendChild(row);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function formatMarkdown(text) {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split(/\n/);
    const htmlLines = lines.map((line) => {
      if (/^\s*[-*] /.test(line)) {
        return `<li>${line.replace(/^\s*[-*] /, '')}</li>`;
      }
      return line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
    });

    const content = htmlLines.join('<br>');
    return content.includes('<li>') ? `<ul>${content.replace(/<br>/g, '')}</ul>` : content;
  }

  function showTypingIndicator() {
    const row = document.createElement('div');
    row.className = 'chatbot-message-row';

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-avatar-badge';
    avatar.textContent = 'T';

    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble chatbot-typing';
    bubble.setAttribute('aria-live', 'polite');

    for (let i = 0; i < 3; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'chatbot-dot';
      bubble.appendChild(dot);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    bodyEl.appendChild(row);
    bodyEl.scrollTop = bodyEl.scrollHeight;
    return row;
  }

  function hideTypingIndicator(typingRow) {
    if (typingRow && typingRow.parentNode) {
      typingRow.remove();
    }
  }

  function setWaiting(state) {
    isWaiting = state;
    inputEl.disabled = state;
    sendBtn.disabled = state;
    inputEl.placeholder = state ? 'Thinking…' : 'Ask about Talha...';
    sendBtn.innerHTML = state ? '<span class="chatbot-spinner"></span>' : '➤';
  }

  function clearSuggestions() {
    suggestionsWrap.innerHTML = '';
  }

  function addSuggestion(text) {
    const chip = document.createElement('button');
    chip.className = 'suggestion-chip';
    chip.type = 'button';
    chip.textContent = text;
    chip.addEventListener('click', () => {
      sendMessage(text);
    });
    suggestionsWrap.appendChild(chip);
  }

  function sendMessage(message) {
    const trimmed = message.trim();
    if (!trimmed || isWaiting) return;

    addMessage(trimmed, true);
    hasUserMessage = true;
    clearSuggestions();
    setWaiting(true);

    const typingRow = showTypingIndicator();

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: trimmed })
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Request failed');
        }
        return response.json();
      })
      .then((data) => {
        hideTypingIndicator(typingRow);
        const reply = data && data.reply ? data.reply : ERROR_MESSAGE;
        addMessage(reply, false);
      })
      .catch(() => {
        hideTypingIndicator(typingRow);
        addMessage(ERROR_MESSAGE, false);
      })
      .finally(() => {
        setWaiting(false);
      });
  }

  function openChat() {
    isOpen = true;
    windowEl.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    inputEl.focus();
  }

  function closeChat() {
    isOpen = false;
    windowEl.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleChat() {
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  function handleInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(inputEl.value);
      inputEl.value = '';
    }
  }

  function handleEscape(event) {
    if (event.key === 'Escape' && isOpen) {
      closeChat();
    }
  }

  function initWelcome() {
    if (!bodyEl.children.length) {
      addMessage("Hello 👋\n\nI'm Talha's AI Portfolio Assistant.\n\nAsk me anything about:\n• Education\n• Skills\n• Projects\n• Experience\n• Machine Learning\n• Automation", false);
    }
  }

  function initSuggestions() {
    if (!hasUserMessage) {
      addSuggestion('Tell me about Talha');
      addSuggestion('Explain Gym Booker');
      addSuggestion('What ML skills does Talha have?');
      addSuggestion('Summarize Talha\'s experience');
    }
  }

  toggle.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', closeChat);
  sendBtn.addEventListener('click', () => sendMessage(inputEl.value));
  inputEl.addEventListener('keydown', handleInputKeydown);
  document.addEventListener('keydown', handleEscape);

  initWelcome();
  initSuggestions();

  window.addEventListener('load', () => {
    if (!windowEl.classList.contains('is-open')) {
      inputEl.value = '';
    }
  });
})();
