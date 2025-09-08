/**
 * Document Editor with Word-like Features
 * Handles document display, editing, and text selection functionality
 */

class DocumentEditor {
    constructor() {
        this.currentDocument = null;
        this.isEditing = false;
        this.selectedText = '';
        this.selectionRange = null;
        this.floatingBubble = null;
        
        this.initializeEditor();
        this.initializeEventListeners();
    }

    /**
     * Initialize the document editor
     */
    initializeEditor() {
        this.documentContainer = document.getElementById('documentContainer');
        this.documentContent = document.getElementById('documentContent');
        this.documentTitle = document.getElementById('documentTitle');
        this.documentType = document.getElementById('documentType');
        this.floatingBubble = document.getElementById('floatingBubble');
        
        // Initialize toolbar buttons
        this.editBtn = document.getElementById('editBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.exportDocxBtn = document.getElementById('exportDocxBtn');
        this.exportPdfBtn = document.getElementById('exportPdfBtn');
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Edit button
        if (this.editBtn) {
            this.editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Save button
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveDocument());
        }

        // Export buttons
        if (this.exportDocxBtn) {
            this.exportDocxBtn.addEventListener('click', () => this.exportDocument('docx'));
        }
        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', () => this.exportDocument('pdf'));
        }

        // Text selection events
        document.addEventListener('mouseup', (e) => this.handleTextSelection(e));
        document.addEventListener('keyup', (e) => this.handleTextSelection(e));
        
        // Click outside to hide bubble
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        // Floating bubble actions
        this.initializeBubbleActions();

        // Auto-save functionality
        if (this.documentContent) {
            this.documentContent.addEventListener('input', () => this.handleContentChange());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    /**
     * Initialize floating bubble actions
     */
    initializeBubbleActions() {
        const copyBtn = document.getElementById('copyBtn');
        const cutBtn = document.getElementById('cutBtn');
        const pasteBtn = document.getElementById('pasteBtn');
        const askFollowupBtn = document.getElementById('askFollowupBtn');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copySelectedText());
        }
        if (cutBtn) {
            cutBtn.addEventListener('click', () => this.cutSelectedText());
        }
        if (pasteBtn) {
            pasteBtn.addEventListener('click', () => this.pasteText());
        }
        if (askFollowupBtn) {
            askFollowupBtn.addEventListener('click', () => this.askFollowupQuestion());
        }
    }

    /**
     * Display a document in the editor
     */
    displayDocument(document) {
        this.currentDocument = document;
        
        // Show document container and hide welcome screen
        const welcomeScreen = window.document.getElementById('welcomeScreen');
        if (welcomeScreen) welcomeScreen.style.display = 'none';
        
        // Ensure DOM elements are properly initialized
        if (!this.documentContainer) {
            this.documentContainer = window.document.getElementById('documentContainer');
        }
        if (!this.documentTitle) {
            this.documentTitle = window.document.getElementById('documentTitle');
        }
        if (!this.documentType) {
            this.documentType = window.document.getElementById('documentType');
        }
        if (!this.documentContent) {
            this.documentContent = window.document.getElementById('documentContent');
        }
        
        if (this.documentContainer) {
            this.documentContainer.style.display = 'flex';
        }
        
        // Update document header
        if (this.documentTitle) {
            this.documentTitle.textContent = document.title;
        }
        if (this.documentType) {
            this.documentType.textContent = document.type.toUpperCase();
            this.documentType.className = `document-type ${document.type}`;
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
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
        
        // Convert bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Convert lists
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // Convert numbered lists
        html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
        
        // Convert blockquotes
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        // Convert line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        if (!html.startsWith('<')) {
            html = '<p>' + html + '</p>';
        }
        
        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br><\/p>/g, '');
        
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
            this.editBtn.classList.add('active');
            this.editBtn.title = 'Exit edit mode';
            this.editBtn.innerHTML = '<i class="fas fa-eye"></i>';
        } else {
            this.documentContent.contentEditable = false;
            this.editBtn.classList.remove('active');
            this.editBtn.title = 'Edit document';
            this.editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        }
        
        // Update save button visibility
        this.saveBtn.style.display = editing ? 'flex' : 'none';
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
        if (!this.documentTitle.textContent.includes('*')) {
            this.documentTitle.textContent += ' *';
        }
    }

    /**
     * Remove modified marker
     */
    removeModifiedMarker() {
        this.documentTitle.textContent = this.documentTitle.textContent.replace(' *', '');
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
        this.showSuccessMessage('Document saved successfully');
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
        markdown = markdown.replace(/<h1>(.*?)<\/h1>/g, '# $1\n\n');
        markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, '## $1\n\n');
        markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, '### $1\n\n');
        markdown = markdown.replace(/<h4>(.*?)<\/h4>/g, '#### $1\n\n');
        
        // Convert bold and italic
        markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
        
        // Convert lists
        markdown = markdown.replace(/<ul><li>(.*?)<\/li><\/ul>/g, '- $1\n');
        markdown = markdown.replace(/<li>(.*?)<\/li>/g, '- $1\n');
        
        // Convert blockquotes
        markdown = markdown.replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1\n\n');
        
        // Convert paragraphs
        markdown = markdown.replace(/<p>(.*?)<\/p>/g, '$1\n\n');
        
        // Convert line breaks
        markdown = markdown.replace(/<br>/g, '\n');
        
        // Clean up extra whitespace
        markdown = markdown.replace(/\n{3,}/g, '\n\n');
        markdown = markdown.trim();
        
        return markdown;
    }

    /**
     * Handle text selection
     */
    handleTextSelection(e) {
        // Only handle selection within document content
        if (!this.documentContent.contains(e.target)) {
            this.hideFloatingBubble();
            return;
        }

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText.length > 0) {
            this.selectedText = selectedText;
            this.selectionRange = selection.getRangeAt(0);
            this.showFloatingBubble(e);
        } else {
            this.hideFloatingBubble();
        }
    }

    /**
     * Show floating bubble
     */
    showFloatingBubble(e) {
        if (!this.floatingBubble) return;
        
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Position bubble above selection
        const bubbleRect = this.floatingBubble.getBoundingClientRect();
        let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
        let top = rect.top - bubbleRect.height - 10;
        
        // Adjust if bubble goes off screen
        if (left < 10) left = 10;
        if (left + bubbleRect.width > window.innerWidth - 10) {
            left = window.innerWidth - bubbleRect.width - 10;
        }
        if (top < 10) {
            top = rect.bottom + 10;
        }
        
        this.floatingBubble.style.left = left + 'px';
        this.floatingBubble.style.top = top + 'px';
        this.floatingBubble.style.display = 'flex';
    }

    /**
     * Hide floating bubble
     */
    hideFloatingBubble() {
        if (this.floatingBubble) {
            this.floatingBubble.style.display = 'none';
        }
        this.selectedText = '';
        this.selectionRange = null;
    }

    /**
     * Handle document click
     */
    handleDocumentClick(e) {
        // Hide bubble if clicking outside of it and not selecting text
        const clickedInsideBubble = this.floatingBubble && this.floatingBubble.contains(e.target);
        const clickedInsideDoc = this.documentContent && this.documentContent.contains(e.target);

        if (!clickedInsideBubble && !clickedInsideDoc) {
            this.hideFloatingBubble();
        }
    }

    /**
     * Copy selected text
     */
    async copySelectedText() {
        if (!this.selectedText) return;
        
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(this.selectedText);
                this.showSuccessMessage('Text copied to clipboard');
            } else {
                // Fallback for older browsers or non-secure contexts
                const textArea = document.createElement('textarea');
                textArea.value = this.selectedText;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    const successful = document.execCommand('copy');
                    if (successful) {
                        this.showSuccessMessage('Text copied to clipboard');
                    } else {
                        throw new Error('Copy command failed');
                    }
                } finally {
                    document.body.removeChild(textArea);
                }
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            this.showErrorMessage('Failed to copy text. Please try selecting and copying manually.');
        }
        
        this.hideFloatingBubble();
    }

    /**
     * Cut selected text
     */
    async cutSelectedText() {
        if (!this.selectedText || !this.isEditing) return;
        
        try {
            await navigator.clipboard.writeText(this.selectedText);
            
            // Remove selected text from document
            if (this.selectionRange) {
                this.selectionRange.deleteContents();
                this.handleContentChange();
            }
            
            this.showSuccessMessage('Text cut to clipboard');
        } catch (error) {
            console.error('Failed to cut text:', error);
            this.showErrorMessage('Failed to cut text');
        }
        
        this.hideFloatingBubble();
    }

    /**
     * Paste text
     */
    async pasteText() {
        if (!this.isEditing) return;
        
        try {
            const text = await navigator.clipboard.readText();
            
            if (this.selectionRange) {
                this.selectionRange.deleteContents();
                this.selectionRange.insertNode(document.createTextNode(text));
                this.handleContentChange();
            }
            
            this.showSuccessMessage('Text pasted');
        } catch (error) {
            console.error('Failed to paste text:', error);
            this.showErrorMessage('Failed to paste text');
        }
        
        this.hideFloatingBubble();
    }

    /**
     * Ask follow-up question
     */
    askFollowupQuestion() {
        if (!this.selectedText) return;

        // Determine current document id to associate the chat session
        const currentDoc = this.getCurrentDocument();
        const docId = currentDoc && currentDoc.id ? currentDoc.id : null;
        
        // Open chat panel with selected text and associate with current doc
        if (window.chatInterface && typeof window.chatInterface.openChatWithSelectedText === 'function') {
            window.chatInterface.openChatWithSelectedText(this.selectedText, docId);
        } else {
            console.error('Chat interface not available');
            this.showErrorMessage('Chat interface is not available');
        }
        
        this.hideFloatingBubble();
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when document is focused
        if (!this.documentContent.contains(document.activeElement)) return;
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveDocument();
                    break;
                case 'e':
                    e.preventDefault();
                    this.toggleEditMode();
                    break;
                case 'c':
                    if (this.selectedText && !this.isEditing) {
                        e.preventDefault();
                        this.copySelectedText();
                    }
                    break;
                case 'x':
                    if (this.selectedText && this.isEditing) {
                        e.preventDefault();
                        this.cutSelectedText();
                    }
                    break;
                case 'v':
                    if (this.isEditing) {
                        // Let default paste behavior work
                        setTimeout(() => this.handleContentChange(), 10);
                    }
                    break;
            }
        }
        
        // Escape key to exit edit mode
        if (e.key === 'Escape' && this.isEditing) {
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
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Highlight appropriate button based on document type
        if (this.currentDocument) {
            const type = this.currentDocument.type;
            if (type === 'summary') {
                document.getElementById('summarizeBtn')?.classList.add('active');
            } else if (type === 'explanation') {
                document.getElementById('explainBtn')?.classList.add('active');
            } else if (type === 'exercise' || type === 'solution') {
                document.getElementById('exerciseBtn')?.classList.add('active');
            }
        }
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
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
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        toast.style.background = colors[type] || colors.info;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
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
        this.documentContainer.style.display = 'none';
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) welcomeScreen.style.display = 'flex';
        
        this.hideFloatingBubble();
        this.setEditMode(false);
        
        // Clear navigation button states
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
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
}

// Create global document editor instance
window.documentEditor = new DocumentEditor();
