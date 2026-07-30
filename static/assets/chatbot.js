(function () {
  const toggle = document.querySelector('.chatbot-toggle');
  const windowEl = document.querySelector('.chatbot-window');
  const closeBtn = document.querySelector('.chatbot-close');
  const bodyEl = document.querySelector('.chatbot-body');
  const inputEl = document.querySelector('.chatbot-input');
  const sendBtn = document.querySelector('.chatbot-send');
  const suggestionsWrap = document.querySelector('.chatbot-suggestions');
  const API_URL = '/api/chat';
  const ERROR_MESSAGE = 'Sorry, something went wrong. Please try again.';
  const MAX_HISTORY_MESSAGES = 8;

  let isOpen = false;
  let isWaiting = false;
  let hasUserMessage = false;
  let conversationHistory = [];
  let activeController = null;

  function formatTime() {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function trimHistory() {
    if (conversationHistory.length > MAX_HISTORY_MESSAGES) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  function formatMarkdown(text) {
    // Pull fenced code blocks out first so the rest of the formatting logic
    // (line breaks, bold, lists) doesn't touch code content.
    const codeBlocks = [];
    const withoutFences = text.replace(/```[a-zA-Z0-9]*\n?([\s\S]*?)```/g, (match, code) => {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const token = `\u0000CODEBLOCK${codeBlocks.length}\u0000`;
      codeBlocks.push(`<pre><code>${escapedCode}</code></pre>`);
      return token;
    });

    const escaped = withoutFences
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split(/\n/);
    const htmlLines = lines.map((line) => {
      if (/^\s*[-*] /.test(line)) {
        return `<li>${line.replace(/^\s*[-*] /, '')}</li>`;
      }
      return line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    });

    let content = htmlLines.join('<br>');
    content = content.includes('<li>') ? `<ul>${content.replace(/<br>/g, '')}</ul>` : content;

    codeBlocks.forEach((block, i) => {
      content = content.replace(`\u0000CODEBLOCK${i}\u0000`, block);
    });

    return content;
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

  // Same markup as addMessage(..., false), but returns handles so the
  // bubble's text can be updated progressively as stream tokens arrive
  // instead of appending a brand new message each time.
  function addStreamingMessage() {
    const row = document.createElement('div');
    row.className = 'chatbot-message-row';

    const avatar = document.createElement('div');
    avatar.className = 'chatbot-avatar-badge';
    avatar.textContent = 'T';
    row.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';

    const text = document.createElement('p');
    bubble.appendChild(text);

    const time = document.createElement('span');
    time.className = 'chatbot-time';
    bubble.appendChild(time);

    row.appendChild(bubble);
    bodyEl.appendChild(row);
    bodyEl.scrollTop = bodyEl.scrollHeight;

    return {
      setText(raw) {
        text.innerHTML = formatMarkdown(raw);
        bodyEl.scrollTop = bodyEl.scrollHeight;
      },
      finalize() {
        time.textContent = formatTime();
      },
      remove() {
        row.remove();
      }
    };
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

  function stopActiveStream() {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
  }

  function sendMessage(message) {
    const trimmed = message.trim();
    if (!trimmed || isWaiting) return;

    addMessage(trimmed, true);
    conversationHistory.push({ role: 'user', content: trimmed });
    trimHistory();

    hasUserMessage = true;
    clearSuggestions();
    setWaiting(true);

    const typingRow = showTypingIndicator();
    let typingHidden = false;
    function hideTyping() {
      if (!typingHidden) {
        hideTypingIndicator(typingRow);
        typingHidden = true;
      }
    }

    // Only one response should ever stream at a time.
    stopActiveStream();
    const controller = new AbortController();
    activeController = controller;

    const historyForRequest = conversationHistory.slice(0, -1).slice(-MAX_HISTORY_MESSAGES);

    let accumulated = '';
    let streamingMessage = null;

    function handleEvent(rawEvent) {
      const line = rawEvent.trim();
      if (!line.startsWith('data:')) return;

      let payload;
      try {
        payload = JSON.parse(line.slice(5).trim());
      } catch (err) {
        return;
      }

      if (payload.error) {
        throw new Error(payload.error);
      }

      if (payload.token) {
        hideTyping();
        if (!streamingMessage) {
          streamingMessage = addStreamingMessage();
        }
        accumulated += payload.token;
        streamingMessage.setText(accumulated);
      }
    }

    fetch(`${API_URL}?stream=1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({ message: trimmed, history: historyForRequest }),
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          return response
            .json()
            .catch(() => null)
            .then((body) => {
              throw new Error((body && body.error) || 'Request failed');
            });
        }

        if (!response.body) {
          throw new Error('Request failed');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function pump() {
          return reader.read().then(({ value, done }) => {
            if (done) return;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop();
            events.forEach(handleEvent);

            return pump();
          });
        }

        return pump();
      })
      .then(() => {
        hideTyping();
        if (streamingMessage && accumulated) {
          streamingMessage.finalize();
          conversationHistory.push({ role: 'assistant', content: accumulated });
          trimHistory();
        } else if (!accumulated) {
          if (streamingMessage) streamingMessage.remove();
          addMessage(ERROR_MESSAGE, false);
        }
      })
      .catch((error) => {
        hideTyping();
        if (error && error.name === 'AbortError') return;
        if (streamingMessage) {
          streamingMessage.remove();
        }
        addMessage((error && error.message) || ERROR_MESSAGE, false);
      })
      .finally(() => {
        if (activeController === controller) {
          activeController = null;
        }
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
    stopActiveStream();
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
