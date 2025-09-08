/**
 * Real AI API Handler for OpenRouter Integration
 * This file handles actual AI API calls for testing purposes
 */

class RealAIHandler {
    constructor() {
        // Initialize from localStorage if available; fallback to placeholders
        const savedKey = localStorage.getItem('openrouter_api_key');
        const savedModel = localStorage.getItem('openrouter_model') || 'google/gemini-2.5-pro';

        this.apiKey = savedKey || 'YOUR_OPENROUTER_API_KEY';
        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        this.model = savedModel;
        this.siteUrl = 'http://localhost'; // Your site URL
        this.siteName = 'AI E-Learning Platform'; // Your site name
    }

    /**
     * Make API call to OpenRouter
     * @param {Array} messages - Array of message objects
     * @returns {Promise<string>} - AI response
     */
    async makeAPICall(messages) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': this.siteUrl,
                    'X-Title': this.siteName,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('AI API Error:', error);
            throw new Error(`AI API call failed: ${error.message}`);
        }
    }

    /**
     * Summarize documents with real AI
     * @param {Array} documents - Array of document objects with content and filename
     * @returns {Promise<string>} - Summarized content
     */
    async summarizeDocuments(documents) {
        const documentTexts = documents.map(doc => 
            `Document: ${doc.filename}\nContent: ${doc.content}`
        ).join('\n\n---\n\n');

        const messages = [{
            role: 'user',
            content: `Please summarize the following documents for a Hong Kong student. Provide a comprehensive summary that captures the key points from all documents. If there are multiple documents, please cite which document each point comes from using the format [Document: filename].

Documents to summarize:
${documentTexts}

Please provide a well-structured summary that a student can use to understand the main concepts and key points from all the uploaded materials.`
        }];

        return await this.makeAPICall(messages);
    }

    /**
     * Explain content with real AI
     * @param {string} content - Content to explain
     * @param {string} selectedText - Specific text selected for explanation (optional)
     * @returns {Promise<string>} - Explanation
     */
    async explainContent(content, selectedText = null) {
        let prompt;
        
        if (selectedText) {
            prompt = `Please explain the following selected text to a Hong Kong student who is learning this topic for the first time. Assume they have no prior knowledge of this subject and explain it in simple, clear terms with examples if helpful.

Selected text to explain: "${selectedText}"

Context (full document): ${content.substring(0, 1000)}...

Please provide a clear, beginner-friendly explanation.`;
        } else {
            prompt = `Please explain the following content to a Hong Kong student who is learning this topic for the first time. Break it down into main topics and explain each one clearly. Assume they have no prior knowledge of this subject.

Content to explain: ${content}

Please provide a structured explanation with clear headings for each main topic.`;
        }

        const messages = [{
            role: 'user',
            content: prompt
        }];

        return await this.makeAPICall(messages);
    }

    /**
     * Generate exercises with real AI
     * @param {string} content - Content to generate exercises from
     * @param {string} questionType - Type of questions (MC, Short, Long, Essay)
     * @returns {Promise<Object>} - Object with questions and solutions
     */
    async generateExercises(content, questionType) {
        const typeInstructions = {
            'MC': 'multiple choice questions with 4 options each',
            'Short': 'short answer questions that can be answered in 1-2 sentences',
            'Long': 'long answer questions requiring detailed explanations',
            'Essay': 'essay questions requiring comprehensive analysis'
        };

        const instruction = typeInstructions[questionType] || 'mixed question types';

        const messages = [{
            role: 'user',
            content: `Based on the following content, generate practice exercises for a Hong Kong student. Create ${instruction}.

Content: ${content}

Please provide:
1. A set of questions (5-8 questions)
2. Complete solutions/answers for each question

Format the response as:
QUESTIONS:
[List all questions here]

SOLUTIONS:
[Provide detailed solutions for each question]

Make sure the questions test understanding of the key concepts and are appropriate for the student's learning level.`
        }];

        const response = await this.makeAPICall(messages);
        
        // Split the response into questions and solutions
        const parts = response.split('SOLUTIONS:');
        const questions = parts[0].replace('QUESTIONS:', '').trim();
        const solutions = parts[1] ? parts[1].trim() : 'Solutions not properly formatted';

        return {
            questions: questions,
            solutions: solutions
        };
    }

    /**
     * Handle follow-up questions with real AI
     * @param {string} selectedText - Text that was selected
     * @param {string} question - User's follow-up question
     * @param {string} context - Document context
     * @returns {Promise<string>} - AI response
     */
    async handleFollowUpQuestion(selectedText, question, context) {
        const messages = [{
            role: 'user',
            content: `A Hong Kong student has selected this text: "${selectedText}" and asked: "${question}"

Document context: ${context.substring(0, 800)}...

Please provide a helpful answer to their question, keeping in mind they are learning this material. Be clear and educational in your response.`
        }];

        return await this.makeAPICall(messages);
    }

    /**
     * Check if API key is configured
     * @returns {boolean} - True if API key is set
     */
    isConfigured() {
        return this.apiKey && this.apiKey !== 'YOUR_OPENROUTER_API_KEY';
    }

    /**
     * Set API key
     * @param {string} apiKey - OpenRouter API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        // persist for future sessions
        try { localStorage.setItem('openrouter_api_key', apiKey); } catch (_) {}
    }

    /**
     * Set model id and persist
     * @param {string} modelId
     */
    setModel(modelId) {
        if (modelId && typeof modelId === 'string') {
            this.model = modelId;
            try { localStorage.setItem('openrouter_model', modelId); } catch (_) {}
        }
    }
}

// Export for use in other modules
window.RealAIHandler = RealAIHandler;
