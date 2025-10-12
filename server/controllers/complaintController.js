exports.createComplaint = async (req, res) => {
  const { examId, content } = req.body;
  const studentId = req.user.id;

  try {
    const [exam] = await req.db.query('SELECT teacher_id, exam_name, class_id FROM exams WHERE exam_id = ?', [examId]);
    if (!exam[0]) {
      return res.status(404).json({ error: 'Bài thi không tồn tại' });
    }

    const [result] = await req.db.query(
      'INSERT INTO complaints (student_id, exam_id, content, status) VALUES (?, ?, ?, ?)',
      [studentId, examId, content, 'Pending']
    );

    const [student] = await req.db.query('SELECT full_name FROM users WHERE user_id = ?', [studentId]);
    const [classData] = await req.db.query('SELECT class_name FROM classes WHERE class_id = ?', [exam[0].class_id]);

    await createNotification(
      req.db,
      req.io,
      exam[0].teacher_id,
      `Học sinh ${student[0].full_name} đã gửi khiếu nại về bài thi ${exam[0].exam_name} (Lớp ${classData[0].class_name})`,
      'Warning',
      result.insertId,
      'Complaint'
    );

    res.json({ message: 'Gửi khiếu nại thành công', complaint_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi gửi khiếu nại', details: error.message });
  }
};