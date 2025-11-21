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

// ============================================
// 📋 LẤY HOẠT ĐỘNG GẦN ĐÂY (PHẢI ĐẶT TRƯỚC /:classId)
// ============================================
router.get('/recent-activities', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;

  try {
    const activities = [];

    // 1. Bài thi mới được nộp (trong 24 giờ qua)
    const [recentSubmissions] = await req.db.query(
      `SELECT 
        e.exam_id,
        e.exam_name,
        c.class_id,
        c.class_name,
        COUNT(ea.attempt_id) as submission_count,
        MAX(ea.end_time) as latest_submission_time
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       LEFT JOIN classes c ON e.class_id = c.class_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')
         AND ea.end_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY e.exam_id, e.exam_name, c.class_id, c.class_name
       ORDER BY latest_submission_time DESC
       LIMIT 5`,
      [teacherId]
    );

    for (const submission of recentSubmissions) {
      const timeAgo = getTimeAgo(submission.latest_submission_time);
      activities.push({
        type: 'exam_submitted',
        icon: '📝',
        title: `Có ${submission.submission_count} bài thi mới được nộp`,
        content: `${submission.class_name || 'Chưa có lớp'} - ${submission.exam_name}`,
        time: timeAgo,
        timestamp: submission.latest_submission_time,
        exam_id: submission.exam_id,
        class_id: submission.class_id
      });
    }

    // 2. Học sinh mới tham gia lớp (trong 7 ngày qua)
    const [newStudents] = await req.db.query(
      `SELECT 
        c.class_id,
        c.class_name,
        COUNT(cs.student_id) as student_count,
        MAX(cs.joined_at) as latest_join_time
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.class_id
       WHERE c.teacher_id = ?
         AND cs.joined_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY c.class_id, c.class_name
       ORDER BY latest_join_time DESC
       LIMIT 5`,
      [teacherId]
    );

    for (const student of newStudents) {
      const timeAgo = getTimeAgo(student.latest_join_time);
      activities.push({
        type: 'student_joined',
        icon: '👥',
        title: `${student.student_count} học sinh mới tham gia lớp`,
        content: student.class_name,
        time: timeAgo,
        timestamp: student.latest_join_time,
        class_id: student.class_id
      });
    }

    // 3. Bài thi mới được tạo (trong 7 ngày qua)
    const [newExams] = await req.db.query(
      `SELECT 
        e.exam_id,
        e.exam_name,
        c.class_id,
        c.class_name,
        e.created_at
       FROM exams e
       LEFT JOIN classes c ON e.class_id = c.class_id
       WHERE e.teacher_id = ?
         AND e.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         AND e.status != 'deleted'
       ORDER BY e.created_at DESC
       LIMIT 5`,
      [teacherId]
    );

    for (const exam of newExams) {
      const timeAgo = getTimeAgo(exam.created_at);
      activities.push({
        type: 'exam_created',
        icon: '✨',
        title: 'Bài thi mới được tạo',
        content: `${exam.class_name || 'Chưa có lớp'} - ${exam.exam_name}`,
        time: timeAgo,
        timestamp: exam.created_at,
        exam_id: exam.exam_id,
        class_id: exam.class_id
      });
    }

    // Sắp xếp theo thời gian mới nhất
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Giới hạn 10 hoạt động gần nhất
    res.json(activities.slice(0, 10));

  } catch (err) {
    console.error('❌ Error getting recent activities:', err);
    res.status(500).json({ error: 'Lỗi khi lấy hoạt động gần đây', details: err.message });
  }
});

// Hàm helper để tính thời gian đã trôi qua
function getTimeAgo(dateTime) {
  const now = new Date();
  const past = new Date(dateTime);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} tháng trước`;
}

// Lấy danh sách lớp học của giáo viên
router.get('/', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  console.log('📋 [GET /api/teacher/classes] Request received');
  const teacherId = req.user.id || req.user.user_id;
  console.log('📋 Teacher ID:', teacherId);

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
  const { examName, examDate, examTime, duration, description, shuffle_questions, shuffle_options } = req.body;
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

    // Tạo mã code 6 số cho bài thi
    const examCode = Math.floor(100000 + Math.random() * 900000).toString();

    const [result] = await req.db.query(
      `INSERT INTO exams (exam_name, class_id, subject_id, teacher_id, start_time, duration, description, password, status, shuffle_questions, shuffle_options)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)`,
      [examName, classId, classResult[0].subject_id, teacherId, startTime, duration, description || '', examCode, 
       shuffle_questions || 0, shuffle_options || 0]
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
        description,
        exam_code: examCode
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

  console.log('🔍 [GET /:classId/exams] Request received:', {
    classId,
    classIdType: typeof classId,
    teacherId,
    teacherIdType: typeof teacherId,
    user: req.user
  });

  try {
    // Kiểm tra lớp có tồn tại không (không cần kiểm tra teacher_id trước)
    const [classCheck] = await req.db.query(
      `SELECT class_id, teacher_id, class_name FROM classes WHERE class_id = ?`,
      [classId]
    );

    console.log('🔍 [GET /:classId/exams] Class check result:', {
      found: classCheck.length > 0,
      classData: classCheck[0] || null,
      classTeacherId: classCheck[0]?.teacher_id,
      classTeacherIdType: typeof classCheck[0]?.teacher_id
    });

    if (classCheck.length === 0) {
      console.error('❌ [GET /:classId/exams] Class not found:', classId);
      return res.status(404).json({ error: 'Lớp học không tồn tại' });
    }

    // So sánh teacher_id (chuyển cả hai về cùng kiểu để so sánh)
    const classTeacherId = classCheck[0].teacher_id;
    const teacherIdNum = Number(teacherId);
    const classTeacherIdNum = Number(classTeacherId);

    console.log('🔍 [GET /:classId/exams] Permission check:', {
      teacherIdNum,
      classTeacherIdNum,
      match: teacherIdNum === classTeacherIdNum,
      stringMatch: String(teacherId) === String(classTeacherId)
    });

    if (teacherIdNum !== classTeacherIdNum && String(teacherId) !== String(classTeacherId)) {
      console.error('❌ [GET /:classId/exams] Permission denied:', {
        requestedTeacherId: teacherId,
        classTeacherId: classTeacherId,
        className: classCheck[0].class_name
      });
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
    }

    console.log('✅ [GET /:classId/exams] Permission granted, loading exams...');

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
    
    console.log('✅ [GET /:classId/exams] Exams loaded:', exams.length);
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

  console.log('🔍 [GET /:classId/students] Request received:', {
    classId,
    classIdType: typeof classId,
    teacherId,
    teacherIdType: typeof teacherId,
    user: req.user
  });

  try {
    // Kiểm tra lớp có tồn tại không (không cần kiểm tra teacher_id trước)
    const [classCheck] = await req.db.query(
      `SELECT class_id, teacher_id, class_name FROM classes WHERE class_id = ?`,
      [classId]
    );

    console.log('🔍 [GET /:classId/students] Class check result:', {
      found: classCheck.length > 0,
      classData: classCheck[0] || null,
      classTeacherId: classCheck[0]?.teacher_id,
      classTeacherIdType: typeof classCheck[0]?.teacher_id
    });

    if (classCheck.length === 0) {
      console.error('❌ [GET /:classId/students] Class not found:', classId);
      return res.status(404).json({ error: 'Lớp học không tồn tại' });
    }

    // So sánh teacher_id (chuyển cả hai về cùng kiểu để so sánh)
    const classTeacherId = classCheck[0].teacher_id;
    const teacherIdNum = Number(teacherId);
    const classTeacherIdNum = Number(classTeacherId);

    console.log('🔍 [GET /:classId/students] Permission check:', {
      teacherIdNum,
      classTeacherIdNum,
      match: teacherIdNum === classTeacherIdNum,
      stringMatch: String(teacherId) === String(classTeacherId)
    });

    if (teacherIdNum !== classTeacherIdNum && String(teacherId) !== String(classTeacherId)) {
      console.error('❌ [GET /:classId/students] Permission denied:', {
        requestedTeacherId: teacherId,
        classTeacherId: classTeacherId,
        className: classCheck[0].class_name
      });
      return res.status(403).json({ error: 'Bạn không có quyền truy cập lớp này' });
    }

    console.log('✅ [GET /:classId/students] Permission granted, loading students...');

    const [students] = await req.db.query(
      `SELECT u.user_id, u.full_name, u.email, u.username AS student_id, AVG(ea.score) as avg_score, COUNT(ea.exam_id) as exams_completed
       FROM class_students cs
       JOIN users u ON cs.student_id = u.user_id
       LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id
       WHERE cs.class_id = ?
       GROUP BY u.user_id`,
      [classId]
    );

    console.log('✅ [GET /:classId/students] Students loaded:', students.length);
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