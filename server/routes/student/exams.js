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
// 📄 LẤY ATTEMPT HIỆN TẠI (KHI RELOAD TRANG)
// ============================================
router.get('/:examId/attempt/:attemptId', authMiddleware, roleMiddleware(['student']), async (req, res) => {
  const { examId, attemptId } = req.params;
  const studentId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền truy cập
    const [attempt] = await req.db.query(
      `SELECT ea.*, e.duration, e.exam_name, e.start_time as exam_start_time
       FROM exam_attempts ea
       JOIN exams e ON ea.exam_id = e.exam_id
       WHERE ea.attempt_id = ? AND ea.student_id = ? AND ea.exam_id = ? AND ea.status = 'InProgress'`,
      [attemptId, studentId, examId]
    );

    if (!attempt.length) {
      return res.status(404).json({ error: 'Không tìm thấy attempt hoặc attempt đã kết thúc' });
    }

    const attemptData = attempt[0];

    // ⭐ LẤY THÔNG TIN SHUFFLE TỪ EXAM
    const [examSettings] = await req.db.query(
      `SELECT shuffle_questions, shuffle_options FROM exams WHERE exam_id = ?`,
      [examId]
    );
    const shouldShuffleQuestions = examSettings[0]?.shuffle_questions === 1 || examSettings[0]?.shuffle_questions === '1';
    const shouldShuffleOptions = examSettings[0]?.shuffle_options === 1 || examSettings[0]?.shuffle_options === '1';
    
    console.log(`🔍 [Load Attempt] Exam ${examId}, Attempt ${attemptId}: shuffle_questions=${shouldShuffleQuestions}, shuffle_options=${shouldShuffleOptions}`);

    // Lấy câu hỏi và đáp án đã lưu
    let [questions] = await req.db.query(
      `SELECT 
        eq.question_id,
        eq.points,
        qb.question_content,
        qb.question_type,
        qb.difficulty,
        eaa.option_id,
        eaa.answer_text
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       LEFT JOIN exam_attempt_answers eaa ON eq.question_id = eaa.question_id AND eaa.attempt_id = ?
       WHERE eq.exam_id = ?
       ORDER BY eq.question_order ASC`,
      [attemptId, examId]
    );

    // ⭐ XÁO TRỘN CÂU HỎI NẾU BẬT - ĐẢM BẢO MỖI HỌC SINH CÓ THỨ TỰ KHÁC NHAU
    if (shouldShuffleQuestions && questions.length > 0) {
      console.log(`🔄 [Load Attempt - Shuffle Questions] Starting shuffle for student ${studentId}, attempt ${attemptId}, exam ${examId}`);
      
      // Tạo seed độc nhất từ nhiều yếu tố
      const hashSeed = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash) || 1;
      };
      
      // ⭐ TẠO SEED ĐỘC NHẤT CHO MỖI HỌC SINH - DÙNG NHIỀU YẾU TỐ + TIMESTAMP
      const examInfo = attemptData.exam_name || '';
      const examHash = hashSeed(examInfo);
      const startTime = new Date(attemptData.start_time).getTime(); // Thêm timestamp từ start_time
      const seedString = `${studentId}_${attemptId}_${examId}_${questions.length}_${examHash}_${startTime}_${studentId * 7919 + attemptId * 1009}`;
      let seed = hashSeed(seedString);
      
      // Đảm bảo seed đủ lớn và phân bố tốt
      seed = (seed * 7919 + studentId * 1009 + attemptId * 997 + startTime % 10000) % 2147483647;
      seed = (seed * 16807 + examHash) % 2147483647;
      if (seed === 0) seed = studentId * 7919 + attemptId * 1009 + (startTime % 1000000) + 1;
      
      console.log(`   Seed string: ${seedString}`);
      console.log(`   Final seed: ${seed}`);
      
      // Cải thiện thuật toán seeded random (Park-Miller LCG)
      const seededRandom = (initialSeed) => {
        let value = initialSeed || 1;
        for (let i = 0; i < 20; i++) {
          value = ((value * 16807) % 2147483647);
        }
        return () => {
          value = ((value * 16807) % 2147483647);
          return value / 2147483647;
        };
      };
      const random = seededRandom(seed);
      
      // Fisher-Yates shuffle với seeded random
      const shuffledQuestions = [...questions];
      for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      }
      
      questions = shuffledQuestions;
      console.log(`✅ [Load Attempt - Shuffle Questions] Shuffled ${questions.length} questions`);
    }

    // Lấy options cho mỗi câu hỏi
    const questionsWithOptions = await Promise.all(questions.map(async (q) => {
      try {
        let [options] = await req.db.query(
          `SELECT option_id, option_content, is_correct 
           FROM question_options 
           WHERE question_id = ? 
           ORDER BY option_id ASC`,
          [q.question_id]
        );

        // ⭐ XÁO TRỘN OPTIONS NẾU BẬT (chỉ với trắc nghiệm) - ĐẢM BẢO MỖI HỌC SINH CÓ THỨ TỰ KHÁC NHAU
        if (shouldShuffleOptions && (q.question_type === 'SingleChoice' || q.question_type === 'MultipleChoice') && options.length > 0) {
          console.log(`🔄 [Load Attempt - Shuffle Options] Starting shuffle for question ${q.question_id}, student ${studentId}, attempt ${attemptId}`);
          
          // Tạo seed độc nhất từ nhiều yếu tố
          const hashSeed = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            return Math.abs(hash) || 1;
          };
          
          // ⭐ TẠO SEED ĐỘC NHẤT CHO MỖI HỌC SINH VÀ MỖI CÂU HỎI
          const questionHash = hashSeed(q.question_content || '');
          const startTime = new Date(attemptData.start_time).getTime(); // Thêm timestamp từ start_time
          const seedString = `${studentId}_${attemptId}_${q.question_id}_${examId}_${options.length}_${questionHash}_${startTime}_${studentId * 7919 + attemptId * 1009 + q.question_id * 997}`;
          let seed = hashSeed(seedString);
          
          // Đảm bảo seed đủ lớn và phân bố tốt
          seed = (seed * 7919 + studentId * 1009 + attemptId * 997 + q.question_id * 503 + startTime % 10000) % 2147483647;
          seed = (seed * 16807 + questionHash) % 2147483647;
          if (seed === 0) seed = studentId * 7919 + attemptId * 1009 + q.question_id * 997 + (startTime % 1000000) + 1;
          
          // Cải thiện thuật toán seeded random (Park-Miller LCG)
          const seededRandom = (initialSeed) => {
            let value = initialSeed || 1;
            for (let i = 0; i < 20; i++) {
              value = ((value * 16807) % 2147483647);
            }
            return () => {
              value = ((value * 16807) % 2147483647);
              return value / 2147483647;
            };
          };
          
          const random = seededRandom(seed);
          
          // Fisher-Yates shuffle với seeded random
          const shuffledOptions = [...options];
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }
          
          options = shuffledOptions;
          console.log(`✅ [Load Attempt - Shuffle Options] Shuffled ${options.length} options for question ${q.question_id}`);
        }

        // Xử lý saved_answer cho MultipleChoice (có thể có nhiều option_id)
        let saved_answer = null;
        if (q.option_id) {
          // Nếu có option_id, có thể là SingleChoice hoặc MultipleChoice
          // Kiểm tra question_type để xác định
          if (q.question_type === 'MultipleChoice') {
            // Lấy tất cả option_id cho MultipleChoice
            const [allAnswers] = await req.db.query(
              `SELECT option_id FROM exam_attempt_answers 
               WHERE attempt_id = ? AND question_id = ?`,
              [attemptId, q.question_id]
            );
            saved_answer = allAnswers.map(a => a.option_id);
          } else {
            saved_answer = q.option_id;
          }
        } else if (q.answer_text) {
          saved_answer = q.answer_text;
        }

        return {
          question_id: q.question_id,
          question_content: q.question_content,
          question_type: q.question_type,
          difficulty: q.difficulty,
          points: q.points,
          options: options || [],
          saved_answer: saved_answer
        };
      } catch (optionError) {
        console.error(`❌ Error loading options for question ${q.question_id}:`, optionError);
        return {
          question_id: q.question_id,
          question_content: q.question_content,
          question_type: q.question_type,
          difficulty: q.difficulty,
          points: q.points,
          options: [],
          saved_answer: null
        };
      }
    }));

    res.json({
      attempt: {
        attempt_id: attemptData.attempt_id,
        start_time: attemptData.start_time,
        status: attemptData.status
      },
      exam: {
        exam_id: parseInt(examId),
        exam_name: attemptData.exam_name,
        duration: attemptData.duration,
        start_time: attemptData.exam_start_time
      },
      questions: questionsWithOptions
    });
  } catch (err) {
    console.error('❌ Error loading attempt:', err);
    res.status(500).json({ error: 'Lỗi khi load attempt', details: err.message });
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
    let attemptStartTime; // Lưu start_time để dùng cho shuffle

    if (existingAttempt.length > 0) {
      attemptId = existingAttempt[0].attempt_id;
      // Lấy start_time từ attempt hiện có
      const [attemptInfo] = await req.db.query(
        'SELECT start_time FROM exam_attempts WHERE attempt_id = ?',
        [attemptId]
      );
      attemptStartTime = attemptInfo[0]?.start_time ? new Date(attemptInfo[0].start_time).getTime() : Date.now();
    } else {
      const [result] = await req.db.query(
        `INSERT INTO exam_attempts (exam_id, student_id, start_time, status) 
         VALUES (?, ?, NOW(), 'InProgress')`,
        [examId, studentId]
      );
      attemptId = result.insertId;
      attemptStartTime = Date.now(); // Dùng thời gian hiện tại vì vừa tạo với NOW()
      
      // ⭐ EMIT SOCKET ĐỂ THÔNG BÁO GIÁO VIÊN HỌC SINH BẮT ĐẦU LÀM BÀI
      if (req.io) {
        const [examInfo] = await req.db.query(
          'SELECT teacher_id, class_id FROM exams WHERE exam_id = ?',
          [examId]
        );
        if (examInfo.length > 0) {
          const socketService = require('../../services/socketService');
          socketService.emitStudentStartedExam(
            req.io,
            examInfo[0].teacher_id,
            examId,
            studentId,
            attemptId,
            examInfo[0].class_id
          );
        }
      }
    }

    // ⭐ LẤY THÔNG TIN SHUFFLE TỪ EXAM
    const [examSettings] = await req.db.query(
      `SELECT shuffle_questions, shuffle_options FROM exams WHERE exam_id = ?`,
      [examId]
    );
    const shouldShuffleQuestions = examSettings[0]?.shuffle_questions === 1 || examSettings[0]?.shuffle_questions === '1';
    const shouldShuffleOptions = examSettings[0]?.shuffle_options === 1 || examSettings[0]?.shuffle_options === '1';
    
    console.log(`🔍 [Shuffle Check] Exam ${examId}: shuffle_questions=${examSettings[0]?.shuffle_questions}, shuffle_options=${examSettings[0]?.shuffle_options}`);
    console.log(`   Should shuffle questions: ${shouldShuffleQuestions}, Should shuffle options: ${shouldShuffleOptions}`);

    // Lấy câu hỏi
    let [questions] = await req.db.query(
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

    // ⭐ XÁO TRỘN CÂU HỎI NẾU BẬT - ĐẢM BẢO MỖI HỌC SINH CÓ THỨ TỰ KHÁC NHAU
    if (shouldShuffleQuestions && questions.length > 0) {
      console.log(`🔄 [Shuffle Questions] Starting shuffle for student ${studentId}, attempt ${attemptId}, exam ${examId}`);
      console.log(`   Original order: ${questions.map((q, idx) => `Q${idx + 1}:ID${q.question_id}`).join(' -> ')}`);
      
      // Tạo seed độc nhất từ nhiều yếu tố + thêm timestamp để đảm bảo mỗi học sinh khác nhau
      const hashSeed = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash) || 1;
      };
      
      // ⭐ TẠO SEED ĐỘC NHẤT CHO MỖI HỌC SINH - DÙNG NHIỀU YẾU TỐ + TIMESTAMP
      // Thêm thông tin từ exam và timestamp để đảm bảo mỗi học sinh khác nhau
      const examInfo = exam.exam_name || '';
      const examHash = hashSeed(examInfo);
      const startTime = attemptStartTime; // Dùng start_time đã lấy ở trên
      const seedString = `${studentId}_${attemptId}_${examId}_${questions.length}_${examHash}_${startTime}_${studentId * 7919 + attemptId * 1009}`;
      let seed = hashSeed(seedString);
      
      // Đảm bảo seed đủ lớn và phân bố tốt - dùng nhiều phép toán để tăng độ ngẫu nhiên
      seed = (seed * 7919 + studentId * 1009 + attemptId * 997 + startTime % 10000) % 2147483647;
      seed = (seed * 16807 + examHash) % 2147483647;
      if (seed === 0) seed = studentId * 7919 + attemptId * 1009 + (startTime % 1000000) + 1;
      
      console.log(`   Seed string: ${seedString}`);
      console.log(`   Final seed: ${seed}`);
      
      // Cải thiện thuật toán seeded random (Park-Miller LCG)
      const seededRandom = (initialSeed) => {
        let value = initialSeed || 1;
        // Khởi tạo seed tốt hơn với nhiều lần warm-up
        for (let i = 0; i < 20; i++) {
          value = ((value * 16807) % 2147483647);
        }
        return () => {
          value = ((value * 16807) % 2147483647);
          return value / 2147483647;
        };
      };
      const random = seededRandom(seed);
      
      // Fisher-Yates shuffle với seeded random - ĐẢM BẢO SHUFFLE THỰC SỰ
      const shuffledQuestions = [...questions]; // Copy array
      for (let i = shuffledQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        // Swap
        [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
      }
      
      // Gán lại questions đã shuffle
      questions = shuffledQuestions;
      
      console.log(`✅ [Shuffle Questions] Shuffled ${questions.length} questions`);
      console.log(`   New order: ${questions.map((q, idx) => `Q${idx + 1}:ID${q.question_id}`).join(' -> ')}`);
    } else if (!shouldShuffleQuestions) {
      console.log(`ℹ️ [Shuffle Questions] Shuffle is DISABLED for this exam`);
    }

    // Lấy options cho từng câu hỏi
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        let [options] = await req.db.query(
          `SELECT option_id, option_content
           FROM question_options
           WHERE question_id = ?
           ORDER BY option_id ASC`,
          [q.question_id]
        );

        // ⭐ XÁO TRỘN OPTIONS NẾU BẬT (chỉ với trắc nghiệm) - ĐẢM BẢO MỖI HỌC SINH CÓ THỨ TỰ KHÁC NHAU
        if (shouldShuffleOptions && (q.question_type === 'SingleChoice' || q.question_type === 'MultipleChoice') && options.length > 0) {
          console.log(`🔄 [Shuffle Options] Starting shuffle for question ${q.question_id}, student ${studentId}, attempt ${attemptId}`);
          console.log(`   Original options order: ${options.map((o, idx) => `${String.fromCharCode(65 + idx)}:${o.option_id}(${o.is_correct ? '✓' : '✗'})`).join(' ')}`);
          
          // Tạo seed độc nhất từ nhiều yếu tố + thêm timestamp để đảm bảo mỗi học sinh khác nhau
          const hashSeed = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
              const char = str.charCodeAt(i);
              hash = ((hash << 5) - hash) + char;
              hash = hash & hash;
            }
            return Math.abs(hash) || 1;
          };
          
          // ⭐ TẠO SEED ĐỘC NHẤT CHO MỖI HỌC SINH VÀ MỖI CÂU HỎI
          // Thêm thông tin từ question và timestamp để đảm bảo mỗi câu hỏi khác nhau
          const questionHash = hashSeed(q.question_content || '');
          const startTime = attemptStartTime; // Dùng start_time đã lấy ở trên
          const seedString = `${studentId}_${attemptId}_${q.question_id}_${examId}_${options.length}_${questionHash}_${startTime}_${studentId * 7919 + attemptId * 1009 + q.question_id * 997}`;
          let seed = hashSeed(seedString);
          
          // Đảm bảo seed đủ lớn và phân bố tốt - dùng nhiều phép toán để tăng độ ngẫu nhiên
          seed = (seed * 7919 + studentId * 1009 + attemptId * 997 + q.question_id * 503 + startTime % 10000) % 2147483647;
          seed = (seed * 16807 + questionHash) % 2147483647;
          if (seed === 0) seed = studentId * 7919 + attemptId * 1009 + q.question_id * 997 + (startTime % 1000000) + 1;
          
          console.log(`   Seed string: ${seedString}`);
          console.log(`   Final seed: ${seed}`);
          
          // Cải thiện thuật toán seeded random (Park-Miller LCG)
          const seededRandom = (initialSeed) => {
            let value = initialSeed || 1;
            // Khởi tạo seed tốt hơn với nhiều lần warm-up
            for (let i = 0; i < 20; i++) {
              value = ((value * 16807) % 2147483647);
            }
            return () => {
              value = ((value * 16807) % 2147483647);
              return value / 2147483647;
            };
          };
          
          const random = seededRandom(seed);
          
          // Fisher-Yates shuffle với seeded random - ĐẢM BẢO SHUFFLE THỰC SỰ
          const shuffledOptions = [...options]; // Copy array để không ảnh hưởng original
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            // Swap
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }
          
          // Gán lại options đã shuffle
          options = shuffledOptions;
          
          console.log(`✅ [Shuffle Options] Shuffled ${options.length} options`);
          console.log(`   New order: ${options.map((o, idx) => `${String.fromCharCode(65 + idx)}:${o.option_id}(${o.is_correct ? '✓' : '✗'})`).join(' ')}`);
        } else if (shouldShuffleOptions && (q.question_type === 'SingleChoice' || q.question_type === 'MultipleChoice')) {
          console.log(`ℹ️ [Shuffle Options] Skipped - No options or wrong question type for question ${q.question_id}`);
        }

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

    // Ghi log gian lận (video sẽ được lưu riêng qua API khác)
    await req.db.query(
      `INSERT INTO anti_cheating_logs (attempt_id, event_type, event_description, event_time, is_recorded)
       VALUES (?, ?, ?, NOW(), 0)`,
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
// 🎥 LƯU VIDEO KHI AI PHÁT HIỆN VI PHẠM
// ============================================
const multer = require('multer');
const videoStorage = require('../../utils/videoStorage');

// Cấu hình multer để nhận video
const upload = multer({
  storage: multer.memoryStorage(), // Lưu vào memory trước
  limits: {
    fileSize: 50 * 1024 * 1024 // Giới hạn 50MB
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận file video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file video!'), false);
    }
  }
});

router.post('/:examId/violation-video', 
  authMiddleware, 
  roleMiddleware(['student']), 
  upload.single('video'),
  async (req, res) => {
    const { examId } = req.params;
    const { attempt_id, event_type, violation_time, duration_before = 30, duration_after = 30 } = req.body;
    const studentId = req.user.id || req.user.user_id;

    try {
      if (!attempt_id || !event_type) {
        return res.status(400).json({ error: 'Thiếu attempt_id hoặc event_type' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Không có file video' });
      }

      // Xác thực attempt
      const [attempt] = await req.db.query(
        `SELECT attempt_id FROM exam_attempts
         WHERE attempt_id = ? AND student_id = ? AND exam_id = ?`,
        [attempt_id, studentId, examId]
      );

      if (!attempt.length) {
        return res.status(403).json({ error: 'Attempt không hợp lệ' });
      }

      // Lưu video vào thư mục
      const videoPath = await videoStorage.saveVideo(
        attempt_id,
        req.file.buffer,
        true, // isViolation = true
        event_type
      );

      // Tính thời lượng video (giây)
      const videoDuration = Math.ceil((parseInt(duration_before) + parseInt(duration_after)) / 1000);

      // Tìm log mới nhất của attempt này với event_type này (trong vòng 60 giây)
      // Để đảm bảo tìm đúng log vừa được tạo
      const [latestLog] = await req.db.query(
        `SELECT log_id FROM anti_cheating_logs 
         WHERE attempt_id = ? AND event_type = ? 
         AND event_time >= DATE_SUB(NOW(), INTERVAL 60 SECOND)
         ORDER BY event_time DESC LIMIT 1`,
        [attempt_id, event_type]
      );

      if (latestLog.length > 0) {
        // Cập nhật log đã có
        await req.db.query(
          `UPDATE anti_cheating_logs 
           SET video_path = ?, video_duration = ?, is_recorded = 1 
           WHERE log_id = ?`,
          [videoPath, videoDuration, latestLog[0].log_id]
        );
        console.log(`✅ [Video] Đã cập nhật video_path cho log_id: ${latestLog[0].log_id}`);
      } else {
        // Nếu không tìm thấy log trong 60 giây, tìm log mới nhất không có video
        const [latestLogWithoutVideo] = await req.db.query(
          `SELECT log_id FROM anti_cheating_logs 
           WHERE attempt_id = ? AND event_type = ? 
           AND (video_path IS NULL OR video_path = '')
           ORDER BY event_time DESC LIMIT 1`,
          [attempt_id, event_type]
        );
        
        if (latestLogWithoutVideo.length > 0) {
          await req.db.query(
            `UPDATE anti_cheating_logs 
             SET video_path = ?, video_duration = ?, is_recorded = 1 
             WHERE log_id = ?`,
            [videoPath, videoDuration, latestLogWithoutVideo[0].log_id]
          );
          console.log(`✅ [Video] Đã cập nhật video_path cho log_id (không có video): ${latestLogWithoutVideo[0].log_id}`);
        } else {
          // Tạo log mới nếu chưa có
          await req.db.query(
            `INSERT INTO anti_cheating_logs 
             (attempt_id, event_type, event_description, event_time, video_path, video_duration, is_recorded)
             VALUES (?, ?, ?, NOW(), ?, ?, 1)`,
            [attempt_id, event_type, `Video vi phạm: ${event_type}`, videoPath, videoDuration]
          );
          console.log(`✅ [Video] Đã tạo log mới với video_path`);
        }
      }

      res.json({ 
        success: true, 
        video_path: videoPath,
        file_size: req.file.size,
        message: 'Đã lưu video vi phạm thành công' 
      });
    } catch (err) {
      console.error('❌ Error saving violation video:', err);
      res.status(500).json({ error: 'Lỗi khi lưu video', details: err.message });
    }
  }
);

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

    // ⭐ KIỂM TRA VÀ TRỪ ĐIỂM NẾU CHUYỂN TAB QUÁ 3 LẦN
    let penaltyAmount = 0;
    let penaltyReason = null;
    
    // Đếm số lần chuyển tab
    const [tabSwitchLogs] = await req.db.query(
      `SELECT COUNT(*) as count 
       FROM anti_cheating_logs 
       WHERE attempt_id = ? AND event_type = 'TabSwitch'`,
      [attempt_id]
    );
    
    const tabSwitchCount = tabSwitchLogs[0]?.count || 0;
    
    if (tabSwitchCount > 3) {
      // Tính điểm trắc nghiệm (chỉ trừ điểm trắc nghiệm)
      const [mcScore] = await req.db.query(
        `SELECT 
          SUM(CASE 
            WHEN eaa.is_correct = 1 AND qb.question_type IN ('SingleChoice', 'MultipleChoice') 
            THEN eq.points 
            ELSE 0 
          END) as mc_score
         FROM exam_attempt_answers eaa
         JOIN exam_questions eq ON eaa.question_id = eq.question_id
         JOIN question_bank qb ON eq.question_id = qb.question_id
         WHERE eaa.attempt_id = ?`,
        [attempt_id]
      );
      
      const mcScoreValue = parseFloat(mcScore[0]?.mc_score || 0);
      
      // Trừ 10% điểm trắc nghiệm
      penaltyAmount = Math.round((mcScoreValue * 0.1) * 10) / 10;
      penaltyReason = `Bị trừ ${penaltyAmount} điểm (10% điểm trắc nghiệm) do chuyển tab ${tabSwitchCount} lần (vượt quá giới hạn 3 lần)`;
      
      totalScore = Math.max(0, totalScore - penaltyAmount);
      console.log(`⚠️ Penalty applied: -${penaltyAmount} điểm (${tabSwitchCount} lần chuyển tab)`);
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

    // ⭐ CẬP NHẬT ĐIỂM VÀ TRẠNG THÁI (bao gồm penalty nếu có)
    await req.db.query(
      `UPDATE exam_attempts 
       SET status = 'Submitted', 
           score = ?, 
           end_time = NOW(), 
           is_fully_graded = ?,
           penalty_amount = ?,
           penalty_reason = ?
       WHERE attempt_id = ?`,
      [totalScore, isFullyGraded, penaltyAmount, penaltyReason, attempt_id]
    );

    // ⭐ EMIT SOCKET ĐỂ THÔNG BÁO GIÁO VIÊN HỌC SINH ĐÃ NỘP BÀI
    if (req.io) {
      const [examInfo] = await req.db.query(
        'SELECT teacher_id, class_id FROM exams WHERE exam_id = ?',
        [examId]
      );
      if (examInfo.length > 0) {
        const socketService = require('../../services/socketService');
        socketService.emitStudentSubmittedExam(
          req.io,
          examInfo[0].teacher_id,
          examId,
          studentId,
          attempt_id,
          totalScore,
          examInfo[0].class_id
        );
      }
    }

    console.log('✅ Đã nộp bài:', { attempt_id, totalScore, isFullyGraded });

    // Tính tổng điểm của bài thi
    const [totalPointsResult] = await req.db.query(
      `SELECT COALESCE(SUM(points), 0) as total FROM exam_questions WHERE exam_id = ?`,
      [examId]
    );
    const totalPoints = parseFloat(totalPointsResult[0]?.total || 0);

    // Kiểm tra xem có câu tự luận không
    const [hasEssayQuestions] = await req.db.query(
      `SELECT COUNT(*) as count
       FROM exam_questions eq
       JOIN question_bank qb ON eq.question_id = qb.question_id
       WHERE eq.exam_id = ? AND qb.question_type IN ('Essay', 'FillInBlank')`,
      [examId]
    );

    // Tạo message với thông tin penalty nếu có
    let message = 'Nộp bài thành công';
    if (isFullyGraded === 0 && (hasEssayQuestions[0].count || 0) > 0) {
      message = 'Nộp bài thành công. Bài thi có câu tự luận cần giáo viên chấm điểm.';
    }
    if (penaltyAmount > 0) {
      message += ` ${penaltyReason}`;
    }

    res.json({
      success: true,
      score: totalScore,
      total_points: totalPoints,
      is_fully_graded: isFullyGraded,
      has_essay_questions: (hasEssayQuestions[0].count || 0) > 0,
      penalty_amount: penaltyAmount,
      penalty_reason: penaltyReason,
      message: message
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

    // Lấy thông tin attempt (bao gồm penalty)
    const [attempt] = await req.db.query(
      `SELECT 
        ea.*,
        e.exam_name,
        ea.penalty_amount,
        ea.penalty_reason,
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
        eaa.is_correct as db_is_correct,
        eaa.teacher_score,
        eaa.teacher_comment,
        eaa.is_graded
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

      // ⭐ LẤY TÀI LIỆU GỢI Ý NẾU LÀM SAI
      let suggestedMaterials = [];
      if (!isCorrect) {
        const [materials] = await req.db.query(
          `SELECT 
            m.material_id,
            m.title,
            m.description,
            m.file_name,
            m.file_type,
            m.file_size
          FROM materials m
          JOIN question_materials qm ON m.material_id = qm.material_id
          WHERE qm.question_id = ?
          ORDER BY m.upload_date DESC`,
          [r.question_id]
        );
        suggestedMaterials = materials;
      }

      return { 
        ...r, 
        is_correct: isCorrect ? 1 : 0, // ⭐ GHI ĐÈ is_correct
        options,
        suggested_materials: suggestedMaterials // ⭐ TÀI LIỆU GỢI Ý
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
        has_pending_grading: (hasPendingEssay[0].count || 0) > 0,
        penalty_amount: attempt[0].penalty_amount || 0,
        penalty_reason: attempt[0].penalty_reason || null
      },
      results: formattedResults
    });
  } catch (err) {
    console.error('❌ Error in result:', err);
    res.status(500).json({ error: 'Lỗi khi lấy kết quả', details: err.message });
  }
});

module.exports = router;