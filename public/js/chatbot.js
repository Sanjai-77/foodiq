/**
 * chatbot.js (Frontend)
 * ─────────────────────────────────────────────────────
 * FoodIQ AI Coach — floating chatbot client.
 * Handles UI rendering, message sending, typing
 * indicators, quick suggestions, and smooth animations.
 * Relies on api.js for auth headers and API calls.
 */

(function () {
  'use strict';

  // ─── Quick suggestion labels ───────────────────────
  const SUGGESTIONS = [
    'High protein foods',
    'Budget meals',
    'Weight loss tips',
    'Muscle gain diet',
    'What should I eat next?',
    'Healthy snacks',
    'Gym nutrition'
  ];

  // ─── State ─────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let hasShownWelcome = false;

  // ─── Inject chatbot HTML ───────────────────────────
  function injectChatbotHTML() {
    const userInitial = (getUser().name || 'U')[0].toUpperCase();

    const html = `
      <button class="chatbot-toggle" id="chatbotToggle" aria-label="Open AI Coach">
        <i class="fa-solid fa-comments toggle-icon" id="toggleIcon"></i>
      </button>

      <div class="chatbot-window" id="chatbotWindow">
        <div class="chatbot-header">
          <div class="chatbot-avatar"><i class="fa-solid fa-leaf"></i></div>
          <div class="chatbot-header-info">
            <div class="chatbot-header-title">FoodIQ AI Coach</div>
            <div class="chatbot-header-subtitle">Smart Nutrition & Fitness Assistant</div>
            <div class="chatbot-status"><span class="chatbot-status-dot"></span> Online</div>
          </div>
          <div class="chatbot-header-actions">
            <button class="chatbot-header-btn" id="chatClearBtn" title="Clear chat"><i class="fa-solid fa-rotate-right"></i></button>
            <button class="chatbot-header-btn" id="chatCloseBtn" title="Close"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>

        <div class="chatbot-messages" id="chatMessages"></div>

        <div class="chat-suggestions" id="chatSuggestions"></div>

        <div class="chatbot-input-area">
          <div class="chatbot-input-wrapper">
            <input type="text" class="chatbot-input" id="chatInput"
                   placeholder="Ask me anything about nutrition..."
                   autocomplete="off" maxlength="500">
            <button class="chatbot-send-btn" id="chatSendBtn" aria-label="Send">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.id = 'chatbotContainer';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // ─── Time formatter ────────────────────────────────
  function formatTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // ─── Get user initial ──────────────────────────────
  function getUserInitial() {
    return (getUser().name || 'U')[0].toUpperCase();
  }

  // ─── Render welcome message ────────────────────────
  function renderWelcome() {
    const msgs = document.getElementById('chatMessages');
    if (!msgs || hasShownWelcome) return;
    hasShownWelcome = true;

    const userName = getUser().name || 'there';
    const firstName = userName.split(' ')[0];

    msgs.innerHTML = `
      <div class="chat-welcome">
        <div class="chat-welcome-icon"><i class="fa-solid fa-leaf"></i></div>
        <h4>Hey ${firstName}!</h4>
        <p>I'm your personal nutrition coach. Ask me about meals, fitness goals, or what to eat next.</p>
      </div>
    `;

    renderSuggestions();
  }

  // ─── Render suggestion buttons ─────────────────────
  function renderSuggestions() {
    const container = document.getElementById('chatSuggestions');
    if (!container) return;
    container.innerHTML = SUGGESTIONS.map(s =>
      `<button class="chat-suggestion-btn" data-msg="${s}">${s}</button>`
    ).join('');
  }

  // ─── Hide suggestions ─────────────────────────────
  function hideSuggestions() {
    const container = document.getElementById('chatSuggestions');
    if (container) container.innerHTML = '';
  }

  // ─── Add message bubble ────────────────────────────
  function addMessage(text, sender) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;

    // Remove welcome if still showing
    const welcome = msgs.querySelector('.chat-welcome');
    if (welcome) welcome.remove();

    const isUser = sender === 'user';
    const avatarText = isUser ? getUserInitial() : '<i class="fa-solid fa-leaf"></i>';
    const time = formatTime();

    const msgEl = document.createElement('div');
    msgEl.className = `chat-msg ${sender}`;
    msgEl.innerHTML = `
      <div class="chat-msg-avatar">${avatarText}</div>
      <div class="chat-msg-content">
        <div class="chat-msg-bubble">${escapeHtml(text)}</div>
        <div class="chat-msg-time">${time}</div>
      </div>
    `;

    msgs.appendChild(msgEl);
    scrollToBottom();
  }

  // ─── Escape HTML ───────────────────────────────────
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ─── Typing indicator ─────────────────────────────
  function showTyping() {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return;

    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'typingIndicator';
    typing.innerHTML = `
      <div class="chat-msg-avatar"><i class="fa-solid fa-leaf"></i></div>
      <div class="typing-dots">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
    msgs.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  // ─── Scroll to bottom ─────────────────────────────
  function scrollToBottom() {
    const msgs = document.getElementById('chatMessages');
    if (msgs) {
      requestAnimationFrame(() => {
        msgs.scrollTop = msgs.scrollHeight;
      });
    }
  }

  // ─── Send message ─────────────────────────────────
  async function sendMessage(text) {
    if (isLoading || !text.trim()) return;

    const message = text.trim();
    addMessage(message, 'user');
    hideSuggestions();

    const input = document.getElementById('chatInput');
    if (input) input.value = '';

    isLoading = true;
    updateSendButton();
    showTyping();

    try {
      const data = await apiCall('/chat', 'POST', { message });
      hideTyping();
      addMessage(data.reply, 'bot');
    } catch (err) {
      hideTyping();
      addMessage("Sorry, I couldn't process that. Please try again.", 'bot');
      console.error('Chat error:', err);
    } finally {
      isLoading = false;
      updateSendButton();
    }
  }

  // ─── Update send button state ──────────────────────
  function updateSendButton() {
    const btn = document.getElementById('chatSendBtn');
    if (btn) btn.disabled = isLoading;
  }

  // ─── Toggle chat window ────────────────────────────
  function toggleChat() {
    isOpen = !isOpen;
    const window = document.getElementById('chatbotWindow');
    const toggle = document.getElementById('chatbotToggle');
    const icon = document.getElementById('toggleIcon');

    if (window) window.classList.toggle('open', isOpen);
    if (toggle) toggle.classList.toggle('active', isOpen);

    if (icon) {
      icon.className = isOpen
        ? 'fa-solid fa-xmark toggle-icon'
        : 'fa-solid fa-comments toggle-icon';
    }

    if (isOpen && !hasShownWelcome) {
      renderWelcome();
    }

    if (isOpen) {
      setTimeout(() => {
        const input = document.getElementById('chatInput');
        if (input) input.focus();
      }, 400);
    }
  }

  // ─── Clear chat ────────────────────────────────────
  async function clearChat() {
    try {
      await apiCall('/chat/clear', 'POST');
    } catch (e) {
      // Silently fail — just clear UI
    }
    const msgs = document.getElementById('chatMessages');
    if (msgs) msgs.innerHTML = '';
    hasShownWelcome = false;
    renderWelcome();
  }

  // ─── Bind events ───────────────────────────────────
  function bindEvents() {
    // Toggle button
    document.getElementById('chatbotToggle')?.addEventListener('click', toggleChat);

    // Close button
    document.getElementById('chatCloseBtn')?.addEventListener('click', toggleChat);

    // Clear button
    document.getElementById('chatClearBtn')?.addEventListener('click', clearChat);

    // Send button
    document.getElementById('chatSendBtn')?.addEventListener('click', () => {
      const input = document.getElementById('chatInput');
      if (input) sendMessage(input.value);
    });

    // Enter key
    document.getElementById('chatInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        if (input) sendMessage(input.value);
      }
    });

    // Suggestion buttons (delegated)
    document.getElementById('chatSuggestions')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.chat-suggestion-btn');
      if (btn) sendMessage(btn.dataset.msg);
    });
  }

  // ─── Init ──────────────────────────────────────────
  function init() {
    // Only load chatbot on authenticated pages
    const token = getToken();
    if (!token) return;

    injectChatbotHTML();
    bindEvents();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
