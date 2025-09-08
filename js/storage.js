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

    saveDocument(document) {
        const documents = this.getDocuments();
        const existingIndex = documents.findIndex(doc => doc.id === document.id);
        
        if (existingIndex !== -1) {
            documents[existingIndex] = {
                ...documents[existingIndex],
                ...document,
                updatedAt: new Date().toISOString()
            };
        } else {
            document.id = document.id || this.generateId();
            document.createdAt = new Date().toISOString();
            document.updatedAt = new Date().toISOString();
            documents.push(document);
        }
        
        return this.saveDocuments(documents);
    }

    getDocument(id) {
        const documents = this.getDocuments();
        return documents.find(doc => doc.id === id);
    }

    deleteDocument(id) {
        const documents = this.getDocuments();
        const filteredDocuments = documents.filter(doc => doc.id !== id);
        return this.saveDocuments(filteredDocuments);
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

    saveChatSession(chatSession) {
        const chats = this.getChats();
        const existingIndex = chats.findIndex(chat => chat.id === chatSession.id);
        
        if (existingIndex !== -1) {
            chats[existingIndex] = {
                ...chats[existingIndex],
                ...chatSession,
                updatedAt: new Date().toISOString()
            };
        } else {
            chatSession.id = chatSession.id || this.generateId();
            chatSession.createdAt = new Date().toISOString();
            chatSession.updatedAt = new Date().toISOString();
            chats.push(chatSession);
        }
        
        return this.saveChats(chats);
    }

    getChatSession(id) {
        const chats = this.getChats();
        return chats.find(chat => chat.id === id);
    }

    deleteChatSession(id) {
        const chats = this.getChats();
        const filteredChats = chats.filter(chat => chat.id !== id);
        return this.saveChats(filteredChats);
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

    saveUploadedFile(fileData) {
        const files = this.getUploadedFiles();
        const existingIndex = files.findIndex(file => file.id === fileData.id);
        
        if (existingIndex !== -1) {
            files[existingIndex] = {
                ...files[existingIndex],
                ...fileData,
                updatedAt: new Date().toISOString()
            };
        } else {
            fileData.id = fileData.id || this.generateId();
            fileData.uploadedAt = new Date().toISOString();
            fileData.updatedAt = new Date().toISOString();
            files.push(fileData);
        }
        
        return this.saveUploadedFiles(files);
    }

    getUploadedFile(id) {
        const files = this.getUploadedFiles();
        return files.find(file => file.id === id);
    }

    deleteUploadedFile(id) {
        const files = this.getUploadedFiles();
        const filteredFiles = files.filter(file => file.id !== id);
        return this.saveUploadedFiles(filteredFiles);
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
}

// Create global storage manager instance
window.storageManager = new StorageManager();
