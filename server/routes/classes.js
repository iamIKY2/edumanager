const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Hàm tạo thông báo
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

// Tạo lớp học
router.post('/', authMiddleware, async (req, res) => {
  const { className, subject, description, academicYear, icon } = req.body;
  const teacherId = req.user.id;

  if (!className || !subject) {
    return res.status(400).json({ error: 'Tên lớp và môn học là bắt buộc' });
  }

  try {
    const classCode = 'CLS' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const [result] = await req.db.query(
      `INSERT INTO classes (class_name, subject_id, teacher_id, description, academic_year, class_code, icon, status)
       VALUES (?, (SELECT subject_id FROM subjects WHERE subject_name = ?), ?, ?, ?, ?, ?, 'active')`,
      [className, subject, teacherId, description || '', academicYear || '2024-2025', classCode, icon || '📚']
    );

    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Lớp học mới "${className}" đã được tạo`,
      'Info',
      result.insertId,
      'Class'
    );

    res.status(201).json({
      message: 'Tạo lớp học thành công',
      class: {
        id: result.insertId,
        className,
        subject,
        classCode,
        icon,
        status: 'active'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi tạo lớp học', details: err.message });
  }
});

// Lấy danh sách lớp học
router.get('/', authMiddleware, async (req, res) => {
  const teacherId = req.user.id;

  try {
    const [classes] = await req.db.query(
      `SELECT c.class_id, c.class_name, s.subject_name, c.description, c.academic_year, c.class_code, c.icon, c.status,
              COUNT(cs.student_id) as students,
              COUNT(e.exam_id) as exams,
              AVG(ea.score) as avg_score
       FROM classes c
       LEFT JOIN subjects s ON c.subject_id = s.subject_id
       LEFT JOIN class_students cs ON c.class_id = cs.class_id
       LEFT JOIN exams e ON c.class_id = e.class_id
       LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id
       WHERE c.teacher_id = ? AND c.status != 'deleted'
       GROUP BY c.class_id`,
      [teacherId]
    );

    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách lớp', details: err.message });
  }
});

// Tham gia lớp học bằng mã code
router.post('/join', authMiddleware, async (req, res) => {
  const { classCode } = req.body;
  const studentId = req.user.id;

  if (!classCode) {
    return res.status(400).json({ error: 'Mã lớp là bắt buộc' });
  }

  try {
    const [classResult] = await req.db.query(
      `SELECT class_id, class_name, teacher_id FROM classes WHERE class_code = ? AND status = 'active'`,
      [classCode]
    );

    if (classResult.length === 0) {
      return res.status(404).json({ error: 'Lớp học không tồn tại hoặc mã lớp không đúng' });
    }

    const classId = classResult[0].class_id;
    const teacherId = classResult[0].teacher_id;

    const [existing] = await req.db.query(
      `SELECT * FROM class_students WHERE class_id = ? AND student_id = ?`,
      [classId, studentId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Bạn đã tham gia lớp này' });
    }

    await req.db.query(
      `INSERT INTO class_students (class_id, student_id, joined_at) VALUES (?, ?, NOW())`,
      [classId, studentId]
    );

    const [student] = await req.db.query('SELECT full_name FROM users WHERE user_id = ?', [studentId]);
    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Học sinh ${student[0].full_name} đã tham gia lớp ${classResult[0].class_name}`,
      'Info',
      classId,
      'Class'
    );

    res.json({ message: 'Tham gia lớp học thành công', classId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi tham gia lớp', details: err.message });
  }
});

// Thêm bài thi vào lớp
router.post('/:classId/exams', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const { examName, examDate, duration, description, status } = req.body;
  const teacherId = req.user.id;

  if (!examName || !examDate || !duration) {
    return res.status(400).json({ error: 'Tên bài thi, ngày thi và thời gian là bắt buộc' });
  }

  try {
    const [classResult] = await req.db.query(
      `SELECT class_name, subject_id FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm bài thi vào lớp này' });
    }

    const [result] = await req.db.query(
      `INSERT INTO exams (exam_name, class_id, subject_id, teacher_id, start_time, duration, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [examName, classId, classResult[0].subject_id, teacherId, examDate, duration, description || '', status || 'upcoming']
    );

    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Bài thi "${examName}" đã được thêm vào lớp ${classResult[0].class_name}`,
      'Info',
      result.insertId,
      'Exam'
    );

    res.status(201).json({
      message: 'Tạo bài thi thành công',
      exam: {
        exam_id: result.insertId,
        class_id: classId,
        title: examName,
        exam_date: examDate,
        duration,
        description,
        status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi tạo bài thi', details: err.message });
  }
});

// Lấy danh sách bài thi của lớp
router.get('/:classId/exams', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const teacherId = req.user.id;

  try {
    const [classResult] = await req.db.query(
      `SELECT * FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
    }

    const [exams] = await req.db.query(
      `SELECT e.exam_id, e.exam_name AS title, e.start_time AS exam_date, e.duration, e.description, e.status,
              COUNT(ea.attempt_id) as submissions
       FROM exams e
       LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id
       WHERE e.class_id = ? AND e.status != 'deleted'
       GROUP BY e.exam_id`,
      [classId]
    );

    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bài thi', details: err.message });
  }
});

// Lấy danh sách học sinh trong lớp
router.get('/:classId/students', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const teacherId = req.user.id;

  try {
    const [classResult] = await req.db.query(
      `SELECT * FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
    }

    const [students] = await req.db.query(
      `SELECT u.user_id, u.full_name, u.email, u.username AS student_id, AVG(ea.score) as avg_score, COUNT(ea.exam_id) as exams_completed
       FROM class_students cs
       JOIN users u ON cs.student_id = u.user_id
       LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id
       WHERE cs.class_id = ?
       GROUP BY u.user_id`,
      [classId]
    );

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách học sinh', details: err.message });
  }
});

// Thêm học sinh vào lớp
router.post('/:classId/students', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const { studentId, email } = req.body;
  const teacherId = req.user.id;

  if (!studentId && !email) {
    return res.status(400).json({ error: 'Cần cung cấp mã số học sinh hoặc email' });
  }

  try {
    const [classResult] = await req.db.query(
      `SELECT class_name FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm học sinh vào lớp này' });
    }

    const [userResult] = await req.db.query(
      `SELECT user_id, full_name, email, username FROM users WHERE username = ? OR email = ?`,
      [studentId || '', email || '']
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }

    const student = userResult[0];

    const [existing] = await req.db.query(
      `SELECT * FROM class_students WHERE class_id = ? AND student_id = ?`,
      [classId, student.user_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Học sinh đã có trong lớp' });
    }

    await req.db.query(
      `INSERT INTO class_students (class_id, student_id, joined_at) VALUES (?, ?, NOW())`,
      [classId, student.user_id]
    );

    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Học sinh ${student.full_name} đã được thêm vào lớp ${classResult[0].class_name}`,
      'Info',
      classId,
      'Class'
    );

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi thêm học sinh', details: err.message });
  }
});

// Xóa học sinh khỏi lớp
router.delete('/:classId/students/:studentId', authMiddleware, async (req, res) => {
  const { classId, studentId } = req.params;
  const teacherId = req.user.id;

  try {
    const [classResult] = await req.db.query(
      `SELECT class_name FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa học sinh khỏi lớp này' });
    }

    const [student] = await req.db.query('SELECT full_name FROM users WHERE user_id = ?', [studentId]);
    if (student.length === 0) {
      return res.status(404).json({ error: 'Học sinh không tồn tại' });
    }

    const [result] = await req.db.query(
      `DELETE FROM class_students WHERE class_id = ? AND student_id = ?`,
      [classId, studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Học sinh không có trong lớp' });
    }

    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Học sinh ${student[0].full_name} đã bị xóa khỏi lớp ${classResult[0].class_name}`,
      'Info',
      classId,
      'Class'
    );

    res.json({ message: 'Xóa học sinh thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi xóa học sinh', details: err.message });
  }
});

// Cập nhật trạng thái lớp học
router.put('/:classId', authMiddleware, async (req, res) => {
  const { classId } = req.params;
  const { status } = req.body;
  const teacherId = req.user.id;

  if (!status || !['active', 'archived', 'deleted'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
  }

  try {
    const [classResult] = await req.db.query(
      `SELECT class_name FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật lớp này' });
    }

    await req.db.query(
      `UPDATE classes SET status = ? WHERE class_id = ?`,
      [status, classId]
    );

    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Lớp ${classResult[0].class_name} đã được ${status === 'archived' ? 'lưu trữ' : status === 'deleted' ? 'xóa' : 'kích hoạt'}`,
      'Info',
      classId,
      'Class'
    );

    res.json({ message: 'Cập nhật trạng thái lớp học thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi khi cập nhật trạng thái lớp', details: err.message });
  }
});

// Lấy danh sách lớp học mà học sinh đã tham gia
router.get('/my', authMiddleware, async (req, res) => {
  const studentId = req.user.id;

  try {
    const [classes] = await req.db.query(
      `SELECT 
          c.class_id,
          c.class_name,
          s.subject_name,
          c.class_code,
          c.icon,
          c.academic_year,
          c.description,
          c.status
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.class_id
       LEFT JOIN subjects s ON c.subject_id = s.subject_id
       WHERE cs.student_id = ? AND c.status = 'active'
       ORDER BY c.class_name ASC`,
      [studentId]
    );

    res.json({ myClasses: classes });
  } catch (err) {
    console.error('Lỗi lấy lớp học:', err);
    res.status(500).json({ error: 'Lỗi khi tải danh sách lớp học', details: err.message });
  }
});

module.exports = router;