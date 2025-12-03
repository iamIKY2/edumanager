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
        
        // Log để debug
        console.log(`📄 [Gemini] Document content length: ${documentContent.length} chars`);
        console.log(`💬 [Gemini] Student prompt: ${studentPrompt}`);
        console.log(`📋 [Gemini] Prompt preview (first 1000 chars): ${prompt.substring(0, 1000)}...`);
        
        try {
            if (!geminiService.genAI) {
                throw new Error('Gemini service is not initialized');
            }
            
            console.log('🤖 [Gemini] Generating questions...');
            const model = geminiService.genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash'
            });
            
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            
            console.log('✅ [Gemini] Response received');
            console.log(`📥 [Gemini] Response preview (first 500 chars): ${text.substring(0, 500)}...`);
            
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

        return `BẠN LÀ MỘT CHUYÊN GIA GIÁO DỤC. NHIỆM VỤ CỦA BẠN LÀ TẠO CÂU HỎI TỪ NỘI DUNG TÀI LIỆU ĐƯỢC CUNG CẤP DƯỚI ĐÂY.

⚠️ QUAN TRỌNG: 
- BẠN PHẢI ĐỌC KỸ NỘI DUNG TÀI LIỆU
- TẤT CẢ CÂU HỎI PHẢI DỰA TRÊN NỘI DUNG THỰC TẾ TRONG TÀI LIỆU
- KHÔNG ĐƯỢC TẠO CÂU HỎI CHUNG CHUNG HOẶC PLACEHOLDER
- MỖI CÂU HỎI PHẢI LIÊN QUAN ĐẾN KIẾN THỨC CỤ THỂ TRONG TÀI LIỆU

TÀI LIỆU NGUỒN:
${processedDoc}

YÊU CẦU CỦA HỌC SINH:
${studentPrompt}

NHIỆM VỤ: Tạo ${numberOfQuestions} câu hỏi ${typeMapping[questionType] || questionType} độ khó ${difficultyText[difficulty] || difficulty} DỰA TRÊN NỘI DUNG TÀI LIỆU TRÊN.

CẤU TRÚC JSON (CHỈ LÀ VÍ DỤ VỀ FORMAT, KHÔNG COPY NỘI DUNG):
{
  "questions": [
    {
      "question_content": "[Câu hỏi cụ thể về nội dung trong tài liệu, ví dụ: 'Trong C#, từ khóa nào được dùng để khai báo biến?']",
      "question_type": "${questionType}",
      "options": [
        "A. [Đáp án cụ thể từ tài liệu]",
        "B. [Đáp án cụ thể từ tài liệu]", 
        "C. [Đáp án cụ thể từ tài liệu]",
        "D. [Đáp án cụ thể từ tài liệu]"
      ],
      "correct_answer": "A",
      "difficulty": "${difficulty}",
      "points": 1,
      "explanation": "[Giải thích dựa trên nội dung tài liệu]"
    }
  ]
}

QUY ĐỊNH:
- Với SingleChoice: correct_answer là 1 chữ cái (A, B, C, D)
- Với MultipleChoice: correct_answer là nhiều chữ cái cách nhau dấu phẩy (A,B,C)
- Với FillInBlank/Essay: options là mảng rỗng [], correct_answer là đáp án đúng
- Câu hỏi PHẢI dựa trên nội dung thực tế trong tài liệu
- Đáp án phải chính xác theo nội dung tài liệu
- Đáp án sai phải hợp lý, liên quan đến chủ đề nhưng không đúng

LƯU Ý: 
- ĐỌC KỸ TÀI LIỆU TRƯỚC KHI TẠO CÂU HỎI
- MỖI CÂU HỎI PHẢI CÓ THỂ TÌM THẤY THÔNG TIN TRẢ LỜI TRONG TÀI LIỆU
- KHÔNG TẠO CÂU HỎI CHUNG CHUNG NHƯ "Nội dung câu hỏi" HOẶC "Đáp án 1"

CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC!`;
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

