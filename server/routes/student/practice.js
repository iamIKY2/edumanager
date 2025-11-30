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
    
    // Lấy tài liệu từ các lớp
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
        c.class_name
       FROM materials m
       JOIN classes c ON m.class_id = c.class_id
       JOIN users u ON m.teacher_id = u.user_id
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
    } else {
      // Extract từ file (đơn giản: chỉ đọc text file, PDF/Word cần thư viện khác)
      // Extract content từ file
      try {
        documentContent = await fileExtractor.extractText(materialData.file_path, materialData.file_type);
      } catch (err) {
        console.warn('⚠️ Cannot extract file:', err.message);
        // Nếu không extract được, thử dùng AI để đọc (nếu là PDF/Word)
        if (['.pdf', '.docx', '.doc', '.pptx', '.ppt'].includes(materialData.file_type)) {
          documentContent = `Tài liệu ${materialData.file_type.toUpperCase()} đã được upload. 
Vui lòng mô tả nội dung tài liệu trong prompt để AI có thể tạo câu hỏi phù hợp.`;
        } else {
          documentContent = 'Nội dung tài liệu chưa được extract. Vui lòng thử lại sau.';
        }
      }
      
      // Cache lại
      if (documentContent && documentContent.length > 0) {
        await req.db.query(
          `INSERT INTO material_cache (material_id, extracted_content, word_count)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE 
             extracted_content = VALUES(extracted_content),
             word_count = VALUES(word_count)`,
          [material_id, documentContent, documentContent.split(/\s+/).length]
        );
      }
    }
    
    if (!documentContent || documentContent.trim().length === 0) {
      return res.status(400).json({ error: 'Không thể đọc nội dung tài liệu' });
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
    
    if (!questions || questions.length === 0) {
      return res.status(500).json({ error: 'AI không tạo được câu hỏi nào' });
    }
    
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
    
    // Lưu câu hỏi
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      const [questionResult] = await req.db.query(
        `INSERT INTO practice_exam_questions
         (practice_exam_id, question_content, question_type, difficulty, points, question_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [practiceExamId, q.question_content, q.question_type, q.difficulty, q.points, i + 1]
      );
      
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

