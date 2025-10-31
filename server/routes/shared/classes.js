// server/routes/shared/classes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

// Hàm tạo thông báo (di chuyển vào shared/helpers.js)
const createNotification = async (db, io, userId, content, type, relatedId, relatedType) => {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, content, type, related_id, related_type) VALUES (?, ?, ?, ?, ?)',
      [userId, content, type, relatedId, relatedType]
    );
    io.to(`user_${userId}`).emit('notification', {
      notification_id: result.insertId,
      content,
      type,
      related_id: relatedId,
      related_type: relatedType,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
  }
};

// Lấy chi tiết lớp học (cho cả học sinh và giáo viên)
router.get('/:classId/detail', authMiddleware, roleMiddleware(['student', 'teacher']), async (req, res) => {
  const { classId } = req.params;
  const userId = req.user.id;

  try {
    const [membership] = await req.db.query(
      `SELECT cs.*, c.teacher_id 
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.class_id
       WHERE cs.class_id = ? AND cs.student_id = ?`,
      [classId, userId]
    );

    // Nếu người dùng là giáo viên, kiểm tra quyền sở hữu lớp
    if (req.user.role === 'teacher') {
      const [teacherCheck] = await req.db.query(
        `SELECT * FROM classes WHERE class_id = ? AND teacher_id = ?`,
        [classId, userId]
      );
      if (teacherCheck.length === 0 && membership.length === 0) {
        return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
      }
    } else if (membership.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
    }

    const [teacher] = await req.db.query(
      `SELECT u.full_name 
       FROM users u
       WHERE u.user_id = ?`,
      [membership[0]?.teacher_id || teacherCheck[0]?.teacher_id]
    );

    const [students] = await req.db.query(
      `SELECT u.user_id, u.username, u.email, u.full_name
       FROM class_students cs
       JOIN users u ON cs.student_id = u.user_id
       WHERE cs.class_id = ?
       ORDER BY u.full_name ASC`,
      [classId]
    );

    const [tests] = await req.db.query(
      `SELECT 
          e.exam_id as test_id,
          e.exam_name as title,
          e.start_time,
          e.duration,
          e.description,
          0 as total_questions
       FROM exams e
       WHERE e.class_id = ? AND e.status IN ('active', 'upcoming')
       ORDER BY e.start_time DESC`,
      [classId]
    );

    let announcements = [];
    try {
      const [result] = await req.db.query(
        `SELECT 
            announcement_id,
            title,
            content,
            created_at
         FROM announcements
         WHERE class_id = ?
         ORDER BY created_at DESC
         LIMIT 10`,
        [classId]
      );
      announcements = result || [];
    } catch (err) {
      console.log('Bảng announcements chưa tồn tại hoặc có lỗi');
    }

    res.json({
      teacher: teacher[0]?.full_name || 'Chưa có giáo viên',
      students: students,
      tests: tests,
      announcements: announcements
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết lớp:', err);
    res.status(500).json({ error: 'Lỗi khi tải chi tiết lớp học', details: err.message });
  }
});

module.exports = router;