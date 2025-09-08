/**
 * Main Application Controller
 * Coordinates all components and handles main application logic
 */

class App {
    constructor() {
        this.currentView = 'welcome';
        this.uploadedFiles = [];
        this.currentDocument = null;
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
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
        
        console.log('AI E-Learning Platform initialized successfully');
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
        const summarizeBtn = document.getElementById('summarizeBtn');
        const explainBtn = document.getElementById('explainBtn');
        const exerciseBtn = document.getElementById('exerciseBtn');

        if (summarizeBtn) {
            summarizeBtn.addEventListener('click', () => this.handleSummarize());
        }

        if (explainBtn) {
            explainBtn.addEventListener('click', () => this.handleExplain());
        }

        if (exerciseBtn) {
            exerciseBtn.addEventListener('click', () => this.handleExerciseGeneration());
        }
    }

    /**
     * Set up exercise type selection
     */
    setupExerciseTypeSelection() {
        const exerciseTypeBtns = document.querySelectorAll('.exercise-type-btn');
        const generateBtn = document.getElementById('generateExerciseBtn');

        exerciseTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove previous selection
                exerciseTypeBtns.forEach(b => b.classList.remove('selected'));
                // Add selection to clicked button
                btn.classList.add('selected');
            });
        });

        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateExercises());
        }
    }

    /**
     * Set up topic selection for explanation
     */
    setupTopicSelection() {
        const explainAllBtn = document.getElementById('explainAllBtn');
        
        if (explainAllBtn) {
            explainAllBtn.addEventListener('click', () => this.explainAllContent());
        }
    }

    /**
     * Set up history button
     */
    setupHistoryButton() {
        const historyBtn = document.getElementById('historyBtn');
        
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistory());
        }
    }

    /**
     * Set up settings button
     */
    setupSettingsButton() {
        const settingsBtn = document.getElementById('settingsBtn');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // Settings modal event listeners
        this.setupSettingsModalListeners();
    }

    /**
     * Set up settings modal event listeners
     */
    setupSettingsModalListeners() {
        const modal = document.getElementById('aiSettingsModal');
        const closeBtn = document.getElementById('closeSettingsBtn');
        const realAIToggle = document.getElementById('realAIToggle');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const toggleVisibilityBtn = document.getElementById('toggleApiKeyVisibility');
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideSettings());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideSettings();
                }
            });
        }

        if (realAIToggle) {
            realAIToggle.addEventListener('change', (e) => this.handleAIModeToggle(e.target.checked));
        }

        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', () => this.handleApiKeyInput());
        }

        if (toggleVisibilityBtn) {
            toggleVisibilityBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
        }

        if (testConnectionBtn) {
            testConnectionBtn.addEventListener('click', () => this.testApiConnection());
        }

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    /**
     * Set up window events
     */
    setupWindowEvents() {
        // Handle window resize for responsive design
        window.addEventListener('resize', () => this.handleWindowResize());
        
        // Handle beforeunload to save data
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyboardShortcuts(e));
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
        this.uploadedFiles = window.fileHandler ? window.fileHandler.uploadedFiles : [];
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
    }

    /**
     * Load saved AI settings from localStorage
     */
    loadSavedSettings() {
        const savedMode = localStorage.getItem('ai_mode');
        const savedApiKey = localStorage.getItem('openrouter_api_key');

        if (window.aiProcessor) {
            // Set API key if available
            if (savedApiKey) {
                window.aiProcessor.setApiKey(savedApiKey);
            }

            // Set AI mode
            if (savedMode === 'real' && savedApiKey) {
                window.aiProcessor.setUseRealAI(true);
                console.log('Real AI mode enabled with saved settings');
            } else {
                window.aiProcessor.setUseRealAI(false);
                console.log('Simulated AI mode enabled');
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
            this.currentView = 'document';
            
        } catch (error) {
            console.error('Summarize error:', error);
            this.showError('Failed to generate summary: ' + error.message);
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
        
        const topicSelection = document.getElementById('topicSelection');
        const topicList = document.getElementById('topicList');
        
        if (!topicSelection || !topicList) return;
        
        // Clear previous topics
        topicList.innerHTML = '';
        
        // Add topic items
        topics.forEach(topic => {
            const topicItem = document.createElement('div');
            topicItem.className = 'topic-item';
            topicItem.innerHTML = `
                <h4>${topic.title}</h4>
                <p>${topic.description}</p>
            `;
            
            topicItem.addEventListener('click', () => {
                this.explainSpecificTopic(files, topic.title);
            });
            
            topicList.appendChild(topicItem);
        });
        
        topicSelection.style.display = 'block';
        this.currentView = 'topicSelection';
    }

    /**
     * Explain specific topic
     */
    async explainSpecificTopic(files, topic) {
        try {
            const document = await window.aiProcessor.explainContent(files, topic);
            this.displayDocument(document);
            this.currentView = 'document';
            
        } catch (error) {
            console.error('Explain topic error:', error);
            this.showError('Failed to generate explanation: ' + error.message);
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
            this.currentView = 'document';
            
        } catch (error) {
            console.error('Explain all error:', error);
            this.showError('Failed to generate explanation: ' + error.message);
        }
    }

    /**
     * Handle exercise generation
     */
    handleExerciseGeneration() {
        if (!this.validateFilesUploaded()) return;

        this.hideAllViews();
        
        const exerciseOptions = document.getElementById('exerciseOptions');
        if (exerciseOptions) {
            exerciseOptions.style.display = 'block';
            this.currentView = 'exerciseOptions';
        }
    }

    /**
     * Generate exercises based on selected type
     */
    async generateExercises() {
        const selectedType = document.querySelector('.exercise-type-btn.selected');
        const questionCount = document.getElementById('questionCount');
        
        if (!selectedType) {
            this.showError('Please select an exercise type');
            return;
        }

        const exerciseType = selectedType.dataset.type;
        const count = questionCount ? parseInt(questionCount.value) : 5;

        try {
            const files = window.fileHandler.getAllFilesContent();
            const result = await window.aiProcessor.generateExercises(files, exerciseType, count);
            
            // Display the exercise document
            this.displayDocument(result.exercises);
            this.currentView = 'document';
            
            // Show solution overlay if it's a solution document
            if (result.exercises.type === 'exercise') {
                this.showSolutionOverlay();
            }
            
        } catch (error) {
            console.error('Exercise generation error:', error);
            this.showError('Failed to generate exercises: ' + error.message);
        }
    }

    /**
     * Show solution overlay
     */
    showSolutionOverlay() {
        const overlay = document.getElementById('solutionOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    /**
     * Display document in the editor
     */
    displayDocument(document) {
        this.currentDocument = document;
        
        // Hide all views first, then display the document
        this.hideAllViews();
        
        if (window.documentEditor) {
            window.documentEditor.displayDocument(document);
        }
        
        this.currentView = 'document';
    }

    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        this.hideAllViews();
        
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
            this.currentView = 'welcome';
        }
    }

    /**
     * Show history of saved documents
     */
    showHistory() {
        const documents = window.storageManager.getDocuments();
        
        if (!documents || documents.length === 0) {
            this.showError('No saved documents found');
            return;
        }

        // Create history modal
        this.showHistoryModal(documents);
    }

    /**
     * Show history modal
     */
    showHistoryModal(documents) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('historyModal');
        if (!modal) {
            modal = this.createHistoryModal();
        }

        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = '';

        // Add document list
        const docList = document.createElement('div');
        docList.className = 'document-history-list';

        documents.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'history-item';
            docItem.innerHTML = `
                <div class="history-item-header">
                    <h4>${doc.title}</h4>
                    <span class="document-type ${doc.type}">${doc.type.toUpperCase()}</span>
                </div>
                <div class="history-item-meta">
                    <span>Created: ${new Date(doc.createdAt).toLocaleDateString()}</span>
                    ${doc.updatedAt !== doc.createdAt ? `<span>Updated: ${new Date(doc.updatedAt).toLocaleDateString()}</span>` : ''}
                </div>
                <div class="history-item-actions">
                    <button class="btn-small" onclick="app.loadDocument('${doc.id}')">Open</button>
                    <button class="btn-small" onclick="app.deleteDocument('${doc.id}')">Delete</button>
                </div>
            `;
            docList.appendChild(docItem);
        });

        modalBody.appendChild(docList);
        modal.classList.add('open');
    }

    /**
     * Create history modal
     */
    createHistoryModal() {
        const modal = document.createElement('div');
        modal.id = 'historyModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Document History</h3>
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
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('open');
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
            const modal = document.getElementById('historyModal');
            if (modal) {
                modal.classList.remove('open');
            }
        }
    }

    /**
     * Delete document from history
     */
    deleteDocument(documentId) {
        if (confirm('Are you sure you want to delete this document?')) {
            window.storageManager.deleteDocument(documentId);
            this.showHistory(); // Refresh the history view
        }
    }

    /**
     * Hide all main views
     */
    hideAllViews() {
        const views = [
            'welcomeScreen',
            'documentContainer',
            'exerciseOptions',
            'topicSelection'
        ];

        views.forEach(viewId => {
            const view = document.getElementById(viewId);
            if (view) {
                view.style.display = 'none';
            }
        });
    }

    /**
     * Validate that files are uploaded
     */
    validateFilesUploaded() {
        if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
            this.showError('Please upload some files first');
            return false;
        }
        return true;
    }

    /**
     * Enable action buttons
     */
    enableActionButtons() {
        const buttons = ['summarizeBtn', 'explainBtn', 'exerciseBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('disabled');
            }
        });
    }

    /**
     * Disable action buttons
     */
    disableActionButtons() {
        const buttons = ['summarizeBtn', 'explainBtn', 'exerciseBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.classList.add('disabled');
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
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }

    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.handleSummarize();
                    break;
                case '2':
                    e.preventDefault();
                    this.handleExplain();
                    break;
                case '3':
                    e.preventDefault();
                    this.handleExerciseGeneration();
                    break;
                case 'h':
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
            currentDocument: this.currentDocument
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
        const modal = document.getElementById('aiSettingsModal');
        if (modal) {
            this.loadSettingsState();
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('open'), 10);
        }
    }

    /**
     * Hide AI settings modal
     */
    hideSettings() {
        const modal = document.getElementById('aiSettingsModal');
        if (modal) {
            modal.classList.remove('open');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    /**
     * Load current settings state into the modal
     */
    loadSettingsState() {
        const realAIToggle = document.getElementById('realAIToggle');
        const apiKeyInput = document.getElementById('apiKeyInput');
        const currentMode = document.getElementById('currentMode');
        const modeDescription = document.getElementById('modeDescription');
        const apiKeySection = document.getElementById('apiKeySection');
        const apiStatus = document.getElementById('apiStatus');
        const testConnectionBtn = document.getElementById('testConnectionBtn');

        if (window.aiProcessor) {
            const isRealAI = window.aiProcessor.useRealAI;
            const isConfigured = window.aiProcessor.isRealAIAvailable();

            if (realAIToggle) {
                realAIToggle.checked = isRealAI;
            }

            if (currentMode && modeDescription) {
                if (isRealAI) {
                    currentMode.textContent = 'Real AI';
                    modeDescription.textContent = 'Using OpenRouter API for AI responses';
                } else {
                    currentMode.textContent = 'Simulated AI';
                    modeDescription.textContent = 'Using simulated AI responses for testing';
                }
            }

            if (apiKeySection) {
                apiKeySection.style.display = realAIToggle && realAIToggle.checked ? 'block' : 'none';
            }

            if (apiStatus) {
                this.updateApiStatus(isConfigured);
            }

            if (testConnectionBtn) {
                testConnectionBtn.disabled = !isConfigured;
            }

            // Load saved API key (masked)
            const savedApiKey = localStorage.getItem('openrouter_api_key');
            if (apiKeyInput && savedApiKey) {
                apiKeyInput.value = '••••••••••••••••••••••••••••••••••••••••';
                apiKeyInput.dataset.hasKey = 'true';
            }
        }
    }

    /**
     * Handle AI mode toggle
     */
    handleAIModeToggle(useRealAI) {
        const apiKeySection = document.getElementById('apiKeySection');
        const currentMode = document.getElementById('currentMode');
        const modeDescription = document.getElementById('modeDescription');

        if (apiKeySection) {
            apiKeySection.style.display = useRealAI ? 'block' : 'none';
        }

        if (currentMode && modeDescription) {
            if (useRealAI) {
                currentMode.textContent = 'Real AI';
                modeDescription.textContent = 'Using OpenRouter API for AI responses';
            } else {
                currentMode.textContent = 'Simulated AI';
                modeDescription.textContent = 'Using simulated AI responses for testing';
            }
        }
    }

    /**
     * Handle API key input
     */
    handleApiKeyInput() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const testConnectionBtn = document.getElementById('testConnectionBtn');

        if (apiKeyInput) {
            const hasValue = apiKeyInput.value.trim().length > 0;
            const isNotMasked = !apiKeyInput.value.startsWith('••••');

            if (testConnectionBtn) {
                testConnectionBtn.disabled = !hasValue || !isNotMasked;
            }

            // Clear the hasKey flag if user starts typing
            if (isNotMasked && apiKeyInput.dataset.hasKey) {
                delete apiKeyInput.dataset.hasKey;
            }
        }
    }

    /**
     * Toggle API key visibility
     */
    toggleApiKeyVisibility() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const toggleBtn = document.getElementById('toggleApiKeyVisibility');

        if (apiKeyInput && toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            
            if (apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                apiKeyInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }
    }

    /**
     * Test API connection
     */
    async testApiConnection() {
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        const apiKeyInput = document.getElementById('apiKeyInput');

        if (!apiKeyInput || !testConnectionBtn) return;

        const apiKey = apiKeyInput.dataset.hasKey ? 
            localStorage.getItem('openrouter_api_key') : 
            apiKeyInput.value.trim();

        if (!apiKey) {
            this.showError('Please enter an API key');
            return;
        }

        testConnectionBtn.disabled = true;
        testConnectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';

        try {
            // Test the API key by making a simple request
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.5-flash',
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                this.showSuccess('API connection successful!');
                this.updateApiStatus(true);
            } else {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('API test failed:', error);
            this.showError('API connection failed: ' + error.message);
            this.updateApiStatus(false, error.message);
        } finally {
            testConnectionBtn.disabled = false;
            testConnectionBtn.innerHTML = '<i class="fas fa-plug"></i> Test Connection';
        }
    }

    /**
     * Update API status display
     */
    updateApiStatus(isConfigured, errorMessage = null) {
        const apiStatus = document.getElementById('apiStatus');
        
        if (apiStatus) {
            const icon = apiStatus.querySelector('i');
            const text = apiStatus.querySelector('span');

            apiStatus.className = 'api-status';

            if (errorMessage) {
                apiStatus.classList.add('error');
                icon.style.color = 'var(--error-color)';
                text.textContent = 'Connection failed';
            } else if (isConfigured) {
                apiStatus.classList.add('configured');
                icon.style.color = 'var(--success-color)';
                text.textContent = 'API configured';
            } else {
                apiStatus.classList.add('not-configured');
                icon.style.color = 'var(--text-muted)';
                text.textContent = 'Not configured';
            }
        }
    }

    /**
     * Save settings
     */
    saveSettings() {
        const realAIToggle = document.getElementById('realAIToggle');
        const apiKeyInput = document.getElementById('apiKeyInput');

        if (!realAIToggle) return;

        const useRealAI = realAIToggle.checked;
        let apiKey = null;

        if (useRealAI && apiKeyInput) {
            if (apiKeyInput.dataset.hasKey) {
                // Keep existing key
                apiKey = localStorage.getItem('openrouter_api_key');
            } else {
                // Use new key
                apiKey = apiKeyInput.value.trim();
            }

            if (!apiKey) {
                this.showError('Please enter an API key to use Real AI');
                return;
            }

            // Save API key to localStorage
            localStorage.setItem('openrouter_api_key', apiKey);
        }

        // Apply settings to AI processor
        if (window.aiProcessor) {
            if (apiKey) {
                window.aiProcessor.setApiKey(apiKey);
            }
            
            const success = window.aiProcessor.setUseRealAI(useRealAI);
            
            if (useRealAI && !success) {
                this.showError('Failed to enable Real AI. Please check your API key.');
                return;
            }
        }

        // Save preference
        localStorage.setItem('ai_mode', useRealAI ? 'real' : 'simulated');

        this.showSuccess('Settings saved successfully!');
        this.hideSettings();
    }
}

// Add CSS for history modal
const historyStyles = document.createElement('style');
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
    window.fileHandler.updateFileList = function() {
        originalUpdateFileList.call(this);
        if (window.app) {
            window.app.updateUploadedFiles(this.uploadedFiles);
        }
    };
}
