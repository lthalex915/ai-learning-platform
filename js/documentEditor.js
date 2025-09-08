/**
 * Document Editor with Word-like Features
 * Handles document display, editing, and text selection functionality
 */

class DocumentEditor {
  constructor() {
    this.currentDocument = null;
    this.isEditing = false;
    this.selectedText = "";
    this.selectionRange = null;
    this.floatingBubble = null;
    this.initialized = false;

    // Ensure initialization after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initialize());
    } else {
      this.initialize();
    }
  }

  /**
   * Initialize the editor after DOM is ready
   */
  initialize() {
    if (this.initialized) return;

    this.initializeEditor();
    this.initializeEventListeners();
    this.initialized = true;

    console.log("DocumentEditor initialized successfully");
  }

  /**
   * Initialize the document editor
   */
  initializeEditor() {
    this.documentContainer = document.getElementById("documentContainer");
    this.documentContent = document.getElementById("documentContent");
    this.documentTitle = document.getElementById("documentTitle");
    this.documentType = document.getElementById("documentType");
    this.floatingBubble = document.getElementById("floatingBubble");

    // Initialize toolbar buttons
    this.editBtn = document.getElementById("editBtn");
    this.saveBtn = document.getElementById("saveBtn");
    this.exportDocxBtn = document.getElementById("exportDocxBtn");
    this.exportPdfBtn = document.getElementById("exportPdfBtn");
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Edit button
    if (this.editBtn) {
      this.editBtn.addEventListener("click", () => this.toggleEditMode());
    }

    // Save button
    if (this.saveBtn) {
      this.saveBtn.addEventListener("click", () => this.saveDocument());
    }

    // Solution button
    const solutionBtn = document.getElementById("solutionBtn");
    if (solutionBtn) {
      solutionBtn.addEventListener("click", () => this.handleSolutionRequest());
    }

    // Export buttons
    if (this.exportDocxBtn) {
      this.exportDocxBtn.addEventListener("click", () =>
        this.exportDocument("docx")
      );
    }
    if (this.exportPdfBtn) {
      this.exportPdfBtn.addEventListener("click", () =>
        this.exportDocument("pdf")
      );
    }

    // Solution acknowledgment modal
    this.setupSolutionModalListeners();

    // Text selection events
    document.addEventListener("mouseup", (e) => this.handleTextSelection(e));
    document.addEventListener("keyup", (e) => this.handleTextSelection(e));

    // Right-click context menu for document area
    if (this.documentContent) {
      this.documentContent.addEventListener("contextmenu", (e) => this.handleRightClick(e));
    }

    // Click outside to hide bubble
    document.addEventListener("click", (e) => this.handleDocumentClick(e));

    // Floating bubble actions
    this.initializeBubbleActions();

    // Auto-save functionality
    if (this.documentContent) {
      this.documentContent.addEventListener("input", () =>
        this.handleContentChange()
      );
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) =>
      this.handleKeyboardShortcuts(e)
    );
  }

  /**
   * Initialize floating bubble actions
   */
  initializeBubbleActions() {
    const copyBtn = document.getElementById("copyBtn");
    const cutBtn = document.getElementById("cutBtn");
    const pasteBtn = document.getElementById("pasteBtn");
    const askFollowupBtn = document.getElementById("askFollowupBtn");

    console.log("Initializing bubble actions...");
    console.log("Floating bubble element:", this.floatingBubble);
    console.log("Copy button element:", copyBtn);

    if (copyBtn) {
      copyBtn.addEventListener("click", (e) => {
        console.log("Copy button clicked");
        e.preventDefault();
        e.stopPropagation();
        this.copySelectedText();
      });
      console.log("Copy button event listener attached");
    } else {
      console.error("Copy button not found!");
    }

    if (cutBtn) {
      cutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.cutSelectedText();
      });
    }
    if (pasteBtn) {
      pasteBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.pasteText();
      });
    }
    if (askFollowupBtn) {
      askFollowupBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.askFollowupQuestion();
      });
    }
  }

  /**
   * Display a document in the editor
   */
  displayDocument(document) {
    this.currentDocument = document;

    // Show document container and hide welcome screen
    const welcomeScreen = window.document.getElementById("welcomeScreen");
    if (welcomeScreen) welcomeScreen.style.display = "none";

    // Ensure DOM elements are properly initialized
    if (!this.documentContainer) {
      this.documentContainer =
        window.document.getElementById("documentContainer");
    }
    if (!this.documentTitle) {
      this.documentTitle = window.document.getElementById("documentTitle");
    }
    if (!this.documentType) {
      this.documentType = window.document.getElementById("documentType");
    }
    if (!this.documentContent) {
      this.documentContent = window.document.getElementById("documentContent");
    }

    if (this.documentContainer) {
      this.documentContainer.style.display = "flex";
    }

    // Update document header
    if (this.documentTitle) {
      this.documentTitle.textContent = document.title;
    }
    if (this.documentType) {
      this.documentType.textContent = document.type.toUpperCase();
      this.documentType.className = `document-type ${document.type}`;
    }

    // Show/hide solution button based on document type
    const solutionBtn = window.document.getElementById("solutionBtn");
    if (solutionBtn) {
      if (document.type === 'exercise') {
        solutionBtn.style.display = "flex";
      } else {
        solutionBtn.style.display = "none";
      }
    }

    // Convert markdown-like content to HTML
    const htmlContent = this.convertToHTML(document.content);
    if (this.documentContent) {
      this.documentContent.innerHTML = htmlContent;

      // Scroll to top
      this.documentContent.scrollTop = 0;
    }

    // Set editing state
    this.setEditMode(false);

    // Update navigation button states
    this.updateNavigationButtons();
  }

  /**
   * Convert markdown-like content to HTML
   */
  convertToHTML(content) {
    let html = content;

    // Convert headers
    html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");
    html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
    html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
    html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");

    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Convert lists
    html = html.replace(/^- (.*$)/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // Convert numbered lists
    html = html.replace(/^\d+\. (.*$)/gm, "<li>$1</li>");

    // Convert blockquotes
    html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");

    // Convert line breaks
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");

    // Wrap in paragraphs
    if (!html.startsWith("<")) {
      html = "<p>" + html + "</p>";
    }

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, "");
    html = html.replace(/<p><br><\/p>/g, "");

    return html;
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode() {
    this.setEditMode(!this.isEditing);
  }

  /**
   * Set edit mode
   */
  setEditMode(editing) {
    this.isEditing = editing;

    if (editing) {
      this.documentContent.contentEditable = true;
      this.documentContent.focus();
      this.editBtn.classList.add("active");
      this.editBtn.title = "Exit edit mode";
      this.editBtn.innerHTML = '<i class="fas fa-eye"></i>';
    } else {
      this.documentContent.contentEditable = false;
      this.editBtn.classList.remove("active");
      this.editBtn.title = "Edit document";
      this.editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    }

    // Update save button visibility
    this.saveBtn.style.display = editing ? "flex" : "none";
  }

  /**
   * Handle content changes
   */
  handleContentChange() {
    if (this.isEditing && this.currentDocument) {
      // Mark document as modified
      this.markDocumentModified();

      // Auto-save after 2 seconds of inactivity
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = setTimeout(() => {
        this.autoSaveDocument();
      }, 2000);
    }
  }

  /**
   * Mark document as modified
   */
  markDocumentModified() {
    if (!this.documentTitle.textContent.includes("*")) {
      this.documentTitle.textContent += " *";
    }
  }

  /**
   * Remove modified marker
   */
  removeModifiedMarker() {
    this.documentTitle.textContent = this.documentTitle.textContent.replace(
      " *",
      ""
    );
  }

  /**
   * Save document
   */
  saveDocument() {
    if (!this.currentDocument || !this.isEditing) return;

    // Get current content
    const content = this.convertHTMLToMarkdown(this.documentContent.innerHTML);

    // Update document
    this.currentDocument.content = content;
    this.currentDocument.updatedAt = new Date().toISOString();

    // Save to storage
    storageManager.saveDocument(this.currentDocument);

    // Remove modified marker
    this.removeModifiedMarker();

    // Show success message
    this.showSuccessMessage("Document saved successfully");
  }

  /**
   * Auto-save document
   */
  autoSaveDocument() {
    if (this.isEditing && this.currentDocument) {
      this.saveDocument();
    }
  }

  /**
   * Convert HTML back to markdown
   */
  convertHTMLToMarkdown(html) {
    let markdown = html;

    // Convert headers
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, "# $1\n\n");
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, "## $1\n\n");
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, "### $1\n\n");
    markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, "#### $1\n\n");

    // Convert bold and italic
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, "**$1**");
    markdown = markdown.replace(/<em>(.*?)<\/em>/g, "*$1*");

    // Convert lists
    markdown = markdown.replace(/<ul><li>(.*?)<\/li><\/ul>/g, "- $1\n");
    markdown = markdown.replace(/<li>(.*?)<\/li>/g, "- $1\n");

    // Convert blockquotes
    markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/g, "> $1\n\n");

    // Convert paragraphs
    markdown = markdown.replace(/<p>(.*?)<\/p>/g, "$1\n\n");

    // Convert line breaks
    markdown = markdown.replace(/<br>/g, "\n");

    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, "\n\n");
    markdown = markdown.trim();

    return markdown;
  }

  /**
   * Handle right-click context menu
   */
  handleRightClick(e) {
    e.preventDefault(); // Prevent default context menu
    
    // Only handle right-click within document content
    if (!this.documentContent || !this.documentContent.contains(e.target)) {
      return;
    }

    // Check if there's any text selected
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      // If text is selected, show bubble at selection
      this.selectedText = selectedText;
      this.selectionRange = selection.getRangeAt(0);
      this.showFloatingBubble(e);
    } else {
      // If no text selected, show bubble at cursor position
      this.showFloatingBubbleAtCursor(e);
    }
  }

  /**
   * Handle text selection
   */
  handleTextSelection(e) {
    // Only handle selection within document content
    if (!this.documentContent || !this.documentContent.contains(e.target)) {
      this.hideFloatingBubbleWithDelay();
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log("Text selection event:", {
      target: e.target,
      selectedText: selectedText,
      selectionLength: selectedText.length,
      floatingBubble: this.floatingBubble,
    });

    if (selectedText.length > 0) {
      this.selectedText = selectedText;
      this.selectionRange = selection.getRangeAt(0);
      this.showFloatingBubble(e);
    } else {
      this.hideFloatingBubbleWithDelay();
    }
  }

  /**
   * Show floating bubble
   */
  showFloatingBubble(e) {
    console.log(
      "showFloatingBubble called, floatingBubble:",
      this.floatingBubble
    );

    if (!this.floatingBubble) {
      console.error("Floating bubble element not found!");
      return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount === 0) {
      console.warn("No selection range found");
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    console.log("Selection rect:", rect);

    // Update bubble buttons based on edit mode
    this.updateBubbleButtons();

    // Position bubble above selection
    const bubbleRect = this.floatingBubble.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - bubbleRect.width / 2;
    let top = rect.top - bubbleRect.height - 10;

    // Adjust if bubble goes off screen
    if (left < 10) left = 10;
    if (left + bubbleRect.width > window.innerWidth - 10) {
      left = window.innerWidth - bubbleRect.width - 10;
    }
    if (top < 10) {
      top = rect.bottom + 10;
    }

    console.log("Positioning bubble at:", { left, top });

    this.floatingBubble.style.left = left + "px";
    this.floatingBubble.style.top = top + "px";
    this.floatingBubble.style.display = "flex";

    console.log("Floating bubble displayed");
  }

  /**
   * Update bubble buttons based on current mode
   */
  updateBubbleButtons() {
    const copyBtn = document.getElementById("copyBtn");
    const cutBtn = document.getElementById("cutBtn");
    const pasteBtn = document.getElementById("pasteBtn");
    const askFollowupBtn = document.getElementById("askFollowupBtn");

    if (this.isEditing) {
      // Edit mode: show all buttons
      if (copyBtn) copyBtn.style.display = "flex";
      if (cutBtn) cutBtn.style.display = "flex";
      if (pasteBtn) pasteBtn.style.display = "flex";
      if (askFollowupBtn) askFollowupBtn.style.display = "flex";
    } else {
      // Preview mode: show only copy and ask follow-up
      if (copyBtn) copyBtn.style.display = "flex";
      if (cutBtn) cutBtn.style.display = "none";
      if (pasteBtn) pasteBtn.style.display = "none";
      if (askFollowupBtn) askFollowupBtn.style.display = "flex";
    }
  }

  /**
   * Show tick feedback for successful action
   */
  showTickFeedback(buttonElement) {
    if (!buttonElement) return;

    const originalIcon = buttonElement.querySelector("i");
    if (!originalIcon) return;

    const originalClass = originalIcon.className;
    
    // Change to tick icon
    originalIcon.className = "fas fa-check";
    buttonElement.style.background = "#10b981"; // Success green
    
    // Revert after 1 second
    setTimeout(() => {
      originalIcon.className = originalClass;
      buttonElement.style.background = "";
    }, 1000);
  }

  /**
   * Show floating bubble at cursor position (for right-click without selection)
   */
  showFloatingBubbleAtCursor(e) {
    if (!this.floatingBubble) {
      console.error("Floating bubble element not found!");
      return;
    }

    // Update bubble buttons based on edit mode
    this.updateBubbleButtons();

    // Position bubble at cursor position
    let left = e.clientX - 50; // Center bubble around cursor
    let top = e.clientY - 50;

    // Adjust if bubble goes off screen
    if (left < 10) left = 10;
    if (left + 100 > window.innerWidth - 10) {
      left = window.innerWidth - 110;
    }
    if (top < 10) {
      top = e.clientY + 10;
    }

    this.floatingBubble.style.left = left + "px";
    this.floatingBubble.style.top = top + "px";
    this.floatingBubble.style.display = "flex";

    console.log("Floating bubble displayed at cursor position");
  }

  /**
   * Hide floating bubble with delay
   */
  hideFloatingBubbleWithDelay() {
    // Clear any existing timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Set a 1-second delay before hiding
    this.hideTimeout = setTimeout(() => {
      this.hideFloatingBubble();
    }, 1000);
  }

  /**
   * Hide floating bubble immediately
   */
  hideFloatingBubble() {
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.floatingBubble) {
      this.floatingBubble.style.display = "none";
    }
    this.selectedText = "";
    this.selectionRange = null;
  }

  /**
   * Handle document click
   */
  handleDocumentClick(e) {
    // Hide bubble if clicking outside of it and not selecting text
    const clickedInsideBubble =
      this.floatingBubble && this.floatingBubble.contains(e.target);
    const clickedInsideDoc =
      this.documentContent && this.documentContent.contains(e.target);

    if (!clickedInsideBubble && !clickedInsideDoc) {
      this.hideFloatingBubble();
    }
  }

  /**
   * Copy selected text
   */
  async copySelectedText() {
    console.log("copySelectedText called, selectedText:", this.selectedText);

    const copyBtn = document.getElementById("copyBtn");

    // If no saved selected text, try to get from current selection
    let textToCopy = this.selectedText;
    if (!textToCopy) {
      const selection = window.getSelection();
      textToCopy = selection.toString().trim();
      console.log("No saved text, getting from current selection:", textToCopy);
    }

    if (!textToCopy) {
      console.warn("No text selected");
      this.showErrorMessage("No text selected");
      return;
    }

    try {
      console.log(
        "Attempting to copy text:",
        textToCopy.substring(0, 50) + "..."
      );

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        console.log("Using modern clipboard API");
        await navigator.clipboard.writeText(textToCopy);
        this.showTickFeedback(copyBtn);
        console.log("Copy successful with modern API");
      } else {
        console.log("Using fallback copy method");
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            this.showTickFeedback(copyBtn);
            console.log("Copy successful with fallback method");
          } else {
            throw new Error("Copy command failed");
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error("Failed to copy text:", error);
      this.showErrorMessage(
        "Copy failed: " +
          error.message +
          ". Please manually select and copy the text."
      );
    }

    // Hide bubble with delay to show success feedback
    this.hideFloatingBubbleWithDelay();
  }

  /**
   * Cut selected text
   */
  async cutSelectedText() {
    const cutBtn = document.getElementById("cutBtn");

    if (!this.selectedText || !this.isEditing) {
      this.showErrorMessage("Please select text to cut first");
      return;
    }

    try {
      await navigator.clipboard.writeText(this.selectedText);

      // Remove selected text from document
      if (this.selectionRange) {
        this.selectionRange.deleteContents();
        this.handleContentChange();
      }

      this.showTickFeedback(cutBtn);
    } catch (error) {
      console.error("Failed to cut text:", error);
      this.showErrorMessage("❌ Cut failed: " + error.message);
    }

    // Hide bubble with delay to show success feedback
    this.hideFloatingBubbleWithDelay();
  }

  /**
   * Paste text
   */
  async pasteText() {
    const pasteBtn = document.getElementById("pasteBtn");

    if (!this.isEditing) {
      this.showErrorMessage("Please enter edit mode first");
      return;
    }

    try {
      const text = await navigator.clipboard.readText();

      if (this.selectionRange) {
        this.selectionRange.deleteContents();
        this.selectionRange.insertNode(document.createTextNode(text));
        this.handleContentChange();
      } else {
        // If no selection, paste at cursor position
        this.documentContent.focus();
        document.execCommand("paste");
      }

      this.showTickFeedback(pasteBtn);
    } catch (error) {
      console.error("Failed to paste text:", error);
      this.showErrorMessage("❌ Paste failed: " + error.message);
    }

    // Hide bubble with delay to show success feedback
    this.hideFloatingBubbleWithDelay();
  }

  /**
   * Ask follow-up question
   */
  askFollowupQuestion() {
    const askFollowupBtn = document.getElementById("askFollowupBtn");

    // If no saved selected text, try to get from current selection
    let textToUse = this.selectedText;
    if (!textToUse) {
      const selection = window.getSelection();
      textToUse = selection.toString().trim();
    }

    if (!textToUse) {
      this.showErrorMessage("Please select text to ask about first");
      return;
    }

    // Determine current document id to associate the chat session
    const currentDoc = this.getCurrentDocument();
    const docId = currentDoc && currentDoc.id ? currentDoc.id : null;

    // Open chat panel with selected text and associate with current doc
    if (
      window.chatInterface &&
      typeof window.chatInterface.openChatWithSelectedText === "function"
    ) {
      window.chatInterface.openChatWithSelectedText(textToUse, docId);
      this.showTickFeedback(askFollowupBtn);
    } else {
      console.error("Chat interface not available");
      this.showErrorMessage("AI chat feature is not available");
    }

    // Hide bubble with delay to show success feedback
    this.hideFloatingBubbleWithDelay();
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when document is focused
    if (!this.documentContent.contains(document.activeElement)) return;

    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          this.saveDocument();
          break;
        case "e":
          e.preventDefault();
          this.toggleEditMode();
          break;
        case "c":
          if (this.selectedText && !this.isEditing) {
            e.preventDefault();
            this.copySelectedText();
          }
          break;
        case "x":
          if (this.selectedText && this.isEditing) {
            e.preventDefault();
            this.cutSelectedText();
          }
          break;
        case "v":
          if (this.isEditing) {
            // Let default paste behavior work
            setTimeout(() => this.handleContentChange(), 10);
          }
          break;
      }
    }

    // Escape key to exit edit mode
    if (e.key === "Escape" && this.isEditing) {
      this.setEditMode(false);
    }
  }

  /**
   * Export document
   */
  exportDocument(format) {
    if (!this.currentDocument) return;

    if (window.exportManager) {
      window.exportManager.exportDocument(this.currentDocument, format);
    }
  }

  /**
   * Update navigation buttons
   */
  updateNavigationButtons() {
    // Update active states for navigation buttons
    const buttons = document.querySelectorAll(".nav-btn");
    buttons.forEach((btn) => btn.classList.remove("active"));

    // Highlight appropriate button based on document type
    if (this.currentDocument) {
      const type = this.currentDocument.type;
      if (type === "summary") {
        document.getElementById("summarizeBtn")?.classList.add("active");
      } else if (type === "explanation") {
        document.getElementById("explainBtn")?.classList.add("active");
      } else if (type === "exercise" || type === "solution") {
        document.getElementById("exerciseBtn")?.classList.add("active");
      }
    }
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showToast(message, "success");
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showToast(message, "error");
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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

  /**
   * Clear document display
   */
  clearDocument() {
    this.currentDocument = null;
    this.documentContainer.style.display = "none";

    const welcomeScreen = document.getElementById("welcomeScreen");
    if (welcomeScreen) welcomeScreen.style.display = "flex";

    this.hideFloatingBubble();
    this.setEditMode(false);

    // Clear navigation button states
    const buttons = document.querySelectorAll(".nav-btn");
    buttons.forEach((btn) => btn.classList.remove("active"));
  }

  /**
   * Get current document
   */
  getCurrentDocument() {
    return this.currentDocument;
  }

  /**
   * Check if document is being edited
   */
  isDocumentEditing() {
    return this.isEditing;
  }

  /**
   * Setup solution modal listeners
   */
  setupSolutionModalListeners() {
    const modal = document.getElementById("solutionAcknowledgmentModal");
    const cancelBtn = document.getElementById("cancelSolutionBtn");
    const confirmBtn = document.getElementById("confirmSolutionBtn");

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => this.hideSolutionModal());
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this.confirmSolutionReveal());
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideSolutionModal();
        }
      });
    }
  }

  /**
   * Handle solution request
   */
  async handleSolutionRequest() {
    if (!this.currentDocument || this.currentDocument.type !== 'exercise') {
      this.showErrorMessage("Solutions are only available for exercise documents");
      return;
    }

    // Check if this is the first time revealing solutions for this document
    const hasShownAcknowledgment = localStorage.getItem(`solution_ack_${this.currentDocument.id}`);
    
    if (!hasShownAcknowledgment) {
      this.showSolutionModal();
    } else {
      this.generateAndShowSolutions();
    }
  }

  /**
   * Show solution acknowledgment modal
   */
  showSolutionModal() {
    const modal = document.getElementById("solutionAcknowledgmentModal");
    if (modal) {
      modal.style.display = "flex";
      setTimeout(() => modal.classList.add("open"), 10);
    }
  }

  /**
   * Hide solution acknowledgment modal
   */
  hideSolutionModal() {
    const modal = document.getElementById("solutionAcknowledgmentModal");
    if (modal) {
      modal.classList.remove("open");
      setTimeout(() => (modal.style.display = "none"), 300);
    }
  }

  /**
   * Confirm solution reveal
   */
  confirmSolutionReveal() {
    // Mark that acknowledgment has been shown for this document
    localStorage.setItem(`solution_ack_${this.currentDocument.id}`, 'true');
    
    this.hideSolutionModal();
    this.generateAndShowSolutions();
  }

  /**
   * Generate and show solutions
   */
  async generateAndShowSolutions() {
    try {
      const solutionDocument = await window.aiProcessor.generateSolutions(this.currentDocument);
      
      // Display the solution document
      this.displayDocument(solutionDocument);
      
      this.showSuccessMessage("Solutions generated successfully!");
    } catch (error) {
      console.error("Solution generation error:", error);
      this.showErrorMessage("Failed to generate solutions: " + error.message);
    }
  }

}

// Create global document editor instance
window.documentEditor = new DocumentEditor();
