// student.js
        // Socket.IO connection
        let socket;
        let unreadNotificationCount = 0;

        document.addEventListener('DOMContentLoaded', function () {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role')?.toLowerCase();

            if (!token || role !== 'student') {
                alert('Bạn không có quyền truy cập trang này! Vui lòng đăng nhập lại.');
                window.location.href = './login.html';
                return;
            }

            // Kết nối Socket.IO với token
            socket = io('http://localhost:3000', {
                auth: { token }
            });

            socket.on('connect', () => {
                const userId = localStorage.getItem('user_id');
                // Socket đã tự động join room khi connect (theo app.js)
                // Nhưng vẫn emit để đảm bảo
                socket.emit('join-room', `user_${userId}`);
            });

            socket.on('connect_error', (error) => {
                console.error('❌ Socket.io connection error:', error);
            });

            // Lắng nghe thông báo realtime
            socket.on('notification', (notification) => {
                unreadNotificationCount++;
                updateNotificationBadge();
                showToast(notification.content, 'success');
                // Reload notifications nếu modal đang mở
                const modal = document.getElementById('notificationModal');
                if (modal && modal.style.display === 'flex') {
                    loadNotifications();
                }
            });

            fetchUserData();
            loadAvailableTests(); 
            loadTestHistory();  
            loadStatistics();
            loadNotifications(); // Load thông báo khi trang load
            initExamCodeInput(); // Khởi tạo input mã code
            loadComplaintExams(); // Load danh sách bài thi cho khiếu nại
            loadComplaints(); // Load lịch sử khiếu nại
            
            // ⭐ KHÔI PHỤC SECTION ĐÃ MỞ TRƯỚC ĐÓ (KHI F5)
            const savedSection = localStorage.getItem('currentSection');
            if (savedSection && document.getElementById(savedSection)) {
                showSection(savedSection);
            }
            
            // ⭐ TỰ ĐỘNG REFRESH DANH SÁCH BÀI THI MỖI 30 GIÂY
            setInterval(() => {
                loadAvailableTests();
            }, 30000); // 30 giây
            
            // ⭐ LẮNG NGHE SỰ KIỆN EXAM STATUS CHANGED TỪ SERVER
            socket.on('exam_status_changed', (data) => {
                console.log('🔄 Exam status changed:', data);
                loadAvailableTests(); // Refresh danh sách bài thi
            });
        });
        
        // Đảm bảo user_id được lưu khi fetchUserData
        let userIdFromServer = null;

        function fetchUserData() {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found in localStorage');
                alert('Không có token. Vui lòng đăng nhập lại!');
                window.location.href = './login.html';
                return;
            }

            fetch('http://127.0.0.1:3000/api/user/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(`Lỗi: ${response.status} - ${errorData.error || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.error);

                document.getElementById('userName').textContent = data.user.fullName || data.user.username || 'Đang tải...';
                document.getElementById('userId').textContent = `MSSV: ${data.user.id || 'Đang tải...'}`;
                document.getElementById('avgScore').textContent = data.user.avgScore || 'Đang tải...';
                document.getElementById('rankPosition').textContent = `#${data.user.rank || 'Đang tải...'}`;
                
                // Lưu user_id vào localStorage để socket sử dụng
                userIdFromServer = data.user.user_id || data.user.id;
                if (userIdFromServer) {
                    localStorage.setItem('user_id', userIdFromServer);
                    
                    // Rejoin room với user_id chính xác nếu socket đã connect
                    if (socket && socket.connected) {
                        socket.emit('join-room', `user_${userIdFromServer}`);
                    }
                }

                const infoGrid = document.getElementById('userInfo');
                const genderText = data.user.gender === 'male' ? 'Nam' : 
                                  data.user.gender === 'female' ? 'Nữ' : 
                                  data.user.gender === 'other' ? 'Khác' : null;
                infoGrid.innerHTML = `
                    <div class="info-item">
                        <span><strong>Lớp:</strong></span>
                        <span>${data.user.class || '<span style="color: #ff4757;">Chưa cập nhật</span>'}</span>
                    </div>
                    <div class="info-item">
                        <span><strong>Email:</strong></span>
                        <span>${data.user.email || 'Chưa cập nhật'}</span>
                    </div>
                    <div class="info-item">
                        <span><strong>Giới tính:</strong></span>
                        <span>${genderText || '<span style="color: #ff4757;">Chưa cập nhật</span>'}</span>
                    </div>
                    <div class="info-item">
                        <span><strong>Số điện thoại:</strong></span>
                        <span>${data.user.phone || '<span style="color: #ff4757;">Chưa cập nhật</span>'}</span>
                    </div>
                    <div class="info-item">
                        <span><strong>Ngày sinh:</strong></span>
                        <span>${data.user.dob ? new Date(data.user.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>
                    </div>
                `;

                const upcomingTests = document.getElementById('upcomingTests');
                upcomingTests.innerHTML = `
                    <h3 style="margin-bottom: 15px;">Lịch thi sắp tới</h3>
                    ${data.upcomingTests?.map(test => `
                        <div class="schedule-item">
                            <div>
                                <div style="font-weight: 600;">${test.title}</div>
                                <div style="font-size: 12px; color: #666;">${test.duration} • ${10} câu</div>
                            </div>
                            <div class="schedule-date">${test.date}</div>
                        </div>
                    `).join('') || '<p>Không có lịch thi sắp tới.</p>'}
                `;

                // Điền dữ liệu vào modal
                document.getElementById('editFullName').value = data.user.fullName || '';
                document.getElementById('editClass').value = data.user.class || '';
                document.getElementById('editGender').value = data.user.gender || '';
                document.getElementById('editPhone').value = data.user.phone || '';
                document.getElementById('editDob').value = data.user.dob ? data.user.dob.split('T')[0] : '';

                // Lấy danh sách lớp của học sinh từ backend
                const myClassesList = document.getElementById('myClassesList');

                fetch('http://127.0.0.1:3000/api/student/classes/my', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(classData => {
                    if (classData.myClasses?.length > 0) {
                        myClassesList.innerHTML = classData.myClasses.map(cls => `
                            <div class="class-card" onclick="viewClassDetail(${cls.class_id}, '${cls.class_name}', '${cls.subject_name || 'Chưa có môn'}', '${cls.academic_year}')">
                                <div class="class-card-header">
                                    <div>
                                        <div class="class-card-title">${cls.class_name}</div>
                                        <div class="class-card-subject">${cls.subject_name || 'Chưa có môn'}</div>
                                    </div>
                                    <div class="class-card-icon">📚</div>
                                </div>
                                <div class="class-card-footer">
                                    <span>📅 ${cls.academic_year}</span>
                                    <span style="color: #667eea; font-weight: 600;">Xem chi tiết →</span>
                                </div>
                            </div>
                        `).join('');
                    } else {
                        myClassesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">Chưa tham gia lớp nào. Hãy tham gia lớp học để bắt đầu!</p>';
                    }
                })
                .catch(err => {
                    myClassesList.innerHTML = '<p style="text-align: center; color: #ff4757;">Lỗi tải dữ liệu lớp học.</p>';
                });

                const availableTestsList = document.getElementById('availableTestsList');
                availableTestsList.innerHTML = data.availableTests?.map(test => `
                    <div class="test-item">
                        <div class="test-info">
                            <div class="test-title">${test.title}</div>
                            <div class="test-meta">Lớp: ${test.class} • ${test.duration} • ${test.questions} câu</div>
                        </div>
                        <div>
                            <div class="countdown">${test.timeLeft || '00:00'}</div>
                            <button class="btn btn-success" onclick="startTest(${test.id})">Làm bài</button>
                        </div>
                    </div>
                `).join('') || '<p>Không có bài kiểm tra khả dụng.</p>';

                const myResultsList = document.getElementById('myResultsList');
                // myResults có thể có cấu trúc khác, cần kiểm tra
                if (data.myResults && data.myResults.length > 0) {
                    myResultsList.innerHTML = data.myResults.map(result => {
                        // Kiểm tra xem result có exam_id và attempt_id không
                        const examId = result.exam_id || result.id;
                        const attemptId = result.attempt_id || result.id;
                        
                        // Nếu chỉ có id, có thể là attempt_id, cần lấy exam_id từ đâu đó
                        // Tạm thời thử dùng id cho cả 2, hoặc tải lại từ API
                        return `
                            <div class="test-item">
                                <div class="test-info">
                                    <div class="test-title">${result.title || result.exam_name || 'Bài thi'}</div>
                                    <div class="test-meta">Ngày: ${result.date || (result.start_time ? new Date(result.start_time).toLocaleDateString('vi-VN') : 'N/A')} • ${result.type || ''}</div>
                                </div>
                                <div style="font-size: 18px; font-weight: bold; color: #667eea;">
                                    ${(() => {
                                        const s = parseFloat(result.score || 0);
                                        const t = parseFloat(result.total || result.total_points || 0);
                                        const scoreStr = s % 1 === 0 ? s.toString() : s.toFixed(1);
                                        const totalStr = t % 1 === 0 ? t.toString() : t.toFixed(1);
                                        return `${scoreStr}/${totalStr}`;
                                    })()}
                                </div>
                                <button class="btn btn-primary" onclick="viewResult(${examId}, ${attemptId})">Xem chi tiết</button>
                            </div>
                        `;
                    }).join('');
                } else {
                    myResultsList.innerHTML = '<p>Chưa có kết quả.</p>';
                }

                const rankingTable = document.getElementById('rankingTable').querySelector('tbody');
                const rankingTotal = document.getElementById('rankingTotal');
                const rankingTitle = document.getElementById('rankingTitle');
                const rankingClassName = document.getElementById('rankingClassName');
                const currentUserRankInfo = document.getElementById('currentUserRankInfo');
                const currentUserRank = document.getElementById('currentUserRank');
                
                // Hiển thị top 10
                const top10 = data.ranking?.top10 || [];
                const currentUser = data.ranking?.currentUser;
                const totalStudents = data.ranking?.total || 0;
                const className = data.ranking?.className;
                
                // Cập nhật tiêu đề với tên lớp
                if (className) {
                    rankingClassName.textContent = `(${className})`;
                } else {
                    rankingClassName.textContent = '(Tổng thể)';
                }
                
                // Hiển thị tổng số học sinh
                const totalClassStudents = data.ranking?.totalClassStudents || 0;
                if (totalStudents > 0) {
                    if (totalClassStudents > 0 && totalClassStudents > totalStudents) {
                        rankingTotal.textContent = `Tổng số học sinh có điểm: ${totalStudents} / ${totalClassStudents} học sinh trong lớp`;
                    } else {
                        rankingTotal.textContent = `Tổng số học sinh có điểm: ${totalStudents}`;
                    }
                } else {
                    if (totalClassStudents > 0) {
                        rankingTotal.textContent = `Chưa có học sinh nào có điểm trung bình (Tổng số học sinh trong lớp: ${totalClassStudents})`;
                    } else {
                        rankingTotal.textContent = `Chưa có học sinh nào có điểm trung bình`;
                    }
                }
                
                // Hiển thị thông tin vị trí của học sinh đang đăng nhập
                const currentUserInTop10 = top10.find(s => s.id === data.user.id || s.id === data.user.user_id);
                
                if (currentUserInTop10) {
                    // Học sinh trong top 10
                    const userRank = top10.findIndex(s => s.id === data.user.id || s.id === data.user.user_id) + 1;
                    currentUserRankInfo.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                            <div style="font-size: 36px; font-weight: bold;">
                                #${userRank}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
                                    ${currentUserInTop10.fullName || currentUserInTop10.username || 'Chưa cập nhật'}
                                </div>
                                <div style="font-size: 16px; opacity: 0.9;">
                                    MSSV: ${currentUserInTop10.id} • Điểm trung bình: <strong>${currentUserInTop10.avgScore || '0.0'}</strong>
                                </div>
                                <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">
                                    Bạn đang xếp hạng #${userRank} trong tổng số ${totalStudents} học sinh
                                </div>
                            </div>
                        </div>
                    `;
                } else if (currentUser && currentUser.rank_position) {
                    // Học sinh không trong top 10
                    currentUserRankInfo.innerHTML = `
                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                            <div style="font-size: 36px; font-weight: bold;">
                                #${currentUser.rank_position}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 20px; font-weight: 600; margin-bottom: 5px;">
                                    ${currentUser.fullName || currentUser.username || 'Chưa cập nhật'}
                                </div>
                                <div style="font-size: 16px; opacity: 0.9;">
                                    MSSV: ${currentUser.id} • Điểm trung bình: <strong>${currentUser.avgScore || '0.0'}</strong>
                                </div>
                                <div style="font-size: 14px; opacity: 0.8; margin-top: 5px;">
                                    Bạn đang xếp hạng #${currentUser.rank_position} trong tổng số ${totalStudents} học sinh
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    // Học sinh chưa có điểm
                    currentUserRankInfo.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                            <div style="font-size: 20px; font-weight: 600; margin-bottom: 10px; opacity: 0.95;">
                                Chưa có điểm trung bình
                            </div>
                            <div style="font-size: 16px; opacity: 0.85;">
                                Hãy làm bài thi để có xếp hạng!
                            </div>
                        </div>
                    `;
                }
                
                // Hiển thị bảng xếp hạng
                let tableHTML = '';
                
                // Hiển thị top 10
                if (top10.length > 0) {
                    tableHTML += top10.map((student, index) => {
                        const rank = index + 1;
                        const isCurrentUser = student.id === data.user.id || student.id === data.user.user_id;
                        const hasScore = student.avgScore !== null && student.avgScore !== undefined;
                        const displayScore = hasScore ? student.avgScore : 'Chưa có';
                        
                        return `
                            <tr ${isCurrentUser ? 'class="current-user"' : ''}>
                                <td><span class="rank-badge ${rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''}">${rank}${rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : ''}</span></td>
                                <td>${student.fullName || student.username || 'Chưa cập nhật'} ${isCurrentUser ? '<span style="color: #667eea; font-weight: 600;">(Bạn)</span>' : ''}</td>
                                <td>${student.id}</td>
                                <td><strong style="${!hasScore ? 'color: #999;' : ''}">${displayScore}</strong></td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    tableHTML = `
                        <tr>
                            <td colspan="4" style="text-align: center; padding: 40px; color: #666;">
                                <div style="font-size: 18px; margin-bottom: 10px;">📊</div>
                                <div style="font-weight: 600; margin-bottom: 5px;">Chưa có dữ liệu xếp hạng</div>
                                <div style="font-size: 14px; color: #999;">
                                    ${totalStudents === 0 ? 'Chưa có học sinh nào đã làm bài thi. Hãy làm bài thi để có xếp hạng!' : 'Đang tải dữ liệu...'}
                                </div>
                            </td>
                        </tr>
                    `;
                }
                
                // Hiển thị học sinh hiện tại nếu không trong top 10
                if (currentUser && currentUser.rank_position && !currentUserInTop10) {
                    tableHTML += `
                        <tr style="border-top: 2px solid #667eea;">
                            <td colspan="4" style="text-align: center; padding: 10px; background: #f0f4ff; color: #667eea; font-weight: 600;">
                                ... 
                            </td>
                        </tr>
                        <tr class="current-user" style="background: #e8f2ff;">
                            <td><span class="rank-badge">${currentUser.rank_position}</span></td>
                            <td><strong>${currentUser.fullName || 'Chưa cập nhật'} <span style="color: #667eea; font-weight: 600;">(Bạn)</span></strong></td>
                            <td>${currentUser.id}</td>
                            <td><strong style="color: #667eea;">${currentUser.avgScore || '0.0'}</strong></td>
                        </tr>
                    `;
                }
                
                rankingTable.innerHTML = tableHTML || '<tr><td colspan="4">Không có dữ liệu xếp hạng.</td></tr>';

                const recentComplaints = document.getElementById('recentComplaints');
                recentComplaints.innerHTML = data.recentComplaints?.map(complaint => `
                    <div class="info-item">
                        <div>
                            <strong>${complaint.title}</strong><br>
                            <span style="color: ${complaint.status === 'Đang xử lý' ? '#ff9f43' : complaint.status === 'Đã duyệt' ? '#2ed573' : '#ff4757'};">${complaint.status}</span>
                        </div>
                        <div style="color: #666; font-size: 12px;">${complaint.date}</div>
                    </div>
                `).join('') || '<p>Chưa có khiếu nại nào.</p>';

                const complaintSubject = document.getElementById('complaintSubject');
                complaintSubject.innerHTML = '<option>Chọn bài kiểm tra...</option>' + (data.myResults?.map(result => {
                    const examId = result.exam_id || result.id;
                    const attemptId = result.attempt_id || result.id;
                    const s = parseFloat(result.score || 0);
                    const t = parseFloat(result.total || result.total_points || 0);
                    const scoreStr = s % 1 === 0 ? s.toString() : s.toFixed(1);
                    const totalStr = t % 1 === 0 ? t.toString() : t.toFixed(1);
                    return `<option value="${examId}:${attemptId}">${result.title || result.exam_name || 'Bài thi'} (${scoreStr}/${totalStr})</option>`;
                }).join('') || '');

                const notificationList = document.getElementById('notificationList');
                notificationList.innerHTML = data.notifications?.map(notif => `
                    <div class="info-item">
                        <div>
                            <strong>${notif.title}</strong><br>
                            <span style="color: #666; font-size: 13px;">${notif.message}</span>
                        </div>
                        <div style="color: #999; font-size: 12px;">${notif.time}</div>
                    </div>
                `).join('') || '<p>Không có thông báo mới.</p>';
            })
            .catch(error => {
                console.error('Lỗi tải dữ liệu:', error);
                alert('Không thể tải dữ liệu. Vui lòng thử lại sau!\nChi tiết: ' + error.message);
            });
        }

        function saveProfileChanges() {
            const token = localStorage.getItem('token');
            const fullName = document.getElementById('editFullName').value.trim();
            const gender = document.getElementById('editGender').value;
            const phone = document.getElementById('editPhone').value.trim();
            const dob = document.getElementById('editDob').value.trim(); 

            // Kiểm tra ít nhất một trường được điền
            if (!fullName && !gender && !phone && !dob) {
                showToast('❌ Vui lòng điền ít nhất một trường!', 'error');
                return;
            }

            // Validate fullName
            if (fullName && fullName.length < 2) {
                showToast('❌ Họ và tên phải có ít nhất 2 ký tự!', 'error');
                return;
            }

            // Validate phone
            const phoneRegex = /^0[1-9][0-9]{8,9}$/;
            if (phone && !phoneRegex.test(phone)) {
                showToast('❌ Số điện thoại không hợp lệ! (VD: 0123456789)', 'error');
                return;
            }

            // Gửi dữ liệu lên server
            const updateData = {};
            if (fullName) updateData.fullName = fullName;
            if (gender) updateData.gender = gender;
            if (phone) updateData.phone = phone;
            if (dob) updateData.dob = dob;

            fetch('http://localhost:3000/api/user/profile/update', { 
                method: 'POST', 
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            })
            .then(response => {
                if (!response.ok) throw new Error('Lỗi cập nhật thông tin');
                return response.json();
            })
            .then(data => {
                if (data.error) throw new Error(data.message || 'Cập nhật thất bại');
                showToast('✅ Thông tin đã được cập nhật thành công!', 'success');
                closeModal('editProfileModal');
                fetchUserData(); 
            })
            .catch(error => {
                console.error('Lỗi cập nhật:', error);
                showToast('❌ Lỗi khi cập nhật thông tin. Vui lòng thử lại!', 'error');
            });
        }

        // Menu & Navigation
        function toggleSubmenu(menuId) {
            const submenu = document.getElementById(menuId + '-submenu');
            const arrow = document.getElementById(menuId + '-arrow');
            submenu.classList.toggle('open');
            arrow.classList.toggle('rotate');
        }

        function showSection(sectionId, event) {
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) {
                console.error('Section not found:', sectionId);
                return;
            }
            targetSection.classList.add('active');

            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => item.classList.remove('active'));
            
            // ⭐ SỬA LỖI: Kiểm tra event có tồn tại và có target không
            if (event && event.target && typeof event.target.closest === 'function') {
                const menuItem = event.target.closest('.menu-item');
                if (menuItem) {
                    menuItem.classList.add('active');
                }
            } else {
                // Nếu không có event, tìm menu item tương ứng với section
                const menuItemMap = {
                    'dashboard': 0,
                    'join-class': 1,
                    'my-classes': 1,
                    'class-detail': 1,
                    'available-tests': 2,
                    'test-history': 2,
                    'my-results': 3,
                    'statistics': 3,
                    'ranking': 3,
                    'complaints': 4
                };
                const menuIndex = menuItemMap[sectionId];
                if (menuIndex !== undefined) {
                    const allMenuItems = Array.from(document.querySelectorAll('.menu-item'));
                    if (allMenuItems[menuIndex]) {
                        allMenuItems[menuIndex].classList.add('active');
                    }
                }
            }

            const titles = {
                'dashboard': 'Trang chủ',
                'join-class': 'Tham gia lớp học',
                'my-classes': 'Lớp của tôi',
                'class-detail': 'Chi tiết lớp học',
                'available-tests': 'Bài kiểm tra khả dụng',
                'test-history': 'Lịch sử làm bài',
                'my-results': 'Kết quả của tôi',
                'statistics': 'Thống kê',
                'ranking': 'Bảng xếp hạng',
                'complaints': 'Khiếu nại điểm'
            };
            document.getElementById('pageTitle').textContent = titles[sectionId] || 'EduSystem';

            // ⭐ LƯU SECTION HIỆN TẠI VÀO LOCALSTORAGE (ĐỂ KHÔI PHỤC KHI F5)
            localStorage.setItem('currentSection', sectionId);

            // ⭐ LOAD DỮ LIỆU KHI CHUYỂN SECTION - ĐẢM BẢO RELOAD KHI QUAY VỀ
            if (sectionId === 'dashboard') {
                // Reload dữ liệu trang chủ
                fetchUserData();
                loadAvailableTests();
            } else if (sectionId === 'my-classes') {
                // Reload danh sách lớp học
                loadMyClasses();
            } else if (sectionId === 'complaints') {
                loadComplaintExams(); // Load lại danh sách bài thi
                loadComplaints(); // Load lại lịch sử khiếu nại
            } else if (sectionId === 'available-tests') {
                loadAvailableTests(); // Refresh danh sách bài thi khả dụng
            } else if (sectionId === 'test-history') {
                loadTestHistory(); // Refresh lịch sử làm bài
            } else if (sectionId === 'my-results') {
                loadMyResults(); // Load kết quả
            } else if (sectionId === 'statistics') {
                loadStatistics(); // Load thống kê
            } else if (sectionId === 'ranking') {
                loadRanking(); // Load bảng xếp hạng
            } else if (sectionId === 'class-detail') {
                // Nếu đang ở class-detail, không làm gì (dữ liệu đã được load khi viewClassDetail được gọi)
                // Nhưng nếu quay lại từ trang khác, cần reload
                const savedClassId = localStorage.getItem('currentClassId');
                if (savedClassId) {
                    // Có thể reload lại nếu cần
                }
            }

            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        }
        
        // ⭐ HÀM LOAD DANH SÁCH LỚP HỌC
        function loadMyClasses() {
            const token = localStorage.getItem('token');
            const myClassesList = document.getElementById('myClassesList');
            
            if (!myClassesList) return;
            
            myClassesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">⏳ Đang tải danh sách lớp học...</p>';
            
            fetch('http://127.0.0.1:3000/api/student/classes/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Không thể tải danh sách lớp học');
                return res.json();
            })
            .then(classData => {
                if (classData.myClasses?.length > 0) {
                    myClassesList.innerHTML = classData.myClasses.map(cls => `
                        <div class="class-card" onclick="viewClassDetail(${cls.class_id}, '${cls.class_name}', '${cls.subject_name || 'Chưa có môn'}', '${cls.academic_year}')">
                            <div class="class-card-header">
                                <div>
                                    <div class="class-card-title">${cls.class_name}</div>
                                    <div class="class-card-subject">${cls.subject_name || 'Chưa có môn'}</div>
                                </div>
                                <div class="class-card-icon">📚</div>
                            </div>
                            <div class="class-card-footer">
                                <span>📅 ${cls.academic_year}</span>
                                <span style="color: #667eea; font-weight: 600;">Xem chi tiết →</span>
                            </div>
                        </div>
                    `).join('');
                } else {
                    myClassesList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">Chưa tham gia lớp nào. Hãy tham gia lớp học để bắt đầu!</p>';
                }
            })
            .catch(err => {
                console.error('Error loading classes:', err);
                myClassesList.innerHTML = '<p style="text-align: center; color: #ff4757;">❌ Lỗi tải dữ liệu lớp học. Vui lòng thử lại.</p>';
            });
        }
        
        // ⭐ HÀM LOAD KẾT QUẢ CỦA TÔI
        function loadMyResults() {
            const token = localStorage.getItem('token');
            const myResultsList = document.getElementById('myResultsList');
            
            if (!myResultsList) return;
            
            myResultsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">⏳ Đang tải kết quả...</p>';
            
            // Load từ API
            fetch('http://127.0.0.1:3000/api/student/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => {
                if (!res.ok) throw new Error('Không thể tải danh sách bài thi');
                return res.json();
            })
            .then(exams => {
                // Lọc chỉ bài thi đã làm
                const completedExams = exams.filter(exam => exam.my_attempts > 0);
                
                if (completedExams.length > 0) {
                    // Load chi tiết từng bài thi để lấy điểm
                    Promise.all(completedExams.map(async exam => {
                        try {
                            const detailRes = await fetch(`http://127.0.0.1:3000/api/student/exams/${exam.exam_id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const detail = await detailRes.json();
                            const submittedAttempt = detail.attempts?.find(a => a.status === 'Submitted' || a.status === 'AutoSubmitted');
                            return {
                                exam_id: exam.exam_id,
                                exam_name: exam.exam_name,
                                start_time: exam.start_time,
                                attempt_id: submittedAttempt?.attempt_id,
                                score: submittedAttempt?.score,
                                total_points: submittedAttempt?.total_points || exam.total_points
                            };
                        } catch {
                            return null;
                        }
                    }))
                    .then(results => {
                        const validResults = results.filter(r => r !== null && r.attempt_id);
                        if (validResults.length > 0) {
                            myResultsList.innerHTML = validResults.map(result => {
                                const score = parseFloat(result.score || 0);
                                const total = parseFloat(result.total_points || 0);
                                const scoreStr = score % 1 === 0 ? score.toString() : score.toFixed(1);
                                const totalStr = total % 1 === 0 ? total.toString() : total.toFixed(1);
                                
                                return `
                                    <div class="test-item">
                                        <div class="test-info">
                                            <div class="test-title">${result.exam_name || 'Bài thi'}</div>
                                            <div class="test-meta">Ngày: ${result.start_time ? new Date(result.start_time).toLocaleDateString('vi-VN') : 'N/A'}</div>
                                        </div>
                                        <div style="font-size: 18px; font-weight: bold; color: #667eea;">
                                            ${scoreStr}/${totalStr}
                                        </div>
                                        <button class="btn btn-primary" onclick="viewResult(${result.exam_id}, ${result.attempt_id})">Xem chi tiết</button>
                                    </div>
                                `;
                            }).join('');
                        } else {
                            myResultsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">Chưa có kết quả nào.</p>';
                        }
                    });
                } else {
                    myResultsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">Chưa có kết quả nào.</p>';
                }
            })
            .catch(err => {
                console.error('Error loading results:', err);
                myResultsList.innerHTML = '<p style="text-align: center; color: #ff4757;">❌ Lỗi tải kết quả. Vui lòng thử lại.</p>';
            });
        }
        
        // ⭐ HÀM LOAD BẢNG XẾP HẠNG
        function loadRanking() {
            // Reload dữ liệu từ fetchUserData để lấy ranking
            fetchUserData();
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('sidebarOverlay').classList.toggle('active');
        }

        // Modal functions
        function openModal(modalId) {
            document.getElementById(modalId).style.display = 'block';
        }

        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }

        // Avatar upload
        function uploadAvatar(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    showToast('✅ Đã cập nhật ảnh đại diện!', 'success');
                };
                reader.readAsDataURL(input.files[0]);
            }
        }

        // Change password
        function changePassword() {
            const inputs = document.querySelectorAll('#changePasswordModal input');
            if (!inputs[0].value || !inputs[1].value || !inputs[2].value) {
                showToast('❌ Vui lòng điền đầy đủ thông tin!', 'error');
                return;
            }

            if (inputs[1].value !== inputs[2].value) {
                showToast('❌ Mật khẩu mới không khớp!', 'error');
                return;
            }

            if (inputs[1].value.length < 6) {
                showToast('❌ Mật khẩu phải có ít nhất 6 ký tự!', 'error');
                return;
            }

            showToast('✅ Đổi mật khẩu thành công!', 'success');
            closeModal('changePasswordModal');
            inputs.forEach(input => input.value = '');
        }

        // Join class
        async function joinClass() {
            const code = document.getElementById('classCode').value.trim();
            const token = localStorage.getItem('token');

            if (!code) return showToast('❌ Vui lòng nhập mã lớp!', 'error');
            if (code.length < 6) return showToast('❌ Mã lớp không hợp lệ!', 'error');

            try {
                const res = await fetch('http://127.0.0.1:3000/api/student/classes/join', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ classCode: code })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Không thể tham gia lớp.');
                }

                showToast('🎉 Tham gia lớp thành công!', 'success');
                document.getElementById('classCode').value = '';
                fetchUserData();
            } catch (err) {
                showToast(`❌ ${err.message}`, 'error');
            }
        }

        function joinByLink() {
            const link = prompt('Nhập link mời:');
            if (link) {
                showToast('🎉 Tham gia lớp thành công!', 'success');
                fetchUserData();
            }
        }

  // View class detail
// ============================================
// 📊 XEM CHI TIẾT LỚP HỌC - ĐÃ CẬP NHẬT
// ============================================
async function viewClassDetail(classId, className, subject, year) {
    const token = localStorage.getItem('token');
    
    showSection('class-detail');
    document.getElementById('pageTitle').textContent = `Chi tiết lớp: ${className}`;
    
    document.getElementById('classDetailTitle').textContent = className;
    document.getElementById('detailClassCode').textContent = className;
    document.getElementById('detailSubject').textContent = subject;
    document.getElementById('detailYear').textContent = year;
    document.getElementById('detailTeacher').textContent = 'Đang tải...';

    document.getElementById('studentsList').innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">⏳ Đang tải dữ liệu...</p>';
    document.getElementById('testsList').innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">⏳ Đang tải dữ liệu...</p>';
    document.getElementById('announcementsList').innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">⏳ Đang tải dữ liệu...</p>';

    try {
        const response = await fetch(`http://127.0.0.1:3000/api/classes/${classId}/detail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Không thể tải thông tin lớp');

        const data = await response.json();

        document.getElementById('detailTeacher').textContent = data.teacher || 'Chưa có thông tin';

        document.getElementById('studentsCount').textContent = `(${data.students?.length || 0})`;
        document.getElementById('testsCount').textContent = `(${data.tests?.length || 0})`;
        document.getElementById('announcementsCount').textContent = `(${data.announcements?.length || 0})`;

        const studentsList = document.getElementById('studentsList');
        if (data.students && data.students.length > 0) {
            studentsList.innerHTML = data.students.map((student, index) => `
                <div class="student-item">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="student-number">#${index + 1}</div>
                        <div class="student-avatar">${student.username?.charAt(0).toUpperCase() || 'S'}</div>
                        <div>
                            <div class="student-name">${student.username || 'Không rõ'}</div>
                            <div class="student-id">MSSV: ${student.user_id || 'N/A'}</div>
                        </div>
                    </div>
                    ${student.email ? `<div class="student-email">📧 ${student.email}</div>` : ''}
                </div>
            `).join('');
        } else {
            studentsList.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><p>Chưa có học sinh nào trong lớp</p></div>';
        }

        // ⭐ PHẦN HIỂN THỊ BÀI KIỂM TRA VỚI LOGIC KIỂM TRA ĐÃ LÀM BÀI
        const testsList = document.getElementById('testsList');
        if (data.tests && data.tests.length > 0) {
            // ⭐ LẤY THÔNG TIN CÁC BÀI ĐÃ LÀM
            const testsWithAttempts = await Promise.all(data.tests.map(async test => {
                try {
                    const detailRes = await fetch(`http://127.0.0.1:3000/api/student/exams/${test.exam_id || test.test_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const detail = await detailRes.json();
                    return { ...test, attempts: detail.attempts || [] };
                } catch {
                    return { ...test, attempts: [] };
                }
            }));

            testsList.innerHTML = testsWithAttempts.map(test => {
                const now = new Date();
                const startTime = new Date(test.start_time);
                const endTime = new Date(startTime.getTime() + test.duration * 60000);
                
                let status = test.status;
                
                if (!status || status === 'active') {
                    if (now < startTime) {
                        status = 'upcoming';
                    } else if (now >= startTime && now < endTime) {
                        status = 'active';
                    } else {
                        status = 'completed';
                    }
                }

                // ⭐ KIỂM TRA ĐÃ NỘP BÀI CHƯA
                const hasSubmitted = test.attempts.some(a => 
                    a.status === 'Submitted' || a.status === 'AutoSubmitted'
                );

                let actionButton = '';
                let statusBadge = '';
                
                if (hasSubmitted) {
                    // ⭐ ĐÃ LÀM BÀI
                    statusBadge = '<span style="background: #3498db; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✅ Đã hoàn thành</span>';
                    const latestAttempt = test.attempts.find(a => a.status === 'Submitted' || a.status === 'AutoSubmitted');
                    actionButton = `<button class="btn btn-primary" onclick="viewResult(${test.exam_id || test.test_id}, ${latestAttempt.attempt_id})">Xem kết quả</button>`;
                } else if (status === 'upcoming') {
                    statusBadge = '<span style="background: #ffa502; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">⏰ Sắp diễn ra</span>';
                    actionButton = '<button class="btn" style="background: #ddd; color: #666; cursor: not-allowed;" disabled>Chưa mở</button>';
                } else if (status === 'active') {
                    statusBadge = '<span style="background: #26de81; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">🟢 Đang diễn ra</span>';
                    actionButton = `<button class="btn btn-success" onclick="startTest(${test.exam_id || test.test_id})">Làm bài</button>`;
                } else if (status === 'completed') {
                    statusBadge = '<span style="background: #95a5a6; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">⏰ Đã hết hạn</span>';
                    actionButton = '<button class="btn" style="background: #ddd; color: #666; cursor: not-allowed;" disabled>Đã kết thúc</button>';
                }

                return `
                    <div class="test-detail-item">
                        <div class="test-detail-header">
                            <div>
                                <div class="test-detail-title">${test.title || test.exam_name || 'Bài kiểm tra'}</div>
                                <div class="test-detail-meta">
                                    📅 ${test.start_time ? new Date(test.start_time).toLocaleString('vi-VN') : 'Chưa xác định'}
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                                ${statusBadge}
                                ${actionButton}
                            </div>
                        </div>
                        <div class="test-detail-stats">
                            <span>⏱️ ${test.duration || 'N/A'} phút</span>
                            <span>❓ ${test.total_questions || test.question_count || 0} câu hỏi</span>
                            <span>📊 ${test.total_marks || test.total_score || 0} điểm</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            testsList.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>Chưa có bài kiểm tra nào</p></div>';
        }

        const announcementsList = document.getElementById('announcementsList');
        if (data.announcements && data.announcements.length > 0) {
            announcementsList.innerHTML = data.announcements.map(ann => `
                <div class="announcement-item">
                    <div class="announcement-icon">📢</div>
                    <div class="announcement-content">
                        <div class="announcement-title">${ann.title || 'Thông báo'}</div>
                        <div class="announcement-text">${ann.content || 'Không có nội dung'}</div>
                        <div class="announcement-time">🕐 ${ann.created_at ? new Date(ann.created_at).toLocaleString('vi-VN') : ''}</div>
                    </div>
                </div>
            `).join('');
        } else {
            announcementsList.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><p>Chưa có thông báo nào từ giáo viên</p></div>';
        }

    } catch (error) {
        showToast('❌ Không thể tải thông tin lớp học!', 'error');
        document.getElementById('studentsList').innerHTML = '<div class="empty-state error"><p>❌ Lỗi tải dữ liệu</p></div>';
        document.getElementById('testsList').innerHTML = '<div class="empty-state error"><p>❌ Lỗi tải dữ liệu</p></div>';
        document.getElementById('announcementsList').innerHTML = '<div class="empty-state error"><p>❌ Lỗi tải dữ liệu</p></div>';
    }
}

        // Back to my classes
        function backToMyClasses() {
            showSection('my-classes');
            document.getElementById('pageTitle').textContent = 'Lớp của tôi';
        }

        // Switch tabs in class detail
        function switchClassTab(tabName) {
            document.querySelectorAll('.class-tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.class-tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(`classTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('active');
        }

       // ============================================
// 🚀 BẮT ĐẦU LÀM BÀI THI
// ============================================
async function loadAvailableTests() {
    const token = localStorage.getItem('token');
    const availableTestsList = document.getElementById('availableTestsList');
    
    if (!availableTestsList) return;
    
    availableTestsList.innerHTML = '<p style="text-align: center; color: #666;">⏳ Đang tải bài kiểm tra...</p>';

    try {
        const response = await fetch('http://127.0.0.1:3000/api/student/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách bài thi');
        }

        const exams = await response.json();

        // Lọc chỉ bài thi đang diễn ra hoặc sắp diễn ra
        const availableExams = exams.filter(exam => {
            const now = new Date();
            const startTime = new Date(exam.start_time);
            const endTime = new Date(startTime.getTime() + exam.duration * 60000);
            return now < endTime; // Chưa kết thúc
        });

        if (availableExams.length === 0) {
            availableTestsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">Không có bài kiểm tra khả dụng.</p>';
            return;
        }

        availableTestsList.innerHTML = availableExams.map(exam => {
            const now = new Date();
            const startTime = new Date(exam.start_time);
            const endTime = new Date(startTime.getTime() + exam.duration * 60000);
            
            let status, timeLeft, btnClass, btnText, btnDisabled, btnAction;
            
            if (now < startTime) {
                // Chưa bắt đầu
                const minutesLeft = Math.floor((startTime - now) / 60000);
                const hoursLeft = Math.floor(minutesLeft / 60);
                const minsLeft = minutesLeft % 60;
                timeLeft = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft}m`;
                status = 'Chưa bắt đầu';
                btnClass = 'btn';
                btnText = 'Chưa mở';
                btnDisabled = 'disabled';
                btnAction = '';
            } else if (now >= startTime && now < endTime) {
                // Đang diễn ra
                const minutesLeft = Math.floor((endTime - now) / 60000);
                timeLeft = `${minutesLeft}m còn lại`;
                status = 'Đang diễn ra';
                btnClass = 'btn btn-success';
                btnText = 'Làm bài';
                btnDisabled = '';
                btnAction = `onclick="startTest(${exam.exam_id})"`;
            } else {
                // Đã kết thúc (không hiển thị)
                return '';
            }

            return `
                <div class="test-item">
                    <div class="test-info">
                        <div class="test-title">${exam.exam_name || 'Bài kiểm tra'}</div>
                        <div class="test-meta">Lớp: ${exam.class_name || 'N/A'} • ${exam.duration} phút • ${exam.total_questions || 0} câu</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="countdown" style="color: ${now >= startTime ? '#48bb78' : '#ff4757'};">${timeLeft}</div>
                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">${status}</div>
                        <button class="${btnClass}" ${btnDisabled} ${btnAction}>${btnText}</button>
                    </div>
                </div>
            `;
        }).filter(html => html !== '').join('');

        if (availableTestsList.innerHTML === '') {
            availableTestsList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px 0;">Không có bài kiểm tra khả dụng.</p>';
        }

    } catch (error) {
        availableTestsList.innerHTML = '<p style="text-align: center; color: #ff4757;">Lỗi tải danh sách bài thi.</p>';
    }
}

async function loadTestHistory() {
    const token = localStorage.getItem('token');
    const testHistoryList = document.getElementById('testHistoryList');
    
    // ⭐ KIỂM TRA ELEMENT TỒN TẠI
    if (!testHistoryList) {
        return;
    }
    
    testHistoryList.innerHTML = '<p style="text-align: center; color: #666;">⏳ Đang tải lịch sử làm bài...</p>';

    try {
        const response = await fetch('http://127.0.0.1:3000/api/student/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Không thể tải danh sách bài thi');
        }

        const exams = await response.json();

        const attemptsPromises = exams
            .filter(exam => exam.my_attempts > 0)
            .map(async exam => {
                try {
                    const detailResponse = await fetch(`http://127.0.0.1:3000/api/student/exams/${exam.exam_id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (!detailResponse.ok) return null;
                    
                    const detail = await detailResponse.json();
                    return {
                        exam_name: exam.exam_name,
                        exam_id: exam.exam_id,
                        total_points: detail.exam.total_points || 100,
                        attempts: detail.attempts || []
                    };
                } catch (err) {
                    return null;
                }
            });

        const results = await Promise.all(attemptsPromises);
        const validResults = results.filter(r => r !== null && r.attempts.length > 0);

        if (validResults.length === 0) {
            testHistoryList.innerHTML = '<p style="text-align: center; color: #666;">Chưa có lịch sử làm bài.</p>';
            return;
        }

        testHistoryList.innerHTML = validResults.map(exam => `
            <div class="test-item" style="flex-direction: column; align-items: flex-start;">
                <div class="test-info" style="width: 100%; margin-bottom: 15px;">
                    <div class="test-title">${exam.exam_name}</div>
                    <div class="test-meta">Tổng lượt thi: ${exam.attempts.length}</div>
                </div>
                <div style="width: 100%;">
                    ${exam.attempts.map((attempt, index) => `
                        <div class="attempt-item" style="margin-bottom: 10px; padding: 15px; border: 2px solid #e1e8ed; border-radius: 8px; background: #f7fafc;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 5px;">Lượt thi #${index + 1}</div>
                                    <div style="font-size: 14px; color: #666;">
                                        <div>📅 Bắt đầu: ${new Date(attempt.start_time).toLocaleString('vi-VN')}</div>
                                        <div>🏁 Kết thúc: ${attempt.end_time ? new Date(attempt.end_time).toLocaleString('vi-VN') : 'Chưa kết thúc'}</div>
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    ${attempt.status === 'Submitted' && !attempt.is_fully_graded ? `
                                        <div style="font-size: 20px; font-weight: 600; color: #667eea; margin-bottom: 5px;">
                                            ✅ Đã hoàn thành
                                        </div>
                                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                            Đang chờ chấm điểm
                                        </div>
                                    ` : attempt.status === 'Submitted' && attempt.is_fully_graded ? `
                                        <div style="font-size: 20px; font-weight: 600; color: #48bb78; margin-bottom: 5px;">
                                            ✅ Đã chấm
                                        </div>
                                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                            Giáo viên đã chấm xong
                                        </div>
                                    ` : attempt.score !== null && attempt.score !== undefined ? `
                                        <div style="font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px;">
                                            ${(() => {
                                            const s = parseFloat(attempt.score || 0);
                                            const t = parseFloat(exam.total_points || 0);
                                            const scoreStr = s % 1 === 0 ? s.toString() : s.toFixed(1);
                                            const totalStr = t % 1 === 0 ? t.toString() : t.toFixed(1);
                                            return `${scoreStr}/${totalStr}`;
                                        })()}
                                        </div>
                                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                            ${attempt.status === 'Submitted' ? '✅ Đã nộp' : attempt.status === 'InProgress' ? '⏳ Đang làm' : '🤖 Tự động nộp'}
                                        </div>
                                    ` : `
                                        <div style="font-size: 24px; font-weight: bold; color: #667eea; margin-bottom: 5px;">
                                            --/--
                                        </div>
                                        <div style="font-size: 12px; color: #666; margin-bottom: 10px;">
                                            ${attempt.status === 'Submitted' ? '✅ Đã nộp' : attempt.status === 'InProgress' ? '⏳ Đang làm' : '🤖 Tự động nộp'}
                                        </div>
                                    `}
                                    ${attempt.status === 'Submitted' ? `
                                        <button class="btn btn-primary" onclick="viewResult(${exam.exam_id}, ${attempt.attempt_id})">Xem chi tiết</button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

    } catch (error) {
        testHistoryList.innerHTML = '<p style="text-align: center; color: #ff4757;">Lỗi tải lịch sử làm bài.</p>';
    }
}

// ============================================
// 🚀 BẮT ĐẦU LÀM BÀI THI - ĐÃ SỬA
// ============================================
// Lưu examId tạm thời để sử dụng khi submit code
let pendingExamId = null;

async function startTest(examId) {
    const token = localStorage.getItem('token');
    
    try {
        // Kiểm tra trước khi gọi API
        const examResponse = await fetch(`http://127.0.0.1:3000/api/student/exams`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const exams = await examResponse.json();
        const exam = exams.find(e => e.exam_id === examId);
        
        if (!exam) {
            showToast('❌ Không tìm thấy bài thi!', 'error');
            return;
        }

        // ⭐ KIỂM TRA ĐÃ LÀM BÀI CHƯA
        if (exam.my_attempts > 0) {
            // Kiểm tra xem có attempt nào đã nộp chưa
            const detailResponse = await fetch(`http://127.0.0.1:3000/api/student/exams/${examId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const detail = await detailResponse.json();
            
            const hasSubmitted = detail.attempts.some(a => 
                a.status === 'Submitted' || a.status === 'AutoSubmitted'
            );
            
            if (hasSubmitted) {
                showToast('❌ Bạn đã hoàn thành bài thi này!', 'error');
                showSection('test-history'); // Chuyển đến lịch sử làm bài
                return;
            }
        }

        if (!confirm('⚠️ Lưu ý:\n- Bạn cần bật webcam\n- Không được chuyển tab\n- Không được copy/paste\n- Chỉ được làm 1 lần\n\nBạn có sẵn sàng bắt đầu?')) {
            return;
        }
        
        // Lưu examId và hiển thị modal nhập code
        pendingExamId = examId;
        document.getElementById('examCodeInput').value = '';
        document.getElementById('examCodeError').style.display = 'none';
        document.getElementById('examCodeError').textContent = '';
        openModal('examCodeModal');
        
        // Focus vào input và enter để submit
        setTimeout(() => {
            document.getElementById('examCodeInput').focus();
        }, 100);
        
    } catch (error) {
        showToast(`❌ ${error.message}`, 'error');
    }
}

// Hàm submit mã code
async function submitExamCode() {
    const examCode = document.getElementById('examCodeInput').value.trim();
    const errorDiv = document.getElementById('examCodeError');
    
    // Validate
    if (!examCode || examCode.length !== 6 || !/^\d{6}$/.test(examCode)) {
        errorDiv.textContent = '⚠️ Mã code phải là 6 chữ số!';
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!pendingExamId) {
        showToast('❌ Lỗi: Không tìm thấy thông tin bài thi!', 'error');
        closeModal('examCodeModal');
        return;
    }
    
    const token = localStorage.getItem('token');
    errorDiv.style.display = 'none';
    
    try {
        showToast('🚀 Đang kiểm tra mã code...', 'info');
        
        const response = await fetch(`http://127.0.0.1:3000/api/student/exams/${pendingExamId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ exam_code: examCode })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Kiểm tra nếu cần mã code
            if (data.requires_code) {
                errorDiv.textContent = '❌ ' + data.error;
                errorDiv.style.display = 'block';
                return;
            }
            
            // ⭐ XỬ LÝ LỖI ĐÃ LÀM BÀI
            if (data.redirect === 'test-history') {
                closeModal('examCodeModal');
                showToast('❌ ' + data.error, 'error');
                setTimeout(() => {
                    showSection('test-history');
                }, 2000);
                return;
            }
            throw new Error(data.error || 'Không thể bắt đầu làm bài');
        }
        
        // Đóng modal và chuyển đến trang làm bài
        closeModal('examCodeModal');
        showToast('✅ Mã code đúng! Đang chuyển đến bài thi...', 'success');
        
        localStorage.setItem('current_exam', JSON.stringify({
            exam_id: pendingExamId,
            attempt_id: data.attempt_id,
            exam_name: data.exam.exam_name,
            duration: data.exam.duration,
            start_time: data.exam.start_time,
            questions: data.questions
        }));
        
        setTimeout(() => {
            window.location.href = `./student_exam.html?exam_id=${pendingExamId}&attempt_id=${data.attempt_id}`;
        }, 500);
        
        pendingExamId = null;
        
    } catch (error) {
        errorDiv.textContent = '❌ ' + error.message;
        errorDiv.style.display = 'block';
    }
}

// Cho phép nhấn Enter để submit (sẽ được gọi từ DOMContentLoaded)
function initExamCodeInput() {
    const examCodeInput = document.getElementById('examCodeInput');
    if (examCodeInput) {
        examCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitExamCode();
            }
        });
        
        // Chỉ cho phép nhập số
        examCodeInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length > 6) {
                this.value = this.value.substring(0, 6);
            }
        });
    }
}
// ============================================
// 👁️ XEM KẾT QUẢ CHI TIẾT - ĐÃ SỬA
// ============================================
async function viewResult(examId, attemptId) {
    const token = localStorage.getItem('token');
    
    // Xử lý trường hợp chỉ truyền 1 tham số (attemptId)
    if (attemptId === undefined && examId) {
        // Nếu examId là string có format "examId:attemptId"
        if (typeof examId === 'string' && examId.includes(':')) {
            const parts = examId.split(':');
            examId = parseInt(parts[0]);
            attemptId = parseInt(parts[1]);
        } else {
            // Chỉ có attemptId, cần tìm exam_id từ API
            showToast('📊 Đang tìm thông tin bài thi...', 'info');
            try {
                const examsResponse = await fetch('http://127.0.0.1:3000/api/student/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (examsResponse.ok) {
                    const examsData = await examsResponse.json();
                    // Tìm exam có attempt với attempt_id này
                    for (const exam of examsData.exams || []) {
                        const detailResponse = await fetch(`http://127.0.0.1:3000/api/student/exams/${exam.exam_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (detailResponse.ok) {
                            const detail = await detailResponse.json();
                            const attempt = (detail.attempts || []).find(a => a.attempt_id == examId);
                            if (attempt) {
                                examId = exam.exam_id;
                                attemptId = attempt.attempt_id;
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                // Error finding exam_id
            }
        }
    }
    
    if (!examId || !attemptId) {
        showToast('❌ Không tìm thấy thông tin bài thi. Vui lòng thử lại.', 'error');
        return;
    }
    
    showToast('📊 Đang tải kết quả...', 'info');
    
    try {
        const response = await fetch(`http://127.0.0.1:3000/api/student/exams/${examId}/result/${attemptId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText || 'Không thể tải kết quả' };
            }
            throw new Error(errorData.error || 'Không thể tải kết quả');
        }
        
        const data = await response.json();
        
        // ⭐ CHUYỂN HƯỚNG ĐẾN TRANG KẾT QUẢ
        window.location.href = `./student_result.html?exam_id=${examId}&attempt_id=${attemptId}`;
        
    } catch (error) {
        showToast(`❌ Lỗi tải kết quả: ${error.message}`, 'error');
    }
}

        // ============================================
        // ⚖️ KHIẾU NẠI ĐIỂM
        // ============================================
        
        // Load danh sách bài thi đã chấm điểm vào dropdown
        async function loadComplaintExams() {
            const token = localStorage.getItem('token');
            const complaintSubject = document.getElementById('complaintSubject');
            
            if (!complaintSubject) return;
            
            try {
                const response = await fetch('http://127.0.0.1:3000/api/student/exams', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Lỗi tải danh sách bài thi');
                
                const exams = await response.json();
                
                // Lấy chi tiết từng bài thi để kiểm tra đã chấm điểm chưa
                const examsWithScores = await Promise.all(
                    exams
                        .filter(exam => exam.my_attempts > 0)
                        .map(async exam => {
                            try {
                                const detailRes = await fetch(`http://127.0.0.1:3000/api/student/exams/${exam.exam_id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!detailRes.ok) return null;
                                
                                const detail = await detailRes.json();
                                // Chỉ lấy bài thi đã được chấm điểm (có score)
                                const gradedAttempts = (detail.attempts || []).filter(a => 
                                    a.status === 'Submitted' && 
                                    (a.score !== null && a.score !== undefined) &&
                                    a.is_fully_graded === 1
                                );
                                
                                if (gradedAttempts.length === 0) return null;
                                
                                const latestAttempt = gradedAttempts[0];
                                return {
                                    exam_id: exam.exam_id,
                                    exam_name: exam.exam_name,
                                    score: latestAttempt.score,
                                    total_points: detail.exam.total_points || exam.total_points || 100,
                                    attempt_id: latestAttempt.attempt_id
                                };
                            } catch {
                                return null;
                            }
                        })
                );
                
                const validExams = examsWithScores.filter(e => e !== null);
                
                complaintSubject.innerHTML = '<option value="">-- Chọn bài kiểm tra --</option>';
                
                if (validExams.length === 0) {
                    complaintSubject.innerHTML += '<option value="" disabled>Không có bài thi nào đã được chấm điểm</option>';
                    return;
                }
                
                validExams.forEach(exam => {
                    const option = document.createElement('option');
                    option.value = exam.exam_id;
                    // Kiểm tra score có phải số không
                    const score = parseFloat(exam.score) || 0;
                    const total = parseFloat(exam.total_points) || 100;
                    const scoreStr = score % 1 === 0 ? score.toString() : score.toFixed(1);
                    const totalStr = total % 1 === 0 ? total.toString() : total.toFixed(1);
                    option.textContent = `${exam.exam_name} (Điểm: ${scoreStr}/${totalStr})`;
                    complaintSubject.appendChild(option);
                });
            } catch (error) {
                console.error('Lỗi load complaint exams:', error);
                complaintSubject.innerHTML = '<option value="">❌ Lỗi tải danh sách bài thi</option>';
            }
        }
        
        // Load danh sách khiếu nại
        async function loadComplaints() {
            const token = localStorage.getItem('token');
            const recentComplaints = document.getElementById('recentComplaints');
            const complaintCount = document.getElementById('complaintCount');
            
            if (!recentComplaints) return;
            
            recentComplaints.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;"><p>⏳ Đang tải lịch sử khiếu nại...</p></div>';
            
            try {
                const response = await fetch('http://localhost:3000/api/complaints', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) throw new Error('Lỗi tải danh sách khiếu nại');
                
                const complaints = await response.json();
                
                // Cập nhật số lượng
                if (complaintCount) {
                    complaintCount.textContent = complaints.length || 0;
                }
                
                if (!Array.isArray(complaints) || complaints.length === 0) {
                    recentComplaints.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #718096;">
                            <div style="font-size: 48px; margin-bottom: 15px;">📝</div>
                            <p style="font-weight: 600; margin-bottom: 5px;">Chưa có khiếu nại nào</p>
                            <p style="font-size: 14px;">Bạn chưa gửi khiếu nại nào về điểm số</p>
                        </div>
                    `;
                    return;
                }
                
                recentComplaints.innerHTML = complaints.map(complaint => {
                    const statusColors = {
                        'Pending': { bg: '#fff5f5', color: '#c53030', text: '⏳ Đang chờ xử lý', icon: '⏳' },
                        'Approved': { bg: '#f0fff4', color: '#22543d', text: '✅ Đã chấp nhận', icon: '✅' },
                        'Rejected': { bg: '#fff5f5', color: '#c53030', text: '❌ Đã từ chối', icon: '❌' },
                        'Resolved': { bg: '#e6fffa', color: '#234e52', text: '✅ Đã giải quyết', icon: '✅' }
                    };
                    
                    const statusInfo = statusColors[complaint.status] || statusColors['Pending'];
                    const createdAt = new Date(complaint.created_at).toLocaleString('vi-VN');
                    const updatedAt = complaint.updated_at ? new Date(complaint.updated_at).toLocaleString('vi-VN') : null;
                    
                    return `
                        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; transition: all 0.3s ease;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 8px 0; color: #2d3748; font-size: 16px;">${complaint.exam_name || 'Bài thi'}</h4>
                                    <div style="font-size: 14px; color: #718096; margin-bottom: 10px;">
                                        📅 Gửi: ${createdAt}
                                        ${updatedAt ? `<br>🔄 Cập nhật: ${updatedAt}` : ''}
                                    </div>
                                </div>
                                <div style="background: ${statusInfo.bg}; color: ${statusInfo.color}; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; white-space: nowrap;">
                                    ${statusInfo.icon} ${statusInfo.text}
                                </div>
                            </div>
                            
                            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="font-size: 13px; color: #718096; margin-bottom: 5px; font-weight: 600;">📝 Lý do khiếu nại:</div>
                                <div style="color: #2d3748; line-height: 1.6; white-space: pre-wrap;">${complaint.content || 'Không có nội dung'}</div>
                            </div>
                            
                            ${complaint.teacher_response ? `
                                <div style="background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #38b2ac;">
                                    <div style="font-size: 13px; color: #234e52; margin-bottom: 5px; font-weight: 600;">💬 Phản hồi từ giáo viên:</div>
                                    <div style="color: #2d3748; line-height: 1.6; white-space: pre-wrap;">${complaint.teacher_response}</div>
                                </div>
                            ` : ''}
                            
                            ${(() => {
                                const score = parseFloat(complaint.exam_score) || 0;
                                const total = parseFloat(complaint.total_points) || 0;
                                if (score > 0 || total > 0) {
                                    const scoreStr = score % 1 === 0 ? score.toString() : score.toFixed(1);
                                    const totalStr = total % 1 === 0 ? total.toString() : total.toFixed(1);
                                    return `
                                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                            <div style="font-size: 14px; color: #718096;">
                                                Điểm bài thi: <strong style="color: #667eea; font-size: 16px;">${scoreStr}/${totalStr}</strong>
                                            </div>
                                        </div>
                                    `;
                                }
                                return '';
                            })()}
                        </div>
                    `;
                }).join('');
            } catch (error) {
                console.error('Lỗi load complaints:', error);
                recentComplaints.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #f56565;">
                        <div style="font-size: 48px; margin-bottom: 15px;">❌</div>
                        <p style="font-weight: 600; margin-bottom: 5px;">Lỗi tải lịch sử khiếu nại</p>
                        <p style="font-size: 14px;">${error.message}</p>
                    </div>
                `;
            }
        }
        
        // Submit complaint
        async function submitComplaint(event) {
            if (event) event.preventDefault();
            
            const token = localStorage.getItem('token');
            const examId = document.getElementById('complaintSubject').value;
            const reason = document.getElementById('complaintReason').value.trim();
            
            if (!examId) {
                showToast('❌ Vui lòng chọn bài kiểm tra!', 'error');
                return;
            }
            
            if (!reason) {
                showToast('❌ Vui lòng nhập lý do khiếu nại!', 'error');
                return;
            }
            
            if (reason.length < 10) {
                showToast('❌ Lý do khiếu nại phải có ít nhất 10 ký tự!', 'error');
                return;
            }
            
            const submitBtn = event?.target?.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ Đang gửi...';
            }
            
            try {
                const response = await fetch('http://localhost:3000/api/complaints', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        examId: parseInt(examId),
                        content: reason
                    })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Lỗi gửi khiếu nại');
                }
                
                showToast('✅ Gửi khiếu nại thành công! Giáo viên sẽ xem xét trong thời gian sớm nhất.', 'success');
                resetComplaintForm();
                loadComplaints(); // Reload danh sách
            } catch (error) {
                console.error('Lỗi submit complaint:', error);
                showToast(`❌ ${error.message}`, 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '📤 Gửi khiếu nại';
                }
            }
        }
        
        // Reset form khiếu nại
        function resetComplaintForm() {
            document.getElementById('complaintForm').reset();
            document.getElementById('complaintSubject').innerHTML = '<option value="">-- Chọn bài kiểm tra --</option>';
            loadComplaintExams(); // Reload danh sách bài thi
        }

        // Notifications
        async function loadNotifications() {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:3000/api/notifications', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error('Lỗi tải thông báo');
                }

                const notifications = await response.json();
                
                if (Array.isArray(notifications)) {
                    unreadNotificationCount = notifications.filter(n => n.is_read === 0 || n.is_read === false || !n.is_read).length;
                    updateNotificationBadge();
                    
                    // Render notifications vào modal
                    const notificationList = document.getElementById('notificationList');
                    if (notificationList) {
                        if (notifications.length === 0) {
                            notificationList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Không có thông báo nào.</p>';
                        } else {
                            notificationList.innerHTML = notifications.map(notif => {
                                const isRead = notif.is_read === 1 || notif.is_read === true;
                                const createdAt = notif.created_at ? new Date(notif.created_at).toLocaleString('vi-VN') : 'Không rõ thời gian';
                                return `
                                    <div class="info-item" style="padding: 15px; border-bottom: 1px solid #eee; ${!isRead ? 'background: #f0f9ff;' : ''}">
                                        <div style="flex: 1;">
                                            <div style="font-weight: ${isRead ? '400' : '600'}; margin-bottom: 5px;">
                                                ${notif.content || notif.title || 'Không có nội dung'}
                                            </div>
                                            <div style="color: #999; font-size: 12px;">
                                                ${createdAt}
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('');
                        }
                    }
                } else {
                    const notificationList = document.getElementById('notificationList');
                    if (notificationList) {
                        notificationList.innerHTML = '<p style="text-align: center; padding: 20px; color: #f56565;">Lỗi: Dữ liệu thông báo không hợp lệ.</p>';
                    }
                }
            } catch (error) {
                const notificationList = document.getElementById('notificationList');
                if (notificationList) {
                    notificationList.innerHTML = `<p style="text-align: center; padding: 20px; color: #f56565;">Lỗi tải thông báo: ${error.message}</p>`;
                }
            }
        }

        function updateNotificationBadge() {
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                if (unreadNotificationCount > 0) {
                    badge.style.position = 'relative';
                    if (!badge.querySelector('.badge-count')) {
                        const countEl = document.createElement('span');
                        countEl.className = 'badge-count';
                        countEl.style.cssText = `
                            position: absolute;
                            top: -5px;
                            right: -5px;
                            background: #ff4757;
                            color: white;
                            border-radius: 50%;
                            width: 20px;
                            height: 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            font-weight: bold;
                        `;
                        badge.appendChild(countEl);
                    }
                    badge.querySelector('.badge-count').textContent = unreadNotificationCount > 99 ? '99+' : unreadNotificationCount;
                } else {
                    const countEl = badge.querySelector('.badge-count');
                    if (countEl) {
                        countEl.remove();
                    }
                }
            }
        }

        function showNotifications() {
            loadNotifications(); // Load lại thông báo khi mở modal
            openModal('notificationModal');
        }

        async function markAllAsRead() {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:3000/api/notifications/mark-all-read', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    unreadNotificationCount = 0;
                    updateNotificationBadge();
                    showToast('✅ Đã đánh dấu tất cả thông báo là đã đọc', 'success');
                    loadNotifications(); // Reload để cập nhật UI
                }
            } catch (error) {
                // Error marking notifications as read
            }
        }

        // ============================================
// 📊 LOAD THỐNG KÊ
// ============================================
let scoreChart, distributionChart;

async function loadStatistics() {
    const token = localStorage.getItem('token');
    
    try {
        const [examsRes, classesRes] = await Promise.all([
            fetch('http://127.0.0.1:3000/api/student/exams', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('http://127.0.0.1:3000/api/student/classes/my', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const exams = await examsRes.json();
        const classes = await classesRes.json();

        const completedExams = exams.filter(e => e.my_attempts > 0);
        
        const allScores = [];
        const examLabels = [];
        const examScores = [];

        for (const exam of completedExams) {
            const detailRes = await fetch(`http://127.0.0.1:3000/api/student/exams/${exam.exam_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const detail = await detailRes.json();
            
            detail.attempts.forEach(a => {
                if (a.status === 'Submitted' && a.score !== null) {
                    allScores.push(parseFloat(a.score));
                    examLabels.push(exam.exam_name);
                    examScores.push(parseFloat(a.score));
                }
            });
        }

        const totalTests = allScores.length;
        const avgScore = allScores.length > 0 ? (allScores.reduce((sum, s) => sum + s, 0) / allScores.length).toFixed(1) : 0;
        const highestScore = allScores.length > 0 ? Math.max(...allScores).toFixed(1) : 0;

        document.getElementById('statTotalTests').textContent = totalTests;
        document.getElementById('statAvgScore').textContent = avgScore;
        document.getElementById('statHighestScore').textContent = highestScore;
        document.getElementById('statTotalClasses').textContent = classes.myClasses?.length || 0;

        // Thay thế div statisticsCharts bằng 2 biểu đồ
        document.getElementById('statisticsCharts').innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="margin-bottom: 15px; color: #667eea;">📈 Biểu đồ điểm số</h4>
                    <canvas id="scoreChart"></canvas>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h4 style="margin-bottom: 15px; color: #667eea;">🎯 Phân bố điểm</h4>
                    <canvas id="distributionChart"></canvas>
                </div>
            </div>
        `;

        // Biểu đồ điểm số
        if (scoreChart) scoreChart.destroy();
        const scoreCtx = document.getElementById('scoreChart').getContext('2d');
        scoreChart = new Chart(scoreCtx, {
            type: 'line',
            data: {
                labels: examLabels.map((label, i) => `Lần ${i + 1}`),
                datasets: [{
                    label: 'Điểm số',
                    data: examScores,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Biểu đồ phân bố
        const distribution = {
            '0-20': allScores.filter(s => s < 20).length,
            '20-40': allScores.filter(s => s >= 20 && s < 40).length,
            '40-60': allScores.filter(s => s >= 40 && s < 60).length,
            '60-80': allScores.filter(s => s >= 60 && s < 80).length,
            '80-100': allScores.filter(s => s >= 80).length
        };

        if (distributionChart) distributionChart.destroy();
        const distCtx = document.getElementById('distributionChart').getContext('2d');
        distributionChart = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    data: Object.values(distribution),
                    backgroundColor: ['#ff4757', '#ffa502', '#ffc048', '#48bb78', '#2ed573']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

    } catch (error) {
        // Error loading statistics
    }
}
        // Logout
        function logout() {
            if (confirm('🔒 Bạn có chắc muốn đăng xuất?')) {
                showToast('👋 Đăng xuất thành công!', 'success');
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                setTimeout(() => {
                    window.location.href = './login.html';
                }, 1500);
            }
        }

        // Toast notification
        function showToast(message, type = 'info') {
            const toast = document.createElement('div');
            const colors = {
                success: 'linear-gradient(45deg, #2ed573, #17c0eb)',
                error: 'linear-gradient(45deg, #ff4757, #ff6b7a)',
                warning: 'linear-gradient(45deg, #ff9f43, #ffc048)',
                info: 'linear-gradient(45deg, #4facfe, #00f2fe)'
            };

            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${colors[type] || colors.info};
                color: white;
                border-radius: 10px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 5px 20px rgba(0,0,0,0.3);
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            toast.textContent = message;

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.style.transform = 'translateX(0)';
            }, 100);

            setTimeout(() => {
                toast.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 4000);
        }

        // Click outside modal to close
        window.onclick = function (event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }