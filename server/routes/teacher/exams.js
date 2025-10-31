const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');
const roleMiddleware = require('../../middleware/role');
const multer = require('multer');
const xlsx = require('xlsx');
const { parse } = require('csv-parse');
const fs = require('fs').promises;


// Hàm tạo thông báo (sẽ di chuyển vào helpers sau)
const createNotification = async (db, io, userId, content, type, relatedId, relatedType) => {
  try {
    const [result] = await db.query(
      'INSERT INTO notifications (user_id, content, type, related_id, related_type) VALUES (?, ?, ?, ?, ?)',
      [userId, content, type, relatedId, relatedType]
    );
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        notification_id: result.insertId,
        content,
        type,
        related_id: relatedId,
        related_type: relatedType,
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Lỗi tạo thông báo:', error);
  }
};

// ✅ Lấy tất cả bài thi của giáo viên
router.get('/all', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;
  
  console.log('=== GET ALL EXAMS ===');
  console.log('teacherId:', teacherId);

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
        -- ⭐ TÍNH TOÁN STATUS ĐỘNG GIỐNG TEACHER/CLASSES
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
    
    console.log('✅ All exams found:', exams.length);
    res.json(exams);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách bài thi', details: err.message });
  }
});

// ✅ Xóa bài thi
router.delete('/:examId', authMiddleware, roleMiddleware(['teacher', 'admin']), async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user.id || req.user.user_id;
  const role = req.user.role;

  try {
    // Kiểm tra quyền sở hữu (nếu là Teacher)
    if (role === 'teacher' || role === 'Teacher') {
      const [exam] = await req.db.query(
        'SELECT exam_name FROM exams WHERE exam_id = ? AND teacher_id = ?',
        [examId, teacherId]
      );
      
      if (!exam.length) {
        return res.status(403).json({ error: 'Bạn không có quyền xóa bài thi này' });
      }
    }

    // Xóa các bản ghi liên quan
    await req.db.query('DELETE FROM exam_attempt_answers WHERE attempt_id IN (SELECT attempt_id FROM exam_attempts WHERE exam_id = ?)', [examId]);
    await req.db.query('DELETE FROM exam_attempts WHERE exam_id = ?', [examId]);
    await req.db.query('DELETE FROM exam_questions WHERE exam_id = ?', [examId]);
    await req.db.query('DELETE FROM exam_classes WHERE exam_id = ?', [examId]);
    
    // Xóa bài thi
    const [result] = await req.db.query('DELETE FROM exams WHERE exam_id = ?', [examId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi' });
    }

    res.json({ message: 'Xóa bài thi thành công' });
  } catch (err) {
    console.error('Lỗi xóa bài thi:', err);
    res.status(500).json({ error: 'Lỗi khi xóa bài thi', details: err.message });
  }
});

// ✅ Giám sát gian lận
router.get('/:examId/monitor/cheating', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền
    const [exam] = await req.db.query(
      'SELECT exam_name FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );
    
    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bài thi này' });
    }

    const [logs] = await req.db.query(
      `SELECT acl.log_id, acl.attempt_id, acl.event_type, acl.event_description, acl.event_time,
              u.full_name AS student_name, u.user_id AS student_id
       FROM anti_cheating_logs acl
       JOIN exam_attempts ea ON acl.attempt_id = ea.attempt_id
       JOIN users u ON ea.student_id = u.user_id
       WHERE ea.exam_id = ?
       ORDER BY acl.event_time DESC`,
      [examId]
    );

    res.json({ logs });
  } catch (err) {
    console.error('Lỗi lấy log gian lận:', err);
    res.status(500).json({ error: 'Lỗi khi lấy log gian lận', details: err.message });
  }
});

// ✅ Xử phạt học sinh (cấm thi hoặc trừ điểm)
router.post('/:examId/penalize', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId } = req.params;
  const { attempt_id, action, points_deducted, reason } = req.body;
  const teacherId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền
    const [exam] = await req.db.query(
      'SELECT exam_name FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );
    
    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền xử lý bài thi này' });
    }

    const [attempt] = await req.db.query(
      `SELECT ea.student_id, u.full_name
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.user_id
       WHERE ea.attempt_id = ? AND ea.exam_id = ?`,
      [attempt_id, examId]
    );
    
    if (!attempt.length) {
      return res.status(404).json({ error: 'Lượt thi không tồn tại' });
    }

    if (action === 'ban') {
      // Cấm thi
      await req.db.query(
        'UPDATE exam_attempts SET is_banned = 1, status = "AutoSubmitted" WHERE attempt_id = ?',
        [attempt_id]
      );
      
      await req.db.query(
        'INSERT INTO teacher_actions (teacher_id, exam_id, student_id, action_type, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [teacherId, examId, attempt[0].student_id, 'ban_student', reason || 'Vi phạm quy định thi']
      );
      
      if (req.io) {
        req.io.to(`user_${attempt[0].student_id}`).emit('exam_banned', {
          exam_id: examId,
          reason: reason || 'Vi phạm quy định thi'
        });
      }
      
      await createNotification(
        req.db,
        req.io,
        attempt[0].student_id,
        `Bạn đã bị cấm thi "${exam[0].exam_name}" vì: ${reason || 'Vi phạm quy định thi'}`,
        'Warning',
        examId,
        'Exam'
      );
    } else if (action === 'deduct_points') {
      // Trừ điểm
      if (!points_deducted || points_deducted < 0) {
        return res.status(400).json({ error: 'Số điểm trừ không hợp lệ' });
      }
      
      await req.db.query(
        'UPDATE exam_attempts SET penalty_points = penalty_points + ?, cheating_detected = 1 WHERE attempt_id = ?',
        [points_deducted, attempt_id]
      );
      
      await req.db.query(
        'INSERT INTO teacher_actions (teacher_id, exam_id, student_id, action_type, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [teacherId, examId, attempt[0].student_id, 'edit_score', `Trừ ${points_deducted} điểm: ${reason || 'Vi phạm quy định thi'}`]
      );
      
      if (req.io) {
        req.io.to(`user_${attempt[0].student_id}`).emit('points_deducted', {
          exam_id: examId,
          points_deducted,
          reason: reason || 'Vi phạm quy định thi'
        });
      }
      
      await createNotification(
        req.db,
        req.io,
        attempt[0].student_id,
        `Bạn đã bị trừ ${points_deducted} điểm trong bài thi "${exam[0].exam_name}" vì: ${reason || 'Vi phạm quy định thi'}`,
        'Warning',
        examId,
        'Exam'
      );
    }

    // Thông báo cho giáo viên
    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Đã ${action === 'ban' ? 'cấm' : 'trừ điểm'} học sinh ${attempt[0].full_name} trong bài thi "${exam[0].exam_name}"`,
      'Info',
      examId,
      'Exam'
    );

    res.json({ message: `Đã ${action === 'ban' ? 'cấm' : 'trừ điểm'} thành công` });
  } catch (err) {
    console.error('Lỗi xử lý hành vi gian lận:', err);
    res.status(500).json({ error: 'Lỗi khi xử lý', details: err.message });
  }
});
// Cấu hình multer (giới hạn 10MB)
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV'));
    }
  }
});

// ============================================
// 🧠 HÀM TÌM CỘT TỰ ĐỘNG (AI-POWERED)
// ============================================
function smartDetectColumns(row) {
  const detected = {
    question: null,
    optionA: null,
    optionB: null,
    optionC: null,
    optionD: null,
    optionE: null,
    optionF: null,
    correctAnswer: null,
    questionType: null,
    difficulty: null,
    points: null
  };

  // Lấy tất cả tên cột (keys)
  const columns = Object.keys(row);

  // ⭐ TÌM CỘT "CÂU HỎI"
  const questionPatterns = [
    /^(câu hỏi|cau hoi|question|content|nội dung|noi dung|ques|quest)$/i,
    /^(question_content|question_text|cau_hoi|cauhoi)$/i
  ];
  detected.question = columns.find(col => 
    questionPatterns.some(pattern => pattern.test(col.trim()))
  );

  // ⭐ TÌM CỘT "ĐÁP ÁN A, B, C, D, E, F"
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  optionLetters.forEach(letter => {
    const patterns = [
      new RegExp(`^(đáp án ${letter}|dap an ${letter}|option ${letter}|${letter}|option_${letter}|DA_${letter}|answer_${letter})$`, 'i'),
      new RegExp(`^(đáp án|dap an|option|ans|answer)\\s*${letter}$`, 'i'),
      new RegExp(`^${letter}$`, 'i')
    ];
    
    detected[`option${letter}`] = columns.find(col => 
      patterns.some(pattern => pattern.test(col.trim()))
    );
  });

  // ⭐ TÌM CỘT "ĐÁP ÁN ĐÚNG"
  const correctAnswerPatterns = [
    /^(đáp án đúng|dap an dung|correct answer|correct|answer|đa đúng|dap dung|da_dung|dung)$/i,
    /^(correct_answer|correctanswer|dapandung|key|answer_key)$/i
  ];
  detected.correctAnswer = columns.find(col => 
    correctAnswerPatterns.some(pattern => pattern.test(col.trim()))
  );

  // ⭐ TÌM CỘT "LOẠI CÂU HỎI"
  const typePatterns = [
    /^(loại câu hỏi|loai cau hoi|question type|type|loai|question_type|loaicauhoi)$/i
  ];
  detected.questionType = columns.find(col => 
    typePatterns.some(pattern => pattern.test(col.trim()))
  );

  // ⭐ TÌM CỘT "ĐỘ KHÓ"
  const difficultyPatterns = [
    /^(độ khó|do kho|difficulty|level|mức độ|mucdo|dokho)$/i
  ];
  detected.difficulty = columns.find(col => 
    difficultyPatterns.some(pattern => pattern.test(col.trim()))
  );

  // ⭐ TÌM CỘT "ĐIỂM"
  const pointsPatterns = [
    /^(điểm|diem|points|point|score|mark)$/i
  ];
  detected.points = columns.find(col => 
    pointsPatterns.some(pattern => pattern.test(col.trim()))
  );

  return detected;
}

// ============================================
// 🔍 HÀM LẤY GIÁ TRỊ TỪ DETECTED COLUMNS
// ============================================
function getValueSafely(row, columnName, defaultValue = null) {
  if (!columnName) return defaultValue;
  const value = row[columnName];
  if (value === undefined || value === null || String(value).trim() === '') {
    return defaultValue;
  }
  return String(value).trim();
}

// ✅ API IMPORT ĐỀ THI (POST /api/teacher/exams/:examId/import-questions)
router.post('/:examId/import-questions', authMiddleware, roleMiddleware(['teacher']), upload.single('file'), async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  if (!req.file) {
    return res.status(400).json({ error: 'Vui lòng tải lên file Excel hoặc CSV' });
  }

  try {
    // 1. Kiểm tra quyền sở hữu exam
    const [exam] = await req.db.query(
      'SELECT exam_name, subject_id, class_id FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );

    if (!exam.length) {
      await fs.unlink(req.file.path); // Xóa file upload
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa bài thi này' });
    }

    const subjectId = exam[0].subject_id;
    const filePath = req.file.path;
    let questions = [];

    // 2. Parse file Excel/CSV
    if (req.file.mimetype.includes('csv')) {
      // Parse CSV
      const csvData = await fs.readFile(filePath);
      questions = await new Promise((resolve, reject) => {
        parse(csvData, { columns: true, trim: true }, (err, output) => {
          if (err) reject(err);
          resolve(output);
        });
      });
    } else {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      questions = xlsx.utils.sheet_to_json(sheet);
    }

    // 3. Xóa file upload
    await fs.unlink(filePath);

    if (!questions.length) {
      return res.status(400).json({ error: 'File không có dữ liệu câu hỏi' });
    }

 // 4. ⭐ TỰ ĐỘNG PHÁT HIỆN FORMAT CỘT
let detectedColumns = null;
const errors = [];
const insertedQuestions = [];
let questionOrder = 1;

// Phát hiện format từ dòng đầu tiên
if (questions.length > 0) {
  detectedColumns = smartDetectColumns(questions[0]);
  
  console.log('🔍 Auto-detected columns:', {
    question: detectedColumns.question,
    optionA: detectedColumns.optionA,
    optionB: detectedColumns.optionB,
    optionC: detectedColumns.optionC,
    optionD: detectedColumns.optionD,
    correctAnswer: detectedColumns.correctAnswer,
    questionType: detectedColumns.questionType,
    difficulty: detectedColumns.difficulty,
    points: detectedColumns.points
  });

  // Kiểm tra cột bắt buộc
  if (!detectedColumns.question) {
    return res.status(400).json({ 
      error: 'Không tìm thấy cột "Câu hỏi". Vui lòng đặt tên cột là: "Câu hỏi", "Question", hoặc "Content"' 
    });
  }
  
  if (!detectedColumns.correctAnswer) {
    return res.status(400).json({ 
      error: 'Không tìm thấy cột "Đáp án đúng". Vui lòng đặt tên cột là: "Đáp án đúng", "Correct Answer", hoặc "Answer"' 
    });
  }
}

// 5. XỬ LÝ TỪNG CÂU HỎI
for (const [index, q] of questions.entries()) {
  try {
    // ⭐ LẤY GIÁ TRỊ TỪ CỘT ĐÃ PHÁT HIỆN
    const question_content = getValueSafely(q, detectedColumns.question);
    const question_type = getValueSafely(q, detectedColumns.questionType, 'SingleChoice');
    const difficulty = getValueSafely(q, detectedColumns.difficulty, 'Medium');
    const correct_answer = getValueSafely(q, detectedColumns.correctAnswer);
    const points = parseFloat(getValueSafely(q, detectedColumns.points, '1'));

    // ⭐ LẤY OPTIONS TỪ CÁC CỘT ĐÃ PHÁT HIỆN
    const options = [];
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(letter => {
      const columnName = detectedColumns[`option${letter}`];
      if (columnName) {
        const optValue = getValueSafely(q, columnName);
        if (optValue) {
          options.push(optValue);
        }
      }
    });

    // ⭐ DEBUG LOG
    console.log(`📝 Row ${index + 2}:`, {
      question: question_content?.substring(0, 40),
      type: question_type,
      optionsCount: options.length,
      correctAnswer: correct_answer
    });

    // Validate
    if (!question_content) {
      errors.push(`Dòng ${index + 2}: Thiếu nội dung câu hỏi`);
      continue;
    }

    if (!['SingleChoice', 'MultipleChoice', 'FillInBlank', 'Essay'].includes(question_type)) {
      errors.push(`Dòng ${index + 2}: Loại câu hỏi không hợp lệ (phải là: SingleChoice, MultipleChoice, FillInBlank, Essay)`);
      continue;
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      errors.push(`Dòng ${index + 2}: Độ khó không hợp lệ (phải là: Easy, Medium, Hard)`);
      continue;
    }

    if (!correct_answer) {
      errors.push(`Dòng ${index + 2}: Thiếu đáp án đúng`);
      continue;
    }

    // ⭐ KIỂM TRA TRẮC NGHIỆM PHẢI CÓ ÍT NHẤT 2 ĐÁP ÁN
    if ((question_type === 'SingleChoice' || question_type === 'MultipleChoice') && options.length < 2) {
      errors.push(`Dòng ${index + 2}: Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án (hiện chỉ có ${options.length})`);
      console.log(`⚠️ Row ${index + 2}: Skipped - Only ${options.length} options`);
      continue;
    }

    // 6. Insert vào question_bank
    const [questionResult] = await req.db.query(
      `INSERT INTO question_bank (subject_id, teacher_id, question_content, question_type, difficulty, correct_answer_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [subjectId, teacherId, question_content, question_type, difficulty, correct_answer]
    );

    const questionId = questionResult.insertId;

    // 7. ⭐ INSERT OPTIONS (NẾU CÓ)
    if ((question_type === 'SingleChoice' || question_type === 'MultipleChoice') && options.length > 0) {
      const optionValues = options.map((content, idx) => {
        let isCorrect = false;
        const correctAnswerUpper = correct_answer.toUpperCase();

        if (question_type === 'SingleChoice') {
          const optionLetter = String.fromCharCode(65 + idx);
          isCorrect = (correctAnswerUpper === optionLetter);
          
          if (!isCorrect) {
            const correctNumber = parseInt(correctAnswerUpper);
            isCorrect = (correctNumber === idx + 1);
          }
        } else {
          const correctAnswers = correctAnswerUpper.split(',').map(a => a.trim());
          const optionLetter = String.fromCharCode(65 + idx);
          const optionNumber = String(idx + 1);
          isCorrect = correctAnswers.includes(optionLetter) || correctAnswers.includes(optionNumber);
        }

        return [questionId, content, isCorrect ? 1 : 0];
      });

      await req.db.query(
        'INSERT INTO question_options (question_id, option_content, is_correct) VALUES ?',
        [optionValues]
      );

      console.log(`✅ Inserted ${optionValues.length} options for question ${questionId}`);
    }

    // 8. Link câu hỏi với exam
    await req.db.query(
      'INSERT INTO exam_questions (exam_id, question_id, question_order, points) VALUES (?, ?, ?, ?)',
      [examId, questionId, questionOrder++, points]
    );

    insertedQuestions.push({
      question_id: questionId,
      question_content: question_content.substring(0, 50) + '...'
    });

  } catch (err) {
    console.error(`❌ Error at row ${index + 2}:`, err);
    errors.push(`Dòng ${index + 2}: ${err.message}`);
  }
}
    // 8. Tạo thông báo
    if (insertedQuestions.length > 0) {
      await createNotification(
        req.db,
        req.io,
        teacherId,
        `Đã nhập ${insertedQuestions.length} câu hỏi vào bài thi "${exam[0].exam_name}"`,
        'Info',
        examId,
        'Exam'
      );
    }

    // 9. Response
    res.json({
      success: true,
      message: `Nhập thành công ${insertedQuestions.length}/${questions.length} câu hỏi`,
      imported: insertedQuestions.length,
      total: questions.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error('❌ Error importing questions:', err);
    
    // Xóa file nếu có lỗi
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error('Error deleting file:', unlinkErr);
      }
    }
    
    res.status(500).json({ 
      error: 'Lỗi khi import câu hỏi', 
      details: err.message 
    });
  }
});

// ✅ API XEM CÂU HỎI TRONG ĐỀ THI (GET /api/teacher/exams/:examId/questions)
router.get('/:examId/questions', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền
    const [exam] = await req.db.query(
      'SELECT exam_name FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );

    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bài thi này' });
    }

    // Lấy danh sách câu hỏi
    const [questions] = await req.db.query(
      `SELECT 
        eq.question_id,
        eq.question_order,
        eq.points,
        qb.question_content,
        qb.question_type,
        qb.difficulty,
        qb.correct_answer_text
      FROM exam_questions eq
      JOIN question_bank qb ON eq.question_id = qb.question_id
      WHERE eq.exam_id = ?
      ORDER BY eq.question_order ASC`,
      [examId]
    );

    // ⭐ LẤY OPTIONS CHO TỪNG CÂU HỎI (RIÊNG BIỆT)
    const formattedQuestions = await Promise.all(
      questions.map(async (q) => {
        const [options] = await req.db.query(
          `SELECT 
            option_id,
            option_content,
            is_correct
          FROM question_options
          WHERE question_id = ?
          ORDER BY option_id ASC`,
          [q.question_id]
        );

        return {
          ...q,
          options: options || []
        };
      })
    );

    res.json({
      exam_name: exam[0].exam_name,
      total_questions: formattedQuestions.length,
      questions: formattedQuestions
    });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách câu hỏi', details: err.message });
  }
});

// ✅ API XÓA CÂU HỎI KHỎI ĐỀ THI (DELETE /api/teacher/exams/:examId/questions/:questionId)
router.delete('/:examId/questions/:questionId', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId, questionId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền
    const [exam] = await req.db.query(
      'SELECT exam_name FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );

    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa bài thi này' });
    }

    // Xóa khỏi exam_questions (không xóa khỏi question_bank)
    const [result] = await req.db.query(
      'DELETE FROM exam_questions WHERE exam_id = ? AND question_id = ?',
      [examId, questionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy câu hỏi trong bài thi này' });
    }

    res.json({ message: 'Xóa câu hỏi thành công' });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi xóa câu hỏi', details: err.message });
  }
});

// ============================================
// 📊 API LẤY ĐIỂM TỪNG BÀI THI CỦA HỌC SINH
// Thêm vào routes/teacher/exams.js
// ============================================

// GET /api/teacher/exams/:examId/grades
router.get('/:examId/grades', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId } = req.params;
  const { student_id } = req.query; // Optional: lấy điểm của 1 học sinh cụ thể
  const teacherId = req.user.id || req.user.user_id;

  try {
    console.log('🔍 Get grades for exam:', examId, 'student:', student_id);

    // Kiểm tra giáo viên có quyền truy cập bài thi không
    const [exam] = await req.db.query(
      `SELECT e.exam_id 
       FROM exams e
       WHERE e.exam_id = ? AND e.teacher_id = ?`,
      [examId, teacherId]
    );

    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bài thi này' });
    }

    // Nếu có student_id, lấy điểm của 1 học sinh
    if (student_id) {
      const [attempts] = await req.db.query(
        `SELECT 
          ea.attempt_id,
          ea.score,
          ea.start_time,
          ea.end_time,
          ea.status
         FROM exam_attempts ea
         WHERE ea.exam_id = ? AND ea.student_id = ?
         ORDER BY ea.start_time DESC
         LIMIT 1`,
        [examId, student_id]
      );

      if (attempts.length === 0) {
        return res.json({ score: null, status: 'not_taken' });
      }

      return res.json({
        score: attempts[0].score,
        status: attempts[0].status,
        start_time: attempts[0].start_time,
        end_time: attempts[0].end_time
      });
    }

    // Nếu không có student_id, lấy điểm của tất cả học sinh
    const [grades] = await req.db.query(
      `SELECT 
        u.user_id,
        u.full_name,
        ea.score,
        ea.start_time,
        ea.end_time,
        ea.status
       FROM exam_attempts ea
       JOIN users u ON ea.student_id = u.user_id
       WHERE ea.exam_id = ?
       ORDER BY u.full_name ASC`,
      [examId]
    );

    console.log('✅ Found grades:', grades.length);
    res.json(grades);

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Lỗi khi lấy điểm', details: err.message });
  }
});

// ============================================
// 📝 API QUẢN LÝ NGÂN HÀNG CÂU HỎI
// ============================================
router.post('/question-bank', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;
  
  console.log('🔵 [QB POST] Received body:', req.body);
  
  const { 
    question_content,
    question_text,
    question_type, 
    options, 
    correct_answer_text,
    correct_answer,
    subject_id,
    subject,
    difficulty 
  } = req.body;

  // ✅ Normalize tên field (hỗ trợ cả 2 kiểu)
  const finalQuestionContent = question_content || question_text;
  const finalCorrectAnswer = correct_answer_text || correct_answer;
  const finalSubjectId = subject_id || subject;
  const finalDifficulty = difficulty || 'Medium';

  console.log('🔍 [QB POST] Parsed:', {
    finalQuestionContent,
    question_type,
    finalCorrectAnswer,
    finalDifficulty
  });

  // ✅ VALIDATE CƠ BẢN
  if (!finalQuestionContent || !question_type) {
    console.error('❌ [QB POST] Missing basic fields');
    return res.status(400).json({ 
      error: 'Thiếu thông tin bắt buộc: nội dung câu hỏi và loại câu hỏi',
      received: { 
        has_content: !!finalQuestionContent, 
        has_type: !!question_type 
      }
    });
  }

  // ✅ VALIDATE LOẠI CÂU HỎI
  const validTypes = ['SingleChoice', 'MultipleChoice', 'FillInBlank', 'Essay'];
  if (!validTypes.includes(question_type)) {
    console.error('❌ [QB POST] Invalid question type:', question_type);
    return res.status(400).json({ 
      error: `Loại câu hỏi không hợp lệ. Phải là: ${validTypes.join(', ')}`,
      received: question_type
    });
  }

  // ✅ VALIDATE ĐỘ KHÓ
  const validDifficulties = ['Easy', 'Medium', 'Hard'];
  if (!validDifficulties.includes(finalDifficulty)) {
    console.error('❌ [QB POST] Invalid difficulty:', finalDifficulty);
    return res.status(400).json({ 
      error: `Độ khó không hợp lệ. Phải là: ${validDifficulties.join(', ')}`,
      received: finalDifficulty
    });
  }

  // ✅ VALIDATE ĐÁP ÁN (chỉ bắt buộc với trắc nghiệm)
  if (question_type === 'SingleChoice' || question_type === 'MultipleChoice') {
    if (!finalCorrectAnswer) {
      console.error('❌ [QB POST] Choice question needs correct answer');
      return res.status(400).json({ 
        error: 'Câu hỏi trắc nghiệm phải có đáp án đúng'
      });
    }
    
    if (!options || !Array.isArray(options) || options.length < 2) {
      console.error('❌ [QB POST] Choice question needs at least 2 options');
      return res.status(400).json({ 
        error: 'Câu hỏi trắc nghiệm phải có ít nhất 2 đáp án',
        received: { optionsCount: options?.length }
      });
    }
  }

  try {
    // ✅ INSERT VÀO QUESTION_BANK
    console.log('🔵 [QB POST] Inserting question...');
    
    const [questionResult] = await req.db.query(
      `INSERT INTO question_bank 
       (teacher_id, subject_id, question_content, question_type, difficulty, correct_answer_text, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        teacherId, 
        finalSubjectId || null, 
        finalQuestionContent, 
        question_type, 
        finalDifficulty, 
        finalCorrectAnswer || 'Tự luận - Giáo viên chấm thủ công'
      ]
    );

    const questionId = questionResult.insertId;
    console.log('✅ [QB POST] Question created with ID:', questionId);

    // ✅ INSERT OPTIONS (nếu là trắc nghiệm)
    if ((question_type === 'SingleChoice' || question_type === 'MultipleChoice') && options && options.length > 0) {
      console.log('🔵 [QB POST] Inserting', options.length, 'options...');
      
      const optionValues = options.map((opt, index) => {
        const optionText = typeof opt === 'string' ? opt : (opt.content || opt.text || opt.option_content);
        let isCorrect = false;

        if (typeof opt === 'object' && opt.is_correct !== undefined) {
          isCorrect = opt.is_correct;
        } else {
          const correctAnswerUpper = String(finalCorrectAnswer).toUpperCase();
          const optionLetter = String.fromCharCode(65 + index);
          const optionNumber = String(index + 1);
          
          if (question_type === 'SingleChoice') {
            isCorrect = (correctAnswerUpper === optionLetter || correctAnswerUpper === optionNumber);
          } else {
            const correctAnswers = correctAnswerUpper.split(',').map(a => a.trim());
            isCorrect = correctAnswers.includes(optionLetter) || correctAnswers.includes(optionNumber);
          }
        }

        return [questionId, optionText, isCorrect ? 1 : 0];
      });

      await req.db.query(
        'INSERT INTO question_options (question_id, option_content, is_correct) VALUES ?',
        [optionValues]
      );

      console.log(`✅ [QB POST] Inserted ${optionValues.length} options`);
    }

    // ✅ TẠO THÔNG BÁO
    await createNotification(
      req.db,
      req.io,
      teacherId,
      `Đã thêm câu hỏi mới: "${finalQuestionContent.substring(0, 50)}..."`,
      'Info',
      questionId,
      'Question'
    );

    console.log('✅ [QB POST] Complete!');

    res.status(201).json({
      success: true,
      message: 'Thêm câu hỏi thành công',
      question_id: questionId
    });

  } catch (error) {
    console.error('❌ [QB POST] Database error:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi thêm câu hỏi',
      details: error.message 
    });
  }
});

// ✅ LẤY DANH SÁCH CÂU HỎI TRONG NGÂN HÀNG (GET /api/teacher/exams/question-bank)
router.get('/question-bank', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const teacherId = req.user.id || req.user.user_id;
  const { subject_id, difficulty, question_type, limit = 50, offset = 0 } = req.query;

  try {
    let query = `
      SELECT 
        qb.question_id,
        qb.question_content,
        qb.question_type,
        qb.difficulty,
        qb.correct_answer_text,
        qb.created_at,
        s.subject_name,
        (SELECT COUNT(*) FROM question_options WHERE question_id = qb.question_id) as option_count
      FROM question_bank qb
      LEFT JOIN subjects s ON qb.subject_id = s.subject_id
      WHERE qb.teacher_id = ?
    `;
    
    const params = [teacherId];

    // Thêm filters
    if (subject_id) {
      query += ' AND qb.subject_id = ?';
      params.push(subject_id);
    }
    if (difficulty) {
      query += ' AND qb.difficulty = ?';
      params.push(difficulty);
    }
    if (question_type) {
      query += ' AND qb.question_type = ?';
      params.push(question_type);
    }

    query += ' ORDER BY qb.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [questions] = await req.db.query(query, params);

    // Lấy tổng số câu hỏi
    const [total] = await req.db.query(
      'SELECT COUNT(*) as count FROM question_bank WHERE teacher_id = ?',
      [teacherId]
    );

    res.json({
      questions,
      total: total[0].count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách câu hỏi', details: error.message });
  }
});

// ✅ XÓA CÂU HỎI KHỎI NGÂN HÀNG (DELETE /api/teacher/exams/question-bank/:questionId)
router.delete('/question-bank/:questionId', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { questionId } = req.params;
  const teacherId = req.user.id || req.user.user_id;

  try {
    // Kiểm tra quyền sở hữu
    const [question] = await req.db.query(
      'SELECT question_content FROM question_bank WHERE question_id = ? AND teacher_id = ?',
      [questionId, teacherId]
    );

    if (!question.length) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa câu hỏi này' });
    }

    // Xóa options trước
    await req.db.query('DELETE FROM question_options WHERE question_id = ?', [questionId]);
    
    // Xóa khỏi exam_questions (nếu đang được sử dụng)
    await req.db.query('DELETE FROM exam_questions WHERE question_id = ?', [questionId]);
    
    // Xóa câu hỏi
    await req.db.query('DELETE FROM question_bank WHERE question_id = ?', [questionId]);

    res.json({ message: 'Xóa câu hỏi thành công' });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Lỗi khi xóa câu hỏi', details: error.message });
  }
});

// ============================================
// 🔗 LINK CÂU HỎI VÀO BÀI THI
// POST /api/teacher/exams/:examId/questions/:questionId
// ============================================
router.post('/:examId/questions/:questionId', authMiddleware, roleMiddleware(['teacher']), async (req, res) => {
  const { examId, questionId } = req.params;
  const { points } = req.body;
  const teacherId = req.user.id || req.user.user_id;

  console.log('🔵 [Link] Linking question', questionId, 'to exam', examId);

  try {
    // 1. Kiểm tra quyền sở hữu exam
    const [exam] = await req.db.query(
      'SELECT exam_id FROM exams WHERE exam_id = ? AND teacher_id = ?',
      [examId, teacherId]
    );

    if (!exam.length) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa bài thi này' });
    }

    // 2. Kiểm tra câu hỏi có tồn tại
    const [question] = await req.db.query(
      'SELECT question_id FROM question_bank WHERE question_id = ?',
      [questionId]
    );

    if (!question.length) {
      return res.status(404).json({ error: 'Không tìm thấy câu hỏi' });
    }

    // 3. Kiểm tra đã link chưa
    const [existing] = await req.db.query(
      'SELECT * FROM exam_questions WHERE exam_id = ? AND question_id = ?',
      [examId, questionId]
    );

    if (existing.length > 0) {
      console.log('⚠️ [Link] Already linked');
      return res.json({ message: 'Câu hỏi đã được thêm vào bài thi', existing: true });
    }

    // 4. Lấy số thứ tự câu hỏi tiếp theo
    const [maxOrder] = await req.db.query(
      'SELECT COALESCE(MAX(question_order), 0) as max_order FROM exam_questions WHERE exam_id = ?',
      [examId]
    );

    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;

    // 5. Link câu hỏi với exam
    await req.db.query(
      'INSERT INTO exam_questions (exam_id, question_id, question_order, points) VALUES (?, ?, ?, ?)',
      [examId, questionId, nextOrder, points || 1]
    );

    console.log('✅ [Link] Question linked successfully');

    res.json({ 
      message: 'Đã thêm câu hỏi vào bài thi',
      question_id: questionId,
      exam_id: examId,
      question_order: nextOrder
    });

  } catch (error) {
    console.error('❌ [Link] Error:', error);
    res.status(500).json({ error: 'Lỗi khi thêm câu hỏi vào bài thi', details: error.message });
  }
});

module.exports = router;