const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

// ============================================
// 📊 THEO DÕI TRẠNG THÁI HỌC SINH REAL-TIME
// ============================================
router.get('/:examId/students-status', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền
    const [exam] = await req.db.query(
      'SELECT exam_name, start_time, duration FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );

    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bài thi này' });
    }

    // Lấy danh sách học sinh và trạng thái làm bài
    const [students] = await req.db.query(
      `SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.username,
        cs.class_id,
        ea.attempt_id,
        ea.status,
        ea.start_time,
        ea.end_time,
        ea.score,
        TIMESTAMPDIFF(MINUTE, ea.start_time, COALESCE(ea.end_time, NOW())) as time_elapsed,
        (SELECT COUNT(*) FROM exam_attempt_answers eaa WHERE eaa.attempt_id = ea.attempt_id) as answered_count,
        (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = ?) as total_questions
       FROM class_students cs
       JOIN users u ON cs.student_id = u.user_id
       LEFT JOIN exam_attempts ea ON ea.exam_id = ? AND ea.student_id = u.user_id
       WHERE cs.class_id = (SELECT class_id FROM exams WHERE exam_id = ?)
       ORDER BY u.full_name ASC`,
      [examId, examId, examId]
    );

    // Tính toán thống kê
    const stats = {
      total_students: students.length,
      in_progress: students.filter(s => s.status === 'InProgress').length,
      submitted: students.filter(s => s.status === 'Submitted' || s.status === 'AutoSubmitted').length,
      not_started: students.filter(s => !s.status || s.status === null).length
    };

    res.json({
      exam: exam[0],
      students: students.map(s => ({
        student_id: s.user_id,
        full_name: s.full_name,
        email: s.email,
        username: s.username,
        status: s.status || 'not_started',
        status_text: s.status === 'InProgress' ? 'Đang làm bài' :
                     s.status === 'Submitted' ? 'Đã nộp bài' :
                     s.status === 'AutoSubmitted' ? 'Tự động nộp' :
                     'Chưa bắt đầu',
        start_time: s.start_time,
        end_time: s.end_time,
        score: s.score,
        time_elapsed: s.time_elapsed || 0,
        progress: s.total_questions > 0 
          ? Math.round((s.answered_count / s.total_questions) * 100) 
          : 0,
        answered_count: s.answered_count || 0,
        total_questions: s.total_questions || 0
      })),
      stats
    });

  } catch (err) {
    console.error('❌ Lỗi lấy trạng thái học sinh:', err);
    res.status(500).json({ error: 'Lỗi khi lấy trạng thái học sinh', details: err.message });
  }
});

module.exports = router;

