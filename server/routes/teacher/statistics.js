// server/routes/teacher/statistics.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

// ============================================
// 📊 LẤY THỐNG KÊ CHO GIÁO VIÊN
// ============================================
router.get('/', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;

  try {
    const db = req.db;

    // 1. Thống kê cơ bản: Tổng số lớp, học sinh, bài thi, điểm trung bình
    const [classStats] = await db.query(
      `SELECT COUNT(DISTINCT c.class_id) as total_classes
       FROM classes c
       WHERE c.teacher_id = ? AND c.status = 'active'`,
      [teacherId]
    );

    const [studentStats] = await db.query(
      `SELECT COUNT(DISTINCT cs.student_id) as total_students
       FROM class_students cs
       JOIN classes c ON cs.class_id = c.class_id
       WHERE c.teacher_id = ? AND c.status = 'active'`,
      [teacherId]
    );

    const [examStats] = await db.query(
      `SELECT COUNT(DISTINCT e.exam_id) as total_exams
       FROM exams e
       WHERE e.teacher_id = ?`,
      [teacherId]
    );

    // Điểm trung bình của tất cả bài thi đã chấm
    const [avgScore] = await db.query(
      `SELECT AVG(ea.score) as avg_score
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE e.teacher_id = ? 
         AND ea.status IN ('Submitted', 'AutoSubmitted')
         AND ea.score IS NOT NULL`,
      [teacherId]
    );

    // 2. Phân bố điểm theo mức: Giỏi (8-10), Khá (6.5-8), Trung bình (5-6.5), Yếu (<5)
    const [scoreDistribution] = await db.query(
      `SELECT 
        CASE 
          WHEN ea.score >= 8 AND ea.score <= 10 THEN 'Giỏi (8-10)'
          WHEN ea.score >= 6.5 AND ea.score < 8 THEN 'Khá (6.5-8)'
          WHEN ea.score >= 5 AND ea.score < 6.5 THEN 'Trung bình (5-6.5)'
          WHEN ea.score < 5 THEN 'Yếu (<5)'
          ELSE 'Chưa chấm'
        END as grade_level,
        COUNT(DISTINCT ea.attempt_id) as student_count
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')
         AND ea.score IS NOT NULL
       GROUP BY grade_level
       ORDER BY 
         CASE grade_level
           WHEN 'Giỏi (8-10)' THEN 1
           WHEN 'Khá (6.5-8)' THEN 2
           WHEN 'Trung bình (5-6.5)' THEN 3
           WHEN 'Yếu (<5)' THEN 4
           ELSE 5
         END`,
      [teacherId]
    );

    // Format dữ liệu phân bố điểm
    const distributionData = {
      'Giỏi (8-10)': 0,
      'Khá (6.5-8)': 0,
      'Trung bình (5-6.5)': 0,
      'Yếu (<5)': 0
    };

    scoreDistribution.forEach(item => {
      if (distributionData.hasOwnProperty(item.grade_level)) {
        distributionData[item.grade_level] = parseInt(item.student_count);
      }
    });

    // 3. Thống kê theo lớp (nếu có classId được chọn)
    const classId = req.query.classId;
    let classSpecificStats = null;

    if (classId && classId !== 'all') {
      // Kiểm tra quyền truy cập lớp học
      const [classCheck] = await db.query(
        `SELECT class_id FROM classes WHERE class_id = ? AND teacher_id = ?`,
        [classId, teacherId]
      );

      if (classCheck.length > 0) {
        // Thống kê theo lớp cụ thể
        const [classScoreDistribution] = await db.query(
          `SELECT 
            CASE 
              WHEN ea.score >= 8 AND ea.score <= 10 THEN 'Giỏi (8-10)'
              WHEN ea.score >= 6.5 AND ea.score < 8 THEN 'Khá (6.5-8)'
              WHEN ea.score >= 5 AND ea.score < 6.5 THEN 'Trung bình (5-6.5)'
              WHEN ea.score < 5 THEN 'Yếu (<5)'
              ELSE 'Chưa chấm'
            END as grade_level,
            COUNT(DISTINCT ea.attempt_id) as student_count
           FROM exam_attempts ea
           JOIN exams e ON ea.exam_id = e.exam_id
           WHERE e.teacher_id = ? AND e.class_id = ?
             AND ea.status IN ('Submitted', 'AutoSubmitted')
             AND ea.score IS NOT NULL
           GROUP BY grade_level
           ORDER BY 
             CASE grade_level
               WHEN 'Giỏi (8-10)' THEN 1
               WHEN 'Khá (6.5-8)' THEN 2
               WHEN 'Trung bình (5-6.5)' THEN 3
               WHEN 'Yếu (<5)' THEN 4
               ELSE 5
             END`,
          [teacherId, classId]
        );

        const classDistribution = {
          'Giỏi (8-10)': 0,
          'Khá (6.5-8)': 0,
          'Trung bình (5-6.5)': 0,
          'Yếu (<5)': 0
        };

        classScoreDistribution.forEach(item => {
          if (classDistribution.hasOwnProperty(item.grade_level)) {
            classDistribution[item.grade_level] = parseInt(item.student_count);
          }
        });

        const [classAvgScore] = await db.query(
          `SELECT AVG(ea.score) as avg_score
           FROM exam_attempts ea
           JOIN exams e ON ea.exam_id = e.exam_id
           WHERE e.teacher_id = ? AND e.class_id = ?
             AND ea.status IN ('Submitted', 'AutoSubmitted')
             AND ea.score IS NOT NULL`,
          [teacherId, classId]
        );

        const [classExamCount] = await db.query(
          `SELECT COUNT(*) as count FROM exams WHERE teacher_id = ? AND class_id = ?`,
          [teacherId, classId]
        );

        const [classStudentCount] = await db.query(
          `SELECT COUNT(*) as count FROM class_students WHERE class_id = ?`,
          [classId]
        );

        classSpecificStats = {
          total_exams: parseInt(classExamCount[0].count) || 0,
          total_students: parseInt(classStudentCount[0].count) || 0,
          avg_score: parseFloat(classAvgScore[0]?.avg_score || 0).toFixed(1),
          distribution: classDistribution
        };
      }
    }

    // 4. Tỷ lệ đạt (>= 5 điểm)
    const [passStats] = await db.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN ea.score >= 5 THEN ea.attempt_id END) as passed,
        COUNT(DISTINCT ea.attempt_id) as total
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')
         AND ea.score IS NOT NULL`,
      [teacherId]
    );

    const passRate = passStats[0].total > 0
      ? ((passStats[0].passed / passStats[0].total) * 100).toFixed(1)
      : 0;

    // 5. Điểm cao nhất và thấp nhất
    const [scoreRange] = await db.query(
      `SELECT 
        MAX(ea.score) as max_score,
        MIN(ea.score) as min_score
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')
         AND ea.score IS NOT NULL`,
      [teacherId]
    );

    // 6. Thống kê bài thi: đã chấm, chưa chấm (chỉ đếm bài thi có câu hỏi cần chấm)
    const [examGradingStats] = await db.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN ea.is_fully_graded = 1 THEN ea.attempt_id END) as graded_attempts,
        COUNT(DISTINCT CASE 
          WHEN ea.is_fully_graded = 0 
          AND EXISTS (
            SELECT 1 
            FROM exam_attempt_answers eaa
            JOIN exam_questions eq ON eaa.question_id = eq.question_id
            JOIN question_bank qb ON eq.question_id = qb.question_id
            WHERE eaa.attempt_id = ea.attempt_id
              AND qb.question_type IN ('Essay', 'FillInBlank')
              AND (eaa.is_graded = 0 OR eaa.is_graded IS NULL)
          )
          THEN ea.attempt_id 
        END) as pending_attempts,
        COUNT(DISTINCT ea.attempt_id) as total_attempts
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')`,
      [teacherId]
    );

    // 7. Thống kê học sinh: đã làm bài, chưa làm bài
    const [studentExamStats] = await db.query(
      `SELECT 
        COUNT(DISTINCT ea.student_id) as students_with_exams,
        (SELECT COUNT(DISTINCT cs.student_id)
         FROM class_students cs
         JOIN classes c ON cs.class_id = c.class_id
         WHERE c.teacher_id = ? AND c.status = 'active') as total_students
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE e.teacher_id = ?`,
      [teacherId, teacherId]
    );

    // 8. Thống kê bài thi theo trạng thái (tính động dựa trên thời gian thực tế)
    const [examStatusStats] = await db.query(
      `SELECT 
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_exams,
        COUNT(CASE 
          WHEN status NOT IN ('deleted', 'draft')
          AND start_time IS NOT NULL
          AND NOW() < start_time THEN 1 
        END) as upcoming_exams,
        COUNT(CASE 
          WHEN status NOT IN ('deleted', 'draft')
          AND start_time IS NOT NULL
          AND NOW() >= start_time 
          AND NOW() < DATE_ADD(start_time, INTERVAL duration MINUTE) THEN 1 
        END) as active_exams,
        COUNT(CASE 
          WHEN status NOT IN ('deleted', 'draft')
          AND start_time IS NOT NULL
          AND NOW() >= DATE_ADD(start_time, INTERVAL duration MINUTE) THEN 1 
        END) as completed_exams
       FROM exams
       WHERE teacher_id = ? AND status != 'deleted'`,
      [teacherId]
    );

    // 9. Thống kê số lượng câu hỏi đã tạo
    const [questionStats] = await db.query(
      `SELECT COUNT(*) as total_questions
       FROM question_bank
       WHERE teacher_id = ?`,
      [teacherId]
    );

    const totalStudents = parseInt(studentExamStats[0]?.total_students) || 0;
    const studentsWithExams = parseInt(studentExamStats[0]?.students_with_exams) || 0;
    const studentsWithoutExams = totalStudents - studentsWithExams;

    res.json({
      // Thống kê cơ bản
      total_classes: parseInt(classStats[0].total_classes) || 0,
      total_students: parseInt(studentStats[0].total_students) || 0,
      total_exams: parseInt(examStats[0].total_exams) || 0,
      avg_score: parseFloat(avgScore[0]?.avg_score || 0).toFixed(1),
      
      // Phân bố điểm
      distribution: distributionData,
      
      // Tỷ lệ đạt
      pass_rate: passRate,
      
      // Điểm cao nhất/thấp nhất
      max_score: parseFloat(scoreRange[0]?.max_score || 0).toFixed(1),
      min_score: parseFloat(scoreRange[0]?.min_score || 0).toFixed(1),
      
      // Thống kê chấm bài
      graded_attempts: parseInt(examGradingStats[0]?.graded_attempts) || 0,
      pending_attempts: parseInt(examGradingStats[0]?.pending_attempts) || 0,
      total_attempts: parseInt(examGradingStats[0]?.total_attempts) || 0,
      
      // Thống kê học sinh
      students_with_exams: studentsWithExams,
      students_without_exams: studentsWithoutExams > 0 ? studentsWithoutExams : 0,
      
      // Thống kê bài thi theo trạng thái
      exam_status: {
        draft: parseInt(examStatusStats[0]?.draft_exams) || 0,
        upcoming: parseInt(examStatusStats[0]?.upcoming_exams) || 0,
        active: parseInt(examStatusStats[0]?.active_exams) || 0,
        completed: parseInt(examStatusStats[0]?.completed_exams) || 0
      },
      
      // Thống kê câu hỏi
      total_questions: parseInt(questionStats[0]?.total_questions) || 0,
      
      // Thống kê theo lớp (nếu có)
      class_stats: classSpecificStats
    });

  } catch (err) {
    console.error('❌ Lỗi khi lấy thống kê:', err);
    res.status(500).json({ 
      error: 'Lỗi khi lấy thống kê', 
      details: err.message 
    });
  }
});

module.exports = router;
