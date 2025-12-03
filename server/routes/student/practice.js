// routes/student/practice.js - API cho học sinh tạo đề luyện tập
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const aiService = require('../../services/aiService');
const fileExtractor = require('../../utils/fileExtractor');
const fs = require('fs').promises;
const path = require('path');

// ============================================
// GET /api/student/practice/materials - Lấy danh sách tài liệu của lớp
// ============================================
router.get('/materials', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const studentId = req.user.id || req.user.user_id;
    
    // Lấy các lớp học sinh tham gia
    const [classes] = await req.db.query(
      `SELECT DISTINCT c.class_id 
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.class_id
       WHERE cs.student_id = ?`,
      [studentId]
    );
    
    if (classes.length === 0) {
      return res.json({ materials: [] });
    }
    
    const classIds = classes.map(c => c.class_id);
    const placeholders = classIds.map(() => '?').join(',');
    
    // Lấy tất cả tài liệu từ các lớp (PDF, Word, Excel, PowerPoint, Text, v.v.)
    const [materials] = await req.db.query(
      `SELECT 
        m.material_id,
        m.title,
        m.description,
        m.file_name,
        m.file_type,
        m.file_size,
        m.upload_date,
        u.full_name as teacher_name,
        c.class_name,
        COALESCE(mc.word_count, 0) as word_count,
        CASE 
          WHEN mc.word_count IS NULL OR mc.word_count = 0 THEN 0
          -- Tính số câu hỏi ước tính dựa trên word_count (khoảng 50-100 từ/câu)
          -- Cho phép tạo nhiều câu hỏi từ file dài
          WHEN mc.word_count < 200 THEN 5
          WHEN mc.word_count < 500 THEN 10
          WHEN mc.word_count < 1000 THEN 20
          WHEN mc.word_count < 2000 THEN 30
          WHEN mc.word_count < 5000 THEN 50
          WHEN mc.word_count < 10000 THEN 80
          ELSE LEAST(200, FLOOR(mc.word_count / 50))
        END as estimated_questions
       FROM materials m
       JOIN classes c ON m.class_id = c.class_id
       JOIN users u ON m.teacher_id = u.user_id
       LEFT JOIN material_cache mc ON m.material_id = mc.material_id
       WHERE m.class_id IN (${placeholders})
       ORDER BY m.upload_date DESC`,
      classIds
    );
    
    res.json({ materials });
  } catch (error) {
    console.error('❌ Error getting materials:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách tài liệu', details: error.message });
  }
});

// ============================================
// POST /api/student/practice/materials/:materialId/re-extract - Extract lại file (xóa cache và extract lại)
// ============================================
router.post('/materials/:materialId/re-extract', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { materialId } = req.params;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền truy cập
    const [material] = await req.db.query(
      `SELECT m.*, c.class_id
       FROM materials m
       JOIN classes c ON m.class_id = c.class_id
       JOIN class_students cs ON c.class_id = cs.class_id
       WHERE m.material_id = ? AND cs.student_id = ?`,
      [materialId, studentId]
    );
    
    if (material.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập tài liệu này' });
    }
    
    const materialData = material[0];
    
    // Xóa cache cũ
    await req.db.query('DELETE FROM material_cache WHERE material_id = ?', [materialId]);
    console.log(`🗑️ [Practice] Deleted cache for material ${materialId}`);
    
    // Extract lại
    try {
      console.log(`📄 [Practice] Re-extracting file: ${materialData.file_path} (${materialData.file_type})`);
      const documentContent = await fileExtractor.extractText(materialData.file_path, materialData.file_type);
      
      console.log(`✅ [Practice] Re-extracted ${documentContent.length} characters`);
      console.log(`📄 [Practice] Content preview (first 1000 chars): ${documentContent.substring(0, 1000)}...`);
      
      if (!documentContent || documentContent.trim().length < 50) {
        return res.status(400).json({ 
          error: 'File không chứa text hoặc quá ngắn',
          content_length: documentContent?.length || 0,
          preview: documentContent?.substring(0, 200) || ''
        });
      }
      
      // Cache lại
      const wordCount = documentContent.split(/\s+/).length;
      await req.db.query(
        `INSERT INTO material_cache (material_id, extracted_content, word_count)
         VALUES (?, ?, ?)`,
        [materialId, documentContent, wordCount]
      );
      
      res.json({
        success: true,
        content_length: documentContent.length,
        word_count: wordCount,
        preview: documentContent.substring(0, 500),
        message: 'Extract lại thành công'
      });
    } catch (err) {
      console.error(`❌ [Practice] Re-extract error:`, err);
      return res.status(400).json({ 
        error: `Không thể extract file: ${err.message}`,
        details: err.message
      });
    }
  } catch (error) {
    console.error('❌ Error re-extracting material:', error);
    res.status(500).json({ error: 'Lỗi khi extract lại file', details: error.message });
  }
});

// ============================================
// GET /api/student/practice/materials/:materialId/preview - Xem trước tài liệu
// ============================================
router.get('/materials/:materialId/preview', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { materialId } = req.params;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền truy cập
    const [material] = await req.db.query(
      `SELECT m.*, c.class_id
       FROM materials m
       JOIN classes c ON m.class_id = c.class_id
       JOIN class_students cs ON c.class_id = cs.class_id
       WHERE m.material_id = ? AND cs.student_id = ?`,
      [materialId, studentId]
    );
    
    if (material.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập tài liệu này' });
    }
    
    // Kiểm tra cache
    const [cached] = await req.db.query(
      `SELECT extracted_content, word_count 
       FROM material_cache 
       WHERE material_id = ?`,
      [materialId]
    );
    
    if (cached.length > 0 && cached[0].extracted_content) {
      return res.json({
        content: cached[0].extracted_content,
        word_count: cached[0].word_count,
        cached: true
      });
    }
    
    // Nếu chưa có cache, trả về thông báo cần extract
    res.json({
      content: null,
      message: 'Tài liệu chưa được extract. Sẽ được extract khi tạo đề.',
      cached: false
    });
  } catch (error) {
    console.error('❌ Error getting material preview:', error);
    res.status(500).json({ error: 'Lỗi khi lấy preview', details: error.message });
  }
});

// ============================================
// POST /api/student/practice/ai/create - Tạo đề luyện tập bằng AI
// ============================================
router.post('/ai/create', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const studentId = req.user.id || req.user.user_id;
    const { material_id, prompt, options = {}, ai_model } = req.body;
    
    if (!material_id || !prompt) {
      return res.status(400).json({ error: 'Thiếu material_id hoặc prompt' });
    }
    
    if (!ai_model || !['groq', 'gemini'].includes(ai_model)) {
      return res.status(400).json({ error: 'Invalid ai_model. Must be "groq" or "gemini"' });
    }
    
    // Kiểm tra quyền truy cập tài liệu
    const [materialCheck] = await req.db.query(
      `SELECT m.*, c.class_id
       FROM materials m
       JOIN classes c ON m.class_id = c.class_id
       JOIN class_students cs ON c.class_id = cs.class_id
       WHERE m.material_id = ? AND cs.student_id = ?`,
      [material_id, studentId]
    );
    
    if (materialCheck.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập tài liệu này' });
    }
    
    const materialData = materialCheck[0];
    
    // Kiểm tra quota
    const [quotaCheck] = await req.db.query(
      `SELECT COUNT(*) as count 
       FROM ai_usage_logs 
       WHERE user_id = ? 
         AND provider = ?
         AND action_type = 'create_practice_exam'
         AND DATE(created_at) = CURDATE()`,
      [studentId, ai_model]
    );
    
    const limit = ai_model === 'groq' ? 10 : 5;
    if (quotaCheck[0].count >= limit) {
      return res.status(429).json({
        error: `Bạn đã đạt giới hạn ${limit} lần/ngày cho ${ai_model}`,
        limit,
        used: quotaCheck[0].count,
        provider: ai_model
      });
    }
    
    // Kiểm tra system quota
    const [systemQuota] = await req.db.query(
      `SELECT total_requests, limit_requests 
       FROM ai_system_quota 
       WHERE date = CURDATE() AND provider = ?`,
      [ai_model]
    );
    
    if (systemQuota.length === 0) {
      await req.db.query(
        `INSERT INTO ai_system_quota (date, provider, limit_requests) 
         VALUES (CURDATE(), ?, 100)`,
        [ai_model]
      );
    } else if (systemQuota[0].total_requests >= systemQuota[0].limit_requests) {
      return res.status(429).json({
        error: `Hệ thống đã đạt giới hạn ${systemQuota[0].limit_requests} requests/ngày cho ${ai_model}`,
        limit: systemQuota[0].limit_requests,
        used: systemQuota[0].total_requests
      });
    }
    
    // Extract content từ tài liệu
    let documentContent = '';
    const [cached] = await req.db.query(
      `SELECT extracted_content FROM material_cache WHERE material_id = ?`,
      [material_id]
    );
    
    if (cached.length > 0 && cached[0].extracted_content) {
      documentContent = cached[0].extracted_content;
      console.log(`✅ [Practice] Using cached content for material ${material_id} (${documentContent.length} chars)`);
      console.log(`📄 [Practice] Cached content preview (first 500 chars): ${documentContent.substring(0, 500)}...`);
      
      // Kiểm tra cache có hợp lệ không
      if (documentContent.includes('Please install') || 
          documentContent.includes('not yet fully supported') ||
          documentContent.includes('detected. Please') ||
          documentContent.length < 50) {
        console.warn(`⚠️ [Practice] Cached content is invalid, re-extracting...`);
        // Xóa cache và extract lại
        await req.db.query('DELETE FROM material_cache WHERE material_id = ?', [material_id]);
        documentContent = ''; // Reset để extract lại
      }
    }
    
    if (!documentContent || documentContent.length === 0) {
      // Extract từ file
      console.log(`📄 [Practice] Extracting content from file: ${materialData.file_path} (${materialData.file_type})`);
      try {
        documentContent = await fileExtractor.extractText(materialData.file_path, materialData.file_type);
        
        // Kiểm tra xem có phải là placeholder message không
        if (documentContent.includes('Please install') || 
            documentContent.includes('not yet fully supported') ||
            documentContent.includes('detected. Please') ||
            documentContent.length < 50) {
          console.error(`❌ [Practice] File extraction returned placeholder or empty content`);
          return res.status(400).json({ 
            error: `Không thể đọc nội dung file ${materialData.file_type.toUpperCase()}. Vui lòng cài đặt thư viện cần thiết hoặc thử lại sau.`,
            details: 'File extraction failed or returned placeholder content'
          });
        }
        
        console.log(`✅ [Practice] Successfully extracted ${documentContent.length} characters from file`);
        console.log(`📄 [Practice] Extracted content preview (first 1000 chars): ${documentContent.substring(0, 1000)}...`);
        console.log(`📄 [Practice] Extracted content preview (last 500 chars): ...${documentContent.substring(Math.max(0, documentContent.length - 500))}`);
        
        // Kiểm tra xem có phải là placeholder message không
        if (documentContent.includes('Please install') || 
            documentContent.includes('not yet fully supported') ||
            documentContent.includes('detected. Please') ||
            documentContent.length < 50) {
          console.error(`❌ [Practice] File extraction returned placeholder or empty content`);
          return res.status(400).json({ 
            error: `Không thể đọc nội dung file ${materialData.file_type.toUpperCase()}. File có thể là ảnh scan hoặc không chứa text.`,
            details: 'File extraction failed or returned placeholder content. The PDF might be scanned images without text.'
          });
        }
        
        // Cache lại nếu extract thành công
        if (documentContent && documentContent.trim().length > 50) {
          const wordCount = documentContent.split(/\s+/).length;
          await req.db.query(
            `INSERT INTO material_cache (material_id, extracted_content, word_count)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               extracted_content = VALUES(extracted_content),
               word_count = VALUES(word_count)`,
            [material_id, documentContent, wordCount]
          );
          console.log(`💾 [Practice] Cached content for material ${material_id} (${wordCount} words)`);
        }
      } catch (err) {
        console.error(`❌ [Practice] Error extracting file ${materialData.file_type}:`, err);
        return res.status(400).json({ 
          error: `Không thể đọc nội dung file ${materialData.file_type.toUpperCase()}. Lỗi: ${err.message}`,
          details: 'File extraction failed. Please ensure the file is valid and try again.'
        });
      }
    }
    
    // Kiểm tra lại nội dung trước khi gửi cho AI
    if (!documentContent || documentContent.trim().length < 50) {
      console.error(`❌ [Practice] Document content too short or empty (${documentContent?.length || 0} chars)`);
      return res.status(400).json({ 
        error: 'Nội dung tài liệu quá ngắn hoặc không hợp lệ. Vui lòng kiểm tra lại file.',
        details: 'Document content is too short or invalid'
      });
    }
    
    console.log(`📝 [Practice] Sending ${documentContent.length} characters to AI for question generation`);
    console.log(`📄 [Practice] Document preview (first 500 chars): ${documentContent.substring(0, 500)}...`);
    console.log(`💬 [Practice] Student prompt: ${prompt}`);
    console.log(`⚙️ [Practice] Options:`, JSON.stringify(options));
    
    // Parse điểm tối đa từ prompt (nếu có)
    // Tìm các pattern: "tối đa X điểm", "max X điểm", "mặc định X điểm", "tổng điểm X"
    let maxPoints = null;
    const maxPointsPatterns = [
      /(?:tối đa|max|maximum|tổng điểm|mặc định|default)\s*(\d+)\s*(?:điểm|point)/i,
      /(\d+)\s*(?:điểm|point)\s*(?:tối đa|max|maximum|tổng)/i
    ];
    
    for (const pattern of maxPointsPatterns) {
      const match = prompt.match(pattern);
      if (match) {
        maxPoints = parseFloat(match[1]);
        console.log(`📊 [Practice] Found max points in prompt: ${maxPoints}`);
        break;
      }
    }
    
    // Nếu không tìm thấy, mặc định là 10 điểm tổng
    if (!maxPoints) {
      maxPoints = 10;
      console.log(`📊 [Practice] No max points found in prompt, using default: ${maxPoints} points`);
    }
    
    // Tạo câu hỏi bằng AI
    const questions = await aiService.generateQuestionsFromDocument(
      documentContent,
      prompt,
      {
        ...options,
        provider: ai_model
      }
    );
    
    console.log(`✅ [Practice] AI generated ${questions.length} questions`);
    if (questions.length > 0) {
      console.log(`📋 [Practice] First question preview: ${questions[0].question_content?.substring(0, 100)}...`);
    }
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ error: 'AI không tạo được câu hỏi nào' });
    }
    
    // Tính điểm mỗi câu hỏi: LUÔN chia đều điểm tối đa cho số câu hỏi
    const pointsPerQuestion = maxPoints / questions.length;
    console.log(`📊 [Practice] Calculating points: ${maxPoints} total / ${questions.length} questions = ${pointsPerQuestion.toFixed(2)} per question`);
    
    // Tạo practice exam
    const [examResult] = await req.db.query(
      `INSERT INTO practice_exams 
       (student_id, source_type, source_id, exam_name, total_questions, ai_provider)
       VALUES (?, 'teacher_material', ?, ?, ?, ?)`,
      [
        studentId,
        material_id,
        `Luyện tập: ${materialData.title}`,
        questions.length,
        ai_model
      ]
    );
    
    const practiceExamId = examResult.insertId;
    
    // Lưu câu hỏi với điểm đã tính toán
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // LUÔN sử dụng điểm đã tính toán (chia đều từ điểm tối đa)
      const questionPoints = pointsPerQuestion;
      
      const [questionResult] = await req.db.query(
        `INSERT INTO practice_exam_questions
         (practice_exam_id, question_content, question_type, difficulty, points, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          practiceExamId, 
          q.question_content, 
          q.question_type, 
          q.difficulty, 
          questionPoints.toFixed(2), 
          i + 1
        ]
      );
      
      // Với Essay/FillInBlank, lưu correct_answer_text vào options (dùng option_content để lưu đáp án mẫu)
      if ((q.question_type === 'Essay' || q.question_type === 'FillInBlank') && q.correct_answer_text) {
        await req.db.query(
          `INSERT INTO practice_exam_options
           (practice_exam_id, question_order, option_content, is_correct, option_order)
           VALUES (?, ?, ?, ?, ?)`,
          [practiceExamId, i + 1, q.correct_answer_text, 1, 0]
        );
        console.log(`✅ [Practice] Saved correct_answer_text for ${q.question_type} question ${i + 1}`);
      }
      
      // Lưu options nếu có
      if (q.options && q.options.length > 0) {
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          await req.db.query(
            `INSERT INTO practice_exam_options
             (practice_exam_id, question_order, option_content, is_correct, option_order)
             VALUES (?, ?, ?, ?, ?)`,
            [practiceExamId, i + 1, opt.option_content, opt.is_correct, j]
          );
        }
      }
    }
    
    // Log usage
    await req.db.query(
      `INSERT INTO ai_usage_logs (user_id, provider, action_type, practice_exam_id, tokens_used)
       VALUES (?, ?, 'create_practice_exam', ?, ?)`,
      [studentId, ai_model, practiceExamId, 0] // tokens_used có thể tính sau
    );
    
    // Update system quota
    await req.db.query(
      `UPDATE ai_system_quota 
       SET total_requests = total_requests + 1,
           updated_at = NOW()
       WHERE date = CURDATE() AND provider = ?`,
      [ai_model]
    );
    
    res.json({
      success: true,
      practice_exam_id: practiceExamId,
      exam_name: `Luyện tập: ${materialData.title}`,
      total_questions: questions.length,
      provider: ai_model
    });
    
  } catch (error) {
    console.error('❌ Error creating practice exam:', error);
    res.status(500).json({ error: 'Lỗi khi tạo đề luyện tập', details: error.message });
  }
});

// ============================================
// GET /api/student/practice/exams - Lấy danh sách đề luyện tập
// ============================================
router.get('/exams', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const studentId = req.user.id || req.user.user_id;
    
    const [exams] = await req.db.query(
      `SELECT 
        pe.practice_exam_id,
        pe.exam_name,
        pe.total_questions,
        pe.ai_provider,
        pe.created_at,
        pe.status,
        COUNT(DISTINCT pea.attempt_id) as attempt_count,
        MAX(pea.score) as best_score
       FROM practice_exams pe
       LEFT JOIN practice_exam_attempts pea ON pe.practice_exam_id = pea.practice_exam_id
       WHERE pe.student_id = ?
       GROUP BY pe.practice_exam_id
       ORDER BY pe.created_at DESC`,
      [studentId]
    );
    
    res.json({ exams });
  } catch (error) {
    console.error('❌ Error getting practice exams:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách đề luyện tập', details: error.message });
  }
});

// ============================================
// DELETE /api/student/practice/exams/:examId - Xóa đề luyện tập
// ============================================
router.delete('/exams/:examId', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền sở hữu
    const [exam] = await req.db.query(
      `SELECT practice_exam_id FROM practice_exams 
       WHERE practice_exam_id = ? AND student_id = ?`,
      [examId, studentId]
    );
    
    if (exam.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa đề luyện tập này' });
    }
    
    // Xóa (cascade sẽ xóa questions và options)
    await req.db.query(
      `DELETE FROM practice_exams WHERE practice_exam_id = ?`,
      [examId]
    );
    
    res.json({ success: true, message: 'Đã xóa đề luyện tập' });
  } catch (error) {
    console.error('❌ Error deleting practice exam:', error);
    res.status(500).json({ error: 'Lỗi khi xóa đề luyện tập', details: error.message });
  }
});

// ============================================
// GET /api/student/practice/exams/:examId/start - Bắt đầu làm đề luyện tập
// ============================================
router.get('/exams/:examId/start', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền sở hữu
    const [exam] = await req.db.query(
      `SELECT * FROM practice_exams 
       WHERE practice_exam_id = ? AND student_id = ?`,
      [examId, studentId]
    );
    
    if (exam.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền làm đề luyện tập này' });
    }
    
    // Tạo attempt mới hoặc lấy attempt đang làm
    const [existingAttempt] = await req.db.query(
      `SELECT attempt_id FROM practice_exam_attempts 
       WHERE practice_exam_id = ? AND student_id = ? AND status = 'InProgress'`,
      [examId, studentId]
    );
    
    let attemptId;
    if (existingAttempt.length > 0) {
      attemptId = existingAttempt[0].attempt_id;
    } else {
      const [result] = await req.db.query(
        `INSERT INTO practice_exam_attempts (practice_exam_id, student_id, start_time, status)
         VALUES (?, ?, NOW(), 'InProgress')`,
        [examId, studentId]
      );
      attemptId = result.insertId;
    }
    
    // Lấy câu hỏi
    const [questions] = await req.db.query(
      `SELECT 
        peq.id,
        peq.question_content,
        peq.question_type,
        peq.difficulty,
        peq.points,
        peq.question_order
       FROM practice_exam_questions peq
       WHERE peq.practice_exam_id = ?
       ORDER BY peq.question_order ASC`,
      [examId]
    );
    
    // Lấy options cho từng câu hỏi
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const [options] = await req.db.query(
          `SELECT 
            id,
            option_content,
            is_correct,
            option_order
           FROM practice_exam_options
           WHERE practice_exam_id = ? AND question_order = ?
           ORDER BY option_order ASC`,
          [examId, q.question_order]
        );
        
        return {
          question_id: q.id,
          question_content: q.question_content,
          question_type: q.question_type,
          difficulty: q.difficulty,
          points: q.points,
          question_order: q.question_order,
          options: options.map(opt => ({
            option_id: opt.id,
            option_content: opt.option_content,
            is_correct: opt.is_correct,
            option_order: opt.option_order
          }))
        };
      })
    );
    
    res.json({
      attempt_id: attemptId,
      exam: {
        practice_exam_id: exam[0].practice_exam_id,
        exam_name: exam[0].exam_name,
        total_questions: exam[0].total_questions
      },
      questions: questionsWithOptions
    });
  } catch (error) {
    console.error('❌ Error starting practice exam:', error);
    res.status(500).json({ error: 'Lỗi khi bắt đầu làm bài luyện tập', details: error.message });
  }
});

// ============================================
// POST /api/student/practice/exams/:examId/submit - Nộp bài luyện tập
// ============================================
router.post('/exams/:examId/submit', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { examId } = req.params;
    const { attempt_id, answers } = req.body;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền
    const [attempt] = await req.db.query(
      `SELECT * FROM practice_exam_attempts 
       WHERE attempt_id = ? AND practice_exam_id = ? AND student_id = ?`,
      [attempt_id, examId, studentId]
    );
    
    if (attempt.length === 0) {
      return res.status(403).json({ error: 'Không tìm thấy lượt làm bài' });
    }
    
    if (attempt[0].status !== 'InProgress') {
      return res.status(400).json({ error: 'Bài thi đã được nộp' });
    }
    
    // Lưu đáp án vào DB
    for (const [questionId, answer] of Object.entries(answers)) {
      if (answer === null || answer === undefined || answer === '') continue;
      
      // Xóa đáp án cũ nếu có
      await req.db.query(
        `DELETE FROM practice_exam_attempt_answers 
         WHERE attempt_id = ? AND question_id = ?`,
        [attempt_id, questionId]
      );
      
      if (Array.isArray(answer)) {
        // MultipleChoice - lưu nhiều option_id
        for (const optionId of answer) {
          await req.db.query(
            `INSERT INTO practice_exam_attempt_answers (attempt_id, question_id, option_id)
             VALUES (?, ?, ?)`,
            [attempt_id, questionId, optionId]
          );
        }
      } else if (typeof answer === 'number') {
        // SingleChoice - lưu 1 option_id
        await req.db.query(
          `INSERT INTO practice_exam_attempt_answers (attempt_id, question_id, option_id)
           VALUES (?, ?, ?)`,
          [attempt_id, questionId, answer]
        );
      } else {
        // FillInBlank/Essay - lưu text
        await req.db.query(
          `INSERT INTO practice_exam_attempt_answers (attempt_id, question_id, answer_text)
           VALUES (?, ?, ?)`,
          [attempt_id, questionId, answer]
        );
      }
    }
    
    // Tính điểm
    let totalScore = 0;
    let totalPoints = 0;
    
    const [questions] = await req.db.query(
      `SELECT id, question_type, points, question_order
       FROM practice_exam_questions
       WHERE practice_exam_id = ?`,
      [examId]
    );
    
    for (const question of questions) {
      totalPoints += parseFloat(question.points) || 0;
      const answer = answers[question.id];
      
      if (!answer) continue;
      
      if (question.question_type === 'SingleChoice' || question.question_type === 'MultipleChoice') {
        // Lấy đáp án đúng
        const [correctOptions] = await req.db.query(
          `SELECT id FROM practice_exam_options
           WHERE practice_exam_id = ? AND question_order = ? AND is_correct = 1`,
          [examId, question.question_order]
        );
        
        const correctIds = correctOptions.map(o => o.id);
        const studentAnswerIds = Array.isArray(answer) ? answer : [answer];
        
        // So sánh
        const isCorrect = correctIds.length === studentAnswerIds.length &&
          correctIds.every(id => studentAnswerIds.includes(id));
        
        if (isCorrect) {
          totalScore += parseFloat(question.points) || 0;
        }
      } else {
        // FillInBlank/Essay - tạm thời không tự động chấm
        // Có thể thêm logic so sánh text sau
      }
    }
    
    // Cập nhật attempt
    await req.db.query(
      `UPDATE practice_exam_attempts 
       SET score = ?, total_points = ?, end_time = NOW(), status = 'Submitted'
       WHERE attempt_id = ?`,
      [totalScore, totalPoints, attempt_id]
    );
    
    res.json({
      success: true,
      score: totalScore,
      total_points: totalPoints,
      percentage: totalPoints > 0 ? ((totalScore / totalPoints) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('❌ Error submitting practice exam:', error);
    res.status(500).json({ error: 'Lỗi khi nộp bài luyện tập', details: error.message });
  }
});

// ============================================
// GET /api/student/practice/exams/:examId/attempts - Lấy danh sách các lần làm bài
// ============================================
router.get('/exams/:examId/attempts', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền
    const [exam] = await req.db.query(
      `SELECT * FROM practice_exams 
       WHERE practice_exam_id = ? AND student_id = ?`,
      [examId, studentId]
    );
    
    if (exam.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xem đề luyện tập này' });
    }
    
    // Lấy danh sách attempts
    const [attempts] = await req.db.query(
      `SELECT 
        attempt_id,
        score,
        total_points,
        start_time,
        end_time,
        status,
        TIMESTAMPDIFF(MINUTE, start_time, end_time) as duration_minutes
       FROM practice_exam_attempts
       WHERE practice_exam_id = ? AND student_id = ?
       ORDER BY start_time DESC`,
      [examId, studentId]
    );
    
    res.json({ attempts });
  } catch (error) {
    console.error('❌ Error getting practice exam attempts:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lần làm bài', details: error.message });
  }
});

// ============================================
// GET /api/student/practice/exams/:examId/result/:attemptId - Xem kết quả chi tiết
// ============================================
router.get('/exams/:examId/result/:attemptId', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  try {
    const { examId, attemptId } = req.params;
    const studentId = req.user.id || req.user.user_id;
    
    // Kiểm tra quyền
    const [attempt] = await req.db.query(
      `SELECT * FROM practice_exam_attempts 
       WHERE attempt_id = ? AND practice_exam_id = ? AND student_id = ?`,
      [attemptId, examId, studentId]
    );
    
    if (attempt.length === 0) {
      return res.status(403).json({ error: 'Không tìm thấy kết quả' });
    }
    
    // Lấy thông tin đề thi
    const [exam] = await req.db.query(
      `SELECT * FROM practice_exams WHERE practice_exam_id = ?`,
      [examId]
    );
    
    // Lấy câu hỏi và đáp án
    const [questions] = await req.db.query(
      `SELECT 
        peq.id,
        peq.question_content,
        peq.question_type,
        peq.difficulty,
        peq.points,
        peq.question_order
       FROM practice_exam_questions peq
       WHERE peq.practice_exam_id = ?
       ORDER BY peq.question_order ASC`,
      [examId]
    );
    
    // Lấy đáp án học sinh đã chọn
    const results = await Promise.all(
      questions.map(async (q) => {
        // Lấy options
        const [options] = await req.db.query(
          `SELECT 
            id,
            option_content,
            is_correct,
            option_order
           FROM practice_exam_options
           WHERE practice_exam_id = ? AND question_order = ?
           ORDER BY option_order ASC`,
          [examId, q.question_order]
        );
        
        // Tìm đáp án đúng
        const correctOptions = options.filter(opt => opt.is_correct === 1);
        const correctAnswerIds = correctOptions.map(opt => opt.id);
        
        // Lấy đáp án học sinh đã chọn
        const [studentAnswers] = await req.db.query(
          `SELECT option_id, answer_text 
           FROM practice_exam_attempt_answers
           WHERE attempt_id = ? AND question_id = ?`,
          [attemptId, q.id]
        );
        
        const studentAnswerIds = studentAnswers
          .filter(a => a.option_id !== null)
          .map(a => a.option_id);
        const studentAnswerText = studentAnswers
          .find(a => a.answer_text !== null)?.answer_text || null;
        
        // Kiểm tra đúng/sai
        let isCorrect = false;
        if (q.question_type === 'SingleChoice' || q.question_type === 'MultipleChoice') {
          isCorrect = correctAnswerIds.length === studentAnswerIds.length &&
            correctAnswerIds.every(id => studentAnswerIds.includes(id));
        }
        
        return {
          question_id: q.id,
          question_content: q.question_content,
          question_type: q.question_type,
          difficulty: q.difficulty,
          points: q.points,
          question_order: q.question_order,
          options: options.map(opt => ({
            option_id: opt.id,
            option_content: opt.option_content,
            is_correct: opt.is_correct === 1,
            option_order: opt.option_order
          })),
          correct_answer_ids: correctAnswerIds,
          student_answer_ids: studentAnswerIds,
          student_answer_text: studentAnswerText,
          is_correct: isCorrect ? 1 : 0
        };
      })
    );
    
    res.json({
      attempt: attempt[0],
      exam: exam[0],
      results: results
    });
  } catch (error) {
    console.error('❌ Error getting practice exam result:', error);
    res.status(500).json({ error: 'Lỗi khi lấy kết quả', details: error.message });
  }
});

module.exports = router;

