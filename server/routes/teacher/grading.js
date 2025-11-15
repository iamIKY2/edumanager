const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const { createNotification } = require('../shared/helpers');

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
        u.user_id as student_code,
        (SELECT COUNT(*) 
         FROM exam_attempt_answers eaa
         JOIN exam_questions eq ON eaa.question_id = eq.question_id
         JOIN question_bank qb ON eq.question_id = qb.question_id
         WHERE eaa.attempt_id = ea.attempt_id 
           AND qb.question_type IN ('Essay', 'FillInBlank')
           AND (eaa.is_graded = 0 OR eaa.is_graded IS NULL)
        ) as pending_questions
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN users u ON ea.student_id = u.user_id
       WHERE e.teacher_id = ?
         AND ea.status IN ('Submitted', 'AutoSubmitted')
       ORDER BY ea.end_time DESC`,
      [teacherId]
    );

    console.log('✅ All attempts:', attempts.length);
    console.log('📊 Attempts data:', JSON.stringify(attempts, null, 2));

    // QUAN TRỌNG: Lọc chỉ những attempt CÓ câu hỏi chưa chấm
    const needGrading = attempts.filter(a => {
      const pending = parseInt(a.pending_questions) || 0;
      console.log(`🔍 Attempt ${a.attempt_id}: ${pending} pending questions`);
      return pending > 0;
    });

    console.log('✅ Found pending grading:', needGrading.length);

    // Thống kê
    const [stats] = await req.db.query(
      `SELECT 
        COUNT(DISTINCT CASE 
          WHEN eaa.is_graded = 0 AND qb.question_type = 'Essay' 
          THEN eaa.question_id
        END) as pending_essays,
        COUNT(DISTINCT CASE 
          WHEN eaa.is_graded = 0 AND qb.question_type = 'FillInBlank' 
          THEN eaa.question_id
        END) as pending_fill,
        COUNT(DISTINCT CASE 
          WHEN eaa.is_graded = 1 
          THEN eaa.attempt_id 
        END) as graded_count,
        COUNT(DISTINCT CASE 
          WHEN qb.question_type IN ('SingleChoice', 'MultipleChoice') 
          THEN eaa.attempt_id 
        END) as pending_choice
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       JOIN exam_attempt_answers eaa ON ea.attempt_id = eaa.attempt_id
       JOIN exam_questions eq ON eaa.question_id = eq.question_id
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE e.teacher_id = ? 
         AND ea.status IN ('Submitted', 'AutoSubmitted')`,
      [teacherId]
    );

    const result = {
      attempts: needGrading,
      pendingEssays: parseInt(stats[0]?.pending_essays) || 0,
      pendingFillInBlank: parseInt(stats[0]?.pending_fill) || 0,
      gradedCount: parseInt(stats[0]?.graded_count) || 0,
      pendingChoice: parseInt(stats[0]?.pending_choice) || 0
    };

    console.log('✅ Sending response:', JSON.stringify(result, null, 2));

    res.json(result);

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ 
      error: 'Lỗi khi tải danh sách bài cần chấm', 
      details: err.message,
      stack: err.stack 
    });
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
  const { grades, reason } = req.body; // Thêm reason vào request body
  const teacherId = req.user.id || req.user.user_id;

  try {
    console.log('🔵 Submitting grades:', attemptId, grades);

    // Kiểm tra lý do chỉnh sửa (bắt buộc nếu có thay đổi điểm)
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Vui lòng nhập lý do chỉnh sửa điểm' });
    }

    // Kiểm tra quyền - Lấy thêm thông tin exam_name và student_id
    const [attempt] = await req.db.query(
      `SELECT ea.*, e.teacher_id, e.exam_id, e.exam_name, ea.student_id, ea.score as old_total_score
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND e.teacher_id = ?`,
      [attemptId, teacherId]
    );

    if (!attempt.length) {
      return res.status(403).json({ error: 'Bạn không có quyền chấm bài này' });
    }

    const examId = attempt[0].exam_id;
    const examName = attempt[0].exam_name;
    const studentId = attempt[0].student_id;
    const oldTotalScore = parseFloat(attempt[0].old_total_score || 0);
    
    // ✅ QUAN TRỌNG: Lấy giá trị is_fully_graded TRƯỚC KHI cập nhật điểm
    const wasFullyGraded = attempt[0].is_fully_graded === 1;

    // Lấy điểm cũ của từng câu hỏi trước khi cập nhật
    const [oldScores] = await req.db.query(
      `SELECT question_id, teacher_score as old_score
       FROM exam_attempt_answers
       WHERE attempt_id = ?`,
      [attemptId]
    );
    const oldScoreMap = {};
    oldScores.forEach(s => {
      oldScoreMap[s.question_id] = parseFloat(s.old_score || 0);
    });

    // Cập nhật điểm cho từng câu
    for (const grade of grades) {
      const oldScore = oldScoreMap[grade.question_id] || 0;
      const newScore = parseFloat(grade.teacher_score || 0);
      
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
      
      // Ghi audit log nếu điểm thay đổi
      if (oldScore !== newScore) {
        await req.db.query(
          `INSERT INTO score_audit_logs 
           (attempt_id, question_id, old_score, new_score, reason, edited_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [attemptId, grade.question_id, oldScore, newScore, reason.trim(), teacherId]
        );
      }
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

    // Ghi audit log cho tổng điểm nếu có thay đổi
    if (oldTotalScore !== parseFloat(totalScore)) {
      await req.db.query(
        `INSERT INTO score_audit_logs 
         (attempt_id, question_id, old_total_score, new_total_score, reason, edited_by)
         VALUES (?, NULL, ?, ?, ?, ?)`,
        [attemptId, oldTotalScore, totalScore, reason.trim(), teacherId]
      );
    }

    // Cập nhật điểm tổng
    await req.db.query(
      `UPDATE exam_attempts
       SET score = ?,
           is_fully_graded = ?
       WHERE attempt_id = ?`,
      [totalScore, isFullyGraded, attemptId]
    );

    console.log('✅ Grading saved:', { totalScore, isFullyGraded });
    console.log('🔵 [Grading] Status check - wasFullyGraded:', wasFullyGraded, 'isFullyGraded:', isFullyGraded);
    console.log('🔵 [Grading] Full condition check:', {
      isFullyGraded: isFullyGraded === 1,
      gradesLength: grades.length,
      hasIo: !!req.io,
      hasStudentId: !!studentId,
      studentIdValue: studentId,
      examName: examName
    });

    // ✅ GỬI THÔNG BÁO CHO HỌC SINH KHI GIÁO VIÊN CHẤM ĐIỂM
    // Gửi thông báo nếu:
    // 1. Bài thi đã được chấm hoàn toàn (isFullyGraded === 1)
    // 2. Có câu hỏi được chấm trong lần này (grades.length > 0) - đảm bảo giáo viên vừa chấm điểm
    // 3. Có socket.io và studentId
    if (isFullyGraded === 1 && grades.length > 0 && req.io && studentId) {
      try {
        console.log('🔵 [Grading] Sending notification to student:', studentId);
        console.log('🔵 [Grading] Room:', `user_${studentId}`);
        console.log('🔵 [Grading] Exam name:', examName);
        console.log('🔵 [Grading] Score:', totalScore);
        console.log('🔵 [Grading] wasFullyGraded (before):', wasFullyGraded);
        console.log('🔵 [Grading] isFullyGraded (after):', isFullyGraded);
        console.log('🔵 [Grading] Grades in this session:', grades.length);
        
        await createNotification(
          req.db,
          req.io,
          studentId,
          `Bài thi "${examName}" của bạn đã được chấm điểm. Điểm số: ${totalScore} điểm`,
          'Info',
          examId,
          'Exam'
        );
        console.log('✅ [Grading] Notification created and sent to student:', studentId);
      } catch (notifError) {
        console.error('⚠️ [Grading] Error sending notification:', notifError);
        console.error('⚠️ [Grading] Error stack:', notifError.stack);
        // Không throw error vì chấm điểm đã thành công
      }
    } else {
      console.log('ℹ️ [Grading] Notification not sent - conditions check:', {
        isFullyGraded: isFullyGraded === 1,
        hasGrades: grades.length > 0,
        hasIo: !!req.io,
        hasStudentId: !!studentId,
        reason: !isFullyGraded ? 'Not fully graded yet' : 
                grades.length === 0 ? 'No grades submitted in this session' :
                !req.io ? 'Socket.io not available' : 
                !studentId ? 'Student ID not found' : 'Unknown'
      });
    }

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

// ============================================
// 📋 XEM AUDIT LOG CHỈNH SỬA ĐIỂM
// ============================================
router.get('/:attemptId/audit-log', authMiddleware, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id || req.user.user_id;
  const userRole = req.user.role;

  try {
    // Kiểm tra quyền
    if (userRole === 'teacher') {
      const [attempt] = await req.db.query(
        `SELECT e.teacher_id 
         FROM exam_attempts ea
         JOIN exams e ON ea.exam_id = e.exam_id
         WHERE ea.attempt_id = ? AND e.teacher_id = ?`,
        [attemptId, userId]
      );

      if (!attempt.length) {
        return res.status(403).json({ error: 'Bạn không có quyền xem audit log này' });
      }
    }

    // Lấy audit log
    const [logs] = await req.db.query(
      `SELECT 
        sal.*,
        u.full_name as editor_name,
        qb.question_content
       FROM score_audit_logs sal
       LEFT JOIN users u ON sal.edited_by = u.user_id
       LEFT JOIN question_bank qb ON sal.question_id = qb.question_id
       WHERE sal.attempt_id = ?
       ORDER BY sal.edited_at DESC`,
      [attemptId]
    );

    res.json({ logs });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy audit log', details: err.message });
  }
});

module.exports = router;