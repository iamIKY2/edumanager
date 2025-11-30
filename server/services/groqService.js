// services/groqService.js
const Groq = require('groq-sdk');

class GroqService {
    constructor() {
        if (!process.env.GROQ_API_KEY) {
            console.warn('⚠️ GROQ_API_KEY is not defined, Groq service will be disabled');
            this.enabled = false;
            return;
        }
        
        try {
            this.groq = new Groq({
                apiKey: process.env.GROQ_API_KEY
            });
            this.enabled = true;
            console.log('✅ Groq AI client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Groq client:', error);
            this.enabled = false;
        }
    }

    /**
     * Tạo câu hỏi từ tài liệu
     */
    async generateQuestionsFromDocument(documentContent, studentPrompt, options = {}) {
        if (!this.enabled) {
            throw new Error('Groq service is not enabled. Please check GROQ_API_KEY.');
        }

        const prompt = this.createPrompt(documentContent, studentPrompt, options);
        
        try {
            console.log('🤖 [Groq] Generating questions...');
            
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: `Bạn là một chuyên gia giáo dục xuất sắc. Nhiệm vụ của bạn là tạo câu hỏi từ tài liệu được cung cấp.
                        
QUAN TRỌNG:
- Trả về KẾT QUẢ DƯỚI DẠNG JSON HỢP LỆ
- KHÔNG có markdown, KHÔNG có giải thích thêm
- Chỉ trả về JSON object với cấu trúc đúng`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: options.model || 'llama-3.1-8b-instant',
                temperature: 0.7,
                max_tokens: 4000,
                response_format: { type: 'json_object' }
            });
            
            const responseText = completion.choices[0].message.content;
            console.log('✅ [Groq] Response received');
            
            // Parse JSON response
            let response;
            try {
                response = JSON.parse(responseText);
            } catch (parseError) {
                // Nếu có markdown code block, extract JSON
                const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                  responseText.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    response = JSON.parse(jsonMatch[1]);
                } else {
                    throw new Error('Invalid JSON response from Groq');
                }
            }
            
            // Validate và format questions
            if (!response.questions || !Array.isArray(response.questions)) {
                throw new Error('Invalid response format: missing questions array');
            }
            
            return this.formatQuestions(response.questions, options);
            
        } catch (error) {
            console.error('❌ [Groq] Error generating questions:', error);
            throw new Error(`Groq API Error: ${error.message}`);
        }
    }

    /**
     * Tạo prompt cho AI
     */
    createPrompt(documentContent, studentPrompt, options) {
        const {
            numberOfQuestions = 10,
            questionType = 'SingleChoice',
            difficulty = 'Medium'
        } = options;

        // Rút gọn document nếu quá dài (giới hạn ~5000 ký tự)
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

CẤU TRÚC JSON YÊU CẦU:
{
  "questions": [
    {
      "question_content": "Nội dung câu hỏi rõ ràng và chính xác",
      "question_type": "${questionType}",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correct_answer": "A",
      "difficulty": "${difficulty}",
      "points": 1,
      "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng"
    }
  ]
}

QUY ĐỊNH:
- Với SingleChoice: correct_answer là 1 chữ cái (A, B, C, D)
- Với MultipleChoice: correct_answer là nhiều chữ cái cách nhau dấu phẩy (A,B,C)
- Với FillInBlank/Essay: options là mảng rỗng [], correct_answer là đáp án đúng
- Câu hỏi phải chính xác về mặt học thuật
- Đáp án sai phải hợp lý, không quá dễ loại trừ

CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC!`;
    }

    /**
     * Format questions từ AI response
     */
    formatQuestions(questions, options) {
        return questions.map((q, index) => {
            // Validate required fields
            if (!q.question_content) {
                throw new Error(`Question ${index + 1} missing question_content`);
            }

            const formatted = {
                question_content: q.question_content.trim(),
                question_type: q.question_type || options.questionType || 'SingleChoice',
                difficulty: q.difficulty || options.difficulty || 'Medium',
                points: parseFloat(q.points) || 1,
                correct_answer_text: q.explanation || q.correct_answer_text || '',
                options: []
            };

            // Format options cho trắc nghiệm
            if (['SingleChoice', 'MultipleChoice'].includes(formatted.question_type)) {
                if (q.options && Array.isArray(q.options)) {
                    formatted.options = q.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const content = typeof opt === 'string' ? opt : opt.content || opt;
                        const isCorrect = this.isCorrectAnswer(letter, q.correct_answer);
                        
                        return {
                            option_content: content.replace(/^[A-Z]\.\s*/, '').trim(),
                            is_correct: isCorrect ? 1 : 0,
                            option_order: i
                        };
                    });
                }
            }

            // Validate có đáp án đúng
            if (['SingleChoice', 'MultipleChoice'].includes(formatted.question_type)) {
                const hasCorrect = formatted.options.some(opt => opt.is_correct === 1);
                if (!hasCorrect) {
                    console.warn(`⚠️ Question ${index + 1} has no correct answer, marking first as correct`);
                    if (formatted.options.length > 0) {
                        formatted.options[0].is_correct = 1;
                    }
                }
            }

            return formatted;
        });
    }

    /**
     * Kiểm tra xem option có phải đáp án đúng không
     */
    isCorrectAnswer(letter, correctAnswer) {
        if (!correctAnswer) return false;
        
        const correctAnswers = correctAnswer.toString()
            .toUpperCase()
            .split(',')
            .map(a => a.trim());
        
        return correctAnswers.includes(letter.toUpperCase());
    }

    /**
     * Test connection
     */
    async testConnection() {
        if (!this.enabled) {
            return { success: false, message: 'Groq service is not enabled' };
        }

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: 'Say "Hello" if you can read this.'
                    }
                ],
                model: 'llama-3.1-8b-instant',
                max_tokens: 10
            });

            return {
                success: true,
                message: 'Groq API connection successful',
                response: completion.choices[0].message.content
            };
        } catch (error) {
            return {
                success: false,
                message: `Groq API connection failed: ${error.message}`
            };
        }
    }
}

module.exports = new GroqService();

