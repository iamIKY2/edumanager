// server/routes/teacher/classes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const { createNotification } = require('../shared/helpers');

// Tạo lớp học
router.post('/', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { className, subject, subjectId, description, academicYear, icon } = req.body;
  const teacherId = req.user.id || req.user.user_id;

  if (!className) {
    return res.status(400).json({ error: 'Tên lớp là bắt buộc' });
  }

  try {
    let finalSubjectId = null;

    if (subjectId) {
      finalSubjectId = subjectId;
    } else if (subject) {
      const [subjectResult] = await req.db.query(
        `SELECT subject_id FROM subjects WHERE subject_name = ?`,
        [subject]
      );
      
      if (subjectResult.length > 0) {
        finalSubjectId = subjectResult[0].subject_id;
      } else {
        const [insertResult] = await req.db.query(
          `INSERT INTO subjects (subject_name, description, created_by) VALUES (?, ?, ?)`,
          [subject, `Môn học: ${subject}`, teacherId]
        );
        finalSubjectId = insertResult.insertId;
      }
    }

    const classCode = 'CLS' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const [result] = await req.db.query(
      `INSERT INTO classes (class_name, subject_id, teacher_id, description, academic_year, class_code, icon, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [className, finalSubjectId, teacherId, description || '', academicYear || '2024-2025', classCode, icon || '📚']
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

// Lấy danh sách lớp học của giáo viên
router.get('/', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;

  try {
    const [classes] = await req.db.query(
      `SELECT c.class_id, c.class_name, s.subject_name, c.description, c.academic_year, c.class_code, c.icon, c.status,
              COUNT(DISTINCT cs.student_id) as students,
              COUNT(DISTINCT e.exam_id) as exams,
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

// Thêm bài thi vào lớp
router.post('/:classId/exams', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { classId } = req.params;
  const { examName, examDate, examTime, duration, description } = req.body;
  const teacherId = req.user.id || req.user.user_id;

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

    let startTime;
    if (examTime) {
      startTime = `${examDate} ${examTime}:00`;
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      startTime = `${examDate} ${hours}:${minutes}:00`;
    }

    const [result] = await req.db.query(
      `INSERT INTO exams (exam_name, class_id, subject_id, teacher_id, start_time, duration, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'upcoming')`,
      [examName, classId, classResult[0].subject_id, teacherId, startTime, duration, description || '']
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
        exam_date: startTime,
        duration,
        description
      }
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi tạo bài thi', details: err.message });
  }
});

// Lấy danh sách bài thi của lớp
router.get('/:classId/exams', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { classId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    const [classResult] = await req.db.query(
      `SELECT * FROM classes WHERE class_id = ? AND teacher_id = ?`,
      [classId, teacherId]
    );

    if (classResult.length === 0) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
    }

    const query = `
      SELECT 
        e.exam_id, 
        e.exam_name AS title, 
        DATE_FORMAT(e.start_time, '%d/%m/%Y %H:%i') AS exam_date,
        e.start_time,
        e.duration, 
        e.description,
        e.class_id,
        COUNT(ea.attempt_id) as submissions,
        CASE
          WHEN e.status IN ('deleted', 'draft') THEN e.status
          WHEN NOW() < e.start_time THEN 'upcoming'
          WHEN NOW() >= e.start_time 
               AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) THEN 'active'
          ELSE 'completed'
        END AS status
      FROM exams e
      LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id
      WHERE e.class_id = ? AND e.status != 'deleted'
      GROUP BY e.exam_id, e.class_id
      ORDER BY e.start_time DESC
    `;
    
    const [exams] = await req.db.query(query, [classId]);
    
    res.json(exams);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bài thi', details: err.message });
  }
});

// Lấy danh sách học sinh trong lớp
router.get('/:classId/students', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { classId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

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
router.post('/:classId/students', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { classId } = req.params;
  const { studentId, email } = req.body;
  const teacherId = req.user.id || req.user.user_id;

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
router.delete('/:classId/students/:studentId', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { classId, studentId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

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
router.put('/:classId', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { classId } = req.params;
  const { status } = req.body;
  const teacherId = req.user.id || req.user.user_id;

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

// Lấy TẤT CẢ bài thi của giáo viên (cho tab "Tạo bài thi")
router.get('/exams/all', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;

  try {
    const query = `
      SELECT
        e.exam_id,
        e.exam_name AS title,
        e.start_time,
        e.duration,
        e.description,
        e.class_id,
        c.class_name,
        COUNT(ea.attempt_id) as submissions,
        CASE
          WHEN e.status IN ('deleted', 'draft') THEN e.status
          WHEN NOW() < e.start_time THEN 'upcoming'
          WHEN NOW() >= e.start_time 
               AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) THEN 'active'
          ELSE 'completed'
        END AS status
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.class_id
      LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id
      WHERE e.teacher_id = ? AND e.status != 'deleted'
      GROUP BY e.exam_id, e.class_id, c.class_name
      ORDER BY e.start_time DESC
    `;
    
    const [exams] = await req.db.query(query, [teacherId]);
    
    res.json(exams);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bài thi', details: err.message });
  }
});

module.exports = router;