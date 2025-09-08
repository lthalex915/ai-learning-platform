/**
 * Local Storage Management System
 * Handles saving and loading of documents, chat history, and uploaded files
 */

class StorageManager {
    constructor() {
        this.storageKeys = {
            documents: 'ai_elearning_documents',
            chats: 'ai_elearning_chats',
            uploadedFiles: 'ai_elearning_files',
            settings: 'ai_elearning_settings'
        };
        
        // Virtual "lib" namespace persisted in localStorage to group artifacts by project
        // Shape: { [projectId]: { name, docs: {docId: {...}}, chats: {chatId: {...}}, files: {fileId: {...}} } }
        this.libKey = 'ai_elearning_lib';

        this.initializeStorage();
    }

    /**
     * Initialize storage with default values if not exists
     */
    initializeStorage() {
        if (!this.getDocuments()) {
            this.saveDocuments([]);
        }
        if (!this.getChats()) {
            this.saveChats([]);
        }
        if (!this.getUploadedFiles()) {
            this.saveUploadedFiles([]);
        }
        if (!this.getSettings()) {
            this.saveSettings({
                theme: 'light',
                language: 'en',
                autoSave: true,
                exportFormat: 'docx'
            });
        }
        if (!localStorage.getItem(this.libKey)) {
            localStorage.setItem(this.libKey, JSON.stringify({}));
        }
    }

    /**
     * Generate unique ID for documents and chats
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Document Management
     */
    getDocuments() {
        try {
            const documents = localStorage.getItem(this.storageKeys.documents);
            return documents ? JSON.parse(documents) : null;
        } catch (error) {
            console.error('Error loading documents:', error);
            return [];
        }
    }

    saveDocuments(documents) {
        try {
            localStorage.setItem(this.storageKeys.documents, JSON.stringify(documents));
            return true;
        } catch (error) {
            console.error('Error saving documents:', error);
            return false;
        }
    }

    saveDocument(document, projectId = null) {
        const documents = this.getDocuments() || [];
        const existingIndex = documents.findIndex(doc => doc.id === document.id);
        const normalized = {
            ...document,
            id: document.id || this.generateId(),
            createdAt: document.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (existingIndex !== -1) {
            documents[existingIndex] = { ...documents[existingIndex], ...normalized };
        } else {
            documents.push(normalized);
        }
        // mirror into lib as markdown under project if provided
        if (projectId) this.libSaveDoc(projectId, normalized);
        return this.saveDocuments(documents);
    }

    getDocument(id) {
        const documents = this.getDocuments();
        return documents.find(doc => doc.id === id);
    }

    deleteDocument(id, projectId = null) {
        const documents = this.getDocuments() || [];
        const filteredDocuments = documents.filter(doc => doc.id !== id);
        this.saveDocuments(filteredDocuments);
        if (projectId) this.libDeleteDoc(projectId, id);
        return true;
    }

    /**
     * Chat Management
     */
    getChats() {
        try {
            const chats = localStorage.getItem(this.storageKeys.chats);
            return chats ? JSON.parse(chats) : null;
        } catch (error) {
            console.error('Error loading chats:', error);
            return [];
        }
    }

    saveChats(chats) {
        try {
            localStorage.setItem(this.storageKeys.chats, JSON.stringify(chats));
            return true;
        } catch (error) {
            console.error('Error saving chats:', error);
            return false;
        }
    }

    saveChatSession(chatSession, projectId = null) {
        const chats = this.getChats() || [];
        const existingIndex = chats.findIndex(chat => chat.id === chatSession.id);
        const normalized = {
            ...chatSession,
            id: chatSession.id || this.generateId(),
            createdAt: chatSession.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (existingIndex !== -1) {
            chats[existingIndex] = { ...chats[existingIndex], ...normalized };
        } else {
            chats.push(normalized);
        }
        // mirror into lib as json under project if provided or docId as fallback grouping
        const proj = projectId || normalized.docId || null;
        if (proj) this.libSaveChat(proj, normalized);
        return this.saveChats(chats);
    }

    getChatSession(id) {
        const chats = this.getChats();
        return chats.find(chat => chat.id === id);
    }

    deleteChatSession(id, projectId = null) {
        const chats = this.getChats() || [];
        const filteredChats = chats.filter(chat => chat.id !== id);
        this.saveChats(filteredChats);
        if (projectId) this.libDeleteChat(projectId, id);
        return true;
    }

    /**
     * Uploaded Files Management
     */
    getUploadedFiles() {
        try {
            const files = localStorage.getItem(this.storageKeys.uploadedFiles);
            return files ? JSON.parse(files) : null;
        } catch (error) {
            console.error('Error loading uploaded files:', error);
            return [];
        }
    }

    saveUploadedFiles(files) {
        try {
            localStorage.setItem(this.storageKeys.uploadedFiles, JSON.stringify(files));
            return true;
        } catch (error) {
            console.error('Error saving uploaded files:', error);
            return false;
        }
    }

    saveUploadedFile(fileData, projectId = null) {
        const files = this.getUploadedFiles() || [];
        const existingIndex = files.findIndex(file => file.id === fileData.id);
        const normalized = {
            ...fileData,
            id: fileData.id || this.generateId(),
            uploadedAt: fileData.uploadedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        if (existingIndex !== -1) {
            files[existingIndex] = { ...files[existingIndex], ...normalized };
        } else {
            files.push(normalized);
        }
        if (projectId) this.libSaveFile(projectId, normalized);
        return this.saveUploadedFiles(files);
    }

    getUploadedFile(id) {
        const files = this.getUploadedFiles();
        return files.find(file => file.id === id);
    }

    deleteUploadedFile(id, projectId = null) {
        const files = this.getUploadedFiles() || [];
        const filteredFiles = files.filter(file => file.id !== id);
        this.saveUploadedFiles(filteredFiles);
        if (projectId) this.libDeleteFile(projectId, id);
        return true;
    }

    /**
     * Settings Management
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.storageKeys.settings);
            return settings ? JSON.parse(settings) : null;
        } catch (error) {
            console.error('Error loading settings:', error);
            return null;
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    updateSetting(key, value) {
        const settings = this.getSettings();
        settings[key] = value;
        return this.saveSettings(settings);
    }

    /**
     * Utility Methods
     */
    getStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return {
            used: totalSize,
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            available: 5 * 1024 * 1024 - totalSize, // Assuming 5MB limit
            availableMB: ((5 * 1024 * 1024 - totalSize) / 1024 / 1024).toFixed(2)
        };
    }

    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeStorage();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    exportData() {
        const data = {
            documents: this.getDocuments(),
            chats: this.getChats(),
            uploadedFiles: this.getUploadedFiles(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.documents) this.saveDocuments(data.documents);
            if (data.chats) this.saveChats(data.chats);
            if (data.uploadedFiles) this.saveUploadedFiles(data.uploadedFiles);
            if (data.settings) this.saveSettings(data.settings);
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Search functionality
     */
    searchDocuments(query) {
        const documents = this.getDocuments();
        const lowercaseQuery = query.toLowerCase();
        
        return documents.filter(doc => 
            doc.title.toLowerCase().includes(lowercaseQuery) ||
            doc.content.toLowerCase().includes(lowercaseQuery) ||
            doc.type.toLowerCase().includes(lowercaseQuery)
        );
    }

    searchChats(query) {
        const chats = this.getChats();
        const lowercaseQuery = query.toLowerCase();
        
        return chats.filter(chat => 
            chat.messages.some(message => 
                message.content.toLowerCase().includes(lowercaseQuery)
            )
        );
    }

    /**
     * Backup and restore functionality
     */
    createBackup() {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: {
                documents: this.getDocuments(),
                chats: this.getChats(),
                uploadedFiles: this.getUploadedFiles(),
                settings: this.getSettings()
            }
        };
        
        return backup;
    }

    restoreFromBackup(backup) {
        try {
            if (backup.version !== '1.0') {
                throw new Error('Incompatible backup version');
            }
            
            const { data } = backup;
            
            if (data.documents) this.saveDocuments(data.documents);
            if (data.chats) this.saveChats(data.chats);
            if (data.uploadedFiles) this.saveUploadedFiles(data.uploadedFiles);
            if (data.settings) this.saveSettings(data.settings);
            
            return true;
        } catch (error) {
            console.error('Error restoring backup:', error);
            return false;
        }
    }
    /**
     * LIB helpers (virtual FS persisted in localStorage)
     */
    getLibRoot() {
        try {
            const raw = localStorage.getItem(this.libKey);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    }

    setLibRoot(root) {
        localStorage.setItem(this.libKey, JSON.stringify(root));
    }

    ensureProject(root, projectId) {
        if (!root[projectId]) {
            root[projectId] = { name: projectId, docs: {}, chats: {}, files: {} };
        }
    }

    // Docs (.md semantics)
    libSaveDoc(projectId, doc) {
        const root = this.getLibRoot();
        this.ensureProject(root, projectId);
        root[projectId].docs[doc.id] = {
            ...doc,
            contentType: 'markdown',
            fileName: `${(doc.title || 'document').replace(/[^a-z0-9-_]+/gi, '_')}.md`
        };
        this.setLibRoot(root);
    }

    libDeleteDoc(projectId, docId) {
        const root = this.getLibRoot();
        if (root[projectId] && root[projectId].docs[docId]) {
            delete root[projectId].docs[docId];
            this.setLibRoot(root);
        }
    }

    // Chats (.json semantics)
    libSaveChat(projectId, chat) {
        const root = this.getLibRoot();
        this.ensureProject(root, projectId);
        root[projectId].chats[chat.id] = {
            ...chat,
            contentType: 'json',
            fileName: `${(chat.title || 'chat').replace(/[^a-z0-9-_]+/gi, '_')}.json`
        };
        this.setLibRoot(root);
    }

    libDeleteChat(projectId, chatId) {
        const root = this.getLibRoot();
        if (root[projectId] && root[projectId].chats[chatId]) {
            delete root[projectId].chats[chatId];
            this.setLibRoot(root);
        }
    }

    // Uploaded files (metadata only)
    libSaveFile(projectId, file) {
        const root = this.getLibRoot();
        this.ensureProject(root, projectId);
        root[projectId].files[file.id] = { ...file };
        this.setLibRoot(root);
    }

    libDeleteFile(projectId, fileId) {
        const root = this.getLibRoot();
        if (root[projectId] && root[projectId].files[fileId]) {
            delete root[projectId].files[fileId];
            this.setLibRoot(root);
        }
    }

    getLibProject(projectId) {
        const root = this.getLibRoot();
        return root[projectId] || null;
    }

    listLibProjects() {
        const root = this.getLibRoot();
        return Object.keys(root);
    }
}
 
// Create global storage manager instance
window.storageManager = new StorageManager();
