// services/aiService.js - Service chung quản lý cả Groq và Gemini
const groqService = require('./groqService');
const geminiService = require('./geminiService');

class AIService {
    constructor() {
        this.providers = {
            groq: groqService,
            gemini: geminiService
        };
        this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'groq';
    }

    /**
     * Tạo câu hỏi từ tài liệu với model được chọn
     */
    async generateQuestionsFromDocument(documentContent, studentPrompt, options = {}) {
        const provider = options.provider || this.defaultProvider;
        
        if (!this.providers[provider]) {
            throw new Error(`Invalid AI provider: ${provider}. Available: groq, gemini`);
        }

        const providerService = this.providers[provider];
        
        // Kiểm tra provider có enabled không
        if (provider === 'groq' && !providerService.enabled) {
            console.warn('⚠️ Groq not enabled, falling back to Gemini');
            return this.generateQuestionsFromDocument(documentContent, studentPrompt, {
                ...options,
                provider: 'gemini'
            });
        }

        try {
            console.log(`🤖 [${provider.toUpperCase()}] Generating questions...`);
            
            if (provider === 'groq') {
                return await providerService.generateQuestionsFromDocument(
                    documentContent,
                    studentPrompt,
                    options
                );
            } else {
                // Gemini cần format khác
                return await this.generateWithGemini(documentContent, studentPrompt, options);
            }
        } catch (error) {
            console.error(`❌ [${provider.toUpperCase()}] Error:`, error.message);
            
            // Fallback sang provider khác nếu có lỗi
            if (options.provider && options.provider !== this.defaultProvider) {
                const fallbackProvider = options.provider === 'groq' ? 'gemini' : 'groq';
                console.warn(`⚠️ Falling back to ${fallbackProvider}...`);
                return this.generateQuestionsFromDocument(documentContent, studentPrompt, {
                    ...options,
                    provider: fallbackProvider
                });
            }
            
            throw error;
        }
    }

    /**
     * Generate với Gemini (cần adapt format)
     */
    async generateWithGemini(documentContent, studentPrompt, options) {
        // Tạo prompt tương tự Groq
        const prompt = this.createPromptForGemini(documentContent, studentPrompt, options);
        
        try {
            if (!geminiService.genAI) {
                throw new Error('Gemini service is not initialized');
            }
            
            const model = geminiService.genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash'
            });
            
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            
            // Parse response
            let jsonText = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            const jsonStart = jsonText.indexOf('{');
            const jsonEnd = jsonText.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No JSON object found in Gemini response');
            }
            
            jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
            const data = JSON.parse(jsonText);
            
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Invalid response format: missing questions array');
            }
            
            // Format questions giống Groq
            return groqService.formatQuestions(data.questions, options);
            
        } catch (error) {
            console.error('❌ Gemini generation error:', error);
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    }

    /**
     * Tạo prompt cho Gemini
     */
    createPromptForGemini(documentContent, studentPrompt, options) {
        const {
            numberOfQuestions = 10,
            questionType = 'SingleChoice',
            difficulty = 'Medium'
        } = options;

        let processedDoc = documentContent;
        if (documentContent.length > 5000) {
            processedDoc = 
                documentContent.substring(0, 2500) + 
                "\n\n[...phần giữa đã được rút gọn...]\n\n" +
                documentContent.substring(documentContent.length - 2500);
        }

        const difficultyText = {
            'Easy': 'dễ',
            'Medium': 'trung bình',
            'Hard': 'khó',
            'easy': 'dễ',
            'medium': 'trung bình',
            'hard': 'khó'
        };

        const typeMapping = {
            'SingleChoice': 'Trắc nghiệm 1 đáp án đúng',
            'MultipleChoice': 'Trắc nghiệm nhiều đáp án đúng',
            'FillInBlank': 'Điền vào chỗ trống',
            'Essay': 'Tự luận'
        };

        return `Từ tài liệu sau, tạo ${numberOfQuestions} câu hỏi ${typeMapping[questionType] || questionType} độ khó ${difficultyText[difficulty] || difficulty}:

TÀI LIỆU:
${processedDoc}

YÊU CẦU HỌC SINH:
${studentPrompt}

Trả về JSON với cấu trúc:
{
  "questions": [
    {
      "question_content": "Nội dung câu hỏi",
      "question_type": "${questionType}",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correct_answer": "A",
      "difficulty": "${difficulty}",
      "points": 1,
      "explanation": "Giải thích"
    }
  ]
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ MARKDOWN!`;
    }

    /**
     * Test connection với provider
     */
    async testConnection(provider = null) {
        const testProvider = provider || this.defaultProvider;
        
        if (!this.providers[testProvider]) {
            return { success: false, message: `Invalid provider: ${testProvider}` };
        }

        const providerService = this.providers[testProvider];
        
        if (testProvider === 'groq') {
            if (!providerService.enabled) {
                return { success: false, message: 'Groq service is not enabled' };
            }
            return await providerService.testConnection();
        } else {
            return await geminiService.testConnection();
        }
    }

    /**
     * Kiểm tra provider có available không
     */
    isProviderAvailable(provider) {
        if (provider === 'groq') {
            return groqService.enabled;
        } else if (provider === 'gemini') {
            return !!process.env.GEMINI_API_KEY;
        }
        return false;
    }
}

module.exports = new AIService();

