/**
 * AI Processing System
 * Handles both simulated and real AI functionality for summarizing, explaining, and generating exercises
 */

class AIProcessor {
    constructor() {
        this.currentSession = null;
        this.processingDelay = 2000; // Simulate processing time
        this.useRealAI = false; // Toggle between real and simulated AI
        this.realAIHandler = null;
        
        // Initialize real AI handler if available
        if (window.RealAIHandler) {
            this.realAIHandler = new window.RealAIHandler();
        }
    }

    /**
     * Toggle between real and simulated AI
     * @param {boolean} useReal - Whether to use real AI
     */
    setUseRealAI(useReal) {
        this.useRealAI = useReal && this.realAIHandler && this.realAIHandler.isConfigured();
        if (this.useRealAI && !this.realAIHandler.isConfigured()) {
            console.warn('Real AI is not configured. Please set API key first.');
            return false;
        }
        return this.useRealAI;
    }

    /**
     * Set API key for real AI
     * @param {string} apiKey - OpenRouter API key
     */
    setApiKey(apiKey) {
        if (this.realAIHandler) {
            this.realAIHandler.setApiKey(apiKey);
            return true;
        }
        return false;
    }

    /**
     * Check if real AI is available and configured
     * @returns {boolean}
     */
    isRealAIAvailable() {
        return this.realAIHandler && this.realAIHandler.isConfigured();
    }

    /**
     * Summarize uploaded documents
     */
    async summarizeDocuments(files) {
        if (!files || files.length === 0) {
            throw new Error('No files to summarize');
        }

        window.fileHandler.showLoading('AI is analyzing and summarizing your documents...');

        let summary;
        try {
            if (this.useRealAI && this.realAIHandler) {
                // Use real AI
                const documents = files.map(f => ({ filename: f.name, content: f.content }));
                summary = await this.realAIHandler.summarizeDocuments(documents);
            } else {
                // Use simulated AI
                await this.delay(this.processingDelay);
                summary = this.generateSummary(files);
            }
        } catch (error) {
            console.error('AI processing error:', error);
            // Fallback to simulated AI
            await this.delay(this.processingDelay);
            summary = this.generateSummary(files);
            summary = `*Note: Using simulated AI due to API error*\n\n${summary}`;
        }

        const document = {
            id: storageManager.generateId(),
            title: `Summary - ${new Date().toLocaleDateString()}`,
            type: 'summary',
            content: summary,
            sourceFiles: files.map(f => ({ name: f.name, type: f.type })),
            aiType: this.useRealAI ? 'real' : 'simulated',
            createdAt: new Date().toISOString()
        };

        // Save document
        storageManager.saveDocument(document);
        
        window.fileHandler.hideLoading();
        return document;
    }

    /**
     * Generate summary content
     */
    generateSummary(files) {
        let summary = `# Document Summary\n\n`;
        summary += `*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
        
        summary += `## Overview\n\n`;
        summary += `This summary covers ${files.length} document${files.length > 1 ? 's' : ''}: `;
        summary += files.map(f => f.name).join(', ') + '.\n\n';

        files.forEach((file, index) => {
            summary += `## ${index + 1}. ${file.name} <span class="citation">[${index + 1}]</span>\n\n`;
            
            const content = file.content;
            const keyPoints = this.extractKeyPoints(content);
            
            summary += `### Key Points:\n\n`;
            keyPoints.forEach(point => {
                summary += `- ${point}\n`;
            });
            summary += '\n';

            // Add main topics
            const topics = this.extractTopics(content);
            if (topics.length > 0) {
                summary += `### Main Topics:\n\n`;
                topics.forEach(topic => {
                    summary += `- **${topic.title}**: ${topic.description}\n`;
                });
                summary += '\n';
            }
        });

        // Add consolidated summary
        summary += `## Consolidated Summary\n\n`;
        summary += this.generateConsolidatedSummary(files);

        // Add citations
        summary += `\n## References\n\n`;
        files.forEach((file, index) => {
            summary += `[${index + 1}] ${file.name} (${file.type.toUpperCase()})\n`;
        });

        return summary;
    }

    /**
     * Extract key points from content
     */
    extractKeyPoints(content) {
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keyPoints = [];
        
        // Simple algorithm to extract important sentences
        const keywords = ['important', 'key', 'main', 'significant', 'crucial', 'essential', 'fundamental', 'primary', 'major', 'critical'];
        
        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            const hasKeyword = keywords.some(keyword => lowerSentence.includes(keyword));
            const isLongEnough = sentence.trim().length > 30 && sentence.trim().length < 200;
            
            if ((hasKeyword || Math.random() > 0.7) && isLongEnough && keyPoints.length < 5) {
                keyPoints.push(sentence.trim());
            }
        });

        // If no key points found, take first few sentences
        if (keyPoints.length === 0) {
            keyPoints.push(...sentences.slice(0, 3).map(s => s.trim()));
        }

        return keyPoints.slice(0, 5);
    }

    /**
     * Extract topics from content
     */
    extractTopics(content) {
        const topics = [];
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        // Look for headings or important lines
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 10 && trimmedLine.length < 100) {
                // Check if it looks like a heading or important topic
                if (trimmedLine.match(/^[A-Z][^.]*$/) || trimmedLine.includes(':') || Math.random() > 0.8) {
                    if (topics.length < 4) {
                        topics.push({
                            title: trimmedLine.split(':')[0],
                            description: this.generateTopicDescription(trimmedLine)
                        });
                    }
                }
            }
        });

        return topics;
    }

    /**
     * Generate topic description
     */
    generateTopicDescription(topic) {
        const descriptions = [
            'This section covers fundamental concepts and principles.',
            'Key information and important details are discussed here.',
            'This topic provides essential background knowledge.',
            'Important methodologies and approaches are explained.',
            'Critical analysis and insights are presented in this section.'
        ];
        
        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    /**
     * Generate consolidated summary
     */
    generateConsolidatedSummary(files) {
        const totalWords = files.reduce((sum, file) => sum + file.content.split(' ').length, 0);
        const avgWordsPerFile = Math.round(totalWords / files.length);
        
        let consolidated = `The uploaded documents contain a total of approximately ${totalWords} words across ${files.length} file${files.length > 1 ? 's' : ''}. `;
        
        consolidated += `The materials cover various topics and concepts that are interconnected and build upon each other. `;
        
        consolidated += `Key themes that emerge across the documents include fundamental principles, practical applications, and important methodologies. `;
        
        consolidated += `Students should focus on understanding the core concepts presented in each document and how they relate to the overall subject matter. `;
        
        consolidated += `The information provided serves as a comprehensive foundation for further learning and practical application.`;
        
        return consolidated;
    }

    /**
     * Explain documents or selected topics
     */
    async explainContent(files, selectedTopic = null) {
        if (!files || files.length === 0) {
            throw new Error('No files to explain');
        }

        window.fileHandler.showLoading('AI is preparing detailed explanations...');

        let explanation;
        try {
            if (this.useRealAI && this.realAIHandler) {
                // Use real AI
                const content = files.map(f => f.content).join('\n\n---\n\n');
                explanation = await this.realAIHandler.explainContent(content, selectedTopic);
            } else {
                // Use simulated AI
                await this.delay(this.processingDelay);
                if (selectedTopic) {
                    explanation = this.generateTopicExplanation(files, selectedTopic);
                } else {
                    explanation = this.generateFullExplanation(files);
                }
            }
        } catch (error) {
            console.error('AI processing error:', error);
            // Fallback to simulated AI
            await this.delay(this.processingDelay);
            if (selectedTopic) {
                explanation = this.generateTopicExplanation(files, selectedTopic);
            } else {
                explanation = this.generateFullExplanation(files);
            }
            explanation = `*Note: Using simulated AI due to API error*\n\n${explanation}`;
        }

        const document = {
            id: storageManager.generateId(),
            title: selectedTopic ? `Explanation: ${selectedTopic}` : `Detailed Explanation - ${new Date().toLocaleDateString()}`,
            type: 'explanation',
            content: explanation,
            sourceFiles: files.map(f => ({ name: f.name, type: f.type })),
            selectedTopic: selectedTopic,
            aiType: this.useRealAI ? 'real' : 'simulated',
            createdAt: new Date().toISOString()
        };

        // Save document
        storageManager.saveDocument(document);
        
        window.fileHandler.hideLoading();
        return document;
    }

    /**
     * Generate topic explanation
     */
    generateTopicExplanation(files, topic) {
        let explanation = `# Detailed Explanation: ${topic}\n\n`;
        explanation += `*Prepared for students new to this topic*\n\n`;
        
        explanation += `## Introduction\n\n`;
        explanation += `Welcome to this detailed explanation of "${topic}". This guide is designed for students who are encountering this topic for the first time. We'll break down complex concepts into easy-to-understand parts and provide clear examples.\n\n`;
        
        explanation += `## What is ${topic}?\n\n`;
        explanation += this.generateBasicDefinition(topic);
        
        explanation += `## Key Concepts\n\n`;
        explanation += this.generateKeyConcepts(topic);
        
        explanation += `## Step-by-Step Breakdown\n\n`;
        explanation += this.generateStepByStep(topic);
        
        explanation += `## Real-World Examples\n\n`;
        explanation += this.generateExamples(topic);
        
        explanation += `## Common Misconceptions\n\n`;
        explanation += this.generateMisconceptions(topic);
        
        explanation += `## Tips for Understanding\n\n`;
        explanation += this.generateLearningTips(topic);
        
        explanation += `## Summary\n\n`;
        explanation += `In summary, ${topic} is an important concept that forms the foundation for further learning. Remember to take your time understanding each component before moving on to more advanced topics.\n\n`;
        
        // Add source references
        explanation += `## Source Materials\n\n`;
        files.forEach((file, index) => {
            explanation += `- ${file.name} <span class="citation">[${index + 1}]</span>\n`;
        });
        
        return explanation;
    }

    /**
     * Generate full explanation
     */
    generateFullExplanation(files) {
        let explanation = `# Comprehensive Explanation\n\n`;
        explanation += `*A beginner-friendly guide to your study materials*\n\n`;
        
        explanation += `## Overview\n\n`;
        explanation += `This comprehensive explanation covers all the materials you've uploaded. Each section is designed to help you understand complex concepts step by step, assuming no prior knowledge of the subject.\n\n`;
        
        files.forEach((file, index) => {
            explanation += `## Document ${index + 1}: ${file.name} <span class="citation">[${index + 1}]</span>\n\n`;
            
            explanation += `### What This Document Covers\n\n`;
            explanation += this.generateDocumentOverview(file);
            
            explanation += `### Key Learning Points\n\n`;
            const keyPoints = this.extractKeyPoints(file.content);
            keyPoints.forEach(point => {
                explanation += `#### ${point.split(' ').slice(0, 5).join(' ')}...\n\n`;
                explanation += this.generatePointExplanation(point);
            });
        });
        
        explanation += `## How Everything Connects\n\n`;
        explanation += this.generateConnectionExplanation(files);
        
        explanation += `## Study Recommendations\n\n`;
        explanation += this.generateStudyRecommendations(files);
        
        return explanation;
    }

    /**
     * Generate basic definition
     */
    generateBasicDefinition(topic) {
        return `${topic} is a fundamental concept that plays a crucial role in this subject area. Think of it as a building block that helps you understand more complex ideas. At its core, ${topic} involves understanding the relationship between different elements and how they work together to create meaningful outcomes.\n\n`;
    }

    /**
     * Generate key concepts
     */
    generateKeyConcepts(topic) {
        const concepts = [
            'Foundation principles that underlie the topic',
            'Core terminology and definitions you need to know',
            'Relationships between different components',
            'Practical applications and real-world relevance',
            'Common patterns and recurring themes'
        ];
        
        let content = '';
        concepts.forEach((concept, index) => {
            content += `### ${index + 1}. ${concept}\n\n`;
            content += `This aspect of ${topic} helps you understand how different elements work together. It's important to grasp this concept before moving on to more advanced topics.\n\n`;
        });
        
        return content;
    }

    /**
     * Generate step-by-step breakdown
     */
    generateStepByStep(topic) {
        let content = `Let's break down ${topic} into manageable steps:\n\n`;
        
        const steps = [
            'Start with the basic definition and core principles',
            'Identify the key components and their functions',
            'Understand how these components interact with each other',
            'Explore practical applications and examples',
            'Practice applying the concepts to different scenarios'
        ];
        
        steps.forEach((step, index) => {
            content += `### Step ${index + 1}: ${step}\n\n`;
            content += `In this step, focus on understanding the fundamental aspects before moving forward. Take your time to ensure you're comfortable with each concept.\n\n`;
        });
        
        return content;
    }

    /**
     * Generate examples
     */
    generateExamples(topic) {
        return `Here are some practical examples to help you understand ${topic}:\n\n` +
               `### Example 1: Basic Application\n\n` +
               `Consider a simple scenario where ${topic} is applied in everyday situations. This helps you see the practical relevance of what you're learning.\n\n` +
               `### Example 2: Advanced Application\n\n` +
               `Once you understand the basics, you can explore more complex applications that demonstrate the full potential of ${topic}.\n\n` +
               `### Example 3: Problem-Solving\n\n` +
               `This example shows how ${topic} can be used to solve real-world problems, making your learning more meaningful and applicable.\n\n`;
    }

    /**
     * Generate misconceptions
     */
    generateMisconceptions(topic) {
        return `Here are some common misconceptions about ${topic} that students often have:\n\n` +
               `### Misconception 1: Oversimplification\n\n` +
               `Many students think ${topic} is simpler than it actually is. While the basic concepts are straightforward, there are nuances that require careful attention.\n\n` +
               `### Misconception 2: Isolation\n\n` +
               `Students sometimes view ${topic} as a standalone concept, but it's actually interconnected with many other ideas in the subject.\n\n` +
               `### Misconception 3: Memorization vs. Understanding\n\n` +
               `Simply memorizing facts about ${topic} isn't enough. True understanding comes from grasping the underlying principles and being able to apply them.\n\n`;
    }

    /**
     * Generate learning tips
     */
    generateLearningTips(topic) {
        return `Here are some effective strategies for mastering ${topic}:\n\n` +
               `- **Start with the basics**: Make sure you understand fundamental concepts before moving to advanced topics\n` +
               `- **Use visual aids**: Draw diagrams or create mind maps to visualize relationships\n` +
               `- **Practice regularly**: Apply the concepts to different scenarios to reinforce your understanding\n` +
               `- **Ask questions**: Don't hesitate to seek clarification when something isn't clear\n` +
               `- **Connect to prior knowledge**: Relate ${topic} to things you already know\n` +
               `- **Teach others**: Explaining concepts to others helps solidify your own understanding\n\n`;
    }

    /**
     * Generate document overview
     */
    generateDocumentOverview(file) {
        const wordCount = file.content.split(' ').length;
        return `This document contains approximately ${wordCount} words and covers important concepts related to your studies. The material is structured to build your understanding progressively, starting with fundamental ideas and moving toward more complex applications.\n\n`;
    }

    /**
     * Generate point explanation
     */
    generatePointExplanation(point) {
        return `This concept is important because it helps you understand the broader context of your studies. Let's break it down: the key idea here is that you need to understand not just what is happening, but why it happens and how it connects to other concepts you're learning. This foundation will be crucial as you progress in your studies.\n\n`;
    }

    /**
     * Generate connection explanation
     */
    generateConnectionExplanation(files) {
        return `All the documents you've uploaded are connected in important ways. Understanding these connections will help you see the bigger picture and make your learning more effective. Each concept builds upon previous ones, creating a comprehensive understanding of the subject matter. Look for common themes, recurring principles, and how different topics support and reinforce each other.\n\n`;
    }

    /**
     * Generate study recommendations
     */
    generateStudyRecommendations(files) {
        return `Based on your materials, here are some study recommendations:\n\n` +
               `1. **Review regularly**: Go through the key concepts multiple times to reinforce your memory\n` +
               `2. **Create summaries**: Write your own summaries of each major topic\n` +
               `3. **Practice problems**: If applicable, work through practice exercises\n` +
               `4. **Form study groups**: Discuss concepts with classmates to gain different perspectives\n` +
               `5. **Seek help when needed**: Don't hesitate to ask teachers or tutors for clarification\n\n`;
    }

    /**
     * Extract topics for explanation selection
     */
    extractTopicsForSelection(files) {
        const topics = [];
        
        files.forEach(file => {
            const content = file.content;
            const lines = content.split('\n').filter(line => line.trim().length > 0);
            
            // Extract potential topics
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine.length > 10 && trimmedLine.length < 80) {
                    // Check if it looks like a heading or topic
                    if (trimmedLine.match(/^[A-Z]/) && !trimmedLine.endsWith('.')) {
                        topics.push({
                            title: trimmedLine,
                            description: `From ${file.name}`,
                            source: file.name
                        });
                    }
                }
            });
        });
        
        // Remove duplicates and limit to 8 topics
        const uniqueTopics = topics.filter((topic, index, self) => 
            index === self.findIndex(t => t.title === topic.title)
        ).slice(0, 8);
        
        return uniqueTopics;
    }

    /**
     * Generate exercises with separate question and answer generation
     */
    async generateExercises(files, exerciseType, questionCount = 5) {
        if (!files || files.length === 0) {
            throw new Error('No files to generate exercises from');
        }

        // First generate questions only
        window.fileHandler.showLoading(`AI is generating ${exerciseType} questions...`);

        let exercises;
        try {
            if (this.useRealAI && this.realAIHandler) {
                // Use real AI for questions only
                const content = files.map(f => f.content).join('\n\n---\n\n');
                exercises = await this.realAIHandler.generateQuestionsOnly(content, exerciseType, questionCount);
            } else {
                // Use simulated AI for questions only
                await this.delay(this.processingDelay);
                exercises = this.createExercises(files, exerciseType, questionCount);
            }
        } catch (error) {
            console.error('AI processing error:', error);
            // Fallback to simulated AI
            await this.delay(this.processingDelay);
            exercises = this.createExercises(files, exerciseType, questionCount);
            exercises = `*Note: Using simulated AI due to API error*\n\n${exercises}`;
        }

        const exerciseDocument = {
            id: storageManager.generateId(),
            title: `${this.capitalizeFirst(exerciseType)} Exercises - ${new Date().toLocaleDateString()}`,
            type: 'exercise',
            exerciseType: exerciseType,
            content: exercises,
            sourceFiles: files.map(f => ({ name: f.name, type: f.type })),
            aiType: this.useRealAI ? 'real' : 'simulated',
            createdAt: new Date().toISOString()
        };

        // Save exercise document
        storageManager.saveDocument(exerciseDocument);
        
        window.fileHandler.hideLoading();
        return { exercises: exerciseDocument };
    }

    /**
     * Generate solutions separately for existing exercises
     */
    async generateSolutions(exerciseDocument) {
        if (!exerciseDocument || exerciseDocument.type !== 'exercise') {
            throw new Error('Invalid exercise document');
        }

        window.fileHandler.showLoading(`AI is generating solutions...`);

        let solutions;
        try {
            if (this.useRealAI && this.realAIHandler) {
                // Use real AI for solutions
                const exerciseContent = exerciseDocument.content;
                const sourceContent = exerciseDocument.sourceFiles ? 
                    exerciseDocument.sourceFiles.map(f => f.content || '').join('\n\n---\n\n') : '';
                solutions = await this.realAIHandler.generateSolutionsOnly(exerciseContent, sourceContent, exerciseDocument.exerciseType);
            } else {
                // Use simulated AI for solutions
                await this.delay(this.processingDelay);
                solutions = this.createSolutions(exerciseDocument.content, exerciseDocument.exerciseType);
            }
        } catch (error) {
            console.error('AI processing error:', error);
            // Fallback to simulated AI
            await this.delay(this.processingDelay);
            solutions = this.createSolutions(exerciseDocument.content, exerciseDocument.exerciseType);
            solutions = `*Note: Using simulated AI due to API error*\n\n${solutions}`;
        }

        const solutionDocument = {
            id: storageManager.generateId(),
            title: `Solutions: ${exerciseDocument.title}`,
            type: 'solution',
            exerciseType: exerciseDocument.exerciseType,
            content: solutions,
            parentExerciseId: exerciseDocument.id,
            sourceFiles: exerciseDocument.sourceFiles,
            aiType: this.useRealAI ? 'real' : 'simulated',
            createdAt: new Date().toISOString()
        };

        // Save solution document
        storageManager.saveDocument(solutionDocument);
        
        window.fileHandler.hideLoading();
        return solutionDocument;
    }

    /**
     * Create exercises based on type
     */
    createExercises(files, exerciseType, questionCount) {
        let content = `# ${this.capitalizeFirst(exerciseType)} Exercises\n\n`;
        content += `*Generated from your study materials*\n\n`;
        content += `**Instructions**: Complete all questions to test your understanding of the material.\n\n`;

        switch (exerciseType) {
            case 'multiple-choice':
                content += this.generateMultipleChoiceQuestions(files, questionCount);
                break;
            case 'short-answer':
                content += this.generateShortAnswerQuestions(files, questionCount);
                break;
            case 'long-answer':
                content += this.generateLongAnswerQuestions(files, questionCount);
                break;
            case 'essay':
                content += this.generateEssayQuestions(files, questionCount);
                break;
        }

        return content;
    }

    /**
     * Generate multiple choice questions
     */
    generateMultipleChoiceQuestions(files, count) {
        let content = '';
        
        for (let i = 1; i <= count; i++) {
            content += `<div class="exercise-question">\n`;
            content += `<div class="question-number">Question ${i}</div>\n`;
            content += `<div class="question-text">Which of the following best describes the main concept discussed in the study materials?</div>\n`;
            content += `<div class="question-options">\n`;
            content += `<div class="option">A) A fundamental principle that requires memorization</div>\n`;
            content += `<div class="option">B) A complex theory with multiple interconnected components</div>\n`;
            content += `<div class="option correct">C) A practical concept that can be applied to solve real-world problems</div>\n`;
            content += `<div class="option">D) An abstract idea with limited practical applications</div>\n`;
            content += `</div>\n`;
            content += `</div>\n\n`;
        }
        
        return content;
    }

    /**
     * Generate short answer questions
     */
    generateShortAnswerQuestions(files, count) {
        let content = '';
        
        const questions = [
            'Define the key concept discussed in your study materials and explain its importance.',
            'List three main principles covered in the documents and briefly describe each.',
            'Explain how the concepts in your materials relate to real-world applications.',
            'Identify the most challenging aspect of the topic and suggest ways to understand it better.',
            'Describe the relationship between different concepts presented in the materials.',
            'What are the practical implications of the theories discussed in your documents?',
            'Summarize the main argument or thesis presented in the study materials.',
            'Explain why this topic is important for students in this field of study.'
        ];
        
        for (let i = 1; i <= count; i++) {
            const question = questions[Math.min(i - 1, questions.length - 1)];
            content += `<div class="exercise-question">\n`;
            content += `<div class="question-number">Question ${i}</div>\n`;
            content += `<div class="question-text">${question}</div>\n`;
            content += `<div class="answer-space">Write your answer here (2-3 sentences)...</div>\n`;
            content += `</div>\n\n`;
        }
        
        return content;
    }

    /**
     * Generate long answer questions
     */
    generateLongAnswerQuestions(files, count) {
        let content = '';
        
        const questions = [
            'Analyze the main concepts presented in your study materials. Discuss their significance and how they contribute to understanding the broader subject area.',
            'Compare and contrast different approaches or methodologies discussed in the documents. Evaluate their strengths and weaknesses.',
            'Examine the practical applications of the theories presented in your materials. Provide specific examples and explain their relevance.',
            'Critically evaluate the arguments presented in the study materials. Discuss any limitations or areas for further research.',
            'Synthesize information from all the documents to create a comprehensive understanding of the topic. Explain how different sources complement each other.'
        ];
        
        for (let i = 1; i <= Math.min(count, questions.length); i++) {
            content += `<div class="exercise-question">\n`;
            content += `<div class="question-number">Question ${i}</div>\n`;
            content += `<div class="question-text">${questions[i - 1]}</div>\n`;
            content += `<div class="answer-space">Write your detailed answer here (1-2 paragraphs)...</div>\n`;
            content += `</div>\n\n`;
        }
        
        return content;
    }

    /**
     * Generate essay questions
     */
    generateEssayQuestions(files, count) {
        let content = '';
        
        const questions = [
            'Write a comprehensive essay discussing the main themes and concepts presented in your study materials. Include an introduction, body paragraphs with supporting evidence, and a conclusion.',
            'Develop an argumentative essay that takes a position on one of the key issues discussed in the documents. Support your argument with evidence from the materials.',
            'Create an analytical essay that examines the relationships between different concepts in your study materials. Discuss how these relationships contribute to a deeper understanding of the subject.'
        ];
        
        for (let i = 1; i <= Math.min(count, questions.length); i++) {
            content += `<div class="exercise-question">\n`;
            content += `<div class="question-number">Essay Question ${i}</div>\n`;
            content += `<div class="question-text">${questions[i - 1]}</div>\n`;
            content += `<div class="answer-space">Write your essay here (minimum 500 words)...</div>\n`;
            content += `</div>\n\n`;
        }
        
        return content;
    }

    /**
     * Create solutions
     */
    createSolutions(exercises, exerciseType) {
        let content = `# Answer Key and Solutions\n\n`;
        content += `*Suggested answers for the ${exerciseType} exercises*\n\n`;
        
        switch (exerciseType) {
            case 'multiple-choice':
                content += this.generateMCAnswers();
                break;
            case 'short-answer':
                content += this.generateShortAnswers();
                break;
            case 'long-answer':
                content += this.generateLongAnswers();
                break;
            case 'essay':
                content += this.generateEssayGuidelines();
                break;
        }
        
        return content;
    }

    /**
     * Generate multiple choice answers
     */
    generateMCAnswers() {
        let content = '## Answer Key\n\n';
        content += 'Question 1: C) A practical concept that can be applied to solve real-world problems\n';
        content += 'Question 2: C) A practical concept that can be applied to solve real-world problems\n';
        content += 'Question 3: C) A practical concept that can be applied to solve real-world problems\n';
        content += 'Question 4: C) A practical concept that can be applied to solve real-world problems\n';
        content += 'Question 5: C) A practical concept that can be applied to solve real-world problems\n\n';
        
        content += '## Explanations\n\n';
        content += 'The correct answers emphasize the practical nature of the concepts discussed in your study materials. Understanding these concepts as practical tools rather than abstract theories will help you apply them effectively in real-world situations.\n\n';
        
        return content;
    }

    /**
     * Generate short answers
     */
    generateShortAnswers() {
        return '## Sample Answers\n\n' +
               'These are suggested answers. Your responses may vary while still being correct if they demonstrate understanding of the key concepts.\n\n' +
               '**Question 1**: The key concept represents a fundamental principle that helps students understand complex relationships within the subject matter. Its importance lies in providing a foundation for more advanced learning.\n\n' +
               '**Question 2**: The three main principles include foundational understanding, practical application, and critical analysis. Each contributes to a comprehensive grasp of the subject.\n\n' +
               '**Question 3**: The concepts relate to real-world applications by providing frameworks for problem-solving and decision-making in professional contexts.\n\n';
    }

    /**
     * Generate long answers
     */
    generateLongAnswers() {
        return '## Sample Responses\n\n' +
               'These are example responses that demonstrate the depth and analysis expected for long-answer questions.\n\n' +
               '**Question 1**: A comprehensive analysis should include identification of main concepts, discussion of their significance, and explanation of how they contribute to broader understanding. Students should demonstrate critical thinking and ability to synthesize information from multiple sources.\n\n' +
               '**Question 2**: Comparison should highlight similarities and differences between approaches, with evaluation of their respective strengths and limitations. Students should support their analysis with specific examples from the study materials.\n\n';
    }

    /**
     * Generate essay guidelines
     */
    generateEssayGuidelines() {
        return '## Essay Writing Guidelines\n\n' +
               '### Structure\n' +
               '- **Introduction**: Present your thesis and outline main points\n' +
               '- **Body Paragraphs**: Develop each point with evidence and analysis\n' +
               '- **Conclusion**: Summarize key arguments and restate thesis\n\n' +
               '### Evaluation Criteria\n' +
               '- Clear thesis statement and logical organization\n' +
               '- Use of evidence from study materials\n' +
               '- Critical analysis and original thinking\n' +
               '- Proper grammar and academic writing style\n\n' +
               '### Tips for Success\n' +
               '- Plan your essay before writing\n' +
               '- Use specific examples from the materials\n' +
               '- Demonstrate understanding of key concepts\n' +
               '- Proofread for clarity and coherence\n\n';
    }

    /**
     * Utility methods
     */
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global AI processor instance
window.aiProcessor = new AIProcessor();
