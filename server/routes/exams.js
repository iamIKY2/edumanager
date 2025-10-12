// /server/routes/exams.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Lấy tất cả bài thi của giáo viên
router.get('/', authMiddleware, async (req, res) => {
    const teacherId = req.user.id;

    try {
        const [exams] = await req.db.query(
            `SELECT e.exam_id, e.exam_name AS title, e.start_time AS exam_date, e.duration, e.description, e.status, c.class_name
             FROM exams e
             JOIN classes c ON e.class_id = c.class_id
             WHERE c.teacher_id = ? AND e.status != 'deleted'`,
            [teacherId]
        );
        res.json(exams);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi lấy danh sách bài thi', details: err.message });
    }
});

// Xóa bài thi
router.delete('/:examId', authMiddleware, async (req, res) => {
    const { examId } = req.params;
    const teacherId = req.user.id;

    try {
        const [examResult] = await req.db.query(
            `SELECT e.* FROM exams e
             JOIN classes c ON e.class_id = c.class_id
             WHERE e.exam_id = ? AND c.teacher_id = ?`,
            [examId, teacherId]
        );

        if (examResult.length === 0) {
            return res.status(403).json({ error: 'Bạn không có quyền xóa bài thi này' });
        }

        await req.db.query(
            `UPDATE exams SET status = 'deleted' WHERE exam_id = ?`,
            [examId]
        );

        res.json({ message: 'Xóa bài thi thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Lỗi khi xóa bài thi', details: err.message });
    }
});

module.exports = router;