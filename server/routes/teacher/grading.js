const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

// ============================================
// 📋 LẤY DANH SÁCH BÀI THI CẦN CHẤM
// ============================================
router.get('/pending', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;

  try {
    console.log('🔍 Loading pending grading for teacher:', teacherId);

    // Lấy danh sách bài thi chưa chấm hoàn toàn
    const [attempts] = await req.db.query(
      `SELECT 
        ea.attempt_id,
        ea.exam_id,
        ea.student_id,
        ea.start_time,
        ea.end_time,
        ea.score,
        ea.is_fully_graded,
        e.exam_name,
        e.duration,
        u.full_name as student_name,
        (SELECT COUNT(*) 
         FROM exam_attempt_answers eaa
         JOIN exam_questions eq ON eaa.question_id = eq.question_id
         JOIN question_bank qb ON eq.question_id = qb.question_id
         WHERE eaa.attempt_id = ea.attempt_id 
           AND qb.question_type IN ('Essay', 'FillInBlank')
           AND eaa.is_graded = 0
        ) as pending_questions
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')
         AND ea.is_fully_graded = 0
       ORDER BY ea.end_time DESC`,
      [teacherId]
    );

    // Lọc chỉ những attempt có câu hỏi chưa chấm
    const needGrading = attempts.filter(a => a.pending_questions > 0);

    // Thống kê
    const [stats] = await req.db.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN eaa.is_graded = 0 AND qb.question_type = 'Essay' THEN eaa.attempt_id END) as pending_essays,
        COUNT(DISTINCT CASE WHEN eaa.is_graded = 0 AND qb.question_type = 'FillInBlank' THEN eaa.attempt_id END) as pending_fill,
        COUNT(DISTINCT CASE WHEN eaa.is_graded = 1 THEN eaa.attempt_id END) as graded_count,
        COUNT(DISTINCT CASE WHEN qb.question_type IN ('SingleChoice', 'MultipleChoice') THEN eaa.attempt_id END) as pending_choice
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN exam_attempt_answers eaa ON ea.attempt_id = eaa.attempt_id
       JOIN exam_questions eq ON eaa.question_id = eq.question_id
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE e.teacher_id = ? AND ea.status IN ('Submitted', 'AutoSubmitted')`,
      [teacherId]
    );

    console.log('✅ Found pending grading:', needGrading.length);

    res.json({
      attempts: needGrading,
      pendingEssays: stats[0]?.pending_essays || 0,
      pendingFillInBlank: stats[0]?.pending_fill || 0,
      gradedCount: stats[0]?.graded_count || 0,
      pendingChoice: stats[0]?.pending_choice || 0
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi tải danh sách bài cần chấm', details: err.message });
  }
});

// ============================================
// 📄 LẤY CHI TIẾT BÀI LÀM CỦA HỌC SINH
// ============================================
router.get('/:attemptId', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { attemptId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    console.log('🔍 Loading grading detail:', attemptId);

    // Kiểm tra quyền truy cập
    const [attempt] = await req.db.query(
      `SELECT 
        ea.*,
        e.exam_name,
        e.teacher_id,
        u.full_name as student_name,
        (SELECT SUM(points) FROM exam_questions WHERE exam_id = ea.exam_id) AS total_points
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       WHERE ea.attempt_id = ? AND e.teacher_id = ?`,
      [attemptId, teacherId]
    );

    if (!attempt.length) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bài làm này' });
    }

    const attemptData = attempt[0];

    // Lấy câu trả lời chưa chấm
    const [answers] = await req.db.query(
      `SELECT 
        eq.question_id,
        qb.question_content,
        qb.question_type,
        qb.difficulty,
        qb.correct_answer_text,
        eq.points,
        eaa.answer_text,
        eaa.option_id,
        eaa.is_correct,
        eaa.is_graded,
        eaa.teacher_score,
        eaa.teacher_comment
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       LEFT JOIN exam_attempt_answers eaa ON eq.question_id = eaa.question_id AND eaa.attempt_id = ?
       WHERE eq.exam_id = ?
       ORDER BY eq.question_order`,
      [attemptId, attemptData.exam_id]
    );

    console.log('✅ Loaded grading detail');

    res.json({
      attempt_id: attemptData.attempt_id,
      exam_name: attemptData.exam_name,
      student_name: attemptData.student_name,
      start_time: attemptData.start_time,
      end_time: attemptData.end_time,
      current_score: attemptData.score || 0,
      total_points: attemptData.total_points || 0,
      is_fully_graded: attemptData.is_fully_graded,
      answers: answers
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi tải chi tiết bài làm', details: err.message });
  }
});

// ============================================
// 💾 CHẤM ĐIỂM VÀ LƯU KẾT QUẢ
// ============================================
router.post('/:attemptId/submit', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { attemptId } = req.params;
  const { grades } = req.body; // [{ question_id, teacher_score, teacher_comment }]
  const teacherId = req.user.id || req.user.user_id;

  try {
    console.log('🔵 Submitting grades:', attemptId, grades);

    // Kiểm tra quyền
    const [attempt] = await req.db.query(
      `SELECT ea.*, e.teacher_id, e.exam_id
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND e.teacher_id = ?`,
      [attemptId, teacherId]
    );

    if (!attempt.length) {
      return res.status(403).json({ error: 'Bạn không có quyền chấm bài này' });
    }

    const examId = attempt[0].exam_id;

    // Cập nhật điểm cho từng câu
    for (const grade of grades) {
      await req.db.query(
        `UPDATE exam_attempt_answers
         SET teacher_score = ?,
             teacher_comment = ?,
             is_graded = 1,
             updated_by = ?,
             updated_at = NOW()
         WHERE attempt_id = ? AND question_id = ?`,
        [grade.teacher_score, grade.teacher_comment, teacherId, attemptId, grade.question_id]
      );
    }

    // Tính lại tổng điểm
    const [scores] = await req.db.query(
      `SELECT 
        SUM(CASE 
          WHEN eaa.is_correct = 1 THEN eq.points
          WHEN eaa.teacher_score IS NOT NULL THEN eaa.teacher_score
          ELSE 0
        END) as total_score
       FROM exam_attempt_answers eaa
       JOIN exam_questions eq ON eaa.question_id = eq.question_id
       WHERE eaa.attempt_id = ?`,
      [attemptId]
    );

    const totalScore = parseFloat(scores[0].total_score || 0).toFixed(1);

    // Kiểm tra xem tất cả câu đã được chấm chưa
    const [pending] = await req.db.query(
      `SELECT COUNT(*) as count
       FROM exam_attempt_answers eaa
       JOIN exam_questions eq ON eaa.question_id = eq.question_id
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE eaa.attempt_id = ?
         AND qb.question_type IN ('Essay', 'FillInBlank')
         AND eaa.is_graded = 0`,
      [attemptId]
    );

    const isFullyGraded = pending[0].count === 0 ? 1 : 0;

    // Cập nhật điểm tổng
    await req.db.query(
      `UPDATE exam_attempts
       SET score = ?,
           is_fully_graded = ?
       WHERE attempt_id = ?`,
      [totalScore, isFullyGraded, attemptId]
    );

    console.log('✅ Grading saved:', { totalScore, isFullyGraded });

    res.json({
      success: true,
      total_score: totalScore,
      is_fully_graded: isFullyGraded,
      message: 'Đã lưu điểm thành công'
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lưu điểm', details: err.message });
  }
});

module.exports = router;