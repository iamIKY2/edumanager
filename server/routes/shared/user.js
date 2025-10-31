const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth');

// ============================================
// 👤 GET USER PROFILE
// ============================================
router.get('/profile', authMiddleware, async (req, res) => {
    const userId = req.user.id || req.user.user_id;
    const role = req.user.role?.toLowerCase();

    console.log('=== GET PROFILE ===');
    console.log('userId:', userId);
    console.log('role:', role);

    try {
        // Lấy thông tin user cơ bản
        const [users] = await req.db.query(
            'SELECT user_id, username, email, full_name, phone, dob, role FROM users WHERE user_id = ?',
            [userId]
        );

        if (!users.length) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        const user = users[0];

        // ⭐ NẾU LÀ STUDENT
        if (role === 'student') {
            // 1. Tính điểm trung bình
            const [avgScoreResult] = await req.db.query(
                `SELECT ROUND(AVG(score), 1) as avg_score
                 FROM exam_attempts
                 WHERE student_id = ? AND status = 'Submitted'`,
                [userId]
            );

            const avgScore = avgScoreResult[0]?.avg_score || 0;

            // 2. Tính xếp hạng
            const [allStudents] = await req.db.query(
                `SELECT student_id, ROUND(AVG(score), 1) as avg_score
                 FROM exam_attempts
                 WHERE status = 'Submitted'
                 GROUP BY student_id
                 HAVING avg_score IS NOT NULL
                 ORDER BY avg_score DESC`
            );

            let rank = allStudents.findIndex(s => s.student_id === userId) + 1;
            if (rank === 0) rank = 'Chưa có xếp hạng';

            // 3. Lấy bài thi sắp tới
            const [upcomingTests] = await req.db.query(
                `SELECT 
                    e.exam_id,
                    e.exam_name as title,
                    e.duration,
                    DATE_FORMAT(e.start_time, '%d/%m/%Y %H:%i') as date,
                    (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.exam_id) as questions
                 FROM exams e
                 JOIN class_students cs ON e.class_id = cs.class_id
                 WHERE cs.student_id = ? 
                   AND e.start_time > NOW()
                   AND e.status != 'deleted'
                 ORDER BY e.start_time ASC
                 LIMIT 3`,
                [userId]
            );

            // 4. Lấy bài thi khả dụng (đang diễn ra hoặc sắp diễn ra)
            const [availableTests] = await req.db.query(
                `SELECT 
                    e.exam_id as id,
                    e.exam_name as title,
                    c.class_name as class,
                    e.duration,
                    (SELECT COUNT(*) FROM exam_questions WHERE exam_id = e.exam_id) as questions,
                    CASE
                        WHEN NOW() < e.start_time THEN 'Chưa bắt đầu'
                        WHEN NOW() >= e.start_time AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) THEN 'Đang diễn ra'
                        ELSE 'Đã kết thúc'
                    END as status,
                    CASE
                        WHEN NOW() < e.start_time THEN TIMESTAMPDIFF(MINUTE, NOW(), e.start_time)
                        WHEN NOW() >= e.start_time AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE) 
                            THEN TIMESTAMPDIFF(MINUTE, NOW(), DATE_ADD(e.start_time, INTERVAL e.duration MINUTE))
                        ELSE 0
                    END as minutes_left
                 FROM exams e
                 JOIN classes c ON e.class_id = c.class_id
                 JOIN class_students cs ON c.class_id = cs.class_id
                 WHERE cs.student_id = ? 
                   AND e.status != 'deleted'
                   AND NOW() < DATE_ADD(e.start_time, INTERVAL e.duration MINUTE)
                 ORDER BY e.start_time ASC`,
                [userId]
            );

            // Format thời gian còn lại
            availableTests.forEach(test => {
                if (test.minutes_left > 0) {
                    const hours = Math.floor(test.minutes_left / 60);
                    const mins = test.minutes_left % 60;
                    test.timeLeft = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                } else {
                    test.timeLeft = '00:00';
                }
            });

            // 5. Lấy kết quả của tôi
            const [myResults] = await req.db.query(
                `SELECT 
                    ea.attempt_id as id,
                    e.exam_name as title,
                    DATE_FORMAT(ea.end_time, '%d/%m/%Y %H:%i') as date,
                    'Trắc nghiệm' as type,
                    ROUND(ea.score, 1) as score,
                    (SELECT SUM(points) FROM exam_questions WHERE exam_id = e.exam_id) as total
                 FROM exam_attempts ea
                 JOIN exams e ON ea.exam_id = e.exam_id
                 WHERE ea.student_id = ? AND ea.status = 'Submitted'
                 ORDER BY ea.end_time DESC
                 LIMIT 10`,
                [userId]
            );

            // 6. Lấy ranking
            const [ranking] = await req.db.query(
                `SELECT 
                    u.user_id as id,
                    u.full_name as fullName,
                    u.username,
                    ROUND(AVG(ea.score), 1) as avgScore
                 FROM users u
                 LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id AND ea.status = 'Submitted'
                 WHERE u.role = 'Student'
                 GROUP BY u.user_id, u.full_name, u.username
                 HAVING avgScore IS NOT NULL
                 ORDER BY avgScore DESC
                 LIMIT 50`
            );

            // 7. Lấy khiếu nại gần đây
const [recentComplaints] = await req.db.query(
    `SELECT 
        c.complaint_id,
        e.exam_name as title,
        c.status,
        DATE_FORMAT(c.created_at, '%d/%m/%Y') as date
     FROM complaints c
     JOIN exams e ON c.exam_id = e.exam_id
     WHERE c.student_id = ?
     ORDER BY c.created_at DESC
     LIMIT 5`,
    [userId]
);

// 8. Lấy thông báo
const [notifications] = await req.db.query(
    `SELECT 
        notification_id,
        content as title,
        'Thông báo hệ thống' as message,
        DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as time
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
);
            return res.json({
                user: {
                    id: user.user_id,
                    user_id: user.user_id,
                    username: user.full_name || user.username,
                    fullName: user.full_name || user.username,
                    email: user.email,
                    phone: user.phone,
                    dob: user.dob,
                    class: 'N/A',
                    avgScore: avgScore,
                    rank: rank
                },
                upcomingTests: upcomingTests,
                availableTests: availableTests,
                myResults: myResults,
                ranking: {
                    total: ranking.length,
                    students: ranking
                },
                recentComplaints: recentComplaints,
                notifications: notifications
            });
        }

        // ⭐ NẾU LÀ TEACHER
        if (role === 'teacher') {
            return res.json({
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role
                }
            });
        }

        // Default response
        res.json({
            user: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error('❌ Error in /profile:', err);
        res.status(500).json({ error: 'Lỗi khi lấy thông tin người dùng', details: err.message });
    }
});

// ============================================
// ✏️ UPDATE USER PROFILE
// ============================================
router.post('/profile/update', authMiddleware, async (req, res) => {
    const userId = req.user.id || req.user.user_id;
    const { phone, dob } = req.body;

    console.log('=== UPDATE PROFILE ===');
    console.log('userId:', userId);
    console.log('phone:', phone);
    console.log('dob:', dob);

    if (!phone && !dob) {
        return res.status(400).json({ error: 'Vui lòng cung cấp ít nhất một trường để cập nhật' });
    }

    try {
        const updates = [];
        const values = [];

        if (phone) {
            updates.push('phone = ?');
            values.push(phone);
        }

        if (dob) {
            updates.push('dob = ?');
            values.push(dob);
        }

        values.push(userId);

        await req.db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`,
            values
        );

        res.json({ success: true, message: 'Cập nhật thông tin thành công' });
    } catch (err) {
        console.error('❌ Error in /profile/update:', err);
        res.status(500).json({ error: 'Lỗi khi cập nhật thông tin', details: err.message });
    }
});

module.exports = router;