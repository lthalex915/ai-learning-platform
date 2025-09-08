/**
 * Chat Interface for AI Assistant
 * Handles chat functionality and follow-up questions
 */

class ChatInterface {
  constructor() {
    this.isOpen = false;
    this.currentSession = null;
    this.messages = [];
    this.selectedText = "";
    this.sessions = []; // multi-chat sessions
    this.associatedDocId = null; // associate chat with a document

    this.initializeChat();
    this.initializeEventListeners();
  }

  /**
   * Initialize chat interface
   */
  initializeChat() {
    this.chatPanel = document.getElementById("chatPanel");
    this.chatMessages = document.getElementById("chatMessages");
    this.chatInput = document.getElementById("chatInput");
    this.sendChatBtn = document.getElementById("sendChatBtn");
    this.closeChatBtn = document.getElementById("closeChatBtn");

    // Create chat toggle button for mobile
    this.createChatToggle();

    // Add New Chat button in header if not exists
    const chatHeader = this.chatPanel
      ? this.chatPanel.querySelector(".chat-header")
      : null;
    if (chatHeader && !chatHeader.querySelector("#newChatBtn")) {
      const newBtn = document.createElement("button");
      newBtn.id = "newChatBtn";
      newBtn.className = "new-chat-btn";
      newBtn.title = "Start New Chat";
      newBtn.innerHTML = '<i class="fas fa-plus"></i>';
      chatHeader.insertBefore(
        newBtn,
        chatHeader.querySelector("#closeChatBtn")
      );
      newBtn.addEventListener("click", () => this.createNewSession(true));
    }

    // Create sessions dropdown
    if (chatHeader && !chatHeader.querySelector("#chatSessionSelect")) {
      const select = document.createElement("select");
      select.id = "chatSessionSelect";
      select.className = "chat-session-select";
      select.title = "Switch Chat Session";
      chatHeader.insertBefore(select, chatHeader.querySelector("#newChatBtn"));
      select.addEventListener("change", (e) =>
        this.switchSession(e.target.value)
      );
    }

    // Add clear chat button
    if (chatHeader && !chatHeader.querySelector("#clearChatBtn")) {
      const clearBtn = document.createElement("button");
      clearBtn.id = "clearChatBtn";
      clearBtn.className = "clear-chat-btn";
      clearBtn.title = "Clear Current Chat";
      clearBtn.innerHTML = '<i class="fas fa-trash"></i>';
      chatHeader.insertBefore(
        clearBtn,
        chatHeader.querySelector("#closeChatBtn")
      );
      clearBtn.addEventListener("click", () => this.clearCurrentChat());
    }

    // Load existing chat session(s) if available
    this.loadChatSessions();
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Send message button
    if (this.sendChatBtn) {
      this.sendChatBtn.addEventListener("click", () => this.sendMessage());
    }

    // Enter key to send message
    if (this.chatInput) {
      this.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      // Auto-resize input
      this.chatInput.addEventListener("input", () => this.autoResizeInput());
    }

    // Close chat button
    if (this.closeChatBtn) {
      this.closeChatBtn.addEventListener("click", () => this.closeChat());
    }

    // Chat toggle button
    if (this.chatToggle) {
      this.chatToggle.addEventListener("click", () => this.toggleChat());
    }

    // When document changes, associate doc id to current session
    document.addEventListener("document:displayed", (e) => {
      this.associatedDocId = e.detail && e.detail.id ? e.detail.id : null;
      if (this.currentSession) {
        this.currentSession.docId = this.associatedDocId;
        this.saveChatSession();
        this.refreshSessionSelect();
      }
    });

    // Handle mobile menu toggle
    this.handleMobileMenuToggle();
  }

  /**
   * Create chat toggle button for mobile
   */
  createChatToggle() {
    this.chatToggle = document.createElement("button");
    this.chatToggle.className = "chat-toggle";
    this.chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
    this.chatToggle.title = "Open AI Assistant";
    document.body.appendChild(this.chatToggle);
  }

  /**
   * Handle mobile menu toggle
   */
  handleMobileMenuToggle() {
    // Add mobile menu toggle to header if needed
    const headerContent = document.querySelector(".header-content");
    if (headerContent && window.innerWidth <= 767) {
      const mobileToggle = document.createElement("button");
      mobileToggle.className = "mobile-menu-toggle";
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
      mobileToggle.addEventListener("click", () => this.toggleMobileMenu());
      headerContent.insertBefore(mobileToggle, headerContent.firstChild);
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open");
    }
  }

  /**
   * Open chat with selected text
   */
  openChatWithSelectedText(selectedText, docId = null) {
    this.selectedText = selectedText;
    this.associatedDocId =
      docId ||
      this.associatedDocId ||
      (window.documentEditor &&
      window.documentEditor.getCurrentDocument &&
      window.documentEditor.getCurrentDocument()
        ? window.documentEditor.getCurrentDocument().id
        : null);
    this.openChat();

    // Pre-fill input with selected text and a question prompt
    if (this.chatInput) {
      const questionPrompt = `Please explain this text: ${selectedText}`;
      this.chatInput.value = questionPrompt;
      this.chatInput.placeholder = "Ask a question about the selected text...";
      this.chatInput.focus();

      // Select the text in the input for easy editing
      setTimeout(() => {
        this.chatInput.select();
      }, 100);
    }

    // Add context message
    this.addContextMessage(selectedText);
  }

  /**
   * Add context message
   */
  addContextMessage(text) {
    const contextMessage = {
      id: this.generateMessageId(),
      type: "context",
      content: `Selected text: "${text}"`,
      timestamp: new Date().toISOString(),
    };

    this.addMessageToChat(contextMessage);
  }

  /**
   * Open chat panel
   */
  openChat() {
    this.isOpen = true;
    this.chatPanel.classList.add("open");

    if (this.chatToggle) {
      this.chatToggle.innerHTML = '<i class="fas fa-times"></i>';
      this.chatToggle.title = "Close AI Assistant";
    }

    // Focus input
    if (this.chatInput) {
      setTimeout(() => this.chatInput.focus(), 300);
    }

    // Create new session if none exists
    if (!this.currentSession) {
      this.createNewSession();
    }
    this.refreshSessionSelect();
  }

  /**
   * Close chat panel
   */
  closeChat() {
    this.isOpen = false;
    this.chatPanel.classList.remove("open");
    this.selectedText = "";

    if (this.chatToggle) {
      this.chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
      this.chatToggle.title = "Open AI Assistant";
    }

    // Reset input placeholder
    if (this.chatInput) {
      this.chatInput.placeholder = "Ask a question about the selected text...";
    }

    // Save current session
    this.saveChatSession();
  }

  /**
   * Toggle chat panel
   */
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  /**
   * Send message
   */
  async sendMessage() {
    const messageText = this.chatInput.value.trim();
    if (!messageText) return;

    // Clear input
    this.chatInput.value = "";
    this.autoResizeInput();

    // Disable send button
    this.setSendButtonState(false);

    // Add user message
    const userMessage = {
      id: this.generateMessageId(),
      type: "user",
      content: messageText,
      selectedText: this.selectedText,
      timestamp: new Date().toISOString(),
    };

    this.addMessageToChat(userMessage);
    this.messages.push(userMessage);

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        messageText,
        this.selectedText
      );

      // Remove typing indicator
      this.hideTypingIndicator();

      // Add AI message
      const aiMessage = {
        id: this.generateMessageId(),
        type: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      this.addMessageToChat(aiMessage);
      this.messages.push(aiMessage);
    } catch (error) {
      console.error("Error generating AI response:", error);
      this.hideTypingIndicator();

      const errorMessage = {
        id: this.generateMessageId(),
        type: "ai",
        content:
          "I apologize, but I encountered an error while processing your question. Please try again.",
        timestamp: new Date().toISOString(),
      };

      this.addMessageToChat(errorMessage);
      this.messages.push(errorMessage);
    }

    // Re-enable send button
    this.setSendButtonState(true);

    // Clear selected text after first response
    this.selectedText = "";

    // Save session
    this.saveChatSession();
    this.refreshSessionSelect();
  }

  /**
   * Generate AI response
   */
  async generateAIResponse(question, selectedText = "") {
    try {
      // Check if real AI is available and configured
      if (window.aiProcessor && window.aiProcessor.useRealAI && window.aiProcessor.realAIHandler && window.aiProcessor.realAIHandler.isConfigured()) {
        // Use real AI for chat responses
        const context = this.getCurrentDocumentContext();
        const response = await window.aiProcessor.realAIHandler.handleFollowUpQuestion(selectedText, question, context);
        return response;
      } else {
        // Fallback to simulated AI with shorter delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        let response = "";
        if (selectedText) {
          response = this.generateContextualResponse(question, selectedText);
        } else {
          response = this.generateGeneralResponse(question);
        }
        
        // Add note about using simulated AI
        response = `*Note: Using simulated AI responses. Configure your OpenRouter API key in Settings to use real AI.*\n\n${response}`;
        return response;
      }
    } catch (error) {
      console.error('AI chat error:', error);
      // Fallback to simulated response on error
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      let response = "";
      if (selectedText) {
        response = this.generateContextualResponse(question, selectedText);
      } else {
        response = this.generateGeneralResponse(question);
      }
      
      response = `*Note: AI API error, using simulated response. Error: ${error.message}*\n\n${response}`;
      return response;
    }
  }

  /**
   * Generate contextual response based on selected text
   */
  generateContextualResponse(question, selectedText) {
    const responses = [
      `Based on the selected text "${selectedText.substring(
        0,
        100
      )}...", I can help explain this concept. This appears to be discussing a key principle that's important for understanding the broader topic. Let me break it down for you:

The main idea here is that this concept serves as a foundation for more advanced learning. Think of it as a building block that connects to other important ideas in your study materials.

Would you like me to explain any specific part in more detail?`,

      `Great question about "${selectedText.substring(
        0,
        50
      )}...". This section is particularly important because it introduces concepts that you'll encounter throughout your studies.

Here's what you should focus on:
• The key terminology and definitions
• How this relates to other concepts you've learned
• Practical applications you might encounter

Is there a specific aspect of this that you'd like me to clarify further?`,

      `I can see you're asking about this specific passage. This is actually a really good section to focus on because it covers fundamental principles that many students find challenging at first.

The key insight here is understanding not just what is being described, but why it's important and how it fits into the bigger picture of your subject area.

What specific part would you like me to explain in simpler terms?`,
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate general response
   */
  generateGeneralResponse(question) {
    const lowerQuestion = question.toLowerCase();

    if (
      lowerQuestion.includes("explain") ||
      lowerQuestion.includes("what is")
    ) {
      return `I'd be happy to help explain that concept! To give you the most helpful explanation, could you please select the specific text or section you'd like me to focus on? This way, I can provide a detailed explanation that's directly relevant to your study materials.

You can select any text in your document and then ask your question - this helps me give you more accurate and contextual answers.`;
    }

    if (lowerQuestion.includes("how") || lowerQuestion.includes("why")) {
      return `That's an excellent question! Understanding the "how" and "why" behind concepts is crucial for deep learning. 

To give you the most helpful answer, I recommend:
1. Select the specific text you're curious about
2. Ask your question again with that context
3. I'll provide a detailed explanation tailored to that content

This approach ensures you get explanations that are directly relevant to your study materials rather than generic information.`;
    }

    if (lowerQuestion.includes("help") || lowerQuestion.includes("confused")) {
      return `I'm here to help! It's completely normal to feel confused when learning new concepts - that's part of the learning process.

Here's how I can best assist you:
• Select any text that's confusing you
• Ask specific questions about that content
• I'll break it down into simpler terms
• We can work through it step by step

What specific part of your study materials would you like to start with?`;
    }

    // Default response
    return `I'm here to help you understand your study materials better! For the most helpful response, try selecting specific text from your documents and then asking your question.

This allows me to:
• Provide explanations tailored to your exact content
• Give relevant examples and context
• Break down complex concepts into understandable parts

What would you like to explore from your study materials?`;
  }

  /**
   * Add message to chat display
   */
  addMessageToChat(message) {
    const messageElement = this.createMessageElement(message);
    this.chatMessages.appendChild(messageElement);

    // Scroll to bottom
    this.scrollToBottom();
  }

  /**
   * Create message element
   */
  createMessageElement(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${message.type}-message`;
    messageDiv.dataset.messageId = message.id;

    if (message.type === "context") {
      messageDiv.className += " context-message";
      messageDiv.innerHTML = `
                <div class="message-content context-content">
                    <i class="fas fa-quote-left"></i>
                    <p>${message.content}</p>
                </div>
                <div class="message-time">${this.formatTime(
                  message.timestamp
                )}</div>
            `;
    } else {
      const content = document.createElement("div");
      content.className = "message-content";
      content.innerHTML = this.formatMessageContent(message.content);

      const time = document.createElement("div");
      time.className = "message-time";
      time.textContent = this.formatTime(message.timestamp);

      messageDiv.appendChild(content);
      messageDiv.appendChild(time);
    }

    return messageDiv;
  }

  /**
   * Format message content with markdown support
   */
  formatMessageContent(content) {
    let formatted = content;

    // Convert headers
    formatted = formatted.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    formatted = formatted.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    formatted = formatted.replace(/^# (.*$)/gm, "<h1>$1</h1>");

    // Convert bold and italic
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert inline code
    formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Convert code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");

    // Convert blockquotes
    formatted = formatted.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");

    // Convert links
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Convert bullet points
    formatted = formatted.replace(/^[•\-\*] (.+)$/gm, "<li>$1</li>");
    
    // Convert numbered lists
    formatted = formatted.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

    // Wrap consecutive list items in ul/ol tags
    formatted = formatted.replace(/(<li>.*<\/li>)/s, (match) => {
      // Check if it's a numbered list by looking for numbered items
      if (/^\d+\./.test(content)) {
        return "<ol>" + match + "</ol>";
      } else {
        return "<ul>" + match + "</ul>";
      }
    });

    // Convert horizontal rules
    formatted = formatted.replace(/^---$/gm, "<hr>");

    // Convert line breaks to paragraphs
    formatted = formatted.replace(/\n\n/g, "</p><p>");
    formatted = formatted.replace(/\n/g, "<br>");

    // Wrap in paragraphs if not already wrapped
    if (!formatted.startsWith("<")) {
      formatted = "<p>" + formatted + "</p>";
    }

    // Clean up empty paragraphs
    formatted = formatted.replace(/<p><\/p>/g, "");
    formatted = formatted.replace(/<p><br><\/p>/g, "");

    return formatted;
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString();
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message ai-message typing-indicator";
    typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

    this.chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingIndicator =
      this.chatMessages.querySelector(".typing-indicator");
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  /**
   * Set send button state
   */
  setSendButtonState(enabled) {
    if (this.sendChatBtn) {
      this.sendChatBtn.disabled = !enabled;
    }
  }

  /**
   * Auto-resize input
   */
  autoResizeInput() {
    if (this.chatInput) {
      this.chatInput.style.height = "auto";
      this.chatInput.style.height =
        Math.min(this.chatInput.scrollHeight, 120) + "px";
    }
  }

  /**
   * Scroll to bottom of chat
   */
  scrollToBottom() {
    if (this.chatMessages) {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
  }

  /**
   * Generate message ID
   */
  generateMessageId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Create new chat session
   */
  createNewSession(forceNew = false) {
    // If not forced and there's an existing session, reuse if empty
    if (!forceNew && this.currentSession && (this.messages?.length ?? 0) <= 1) {
      return;
    }

    const doc =
      window.documentEditor && window.documentEditor.getCurrentDocument
        ? window.documentEditor.getCurrentDocument()
        : null;
    const timestamp = new Date().toISOString();

    this.currentSession = {
      id: storageManager.generateId(),
      title: doc
        ? `Chat: ${doc.title.substring(0, 30)}${
            doc.title.length > 30 ? "..." : ""
          }`
        : `New Chat ${new Date().toLocaleTimeString()}`,
      docId: doc ? doc.id : this.associatedDocId || null,
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.messages = [];

    // Clear chat display
    if (this.chatMessages) {
      this.chatMessages.innerHTML = "";
    }

    // Add welcome message
    const welcomeMessage = {
      id: this.generateMessageId(),
      type: "ai",
      content: doc
        ? `Hello! I'm ready to help you understand "${doc.title}". Select any text in your document and ask me questions about it!`
        : "Hello! I'm your AI learning assistant. Upload a document and select any text to ask me questions about it!",
      timestamp: timestamp,
    };

    this.addMessageToChat(welcomeMessage);
    this.messages.push(welcomeMessage);
    this.saveChatSession();
    this.refreshSessionSelect();

    // Show success message
    this.showToast("New chat session created", "success");
  }

  /**
   * Save chat session
   */
  saveChatSession() {
    if (this.currentSession) {
      this.currentSession.messages = this.messages;
      this.currentSession.updatedAt = new Date().toISOString();
      this.currentSession.docId =
        this.associatedDocId || this.currentSession.docId || null;
      storageManager.saveChatSession(this.currentSession);
      // reload sessions cache
      this.sessions = storageManager.getChats() || [];
    }
  }

  /**
   * Load chat session
   */
  loadChatSessions() {
    this.sessions = storageManager.getChats() || [];
    if (this.sessions.length > 0) {
      // pick the most recent, preferring current doc if available
      const currentDoc =
        window.documentEditor && window.documentEditor.getCurrentDocument
          ? window.documentEditor.getCurrentDocument()
          : null;
      let sessionToLoad = this.sessions.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )[0];
      if (currentDoc) {
        const docSessions = this.sessions.filter(
          (s) => s.docId === currentDoc.id
        );
        if (docSessions.length > 0) {
          sessionToLoad = docSessions.sort(
            (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
          )[0];
        }
        this.associatedDocId = currentDoc.id;
      }
      this.currentSession = sessionToLoad;
      this.messages =
        sessionToLoad && sessionToLoad.messages ? sessionToLoad.messages : [];
      this.renderMessages();
    } else {
      this.createNewSession();
    }
    this.refreshSessionSelect();
  }

  /**
   * Clear chat history
   */
  clearChatHistory() {
    this.chatMessages.innerHTML = "";
    this.messages = [];
    this.createNewSession(true);
  }

  /**
   * Get chat history
   */
  getChatHistory() {
    return this.messages;
  }

  /**
   * Render messages from this.messages
   */
  renderMessages() {
    if (!this.chatMessages) return;
    this.chatMessages.innerHTML = "";
    this.messages.forEach((message) => {
      this.addMessageToChat(message);
    });
  }

  /**
   * Refresh the session selector with sessions grouped by current doc if available
   */
  refreshSessionSelect() {
    const select = document.getElementById("chatSessionSelect");
    if (!select) return;
    const sessions = storageManager.getChats() || [];
    select.innerHTML = "";
    const currentDoc =
      window.documentEditor && window.documentEditor.getCurrentDocument
        ? window.documentEditor.getCurrentDocument()
        : null;
    const makeOptionLabel = (s) => {
      const title = s.title || "Chat";
      const time = new Date(s.updatedAt || s.createdAt).toLocaleString();
      return `${title}${s.docId ? "" : " (no doc)"} - ${time}`;
    };
    // If doc selected, show its sessions first
    if (currentDoc) {
      const docGroup = sessions.filter((s) => s.docId === currentDoc.id);
      docGroup.forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = makeOptionLabel(s);
        select.appendChild(opt);
      });
      // separator
      if (docGroup.length > 0) {
        const sep = document.createElement("option");
        sep.disabled = true;
        sep.textContent = "──────────";
        select.appendChild(sep);
      }
    }
    // Add remaining
    sessions
      .filter((s) => !currentDoc || s.docId !== currentDoc.id)
      .forEach((s) => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = makeOptionLabel(s);
        select.appendChild(opt);
      });
    // Set current value
    if (this.currentSession) {
      select.value = this.currentSession.id;
    }
  }

  /**
   * Switch the active session by id
   */
  switchSession(sessionId) {
    if (!sessionId) return;

    const sessions = storageManager.getChats() || [];
    const found = sessions.find((s) => s.id === sessionId);
    if (!found) return;

    // Save current session before switching
    if (this.currentSession) {
      this.saveChatSession();
    }

    this.currentSession = found;
    this.messages = found.messages || [];
    this.associatedDocId = found.docId || null;
    this.renderMessages();

    // Show success message
    this.showToast(`Switched to: ${found.title}`, "info");
  }

  /**
   * Clear current chat session
   */
  clearCurrentChat() {
    if (!this.currentSession) return;

    if (
      confirm(
        "Are you sure you want to clear this chat? This action cannot be undone."
      )
    ) {
      // Delete from storage
      storageManager.deleteChatSession(this.currentSession.id);

      // Create new session
      this.createNewSession(true);

      this.showToast("Chat cleared successfully", "success");
    }
  }

  /**
   * Delete a specific chat session
   */
  deleteChatSession(sessionId) {
    if (!sessionId) return;

    const sessions = storageManager.getChats() || [];
    const sessionToDelete = sessions.find((s) => s.id === sessionId);

    if (!sessionToDelete) return;

    if (
      confirm(`Are you sure you want to delete "${sessionToDelete.title}"?`)
    ) {
      // Delete from storage
      storageManager.deleteChatSession(sessionId);

      // If this was the current session, create a new one
      if (this.currentSession && this.currentSession.id === sessionId) {
        this.createNewSession(true);
      }

      this.refreshSessionSelect();
      this.showToast("Chat session deleted", "success");
    }
  }
  /**
   * Export chat history
   */
  exportChatHistory(format = "markdown") {
    if (!this.currentSession || this.messages.length === 0) return null;

    if (format === "json") {
      return JSON.stringify(this.currentSession, null, 2);
    }

    // Markdown format
    let content = `# ${this.currentSession.title}\n\n`;
    content += `*Created: ${new Date(
      this.currentSession.createdAt
    ).toLocaleString()}*\n`;
    content += `*Updated: ${new Date(
      this.currentSession.updatedAt
    ).toLocaleString()}*\n\n`;

    if (this.currentSession.docId) {
      const doc = storageManager.getDocument(this.currentSession.docId);
      if (doc) {
        content += `*Associated Document: ${doc.title}*\n\n`;
      }
    }

    content += `---\n\n`;

    this.messages.forEach((message) => {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();

      if (message.type === "user") {
        content += `**You** *(${timestamp})*: ${message.content}\n\n`;
      } else if (message.type === "ai") {
        content += `**AI Assistant** *(${timestamp})*: ${message.content}\n\n`;
      } else if (message.type === "context") {
        content += `*${message.content}*\n\n`;
      }
    });

    return content;
  }

  /**
   * Get current document context for AI responses
   */
  getCurrentDocumentContext() {
    const currentDoc = window.documentEditor && window.documentEditor.getCurrentDocument
      ? window.documentEditor.getCurrentDocument()
      : null;
    
    if (currentDoc && currentDoc.content) {
      // Return first 1000 characters of document content as context
      return currentDoc.content.substring(0, 1000);
    }
    
    return "No document context available";
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `chat-toast toast-${type}`;
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
            color: white;
            font-size: 0.875rem;
            z-index: 1001;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        `;

    // Set background color based on type
    const colors = {
      success: "#10b981",
      error: "#ef4444",
      warning: "#f59e0b",
      info: "#3b82f6",
    };
    toast.style.background = colors[type] || colors.info;

    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-in";
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}

// Add CSS for typing indicator and context messages
const chatStyles = document.createElement("style");
chatStyles.textContent = `
    .typing-indicator .message-content {
        background: var(--bg-secondary) !important;
        padding: 1rem !important;
    }
    
    .typing-dots {
        display: flex;
        gap: 4px;
        align-items: center;
    }
    
    .typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
        animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
        0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        40% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .context-message .message-content {
        background: rgba(245, 158, 11, 0.1) !important;
        border-left: 3px solid var(--accent-color);
        font-style: italic;
        color: var(--text-secondary);
    }
    
    .context-content i {
        margin-right: 0.5rem;
        color: var(--accent-color);
    }
    
    .chat-input-container textarea {
        resize: none;
        min-height: 40px;
        max-height: 120px;
        overflow-y: auto;
    }
`;
document.head.appendChild(chatStyles);

// Create global chat interface instance
window.chatInterface = new ChatInterface();
