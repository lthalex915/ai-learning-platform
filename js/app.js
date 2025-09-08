/**
 * Main Application Controller
 * Coordinates all components and handles main application logic
 */

class App {
  constructor() {
    this.currentView = "welcome";
    this.uploadedFiles = [];
    this.currentDocument = null;

    this.initializeApp();
  }

  /**
   * Initialize the application
   */
  initializeApp() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupApp());
    } else {
      this.setupApp();
    }
  }

  /**
   * Set up the application after DOM is ready
   */
  setupApp() {
    this.initializeEventListeners();
    this.loadStoredData();
    this.setupInitialState();

    console.log("AI E-Learning Platform initialized successfully");
  }

  /**
   * Initialize main event listeners
   */
  initializeEventListeners() {
    // Navigation buttons
    this.setupNavigationButtons();

    // Exercise type selection
    this.setupExerciseTypeSelection();

    // Topic selection for explanation
    this.setupTopicSelection();

    // History button
    this.setupHistoryButton();

    // Settings button
    this.setupSettingsButton();

    // Window events
    this.setupWindowEvents();
  }

  /**
   * Set up navigation button event listeners
   */
  setupNavigationButtons() {
    const summarizeBtn = document.getElementById("summarizeBtn");
    const explainBtn = document.getElementById("explainBtn");
    const exerciseBtn = document.getElementById("exerciseBtn");

    if (summarizeBtn) {
      summarizeBtn.addEventListener("click", () => this.handleSummarize());
    }

    if (explainBtn) {
      explainBtn.addEventListener("click", () => this.handleExplain());
    }

    if (exerciseBtn) {
      exerciseBtn.addEventListener("click", () =>
        this.handleExerciseGeneration()
      );
    }
  }

  /**
   * Set up exercise type selection
   */
  setupExerciseTypeSelection() {
    const exerciseTypeBtns = document.querySelectorAll(".exercise-type-btn");
    const generateBtn = document.getElementById("generateExerciseBtn");

    exerciseTypeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove previous selection
        exerciseTypeBtns.forEach((b) => b.classList.remove("selected"));
        // Add selection to clicked button
        btn.classList.add("selected");
      });
    });

    if (generateBtn) {
      generateBtn.addEventListener("click", () => this.generateExercises());
    }
  }

  /**
   * Set up topic selection for explanation
   */
  setupTopicSelection() {
    const explainAllBtn = document.getElementById("explainAllBtn");

    if (explainAllBtn) {
      explainAllBtn.addEventListener("click", () => this.explainAllContent());
    }
  }

  /**
   * Set up history button
   */
  setupHistoryButton() {
    const historyBtn = document.getElementById("historyBtn");

    if (historyBtn) {
      historyBtn.addEventListener("click", () => this.showHistory());
    }
  }

  /**
   * Set up settings button
   */
  setupSettingsButton() {
    const settingsBtn = document.getElementById("settingsBtn");

    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => this.showSettings());
    }

    // Settings modal event listeners
    this.setupSettingsModalListeners();
  }

  /**
   * Set up settings modal event listeners
   */
  setupSettingsModalListeners() {
    const modal = document.getElementById("aiSettingsModal");
    const closeBtn = document.getElementById("closeSettingsBtn");
    const realAIToggle = document.getElementById("realAIToggle");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const toggleVisibilityBtn = document.getElementById(
      "toggleApiKeyVisibility"
    );
    const testConnectionBtn = document.getElementById("testConnectionBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const modelSelect = document.getElementById("modelSelect");
    const customModelGroup = document.getElementById("customModelGroup");
    const customModelInput = document.getElementById("customModelInput");
    const modelInfoName = document.getElementById("modelInfoName");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideSettings());
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideSettings();
        }
      });
    }

    if (realAIToggle) {
      realAIToggle.addEventListener("change", (e) =>
        this.handleAIModeToggle(e.target.checked)
      );
    }

    if (apiKeyInput) {
      apiKeyInput.addEventListener("input", () => this.handleApiKeyInput());
    }

    if (toggleVisibilityBtn) {
      toggleVisibilityBtn.addEventListener("click", () =>
        this.toggleApiKeyVisibility()
      );
    }

    if (testConnectionBtn) {
      testConnectionBtn.addEventListener("click", () =>
        this.testApiConnection()
      );
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => this.saveSettings());
    }

    // Model select handlers
    if (modelSelect) {
      modelSelect.addEventListener("change", () => {
        const isOther = modelSelect.value === "__other__";
        if (customModelGroup)
          customModelGroup.style.display = isOther ? "block" : "none";
        const selectedModel =
          isOther && customModelInput
            ? customModelInput.value.trim()
            : modelSelect.value;
        if (modelInfoName && selectedModel) {
          modelInfoName.textContent = selectedModel;
        }
        // Enable Test button only if we have api key and model chosen
        this.handleApiKeyInput();
      });
    }
    if (customModelInput) {
      customModelInput.addEventListener("input", () => {
        if (modelSelect && modelSelect.value === "__other__" && modelInfoName) {
          modelInfoName.textContent =
            customModelInput.value.trim() || "custom model";
        }
        this.handleApiKeyInput();
      });
    }
  }

  /**
   * Set up window events
   */
  setupWindowEvents() {
    // Handle window resize for responsive design
    window.addEventListener("resize", () => this.handleWindowResize());

    // Handle beforeunload to save data
    window.addEventListener("beforeunload", (e) => this.handleBeforeUnload(e));

    // Handle keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleGlobalKeyboardShortcuts(e)
    );
  }

  /**
   * Load stored data on app initialization
   */
  loadStoredData() {
    // Load stored files
    if (window.fileHandler) {
      window.fileHandler.loadStoredFiles();
    }

    // Update uploaded files reference
    this.uploadedFiles = window.fileHandler
      ? window.fileHandler.uploadedFiles
      : [];
  }

  /**
   * Set up initial application state
   */
  setupInitialState() {
    // Show welcome screen initially
    this.showWelcomeScreen();

    // Disable action buttons if no files
    if (this.uploadedFiles.length === 0) {
      this.disableActionButtons();
    }

    // Load saved AI settings
    this.loadSavedSettings();
    // Load saved model settings
    this.loadSavedModelSettings();
  }

  /**
   * Load saved AI settings from localStorage
   */
  loadSavedSettings() {
    const savedMode = localStorage.getItem("ai_mode");
    const savedApiKey = localStorage.getItem("openrouter_api_key");

    if (window.aiProcessor) {
      // Set API key if available
      if (savedApiKey) {
        window.aiProcessor.setApiKey(savedApiKey);
      }

      // Enable AI mode by default - always try to use real AI if configured
      if (savedApiKey) {
        window.aiProcessor.setUseRealAI(true);
        localStorage.setItem("ai_mode", "real");
        console.log("Real AI mode enabled by default with saved API key");
      } else {
        // If no API key, still enable real AI mode but it will fallback to simulated
        window.aiProcessor.setUseRealAI(true);
        localStorage.setItem("ai_mode", "real");
        console.log(
          "Real AI mode enabled by default (will use simulated as fallback)"
        );
      }
    }
  }

  /**
   * Load saved model selection into settings UI (if open) and keep in memory
   */
  loadSavedModelSettings() {
    const modelSelect = document.getElementById("modelSelect");
    const customModelGroup = document.getElementById("customModelGroup");
    const customModelInput = document.getElementById("customModelInput");
    const modelInfoName = document.getElementById("modelInfoName");

    const savedModel =
      localStorage.getItem("openrouter_model") || "google/gemini-2.5-pro";
    const savedCustom = localStorage.getItem("openrouter_model_custom") || "";

    if (modelSelect) {
      // Determine if saved model is one of defaults
      const defaultOptions = Array.from(modelSelect.options).map(
        (o) => o.value
      );
      if (defaultOptions.includes(savedModel)) {
        modelSelect.value = savedModel;
        if (customModelGroup) customModelGroup.style.display = "none";
      } else {
        modelSelect.value = "__other__";
        if (customModelGroup) customModelGroup.style.display = "block";
        if (customModelInput)
          customModelInput.value = savedModel || savedCustom;
      }
    }

    if (modelInfoName) {
      modelInfoName.textContent =
        modelSelect && modelSelect.value === "__other__"
          ? customModelInput
            ? customModelInput.value || "custom model"
            : "custom model"
          : savedModel;
    }

    // Update aiProcessor's handler if present
    if (window.aiProcessor && window.aiProcessor.realAIHandler) {
      const effectiveModel =
        modelSelect && modelSelect.value === "__other__"
          ? customModelInput
            ? customModelInput.value.trim()
            : savedModel
          : savedModel;
      if (effectiveModel) {
        window.aiProcessor.realAIHandler.model = effectiveModel;
      }
    }
  }

  /**
   * Handle summarize action
   */
  async handleSummarize() {
    if (!this.validateFilesUploaded()) return;

    try {
      const files = window.fileHandler.getAllFilesContent();
      const document = await window.aiProcessor.summarizeDocuments(files);

      this.displayDocument(document);
      this.currentView = "document";
    } catch (error) {
      console.error("Summarize error:", error);
      this.showError("Failed to generate summary: " + error.message);
    }
  }

  /**
   * Handle explain action
   */
  async handleExplain() {
    if (!this.validateFilesUploaded()) return;

    const files = window.fileHandler.getAllFilesContent();

    // Extract topics for selection
    const topics = window.aiProcessor.extractTopicsForSelection(files);

    if (topics.length > 0) {
      this.showTopicSelection(topics, files);
    } else {
      // No topics found, explain all content
      this.explainAllContent();
    }
  }

  /**
   * Show topic selection interface
   */
  showTopicSelection(topics, files) {
    this.hideAllViews();

    const topicSelection = document.getElementById("topicSelection");
    const topicList = document.getElementById("topicList");

    if (!topicSelection || !topicList) return;

    // Clear previous topics
    topicList.innerHTML = "";

    // Add topic items
    topics.forEach((topic) => {
      const topicItem = document.createElement("div");
      topicItem.className = "topic-item";
      topicItem.innerHTML = `
                <h4>${topic.title}</h4>
                <p>${topic.description}</p>
            `;

      topicItem.addEventListener("click", () => {
        this.explainSpecificTopic(files, topic.title);
      });

      topicList.appendChild(topicItem);
    });

    topicSelection.style.display = "block";
    this.currentView = "topicSelection";
  }

  /**
   * Explain specific topic
   */
  async explainSpecificTopic(files, topic) {
    try {
      const document = await window.aiProcessor.explainContent(files, topic);
      this.displayDocument(document);
      this.currentView = "document";
    } catch (error) {
      console.error("Explain topic error:", error);
      this.showError("Failed to generate explanation: " + error.message);
    }
  }

  /**
   * Explain all content
   */
  async explainAllContent() {
    if (!this.validateFilesUploaded()) return;

    try {
      const files = window.fileHandler.getAllFilesContent();
      const document = await window.aiProcessor.explainContent(files);

      this.displayDocument(document);
      this.currentView = "document";
    } catch (error) {
      console.error("Explain all error:", error);
      this.showError("Failed to generate explanation: " + error.message);
    }
  }

  /**
   * Handle exercise generation
   */
  handleExerciseGeneration() {
    if (!this.validateFilesUploaded()) return;

    this.hideAllViews();

    const exerciseOptions = document.getElementById("exerciseOptions");
    if (exerciseOptions) {
      exerciseOptions.style.display = "block";
      this.currentView = "exerciseOptions";
    }
  }

  /**
   * Generate exercises based on selected type
   */
  async generateExercises() {
    const selectedType = document.querySelector(".exercise-type-btn.selected");
    const questionCount = document.getElementById("questionCount");

    if (!selectedType) {
      this.showError("Please select an exercise type");
      return;
    }

    const exerciseType = selectedType.dataset.type;
    const count = questionCount ? parseInt(questionCount.value) : 5;

    try {
      const files = window.fileHandler.getAllFilesContent();
      const result = await window.aiProcessor.generateExercises(
        files,
        exerciseType,
        count
      );

      // Display the exercise document (questions only)
      this.displayDocument(result.exercises);
      this.currentView = "document";
    } catch (error) {
      console.error("Exercise generation error:", error);
      this.showError("Failed to generate exercises: " + error.message);
    }
  }

  /**
   * Show solution overlay
   */
  showSolutionOverlay() {
    const overlay = document.getElementById("solutionOverlay");
    if (overlay) {
      overlay.style.display = "flex";
    }
  }

  /**
   * Display document in the editor
   */
  displayDocument(doc) {
    this.currentDocument = doc;

    // Hide all views first, then display the document
    this.hideAllViews();

    if (window.documentEditor) {
      window.documentEditor.displayDocument(doc);
    }

    // Dispatch an event so chat can associate session with this document
    try {
      const evt = new CustomEvent("document:displayed", {
        detail: { id: doc.id, title: doc.title, type: doc.type },
      });
      window.document.dispatchEvent(evt);
    } catch (e) {
      // CustomEvent may not be supported in very old browsers; fallback
      console.warn("CustomEvent not supported, using fallback");
      // Create a simple event object for older browsers
      const evt = {
        type: "document:displayed",
        detail: { id: doc.id, title: doc.title, type: doc.type },
      };
      // Try to dispatch using the global document object
      if (
        window.document &&
        typeof window.document.dispatchEvent === "function"
      ) {
        window.document.dispatchEvent(evt);
      }
    }

    this.currentView = "document";
  }

  /**
   * Show welcome screen
   */
  showWelcomeScreen() {
    this.hideAllViews();

    const welcomeScreen = document.getElementById("welcomeScreen");
    if (welcomeScreen) {
      welcomeScreen.style.display = "flex";
      this.currentView = "welcome";
    }
  }

  /**
   * Show history of saved documents
   */
  showHistory() {
    // Create history modal (docs + chats)
    const documents = window.storageManager.getDocuments() || [];
    const chats = window.storageManager.getChats() || [];
    this.showHistoryModal(documents, chats);
  }

  /**
   * Show history modal
   */
  showHistoryModal(documents, chats) {
    // Create modal if it doesn't exist
    let modal = document.getElementById("historyModal");
    if (!modal) {
      modal = this.createHistoryModal();
    }

    const modalBody = modal.querySelector(".modal-body");
    modalBody.innerHTML = "";

    // Tabs header
    const tabs = document.createElement("div");
    tabs.className = "history-tabs";
    tabs.innerHTML = `
            <div class="tabs-header">
                <button class="tab-btn active" data-tab="docsTab"><i class="fas fa-file-alt"></i> Docs</button>
                <button class="tab-btn" data-tab="chatsTab"><i class="fas fa-comments"></i> AI Assistant Chat</button>
            </div>
            <div class="tabs-body">
                <div id="docsTab" class="tab-panel active">
                    <div class="document-history-list" id="historyDocsList"></div>
                </div>
                <div id="chatsTab" class="tab-panel">
                    <div class="chat-history-filter">
                        <label>Select Document:</label>
                        <select id="historyDocFilter">
                            <option value="">-- Select a document --</option>
                        </select>
                    </div>
                    <div class="chat-history-list" id="historyChatsList">
                        <div class="empty-hint">Select a document to view associated chats.</div>
                    </div>
                </div>
            </div>
        `;
    modalBody.appendChild(tabs);

    // Populate Docs list
    const docList = tabs.querySelector("#historyDocsList");
    if (documents.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty-hint";
      empty.textContent = "No saved documents.";
      docList.appendChild(empty);
    } else {
      documents.forEach((doc) => {
        const docItem = document.createElement("div");
        docItem.className = "history-item";
        docItem.innerHTML = `
                    <div class="history-item-header">
                        <h4>${doc.title}</h4>
                        <span class="document-type ${
                          doc.type
                        }">${doc.type.toUpperCase()}</span>
                    </div>
                    <div class="history-item-meta">
                        <span>Created: ${new Date(
                          doc.createdAt
                        ).toLocaleDateString()}</span>
                        ${
                          doc.updatedAt && doc.updatedAt !== doc.createdAt
                            ? `<span>Updated: ${new Date(
                                doc.updatedAt
                              ).toLocaleDateString()}</span>`
                            : ""
                        }
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-small" data-action="open" data-id="${
                          doc.id
                        }">Open</button>
                        <button class="btn-small btn-danger" data-action="delete" data-id="${
                          doc.id
                        }">Delete</button>
                        <button class="btn-small" data-action="export-md" data-id="${
                          doc.id
                        }">Export .md</button>
                    </div>
                `;
        docList.appendChild(docItem);
      });

      // Wire doc actions
      docList.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        if (action === "open") this.loadDocument(id);
        if (action === "delete") this.deleteDocument(id);
        if (action === "export-md") this.exportDocumentAsMarkdown(id);
      });
    }

    // Populate doc filter for chats
    const filterSelect = tabs.querySelector("#historyDocFilter");
    documents.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d.id;
      opt.textContent = `${d.title} (${d.type})`;
      filterSelect.appendChild(opt);
    });

    // Handle tab switching
    const tabButtons = tabs.querySelectorAll(".tab-btn");
    const panels = tabs.querySelectorAll(".tab-panel");
    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.remove("active"));
        panels.forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const target = tabs.querySelector(`#${btn.dataset.tab}`);
        if (target) target.classList.add("active");
      });
    });

    // Render chats when a doc is selected
    const chatsList = tabs.querySelector("#historyChatsList");
    filterSelect.addEventListener("change", () => {
      const docId = filterSelect.value;
      chatsList.innerHTML = "";
      if (!docId) {
        chatsList.innerHTML =
          '<div class="empty-hint">Select a document to view associated chats.</div>';
        return;
      }
      const associated = (chats || [])
        .filter((c) => c.docId === docId)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      if (associated.length === 0) {
        chatsList.innerHTML =
          '<div class="empty-hint">No chats associated with this document.</div>';
        return;
      }
      associated.forEach((chat) => {
        const item = document.createElement("div");
        item.className = "history-item";
        const title = chat.title || "Chat Session";
        const last = new Date(
          chat.updatedAt || chat.createdAt
        ).toLocaleString();
        item.innerHTML = `
                    <div class="history-item-header">
                        <h4>${title}</h4>
                        <span class="document-type chat">CHAT</span>
                    </div>
                    <div class="history-item-meta">
                        <span>Updated: ${last}</span>
                        <span>Messages: ${(chat.messages || []).length}</span>
                    </div>
                    <div class="history-item-actions">
                        <button class="btn-small" data-action="open-chat" data-id="${
                          chat.id
                        }">Open</button>
                        <button class="btn-small" data-action="export-chat" data-id="${
                          chat.id
                        }">Export .json</button>
                        <button class="btn-small btn-danger" data-action="delete-chat" data-id="${
                          chat.id
                        }">Delete</button>
                    </div>
                `;
        chatsList.appendChild(item);
      });

      // Wire chat actions
      chatsList.addEventListener(
        "click",
        (e) => {
          const btn = e.target.closest("button[data-action]");
          if (!btn) return;
          const id = btn.dataset.id;
          const action = btn.dataset.action;
          if (action === "open-chat") this.openChatSessionById(id);
          if (action === "export-chat") this.exportChatAsJson(id);
          if (action === "delete-chat") this.deleteChatSession(id, docId);
        },
        { once: true }
      );
    });

    modal.classList.add("open");
  }

  /**
   * Create history modal
   */
  createHistoryModal() {
    const modal = document.createElement("div");
    modal.id = "historyModal";
    modal.className = "modal";
    modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>History</h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <!-- Content will be populated dynamically -->
                </div>
            </div>
        `;

    document.body.appendChild(modal);

    // Add event listener for close button
    const closeBtn = modal.querySelector(".close-modal");
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("open");
    });

    return modal;
  }

  /**
   * Load document from history
   */
  loadDocument(documentId) {
    const document = window.storageManager.getDocument(documentId);
    if (document) {
      this.displayDocument(document);

      // Close history modal
      const modal = document.getElementById("historyModal");
      if (modal) {
        modal.classList.remove("open");
      }
    }
  }

  /**
   * Delete document from history
   */
  deleteDocument(documentId) {
    if (confirm("Are you sure you want to delete this document?")) {
      window.storageManager.deleteDocument(documentId);
      this.showHistory(); // Refresh the history view
    }
  }

  /**
   * Delete a chat session
   */
  deleteChatSession(chatId, refreshDocId = "") {
    if (!chatId) return;
    if (!confirm("Delete this chat session?")) return;
    window.storageManager.deleteChatSession(chatId);
    // If chat being viewed is current in side panel, optionally clear it
    if (
      window.chatInterface &&
      window.chatInterface.currentSession &&
      window.chatInterface.currentSession.id === chatId
    ) {
      window.chatInterface.clearChatHistory();
    }
    this.showHistory();
    // Re-select doc filter if provided
    const filter = document.getElementById("historyDocFilter");
    if (filter && refreshDocId) filter.value = refreshDocId;
  }

  /**
   * Open a chat session by id in the side panel
   */
  openChatSessionById(chatId) {
    const sessions = window.storageManager.getChats() || [];
    const found = sessions.find((s) => s.id === chatId);
    if (!found) return;
    if (window.chatInterface) {
      // ensure side panel open and load messages
      window.chatInterface.openChat();
      window.chatInterface.switchSession(chatId);
    }
  }

  /**
   * Export a chat session as JSON string (download)
   */
  exportChatAsJson(chatId) {
    const sessions = window.storageManager.getChats() || [];
    const found = sessions.find((s) => s.id === chatId);
    if (!found) return;
    const blob = new Blob([JSON.stringify(found, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeTitle = (found.title || "chat").replace(/[^a-z0-9-_]+/gi, "_");
    a.download = `${safeTitle}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export a document as Markdown .md
   */
  exportDocumentAsMarkdown(documentId) {
    const doc = window.storageManager.getDocument(documentId);
    if (!doc) return;
    const content = `# ${doc.title}\n\n${doc.content || ""}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (doc.title || "document").replace(/[^a-z0-9-_]+/gi, "_");
    a.href = url;
    a.download = `${safeTitle}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Hide all main views
   */
  hideAllViews() {
    const views = [
      "welcomeScreen",
      "documentContainer",
      "exerciseOptions",
      "topicSelection",
    ];

    views.forEach((viewId) => {
      const view = document.getElementById(viewId);
      if (view) {
        view.style.display = "none";
      }
    });
  }

  /**
   * Validate that files are uploaded
   */
  validateFilesUploaded() {
    if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
      this.showError("Please upload some files first");
      return false;
    }
    return true;
  }

  /**
   * Enable action buttons
   */
  enableActionButtons() {
    const buttons = ["summarizeBtn", "explainBtn", "exerciseBtn"];
    buttons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("disabled");
      }
    });
  }

  /**
   * Disable action buttons
   */
  disableActionButtons() {
    const buttons = ["summarizeBtn", "explainBtn", "exerciseBtn"];
    buttons.forEach((btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.disabled = true;
        btn.classList.add("disabled");
      }
    });
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    // Update chat interface for mobile
    if (window.chatInterface) {
      // Handle responsive changes if needed
    }
  }

  /**
   * Handle before unload
   */
  handleBeforeUnload(e) {
    // Save any unsaved changes
    if (window.documentEditor && window.documentEditor.isDocumentEditing()) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    }
  }

  /**
   * Handle global keyboard shortcuts
   */
  handleGlobalKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "1":
          e.preventDefault();
          this.handleSummarize();
          break;
        case "2":
          e.preventDefault();
          this.handleExplain();
          break;
        case "3":
          e.preventDefault();
          this.handleExerciseGeneration();
          break;
        case "h":
          e.preventDefault();
          this.showHistory();
          break;
      }
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (window.fileHandler) {
      window.fileHandler.showError(message);
    } else {
      alert(message);
    }
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    if (window.documentEditor) {
      window.documentEditor.showSuccessMessage(message);
    }
  }

  /**
   * Get current application state
   */
  getState() {
    return {
      currentView: this.currentView,
      uploadedFiles: this.uploadedFiles,
      currentDocument: this.currentDocument,
    };
  }

  /**
   * Update uploaded files reference
   */
  updateUploadedFiles(files) {
    this.uploadedFiles = files;

    if (files.length > 0) {
      this.enableActionButtons();
    } else {
      this.disableActionButtons();
    }
  }

  /**
   * Show AI settings modal
   */
  showSettings() {
    const modal = document.getElementById("aiSettingsModal");
    if (modal) {
      this.loadSettingsState();
      modal.style.display = "flex";
      setTimeout(() => modal.classList.add("open"), 10);
    }
  }

  /**
   * Hide AI settings modal
   */
  hideSettings() {
    const modal = document.getElementById("aiSettingsModal");
    if (modal) {
      modal.classList.remove("open");
      setTimeout(() => (modal.style.display = "none"), 300);
    }
  }

  /**
   * Load current settings state into the modal
   */
  loadSettingsState() {
    const realAIToggle = document.getElementById("realAIToggle");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const currentMode = document.getElementById("currentMode");
    const modeDescription = document.getElementById("modeDescription");
    const apiKeySection = document.getElementById("apiKeySection");
    const apiStatus = document.getElementById("apiStatus");
    const testConnectionBtn = document.getElementById("testConnectionBtn");

    if (window.aiProcessor) {
      const isRealAI = window.aiProcessor.useRealAI;
      const isConfigured = window.aiProcessor.isRealAIAvailable();

      if (realAIToggle) {
        realAIToggle.checked = true; // Always checked since AI mode is enabled by default
      }

      if (currentMode && modeDescription) {
        if (isConfigured) {
          currentMode.textContent = "Real AI";
          modeDescription.textContent = "Using OpenRouter API for AI responses";
        } else {
          currentMode.textContent = "Real AI (Fallback Mode)";
          modeDescription.textContent =
            "AI mode enabled - will use simulated responses until API key is configured";
        }
      }

      if (apiKeySection) {
        apiKeySection.style.display = "block"; // Always show since AI mode is always on
      }

      if (apiStatus) {
        this.updateApiStatus(isConfigured);
      }

      if (testConnectionBtn) {
        testConnectionBtn.disabled = !isConfigured;
      }

      // Load saved API key
      const savedApiKey = localStorage.getItem("openrouter_api_key");
      if (apiKeyInput && savedApiKey) {
        // Store the actual API key for toggle functionality
        apiKeyInput.dataset.actualValue = savedApiKey;
        apiKeyInput.dataset.hasKey = "true";
        // Show masked version initially
        apiKeyInput.value = "••••••••••••••••••••••••••••••••••••••••";
        // Ensure input type is password
        apiKeyInput.type = "password";
      } else if (apiKeyInput) {
        // Clear any previous data
        delete apiKeyInput.dataset.actualValue;
        delete apiKeyInput.dataset.hasKey;
        apiKeyInput.value = "";
      }
    }
  }

  /**
   * Handle AI mode toggle
   */
  handleAIModeToggle(useRealAI) {
    const apiKeySection = document.getElementById("apiKeySection");
    const currentMode = document.getElementById("currentMode");
    const modeDescription = document.getElementById("modeDescription");

    if (apiKeySection) {
      apiKeySection.style.display = useRealAI ? "block" : "none";
    }

    if (currentMode && modeDescription) {
      if (useRealAI) {
        currentMode.textContent = "Real AI";
        modeDescription.textContent = "Using OpenRouter API for AI responses";
      } else {
        currentMode.textContent = "Simulated AI";
        modeDescription.textContent =
          "Using simulated AI responses for testing";
      }
    }
  }

  /**
   * Handle API key input
   */
  handleApiKeyInput() {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const testConnectionBtn = document.getElementById("testConnectionBtn");
    const modelSelect = document.getElementById("modelSelect");
    const customModelInput = document.getElementById("customModelInput");

    if (apiKeyInput) {
      const hasValue = apiKeyInput.value.trim().length > 0;
      const isNotMasked = !apiKeyInput.value.startsWith("••••");

      // Determine if a model is selected/typed
      let modelValid = true;
      if (modelSelect) {
        if (modelSelect.value === "__other__") {
          modelValid = !!(
            customModelInput && customModelInput.value.trim().length > 0
          );
        } else {
          modelValid = !!modelSelect.value;
        }
      }

      if (testConnectionBtn) {
        testConnectionBtn.disabled = !modelValid || !hasValue || !isNotMasked;
      }

      // Clear the stored data if user starts typing new content
      if (isNotMasked && apiKeyInput.dataset.hasKey) {
        delete apiKeyInput.dataset.hasKey;
        delete apiKeyInput.dataset.actualValue;
      }
    }
  }

  /**
   * Toggle API key visibility
   */
  toggleApiKeyVisibility() {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const toggleBtn = document.getElementById("toggleApiKeyVisibility");

    if (apiKeyInput && toggleBtn) {
      const icon = toggleBtn.querySelector("i");

      if (apiKeyInput.type === "password") {
        // Show actual API key
        if (apiKeyInput.dataset.actualValue) {
          apiKeyInput.value = apiKeyInput.dataset.actualValue;
        }
        apiKeyInput.type = "text";
        icon.className = "fas fa-eye-slash";
      } else {
        // Hide API key with mask
        if (apiKeyInput.dataset.hasKey) {
          apiKeyInput.value = "••••••••••••••••••••••••••••••••••••••••";
        }
        apiKeyInput.type = "password";
        icon.className = "fas fa-eye";
      }
    }
  }

  /**
   * Test API connection
   */
  async testApiConnection() {
    const testConnectionBtn = document.getElementById("testConnectionBtn");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const modelSelect = document.getElementById("modelSelect");
    const customModelInput = document.getElementById("customModelInput");

    if (!apiKeyInput || !testConnectionBtn) return;

    const apiKey = apiKeyInput.dataset.hasKey
      ? localStorage.getItem("openrouter_api_key")
      : apiKeyInput.value.trim();

    if (!apiKey) {
      this.showError("Please enter an API key");
      return;
    }

    testConnectionBtn.disabled = true;
    testConnectionBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Testing...';

    try {
      // Determine model to use for test
      let model = "google/gemini-2.5-pro";
      if (modelSelect) {
        model =
          modelSelect.value === "__other__"
            ? customModelInput
              ? customModelInput.value.trim()
              : model
            : modelSelect.value;
      }

      // Test the API key by making a simple request
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 10,
          }),
        }
      );

      if (response.ok) {
        this.showSuccess("API connection successful!");
        this.updateApiStatus(true);
      } else {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("API test failed:", error);
      this.showError("API connection failed: " + error.message);
      this.updateApiStatus(false, error.message);
    } finally {
      testConnectionBtn.disabled = false;
      testConnectionBtn.innerHTML =
        '<i class="fas fa-plug"></i> Test Connection';
    }
  }

  /**
   * Update API status display
   */
  updateApiStatus(isConfigured, errorMessage = null) {
    const apiStatus = document.getElementById("apiStatus");

    if (apiStatus) {
      const icon = apiStatus.querySelector("i");
      const text = apiStatus.querySelector("span");

      apiStatus.className = "api-status";

      if (errorMessage) {
        apiStatus.classList.add("error");
        icon.style.color = "var(--error-color)";
        text.textContent = "Connection failed";
      } else if (isConfigured) {
        apiStatus.classList.add("configured");
        icon.style.color = "var(--success-color)";
        text.textContent = "API configured";
      } else {
        apiStatus.classList.add("not-configured");
        icon.style.color = "var(--text-muted)";
        text.textContent = "Not configured";
      }
    }
  }

  /**
   * Save settings
   */
  saveSettings() {
    const realAIToggle = document.getElementById("realAIToggle");
    const apiKeyInput = document.getElementById("apiKeyInput");
    const modelSelect = document.getElementById("modelSelect");
    const customModelInput = document.getElementById("customModelInput");

    if (!realAIToggle) return;

    const useRealAI = realAIToggle.checked;
    let apiKey = null;

    if (useRealAI && apiKeyInput) {
      if (apiKeyInput.dataset.hasKey && apiKeyInput.dataset.actualValue) {
        // Keep existing key
        apiKey = apiKeyInput.dataset.actualValue;
      } else if (
        apiKeyInput.value.trim() &&
        !apiKeyInput.value.startsWith("••••")
      ) {
        // Use new key (not masked)
        apiKey = apiKeyInput.value.trim();
      } else {
        // Fallback to localStorage
        apiKey = localStorage.getItem("openrouter_api_key");
      }

      if (!apiKey) {
        this.showError("Please enter an API key to use Real AI");
        return;
      }

      // Save API key to localStorage
      localStorage.setItem("openrouter_api_key", apiKey);
    }

    // Resolve model selection
    let chosenModel = "google/gemini-2.5-pro";
    if (modelSelect) {
      if (modelSelect.value === "__other__") {
        const custom = customModelInput ? customModelInput.value.trim() : "";
        if (!custom) {
          this.showError(
            "Please enter a custom model id or choose a default model."
          );
          return;
        }
        chosenModel = custom;
        localStorage.setItem("openrouter_model_custom", custom);
      } else {
        chosenModel = modelSelect.value;
        localStorage.removeItem("openrouter_model_custom");
      }
      localStorage.setItem("openrouter_model", chosenModel);
    } else {
      // Ensure a default exists
      localStorage.setItem("openrouter_model", chosenModel);
    }

    // Apply settings to AI processor
    if (window.aiProcessor) {
      if (apiKey) {
        window.aiProcessor.setApiKey(apiKey);
      }
      // Update model on realAI handler if exists
      if (window.aiProcessor.realAIHandler) {
        window.aiProcessor.realAIHandler.model = chosenModel;
      }

      const success = window.aiProcessor.setUseRealAI(useRealAI);

      if (useRealAI && !success) {
        this.showError("Failed to enable Real AI. Please check your API key.");
        return;
      }
    }

    // Save preference
    localStorage.setItem("ai_mode", useRealAI ? "real" : "simulated");

    this.showSuccess("Settings saved successfully!");
    this.hideSettings();
  }
}

// Add CSS for history modal
const historyStyles = document.createElement("style");
historyStyles.textContent = `
    .document-history-list {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .history-item {
        padding: 1rem;
        border: 1px solid var(--border-light);
        border-radius: var(--radius-md);
        margin-bottom: 1rem;
        background: var(--bg-secondary);
    }
    
    .history-item-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }
    
    .history-item-header h4 {
        margin: 0;
        color: var(--text-primary);
        font-size: var(--font-size-lg);
    }
    
    .history-item-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        font-size: var(--font-size-sm);
        color: var(--text-muted);
    }
    
    .history-item-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .btn-small {
        padding: 0.25rem 0.75rem;
        font-size: var(--font-size-sm);
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-sm);
        background: var(--bg-primary);
        color: var(--text-primary);
        cursor: pointer;
        transition: all var(--transition-fast);
    }
    
    .btn-small:hover {
        background: var(--primary-color);
        color: var(--text-white);
        border-color: var(--primary-color);
    }
`;
document.head.appendChild(historyStyles);

// Initialize the application
window.app = new App();

// Update file handler to notify app of file changes
if (window.fileHandler) {
  const originalUpdateFileList = window.fileHandler.updateFileList;
  window.fileHandler.updateFileList = function () {
    originalUpdateFileList.call(this);
    if (window.app) {
      window.app.updateUploadedFiles(this.uploadedFiles);
    }
  };
}
