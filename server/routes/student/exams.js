const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');

// ============================================
// 📝 LẤY DANH SÁCH BÀI THI CỦA HỌC SINH
// ============================================
router.get('/', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const studentId = req.user.id || req.user.user_id;
  
  console.log('=== GET STUDENT EXAMS ===');
  console.log('studentId:', studentId);
  
  try {
    const query = `
      SELECT 
        e.exam_id, 
        e.exam_name,
        e.description,
        e.duration, 
        e.start_time, 
        e.end_time,
        (SELECT SUM(points) FROM exam_questions WHERE exam_id = e.exam_id) AS total_points,
        c.class_name,
        s.subject_name, 
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM exam_attempts ea 
         WHERE ea.exam_id = e.exam_id AND ea.student_id = ?) as my_attempts,
        (SELECT COUNT(*) FROM exam_attempts ea 
         WHERE ea.exam_id = e.exam_id) as total_attempts,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.exam_id) as total_questions,
        CASE
          WHEN e.status IN ('deleted', 'draft') THEN e.status
          WHEN NOW() < e.start_time THEN 'upcoming'
          WHEN NOW() >= e.start_time 
               AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) THEN 'active'
          ELSE 'completed'
        END AS status
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.class_id
      LEFT JOIN subjects s ON e.subject_id = s.subject_id
      LEFT JOIN users u ON e.teacher_id = u.user_id
      WHERE e.class_id IN (
        SELECT class_id FROM class_students WHERE student_id = ?
      )
      AND e.status != 'deleted'
      ORDER BY e.start_time DESC
    `;
    
    const [exams] = await req.db.query(query, [studentId, studentId]);
    
    console.log('✅ Student exams found:', exams.length);
    res.json(exams);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bài thi', details: err.message });
  }
});

// ============================================
// 📄 LẤY CHI TIẾT BÀI THI
// ============================================
router.get('/:examId', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền truy cập
    const [access] = await req.db.query(
      `SELECT e.class_id FROM exams e
       JOIN class_students cs ON e.class_id = cs.class_id
       WHERE e.exam_id = ? AND cs.student_id = ?`,
      [examId, studentId]
    );

    if (!access.length) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bài thi này' });
    }

    // Lấy thông tin bài thi
    const [exam] = await req.db.query(
      `SELECT 
        e.*,
        c.class_name,
        s.subject_name, 
        u.full_name as teacher_name,
        (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.exam_id) as total_questions,
        (SELECT COUNT(*) FROM exam_attempts WHERE exam_id = e.exam_id AND student_id = ?) as my_attempts,
        (SELECT SUM(points) FROM exam_questions WHERE exam_id = e.exam_id) AS total_points,
        CASE
          WHEN e.status IN ('deleted', 'draft') THEN e.status
          WHEN NOW() < e.start_time THEN 'upcoming'
          WHEN NOW() >= e.start_time 
               AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) THEN 'active'
          ELSE 'completed'
        END AS computed_status
       FROM exams e
       LEFT JOIN classes c ON e.class_id = c.class_id
       LEFT JOIN subjects s ON e.subject_id = s.subject_id
       LEFT JOIN users u ON e.teacher_id = u.user_id
       WHERE e.exam_id = ?`,
      [studentId, examId]
    );

    if (!exam.length) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi' });
    }

    // Lấy lịch sử làm bài
    const [attempts] = await req.db.query(
      `SELECT attempt_id, score, start_time, end_time, status, cheating_detected, is_fully_graded
       FROM exam_attempts
       WHERE exam_id = ? AND student_id = ?
       ORDER BY start_time DESC`,
      [examId, studentId]
    );

    // Kiểm tra xem có câu tự luận chưa chấm cho mỗi attempt
    const attemptsWithGradingStatus = await Promise.all(attempts.map(async (attempt) => {
      const [hasPendingEssay] = await req.db.query(
        `SELECT COUNT(*) as count
         FROM exam_attempt_answers eaa
         JOIN exam_questions eq ON eaa.question_id = eq.question_id
         JOIN question_bank qb ON eq.question_id = qb.question_id
         WHERE eaa.attempt_id = ?
           AND qb.question_type IN ('Essay', 'FillInBlank')
           AND (eaa.is_graded = 0 OR eaa.is_graded IS NULL)`,
        [attempt.attempt_id]
      );
      
      return {
        ...attempt,
        has_pending_grading: (hasPendingEssay[0].count || 0) > 0
      };
    }));

    const examData = { ...exam[0], status: exam[0].computed_status };
    delete examData.computed_status;

    res.json({
      exam: examData,
      attempts: attemptsWithGradingStatus
    });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy chi tiết bài thi', details: err.message });
  }
});

// ============================================
// ▶️ BẮT ĐẦU LÀM BÀI THI - ĐÃ SỬA
// ============================================
router.post('/:examId/start', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId } = req.params;
  const { exam_code } = req.body;
  const studentId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền truy cập
    const [access] = await req.db.query(
      `SELECT 
        e.*,
        CASE
          WHEN e.status IN ('deleted', 'draft') THEN e.status
          WHEN NOW() < e.start_time THEN 'upcoming'
          WHEN NOW() >= e.start_time 
               AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) THEN 'active'
          ELSE 'completed'
        END AS computed_status
       FROM exams e
       JOIN class_students cs ON e.class_id = cs.class_id
       WHERE e.exam_id = ? AND cs.student_id = ?`,
      [examId, studentId]
    );

    if (!access.length) {
      return res.status(403).json({ error: 'Bạn không có quyền làm bài thi này' });
    }

    const exam = access[0];

    // Kiểm tra mã code bài thi
    if (!exam_code) {
      return res.status(400).json({ error: 'Vui lòng nhập mã code bài thi', requires_code: true });
    }

    if (exam.password && exam.password !== exam_code) {
      return res.status(403).json({ error: 'Mã code không đúng. Vui lòng kiểm tra lại!', requires_code: true });
    }

    // Kiểm tra trạng thái
    if (exam.computed_status !== 'active') {
      return res.status(400).json({ 
        error: exam.computed_status === 'upcoming' ? 'Bài thi chưa bắt đầu' : 'Bài thi đã kết thúc',
        status: exam.computed_status
      });
    }

    // ⭐ KIỂM TRA ĐÃ NỘP BÀI CHƯA
    const [submittedAttempts] = await req.db.query(
      `SELECT COUNT(*) as count FROM exam_attempts 
       WHERE exam_id = ? AND student_id = ? AND status IN ('Submitted', 'AutoSubmitted')`,
      [examId, studentId]
    );

    if (submittedAttempts[0].count > 0) {
      return res.status(400).json({ 
        error: 'Bạn đã hoàn thành bài thi này. Không thể làm lại!',
        redirect: 'test-history' // Frontend sẽ chuyển đến trang lịch sử
      });
    }

    // Kiểm tra đã bị cấm
    const [banned] = await req.db.query(
      'SELECT * FROM exam_attempts WHERE exam_id = ? AND student_id = ? AND is_banned = 1',
      [examId, studentId]
    );

    if (banned.length > 0) {
      return res.status(403).json({ error: 'Bạn đã bị cấm làm bài thi này' });
    }

    // Kiểm tra đã có attempt đang làm chưa
    const [existingAttempt] = await req.db.query(
      `SELECT attempt_id FROM exam_attempts 
       WHERE exam_id = ? AND student_id = ? AND status = 'InProgress'`,
      [examId, studentId]
    );

    let attemptId;

    if (existingAttempt.length > 0) {
      attemptId = existingAttempt[0].attempt_id;
    } else {
      const [result] = await req.db.query(
        `INSERT INTO exam_attempts (exam_id, student_id, start_time, status) 
         VALUES (?, ?, NOW(), 'InProgress')`,
        [examId, studentId]
      );
      attemptId = result.insertId;
    }

    // Lấy câu hỏi
    const [questions] = await req.db.query(
      `SELECT 
        eq.question_id,
        eq.points,
        qb.question_content,
        qb.question_type,
        qb.difficulty
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE eq.exam_id = ?
       ORDER BY eq.question_order ASC`,
      [examId]
    );

    // Lấy options cho từng câu hỏi
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const [options] = await req.db.query(
          `SELECT option_id, option_content
           FROM question_options
           WHERE question_id = ?
           ORDER BY option_id ASC`,
          [q.question_id]
        );

        const [savedAnswer] = await req.db.query(
          `SELECT option_id, answer_text FROM exam_attempt_answers
           WHERE attempt_id = ? AND question_id = ?`,
          [attemptId, q.question_id]
        );

        return {
          question_id: q.question_id,
          question_content: q.question_content,
          question_type: q.question_type,
          difficulty: q.difficulty,
          points: q.points,
          options: options,
          saved_answer: savedAnswer.length > 0 ? savedAnswer[0] : null
        };
      })
    );

    // Tính tổng điểm
    const [totalPointsResult] = await req.db.query(
      `SELECT COALESCE(SUM(points), 0) as total FROM exam_questions WHERE exam_id = ?`,
      [examId]
    );

    res.json({
      attempt_id: attemptId,
      exam: {
        exam_id: exam.exam_id,
        exam_name: exam.exam_name,
        duration: exam.duration,
        start_time: exam.start_time,
        total_points: totalPointsResult[0].total
      },
      questions: questionsWithOptions
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi bắt đầu làm bài', details: err.message });
  }
});

// ============================================
// 💾 LƯU ĐÁP ÁN TẠM
// ============================================
router.post('/:examId/save-answer', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId } = req.params;
  const { attempt_id, question_id, answer_text, option_id } = req.body;
  const studentId = req.user.id || req.user.user_id;

  try {
    console.log('🔍 Save-answer request:', { examId, attempt_id, question_id, option_id, answer_text });

    // Kiểm tra attempt_id - ⭐ LOẠI BỎ e.total_points
    const [attempt] = await req.db.query(
      `SELECT ea.*, e.start_time, e.duration
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND ea.student_id = ? AND ea.exam_id = ?`,
      [attempt_id, studentId, examId]
    );

    if (!attempt.length) {
      console.error('❌ Không tìm thấy lượt thi');
      return res.status(403).json({ error: 'Không tìm thấy lượt thi' });
    }

    if (attempt[0].status !== 'InProgress') {
      return res.status(400).json({ error: 'Bài thi đã kết thúc' });
    }

    // Kiểm tra thời gian
    const startTime = new Date(attempt[0].start_time).getTime();
    const durationMs = attempt[0].duration * 60 * 1000;
    const currentTime = Date.now();
    
    if (currentTime > startTime + durationMs) {
      return res.status(403).json({ error: 'Thời gian làm bài đã hết' });
    }

    // Kiểm tra question_id
    const [question] = await req.db.query(
      `SELECT qb.question_type
       FROM question_bank qb
       JOIN exam_questions eq ON qb.question_id = eq.question_id
       WHERE qb.question_id = ? AND eq.exam_id = ?`,
      [question_id, examId]
    );

    if (!question.length) {
      return res.status(404).json({ error: 'Câu hỏi không tồn tại' });
    }

    const questionType = question[0].question_type;
    console.log('🔍 Question type:', questionType);

    // Xác thực dữ liệu
    if (questionType === 'SingleChoice') {
      if (!option_id) {
        return res.status(400).json({ error: 'Yêu cầu option_id' });
      }
      const [validOption] = await req.db.query(
        `SELECT option_id FROM question_options WHERE question_id = ? AND option_id = ?`,
        [question_id, option_id]
      );
      if (!validOption.length) {
        return res.status(400).json({ error: 'option_id không hợp lệ' });
      }
    }

    // Lưu đáp án
    const [result] = await req.db.query(
      `INSERT INTO exam_attempt_answers (attempt_id, question_id, option_id, answer_text, answered_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         option_id = VALUES(option_id), 
         answer_text = VALUES(answer_text), 
         answered_at = NOW()`,
      [attempt_id, question_id, option_id || null, answer_text || null]
    );

    console.log('✅ Đã lưu đáp án:', { attempt_id, question_id, affectedRows: result.affectedRows });

    res.json({ success: true, message: 'Đã lưu đáp án' });
  } catch (err) {
    console.error('❌ Error in save-answer:', err);
    res.status(500).json({ error: 'Lỗi khi lưu đáp án', details: err.message });
  }
});

// ============================================
// 🚨 LOG GIAN LẬN TRONG LÚC THI
// ============================================
router.post('/:examId/cheating-log', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId } = req.params;
  const { attempt_id, event_type, event_description } = req.body;
  const studentId = req.user.id || req.user.user_id;

  try {
    if (!attempt_id || !event_type) {
      return res.status(400).json({ error: 'Thiếu attempt_id hoặc event_type' });
    }

    // Xác thực attempt thuộc về học sinh và bài thi
    const [attempt] = await req.db.query(
      `SELECT attempt_id FROM exam_attempts
       WHERE attempt_id = ? AND student_id = ? AND exam_id = ?`,
      [attempt_id, studentId, examId]
    );

    if (!attempt.length) {
      return res.status(403).json({ error: 'Attempt không hợp lệ' });
    }

    // Ghi log gian lận
    await req.db.query(
      `INSERT INTO anti_cheating_logs (attempt_id, event_type, event_description, event_time)
       VALUES (?, ?, ?, NOW())`,
      [attempt_id, event_type, event_description || null]
    );

    // Đánh dấu cờ nghi ngờ nếu cần
    await req.db.query(
      `UPDATE exam_attempts SET cheating_detected = 1 WHERE attempt_id = ?`,
      [attempt_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error in cheating-log:', err);
    res.status(500).json({ error: 'Lỗi khi ghi log gian lận', details: err.message });
  }
});

// ============================================
// 📤 NỘP BÀI THI - ĐÃ SỬA LOGIC TÍNH ĐIỂM
// ============================================
router.post('/:examId/submit', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId } = req.params;
  const { attempt_id } = req.body;
  const studentId = req.user.id || req.user.user_id;

  try {
    console.log('🔍 Submit request:', { examId, attempt_id });

    const [attempt] = await req.db.query(
      `SELECT ea.*, e.start_time, e.duration
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND ea.student_id = ? AND ea.exam_id = ?`,
      [attempt_id, studentId, examId]
    );

    if (!attempt.length) {
      return res.status(403).json({ error: 'Không tìm thấy lượt thi' });
    }

    if (attempt[0].status !== 'InProgress') {
      return res.status(400).json({ error: 'Bài thi đã được nộp' });
    }

    // ⭐ LẤY TẤT CẢ CÂU HỎI VÀ ĐÁP ÁN
    const [answers] = await req.db.query(
      `SELECT 
        eq.question_id,
        eq.points,
        qb.question_type,
        qb.correct_answer_text,
        eaa.answer_text,
        eaa.option_id
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       LEFT JOIN exam_attempt_answers eaa ON eq.question_id = eaa.question_id AND eaa.attempt_id = ?
       WHERE eq.exam_id = ?
       ORDER BY eq.question_order`,
      [attempt_id, examId]
    );

    console.log('🔍 Total questions:', answers.length);

    let totalScore = 0.0;

    // ⭐ TÍNH ĐIỂM CHO TỪNG CÂU
    for (const question of answers) {
      let isCorrect = false;
      
      if (question.question_type === 'SingleChoice') {
        // ⭐ CÂU HỎI 1 LỰA CHỌN
        if (question.option_id) {
          const [correctOption] = await req.db.query(
            `SELECT option_id FROM question_options WHERE question_id = ? AND is_correct = 1`,
            [question.question_id]
          );
          
          if (correctOption.length > 0) {
            isCorrect = question.option_id === correctOption[0].option_id;
          }
        }
      } 
      else if (question.question_type === 'MultipleChoice') {
        // ⭐ CÂU HỎI NHIỀU LỰA CHỌN
        if (question.answer_text) {
          const [correctOptions] = await req.db.query(
            `SELECT GROUP_CONCAT(option_id ORDER BY option_id) AS correct_ids
             FROM question_options
             WHERE question_id = ? AND is_correct = 1`,
            [question.question_id]
          );
          
          if (correctOptions.length > 0 && correctOptions[0].correct_ids) {
            const studentAnswers = question.answer_text.split(',').map(id => id.trim()).sort().join(',');
            const correctAnswers = correctOptions[0].correct_ids;
            isCorrect = studentAnswers === correctAnswers;
          }
        }
      }
      else if (['FillInBlank', 'Essay'].includes(question.question_type)) {
        // ⭐ CÂU HỎI TỰ LUẬN
        if (question.answer_text && question.correct_answer_text) {
          isCorrect = question.answer_text.trim().toLowerCase() === question.correct_answer_text.trim().toLowerCase();
        }
      }

      // ⭐ CỘNG ĐIỂM NẾU ĐÚNG
      if (isCorrect) {
        const pointValue = parseFloat(question.points || 0);
        totalScore += isNaN(pointValue) ? 0 : pointValue;
        console.log(`✅ Câu ${question.question_id}: +${pointValue} điểm`);
      } else {
        console.log(`❌ Câu ${question.question_id}: 0 điểm`);
      }

      // ⭐ CẬP NHẬT is_correct VÀO BẢNG exam_attempt_answers
      await req.db.query(
        `UPDATE exam_attempt_answers 
         SET is_correct = ?
         WHERE attempt_id = ? AND question_id = ?`,
        [isCorrect ? 1 : 0, attempt_id, question.question_id]
      );
    }

    // ⭐ LÀM TRÒN ĐIỂM (1 chữ số thập phân)
    totalScore = Math.round(totalScore * 10) / 10;

    // ⭐ KIỂM TRA XEM CÓ CÂU HỎI TỰ LUẬN/FILLINBLANK CHƯA CHẤM KHÔNG
    const [pendingManual] = await req.db.query(
      `SELECT COUNT(*) as count
       FROM exam_attempt_answers eaa
       JOIN exam_questions eq ON eaa.question_id = eq.question_id
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE eaa.attempt_id = ?
         AND qb.question_type IN ('Essay', 'FillInBlank')
         AND (eaa.is_graded = 0 OR eaa.is_graded IS NULL)`,
      [attempt_id]
    );

    // ⭐ is_fully_graded chỉ = 1 nếu KHÔNG có câu hỏi tự luận nào chưa chấm
    const isFullyGraded = pendingManual[0].count === 0 ? 1 : 0;

    // ⭐ CẬP NHẬT ĐIỂM VÀ TRẠNG THÁI
    await req.db.query(
      `UPDATE exam_attempts 
       SET status = 'Submitted', score = ?, end_time = NOW(), is_fully_graded = ?
       WHERE attempt_id = ?`,
      [totalScore, isFullyGraded, attempt_id]
    );

    console.log('✅ Đã nộp bài:', { attempt_id, totalScore, isFullyGraded });

    // Kiểm tra xem có câu tự luận không
    const [hasEssayQuestions] = await req.db.query(
      `SELECT COUNT(*) as count
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE eq.exam_id = ? AND qb.question_type IN ('Essay', 'FillInBlank')`,
      [examId]
    );

    res.json({
      success: true,
      score: totalScore,
      is_fully_graded: isFullyGraded,
      has_essay_questions: (hasEssayQuestions[0].count || 0) > 0,
      message: isFullyGraded === 0 && (hasEssayQuestions[0].count || 0) > 0 
        ? 'Nộp bài thành công. Bài thi có câu tự luận cần giáo viên chấm điểm.'
        : 'Nộp bài thành công'
    });
  } catch (err) {
    console.error('❌ Error in submit:', err);
    res.status(500).json({ error: 'Lỗi khi nộp bài', details: err.message });
  }
});

// ============================================
// 📊 XEM KẾT QUẢ BÀI THI - ĐÃ SỬA
// ============================================
router.get('/:examId/result/:attemptId', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId, attemptId } = req.params;
  const studentId = req.user.id || req.user.user_id;

  try {
    console.log('🔍 Result request:', { examId, attemptId });

    // Lấy thông tin attempt
    const [attempt] = await req.db.query(
      `SELECT 
        ea.*,
        e.exam_name,
        (SELECT SUM(points) FROM exam_questions WHERE exam_id = ea.exam_id) AS total_points
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND ea.student_id = ? AND ea.exam_id = ?`,
      [attemptId, studentId, examId]
    );

    if (!attempt.length) {
      return res.status(403).json({ error: 'Không tìm thấy lượt thi' });
    }

    // ⭐ LẤY KẾT QUẢ CHI TIẾT VÀ TÍNH is_correct NGAY TẠI ĐÂY
    const [results] = await req.db.query(
      `SELECT 
        eq.question_id,
        qb.question_content,
        qb.question_type,
        qb.correct_answer_text,
        eq.points,
        eaa.answer_text AS student_answer,
        eaa.option_id,
        eaa.is_correct as db_is_correct
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       LEFT JOIN exam_attempt_answers eaa ON eq.question_id = eaa.question_id AND eaa.attempt_id = ?
       WHERE eq.exam_id = ?
       ORDER BY eq.question_order`,
      [attemptId, examId]
    );

    // ⭐ TÍNH LẠI is_correct CHO TỪNG CÂU (PHÒNG TRƯỜNG HỢP CHƯA CẬP NHẬT)
    const formattedResults = await Promise.all(results.map(async (r) => {
      let isCorrect = false;

      // ⭐ TÍNH TOÁN is_correct
      if (r.question_type === 'SingleChoice') {
        if (r.option_id) {
          const [correctOption] = await req.db.query(
            `SELECT option_id FROM question_options WHERE question_id = ? AND is_correct = 1`,
            [r.question_id]
          );
          if (correctOption.length > 0) {
            isCorrect = r.option_id === correctOption[0].option_id;
          }
        }
      } 
      else if (r.question_type === 'MultipleChoice') {
        if (r.student_answer) {
          const [correctOptions] = await req.db.query(
            `SELECT GROUP_CONCAT(option_id ORDER BY option_id) AS correct_ids
             FROM question_options
             WHERE question_id = ? AND is_correct = 1`,
            [r.question_id]
          );
          if (correctOptions.length > 0 && correctOptions[0].correct_ids) {
            const studentAnswers = r.student_answer.split(',').map(id => id.trim()).sort().join(',');
            const correctAnswers = correctOptions[0].correct_ids;
            isCorrect = studentAnswers === correctAnswers;
          }
        }
      }
      else if (['FillInBlank', 'Essay'].includes(r.question_type)) {
        if (r.student_answer && r.correct_answer_text) {
          isCorrect = r.student_answer.trim().toLowerCase() === r.correct_answer_text.trim().toLowerCase();
        }
      }

      // ⭐ LẤY OPTIONS
      const [options] = await req.db.query(
        `SELECT option_id, option_content, is_correct
         FROM question_options
         WHERE question_id = ?
         ORDER BY option_id`,
        [r.question_id]
      );

      return { 
        ...r, 
        is_correct: isCorrect ? 1 : 0, // ⭐ GHI ĐÈ is_correct
        options 
      };
    }));

    console.log('✅ Result data:', {
      score: attempt[0].score || 0,
      total_points: attempt[0].total_points || 0,
      questions: formattedResults.length,
      correct_count: formattedResults.filter(r => r.is_correct === 1).length
    });

    // Kiểm tra xem có câu tự luận chưa chấm không
    const [hasPendingEssay] = await req.db.query(
      `SELECT COUNT(*) as count
       FROM exam_attempt_answers eaa
       JOIN exam_questions eq ON eaa.question_id = eq.question_id
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE eaa.attempt_id = ?
         AND qb.question_type IN ('Essay', 'FillInBlank')
         AND (eaa.is_graded = 0 OR eaa.is_graded IS NULL)`,
      [attemptId]
    );

    res.json({
      attempt: {
        score: attempt[0].score || 0,
        total_points: attempt[0].total_points || 0,
        start_time: attempt[0].start_time,
        end_time: attempt[0].end_time,
        exam_name: attempt[0].exam_name,
        is_fully_graded: attempt[0].is_fully_graded || 0,
        has_pending_grading: (hasPendingEssay[0].count || 0) > 0
      },
      results: formattedResults
    });
  } catch (err) {
    console.error('❌ Error in result:', err);
    res.status(500).json({ error: 'Lỗi khi lấy kết quả', details: err.message });
  }
});

module.exports = router;