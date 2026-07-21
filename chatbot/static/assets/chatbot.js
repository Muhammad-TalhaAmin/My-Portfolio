// Chat Frontend - Streaming Support
// Updates the chatbot frontend to support streaming responses

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  initializeChatbot();
});

function initializeChatbot() {
  const chatToggle = document.querySelector(".chatbot-toggle");
  const chatClose = document.querySelector(".chatbot-close");
  const chatWindow = document.querySelector(".chatbot-window");
  const chatBody = document.querySelector(".chatbot-body");
  const chatInput = document.querySelector(".chatbot-input");
  const chatSend = document.querySelector(".chatbot-send");
  const suggestions = document.querySelector(".chatbot-suggestions");

  let currentStreamController = null;

  // Toggle chatbot visibility
  function toggleChatbot() {
    const isHidden = chatWindow.classList.contains("hidden");
    chatWindow.classList.toggle("hidden");
    chatToggle.setAttribute("aria-expanded", !isHidden);
    chatInput.focus();
  }

  chatToggle.addEventListener("click", toggleChatbot);

  // Close chatbot
  function closeChatbot() {
    chatWindow.classList.add("hidden");
    chatToggle.setAttribute("aria-expanded", false);
    clearSuggestions();
  }

  chatClose.addEventListener("click", closeChatbot);

  // Send message function
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessage(message, "user");
    chatInput.value = "";
    chatInput.style.height = "auto";

    // Disable send button and show typing indicator
    chatSend.disabled = true;
    chatInput.disabled = true;
    showTypingIndicator();

    try {
      // Start streaming response
      await streamResponse(message);
    } catch (error) {
      console.error("Error:", error);
      addMessage("I apologize, but I'm having trouble responding. Please try again.", "bot");
    } finally {
      // Remove typing indicator
      removeTypingIndicator();
      chatSend.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  // Send message on button click
  chatSend.addEventListener("click", sendMessage);

  // Send message on Enter key
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener("input", autoResizeTextarea);

  // Show typing indicator
  function showTypingIndicator() {
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "message bot typing-indicator";
    typingIndicator.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;
    typingIndicator.id = "typing-indicator";
    chatBody.appendChild(typingIndicator);
    scrollToBottom();
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  // Stream response from backend
  async function streamResponse(message) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create a bot message container
    const botMessage = document.createElement("div");
    botMessage.className = "message bot";
    botMessage.innerHTML = '<div class="message-content"></div>';
    chatBody.appendChild(botMessage);
    scrollToBottom();

    const messageContent = botMessage.querySelector(".message-content");

    const reader = response.body.getReader();
const decoder = new TextDecoder();

let reply = "";

try {
    while (true) {

        const { value, done } = await reader.read();

        if (done) break;

        reply += decoder.decode(value, { stream: true });

        messageContent.textContent = reply;

        scrollToBottom();
    }
}
finally{
    reader.releaseLock();
}
  }

  // Add message to chat
  function addMessage(content, sender) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const avatar = sender === "bot" ? "{TA}" : "You";

    messageDiv.innerHTML = `
      <div class="message-avatar">
        ${avatar}
      </div>
      <div class="message-content">
        ${content}
      </div>
    `;

    chatBody.appendChild(messageDiv);
    scrollToBottom();
  }

  // Auto-resize textarea
  function autoResizeTextarea() {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
  }

  // Clear suggestions
  function clearSuggestions() {
    if (suggestions) {
      suggestions.innerHTML = "";
    }
  }

  // Scroll chat to bottom
  function scrollToBottom() {
    setTimeout(() => {
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 100);
  }

  // Sample suggestions
  const sampleSuggestions = [
    "What's your educational background?",
    "What programming languages do you know?",
    "Tell me about your projects",
    "What are your career goals?",
  ];

  function showSuggestions() {
    if (suggestions) {
      suggestions.innerHTML = `
        <div class="suggestions-container">
          <p>Suggested questions:</p>
          <div class="suggestion-buttons">
            ${sampleSuggestions.map((q) => `<button class="suggestion-btn" onclick="askSuggestion(this.textContent)">${q}</button>`).join("")}
          </div>
        </div>
      `;
    }
  }

  // Handle suggestion click
  window.askSuggestion = function (question) {
    chatInput.value = question;
    autoResizeTextarea();
    sendMessage();
    clearSuggestions();
  };

  // Initial suggestions
  showSuggestions();
}

// Initialize on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeChatbot);
} else {
  initializeChatbot();
}
