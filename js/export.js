/**
 * Export Manager
 * Handles document export to DOCX and PDF formats
 */

class ExportManager {
    constructor() {
        this.initializeExport();
    }

    /**
     * Initialize export functionality
     */
    initializeExport() {
        // Initialize modal event listeners
        this.initializeModalListeners();
    }

    /**
     * Initialize modal event listeners
     */
    initializeModalListeners() {
        // Close modal buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('open');
                }
            });
        });

        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('open');
            }
        });

        // Close solution overlay
        const revealBtn = document.getElementById('revealSolutionBtn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => {
                const overlay = document.getElementById('solutionOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            });
        }

        // Close preview modal
        const closePreviewBtn = document.getElementById('closePreviewBtn');
        if (closePreviewBtn) {
            closePreviewBtn.addEventListener('click', () => {
                const modal = document.getElementById('filePreviewModal');
                if (modal) {
                    modal.classList.remove('open');
                }
            });
        }
    }

    /**
     * Export document to specified format
     */
    async exportDocument(document, format) {
        if (!document) {
            this.showError('No document to export');
            return;
        }

        try {
            this.showLoading(`Exporting to ${format.toUpperCase()}...`);

            switch (format.toLowerCase()) {
                case 'docx':
                    await this.exportToDocx(document);
                    break;
                case 'pdf':
                    await this.exportToPdf(document);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }

            this.hideLoading();
            this.showSuccess(`Document exported to ${format.toUpperCase()} successfully`);

        } catch (error) {
            console.error('Export error:', error);
            this.hideLoading();
            this.showError(`Failed to export to ${format.toUpperCase()}: ${error.message}`);
        }
    }

    /**
     * Export document to DOCX format
     */
    async exportToDocx(document) {
        // Convert markdown content to Word document structure
        const docContent = this.convertToWordContent(document.content);
        
        // Create document using docx library
        const doc = new docx.Document({
            sections: [{
                properties: {
                    page: {
                        size: {
                            orientation: docx.PageOrientation.PORTRAIT,
                            width: docx.convertInchesToTwip(8.5),
                            height: docx.convertInchesToTwip(11),
                        },
                        margin: {
                            top: docx.convertInchesToTwip(1),
                            right: docx.convertInchesToTwip(1),
                            bottom: docx.convertInchesToTwip(1),
                            left: docx.convertInchesToTwip(1),
                        },
                    },
                },
                children: [
                    // Document title
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: document.title,
                                bold: true,
                                size: 32,
                            }),
                        ],
                        spacing: {
                            after: 400,
                        },
                    }),
                    
                    // Document type and date
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun({
                                text: `${document.type.toUpperCase()} • Generated on ${new Date(document.createdAt).toLocaleDateString()}`,
                                italics: true,
                                size: 20,
                                color: "666666",
                            }),
                        ],
                        spacing: {
                            after: 600,
                        },
                    }),
                    
                    // Document content
                    ...docContent
                ]
            }]
        });

        // Generate and download the document
        const buffer = await docx.Packer.toBuffer(doc);
        this.downloadFile(buffer, `${this.sanitizeFilename(document.title)}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }

    /**
     * Export document to PDF format
     */
    async exportToPdf(document) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set up document properties
        pdf.setProperties({
            title: document.title,
            subject: `${document.type} document`,
            author: 'AI E-Learning Platform',
            creator: 'AI E-Learning Platform'
        });

        // Document styling
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        let currentY = margin;

        // Add title
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        const titleLines = pdf.splitTextToSize(document.title, contentWidth);
        pdf.text(titleLines, margin, currentY);
        currentY += titleLines.length * 8 + 10;

        // Add document info
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'italic');
        pdf.setTextColor(100, 100, 100);
        const infoText = `${document.type.toUpperCase()} • Generated on ${new Date(document.createdAt).toLocaleDateString()}`;
        pdf.text(infoText, margin, currentY);
        currentY += 15;

        // Add separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;

        // Reset text color
        pdf.setTextColor(0, 0, 0);

        // Convert and add content
        const contentLines = this.convertToPdfContent(document.content);
        
        for (const line of contentLines) {
            // Check if we need a new page
            if (currentY > pageHeight - margin - 20) {
                pdf.addPage();
                currentY = margin;
            }

            // Apply styling based on line type
            this.applyPdfStyling(pdf, line);
            
            // Split text to fit page width
            const textLines = pdf.splitTextToSize(line.text, contentWidth);
            
            // Add spacing before certain elements
            if (line.type === 'heading' && currentY > margin + 20) {
                currentY += 5;
            }
            
            pdf.text(textLines, margin, currentY);
            currentY += textLines.length * (line.lineHeight || 6) + (line.spacing || 0);
        }

        // Add footer with page numbers
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
        }

        // Download the PDF
        pdf.save(`${this.sanitizeFilename(document.title)}.pdf`);
    }

    /**
     * Convert markdown content to Word document structure
     */
    convertToWordContent(content) {
        const lines = content.split('\n');
        const wordContent = [];
        let currentList = null;
        let listItems = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) {
                // Add spacing for empty lines
                if (currentList) {
                    wordContent.push(...this.createWordList(listItems, currentList));
                    currentList = null;
                    listItems = [];
                }
                wordContent.push(new docx.Paragraph({ children: [new docx.TextRun("")], spacing: { after: 200 } }));
                continue;
            }

            // Headers
            if (line.startsWith('# ')) {
                if (currentList) {
                    wordContent.push(...this.createWordList(listItems, currentList));
                    currentList = null;
                    listItems = [];
                }
                wordContent.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: line.substring(2), bold: true, size: 28 })],
                    heading: docx.HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }));
            } else if (line.startsWith('## ')) {
                if (currentList) {
                    wordContent.push(...this.createWordList(listItems, currentList));
                    currentList = null;
                    listItems = [];
                }
                wordContent.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: line.substring(3), bold: true, size: 24 })],
                    heading: docx.HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 150 }
                }));
            } else if (line.startsWith('### ')) {
                if (currentList) {
                    wordContent.push(...this.createWordList(listItems, currentList));
                    currentList = null;
                    listItems = [];
                }
                wordContent.push(new docx.Paragraph({
                    children: [new docx.TextRun({ text: line.substring(4), bold: true, size: 20 })],
                    heading: docx.HeadingLevel.HEADING_3,
                    spacing: { before: 250, after: 100 }
                }));
            }
            // Lists
            else if (line.startsWith('- ')) {
                if (currentList !== 'bullet') {
                    if (currentList) {
                        wordContent.push(...this.createWordList(listItems, currentList));
                    }
                    currentList = 'bullet';
                    listItems = [];
                }
                listItems.push(line.substring(2));
            } else if (line.match(/^\d+\. /)) {
                if (currentList !== 'number') {
                    if (currentList) {
                        wordContent.push(...this.createWordList(listItems, currentList));
                    }
                    currentList = 'number';
                    listItems = [];
                }
                listItems.push(line.replace(/^\d+\. /, ''));
            }
            // Regular paragraphs
            else {
                if (currentList) {
                    wordContent.push(...this.createWordList(listItems, currentList));
                    currentList = null;
                    listItems = [];
                }
                
                // Process inline formatting
                const textRuns = this.processInlineFormatting(line);
                wordContent.push(new docx.Paragraph({
                    children: textRuns,
                    spacing: { after: 200 }
                }));
            }
        }

        // Handle any remaining list
        if (currentList) {
            wordContent.push(...this.createWordList(listItems, currentList));
        }

        return wordContent;
    }

    /**
     * Create Word list from items
     */
    createWordList(items, listType) {
        return items.map((item, index) => {
            const textRuns = this.processInlineFormatting(item);
            return new docx.Paragraph({
                children: textRuns,
                bullet: listType === 'bullet' ? { level: 0 } : undefined,
                numbering: listType === 'number' ? { reference: "default-numbering", level: 0 } : undefined,
                spacing: { after: 100 }
            });
        });
    }

    /**
     * Process inline formatting (bold, italic, etc.)
     */
    processInlineFormatting(text) {
        const textRuns = [];
        let currentText = text;
        
        // Handle citations
        currentText = currentText.replace(/<span class="citation">\[(\d+)\]<\/span>/g, ' [$1]');
        
        // Simple approach: split by formatting markers
        const parts = currentText.split(/(\*\*.*?\*\*|\*.*?\*)/);
        
        for (const part of parts) {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text
                textRuns.push(new docx.TextRun({
                    text: part.slice(2, -2),
                    bold: true
                }));
            } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
                // Italic text
                textRuns.push(new docx.TextRun({
                    text: part.slice(1, -1),
                    italics: true
                }));
            } else if (part.trim()) {
                // Regular text
                textRuns.push(new docx.TextRun({ text: part }));
            }
        }
        
        return textRuns.length > 0 ? textRuns : [new docx.TextRun({ text: text })];
    }

    /**
     * Convert content to PDF format
     */
    convertToPdfContent(content) {
        const lines = content.split('\n');
        const pdfContent = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Clean HTML tags and special formatting
            line = line.replace(/<[^>]*>/g, '');
            line = line.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers for now
            line = line.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers for now

            if (line.startsWith('# ')) {
                pdfContent.push({
                    text: line.substring(2),
                    type: 'heading',
                    fontSize: 16,
                    lineHeight: 8,
                    spacing: 5
                });
            } else if (line.startsWith('## ')) {
                pdfContent.push({
                    text: line.substring(3),
                    type: 'heading',
                    fontSize: 14,
                    lineHeight: 7,
                    spacing: 4
                });
            } else if (line.startsWith('### ')) {
                pdfContent.push({
                    text: line.substring(4),
                    type: 'heading',
                    fontSize: 12,
                    lineHeight: 6,
                    spacing: 3
                });
            } else if (line.startsWith('- ')) {
                pdfContent.push({
                    text: '• ' + line.substring(2),
                    type: 'list',
                    fontSize: 10,
                    lineHeight: 5,
                    spacing: 2
                });
            } else if (line.match(/^\d+\. /)) {
                pdfContent.push({
                    text: line,
                    type: 'list',
                    fontSize: 10,
                    lineHeight: 5,
                    spacing: 2
                });
            } else {
                pdfContent.push({
                    text: line,
                    type: 'paragraph',
                    fontSize: 10,
                    lineHeight: 5,
                    spacing: 3
                });
            }
        }

        return pdfContent;
    }

    /**
     * Apply PDF styling based on content type
     */
    applyPdfStyling(pdf, line) {
        pdf.setFontSize(line.fontSize || 10);
        
        switch (line.type) {
            case 'heading':
                pdf.setFont(undefined, 'bold');
                break;
            case 'list':
                pdf.setFont(undefined, 'normal');
                break;
            default:
                pdf.setFont(undefined, 'normal');
        }
    }

    /**
     * Download file
     */
    downloadFile(data, filename, mimeType) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Sanitize filename for download
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9\s\-_]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Exporting...') {
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
     * Show success message
     */
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
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
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }

    /**
     * Export chat history
     */
    async exportChatHistory(format = 'docx') {
        if (!window.chatInterface) {
            this.showError('Chat interface not available');
            return;
        }

        const chatContent = window.chatInterface.exportChatHistory();
        if (!chatContent) {
            this.showError('No chat history to export');
            return;
        }

        const chatDocument = {
            id: 'chat-export',
            title: 'Chat History',
            type: 'chat',
            content: chatContent,
            createdAt: new Date().toISOString()
        };

        await this.exportDocument(chatDocument, format);
    }

    /**
     * Bulk export multiple documents
     */
    async bulkExport(documents, format = 'docx') {
        if (!documents || documents.length === 0) {
            this.showError('No documents to export');
            return;
        }

        this.showLoading(`Exporting ${documents.length} documents...`);

        try {
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];
                await this.exportDocument(doc, format);
                
                // Small delay between exports
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this.hideLoading();
            this.showSuccess(`Successfully exported ${documents.length} documents`);

        } catch (error) {
            console.error('Bulk export error:', error);
            this.hideLoading();
            this.showError(`Bulk export failed: ${error.message}`);
        }
    }
}

// Create global export manager instance
window.exportManager = new ExportManager();
