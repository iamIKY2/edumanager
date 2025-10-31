// routes/admin.js 
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer'); 
const xlsx = require('xlsx');           
const fs = require('fs').promises;       
const { parse } = require('csv-parse'); 



// Middleware kiểm tra JWT và vai trò admin
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Không có token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'Admin') return res.status(403).json({ error: 'Không có quyền truy cập' });
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn', expired: true });
    }
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
};
const authMiddleware = authenticateToken;

// API thống kê tổng quan
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [students] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Student'");
    const [teachers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Teacher'");
    const [exams] = await db.query("SELECT COUNT(*) as count FROM exams WHERE status = 'active'");
    const [questions] = await db.query("SELECT COUNT(*) as count FROM question_bank");
    const [classes] = await db.query("SELECT COUNT(*) as count FROM classes WHERE status = 'active'");

    // Lấy dữ liệu người dùng mới theo tháng
    const [studentData] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users 
      WHERE role = 'Student' 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 10 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 10
    `);
    
    const [teacherData] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count
      FROM users 
      WHERE role = 'Teacher' 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 10 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 10
    `);

    // Tạo mảng 10 tháng gần nhất
    const months = Array.from({ length: 10 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7); 
    }).reverse();

    // Tạo mảng dữ liệu cho biểu đồ
    const studentCounts = months.map(month => {
      const record = studentData.find(row => row.month === month);
      return record ? record.count : 0;
    });

    const teacherCounts = months.map(month => {
      const record = teacherData.find(row => row.month === month);
      return record ? record.count : 0;
    });

    res.json({
      students: students[0].count,
      teachers: teachers[0].count,
      activeExams: exams[0].count,
      questions: questions[0].count,
      classes: classes[0].count,
      studentData: studentCounts,
      teacherData: teacherCounts,
      months: months // Trả về danh sách tháng để dùng cho nhãn biểu đồ
    });
  } catch (err) {
    console.error('Lỗi lấy thống kê:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API danh sách người dùng
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [users] = await db.query(`
      SELECT user_id, full_name, email, role, created_at, 'active' as status
      FROM users 
      WHERE role IN ('Student', 'Teacher', 'Admin')
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (err) {
    console.error('Lỗi lấy người dùng:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API thêm người dùng
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { full_name, email, role, username, password } = req.body;
    
    if (!full_name || !email || !role || !username || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Kiểm tra email đã tồn tại
    const [existingEmail] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email đã tồn tại' });
    }
    
    // Kiểm tra username đã tồn tại
    const [existingUsername] = await db.query("SELECT user_id FROM users WHERE username = ?", [username]);
    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username đã tồn tại' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await db.query(
      "INSERT INTO users (username, full_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [username, full_name, email, hashedPassword, role]
    );
    
    res.status(201).json({ 
      message: 'Thêm người dùng thành công', 
      user_id: result.insertId 
    });
  } catch (err) {
    console.error('Lỗi thêm người dùng:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xóa người dùng
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const userId = req.params.id;
    
    // Không cho xóa chính mình
    if (req.user.user_id == userId) {
      return res.status(400).json({ error: 'Không thể xóa chính mình' });
    }
    
    // Kiểm tra người dùng có phải Admin không
    const [user] = await db.query("SELECT role FROM users WHERE user_id = ?", [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    if (user[0].role === 'Admin') {
      return res.status(400).json({ error: 'Không thể xóa Admin' });
    }
    
    await db.query("DELETE FROM users WHERE user_id = ?", [userId]);
    res.json({ message: 'Xóa người dùng thành công' });
  } catch (err) {
    console.error('Lỗi xóa người dùng:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API danh sách lớp học
router.get('/classes', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [classes] = await db.query(`
      SELECT c.class_id, c.class_name, c.class_code, c.icon, c.status, 
             s.subject_name, u.full_name as teacher_name,
             (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.class_id) as student_count
      FROM classes c
      LEFT JOIN subjects s ON c.subject_id = s.subject_id
      LEFT JOIN users u ON c.teacher_id = u.user_id
      WHERE c.status = 'active'
      ORDER BY c.created_at DESC
    `);
    res.json(classes);
  } catch (err) {
    console.error('Lỗi lấy lớp học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xóa lớp học
router.delete('/classes/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const classId = req.params.id;
    
    // Cập nhật status thành deleted thay vì xóa hẳn
    await db.query("UPDATE classes SET status = 'deleted' WHERE class_id = ?", [classId]);
    
    res.json({ message: 'Xóa lớp học thành công' });
  } catch (err) {
    console.error('Lỗi xóa lớp học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API danh sách kỳ thi
router.get('/exams', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [exams] = await db.query(`
      SELECT e.exam_id, e.exam_name, s.subject_name, u.full_name as teacher_name, 
             e.duration, e.status, 
             (SELECT COUNT(*) FROM exam_classes ec WHERE ec.exam_id = e.exam_id) as student_count
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.subject_id
      LEFT JOIN users u ON e.teacher_id = u.user_id
      ORDER BY e.created_at DESC
    `);
    res.json(exams);
  } catch (err) {
    console.error('Lỗi lấy kỳ thi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API thêm kỳ thi
router.post('/exams', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { exam_name, subject_id, duration } = req.body;
    
    if (!exam_name || !subject_id || !duration) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    const [result] = await db.query(
      "INSERT INTO exams (exam_name, subject_id, teacher_id, duration, status) VALUES (?, ?, ?, ?, 'upcoming')",
      [exam_name, subject_id, req.user.user_id, duration]
    );
    
    res.status(201).json({ 
      message: 'Tạo kỳ thi thành công', 
      exam_id: result.insertId 
    });
  } catch (err) {
    console.error('Lỗi tạo kỳ thi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xóa kỳ thi
router.delete('/exams/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const examId = req.params.id;
    
    // Cập nhật status thành deleted thay vì xóa hẳn
    await db.query("UPDATE exams SET status = 'deleted' WHERE exam_id = ?", [examId]);
    res.json({ message: 'Xóa kỳ thi thành công' });
  } catch (err) {
    console.error('Lỗi xóa kỳ thi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API danh sách câu hỏi
router.get('/questions', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [questions] = await db.query(`
      SELECT q.question_id, q.question_content, s.subject_name, q.difficulty, 
             q.question_type as type, 
             COALESCE(ROUND((qs.correct_attempts / NULLIF(qs.total_attempts, 0) * 100), 0), 0) as correct_rate
      FROM question_bank q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
      LEFT JOIN question_statistics qs ON q.question_id = qs.question_id
      ORDER BY q.created_at DESC
    `);
    res.json(questions);
  } catch (err) {
    console.error('Lỗi lấy câu hỏi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API thêm câu hỏi
router.post('/questions', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { question_content, subject_id, difficulty, question_type } = req.body;
    
    if (!question_content || !subject_id || !difficulty || !question_type) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    const [result] = await db.query(
      "INSERT INTO question_bank (question_content, subject_id, difficulty, question_type, teacher_id) VALUES (?, ?, ?, ?, ?)",
      [question_content, subject_id, difficulty, question_type, req.user.user_id]
    );
    
    res.status(201).json({ 
      message: 'Thêm câu hỏi thành công', 
      question_id: result.insertId 
    });
  } catch (err) {
    console.error('Lỗi thêm câu hỏi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xóa câu hỏi
router.delete('/questions/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const questionId = req.params.id;
    
    // Xóa đáp án trước
    await db.query("DELETE FROM question_options WHERE question_id = ?", [questionId]);
    
    // Xóa câu hỏi
    await db.query("DELETE FROM question_bank WHERE question_id = ?", [questionId]);
    
    res.json({ message: 'Xóa câu hỏi thành công' });
  } catch (err) {
    console.error('Lỗi xóa câu hỏi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API danh sách môn học
router.get('/subjects', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [subjects] = await db.query(`
      SELECT s.subject_id, s.subject_name, 
             COALESCE((SELECT COUNT(*) FROM question_bank qb WHERE qb.subject_id = s.subject_id), 0) as question_count,
             COALESCE((SELECT COUNT(*) FROM exams e WHERE e.subject_id = s.subject_id), 0) as exam_count,
             'active' as status
      FROM subjects s
      ORDER BY s.subject_name
    `);
    res.json(subjects);
  } catch (err) {
    console.error('Lỗi lấy môn học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API thêm môn học
router.post('/subjects', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { subject_name } = req.body;
    
    if (!subject_name) {
      return res.status(400).json({ error: 'Thiếu tên môn học' });
    }
    
    // Kiểm tra môn học đã tồn tại
    const [existing] = await db.query("SELECT subject_id FROM subjects WHERE subject_name = ?", [subject_name]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Môn học đã tồn tại' });
    }
    
    const [result] = await db.query(
      "INSERT INTO subjects (subject_name, created_by) VALUES (?, ?)",
      [subject_name, req.user.user_id]
    );
    
    res.status(201).json({ 
      message: 'Thêm môn học thành công', 
      subject_id: result.insertId 
    });
  } catch (err) {
    console.error('Lỗi thêm môn học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xóa môn học
router.delete('/subjects/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const subjectId = req.params.id;
    
    // Kiểm tra môn học có kỳ thi hoặc câu hỏi không
    const [exams] = await db.query("SELECT COUNT(*) as count FROM exams WHERE subject_id = ?", [subjectId]);
    const [questions] = await db.query("SELECT COUNT(*) as count FROM question_bank WHERE subject_id = ?", [subjectId]);
    
    if (exams[0].count > 0 || questions[0].count > 0) {
      return res.status(400).json({ error: 'Không thể xóa môn học đã có kỳ thi hoặc câu hỏi' });
    }
    
    await db.query("DELETE FROM subjects WHERE subject_id = ?", [subjectId]);
    res.json({ message: 'Xóa môn học thành công' });
  } catch (err) {
    console.error('Lỗi xóa môn học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API báo cáo - FIXED (Sửa SQL Injection và GROUP BY)
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const period = req.query.period || 'month';
    
    // Sử dụng mapping an toàn thay vì ghép string
    const intervalMap = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    
    const days = intervalMap[period] || 30;
    
    const [examStats] = await db.query(`
      SELECT COALESCE(COUNT(*), 0) as total_exams, 
             COALESCE(AVG(score), 0) as average_score,
             COALESCE(SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100, 0) as completion_rate,
             COALESCE((SELECT COUNT(*) FROM anti_cheating_logs acl 
                       WHERE acl.event_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)), 0) as cheating_warnings
      FROM exam_attempts 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [days, days]);
    
    const [examDetails] = await db.query(`
      SELECT e.exam_name, 
             COALESCE(COUNT(ea.attempt_id), 0) as student_count, 
             COALESCE(AVG(ea.score), 0) as average_score,
             COALESCE(MAX(ea.score), 0) as highest_score,
             COALESCE(MIN(ea.score), 0) as lowest_score,
             (SELECT COUNT(*) FROM anti_cheating_logs acl 
              INNER JOIN exam_attempts ea2 ON acl.attempt_id = ea2.attempt_id
              WHERE ea2.exam_id = e.exam_id 
              AND ea2.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)) as cheating_warnings,
             COALESCE(SUM(CASE WHEN ea.status = 'Submitted' THEN 1 ELSE 0 END) / NULLIF(COUNT(ea.attempt_id), 0) * 100, 0) as completion_rate
      FROM exams e
      LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id 
        AND ea.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY e.exam_id, e.exam_name
      HAVING student_count > 0
    `, [days, days]);
    
    res.json({
      stats: examStats[0],
      details: examDetails
    });
  } catch (err) {
    console.error('Lỗi lấy báo cáo:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// Trong server/routes/admin.js
router.get('/subjects/:id/details', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const subjectId = req.params.id;

    // Lấy thông tin môn học
    const [subject] = await db.query('SELECT subject_name FROM subjects WHERE subject_id = ?', [subjectId]);
    if (!subject[0]) return res.status(404).json({ error: 'Không tìm thấy môn học' });

    // Lấy giáo viên chủ nhiệm
    const [teacher] = await db.query(`
      SELECT u.full_name, u.user_id
      FROM users u
      JOIN classes c ON c.teacher_id = u.user_id
      WHERE c.subject_id = ? AND u.role = 'Teacher'
      LIMIT 1
    `, [subjectId]);

    // Lấy danh sách sinh viên và điểm trung bình
    const [students] = await db.query(`
      SELECT u.user_id, u.full_name, u.email, 
             COALESCE(AVG(ea.score), 0) as avg_score
      FROM users u
      JOIN class_students cs ON cs.student_id = u.user_id
      JOIN classes c ON cs.class_id = c.class_id
      LEFT JOIN exam_attempts ea ON ea.student_id = u.user_id
      LEFT JOIN exams e ON ea.exam_id = e.exam_id AND e.subject_id = c.subject_id
      WHERE c.subject_id = ? AND u.role = 'Student'
      GROUP BY u.user_id, u.full_name, u.email
    `, [subjectId]);

    // Ép kiểu avg_score thành số
    const formattedStudents = students.map(student => ({
      ...student,
      avg_score: Number(student.avg_score) || 0
    }));

    // Tính thống kê điểm
    const [stats] = await db.query(`
      SELECT 
        COALESCE(AVG(ea.score), 0) as avg_score, 
        COALESCE(MAX(ea.score), 0) as max_score, 
        COALESCE(MIN(ea.score), 0) as min_score
      FROM exams e
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.exam_id
      WHERE e.subject_id = ?
    `, [subjectId]);

    res.json({
      subject_name: subject[0].subject_name,
      teacher: teacher[0] || { full_name: 'Chưa có giáo viên', user_id: null },
      students: formattedStudents,
      stats: {
        avg_score: Number(stats[0].avg_score) || 0,
        max_score: Number(stats[0].max_score) || 0,
        min_score: Number(stats[0].min_score) || 0
      },
      student_count: formattedStudents.length
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết môn học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// Cấu hình multer với giới hạn 10MB
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

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

// API giám sát gian lận toàn hệ thống
router.get('/monitor/cheating', authMiddleware, async (req, res) => {
  const { role, id: admin_id } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const [logs] = await req.db.query(
      `SELECT acl.log_id, acl.attempt_id, acl.event_type, acl.event_description, acl.event_time,
              e.exam_name, u.full_name AS student_name, u.user_id AS student_id,
              t.full_name AS teacher_name, c.class_name
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       JOIN classes c ON e.class_id = c.class_id
       JOIN users t ON e.teacher_id = t.user_id
       ORDER BY acl.event_time DESC`
    );

    res.json({ logs });
  } catch (err) {
    console.error('Lỗi lấy log gian lận:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API báo cáo tổng hợp gian lận
router.get('/monitor/cheating/stats', authMiddleware, async (req, res) => {
  const { role } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const [stats] = await req.db.query(
      `SELECT 
         event_type,
         COUNT(*) AS count,
         COUNT(DISTINCT ea.student_id) AS unique_students,
         COUNT(DISTINCT ea.exam_id) AS unique_exams
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       GROUP BY event_type`
    );

    const [topViolators] = await req.db.query(
      `SELECT 
         u.full_name,
         u.user_id,
         COUNT(*) AS violation_count
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN users u ON ea.student_id = u.user_id
       GROUP BY u.user_id
       ORDER BY violation_count DESC
       LIMIT 5`
    );

    res.json({ stats, topViolators });
  } catch (err) {
    console.error('Lỗi lấy thống kê gian lận:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xuất báo cáo CSV
router.get('/monitor/cheating/export', authMiddleware, async (req, res) => {
  const { role } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const [logs] = await req.db.query(
      `SELECT acl.log_id, acl.event_type, acl.event_description, acl.event_time,
              e.exam_name, u.full_name AS student_name, c.class_name
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       JOIN classes c ON e.class_id = c.class_id
       ORDER BY acl.event_time DESC`
    );

    const csvData = [
      ['Log ID', 'Event Type', 'Description', 'Time', 'Exam', 'Student', 'Class'],
      ...logs.map(log => [
        log.log_id,
        log.event_type,
        log.event_description,
        log.event_time,
        log.exam_name,
        log.student_name,
        log.class_name
      ])
    ].map(row => row.join(',')).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('cheating_logs.csv');
    res.send(csvData);
  } catch (err) {
    console.error('Lỗi xuất CSV:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API admin cấm thi hoặc trừ điểm
router.post('/penalize', authMiddleware, async (req, res) => {
  const { attempt_id, action, points_deducted, reason } = req.body;
  const { role, id: admin_id } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  if (!['ban', 'deduct_points'].includes(action)) {
    return res.status(400).json({ error: 'Hành động không hợp lệ' });
  }

  try {
    const [attempt] = await req.db.query(
      `SELECT ea.exam_id, ea.student_id, e.exam_name, e.teacher_id, u.full_name
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       WHERE ea.attempt_id = ?`,
      [attempt_id]
    );

    if (!attempt.length) {
      return res.status(404).json({ error: 'Lượt thi không tồn tại' });
    }

    if (action === 'ban') {
      await req.db.query(
        'UPDATE exam_attempts SET is_banned = 1, status = "AutoSubmitted" WHERE attempt_id = ?',
        [attempt_id]
      );
      await req.db.query(
        'INSERT INTO admin_logs (admin_id, action_type, details, created_at) VALUES (?, ?, ?, NOW())',
        [admin_id, 'review_cheating', `Cấm thi: ${reason || 'Vi phạm quy định thi'}`]
      );
      req.io.to(`user_${attempt[0].student_id}`).emit('exam_banned', {
        exam_id: attempt[0].exam_id,
        reason: reason || 'Vi phạm quy định thi'
      });
      await createNotification(
        req.db,
        req.io,
        attempt[0].student_id,
        `Bạn đã bị cấm thi "${attempt[0].exam_name}" vì: ${reason || 'Vi phạm quy định thi'}`,
        'Warning',
        attempt[0].exam_id,
        'Exam'
      );
      await createNotification(
        req.db,
        req.io,
        attempt[0].teacher_id,
        `Admin đã cấm học sinh ${attempt[0].full_name} khỏi kỳ thi "${attempt[0].exam_name}"`,
        'Info',
        attempt[0].exam_id,
        'Exam'
      );
    } else if (action === 'deduct_points') {
      if (!points_deducted || points_deducted < 0) {
        return res.status(400).json({ error: 'Số điểm trừ không hợp lệ' });
      }
      await req.db.query(
        'UPDATE exam_attempts SET penalty_points = penalty_points + ?, cheating_detected = 1 WHERE attempt_id = ?',
        [points_deducted, attempt_id]
      );
      await req.db.query(
        'INSERT INTO admin_logs (admin_id, action_type, details, created_at) VALUES (?, ?, ?, NOW())',
        [admin_id, 'edit_score', `Trừ ${points_deducted} điểm: ${reason || 'Vi phạm quy định thi'}`]
      );
      req.io.to(`user_${attempt[0].student_id}`).emit('points_deducted', {
        exam_id: attempt[0].exam_id,
        points_deducted,
        reason: reason || 'Vi phạm quy định thi'
      });
      await createNotification(
        req.db,
        req.io,
        attempt[0].student_id,
        `Bạn đã bị trừ ${points_deducted} điểm trong kỳ thi "${attempt[0].exam_name}" vì: ${reason || 'Vi phạm quy định thi'}`,
        'Warning',
        attempt[0].exam_id,
        'Exam'
      );
      await createNotification(
        req.db,
        req.io,
        attempt[0].teacher_id,
        `Admin đã trừ ${points_deducted} điểm của học sinh ${attempt[0].full_name} trong kỳ thi "${attempt[0].exam_name}"`,
        'Info',
        attempt[0].exam_id,
        'Exam'
      );
    }

    res.json({ message: `Đã ${action === 'ban' ? 'cấm' : 'trừ điểm'} thành công` });
  } catch (err) {
    console.error('Lỗi xử lý hành vi gian lận:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API hủy hành động của giáo viên
router.post('/undo-teacher-action', authMiddleware, async (req, res) => {
  const { action_id } = req.body;
  const { role, id: admin_id } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const [action] = await req.db.query(
      `SELECT ta.action_type, ta.exam_id, ta.student_id, e.exam_name, ta.details
       FROM teacher_actions ta
       JOIN exams e ON ta.exam_id = e.exam_id
       WHERE ta.action_id = ?`,
      [action_id]
    );

    if (!action.length) {
      return res.status(404).json({ error: 'Hành động không tồn tại' });
    }

    if (action[0].action_type === 'ban_student') {
      await req.db.query(
        'UPDATE exam_attempts SET is_banned = 0 WHERE exam_id = ? AND student_id = ?',
        [action[0].exam_id, action[0].student_id]
      );
    } else if (action[0].action_type === 'edit_score') {
      const points = parseFloat(action[0].details.match(/Trừ (\d+\.?\d*) điểm/)?.[1]) || 0;
      await req.db.query(
        'UPDATE exam_attempts SET penalty_points = penalty_points - ? WHERE exam_id = ? AND student_id = ?',
        [points, action[0].exam_id, action[0].student_id]
      );
    }

    await req.db.query(
      'INSERT INTO admin_logs (admin_id, action_type, details, created_at) VALUES (?, ?, ?, NOW())',
      [admin_id, 'review_cheating', `Hủy hành động giáo viên: ${action[0].details}`]
    );

    await createNotification(
      req.db,
      req.io,
      action[0].student_id,
      `Hành động "${action[0].action_type}" trong kỳ thi "${action[0].exam_name}" đã được admin hủy`,
      'Info',
      action[0].exam_id,
      'Exam'
    );

    res.json({ message: 'Hủy hành động thành công' });
  } catch (err) {
    console.error('Lỗi hủy hành động:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API import Excel/CSV
router.post('/questions/import', authMiddleware, upload.single('file'), async (req, res) => {
  const { exam_id } = req.body;
  const { role, id: teacher_id } = req.user;

  if (!['Teacher', 'Admin'].includes(role)) {
    return res.status(403).json({ error: 'Chỉ giáo viên hoặc admin có quyền nhập câu hỏi' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Vui lòng tải lên file Excel hoặc CSV' });
  }

  try {
    // Kiểm tra quyền truy cập kỳ thi
    if (exam_id && role === 'Teacher') {
      const [exam] = await req.db.query(
        'SELECT exam_name FROM exams WHERE exam_id = ? AND teacher_id = ?',
        [exam_id, teacher_id]
      );
      if (!exam.length) {
        return res.status(403).json({ error: 'Bạn không có quyền thêm câu hỏi vào kỳ thi này' });
      }
    }

    let questions = [];
    const filePath = req.file.path;
    const fileType = req.file.mimetype.includes('csv') ? 'CSV' : 'Excel';

    // Xử lý file Excel
    if (fileType === 'Excel') {
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      questions = xlsx.utils.sheet_to_json(sheet);
    }
    // Xử lý file CSV
    else if (fileType === 'CSV') {
      const csvData = await fs.readFile(filePath);
      questions = await new Promise((resolve, reject) => {
        parse(csvData, { columns: true, trim: true }, (err, output) => {
          if (err) reject(err);
          resolve(output);
        });
      });
    } else {
      await fs.unlink(filePath);
      return res.status(400).json({ error: 'Định dạng file không được hỗ trợ (chỉ hỗ trợ Excel hoặc CSV)' });
    }

    await fs.unlink(filePath);

    // Ghi log import
    const [importLog] = await req.db.query(
      'INSERT INTO import_logs (teacher_id, file_name, file_type, import_type, status) VALUES (?, ?, ?, ?, ?)',
      [teacher_id, req.file.originalname, fileType, 'Questions', 'Pending']
    );
    const import_id = importLog.insertId;

    const errors = [];
    const insertedQuestions = [];

    for (const [index, q] of questions.entries()) {
      const question_content = q['question_content'] || q['Câu hỏi'] || q['Question'];
      const subject_id = q['subject_id'] || q['Môn học'];
      const difficulty = q['difficulty'] || q['Độ khó'] || 'Medium';
      const question_type = q['question_type'] || q['Loại câu hỏi'] || 'SingleChoice';
      const correct_answer_text = q['correct_answer_text'] || q['Đáp án đúng'];
      const options = [
        q['option_1'] || q['Đáp án 1'],
        q['option_2'] || q['Đáp án 2'],
        q['option_3'] || q['Đáp án 3'],
        q['option_4'] || q['Đáp án 4']
      ].filter(opt => opt);

      if (!question_content || !subject_id || !correct_answer_text) {
        errors.push(`Dòng ${index + 2}: Thiếu thông tin bắt buộc (câu hỏi, môn học, đáp án đúng)`);
        continue;
      }

      const [existing] = await req.db.query(
        'SELECT question_id FROM question_bank WHERE question_content = ? AND subject_id = ?',
        [question_content, subject_id]
      );
      if (existing.length) {
        errors.push(`Dòng ${index + 2}: Câu hỏi "${question_content}" đã tồn tại`);
        continue;
      }

      const [result] = await req.db.query(
        'INSERT INTO question_bank (subject_id, teacher_id, question_content, question_type, difficulty, correct_answer_text, import_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [subject_id, teacher_id, question_content, question_type, difficulty, correct_answer_text, import_id]
      );
      const question_id = result.insertId;

      if (question_type !== 'FillInBlank' && question_type !== 'Essay') {
        const optionValues = options.map((content, idx) => [
          question_id,
          content,
          correct_answer_text.includes(String(idx + 1)) || (question_type === 'SingleChoice' && correct_answer_text === String(idx + 1))
        ]);
        await req.db.query(
          'INSERT INTO question_options (question_id, option_content, is_correct) VALUES ?',
          [optionValues]
        );
      }

      if (exam_id) {
        await req.db.query(
          'INSERT INTO exam_questions (exam_id, question_id, question_order, points) VALUES (?, ?, ?, ?)',
          [exam_id, question_id, insertedQuestions.length + 1, 1.00]
        );
      }

      insertedQuestions.push({ question_id, question_content });
    }

    await req.db.query(
      'UPDATE import_logs SET status = ?, error_message = ? WHERE import_id = ?',
      [errors.length ? 'Failed' : 'Success', errors.length ? errors.join('; ') : null, import_id]
    );

    if (insertedQuestions.length && exam_id) {
      const [exam] = await req.db.query('SELECT exam_name FROM exams WHERE exam_id = ?', [exam_id]);
      await createNotification(
        req.db,
        req.io,
        teacher_id,
        `Đã nhập ${insertedQuestions.length} câu hỏi vào kỳ thi "${exam[0].exam_name}"`,
        'Info',
        exam_id,
        'Exam'
      );
    }

    res.json({
      message: `Nhập thành công ${insertedQuestions.length} câu hỏi`,
      errors: errors.length ? errors : undefined,
      questions: insertedQuestions
    });
  } catch (err) {
    console.error('Lỗi import câu hỏi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});


module.exports = router;