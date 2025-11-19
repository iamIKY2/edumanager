// routes/admin.js 
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer'); 
const xlsx = require('xlsx');           
const fs = require('fs').promises;       
const { parse } = require('csv-parse');
const { generateAdminReport } = require('../../services/pdfService'); 



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

const computeExamStatus = (exam) => {
  if (!exam) return 'upcoming';

  const rawStatus = exam.status || '';
  const normalizedStatus = rawStatus.toLowerCase();
  if (['deleted', 'draft', 'cancelled'].includes(normalizedStatus)) {
    return rawStatus || normalizedStatus;
  }

  const startTime = exam.start_time ? new Date(exam.start_time) : null;
  if (!startTime || Number.isNaN(startTime.getTime())) {
    return rawStatus || 'upcoming';
  }

  const durationMinutes = Number(exam.duration);
  const now = new Date();

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return now < startTime ? 'upcoming' : 'completed';
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  if (now < startTime) return 'upcoming';
  if (now >= startTime && now < endTime) return 'active';
  return 'completed';
};

const formatDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const parseReportFilters = (query) => {
  const intervalMap = { week: 7, month: 30, quarter: 90, year: 365 };
  const period = query.period && intervalMap[query.period] ? query.period : 'month';
  const subjectId = query.subject_id ? parseInt(query.subject_id, 10) : null;

  let startDate;
  let endDate;
  let days = intervalMap[period] || 30;

  if (query.period === 'custom') {
    const start = new Date(query.start_date);
    const end = new Date(query.end_date || query.start_date);
    if (!(start instanceof Date) || Number.isNaN(start.getTime()) || !(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new Error('Invalid custom date range');
    }
    startDate = start;
    endDate = new Date(end.getTime());
    endDate.setHours(23, 59, 59, 999);
    days = null;
  } else {
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    startDate = new Date(endDate.getTime());
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
  }

  return {
    period: query.period || period,
    subjectId: Number.isFinite(subjectId) ? subjectId : null,
    days,
    startDate,
    endDate,
    startDateStr: formatDateTime(startDate),
    endDateStr: formatDateTime(endDate)
  };
};

const buildSubjectClause = (alias, subjectId) => (subjectId ? ` AND ${alias}.subject_id = ?` : '');

const buildReportData = async (db, filters) => {
  const { startDateStr, endDateStr, subjectId, days } = filters;
  const mainSubjectClause = buildSubjectClause('e', subjectId);
  const subjectClauseForAttempts = buildSubjectClause('e2', subjectId);

  const statsParams = [
    startDateStr,
    endDateStr,
    ...(subjectId ? [subjectId] : []),
    startDateStr,
    endDateStr,
    ...(subjectId ? [subjectId] : []),
    startDateStr,
    endDateStr,
    ...(subjectId ? [subjectId] : [])
  ];

  const [statsRows] = await db.query(
    `SELECT 
       COUNT(DISTINCT ea.exam_id) AS total_exams,
       COUNT(*) AS total_attempts,
       COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) AS average_score,
       COALESCE(SUM(CASE WHEN ea.status = 'Submitted' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100, 0) AS completion_rate,
       (SELECT COUNT(*)
          FROM anti_cheating_logs acl
          JOIN exam_attempts ea2 ON acl.attempt_id = ea2.attempt_id
          JOIN exams e2 ON ea2.exam_id = e2.exam_id
         WHERE ea2.created_at BETWEEN ? AND ?
           ${subjectClauseForAttempts}) AS cheating_warnings,
       (SELECT COUNT(DISTINCT ea2.student_id)
          FROM anti_cheating_logs acl2
          JOIN exam_attempts ea2 ON acl2.attempt_id = ea2.attempt_id
          JOIN exams e3 ON ea2.exam_id = e3.exam_id
         WHERE ea2.created_at BETWEEN ? AND ?
           ${buildSubjectClause('e3', subjectId)}) AS violating_students
     FROM exam_attempts ea
     JOIN exams e ON ea.exam_id = e.exam_id
    WHERE ea.created_at BETWEEN ? AND ?
      ${mainSubjectClause}`,
    statsParams
  );

  const stats = statsRows[0] || {
    total_exams: 0,
    total_attempts: 0,
    average_score: 0,
    completion_rate: 0,
    cheating_warnings: 0,
    violating_students: 0
  };

  let scoreTrendDiff = 0;
  let completionTrendDiff = 0;

  if (days) {
    const previousEnd = new Date(filters.startDate);
    previousEnd.setSeconds(previousEnd.getSeconds() - 1);
    const previousStart = new Date(previousEnd.getTime());
    previousStart.setDate(previousStart.getDate() - (days - 1));
    previousStart.setHours(0, 0, 0, 0);

    const [prevRows] = await db.query(
      `SELECT 
         COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) AS prev_average_score,
         COALESCE(SUM(CASE WHEN ea.status = 'Submitted' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0) * 100, 0) AS prev_completion_rate
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
      WHERE ea.created_at BETWEEN ? AND ?
        ${mainSubjectClause}`,
      [
        formatDateTime(previousStart),
        formatDateTime(previousEnd),
        ...(subjectId ? [subjectId] : [])
      ]
    );

    const prevStats = prevRows[0] || {};
    scoreTrendDiff = stats.average_score - (prevStats.prev_average_score || 0);
    completionTrendDiff = stats.completion_rate - (prevStats.prev_completion_rate || 0);
  }

  stats.score_trend = scoreTrendDiff;
  stats.completion_trend = completionTrendDiff;

  const baseParams = [startDateStr, endDateStr, ...(subjectId ? [subjectId] : [])];

  const [trend] = await db.query(
  `SELECT 
     DATE(ea.created_at) AS date,
     DATE_FORMAT(DATE(ea.created_at), '%d/%m') AS label,
     COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) AS avg_score
   FROM exam_attempts ea
   JOIN exams e ON ea.exam_id = e.exam_id
  WHERE ea.created_at BETWEEN ? AND ?
    ${mainSubjectClause}
    AND ea.status = 'Submitted'
  GROUP BY DATE(ea.created_at), DATE_FORMAT(DATE(ea.created_at), '%d/%m')
  ORDER BY date ASC`,
  baseParams
);

  const [gradeDistribution] = await db.query(
    `SELECT 
       CASE 
         WHEN ea.score >= 8 THEN 'Xuất sắc'
         WHEN ea.score >= 6.5 THEN 'Khá'
         WHEN ea.score >= 5 THEN 'Trung bình'
         ELSE 'Yếu'
       END AS grade,
       COUNT(*) AS count
     FROM exam_attempts ea
     JOIN exams e ON ea.exam_id = e.exam_id
    WHERE ea.created_at BETWEEN ? AND ?
      ${mainSubjectClause}
      AND ea.status = 'Submitted'
      AND ea.score IS NOT NULL
    GROUP BY grade`,
    baseParams
  );

  const subjectComparisonQuery = subjectId
    ? `SELECT 
         s.subject_id,
         s.subject_name,
         COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) AS avg_score,
         COUNT(DISTINCT CASE WHEN ea.status = 'Submitted' THEN ea.student_id END) AS student_count
       FROM subjects s
       JOIN exams e ON s.subject_id = e.subject_id
       JOIN exam_attempts ea ON e.exam_id = ea.exam_id
      WHERE ea.created_at BETWEEN ? AND ?
        AND s.subject_id = ?
        AND ea.status = 'Submitted'
      GROUP BY s.subject_id, s.subject_name
      ORDER BY avg_score DESC`
    : `SELECT 
         s.subject_id,
         s.subject_name,
         COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) AS avg_score,
         COUNT(DISTINCT CASE WHEN ea.status = 'Submitted' THEN ea.student_id END) AS student_count
       FROM subjects s
       JOIN exams e ON s.subject_id = e.subject_id
       JOIN exam_attempts ea ON e.exam_id = ea.exam_id
      WHERE ea.created_at BETWEEN ? AND ?
        AND ea.status = 'Submitted'
      GROUP BY s.subject_id, s.subject_name
      HAVING student_count > 0
      ORDER BY avg_score DESC`;

  const subjectComparisonParams = subjectId
    ? [startDateStr, endDateStr, subjectId]
    : [startDateStr, endDateStr];

  const [subjectComparison] = await db.query(subjectComparisonQuery, subjectComparisonParams);

  const [topStudents] = await db.query(
    `SELECT 
       u.user_id,
       u.full_name,
       COALESCE(AVG(ea.score), 0) AS avg_score,
       COUNT(DISTINCT ea.exam_id) AS exam_count
     FROM users u
     JOIN exam_attempts ea ON u.user_id = ea.student_id
     JOIN exams e ON ea.exam_id = e.exam_id
    WHERE ea.created_at BETWEEN ? AND ?
      ${mainSubjectClause}
      AND ea.status = 'Submitted'
      AND u.role = 'Student'
    GROUP BY u.user_id, u.full_name
    HAVING exam_count >= 2
    ORDER BY avg_score DESC
    LIMIT 10`,
    baseParams
  );

  const [warningStudents] = await db.query(
    `SELECT 
       u.user_id,
       u.full_name,
       COALESCE(AVG(ea.score), 0) AS avg_score,
       COUNT(DISTINCT acl.log_id) AS warning_count
     FROM users u
     JOIN exam_attempts ea ON u.user_id = ea.student_id
     JOIN exams e ON ea.exam_id = e.exam_id
     LEFT JOIN anti_cheating_logs acl ON ea.attempt_id = acl.attempt_id
    WHERE ea.created_at BETWEEN ? AND ?
      ${mainSubjectClause}
      AND ea.status = 'Submitted'
      AND u.role = 'Student'
    GROUP BY u.user_id, u.full_name
    HAVING avg_score < 5 OR warning_count > 0
    ORDER BY avg_score ASC, warning_count DESC
    LIMIT 10`,
    baseParams
  );

  const [details] = await db.query(
    `SELECT 
       e.exam_id,
       e.exam_name,
       s.subject_name,
       COUNT(DISTINCT ea.student_id) AS student_count,
       COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) AS average_score,
       COALESCE(MAX(ea.score), 0) AS highest_score,
       COALESCE(MIN(ea.score), 0) AS lowest_score,
       COALESCE(SUM(CASE WHEN ea.status = 'Submitted' THEN 1 ELSE 0 END) / NULLIF(COUNT(ea.attempt_id), 0) * 100, 0) AS completion_rate,
       (SELECT COUNT(*)
          FROM anti_cheating_logs acl
          JOIN exam_attempts ea2 ON acl.attempt_id = ea2.attempt_id
         WHERE ea2.exam_id = e.exam_id
           AND ea2.created_at BETWEEN ? AND ?) AS cheating_warnings
     FROM exams e
     LEFT JOIN subjects s ON e.subject_id = s.subject_id
     LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id
       AND ea.created_at BETWEEN ? AND ?
    WHERE e.created_at <= ?
      ${subjectId ? ' AND e.subject_id = ?' : ''}
    GROUP BY e.exam_id, e.exam_name, s.subject_name
    HAVING student_count > 0
    ORDER BY e.created_at DESC`,
    [
      startDateStr,
      endDateStr,
      startDateStr,
      endDateStr,
      endDateStr,
      ...(subjectId ? [subjectId] : [])
    ]
  );

  // Lịch sử sửa điểm
  const [scoreHistory] = await db.query(
    `SELECT 
       sal.log_id,
       sal.attempt_id,
       sal.old_score,
       sal.new_score,
       sal.old_total_score,
       sal.new_total_score,
       sal.reason,
       sal.edited_at,
       u.full_name as teacher_name,
       e.exam_name,
       s.subject_name,
       st.full_name as student_name,
       qb.question_content
     FROM score_audit_logs sal
     JOIN exam_attempts ea ON sal.attempt_id = ea.attempt_id
     JOIN exams e ON ea.exam_id = e.exam_id
     LEFT JOIN subjects s ON e.subject_id = s.subject_id
     LEFT JOIN users u ON sal.edited_by = u.user_id
     LEFT JOIN users st ON ea.student_id = st.user_id
     LEFT JOIN question_bank qb ON sal.question_id = qb.question_id
     WHERE sal.edited_at BETWEEN ? AND ?
       ${subjectId ? ' AND e.subject_id = ?' : ''}
     ORDER BY sal.edited_at DESC
     LIMIT 100`,
    [
      startDateStr,
      endDateStr,
      ...(subjectId ? [subjectId] : [])
    ]
  );

  // Lịch sử khiếu nại
  const [complaintsHistory] = await db.query(
    `SELECT 
       c.complaint_id,
       c.exam_id,
       c.student_id,
       c.content,
       c.status,
       c.teacher_response,
       c.created_at,
       c.updated_at,
       e.exam_name,
       s.subject_name,
       st.full_name as student_name,
       st.email as student_email,
       t.full_name as teacher_name
     FROM complaints c
     JOIN exams e ON c.exam_id = e.exam_id
     LEFT JOIN subjects s ON e.subject_id = s.subject_id
     LEFT JOIN users st ON c.student_id = st.user_id
     LEFT JOIN users t ON e.teacher_id = t.user_id
     WHERE c.created_at BETWEEN ? AND ?
       ${subjectId ? ' AND e.subject_id = ?' : ''}
     ORDER BY c.created_at DESC
     LIMIT 100`,
    [
      startDateStr,
      endDateStr,
      ...(subjectId ? [subjectId] : [])
    ]
  );

  return {
    stats,
    trend,
    gradeDistribution,
    subjectComparison,
    topStudents,
    warningStudents,
    details,
    scoreHistory,
    complaintsHistory
  };
};

// API thống kê tổng quan
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    
    // Đếm số lượng sinh viên
    const [studentsResult] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Student'"
    );
    const students = studentsResult[0]?.count || 0;
    
    // Đếm số lượng giáo viên
    const [teachersResult] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'Teacher'"
    );
    const teachers = teachersResult[0]?.count || 0;
    
    // Đếm số lượng kỳ thi đang hoạt động
    const [examsResult] = await db.query(
      "SELECT COUNT(*) as count FROM exams WHERE status IN ('upcoming', 'active', 'in_progress')"
    );
    const activeExams = examsResult[0]?.count || 0;
    
    // Đếm số lượng câu hỏi
    const [questionsResult] = await db.query(
      "SELECT COUNT(*) as count FROM question_bank"
    );
    const questions = questionsResult[0]?.count || 0;
    
    res.json({
      students,
      teachers,
      activeExams,
      questions
    });
  } catch (err) {
    console.error('Lỗi lấy thống kê:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API lấy dữ liệu biểu đồ cho dashboard
router.get('/dashboard/charts', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    
    // 1. Người dùng mới theo tháng (12 tháng gần nhất)
    const [userStats] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        DATE_FORMAT(created_at, '%m') as month_num,
        SUM(CASE WHEN role = 'Student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'Teacher' THEN 1 ELSE 0 END) as teachers
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND role IN ('Student', 'Teacher')
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%m')
      ORDER BY month ASC
    `);
    
    // Tạo mảng đầy đủ 12 tháng
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const studentData = new Array(12).fill(0);
    const teacherData = new Array(12).fill(0);
    
    userStats.forEach(stat => {
      const monthIndex = parseInt(stat.month_num) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        studentData[monthIndex] = parseInt(stat.students) || 0;
        teacherData[monthIndex] = parseInt(stat.teachers) || 0;
      }
    });
    
    // 2. Tỷ lệ hoàn thành bài thi
    const [completionStats] = await db.query(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'InProgress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status IN ('Abandoned', 'Expired') THEN 1 ELSE 0 END) as abandoned
      FROM exam_attempts
    `);
    
    const totalAttempts = completionStats[0]?.total_attempts || 0;
    const completed = completionStats[0]?.completed || 0;
    const inProgress = completionStats[0]?.in_progress || 0;
    const abandoned = completionStats[0]?.abandoned || 0;
    
    const completionRate = totalAttempts > 0 ? (completed / totalAttempts * 100).toFixed(1) : 0;
    const inProgressRate = totalAttempts > 0 ? (inProgress / totalAttempts * 100).toFixed(1) : 0;
    const abandonedRate = totalAttempts > 0 ? (abandoned / totalAttempts * 100).toFixed(1) : 0;
    
    // 3. Phân bố điểm số (từ các bài thi đã nộp)
    const [scoreDistribution] = await db.query(`
      SELECT 
        CASE 
          WHEN score >= 0 AND score < 2 THEN '0-2'
          WHEN score >= 2 AND score < 4 THEN '2-4'
          WHEN score >= 4 AND score < 6 THEN '4-6'
          WHEN score >= 6 AND score < 8 THEN '6-8'
          WHEN score >= 8 AND score <= 10 THEN '8-10'
          ELSE 'Khác'
        END as score_range,
        COUNT(*) as count
      FROM exam_attempts
      WHERE status = 'Submitted' AND score IS NOT NULL
      GROUP BY score_range
      ORDER BY 
        CASE score_range
          WHEN '0-2' THEN 1
          WHEN '2-4' THEN 2
          WHEN '4-6' THEN 3
          WHEN '6-8' THEN 4
          WHEN '8-10' THEN 5
          ELSE 6
        END
    `);
    
    const scoreRanges = ['0-2', '2-4', '4-6', '6-8', '8-10'];
    const scoreData = new Array(5).fill(0);
    scoreDistribution.forEach(stat => {
      const index = scoreRanges.indexOf(stat.score_range);
      if (index >= 0) {
        scoreData[index] = parseInt(stat.count) || 0;
      }
    });
    
    // 4. Số lượng kỳ thi theo tháng (12 tháng gần nhất)
    const [examStats] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        DATE_FORMAT(created_at, '%m') as month_num,
        COUNT(*) as count
      FROM exams
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND status != 'deleted'
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), DATE_FORMAT(created_at, '%m')
      ORDER BY month ASC
    `);
    
    const examData = new Array(12).fill(0);
    examStats.forEach(stat => {
      const monthIndex = parseInt(stat.month_num) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        examData[monthIndex] = parseInt(stat.count) || 0;
      }
    });
    
    // 5. Tính phần trăm thay đổi so với tháng trước
    const [prevMonthUsers] = await db.query(`
      SELECT 
        SUM(CASE WHEN role = 'Student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'Teacher' THEN 1 ELSE 0 END) as teachers
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
        AND created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND role IN ('Student', 'Teacher')
    `);
    
    const [currentMonthUsers] = await db.query(`
      SELECT 
        SUM(CASE WHEN role = 'Student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'Teacher' THEN 1 ELSE 0 END) as teachers
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND role IN ('Student', 'Teacher')
    `);
    
    const prevStudents = prevMonthUsers[0]?.students || 0;
    const currentStudents = currentMonthUsers[0]?.students || 0;
    const prevTeachers = prevMonthUsers[0]?.teachers || 0;
    const currentTeachers = currentMonthUsers[0]?.teachers || 0;
    
    const studentChange = prevStudents > 0 
      ? ((currentStudents - prevStudents) / prevStudents * 100).toFixed(1)
      : (currentStudents > 0 ? '100' : '0');
    const teacherChange = prevTeachers > 0
      ? ((currentTeachers - prevTeachers) / prevTeachers * 100).toFixed(1)
      : (currentTeachers > 0 ? '100' : '0');
    
    // Lấy số lượng kỳ thi tháng trước và tháng này
    const [prevMonthExams] = await db.query(`
      SELECT COUNT(*) as count
      FROM exams
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
        AND created_at < DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND status != 'deleted'
    `);
    
    const [currentMonthExams] = await db.query(`
      SELECT COUNT(*) as count
      FROM exams
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND status != 'deleted'
    `);
    
    const prevExams = prevMonthExams[0]?.count || 0;
    const currentExams = currentMonthExams[0]?.count || 0;
    const examChange = prevExams > 0
      ? ((currentExams - prevExams) / prevExams * 100).toFixed(1)
      : (currentExams > 0 ? '100' : '0');
    
    // Lấy số câu hỏi mới tháng này
    const [currentMonthQuestions] = await db.query(`
      SELECT COUNT(*) as count
      FROM question_bank
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
    `);
    const newQuestions = currentMonthQuestions[0]?.count || 0;
    
    res.json({
      userChart: {
        labels: months,
        students: studentData,
        teachers: teacherData
      },
      completionChart: {
        completed: parseFloat(completionRate),
        inProgress: parseFloat(inProgressRate),
        abandoned: parseFloat(abandonedRate),
        total: totalAttempts
      },
      scoreChart: {
        labels: scoreRanges,
        data: scoreData
      },
      examChart: {
        labels: months,
        data: examData
      },
      changes: {
        students: parseFloat(studentChange),
        teachers: parseFloat(teacherChange),
        exams: parseFloat(examChange),
        newQuestions: newQuestions
      }
    });
  } catch (err) {
    console.error('Lỗi lấy dữ liệu biểu đồ:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API lấy hoạt động gần đây cho admin
router.get('/recent-activities', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const activities = [];

    // 1. Người dùng mới đăng ký (7 ngày gần nhất)
    const [newUsers] = await db.query(`
      SELECT user_id, full_name, email, role, created_at
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND role IN ('Student', 'Teacher')
      ORDER BY created_at DESC
      LIMIT 5
    `);

    for (const user of newUsers) {
      const timeAgo = getTimeAgo(user.created_at);
      activities.push({
        type: 'new_user',
        icon: user.role === 'Student' ? '👤' : '👨‍🏫',
        title: `${user.role === 'Student' ? 'Sinh viên' : 'Giáo viên'} mới đăng ký`,
        content: `${user.full_name || user.email}`,
        time: timeAgo,
        timestamp: user.created_at,
        user_id: user.user_id
      });
    }

    // 2. Kỳ thi mới được tạo (7 ngày gần nhất)
    const [newExams] = await db.query(`
      SELECT e.exam_id, e.exam_name, e.created_at, u.full_name as teacher_name, s.subject_name
      FROM exams e
      LEFT JOIN users u ON e.teacher_id = u.user_id
      LEFT JOIN subjects s ON e.subject_id = s.subject_id
      WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND e.status != 'deleted'
      ORDER BY e.created_at DESC
      LIMIT 5
    `);

    for (const exam of newExams) {
      const timeAgo = getTimeAgo(exam.created_at);
      activities.push({
        type: 'new_exam',
        icon: '📝',
        title: 'Kỳ thi mới được tạo',
        content: `${exam.exam_name}${exam.subject_name ? ' - ' + exam.subject_name : ''}`,
        time: timeAgo,
        timestamp: exam.created_at,
        exam_id: exam.exam_id
      });
    }

    // 3. Bài thi mới được nộp (24 giờ qua)
    const [recentSubmissions] = await db.query(`
      SELECT 
        e.exam_id,
        e.exam_name,
        COUNT(ea.attempt_id) as submission_count,
        MAX(ea.end_time) as latest_submission_time
      FROM exam_attempts ea
      JOIN exams e ON ea.exam_id = e.exam_id
      WHERE ea.status IN ('Submitted', 'AutoSubmitted')
        AND ea.end_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY e.exam_id, e.exam_name
      ORDER BY latest_submission_time DESC
      LIMIT 5
    `);

    for (const submission of recentSubmissions) {
      const timeAgo = getTimeAgo(submission.latest_submission_time);
      activities.push({
        type: 'exam_submitted',
        icon: '✅',
        title: `Có ${submission.submission_count} bài thi mới được nộp`,
        content: submission.exam_name,
        time: timeAgo,
        timestamp: submission.latest_submission_time,
        exam_id: submission.exam_id
      });
    }

    // 4. Cảnh báo gian lận gần đây (24 giờ qua)
    const [recentCheating] = await db.query(`
      SELECT 
        acl.log_id,
        acl.event_type,
        acl.event_time,
        e.exam_id,
        e.exam_name,
        u.full_name as student_name,
        COUNT(*) as violation_count
      FROM anti_cheating_logs acl
      JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
      JOIN exams e ON ea.exam_id = e.exam_id
      JOIN users u ON ea.student_id = u.user_id
      WHERE acl.event_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY acl.log_id, acl.event_type, acl.event_time, e.exam_id, e.exam_name, u.full_name
      ORDER BY acl.event_time DESC
      LIMIT 5
    `);

    for (const cheating of recentCheating) {
      const timeAgo = getTimeAgo(cheating.event_time);
      activities.push({
        type: 'cheating_detected',
        icon: '⚠️',
        title: `Phát hiện gian lận: ${cheating.event_type}`,
        content: `${cheating.student_name} - ${cheating.exam_name}`,
        time: timeAgo,
        timestamp: cheating.event_time,
        exam_id: cheating.exam_id
      });
    }

    // Sắp xếp theo thời gian mới nhất
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activities.slice(0, 10)); // Trả về tối đa 10 hoạt động
  } catch (err) {
    console.error('Lỗi lấy hoạt động gần đây:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// Hàm helper để tính thời gian trước
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return 'Vừa xong';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  return `${Math.floor(diffInSeconds / 604800)} tuần trước`;
}

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

// API lấy chi tiết người dùng
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const userId = req.params.id;
    
    // Lấy thông tin cơ bản
    const [userInfo] = await db.query(`
      SELECT 
        user_id, username, full_name, email, role, 
        gender, phone, dob, created_at, updated_at,
        google_id, password_hash IS NOT NULL as has_password
      FROM users 
      WHERE user_id = ?
    `, [userId]);
    
    if (!userInfo.length) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng' });
    }
    
    const user = userInfo[0];
    const result = {
      user: {
        ...user,
        gender: user.gender || 'Chưa cập nhật',
        phone: user.phone || 'Chưa cập nhật',
        dob: user.dob || 'Chưa cập nhật'
      },
      stats: {},
      recentActivity: []
    };
    
    // Thống kê theo vai trò
    if (user.role === 'Student') {
      // Thống kê cho sinh viên
      const [studentStats] = await db.query(`
        SELECT 
          COUNT(DISTINCT ea.exam_id) as total_exams,
          COUNT(ea.attempt_id) as total_attempts,
          COUNT(CASE WHEN ea.status = 'Submitted' THEN 1 END) as completed_exams,
          COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) as avg_score,
          COALESCE(MAX(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) as highest_score,
          COALESCE(MIN(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) as lowest_score,
          (SELECT COUNT(*) FROM anti_cheating_logs acl 
           JOIN exam_attempts ea2 ON acl.attempt_id = ea2.attempt_id 
           WHERE ea2.student_id = ?) as cheating_warnings
        FROM exam_attempts ea
        WHERE ea.student_id = ?
      `, [userId, userId]);
      
      result.stats = studentStats[0] || {
        total_exams: 0,
        total_attempts: 0,
        completed_exams: 0,
        avg_score: 0,
        highest_score: 0,
        lowest_score: 0,
        cheating_warnings: 0
      };
      
      // Lịch sử thi gần đây (10 bài gần nhất)
      const [recentAttempts] = await db.query(`
        SELECT 
          ea.attempt_id,
          ea.exam_id,
          e.exam_name,
          s.subject_name,
          ea.score,
          ea.status,
          ea.start_time,
          ea.end_time,
          TIMESTAMPDIFF(MINUTE, ea.start_time, ea.end_time) as duration_minutes,
          (SELECT COUNT(*) FROM anti_cheating_logs acl WHERE acl.attempt_id = ea.attempt_id) as warnings
        FROM exam_attempts ea
        JOIN exams e ON ea.exam_id = e.exam_id
        LEFT JOIN subjects s ON e.subject_id = s.subject_id
        WHERE ea.student_id = ?
        ORDER BY ea.created_at DESC
        LIMIT 10
      `, [userId]);
      
      result.recentActivity = recentAttempts;
      
    } else if (user.role === 'Teacher') {
      // Thống kê cho giáo viên
      const [teacherStats] = await db.query(`
        SELECT 
          COUNT(DISTINCT e.exam_id) as total_exams,
          COUNT(DISTINCT e.subject_id) as total_subjects,
          COUNT(DISTINCT ea.student_id) as total_students,
          COUNT(ea.attempt_id) as total_attempts,
          COUNT(CASE WHEN ea.status = 'Submitted' THEN 1 END) as graded_attempts,
          (SELECT COUNT(*) FROM question_bank WHERE teacher_id = ?) as total_questions
        FROM exams e
        LEFT JOIN exam_attempts ea ON e.exam_id = ea.exam_id
        WHERE e.teacher_id = ?
      `, [userId, userId]);
      
      result.stats = teacherStats[0] || {
        total_exams: 0,
        total_subjects: 0,
        total_students: 0,
        total_attempts: 0,
        graded_attempts: 0,
        total_questions: 0
      };
      
      // Kỳ thi gần đây (10 kỳ thi gần nhất)
      const [recentExams] = await db.query(`
        SELECT 
          e.exam_id,
          e.exam_name,
          s.subject_name,
          e.start_time,
          e.duration,
          e.status,
          (SELECT COUNT(DISTINCT ea.student_id) FROM exam_attempts ea WHERE ea.exam_id = e.exam_id) as student_count,
          (SELECT AVG(ea.score) FROM exam_attempts ea WHERE ea.exam_id = e.exam_id AND ea.status = 'Submitted') as avg_score
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.subject_id
        WHERE e.teacher_id = ?
        ORDER BY e.created_at DESC
        LIMIT 10
      `, [userId]);
      
      result.recentActivity = recentExams.map(exam => ({
        ...exam,
        status: computeExamStatus(exam),
        avg_score: parseFloat(exam.avg_score || 0).toFixed(2)
      }));
    }
    
    res.json(result);
  } catch (err) {
    console.error('Lỗi lấy chi tiết người dùng:', err);
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

// API lấy cài đặt hệ thống - ĐẶT TRƯỚC CÁC ROUTE CÓ PARAMETER
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    
    const defaultSettings = {
      exam: {
        defaultDuration: 60,
        defaultPassingScore: 5.0,
        enableAutoSubmit: true,
        enableReviewBeforeSubmit: true
      },
      antiCheat: {
        maxWarnings: 3,
        enableWebcamMonitoring: true,
        enableTabSwitchDetection: true,
        enableCopyPasteDetection: true
      },
      notification: {
        enableEmail: false,
        notifyExamStart: true,
        notifyExamEnd: true,
        notifyScoreAvailable: true
      },
      security: {
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        accountLockoutDuration: 15,
        requireStrongPassword: false,
        enableTwoFactor: false,
        enableIPWhitelist: false
      },
      display: {
        language: 'vi',
        primaryColor: '#0d6efd',
        fontSize: 'medium',
        compactMode: false,
        showAnimations: true,
        showTooltips: true,
        itemsPerPage: 25
      },
      email: {
        smtpHost: '',
        smtpPort: null,
        smtpSecure: 'tls',
        smtpEmail: '',
        emailFromName: 'Hệ thống thi trực tuyến'
      },
      user: {
        minPasswordLength: 8,
        passwordExpiryDays: 90,
        preventPasswordReuse: false,
        allowStudentRegistration: true,
        requireEmailVerification: false,
        maxStudentsPerClass: 50
      },
      system: {
        questionsPerPage: 20,
        autoSaveInterval: 60,
        logRetentionDays: 30,
        backupFrequency: 7,
        enableMaintenanceMode: false,
        enableCaching: true,
        defaultAdminPassword: null
      },
      backup: {
        schedule: 'weekly',
        retention: 7,
        includeFiles: true,
        compress: true
      },
      logs: {
        level: 'info',
        maxFileSize: 10,
        logUserActions: false,
        logAPIRequests: false,
        enableSystemMonitoring: false,
        monitoringInterval: 5,
        cpuThreshold: 80,
        ramThreshold: 85
      },
      api: {
        enableAPI: false,
        apiKey: '',
        rateLimit: 100,
        tokenExpiry: 60,
        enableGoogleIntegration: false,
        googleClientId: '',
        enableFacebookIntegration: false,
        facebookAppId: '',
        webhookUrl: '',
        webhookOnExamStart: false,
        webhookOnExamEnd: false
      },
      performance: {
        enableCDN: false,
        cdnUrl: '',
        enableGzip: false,
        cacheDuration: 3600,
        dbPoolSize: 10,
        enableQueryCache: false,
        queryCacheDuration: 300,
        enableImageOptimization: false,
        maxImageSize: 5,
        imageQuality: 80
      }
    };

    // Tạo bảng settings nếu chưa có
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (err) {
      console.error('Lỗi tạo bảng settings:', err);
    }

    // Thử lấy từ database
    try {
      const [settings] = await db.query("SELECT setting_key, setting_value FROM system_settings");
      if (settings.length > 0) {
        const dbSettings = {};
        settings.forEach(s => {
          try {
            dbSettings[s.setting_key] = JSON.parse(s.setting_value);
          } catch (e) {
            dbSettings[s.setting_key] = s.setting_value;
          }
        });
        
        // Merge với default
        return res.json({
          ...defaultSettings,
          ...Object.keys(dbSettings).reduce((acc, key) => {
            const parts = key.split('.');
            if (parts.length === 2) {
              if (!acc[parts[0]]) acc[parts[0]] = {};
              acc[parts[0]][parts[1]] = dbSettings[key];
            }
            return acc;
          }, {})
        });
      }
    } catch (err) {
      // Lỗi query, trả về default
      console.log('Lỗi query settings, sử dụng default settings:', err.message);
    }

    res.json(defaultSettings);
  } catch (err) {
    console.error('Lỗi lấy cài đặt:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API lưu cài đặt hệ thống
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const settings = req.body;

    // Tạo bảng settings nếu chưa có
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Lưu từng setting
    const saveSetting = async (key, value) => {
      await db.query(
        'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP',
        [key, JSON.stringify(value), JSON.stringify(value)]
      );
    };

    // Lưu exam settings
    if (settings.exam) {
      await saveSetting('exam.defaultDuration', settings.exam.defaultDuration);
      await saveSetting('exam.defaultPassingScore', settings.exam.defaultPassingScore);
      await saveSetting('exam.enableAutoSubmit', settings.exam.enableAutoSubmit);
      await saveSetting('exam.enableReviewBeforeSubmit', settings.exam.enableReviewBeforeSubmit);
    }

    // Lưu antiCheat settings
    if (settings.antiCheat) {
      await saveSetting('antiCheat.maxWarnings', settings.antiCheat.maxWarnings);
      await saveSetting('antiCheat.enableWebcamMonitoring', settings.antiCheat.enableWebcamMonitoring);
      await saveSetting('antiCheat.enableTabSwitchDetection', settings.antiCheat.enableTabSwitchDetection);
      await saveSetting('antiCheat.enableCopyPasteDetection', settings.antiCheat.enableCopyPasteDetection);
    }

    // Lưu notification settings
    if (settings.notification) {
      await saveSetting('notification.enableEmail', settings.notification.enableEmail);
      await saveSetting('notification.notifyExamStart', settings.notification.notifyExamStart);
      await saveSetting('notification.notifyExamEnd', settings.notification.notifyExamEnd);
      await saveSetting('notification.notifyScoreAvailable', settings.notification.notifyScoreAvailable);
    }

    // Lưu security settings
    if (settings.security) {
      await saveSetting('security.sessionTimeout', settings.security.sessionTimeout);
      await saveSetting('security.maxLoginAttempts', settings.security.maxLoginAttempts);
      await saveSetting('security.accountLockoutDuration', settings.security.accountLockoutDuration);
      await saveSetting('security.requireStrongPassword', settings.security.requireStrongPassword);
      await saveSetting('security.enableTwoFactor', settings.security.enableTwoFactor);
      await saveSetting('security.enableIPWhitelist', settings.security.enableIPWhitelist);
    }

    // Lưu display settings
    if (settings.display) {
      await saveSetting('display.language', settings.display.language);
      await saveSetting('display.primaryColor', settings.display.primaryColor);
      await saveSetting('display.fontSize', settings.display.fontSize);
      await saveSetting('display.compactMode', settings.display.compactMode);
      await saveSetting('display.showAnimations', settings.display.showAnimations);
      await saveSetting('display.showTooltips', settings.display.showTooltips);
      await saveSetting('display.itemsPerPage', settings.display.itemsPerPage);
    }

    // Lưu email settings
    if (settings.email) {
      await saveSetting('email.smtpHost', settings.email.smtpHost);
      await saveSetting('email.smtpPort', settings.email.smtpPort);
      await saveSetting('email.smtpSecure', settings.email.smtpSecure);
      await saveSetting('email.smtpEmail', settings.email.smtpEmail);
      await saveSetting('email.emailFromName', settings.email.emailFromName);
      if (settings.email.smtpPassword) {
        await saveSetting('email.smtpPassword', settings.email.smtpPassword);
      }
    }

    // Lưu user settings
    if (settings.user) {
      await saveSetting('user.minPasswordLength', settings.user.minPasswordLength);
      await saveSetting('user.passwordExpiryDays', settings.user.passwordExpiryDays);
      await saveSetting('user.preventPasswordReuse', settings.user.preventPasswordReuse);
      await saveSetting('user.allowStudentRegistration', settings.user.allowStudentRegistration);
      await saveSetting('user.requireEmailVerification', settings.user.requireEmailVerification);
      await saveSetting('user.maxStudentsPerClass', settings.user.maxStudentsPerClass);
    }

    // Lưu system settings
    if (settings.system) {
      await saveSetting('system.questionsPerPage', settings.system.questionsPerPage);
      await saveSetting('system.autoSaveInterval', settings.system.autoSaveInterval);
      await saveSetting('system.logRetentionDays', settings.system.logRetentionDays);
      await saveSetting('system.backupFrequency', settings.system.backupFrequency);
      await saveSetting('system.enableMaintenanceMode', settings.system.enableMaintenanceMode);
      await saveSetting('system.enableCaching', settings.system.enableCaching);
      if (settings.system.defaultAdminPassword) {
        await saveSetting('system.defaultAdminPassword', settings.system.defaultAdminPassword);
      }
    }

    // Lưu backup settings
    if (settings.backup) {
      await saveSetting('backup.schedule', settings.backup.schedule);
      await saveSetting('backup.retention', settings.backup.retention);
      await saveSetting('backup.includeFiles', settings.backup.includeFiles);
      await saveSetting('backup.compress', settings.backup.compress);
    }

    // Lưu logs settings
    if (settings.logs) {
      await saveSetting('logs.level', settings.logs.level);
      await saveSetting('logs.maxFileSize', settings.logs.maxFileSize);
      await saveSetting('logs.logUserActions', settings.logs.logUserActions);
      await saveSetting('logs.logAPIRequests', settings.logs.logAPIRequests);
      await saveSetting('logs.enableSystemMonitoring', settings.logs.enableSystemMonitoring);
      await saveSetting('logs.monitoringInterval', settings.logs.monitoringInterval);
      await saveSetting('logs.cpuThreshold', settings.logs.cpuThreshold);
      await saveSetting('logs.ramThreshold', settings.logs.ramThreshold);
    }

    // Lưu API settings
    if (settings.api) {
      await saveSetting('api.enableAPI', settings.api.enableAPI);
      if (settings.api.apiKey) {
        await saveSetting('api.apiKey', settings.api.apiKey);
      }
      await saveSetting('api.rateLimit', settings.api.rateLimit);
      await saveSetting('api.tokenExpiry', settings.api.tokenExpiry);
      await saveSetting('api.enableGoogleIntegration', settings.api.enableGoogleIntegration);
      await saveSetting('api.googleClientId', settings.api.googleClientId);
      await saveSetting('api.enableFacebookIntegration', settings.api.enableFacebookIntegration);
      await saveSetting('api.facebookAppId', settings.api.facebookAppId);
      await saveSetting('api.webhookUrl', settings.api.webhookUrl);
      await saveSetting('api.webhookOnExamStart', settings.api.webhookOnExamStart);
      await saveSetting('api.webhookOnExamEnd', settings.api.webhookOnExamEnd);
    }

    // Lưu performance settings
    if (settings.performance) {
      await saveSetting('performance.enableCDN', settings.performance.enableCDN);
      await saveSetting('performance.cdnUrl', settings.performance.cdnUrl);
      await saveSetting('performance.enableGzip', settings.performance.enableGzip);
      await saveSetting('performance.cacheDuration', settings.performance.cacheDuration);
      await saveSetting('performance.dbPoolSize', settings.performance.dbPoolSize);
      await saveSetting('performance.enableQueryCache', settings.performance.enableQueryCache);
      await saveSetting('performance.queryCacheDuration', settings.performance.queryCacheDuration);
      await saveSetting('performance.enableImageOptimization', settings.performance.enableImageOptimization);
      await saveSetting('performance.maxImageSize', settings.performance.maxImageSize);
      await saveSetting('performance.imageQuality', settings.performance.imageQuality);
    }

    res.json({ message: 'Lưu cài đặt thành công' });
  } catch (err) {
    console.error('Lỗi lưu cài đặt:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API danh sách kỳ thi
router.get('/exams', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const [exams] = await db.query(`
      SELECT e.exam_id, e.exam_name, e.start_time, e.duration, e.status,
             s.subject_name, u.full_name as teacher_name,
             COALESCE((SELECT COUNT(DISTINCT ea.student_id) FROM exam_attempts ea WHERE ea.exam_id = e.exam_id), 0) as student_count
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.subject_id
      LEFT JOIN users u ON e.teacher_id = u.user_id
      ORDER BY e.created_at DESC
    `);
    const normalizedExams = exams.map(exam => ({
      ...exam,
      status: computeExamStatus(exam)
    }));
    res.json(normalizedExams);
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
    
    // Tạo mã code 6 số cho bài thi
    const examCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const [result] = await db.query(
      "INSERT INTO exams (exam_name, subject_id, teacher_id, duration, password, status) VALUES (?, ?, ?, ?, ?, 'upcoming')",
      [exam_name, subject_id, req.user.user_id, duration, examCode]
    );
    
    res.status(201).json({ 
      message: 'Tạo kỳ thi thành công', 
      exam_id: result.insertId,
      exam_code: examCode
    });
  } catch (err) {
    console.error('Lỗi tạo kỳ thi:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API lấy chi tiết kỳ thi
router.get('/exams/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const examId = req.params.id;
    
    // Lấy thông tin kỳ thi
    const [examInfo] = await db.query(`
      SELECT e.*, s.subject_name, u.full_name as teacher_name, 
             c.class_name, c.class_id,
             (SELECT COUNT(DISTINCT ea.student_id) FROM exam_attempts ea WHERE ea.exam_id = e.exam_id) as total_students
      FROM exams e
      LEFT JOIN subjects s ON e.subject_id = s.subject_id
      LEFT JOIN users u ON e.teacher_id = u.user_id
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE e.exam_id = ?
    `, [examId]);
    
    if (!examInfo.length) {
      return res.status(404).json({ error: 'Không tìm thấy kỳ thi' });
    }
    
    const examData = {
      ...examInfo[0],
      status: computeExamStatus(examInfo[0])
    };
    
    // Lấy danh sách học sinh tham gia và điểm số
    const [attempts] = await db.query(`
      SELECT 
        ea.attempt_id,
        u.user_id,
        u.full_name,
        u.email,
        ea.score,
        ea.status,
        ea.start_time,
        ea.end_time,
        TIMESTAMPDIFF(MINUTE, ea.start_time, ea.end_time) as duration_minutes,
        ea.is_fully_graded,
        (SELECT COUNT(*) FROM anti_cheating_logs acl WHERE acl.attempt_id = ea.attempt_id) as cheating_warnings
      FROM exam_attempts ea
      JOIN users u ON ea.student_id = u.user_id
      WHERE ea.exam_id = ?
      ORDER BY ea.created_at DESC
    `, [examId]);
    
    // Tính thống kê
    const submittedAttempts = attempts.filter(a => a.status === 'Submitted');
    const totalAttempts = attempts.length;
    const submittedCount = submittedAttempts.length;
    const avgScore = submittedAttempts.length > 0 
      ? submittedAttempts.reduce((sum, a) => sum + parseFloat(a.score || 0), 0) / submittedCount 
      : 0;
    const highestScore = submittedAttempts.length > 0
      ? Math.max(...submittedAttempts.map(a => parseFloat(a.score || 0)))
      : 0;
    const lowestScore = submittedAttempts.length > 0
      ? Math.min(...submittedAttempts.map(a => parseFloat(a.score || 0)))
      : 0;
    
    res.json({
      exam: examData,
      attempts: attempts,
      stats: {
        total_students: examInfo[0].total_students || 0,
        total_attempts: totalAttempts,
        submitted_count: submittedCount,
        in_progress_count: attempts.filter(a => a.status === 'InProgress').length,
        auto_submitted_count: attempts.filter(a => a.status === 'AutoSubmitted').length,
        avg_score: avgScore.toFixed(2),
        highest_score: highestScore.toFixed(2),
        lowest_score: lowestScore.toFixed(2),
        completion_rate: totalAttempts > 0 ? ((submittedCount / totalAttempts) * 100).toFixed(1) : 0
      }
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết kỳ thi:', err);
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

// API danh sách câu hỏi (TỐI ƯU - có pagination và filter)
router.get('/questions', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      subject_id = '', 
      difficulty = '', 
      question_type = '',
      include_stats = 'false' // Tùy chọn: có lấy thống kê không (mặc định không để nhanh hơn)
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    // Xây dựng query với điều kiện WHERE
    let whereConditions = [];
    const params = [];
    
    if (search && search.trim()) {
      whereConditions.push('q.question_content LIKE ?');
      params.push(`%${search.trim()}%`);
    }
    
    if (subject_id && subject_id !== 'all' && subject_id !== '') {
      whereConditions.push('q.subject_id = ?');
      params.push(subject_id);
    }
    
    if (difficulty && difficulty !== 'all' && difficulty !== '') {
      whereConditions.push('q.difficulty = ?');
      params.push(difficulty);
    }
    
    if (question_type && question_type !== 'all' && question_type !== '') {
      whereConditions.push('q.question_type = ?');
      params.push(question_type);
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // Query chính - tối ưu: chỉ JOIN subjects, bỏ question_statistics để nhanh hơn
    // Nếu cần stats, có thể query riêng hoặc dùng subquery tối ưu hơn
    let query = `
      SELECT 
        q.question_id, 
        q.question_content, 
        s.subject_name, 
        q.difficulty, 
        q.question_type as type,
        q.created_at,
        q.teacher_id,
        (SELECT COUNT(*) FROM question_options WHERE question_id = q.question_id) as option_count
    `;
    
    // Chỉ thêm correct_rate nếu include_stats = 'true'
    if (include_stats === 'true') {
      query += `,
        COALESCE(ROUND((qs.correct_attempts / NULLIF(qs.total_attempts, 0) * 100), 0), 0) as correct_rate
      `;
    } else {
      query += `, 0 as correct_rate`;
    }
    
    query += `
      FROM question_bank q
      LEFT JOIN subjects s ON q.subject_id = s.subject_id
    `;
    
    if (include_stats === 'true') {
      query += `LEFT JOIN question_statistics qs ON q.question_id = qs.question_id`;
    }
    
    query += `
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limitNum, offset);
    
    const [questions] = await db.query(query, params);
    
    // Query tổng số (tối ưu: không JOIN không cần thiết)
    let countQuery = `SELECT COUNT(*) as total FROM question_bank q ${whereClause}`;
    const [countResult] = await db.query(countQuery, params.slice(0, -2)); // Bỏ limit và offset
    
    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      questions,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        totalPages
      }
    });
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

// ============================================
// 📊 API BÁO CÁO & THỐNG KÊ - HOÀN CHỈNH
// ============================================

// API lấy báo cáo tổng hợp
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const filters = parseReportFilters(req.query);
    const data = await buildReportData(db, filters);
    
    res.json(data);
  } catch (err) {
    console.error('❌ Lỗi lấy báo cáo:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xuất báo cáo Excel - HOÀN CHỈNH
router.get('/reports/export/excel', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const filters = parseReportFilters(req.query);
    const data = await buildReportData(db, filters);
    
    // Tạo workbook Excel
    const workbook = xlsx.utils.book_new();
    
    // ============================================
    // SHEET 1: THỐNG KÊ TỔNG QUAN
    // ============================================
    const summaryData = [
      ['BÁO CÁO THỐNG KÊ HỆ THỐNG THI TRỰC TUYẾN'],
      ['Thời gian báo cáo:', `${new Date(filters.startDate).toLocaleDateString('vi-VN')} - ${new Date(filters.endDate).toLocaleDateString('vi-VN')}`],
      [],
      ['CHỈ TIÊU', 'GIÁ TRỊ', 'XU HƯỚNG'],
      ['Tổng số bài thi', data.stats.total_exams, ''],
      ['Tổng số lượt thi', data.stats.total_attempts, ''],
      ['Điểm trung bình', parseFloat(data.stats.average_score).toFixed(2), `${data.stats.score_trend >= 0 ? '+' : ''}${data.stats.score_trend.toFixed(2)}`],
      ['Tỷ lệ hoàn thành (%)', parseFloat(data.stats.completion_rate).toFixed(2), `${data.stats.completion_trend >= 0 ? '+' : ''}${data.stats.completion_trend.toFixed(2)}%`],
      ['Cảnh báo gian lận', data.stats.cheating_warnings, ''],
      ['Học sinh vi phạm', data.stats.violating_students, ''],
      []
    ];
    
    const summarySheet = xlsx.utils.aoa_to_sheet(summaryData);
    
    // Định dạng độ rộng cột
    summarySheet['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 20 }
    ];
    
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Tổng quan');
    
    // ============================================
    // SHEET 2: XU HƯỚNG ĐIỂM THEO THỜI GIAN
    // ============================================
    if (data.trend && data.trend.length > 0) {
      const trendData = [
        ['XU HƯỚNG ĐIỂM THEO THỜI GIAN'],
        [],
        ['Ngày', 'Điểm trung bình'],
        ...data.trend.map(t => [
          t.label || t.date,
          parseFloat(t.avg_score).toFixed(2)
        ])
      ];
      
      const trendSheet = xlsx.utils.aoa_to_sheet(trendData);
      trendSheet['!cols'] = [{ wch: 15 }, { wch: 20 }];
      xlsx.utils.book_append_sheet(workbook, trendSheet, 'Xu hướng điểm');
    }
    
    // ============================================
    // SHEET 3: PHÂN BỐ XẾP LOẠI
    // ============================================
    if (data.gradeDistribution && data.gradeDistribution.length > 0) {
      const gradeData = [
        ['PHÂN BỐ XẾP LOẠI'],
        [],
        ['Xếp loại', 'Số lượng', 'Tỷ lệ (%)'],
      ];
      
      const totalCount = data.gradeDistribution.reduce((sum, g) => sum + parseInt(g.count), 0);
      
      data.gradeDistribution.forEach(g => {
        const percentage = totalCount > 0 ? ((g.count / totalCount) * 100).toFixed(2) : 0;
        gradeData.push([
          g.grade,
          g.count,
          percentage
        ]);
      });
      
      const gradeSheet = xlsx.utils.aoa_to_sheet(gradeData);
      gradeSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }];
      xlsx.utils.book_append_sheet(workbook, gradeSheet, 'Phân bố xếp loại');
    }
    
    // ============================================
    // SHEET 4: SO SÁNH MÔN HỌC
    // ============================================
    if (data.subjectComparison && data.subjectComparison.length > 0) {
      const subjectData = [
        ['SO SÁNH ĐIỂM THEO MÔN HỌC'],
        [],
        ['Môn học', 'Điểm trung bình', 'Số học sinh'],
        ...data.subjectComparison.map(s => [
          s.subject_name,
          parseFloat(s.avg_score).toFixed(2),
          s.student_count
        ])
      ];
      
      const subjectSheet = xlsx.utils.aoa_to_sheet(subjectData);
      subjectSheet['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
      xlsx.utils.book_append_sheet(workbook, subjectSheet, 'So sánh môn học');
    }
    
    // ============================================
    // SHEET 5: TOP 10 HỌC SINH XUẤT SẮC
    // ============================================
    if (data.topStudents && data.topStudents.length > 0) {
      const topData = [
        ['TOP 10 HỌC SINH XUẤT SẮC'],
        [],
        ['STT', 'Họ tên', 'Điểm TB', 'Số bài thi'],
        ...data.topStudents.map((s, index) => [
          index + 1,
          s.full_name,
          parseFloat(s.avg_score).toFixed(2),
          s.exam_count
        ])
      ];
      
      const topSheet = xlsx.utils.aoa_to_sheet(topData);
      topSheet['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
      xlsx.utils.book_append_sheet(workbook, topSheet, 'Top học sinh');
    }
    
    // ============================================
    // SHEET 6: HỌC SINH CẦN HỖ TRỢ
    // ============================================
    if (data.warningStudents && data.warningStudents.length > 0) {
      const warningData = [
        ['HỌC SINH CẦN HỖ TRỢ'],
        [],
        ['STT', 'Họ tên', 'Điểm TB', 'Cảnh báo vi phạm'],
        ...data.warningStudents.map((s, index) => [
          index + 1,
          s.full_name,
          parseFloat(s.avg_score).toFixed(2),
          s.warning_count
        ])
      ];
      
      const warningSheet = xlsx.utils.aoa_to_sheet(warningData);
      warningSheet['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 15 }, { wch: 20 }];
      xlsx.utils.book_append_sheet(workbook, warningSheet, 'Cần hỗ trợ');
    }
    
    // ============================================
    // SHEET 7: CHI TIẾT TỪNG KỲ THI
    // ============================================
    if (data.details && data.details.length > 0) {
      const detailData = [
        ['CHI TIẾT TỪNG KỲ THI'],
        [],
        ['Tên kỳ thi', 'Môn học', 'Số SV', 'Tỷ lệ hoàn thành (%)', 'Điểm TB', 'Cao nhất', 'Thấp nhất', 'Cảnh báo'],
        ...data.details.map(d => [
          d.exam_name,
          d.subject_name || 'N/A',
          d.student_count,
          parseFloat(d.completion_rate).toFixed(2),
          parseFloat(d.average_score).toFixed(2),
          parseFloat(d.highest_score).toFixed(2),
          parseFloat(d.lowest_score).toFixed(2),
          d.cheating_warnings
        ])
      ];
      
      const detailSheet = xlsx.utils.aoa_to_sheet(detailData);
      detailSheet['!cols'] = [
        { wch: 40 },
        { wch: 20 },
        { wch: 10 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
      xlsx.utils.book_append_sheet(workbook, detailSheet, 'Chi tiết kỳ thi');
    }
    
    // ============================================
    // SHEET 8: LỊCH SỬ SỬA ĐIỂM
    // ============================================
    if (data.scoreHistory && data.scoreHistory.length > 0) {
      const scoreHistoryData = [
        ['LỊCH SỬ SỬA ĐIỂM CỦA GIÁO VIÊN'],
        [],
        ['Thời gian', 'Giáo viên', 'Học sinh', 'Bài thi', 'Môn học', 'Điểm cũ', 'Điểm mới', 'Tổng điểm cũ', 'Tổng điểm mới', 'Lý do'],
        ...data.scoreHistory.map(sh => [
          new Date(sh.edited_at).toLocaleString('vi-VN'),
          sh.teacher_name || 'N/A',
          sh.student_name || 'N/A',
          sh.exam_name || 'N/A',
          sh.subject_name || 'N/A',
          sh.old_score ? parseFloat(sh.old_score).toFixed(2) : 'N/A',
          sh.new_score ? parseFloat(sh.new_score).toFixed(2) : 'N/A',
          sh.old_total_score ? parseFloat(sh.old_total_score).toFixed(2) : 'N/A',
          sh.new_total_score ? parseFloat(sh.new_total_score).toFixed(2) : 'N/A',
          sh.reason || 'N/A'
        ])
      ];
      
      const scoreHistorySheet = xlsx.utils.aoa_to_sheet(scoreHistoryData);
      scoreHistorySheet['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 40 }
      ];
      xlsx.utils.book_append_sheet(workbook, scoreHistorySheet, 'Lịch sử sửa điểm');
    }
    
    // ============================================
    // SHEET 9: LỊCH SỬ KHIẾU NẠI
    // ============================================
    if (data.complaintsHistory && data.complaintsHistory.length > 0) {
      const complaintsData = [
        ['LỊCH SỬ KHIẾU NẠI CỦA HỌC SINH'],
        [],
        ['Thời gian', 'Học sinh', 'Email', 'Bài thi', 'Môn học', 'Nội dung', 'Trạng thái', 'Phản hồi giáo viên'],
        ...data.complaintsHistory.map(c => [
          new Date(c.created_at).toLocaleString('vi-VN'),
          c.student_name || 'N/A',
          c.student_email || 'N/A',
          c.exam_name || 'N/A',
          c.subject_name || 'N/A',
          c.content || 'N/A',
          c.status === 'Pending' ? 'Đang chờ' : c.status === 'Resolved' ? 'Đã giải quyết' : 'Đã từ chối',
          c.teacher_response || 'Chưa có'
        ])
      ];
      
      const complaintsSheet = xlsx.utils.aoa_to_sheet(complaintsData);
      complaintsSheet['!cols'] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 30 },
        { wch: 30 },
        { wch: 20 },
        { wch: 50 },
        { wch: 15 },
        { wch: 50 }
      ];
      xlsx.utils.book_append_sheet(workbook, complaintsSheet, 'Lịch sử khiếu nại');
    }
    
    // Tạo buffer và gửi file
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    const periodNames = {
      'week': '7_ngay',
      'month': '30_ngay',
      'quarter': '3_thang',
      'year': '1_nam',
      'custom': 'tuy_chinh'
    };
    
    const fileName = `bao_cao_${periodNames[filters.period] || 'tuy_chinh'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(excelBuffer);
    
  } catch (err) {
    console.error('❌ Lỗi xuất Excel:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xuất báo cáo PDF
router.get('/reports/export/pdf', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const filters = parseReportFilters(req.query);
    const data = await buildReportData(db, filters);
    
    // Tạo PDF sử dụng pdfService
    const pdfBuffer = await generateAdminReport(data, {
      period: filters.period,
      start_date: filters.startDateStr,
      end_date: filters.endDateStr
    });
    
    const periodNames = {
      'week': '7_ngay',
      'month': '30_ngay',
      'quarter': '3_thang',
      'year': '1_nam',
      'custom': 'tuy_chinh'
    };
    
    const fileName = `bao_cao_${periodNames[filters.period] || 'tuy_chinh'}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(pdfBuffer);
    
  } catch (err) {
    console.error('❌ Lỗi xuất PDF:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API lấy bảng điểm chi tiết của sinh viên theo môn học
router.get('/subjects/:subjectId/students/:studentId/scores', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const { subjectId, studentId } = req.params;

    // Lấy thông tin sinh viên
    const [student] = await db.query(
      'SELECT user_id, full_name, email FROM users WHERE user_id = ? AND role = "Student"',
      [studentId]
    );
    
    if (!student.length) {
      return res.status(404).json({ error: 'Không tìm thấy sinh viên' });
    }

    // Lấy thông tin môn học
    const [subject] = await db.query(
      'SELECT subject_name FROM subjects WHERE subject_id = ?',
      [subjectId]
    );
    
    if (!subject.length) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }

    // Lấy bảng điểm chi tiết của sinh viên trong môn học này
    // ✅ THAY THẾ query cũ bằng query mới
    const [scores] = await db.query(`
      SELECT 
        e.exam_id,
        e.exam_name,
        COALESCE(SUM(eq.points), 0) as total_points,
        ea.attempt_id,
        ea.score,
        ea.start_time,
        ea.end_time,
        ea.status,
        ea.is_fully_graded,
        TIMESTAMPDIFF(MINUTE, ea.start_time, ea.end_time) as duration_minutes,
        CASE 
          WHEN ea.status = 'Submitted' THEN 'Đã nộp'
          WHEN ea.status = 'InProgress' THEN 'Đang làm'
          WHEN ea.status = 'AutoSubmitted' THEN 'Tự động nộp'
          ELSE ea.status
        END as status_text
      FROM exams e
      LEFT JOIN exam_questions eq ON eq.exam_id = e.exam_id
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.exam_id AND ea.student_id = ?
      WHERE e.subject_id = ?
      GROUP BY e.exam_id, e.exam_name, ea.attempt_id, ea.score, ea.start_time, ea.end_time, ea.status, ea.is_fully_graded
      ORDER BY e.exam_name, ea.start_time DESC
    `, [studentId, subjectId]);

    // Tính thống kê
    const submittedScores = scores.filter(s => s.status === 'Submitted' && s.score !== null);
    const avgScore = submittedScores.length > 0 
      ? submittedScores.reduce((sum, s) => sum + parseFloat(s.score || 0), 0) / submittedScores.length 
      : 0;
    const highestScore = submittedScores.length > 0
      ? Math.max(...submittedScores.map(s => parseFloat(s.score || 0)))
      : 0;
    const lowestScore = submittedScores.length > 0
      ? Math.min(...submittedScores.map(s => parseFloat(s.score || 0)))
      : 0;

    res.json({
      student: student[0],
      subject: subject[0],
      scores: scores.map(s => ({
        ...s,
        score: s.score ? parseFloat(s.score) : null,
        total_points: parseFloat(s.total_points) || 0
      })),
      stats: {
        total_exams: scores.length,
        attempted_exams: scores.filter(s => s.attempt_id).length,
        submitted_exams: submittedScores.length,
        avg_score: avgScore,
        highest_score: highestScore,
        lowest_score: lowestScore
      }
    });
  } catch (err) {
    console.error('Lỗi lấy bảng điểm chi tiết:', err);
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

// API giám sát gian lận toàn hệ thống (có filter)
router.get('/monitor/cheating', authMiddleware, async (req, res) => {
  const { role, id: admin_id } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const { exam_id, student_id, event_type, start_date, end_date } = req.query;
    
    let query = `
      SELECT acl.log_id, acl.attempt_id, acl.event_type, acl.event_description, acl.event_time,
              e.exam_id, e.exam_name, u.full_name AS student_name, u.user_id AS student_id,
              t.full_name AS teacher_name, t.user_id AS teacher_id,
              c.class_name, c.class_id,
              ea.start_time AS attempt_start_time,
              ea.end_time AS attempt_end_time,
              ea.score,
              ea.is_banned,
              ea.cheating_detected
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       LEFT JOIN classes c ON e.class_id = c.class_id
       JOIN users t ON e.teacher_id = t.user_id
       WHERE 1=1
    `;
    
    const params = [];
    
    if (exam_id && exam_id !== 'all') {
      query += ' AND e.exam_id = ?';
      params.push(exam_id);
    }
    
    if (student_id && student_id !== 'all') {
      query += ' AND u.user_id = ?';
      params.push(student_id);
    }
    
    if (event_type && event_type !== 'all') {
      query += ' AND acl.event_type = ?';
      params.push(event_type);
    }
    
    if (start_date) {
      query += ' AND DATE(acl.event_time) >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(acl.event_time) <= ?';
      params.push(end_date);
    }
    
    query += ' ORDER BY acl.event_time DESC LIMIT 1000';
    
    const [logs] = await req.db.query(query, params);

    res.json({ logs });
  } catch (err) {
    console.error('Lỗi lấy log gian lận:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API báo cáo tổng hợp gian lận (cải thiện)
router.get('/monitor/cheating/stats', authMiddleware, async (req, res) => {
  const { role } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    // Thống kê theo loại vi phạm
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

    // Top 5 học sinh vi phạm nhiều nhất
    const [topViolators] = await req.db.query(
      `SELECT 
         u.full_name,
         u.user_id,
         u.email,
         COUNT(*) AS violation_count,
         COUNT(DISTINCT ea.exam_id) AS affected_exams
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN users u ON ea.student_id = u.user_id
       GROUP BY u.user_id, u.full_name, u.email
       ORDER BY violation_count DESC
       LIMIT 5`
    );

    // Thống kê tổng quan
    const [totalStats] = await req.db.query(
      `SELECT 
         COUNT(*) AS total_violations,
         COUNT(DISTINCT ea.student_id) AS total_violating_students,
         COUNT(DISTINCT ea.exam_id) AS affected_exams,
         COUNT(DISTINCT CASE WHEN ea.is_banned = 1 THEN ea.student_id END) AS banned_students
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id`
    );

    // Thống kê theo ngày (7 ngày gần nhất)
    const [dailyStats] = await req.db.query(
      `SELECT 
         DATE(acl.event_time) AS date,
         COUNT(*) AS count,
         COUNT(DISTINCT ea.student_id) AS unique_students
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       WHERE acl.event_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(acl.event_time)
       ORDER BY date DESC`
    );

    // Top 5 bài thi có nhiều vi phạm nhất
    const [topExams] = await req.db.query(
      `SELECT 
         e.exam_id,
         e.exam_name,
         c.class_name,
         COUNT(*) AS violation_count,
         COUNT(DISTINCT ea.student_id) AS violating_students
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN exams e ON ea.exam_id = e.exam_id
       LEFT JOIN classes c ON e.class_id = c.class_id
       GROUP BY e.exam_id, e.exam_name, c.class_name
       ORDER BY violation_count DESC
       LIMIT 5`
    );

    res.json({ 
      stats, 
      topViolators,
      totalStats: totalStats[0] || {},
      dailyStats,
      topExams
    });
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

// API lấy chi tiết môn học
router.get('/subjects/:id/details', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const subjectId = req.params.id;
    
    // Kiểm tra subjectId hợp lệ
    if (!subjectId || isNaN(subjectId)) {
      return res.status(400).json({ error: 'ID môn học không hợp lệ' });
    }
    
    // Lấy thông tin môn học
    const [subject] = await db.query(`
      SELECT s.subject_id, s.subject_name, s.created_at,
             COALESCE(u.full_name, 'Hệ thống') as created_by_name
      FROM subjects s
      LEFT JOIN users u ON s.created_by = u.user_id
      WHERE s.subject_id = ?
    `, [subjectId]);
    
    if (!subject.length) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }
    
    // Lấy danh sách kỳ thi thuộc môn học
    const [exams] = await db.query(`
      SELECT e.exam_id, e.exam_name, e.start_time, e.duration, e.status,
             COALESCE(u.full_name, 'Không rõ') as teacher_name,
             COALESCE((SELECT COUNT(DISTINCT ea.student_id) 
                       FROM exam_attempts ea 
                       WHERE ea.exam_id = e.exam_id), 0) as student_count,
             COALESCE((SELECT AVG(ea.score) 
                       FROM exam_attempts ea 
                       WHERE ea.exam_id = e.exam_id AND ea.status = 'Submitted'), 0) as avg_score
      FROM exams e
      LEFT JOIN users u ON e.teacher_id = u.user_id
      WHERE e.subject_id = ?
      ORDER BY e.created_at DESC
    `, [subjectId]);
    
    // Normalize exam status
    const normalizedExams = exams.map(exam => ({
      ...exam,
      status: computeExamStatus(exam),
      avg_score: parseFloat(exam.avg_score || 0).toFixed(2)
    }));
    
    // Lấy số lượng câu hỏi
    const [questionCount] = await db.query(`
      SELECT COUNT(*) as count
      FROM question_bank
      WHERE subject_id = ?
    `, [subjectId]);
    
    // Lấy danh sách giáo viên dạy môn này
    const [teachers] = await db.query(`
      SELECT DISTINCT u.user_id, u.full_name, u.email,
             (SELECT COUNT(*) FROM exams e2 WHERE e2.teacher_id = u.user_id AND e2.subject_id = ?) as exam_count
      FROM users u
      JOIN exams e ON u.user_id = e.teacher_id
      WHERE e.subject_id = ? AND u.role = 'Teacher'
      ORDER BY exam_count DESC
    `, [subjectId, subjectId]);
    
    //  LẤY TẤT CẢ HỌC SINH TRONG CÁC LỚP CỦA MÔN HỌC NÀY
    const [students] = await db.query(`
      SELECT DISTINCT 
        u.user_id, 
        u.full_name, 
        u.email,
        COUNT(DISTINCT CASE WHEN ea.status = 'Submitted' THEN ea.exam_id END) as exam_count,
        COALESCE(AVG(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) as avg_score,
        COALESCE(MAX(CASE WHEN ea.status = 'Submitted' THEN ea.score END), 0) as highest_score
      FROM users u
      INNER JOIN class_students cs ON u.user_id = cs.student_id
      INNER JOIN classes c ON cs.class_id = c.class_id
      LEFT JOIN exams e ON c.class_id = e.class_id AND e.subject_id = ?
      LEFT JOIN exam_attempts ea ON ea.exam_id = e.exam_id AND ea.student_id = u.user_id
      WHERE c.subject_id = ? 
        AND u.role = 'Student'
        AND c.status = 'active'
      GROUP BY u.user_id, u.full_name, u.email
      ORDER BY avg_score DESC
    `, [subjectId, subjectId]);
    
    // Tính thống kê tổng hợp
    const totalExams = exams.length;
    const totalStudents = students.length;
    const totalQuestions = questionCount[0]?.count || 0;
    
    // Tính điểm trung bình, cao nhất, thấp nhất (chỉ từ students đã có điểm)
    const studentsWithScores = students.filter(s => parseFloat(s.avg_score || 0) > 0);
    
    const avgScore = studentsWithScores.length > 0 
      ? studentsWithScores.reduce((sum, s) => sum + parseFloat(s.avg_score || 0), 0) / studentsWithScores.length 
      : 0;
    
    const maxScore = studentsWithScores.length > 0
      ? Math.max(...studentsWithScores.map(s => parseFloat(s.avg_score || 0)))
      : 0;
    
    const minScore = studentsWithScores.length > 0
      ? Math.min(...studentsWithScores.map(s => parseFloat(s.avg_score || 0)))
      : 0;
    
    // Trả về response
    res.json({
      subject_name: subject[0].subject_name,
      student_count: totalStudents,
      teacher: teachers.length > 0 ? teachers[0] : { full_name: 'Chưa có' },
      teachers: teachers || [],
      students: students.map(s => ({
        ...s,
        avg_score: parseFloat(s.avg_score || 0).toFixed(2),
        highest_score: parseFloat(s.highest_score || 0).toFixed(2)
      })),
      stats: {
        total_exams: totalExams,
        total_students: totalStudents,
        total_questions: totalQuestions,
        total_teachers: teachers.length,
        avg_score: avgScore.toFixed(2),
        max_score: maxScore.toFixed(2),
        min_score: minScore.toFixed(2),
        active_exams: normalizedExams.filter(e => e.status === 'active').length,
        completed_exams: normalizedExams.filter(e => e.status === 'completed').length,
        upcoming_exams: normalizedExams.filter(e => e.status === 'upcoming').length
      },
      exams: normalizedExams
    });
  } catch (err) {
    console.error('Lỗi lấy chi tiết môn học:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// ==========================================
// BACKUP ROUTES
// ==========================================

// Hàm tạo bảng backup_history
const createBackupHistoryTable = async (db) => {
  try {
    // Kiểm tra bảng đã tồn tại chưa
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'backup_history'
    `);
    
    // Nếu bảng đã tồn tại, kiểm tra xem có foreign key constraint không
    if (tables.length > 0) {
      try {
        // Thử query để xem có lỗi không
        await db.query('SELECT 1 FROM backup_history LIMIT 1');
        return; // Bảng đã tồn tại và hoạt động tốt
      } catch (err) {
        // Nếu có lỗi, xóa bảng và tạo lại
        console.log('Bảng backup_history có vấn đề, đang tạo lại...');
        await db.query('DROP TABLE IF EXISTS backup_history');
      }
    }
    
    // Kiểm tra kiểu dữ liệu của user_id trong bảng users
    let createdByType = 'INT';
    try {
      const [userTableInfo] = await db.query(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'user_id'
      `);
      
      if (userTableInfo.length > 0) {
        const userIdType = userTableInfo[0].COLUMN_TYPE;
        // Nếu là INT UNSIGNED, sử dụng INT UNSIGNED, nếu không thì dùng INT
        createdByType = userIdType.includes('UNSIGNED') ? 'INT UNSIGNED' : 'INT';
      }
    } catch (err) {
      console.log('Không thể kiểm tra kiểu dữ liệu user_id, sử dụng INT mặc định');
    }
    
    // Thử tạo bảng với foreign key trước
    try {
      await db.query(`
        CREATE TABLE backup_history (
          backup_id INT AUTO_INCREMENT PRIMARY KEY,
          backup_file VARCHAR(255) NOT NULL,
          backup_size BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by ${createdByType},
          FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    } catch (fkErr) {
      // Nếu lỗi foreign key, tạo không có foreign key
      if (fkErr.code === 'ER_FK_INCOMPATIBLE_COLUMNS' || fkErr.code === 'ER_CANNOT_ADD_FOREIGN') {
        console.log('Không thể tạo foreign key, tạo bảng không có foreign key');
        await db.query(`
          CREATE TABLE backup_history (
            backup_id INT AUTO_INCREMENT PRIMARY KEY,
            backup_file VARCHAR(255) NOT NULL,
            backup_size BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by ${createdByType}
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
      } else {
        throw fkErr;
      }
    }
  } catch (err) {
    console.error('Lỗi tạo bảng backup_history:', err);
    throw err;
  }
};

// API tạo backup
router.post('/backup/create', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    const path = require('path');
    const fs = require('fs').promises;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Tạo bảng backup_history trước
    await createBackupHistoryTable(db);
    
    // Lấy thông tin database từ env
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'exam_system'
    };
    
    // Tạo thư mục backup nếu chưa có
    const backupDir = path.join(__dirname, '../../backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    // Tên file backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFileName = `backup_${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Tạo backup database bằng mysqldump
    const mysqldumpCmd = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > "${backupPath}"`;
    
    try {
      await execAsync(mysqldumpCmd);
      
      // Lưu thông tin backup vào database
      await db.query(
        `INSERT INTO backup_history (backup_file, backup_size, created_at, created_by) 
         VALUES (?, ?, NOW(), ?)`,
        [backupFileName, (await fs.stat(backupPath)).size, req.user.id]
      );
      
      res.json({ 
        message: 'Tạo backup thành công',
        backup_file: backupFileName,
        backup_path: backupPath
      });
    } catch (execError) {
      // Nếu mysqldump không có, tạo backup đơn giản bằng cách export data
      console.log('mysqldump không khả dụng, sử dụng phương pháp backup đơn giản');
      
      // Tạo backup đơn giản (chỉ lưu thông tin)
      const backupData = {
        timestamp: new Date().toISOString(),
        database: dbConfig.database,
        tables: []
      };
      
      // Lấy danh sách bảng
      const [tables] = await db.query('SHOW TABLES');
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        const [rows] = await db.query(`SELECT * FROM ${tableName}`);
        backupData.tables.push({
          name: tableName,
          data: rows
        });
      }
      
      // Lưu backup dưới dạng JSON
      const jsonBackupPath = backupPath.replace('.sql', '.json');
      await fs.writeFile(jsonBackupPath, JSON.stringify(backupData, null, 2));
      
      // Lưu thông tin backup vào database
      await db.query(
        `INSERT INTO backup_history (backup_file, backup_size, created_at, created_by) 
         VALUES (?, ?, NOW(), ?)`,
        [path.basename(jsonBackupPath), (await fs.stat(jsonBackupPath)).size, req.user.id || null]
      );
      
      res.json({ 
        message: 'Tạo backup thành công (JSON format)',
        backup_file: path.basename(jsonBackupPath),
        backup_path: jsonBackupPath
      });
    }
  } catch (err) {
    console.error('Lỗi tạo backup:', err);
    res.status(500).json({ error: 'Lỗi tạo backup', details: err.message });
  }
});

// API xem lịch sử backup
router.get('/backup/history', authenticateToken, async (req, res) => {
  try {
    const db = req.db;
    
    // Tạo bảng backup_history nếu chưa có
    await createBackupHistoryTable(db);
    
    const [backups] = await db.query(
      `SELECT bh.*, u.full_name as created_by_name 
       FROM backup_history bh 
       LEFT JOIN users u ON bh.created_by = u.user_id 
       ORDER BY bh.created_at DESC 
       LIMIT 50`
    );
    
    res.json(backups);
  } catch (err) {
    console.error('Lỗi lấy lịch sử backup:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API khôi phục backup
router.post('/backup/restore', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn file backup' });
    }
    
    const db = req.db;
    const path = require('path');
    const fs = require('fs').promises;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    // Lấy thông tin database từ env
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'exam_system'
    };
    
    if (fileExt === '.sql') {
      // Khôi phục từ file SQL
      const restoreCmd = `mysql -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} < "${filePath}"`;
      await execAsync(restoreCmd);
    } else if (fileExt === '.json') {
      // Khôi phục từ file JSON
      const backupData = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      // Xóa dữ liệu cũ (nếu có yêu cầu)
      if (req.body.overwrite === 'true') {
        for (const table of backupData.tables) {
          await db.query(`TRUNCATE TABLE ${table.name}`);
        }
      }
      
      // Khôi phục dữ liệu
      for (const table of backupData.tables) {
        if (table.data && table.data.length > 0) {
          // Xóa dữ liệu cũ
          await db.query(`DELETE FROM ${table.name}`);
          
          // Insert dữ liệu mới
          for (const row of table.data) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(() => '?').join(', ');
            await db.query(
              `INSERT INTO ${table.name} (${columns}) VALUES (${values})`,
              Object.values(row)
            );
          }
        }
      }
    } else {
      await fs.unlink(filePath);
      return res.status(400).json({ error: 'Định dạng file không được hỗ trợ' });
    }
    
    // Xóa file upload
    await fs.unlink(filePath);
    
    res.json({ message: 'Khôi phục backup thành công' });
  } catch (err) {
    console.error('Lỗi khôi phục backup:', err);
    res.status(500).json({ error: 'Lỗi khôi phục backup', details: err.message });
  }
});

// ==========================================
// LOGS ROUTES
// ==========================================

// API xem log hệ thống
router.get('/logs/view', authenticateToken, async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, 'system.log');
    
    try {
      const logContent = await fs.readFile(logFile, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.send(logContent);
    } catch (err) {
      // Nếu file log chưa có, tạo file mới
      await fs.mkdir(logDir, { recursive: true });
      await fs.writeFile(logFile, 'Log file created\n');
      res.setHeader('Content-Type', 'text/plain');
      res.send('Log file created\n');
    }
  } catch (err) {
    console.error('Lỗi xem log:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xuất log
router.get('/logs/export', authenticateToken, async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, 'system.log');
    
    try {
      const logContent = await fs.readFile(logFile, 'utf8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="logs-${new Date().toISOString().split('T')[0]}.txt"`);
      res.send(logContent);
    } catch (err) {
      res.status(404).json({ error: 'File log không tồn tại' });
    }
  } catch (err) {
    console.error('Lỗi xuất log:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// API xóa log cũ
router.post('/logs/clear', authenticateToken, async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs').promises;
    
    const logDir = path.join(__dirname, '../../logs');
    const logFile = path.join(logDir, 'system.log');
    
    // Xóa file log
    try {
      await fs.unlink(logFile);
    } catch (err) {
      // File không tồn tại, không sao
    }
    
    // Tạo file log mới
    await fs.mkdir(logDir, { recursive: true });
    await fs.writeFile(logFile, `Log cleared at ${new Date().toISOString()}\n`);
    
    res.json({ message: 'Xóa log cũ thành công' });
  } catch (err) {
    console.error('Lỗi xóa log:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// ==========================================
// CACHE ROUTES
// ==========================================

// API xóa cache
router.post('/cache/clear', authenticateToken, async (req, res) => {
  try {
    // Xóa cache trong memory (nếu có)
    if (global.cache) {
      global.cache.clear();
    }
    
    // Xóa cache files (nếu có)
    const path = require('path');
    const fs = require('fs').promises;
    const cacheDir = path.join(__dirname, '../../cache');
    
    try {
      const files = await fs.readdir(cacheDir);
      for (const file of files) {
        await fs.unlink(path.join(cacheDir, file));
      }
    } catch (err) {
      // Thư mục cache không tồn tại, không sao
    }
    
    res.json({ message: 'Xóa cache thành công' });
  } catch (err) {
    console.error('Lỗi xóa cache:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// ============================================
// 📋 API LỊCH SỬ SỬA ĐIỂM CỦA GIÁO VIÊN
// ============================================
router.get('/reports/score-history', authMiddleware, async (req, res) => {
  const { role } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const { startDate, endDate, teacherId, examId, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND sal.edited_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND sal.edited_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (teacherId) {
      whereClause += ' AND sal.edited_by = ?';
      params.push(teacherId);
    }

    if (examId) {
      whereClause += ' AND ea.exam_id = ?';
      params.push(examId);
    }

    // Lấy tổng số records
    const [countResult] = await req.db.query(
      `SELECT COUNT(*) as total
       FROM score_audit_logs sal
       JOIN exam_attempts ea ON sal.attempt_id = ea.attempt_id
       WHERE ${whereClause}`,
      params
    );

    const total = countResult[0]?.total || 0;

    // Lấy dữ liệu
    const [logs] = await req.db.query(
      `SELECT 
        sal.log_id,
        sal.attempt_id,
        sal.question_id,
        sal.old_score,
        sal.new_score,
        sal.old_total_score,
        sal.new_total_score,
        sal.reason,
        sal.edited_at,
        sal.edited_by,
        u.full_name as teacher_name,
        u.email as teacher_email,
        e.exam_id,
        e.exam_name,
        s.subject_name,
        st.full_name as student_name,
        st.user_id as student_id,
        qb.question_content,
        qb.question_type
       FROM score_audit_logs sal
       JOIN exam_attempts ea ON sal.attempt_id = ea.attempt_id
       JOIN exams e ON ea.exam_id = e.exam_id
       LEFT JOIN subjects s ON e.subject_id = s.subject_id
       LEFT JOIN users u ON sal.edited_by = u.user_id
       LEFT JOIN users st ON ea.student_id = st.user_id
       LEFT JOIN question_bank qb ON sal.question_id = qb.question_id
       WHERE ${whereClause}
       ORDER BY sal.edited_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Lỗi lấy lịch sử sửa điểm:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

// ============================================
// 📋 API LỊCH SỬ KHIẾU NẠI CỦA HỌC SINH
// ============================================
router.get('/reports/complaints-history', authMiddleware, async (req, res) => {
  const { role } = req.user;

  if (role !== 'Admin') {
    return res.status(403).json({ error: 'Chỉ admin có quyền truy cập' });
  }

  try {
    const { startDate, endDate, studentId, examId, status, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = '1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND c.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND c.created_at <= ?';
      params.push(endDate + ' 23:59:59');
    }

    if (studentId) {
      whereClause += ' AND c.student_id = ?';
      params.push(studentId);
    }

    if (examId) {
      whereClause += ' AND c.exam_id = ?';
      params.push(examId);
    }

    if (status) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    // Lấy tổng số records
    const [countResult] = await req.db.query(
      `SELECT COUNT(*) as total
       FROM complaints c
       WHERE ${whereClause}`,
      params
    );

    const total = countResult[0]?.total || 0;

    // Lấy dữ liệu
    const [complaints] = await req.db.query(
      `SELECT 
        c.complaint_id,
        c.exam_id,
        c.student_id,
        c.content,
        c.status,
        c.teacher_response,
        c.created_at,
        c.updated_at,
        e.exam_name,
        s.subject_name,
        st.full_name as student_name,
        st.user_id as student_code,
        st.email as student_email,
        t.full_name as teacher_name,
        t.email as teacher_email,
        COALESCE((SELECT score FROM exam_attempts WHERE exam_id = c.exam_id AND student_id = c.student_id AND status = 'Submitted' ORDER BY start_time DESC LIMIT 1), 0) as exam_score,
        COALESCE((SELECT SUM(points) FROM exam_questions WHERE exam_id = c.exam_id), 0) as total_points
       FROM complaints c
       JOIN exams e ON c.exam_id = e.exam_id
       LEFT JOIN subjects s ON e.subject_id = s.subject_id
       LEFT JOIN users st ON c.student_id = st.user_id
       LEFT JOIN users t ON e.teacher_id = t.user_id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      complaints,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('❌ Lỗi lấy lịch sử khiếu nại:', err);
    res.status(500).json({ error: 'Lỗi server', details: err.message });
  }
});

module.exports = router;