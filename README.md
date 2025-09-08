# AI E-Learning Platform for Hong Kong Students

A comprehensive web-based learning tool that allows students to upload their notes, textbooks, and homework for AI-powered analysis and learning assistance.

## Features

### Core Functionality
1. **Document Upload & Processing**
   - Upload notes, textbooks, homework
   - AI reads and processes documents
   - File preview functionality

2. **AI-Powered Tools**
   - **Summarize**: Create comprehensive summaries with citations
   - **Explain**: Interactive explanations for selected text or topics
   - **Generate Exercises**: Create practice questions (MC, Short, Long, Essay)

3. **Interactive Features**
   - Text selection with floating action bubble
   - Follow-up questions via chat interface
   - Editable documents (Word Online style)

4. **Export & Storage**
   - Export to DOCX and PDF (A4, vertical)
   - Local storage for documents and chats
   - Reuse uploaded files

5. **User Interface**
   - Professional, responsive design
   - Chat panel on the right
   - File preview capabilities
   - User-friendly navigation

## Technology Stack
- Frontend: HTML5, CSS3, JavaScript (ES6+)
- Document Processing: PDF.js, Mammoth.js
- File Handling: FileReader API
- Storage: LocalStorage/IndexedDB
- Export: jsPDF, docx.js
- UI Framework: Custom responsive design

## Project Structure
```
/
├── index.html              # Main application
├── css/
│   ├── main.css           # Main styles
│   ├── components.css     # Component styles
│   └── responsive.css     # Responsive design
├── js/
│   ├── app.js            # Main application logic
│   ├── fileHandler.js    # File upload/preview
│   ├── aiProcessor.js    # AI processing logic
│   ├── documentEditor.js # Document editing
│   ├── chatInterface.js  # Chat functionality
│   ├── storage.js        # Local storage management
│   └── export.js         # Export functionality
├── assets/
│   ├── icons/            # UI icons
│   └── images/           # Application images
└── lib/                  # Third-party libraries
```

## Getting Started
1. Open `index.html` in a modern web browser
2. Upload your study materials
3. Choose from Summarize, Explain, or Generate Exercises
4. Interact with the generated content
5. Export or save your work locally

## Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
