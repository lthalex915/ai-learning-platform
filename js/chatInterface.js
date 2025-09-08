/**
 * Chat Interface for AI Assistant
 * Handles chat functionality and follow-up questions
 */

class ChatInterface {
    constructor() {
        this.isOpen = false;
        this.currentSession = null;
        this.messages = [];
        this.selectedText = '';
        
        this.initializeChat();
        this.initializeEventListeners();
    }

    /**
     * Initialize chat interface
     */
    initializeChat() {
        this.chatPanel = document.getElementById('chatPanel');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendChatBtn = document.getElementById('sendChatBtn');
        this.closeChatBtn = document.getElementById('closeChatBtn');
        
        // Create chat toggle button for mobile
        this.createChatToggle();
        
        // Load existing chat session if available
        this.loadChatSession();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Send message button
        if (this.sendChatBtn) {
            this.sendChatBtn.addEventListener('click', () => this.sendMessage());
        }

        // Enter key to send message
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize input
            this.chatInput.addEventListener('input', () => this.autoResizeInput());
        }

        // Close chat button
        if (this.closeChatBtn) {
            this.closeChatBtn.addEventListener('click', () => this.closeChat());
        }

        // Chat toggle button
        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', () => this.toggleChat());
        }

        // Handle mobile menu toggle
        this.handleMobileMenuToggle();
    }

    /**
     * Create chat toggle button for mobile
     */
    createChatToggle() {
        this.chatToggle = document.createElement('button');
        this.chatToggle.className = 'chat-toggle';
        this.chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
        this.chatToggle.title = 'Open AI Assistant';
        document.body.appendChild(this.chatToggle);
    }

    /**
     * Handle mobile menu toggle
     */
    handleMobileMenuToggle() {
        // Add mobile menu toggle to header if needed
        const headerContent = document.querySelector('.header-content');
        if (headerContent && window.innerWidth <= 767) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'mobile-menu-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
            headerContent.insertBefore(mobileToggle, headerContent.firstChild);
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    /**
     * Open chat with selected text
     */
    openChatWithSelectedText(selectedText) {
        this.selectedText = selectedText;
        this.openChat();
        
        // Pre-fill input with context
        if (this.chatInput) {
            this.chatInput.placeholder = `Ask a question about: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`;
            this.chatInput.focus();
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
            type: 'context',
            content: `Selected text: "${text}"`,
            timestamp: new Date().toISOString()
        };
        
        this.addMessageToChat(contextMessage);
    }

    /**
     * Open chat panel
     */
    openChat() {
        this.isOpen = true;
        this.chatPanel.classList.add('open');
        
        if (this.chatToggle) {
            this.chatToggle.innerHTML = '<i class="fas fa-times"></i>';
            this.chatToggle.title = 'Close AI Assistant';
        }
        
        // Focus input
        if (this.chatInput) {
            setTimeout(() => this.chatInput.focus(), 300);
        }
        
        // Create new session if none exists
        if (!this.currentSession) {
            this.createNewSession();
        }
    }

    /**
     * Close chat panel
     */
    closeChat() {
        this.isOpen = false;
        this.chatPanel.classList.remove('open');
        this.selectedText = '';
        
        if (this.chatToggle) {
            this.chatToggle.innerHTML = '<i class="fas fa-comments"></i>';
            this.chatToggle.title = 'Open AI Assistant';
        }
        
        // Reset input placeholder
        if (this.chatInput) {
            this.chatInput.placeholder = 'Ask a question about the selected text...';
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
        this.chatInput.value = '';
        this.autoResizeInput();
        
        // Disable send button
        this.setSendButtonState(false);
        
        // Add user message
        const userMessage = {
            id: this.generateMessageId(),
            type: 'user',
            content: messageText,
            selectedText: this.selectedText,
            timestamp: new Date().toISOString()
        };
        
        this.addMessageToChat(userMessage);
        this.messages.push(userMessage);
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Generate AI response
            const aiResponse = await this.generateAIResponse(messageText, this.selectedText);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add AI message
            const aiMessage = {
                id: this.generateMessageId(),
                type: 'ai',
                content: aiResponse,
                timestamp: new Date().toISOString()
            };
            
            this.addMessageToChat(aiMessage);
            this.messages.push(aiMessage);
            
        } catch (error) {
            console.error('Error generating AI response:', error);
            this.hideTypingIndicator();
            
            const errorMessage = {
                id: this.generateMessageId(),
                type: 'ai',
                content: 'I apologize, but I encountered an error while processing your question. Please try again.',
                timestamp: new Date().toISOString()
            };
            
            this.addMessageToChat(errorMessage);
            this.messages.push(errorMessage);
        }
        
        // Re-enable send button
        this.setSendButtonState(true);
        
        // Clear selected text after first response
        this.selectedText = '';
        
        // Save session
        this.saveChatSession();
    }

    /**
     * Generate AI response
     */
    async generateAIResponse(question, selectedText = '') {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        let response = '';
        
        if (selectedText) {
            response = this.generateContextualResponse(question, selectedText);
        } else {
            response = this.generateGeneralResponse(question);
        }
        
        return response;
    }

    /**
     * Generate contextual response based on selected text
     */
    generateContextualResponse(question, selectedText) {
        const responses = [
            `Based on the selected text "${selectedText.substring(0, 100)}...", I can help explain this concept. This appears to be discussing a key principle that's important for understanding the broader topic. Let me break it down for you:

The main idea here is that this concept serves as a foundation for more advanced learning. Think of it as a building block that connects to other important ideas in your study materials.

Would you like me to explain any specific part in more detail?`,

            `Great question about "${selectedText.substring(0, 50)}...". This section is particularly important because it introduces concepts that you'll encounter throughout your studies.

Here's what you should focus on:
• The key terminology and definitions
• How this relates to other concepts you've learned
• Practical applications you might encounter

Is there a specific aspect of this that you'd like me to clarify further?`,

            `I can see you're asking about this specific passage. This is actually a really good section to focus on because it covers fundamental principles that many students find challenging at first.

The key insight here is understanding not just what is being described, but why it's important and how it fits into the bigger picture of your subject area.

What specific part would you like me to explain in simpler terms?`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Generate general response
     */
    generateGeneralResponse(question) {
        const lowerQuestion = question.toLowerCase();
        
        if (lowerQuestion.includes('explain') || lowerQuestion.includes('what is')) {
            return `I'd be happy to help explain that concept! To give you the most helpful explanation, could you please select the specific text or section you'd like me to focus on? This way, I can provide a detailed explanation that's directly relevant to your study materials.

You can select any text in your document and then ask your question - this helps me give you more accurate and contextual answers.`;
        }
        
        if (lowerQuestion.includes('how') || lowerQuestion.includes('why')) {
            return `That's an excellent question! Understanding the "how" and "why" behind concepts is crucial for deep learning. 

To give you the most helpful answer, I recommend:
1. Select the specific text you're curious about
2. Ask your question again with that context
3. I'll provide a detailed explanation tailored to that content

This approach ensures you get explanations that are directly relevant to your study materials rather than generic information.`;
        }
        
        if (lowerQuestion.includes('help') || lowerQuestion.includes('confused')) {
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
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.type}-message`;
        messageDiv.dataset.messageId = message.id;
        
        if (message.type === 'context') {
            messageDiv.className += ' context-message';
            messageDiv.innerHTML = `
                <div class="message-content context-content">
                    <i class="fas fa-quote-left"></i>
                    <p>${message.content}</p>
                </div>
                <div class="message-time">${this.formatTime(message.timestamp)}</div>
            `;
        } else {
            const content = document.createElement('div');
            content.className = 'message-content';
            content.innerHTML = this.formatMessageContent(message.content);
            
            const time = document.createElement('div');
            time.className = 'message-time';
            time.textContent = this.formatTime(message.timestamp);
            
            messageDiv.appendChild(content);
            messageDiv.appendChild(time);
        }
        
        return messageDiv;
    }

    /**
     * Format message content
     */
    formatMessageContent(content) {
        // Convert line breaks to HTML
        let formatted = content.replace(/\n/g, '<br>');
        
        // Convert bullet points
        formatted = formatted.replace(/^• (.+)$/gm, '<li>$1</li>');
        formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Convert numbered lists
        formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
        
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
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        
        return date.toLocaleDateString();
    }

    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai-message typing-indicator';
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
        const typingIndicator = this.chatMessages.querySelector('.typing-indicator');
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
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
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
    createNewSession() {
        this.currentSession = {
            id: storageManager.generateId(),
            title: 'Chat Session',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.messages = [];
        
        // Add welcome message
        const welcomeMessage = {
            id: this.generateMessageId(),
            type: 'ai',
            content: 'Hello! I\'m your AI learning assistant. Select any text in your document and ask me questions about it!',
            timestamp: new Date().toISOString()
        };
        
        this.addMessageToChat(welcomeMessage);
        this.messages.push(welcomeMessage);
    }

    /**
     * Save chat session
     */
    saveChatSession() {
        if (this.currentSession && this.messages.length > 1) {
            this.currentSession.messages = this.messages;
            this.currentSession.updatedAt = new Date().toISOString();
            storageManager.saveChatSession(this.currentSession);
        }
    }

    /**
     * Load chat session
     */
    loadChatSession() {
        const sessions = storageManager.getChats();
        if (sessions && sessions.length > 0) {
            // Load most recent session
            const latestSession = sessions.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            )[0];
            
            this.currentSession = latestSession;
            this.messages = latestSession.messages || [];
            
            // Display messages
            this.chatMessages.innerHTML = '';
            this.messages.forEach(message => {
                this.addMessageToChat(message);
            });
        } else {
            this.createNewSession();
        }
    }

    /**
     * Clear chat history
     */
    clearChatHistory() {
        this.chatMessages.innerHTML = '';
        this.messages = [];
        this.createNewSession();
    }

    /**
     * Get chat history
     */
    getChatHistory() {
        return this.messages;
    }

    /**
     * Export chat history
     */
    exportChatHistory() {
        if (this.messages.length === 0) return null;
        
        let content = `# Chat History\n\n`;
        content += `*Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
        
        this.messages.forEach(message => {
            if (message.type === 'user') {
                content += `**You:** ${message.content}\n\n`;
            } else if (message.type === 'ai') {
                content += `**AI Assistant:** ${message.content}\n\n`;
            } else if (message.type === 'context') {
                content += `*${message.content}*\n\n`;
            }
        });
        
        return content;
    }
}

// Add CSS for typing indicator and context messages
const chatStyles = document.createElement('style');
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
