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
        
        // Log để debug
        console.log(`📄 [Groq] Document content length: ${documentContent.length} chars`);
        console.log(`💬 [Groq] Student prompt: ${studentPrompt}`);
        console.log(`📋 [Groq] Prompt preview (first 1000 chars): ${prompt.substring(0, 1000)}...`);
        
        try {
            console.log('🤖 [Groq] Generating questions...');
            
            // Thử các model theo thứ tự ưu tiên
            const models = [
                'llama-3.3-70b-versatile',
                'llama-3.1-8b-instant',
                'mixtral-8x7b-32768'
            ];
            
            let completion;
            let lastError = null;
            const modelToUse = options.model || models[0];
            
            for (const modelName of models) {
                if (options.model && modelName !== options.model) continue;
                
                try {
                    completion = await this.groq.chat.completions.create({
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
                        model: modelName,
                        temperature: 0.7,
                        max_tokens: 4000,
                        response_format: { type: 'json_object' }
                    });
                    break; // Thành công
                } catch (modelError) {
                    lastError = modelError;
                    continue;
                }
            }
            
            if (!completion) {
                throw lastError || new Error('Không thể tìm thấy model Groq khả dụng');
            }
            
            const responseText = completion.choices[0].message.content;
            console.log('✅ [Groq] Response received');
            console.log(`📥 [Groq] Response preview (first 500 chars): ${responseText.substring(0, 500)}...`);
            
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
- KHÔNG TẠO CÂU HỎI CHUNG CHUNG NHƯ "Nội dung câu hỏi rõ ràng" HOẶC "Đáp án 1"

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
                correct_answer_text: q.explanation || q.correct_answer_text || q.correct_answer || '',
                options: []
            };
            
            // Với Essay/FillInBlank, đảm bảo có correct_answer_text
            if (['Essay', 'FillInBlank'].includes(formatted.question_type)) {
                if (!formatted.correct_answer_text || formatted.correct_answer_text.trim().length === 0) {
                    // Nếu không có explanation, tạo một đáp án mẫu dựa trên câu hỏi
                    formatted.correct_answer_text = `Đáp án mẫu cho câu hỏi: ${formatted.question_content.substring(0, 100)}...`;
                    console.warn(`⚠️ Question ${index + 1} (${formatted.question_type}) missing correct_answer_text, using placeholder`);
                }
            }

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
     * Tạo đề thi với AI (tương tự Gemini)
     */
    async generateExam(examData) {
        if (!this.enabled) {
            throw new Error('Groq service is not enabled. Please check GROQ_API_KEY.');
        }

        try {
            const { subject, topic, numQuestions, difficulty, questionTypes, additionalRequirements } = examData;

            // Validate input
            if (!subject || !topic || !numQuestions || !difficulty || !questionTypes || questionTypes.length === 0) {
                throw new Error('Missing required fields');
            }

            if (numQuestions < 1 || numQuestions > 50) {
                throw new Error('Number of questions must be between 1 and 50');
            }

            // Tạo prompt tương tự Gemini
            const prompt = this.createExamPrompt(
                subject,
                topic,
                numQuestions,
                difficulty,
                questionTypes,
                additionalRequirements || ''
            );

            console.log('🤖 [Groq] Generating exam...');
            console.log('📚 Subject:', subject);
            console.log('📖 Topic:', topic);
            console.log('🔢 Num Questions:', numQuestions);

            // Gọi Groq API - sử dụng model mới nhất
            // Thử các model theo thứ tự ưu tiên (model mới nhất)
            const models = [
                'llama-3.3-70b-versatile',
                'llama-3.1-8b-instant',
                'mixtral-8x7b-32768',
                'llama-3.2-90b-text-preview'
            ];
            
            let completion;
            let lastError = null;
            
            for (const modelName of models) {
                try {
                    console.log(`🔄 [Groq] Thử model: ${modelName}`);
                    completion = await this.groq.chat.completions.create({
                        messages: [
                            {
                                role: 'system',
                                content: 'Bạn là một chuyên gia giáo dục xuất sắc. Trả về KẾT QUẢ DƯỚI DẠNG JSON HỢP LỆ, KHÔNG có markdown, KHÔNG có giải thích thêm.'
                            },
                            {
                                role: 'user',
                                content: prompt
                            }
                        ],
                        model: modelName,
                        temperature: 0.7,
                        max_tokens: 8000,
                        response_format: { type: 'json_object' }
                    });
                    console.log(`✅ [Groq] Thành công với model: ${modelName}`);
                    break; // Thành công, thoát khỏi vòng lặp
                } catch (modelError) {
                    console.warn(`⚠️ [Groq] Model ${modelName} không khả dụng:`, modelError.message);
                    lastError = modelError;
                    // Tiếp tục thử model tiếp theo
                }
            }
            
            if (!completion) {
                throw lastError || new Error('Không thể tìm thấy model Groq khả dụng');
            }

            const responseText = completion.choices[0].message.content;
            console.log('📥 [Groq] AI Response received, length:', responseText.length);

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

            // Format questions giống Gemini format
            const questions = response.questions.map((q, index) => {
                if (!q.questionText && !q.question_content) {
                    throw new Error(`Question ${index + 1} is missing questionText`);
                }

                const questionText = q.questionText || q.question_content;
                const type = q.type || q.question_type;
                const correctAnswer = q.correctAnswer || q.correct_answer;
                const options = q.options || [];

                return {
                    questionText: questionText.trim(),
                    type: type,
                    options: options,
                    correctAnswer: correctAnswer ? correctAnswer.toString().trim() : '',
                    difficulty: q.difficulty || 'Medium',
                    points: q.points || 10,
                    explanation: q.explanation || ''
                };
            });

            console.log(`✅ [Groq] Successfully generated ${questions.length} questions`);

            return {
                success: true,
                questions: questions,
                metadata: {
                    subject,
                    topic,
                    difficulty,
                    totalQuestions: questions.length,
                    totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            console.error('❌ [Groq] Service Error:', error);
            throw new Error(`AI Generation failed: ${error.message}`);
        }
    }

    /**
     * Tạo prompt cho đề thi (tương tự Gemini)
     */
    createExamPrompt(subject, topic, numQuestions, difficulty, questionTypes, additionalRequirements) {
        const difficultyText = {
            'easy': 'dễ',
            'medium': 'trung bình',
            'hard': 'khó',
            'mixed': 'hỗn hợp (có cả dễ, trung bình và khó)'
        };

        const typeMapping = {
            'SingleChoice': 'Trắc nghiệm 1 đáp án đúng',
            'MultipleChoice': 'Trắc nghiệm nhiều đáp án đúng',
            'FillInBlank': 'Điền vào chỗ trống',
            'Essay': 'Tự luận'
        };

        const typesText = questionTypes.map(t => typeMapping[t] || t).join(', ');

        return `Bạn là một chuyên gia giáo dục xuất sắc. Hãy tạo một đề thi chất lượng cao với các yêu cầu sau:

**THÔNG TIN ĐỀ THI:**
- Môn học: ${subject}
- Chủ đề: ${topic}
- Số lượng câu hỏi: ${numQuestions}
- Độ khó: ${difficultyText[difficulty] || difficulty}
- Loại câu hỏi: ${typesText}
${additionalRequirements ? `- Yêu cầu bổ sung: ${additionalRequirements}` : ''}

**QUY ĐỊNH QUAN TRỌNG:**
1. Trả về KẾT QUẢ DƯỚI DẠNG JSON HỢP LỆ (KHÔNG có markdown, KHÔNG có giải thích)
2. Câu hỏi phải chính xác về mặt học thuật
3. Đáp án phải rõ ràng và không gây nhầm lẫn
4. Phân bổ độ khó hợp lý nếu là "hỗn hợp"
5. Với trắc nghiệm, các đáp án sai phải hợp lý (không quá dễ loại trừ)

**CẤU TRÚC JSON YÊU CẦU:**

{
  "questions": [
    {
      "questionText": "Nội dung câu hỏi chính xác và rõ ràng",
      "type": "SingleChoice hoặc MultipleChoice hoặc FillInBlank hoặc Essay",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "correctAnswer": "A",
      "difficulty": "Easy hoặc Medium hoặc Hard",
      "points": 10,
      "explanation": "Giải thích ngắn gọn tại sao đáp án này đúng (tùy chọn)"
    }
  ]
}

**CHI TIẾT THEO TỪNG LOẠI CÂU HỎI:**

1. **SingleChoice** (Trắc nghiệm 1 đáp án):
   - options: Mảng 4 đáp án ["A. ...", "B. ...", "C. ...", "D. ..."]
   - correctAnswer: Một chữ cái (VD: "B")

2. **MultipleChoice** (Trắc nghiệm nhiều đáp án):
   - options: Mảng 4 đáp án ["A. ...", "B. ...", "C. ...", "D. ..."]
   - correctAnswer: Nhiều chữ cái cách nhau bởi dấu phẩy (VD: "A,C,D")

3. **FillInBlank** (Điền vào chỗ trống):
   - options: [] (mảng rỗng)
   - correctAnswer: Đáp án đúng (VD: "H2O", "1945", "photosynthesis")

4. **Essay** (Tự luận):
   - options: [] (mảng rỗng)
   - correctAnswer: Gợi ý câu trả lời mẫu hoặc các điểm chính cần có

**LƯU Ý:**
- Độ khó "Easy": Kiến thức cơ bản, nhận biết
- Độ khó "Medium": Hiểu và vận dụng
- Độ khó "Hard": Vận dụng cao, phân tích, tổng hợp
- Điểm mỗi câu có thể khác nhau tùy độ khó (Easy: 5-10đ, Medium: 10-15đ, Hard: 15-20đ)
- Với độ khó "mixed": Phân bổ 30% Easy, 50% Medium, 20% Hard

CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ TEXT NÀO KHÁC!`;
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

