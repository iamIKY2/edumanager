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
                        ea.attempt_id,
                        ea.exam_id,
                        e.exam_name as title,
                        DATE_FORMAT(ea.end_time, '%d/%m/%Y %H:%i') as date,
                        'Trắc nghiệm' as type,
                        ROUND(ea.score, 1) as score,
                        (SELECT SUM(points) FROM exam_questions WHERE exam_id = e.exam_id) as total,
                        ea.is_fully_graded,
                        (SELECT COUNT(*) 
                        FROM exam_attempt_answers eaa2
                        JOIN exam_questions eq2 ON eaa2.question_id = eq2.question_id
                        JOIN question_bank qb2 ON eq2.question_id = qb2.question_id
                        WHERE eaa2.attempt_id = ea.attempt_id
                        AND qb2.question_type IN ('Essay', 'FillInBlank')
                        AND (eaa2.is_graded = 0 OR eaa2.is_graded IS NULL)) as has_pending_grading
                    FROM exam_attempts ea
                    JOIN exams e ON ea.exam_id = e.exam_id
                    WHERE ea.student_id = ? AND ea.status = 'Submitted'
                    ORDER BY ea.end_time DESC
                    LIMIT 10`,
                    [userId]
                );

                // 6. Lấy lớp học của học sinh hiện tại (ưu tiên lớp có điểm từ lịch sử làm bài thi)
                let studentClass = null;
                let classIdForRanking = null;
                try {
                    // Trước tiên, tìm lớp mà học sinh đã làm bài thi (có điểm)
                    const [classesWithScores] = await req.db.query(
                        `SELECT DISTINCT c.class_id, c.class_name,
                                COUNT(DISTINCT ea.exam_id) as exam_count,
                                AVG(ea.score) as avg_score
                        FROM class_students cs
                        JOIN classes c ON cs.class_id = c.class_id
                        JOIN exams e ON c.class_id = e.class_id
                        JOIN exam_attempts ea ON e.exam_id = ea.exam_id
                        WHERE cs.student_id = ? 
                        AND ea.student_id = ?
                        AND ea.status = 'Submitted'
                        AND c.status = 'active'
                        GROUP BY c.class_id, c.class_name
                        ORDER BY exam_count DESC, avg_score DESC
                        LIMIT 1`,
                        [userId, userId]
                    );
                    
                    if (classesWithScores.length > 0) {
                        // Nếu có lớp có điểm, dùng lớp đó
                        studentClass = classesWithScores[0];
                        classIdForRanking = studentClass.class_id;
                        console.log('📊 Selected class with scores:', studentClass.class_name);
                    } else {
                        // Nếu không có lớp nào có điểm, lấy lớp tham gia gần nhất
                        const [studentClasses] = await req.db.query(
                            `SELECT c.class_id, c.class_name
                            FROM class_students cs
                            JOIN classes c ON cs.class_id = c.class_id
                            WHERE cs.student_id = ? AND c.status = 'active'
                            ORDER BY cs.joined_at DESC
                            LIMIT 1`,
                            [userId]
                        );
                        studentClass = studentClasses.length > 0 ? studentClasses[0] : null;
                        classIdForRanking = studentClass ? studentClass.class_id : null;
                        console.log('📊 Selected latest joined class:', studentClass ? studentClass.class_name : 'none');
                    }
                } catch (err) {
                    console.error('Error fetching student class:', err);
                }

                // 6. Lấy ranking - Top 10 và vị trí của học sinh hiện tại (theo lớp học)
                // Nếu học sinh có lớp, xếp hạng theo lớp. Nếu không, xếp hạng tổng thể
                let top10 = [];
                let totalCount = 0;
                let totalClassStudents = 0;
                let totalAllStudents = 0;
                
                try {
                    if (classIdForRanking) {
                        // Xếp hạng theo lớp - Lấy tất cả học sinh, có điểm trước, chưa có điểm sau
                        [top10] = await req.db.query(
                            `SELECT 
                                u.user_id as id,
                                u.full_name as fullName,
                                u.username,
                                CASE 
                                    WHEN AVG(ea.score) IS NOT NULL THEN ROUND(AVG(ea.score), 1)
                                    ELSE NULL
                                END as avgScore
                            FROM users u
                            JOIN class_students cs ON u.user_id = cs.student_id
                            LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id 
                                AND ea.status = 'Submitted'
                                AND ea.exam_id IN (SELECT exam_id FROM exams WHERE class_id = ?)
                            WHERE cs.class_id = ? AND u.role = 'Student'
                            GROUP BY u.user_id, u.full_name, u.username
                            ORDER BY 
                                CASE WHEN AVG(ea.score) IS NOT NULL THEN 0 ELSE 1 END,
                                AVG(ea.score) DESC
                            LIMIT 10`,
                            [classIdForRanking, classIdForRanking]
                        );

                    // Tính tổng số học sinh trong lớp có điểm
                    const [totalCountResult] = await req.db.query(
                        `SELECT COUNT(*) as total
                        FROM (
                            SELECT DISTINCT u.user_id
                            FROM users u
                            JOIN class_students cs ON u.user_id = cs.student_id
                            LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id 
                                AND ea.status = 'Submitted'
                                AND ea.exam_id IN (SELECT exam_id FROM exams WHERE class_id = ?)
                            WHERE cs.class_id = ? AND u.role = 'Student'
                            GROUP BY u.user_id
                            HAVING AVG(ea.score) IS NOT NULL
                        ) as students_with_scores`,
                        [classIdForRanking, classIdForRanking]
                    );
                    totalCount = totalCountResult.length > 0 ? parseInt(totalCountResult[0].total) : 0;
                    
                    // Lấy tổng số học sinh trong lớp (bao gồm cả chưa có điểm) để hiển thị thông tin đầy đủ
                    const [totalClassStudentsResult] = await req.db.query(
                        `SELECT COUNT(*) as total
                        FROM class_students cs
                        JOIN users u ON cs.student_id = u.user_id
                        WHERE cs.class_id = ? AND u.role = 'Student'`,
                        [classIdForRanking]
                    );
                    totalClassStudents = totalClassStudentsResult.length > 0 ? parseInt(totalClassStudentsResult[0].total) : 0;
                } else {
                    // Xếp hạng tổng thể (nếu học sinh chưa tham gia lớp nào)
                    [top10] = await req.db.query(
                        `SELECT 
                            u.user_id as id,
                            u.full_name as fullName,
                            u.username,
                            ROUND(AVG(ea.score), 1) as avgScore,
                            ROW_NUMBER() OVER (ORDER BY AVG(ea.score) DESC) as rank_position
                        FROM users u
                        LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id AND ea.status = 'Submitted'
                        WHERE u.role = 'Student'
                        GROUP BY u.user_id, u.full_name, u.username
                        HAVING avgScore IS NOT NULL
                        ORDER BY avgScore DESC
                        LIMIT 10`
                    );

                    const [totalCountResult] = await req.db.query(
                        `SELECT COUNT(*) as total
                        FROM (
                            SELECT DISTINCT u.user_id
                            FROM users u
                            LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id AND ea.status = 'Submitted'
                            WHERE u.role = 'Student'
                            GROUP BY u.user_id
                            HAVING AVG(ea.score) IS NOT NULL
                        ) as students_with_scores`
                    );
                    totalCount = totalCountResult.length > 0 ? parseInt(totalCountResult[0].total) : 0;
                    
                    // Lấy tổng số học sinh (bao gồm cả chưa có điểm)
                    const [totalAllStudentsResult] = await req.db.query(
                        `SELECT COUNT(*) as total
                        FROM users
                        WHERE role = 'Student'`
                    );
                    totalAllStudents = totalAllStudentsResult.length > 0 ? parseInt(totalAllStudentsResult[0].total) : 0;
                    }
                } catch (err) {
                    console.error('Error fetching ranking:', err);
                    top10 = [];
                    totalCount = 0;
                }
                
                console.log('📊 Ranking result - top10 length:', top10.length);
                console.log('📊 Ranking result - totalCount:', totalCount);

                // Lấy điểm trung bình của học sinh hiện tại (theo lớp hoặc tổng thể)
                let userAvgScore = null;
                try {
                    if (classIdForRanking) {
                        const [currentUserScore] = await req.db.query(
                            `SELECT ROUND(AVG(score), 1) as avgScore
                            FROM exam_attempts ea
                            JOIN exams e ON ea.exam_id = e.exam_id
                            WHERE ea.student_id = ? AND ea.status = 'Submitted' AND e.class_id = ?`,
                            [userId, classIdForRanking]
                        );
                        if (currentUserScore.length > 0 && currentUserScore[0].avgScore !== null) {
                            const score = parseFloat(currentUserScore[0].avgScore);
                            userAvgScore = !isNaN(score) ? score : null;
                        }
                    } else {
                        const [currentUserScore] = await req.db.query(
                            `SELECT ROUND(AVG(score), 1) as avgScore
                            FROM exam_attempts
                            WHERE student_id = ? AND status = 'Submitted'`,
                            [userId]
                        );
                        if (currentUserScore.length > 0 && currentUserScore[0].avgScore !== null) {
                            const score = parseFloat(currentUserScore[0].avgScore);
                            userAvgScore = !isNaN(score) ? score : null;
                        }
                    }
                } catch (err) {
                    console.error('Error fetching user average score:', err);
                    userAvgScore = null;
                }

                // Kiểm tra xem học sinh hiện tại có trong top 10 không
                const currentUserInTop10 = top10.find(s => s.id === userId);
                let userRank = null;

                if (currentUserInTop10) {
                    // Nếu trong top 10, lấy rank từ top10
                    userRank = top10.findIndex(s => s.id === userId) + 1;
                } else if (userAvgScore !== null && !isNaN(userAvgScore)) {
                    // Tính vị trí của học sinh hiện tại (số học sinh có điểm trung bình cao hơn + 1)
                    if (classIdForRanking) {
                        // Tính rank theo lớp
                        if (!isNaN(userAvgScore) && userAvgScore !== null) {
                            const [rankResult] = await req.db.query(
                                `SELECT COUNT(*) + 1 as rank_position
                                FROM (
                                    SELECT u.user_id
                                    FROM users u
                                    JOIN class_students cs ON u.user_id = cs.student_id
                                    LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id 
                                        AND ea.status = 'Submitted'
                                        AND ea.exam_id IN (SELECT exam_id FROM exams WHERE class_id = ?)
                                    WHERE cs.class_id = ? AND u.role = 'Student' AND u.user_id != ?
                                    GROUP BY u.user_id
                                    HAVING ROUND(AVG(ea.score), 1) > ?
                                ) as better_students`,
                                [classIdForRanking, classIdForRanking, userId, userAvgScore]
                            );
                            userRank = rankResult.length > 0 ? parseInt(rankResult[0].rank_position) : null;
                        }
                    } else {
                        // Tính rank tổng thể
                        if (!isNaN(userAvgScore) && userAvgScore !== null) {
                            const [rankResult] = await req.db.query(
                                `SELECT COUNT(*) + 1 as rank_position
                                FROM (
                                    SELECT u.user_id
                                    FROM users u
                                    LEFT JOIN exam_attempts ea ON u.user_id = ea.student_id AND ea.status = 'Submitted'
                                    WHERE u.role = 'Student' AND u.user_id != ?
                                    GROUP BY u.user_id
                                    HAVING ROUND(AVG(ea.score), 1) > ?
                                ) as better_students`,
                                [userId, userAvgScore]
                            );
                            userRank = rankResult.length > 0 ? parseInt(rankResult[0].rank_position) : null;
                        }
                    }
                }

                // Tạo ranking object
                const ranking = {
                    top10: top10 || [],
                    currentUser: currentUserInTop10 ? null : (userRank && userAvgScore !== null && !isNaN(userAvgScore) ? {
                        id: userId,
                        fullName: user.full_name || user.username,
                        username: user.username,
                        avgScore: userAvgScore,
                        rank_position: userRank
                    } : null),
                    total: totalCount || 0,
                    className: studentClass ? studentClass.class_name : null,
                    totalClassStudents: classIdForRanking ? totalClassStudents : totalAllStudents
                };
                
                console.log('📊 Final ranking object:', JSON.stringify(ranking, null, 2));

                // 7. Lấy khiếu nại gần đây
                let recentComplaints = [];
                try {
                    const [complaintsResult] = await req.db.query(
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
                    recentComplaints = complaintsResult || [];
                } catch (err) {
                    console.error('Error fetching complaints:', err);
                    recentComplaints = [];
                }

                // 8. Lấy thông báo
                let notifications = [];
                try {
                    const [notificationsResult] = await req.db.query(
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
                    notifications = notificationsResult || [];
                } catch (err) {
                    console.error('Error fetching notifications:', err);
                    notifications = [];
                }

                // Tính rank cho user (dùng cho phần stats)
                let userRankForStats = null;
                if (currentUserInTop10) {
                    userRankForStats = top10.findIndex(s => s.id === userId) + 1;
                } else if (userRank) {
                    userRankForStats = userRank;
                }

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
                        rank: userRankForStats
                    },
                    upcomingTests: upcomingTests,
                    availableTests: availableTests,
                    myResults: myResults,
                    ranking: ranking,
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
            console.error('❌ Error stack:', err.stack);
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