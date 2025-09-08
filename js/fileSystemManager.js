/**
 * File System Manager for Lib Folder
 * Handles saving and organizing files in the lib folder structure
 */

class FileSystemManager {
    constructor() {
        this.libPath = './lib';
        this.projectStructure = {
            // projectId: {
            //     name: 'Project Name',
            //     docs: { docId: { title, content, fileName } },
            //     chats: { chatId: { title, messages, fileName } },
            //     files: { fileId: { name, content, fileName } }
            // }
        };
        
        this.initializeFileSystem();
    }

    /**
     * Initialize file system structure
     */
    initializeFileSystem() {
        // Load project structure from localStorage
        this.loadProjectStructure();
    }

    /**
     * Load project structure from localStorage
     */
    loadProjectStructure() {
        try {
            const stored = localStorage.getItem('ai_elearning_lib');
            if (stored) {
                this.projectStructure = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading project structure:', error);
            this.projectStructure = {};
        }
    }

    /**
     * Save project structure to localStorage
     */
    saveProjectStructure() {
        try {
            localStorage.setItem('ai_elearning_lib', JSON.stringify(this.projectStructure));
        } catch (error) {
            console.error('Error saving project structure:', error);
        }
    }

    /**
     * Generate project ID based on document or current context
     */
    generateProjectId(document = null) {
        if (document && document.sourceFiles && document.sourceFiles.length > 0) {
            // Use first source file name as project identifier
            const fileName = document.sourceFiles[0].name;
            return this.sanitizeFileName(fileName.replace(/\.[^/.]+$/, ''));
        }
        
        // Use current date as fallback
        const now = new Date();
        return `project_${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}`;
    }

    /**
     * Sanitize file name for safe file system usage
     */
    sanitizeFileName(name) {
        return name.replace(/[^a-z0-9-_]/gi, '_').toLowerCase();
    }

    /**
     * Ensure project exists in structure
     */
    ensureProject(projectId, projectName = null) {
        if (!this.projectStructure[projectId]) {
            this.projectStructure[projectId] = {
                name: projectName || projectId,
                docs: {},
                chats: {},
                files: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.saveProjectStructure();
        }
        return this.projectStructure[projectId];
    }

    /**
     * Save document to lib folder structure
     */
    saveDocumentToLib(document, projectId = null) {
        if (!document) return null;

        const actualProjectId = projectId || this.generateProjectId(document);
        const project = this.ensureProject(actualProjectId, `Project: ${document.title}`);
        
        const fileName = `${this.sanitizeFileName(document.title)}.md`;
        const docData = {
            ...document,
            fileName: fileName,
            contentType: 'markdown',
            savedAt: new Date().toISOString()
        };

        project.docs[document.id] = docData;
        project.updatedAt = new Date().toISOString();
        this.saveProjectStructure();

        // Generate markdown content
        const markdownContent = this.generateMarkdownContent(document);
        
        // Save to storage manager as well for persistence
        if (window.storageManager) {
            window.storageManager.libSaveDoc(actualProjectId, docData);
        }

        return {
            projectId: actualProjectId,
            fileName: fileName,
            content: markdownContent,
            path: `${this.libPath}/${actualProjectId}/docs/${fileName}`
        };
    }

    /**
     * Save chat session to lib folder structure
     */
    saveChatToLib(chatSession, projectId = null) {
        if (!chatSession) return null;

        const actualProjectId = projectId || chatSession.docId || this.generateProjectId();
        const project = this.ensureProject(actualProjectId, `Project: ${chatSession.title}`);
        
        const fileName = `${this.sanitizeFileName(chatSession.title || 'chat')}.json`;
        const chatData = {
            ...chatSession,
            fileName: fileName,
            contentType: 'json',
            savedAt: new Date().toISOString()
        };

        project.chats[chatSession.id] = chatData;
        project.updatedAt = new Date().toISOString();
        this.saveProjectStructure();

        // Generate JSON content
        const jsonContent = JSON.stringify(chatSession, null, 2);
        
        // Save to storage manager as well for persistence
        if (window.storageManager) {
            window.storageManager.libSaveChat(actualProjectId, chatData);
        }

        return {
            projectId: actualProjectId,
            fileName: fileName,
            content: jsonContent,
            path: `${this.libPath}/${actualProjectId}/chats/${fileName}`
        };
    }

    /**
     * Save uploaded file to lib folder structure
     */
    saveUploadedFileToLib(fileData, projectId = null) {
        if (!fileData) return null;

        const actualProjectId = projectId || this.generateProjectId();
        const project = this.ensureProject(actualProjectId, `Project: ${fileData.name}`);
        
        const fileName = this.sanitizeFileName(fileData.name);
        const uploadedFileData = {
            ...fileData,
            fileName: fileName,
            savedAt: new Date().toISOString()
        };

        project.files[fileData.id] = uploadedFileData;
        project.updatedAt = new Date().toISOString();
        this.saveProjectStructure();

        // Save to storage manager as well for persistence
        if (window.storageManager) {
            window.storageManager.libSaveFile(actualProjectId, uploadedFileData);
        }

        return {
            projectId: actualProjectId,
            fileName: fileName,
            content: fileData.content,
            path: `${this.libPath}/${actualProjectId}/files/${fileName}`
        };
    }

    /**
     * Generate markdown content from document
     */
    generateMarkdownContent(document) {
        let content = `# ${document.title}\n\n`;
        
        // Add metadata
        content += `**Type:** ${document.type}\n`;
        content += `**Created:** ${new Date(document.createdAt).toLocaleString()}\n`;
        if (document.updatedAt && document.updatedAt !== document.createdAt) {
            content += `**Updated:** ${new Date(document.updatedAt).toLocaleString()}\n`;
        }
        content += `**ID:** ${document.id}\n\n`;
        
        // Add source files if available
        if (document.sourceFiles && document.sourceFiles.length > 0) {
            content += `## Source Files\n\n`;
            document.sourceFiles.forEach(file => {
                content += `- ${file.name} (${file.type})\n`;
            });
            content += `\n`;
        }
        
        content += `---\n\n`;
        content += document.content;
        
        return content;
    }

    /**
     * Delete document from lib structure
     */
    deleteDocumentFromLib(documentId, projectId) {
        if (!projectId || !this.projectStructure[projectId]) return false;
        
        const project = this.projectStructure[projectId];
        if (project.docs[documentId]) {
            delete project.docs[documentId];
            project.updatedAt = new Date().toISOString();
            this.saveProjectStructure();
            
            // Also delete from storage manager
            if (window.storageManager) {
                window.storageManager.libDeleteDoc(projectId, documentId);
            }
            
            return true;
        }
        return false;
    }

    /**
     * Delete chat from lib structure
     */
    deleteChatFromLib(chatId, projectId) {
        if (!projectId || !this.projectStructure[projectId]) return false;
        
        const project = this.projectStructure[projectId];
        if (project.chats[chatId]) {
            delete project.chats[chatId];
            project.updatedAt = new Date().toISOString();
            this.saveProjectStructure();
            
            // Also delete from storage manager
            if (window.storageManager) {
                window.storageManager.libDeleteChat(projectId, chatId);
            }
            
            return true;
        }
        return false;
    }

    /**
     * Delete uploaded file from lib structure
     */
    deleteFileFromLib(fileId, projectId) {
        if (!projectId || !this.projectStructure[projectId]) return false;
        
        const project = this.projectStructure[projectId];
        if (project.files[fileId]) {
            delete project.files[fileId];
            project.updatedAt = new Date().toISOString();
            this.saveProjectStructure();
            
            // Also delete from storage manager
            if (window.storageManager) {
                window.storageManager.libDeleteFile(projectId, fileId);
            }
            
            return true;
        }
        return false;
    }

    /**
     * Get all projects
     */
    getAllProjects() {
        return Object.keys(this.projectStructure).map(id => ({
            id,
            ...this.projectStructure[id]
        }));
    }

    /**
     * Get project by ID
     */
    getProject(projectId) {
        return this.projectStructure[projectId] || null;
    }

    /**
     * Get project statistics
     */
    getProjectStats(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        return {
            docsCount: Object.keys(project.docs).length,
            chatsCount: Object.keys(project.chats).length,
            filesCount: Object.keys(project.files).length,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        };
    }

    /**
     * Export project as downloadable files
     */
    exportProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) return null;

        const exports = [];

        // Export documents as markdown
        Object.values(project.docs).forEach(doc => {
            const content = this.generateMarkdownContent(doc);
            exports.push({
                fileName: doc.fileName,
                content: content,
                type: 'text/markdown',
                folder: 'docs'
            });
        });

        // Export chats as JSON
        Object.values(project.chats).forEach(chat => {
            const content = JSON.stringify(chat, null, 2);
            exports.push({
                fileName: chat.fileName,
                content: content,
                type: 'application/json',
                folder: 'chats'
            });
        });

        // Export file metadata (content is already stored)
        Object.values(project.files).forEach(file => {
            const metadata = {
                id: file.id,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: file.uploadedAt,
                content: file.content
            };
            exports.push({
                fileName: `${file.fileName}.metadata.json`,
                content: JSON.stringify(metadata, null, 2),
                type: 'application/json',
                folder: 'files'
            });
        });

        return {
            projectName: project.name,
            exports: exports
        };
    }

    /**
     * Download project as ZIP (simulated with individual file downloads)
     */
    downloadProject(projectId) {
        const exportData = this.exportProject(projectId);
        if (!exportData) return;

        exportData.exports.forEach(file => {
            const blob = new Blob([file.content], { type: file.type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportData.projectName}_${file.folder}_${file.fileName}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Clean up empty projects
     */
    cleanupEmptyProjects() {
        const projectIds = Object.keys(this.projectStructure);
        let cleaned = 0;

        projectIds.forEach(projectId => {
            const project = this.projectStructure[projectId];
            const isEmpty = Object.keys(project.docs).length === 0 && 
                           Object.keys(project.chats).length === 0 && 
                           Object.keys(project.files).length === 0;
            
            if (isEmpty) {
                delete this.projectStructure[projectId];
                cleaned++;
            }
        });

        if (cleaned > 0) {
            this.saveProjectStructure();
        }

        return cleaned;
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        const projects = this.getAllProjects();
        let totalDocs = 0;
        let totalChats = 0;
        let totalFiles = 0;

        projects.forEach(project => {
            totalDocs += Object.keys(project.docs).length;
            totalChats += Object.keys(project.chats).length;
            totalFiles += Object.keys(project.files).length;
        });

        return {
            projectsCount: projects.length,
            totalDocs,
            totalChats,
            totalFiles,
            storageSize: JSON.stringify(this.projectStructure).length
        };
    }
}

// Create global file system manager instance
window.fileSystemManager = new FileSystemManager();
