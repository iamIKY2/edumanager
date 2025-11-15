// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ GEMINI_API_KEY is not defined in environment variables');
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }
        try {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            console.log('✅ Gemini AI client initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Gemini client:', error);
            throw error;
        }
    }

    /**
     * Tạo prompt cho AI
     */
    createPrompt(subject, topic, numQuestions, difficulty, questionTypes, additionalRequirements) {
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
     * Parse response từ AI
     */
    parseAIResponse(text) {
        try {
            console.log('Raw AI response:', text.substring(0, 500)); // Log 500 ký tự đầu
            
            // Loại bỏ markdown code blocks nếu có
            let jsonText = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            // Tìm JSON object trong text
            const jsonStart = jsonText.indexOf('{');
            const jsonEnd = jsonText.lastIndexOf('}');
            
            if (jsonStart === -1 || jsonEnd === -1) {
                throw new Error('No JSON object found in response');
            }
            
            jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
            
            // Parse JSON
            const data = JSON.parse(jsonText);
            
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Invalid response format: questions array not found');
            }

            // Validate và chuẩn hóa dữ liệu
            const validatedQuestions = data.questions.map((q, index) => {
                // Kiểm tra các trường bắt buộc
                if (!q.questionText || !q.type || !q.correctAnswer) {
                    throw new Error(`Question ${index + 1} is missing required fields`);
                }

                // Validate type
                const validTypes = ['SingleChoice', 'MultipleChoice', 'FillInBlank', 'Essay'];
                if (!validTypes.includes(q.type)) {
                    throw new Error(`Question ${index + 1} has invalid type: ${q.type}`);
                }

                // Validate difficulty
                const validDifficulties = ['Easy', 'Medium', 'Hard'];
                if (q.difficulty && !validDifficulties.includes(q.difficulty)) {
                    q.difficulty = 'Medium'; // Default
                }

                // Validate options cho trắc nghiệm
                if ((q.type === 'SingleChoice' || q.type === 'MultipleChoice') && (!q.options || q.options.length < 2)) {
                    throw new Error(`Question ${index + 1} must have at least 2 options`);
                }

                // Đảm bảo có options array (rỗng cho FillInBlank và Essay)
                if (!q.options) {
                    q.options = [];
                }

                // Đảm bảo có points
                if (!q.points || q.points <= 0) {
                    q.points = 10;
                }

                return {
                    questionText: q.questionText.trim(),
                    type: q.type,
                    options: q.options,
                    correctAnswer: q.correctAnswer.trim(),
                    difficulty: q.difficulty || 'Medium',
                    points: q.points,
                    explanation: q.explanation || ''
                };
            });

            return validatedQuestions;
        } catch (error) {
            console.error('Parse error:', error);
            console.log('Full AI response:', text);
            throw new Error(`Failed to parse AI response: ${error.message}`);
        }
    }

    /**
     * Tạo đề thi với AI
     */
    async generateExam(examData) {
        try {
            const { subject, topic, numQuestions, difficulty, questionTypes, additionalRequirements } = examData;

            // Validate input
            if (!subject || !topic || !numQuestions || !difficulty || !questionTypes || questionTypes.length === 0) {
                throw new Error('Missing required fields');
            }

            if (numQuestions < 1 || numQuestions > 50) {
                throw new Error('Number of questions must be between 1 and 50');
            }

            // Tạo prompt
            const prompt = this.createPrompt(
                subject,
                topic,
                numQuestions,
                difficulty,
                questionTypes,
                additionalRequirements || ''
            );

            console.log('🤖 Generating exam with AI...');
            console.log('📚 Subject:', subject);
            console.log('📖 Topic:', topic);
            console.log('🔢 Num Questions:', numQuestions);

            // Lấy model Gemini - thử gemini-2.5-flash trước, fallback về gemini-1.5-flash nếu lỗi
            let model = this.genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash'
            });

            // Gọi Gemini API - thử với model mới trước
            let result, response, text;
            try {
                result = await model.generateContent(prompt);
                response = result.response;
                text = response.text();
            } catch (modelError) {
                // Nếu model không tồn tại hoặc có lỗi, thử với gemini-1.5-flash
                if (modelError.message && modelError.message.includes('model')) {
                    console.warn('⚠️ Model gemini-2.5-flash không khả dụng, sử dụng gemini-1.5-flash');
                    model = this.genAI.getGenerativeModel({ 
                        model: 'gemini-1.5-flash'
                    });
                    result = await model.generateContent(prompt);
                    response = result.response;
                    text = response.text();
                } else {
                    throw modelError;
                }
            }

            console.log('📥 AI Response received, length:', text.length);

            if (!text || text.trim().length === 0) {
                console.error('❌ No text found in AI response');
                throw new Error('AI returned empty response');
            }

            console.log('✅ AI Response received, parsing...');

            // Parse và validate
            const questions = this.parseAIResponse(text);

            console.log(`✅ Successfully generated ${questions.length} questions`);

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
            console.error('❌ Gemini Service Error:', error);
            throw new Error(`AI Generation failed: ${error.message}`);
        }
    }

    /**
     * Test connection với Gemini API
     */
    async testConnection() {
        try {
            console.log('🔍 Testing Gemini API connection...');
            
            // Thử sử dụng gemini-2.5-flash, fallback về gemini-1.5-flash nếu không có
            let model = this.genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash'
            });
            
            let result, response, text;
            try {
                result = await model.generateContent("Say 'Hello' in Vietnamese");
                response = result.response;
                text = response.text();
            } catch (modelError) {
                if (modelError.message && modelError.message.includes('model')) {
                    console.warn('⚠️ Model gemini-2.5-flash không khả dụng, sử dụng gemini-1.5-flash');
                    model = this.genAI.getGenerativeModel({ 
                        model: 'gemini-1.5-flash' 
                    });
                    result = await model.generateContent("Say 'Hello' in Vietnamese");
                    response = result.response;
                    text = response.text();
                } else {
                    throw modelError;
                }
            }
            
            console.log('✅ Gemini API connection successful');
            
            return {
                success: true,
                message: 'Connection successful',
                response: text
            };
        } catch (error) {
            console.error('❌ Gemini API connection failed:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
}

module.exports = new GeminiService();