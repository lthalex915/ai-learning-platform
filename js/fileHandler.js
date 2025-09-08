/**
 * File Upload and Preview Handler
 * Handles file uploads, previews, and content extraction
 */

class FileHandler {
    constructor() {
        this.supportedTypes = {
            pdf: ['application/pdf'],
            docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            txt: ['text/plain'],
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        };
        
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.uploadedFiles = [];
        
        this.initializeEventListeners();
    }

    /**
     * Initialize event listeners for file upload
     */
    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // Drag and drop events
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    /**
     * Handle drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }

    /**
     * Handle drag leave event
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
    }

    /**
     * Handle drop event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    /**
     * Handle file selection from input
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        e.target.value = ''; // Reset input
    }

    /**
     * Process uploaded files
     */
    async processFiles(files) {
        const validFiles = files.filter(file => this.validateFile(file));
        
        if (validFiles.length === 0) {
            this.showError('No valid files selected. Please upload PDF, DOCX, TXT, or image files.');
            return;
        }

        this.showLoading('Processing files...');

        for (const file of validFiles) {
            try {
                await this.processFile(file);
            } catch (error) {
                console.error('Error processing file:', error);
                this.showError(`Error processing ${file.name}: ${error.message}`);
            }
        }

        this.hideLoading();
        this.updateFileList();
        this.enableActionButtons();
    }

    /**
     * Validate file type and size
     */
    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            this.showError(`File ${file.name} is too large. Maximum size is 10MB.`);
            return false;
        }

        // Check file type
        const isValidType = Object.values(this.supportedTypes).some(types => 
            types.includes(file.type)
        );

        if (!isValidType) {
            this.showError(`File ${file.name} is not supported. Please upload PDF, DOCX, TXT, or image files.`);
            return false;
        }

        return true;
    }

    /**
     * Process individual file
     */
    async processFile(file) {
        const fileData = {
            id: storageManager.generateId(),
            name: file.name,
            type: this.getFileType(file),
            size: file.size,
            lastModified: file.lastModified,
            content: '',
            preview: null
        };

        // Extract content based on file type
        switch (fileData.type) {
            case 'pdf':
                fileData.content = await this.extractPdfContent(file);
                fileData.preview = await this.generatePdfPreview(file);
                break;
            case 'docx':
                fileData.content = await this.extractDocxContent(file);
                fileData.preview = await this.generateDocxPreview(file);
                break;
            case 'txt':
                fileData.content = await this.extractTextContent(file);
                fileData.preview = fileData.content.substring(0, 500) + '...';
                break;
            case 'image':
                fileData.content = `[Image: ${file.name}]`;
                fileData.preview = await this.generateImagePreview(file);
                break;
        }

        // Save to storage and add to current session
        storageManager.saveUploadedFile(fileData);
        this.uploadedFiles.push(fileData);
    }

    /**
     * Get file type category
     */
    getFileType(file) {
        for (const [type, mimeTypes] of Object.entries(this.supportedTypes)) {
            if (mimeTypes.includes(file.type)) {
                return type;
            }
        }
        return 'unknown';
    }

    /**
     * Extract content from PDF file
     */
    async extractPdfContent(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let content = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                content += pageText + '\n\n';
            }

            return content.trim();
        } catch (error) {
            console.error('Error extracting PDF content:', error);
            return `[Error reading PDF: ${error.message}]`;
        }
    }

    /**
     * Extract content from DOCX file
     */
    async extractDocxContent(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } catch (error) {
            console.error('Error extracting DOCX content:', error);
            return `[Error reading DOCX: ${error.message}]`;
        }
    }

    /**
     * Extract content from text file
     */
    async extractTextContent(file) {
        try {
            return await file.text();
        } catch (error) {
            console.error('Error extracting text content:', error);
            return `[Error reading text file: ${error.message}]`;
        }
    }

    /**
     * Generate PDF preview
     */
    async generatePdfPreview(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const page = await pdf.getPage(1);
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: 0.5 });
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport }).promise;
            return canvas.toDataURL();
        } catch (error) {
            console.error('Error generating PDF preview:', error);
            return null;
        }
    }

    /**
     * Generate DOCX preview
     */
    async generateDocxPreview(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value.substring(0, 500) + '...';
        } catch (error) {
            console.error('Error generating DOCX preview:', error);
            return '[Preview not available]';
        }
    }

    /**
     * Generate image preview
     */
    async generateImagePreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Update file list display
     */
    updateFileList() {
        const fileList = document.getElementById('fileList');
        const noFiles = fileList.querySelector('.no-files');
        
        if (this.uploadedFiles.length === 0) {
            if (noFiles) noFiles.style.display = 'block';
            return;
        }

        if (noFiles) noFiles.style.display = 'none';

        // Remove existing file items (except no-files message)
        const existingItems = fileList.querySelectorAll('.file-item');
        existingItems.forEach(item => item.remove());

        // Add file items
        this.uploadedFiles.forEach(file => {
            const fileItem = this.createFileItem(file);
            fileList.appendChild(fileItem);
        });
    }

    /**
     * Create file item element
     */
    createFileItem(file) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.fileId = file.id;

        const iconClass = this.getFileIconClass(file.type);
        const fileSize = this.formatFileSize(file.size);

        fileItem.innerHTML = `
            <div class="file-icon ${file.type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div class="file-size">${fileSize}</div>
            </div>
            <div class="file-actions">
                <button class="file-action-btn" onclick="fileHandler.previewFile('${file.id}')" title="Preview">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="file-action-btn" onclick="fileHandler.removeFile('${file.id}')" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add click event for file selection
        fileItem.addEventListener('click', (e) => {
            if (!e.target.closest('.file-actions')) {
                this.selectFile(file.id);
            }
        });

        return fileItem;
    }

    /**
     * Get file icon class
     */
    getFileIconClass(type) {
        const iconMap = {
            pdf: 'fas fa-file-pdf',
            docx: 'fas fa-file-word',
            txt: 'fas fa-file-alt',
            image: 'fas fa-file-image'
        };
        return iconMap[type] || 'fas fa-file';
    }

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Preview file
     */
    previewFile(fileId) {
        const file = this.uploadedFiles.find(f => f.id === fileId);
        if (!file) return;

        const modal = document.getElementById('filePreviewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');

        title.textContent = `Preview: ${file.name}`;

        if (file.type === 'image' && file.preview) {
            content.innerHTML = `<img src="${file.preview}" alt="${file.name}" style="max-width: 100%; height: auto;">`;
        } else if (file.type === 'pdf' && file.preview) {
            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 1rem;">
                    <img src="${file.preview}" alt="PDF Preview" style="max-width: 100%; height: auto; border: 1px solid #ddd;">
                </div>
                <div style="max-height: 300px; overflow-y: auto; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
                    <pre style="white-space: pre-wrap; font-family: inherit;">${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}</pre>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div style="max-height: 400px; overflow-y: auto; padding: 1rem; background: #f8f9fa; border-radius: 0.5rem;">
                    <pre style="white-space: pre-wrap; font-family: inherit;">${file.content}</pre>
                </div>
            `;
        }

        modal.classList.add('open');
    }

    /**
     * Remove file
     */
    removeFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        storageManager.deleteUploadedFile(fileId);
        this.updateFileList();
        
        if (this.uploadedFiles.length === 0) {
            this.disableActionButtons();
        }
    }

    /**
     * Select file
     */
    selectFile(fileId) {
        // Remove previous selection
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.classList.add('selected');
        }
    }

    /**
     * Get all uploaded files content
     */
    getAllFilesContent() {
        return this.uploadedFiles.map(file => ({
            name: file.name,
            type: file.type,
            content: file.content
        }));
    }

    /**
     * Get selected file content
     */
    getSelectedFileContent() {
        const selectedItem = document.querySelector('.file-item.selected');
        if (!selectedItem) return null;

        const fileId = selectedItem.dataset.fileId;
        return this.uploadedFiles.find(f => f.id === fileId);
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
     * Show loading overlay
     */
    showLoading(message = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        if (text) text.textContent = message;
        if (overlay) overlay.style.display = 'flex';
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Clear all uploaded files
     */
    clearAllFiles() {
        this.uploadedFiles = [];
        this.updateFileList();
        this.disableActionButtons();
    }

    /**
     * Load files from storage
     */
    loadStoredFiles() {
        const storedFiles = storageManager.getUploadedFiles();
        this.uploadedFiles = storedFiles || [];
        this.updateFileList();
        
        if (this.uploadedFiles.length > 0) {
            this.enableActionButtons();
        }
    }
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .file-item.selected {
        border-color: var(--primary-color);
        background: rgba(37, 99, 235, 0.05);
    }
`;
document.head.appendChild(style);

// Create global file handler instance
window.fileHandler = new FileHandler();
