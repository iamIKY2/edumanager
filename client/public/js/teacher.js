// /client/public/js/teacher.js

// ==========================================
// CHỐNG BACK/FORWARD SAU LOGOUT
// ==========================================
// Khi user bấm nút back/forward, trình duyệt có thể load trang từ cache (bfcache)
// Đoạn code này sẽ detect và force kiểm tra authentication lại

window.addEventListener('pageshow', function(event) {
    // event.persisted = true khi trang được load từ bfcache (back-forward cache)
    // performance.navigation.type === 2 nghĩa là trang được load từ history (back/forward)
    const isBackForward = event.persisted || 
        (window.performance && 
         window.performance.getEntriesByType && 
         window.performance.getEntriesByType('navigation').length > 0 &&
         window.performance.getEntriesByType('navigation')[0].type === 'back_forward');
    
    if (isBackForward) {
        // Kiểm tra authentication lại
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role')?.toLowerCase();
        
        if (!token || role !== 'teacher') {
            // Không có token hoặc role không đúng -> redirect về login
            // Dùng replace() để không lưu vào history
            window.location.replace('./login.html');
        }
    }
});

// Ngăn trình duyệt cache trang khi back
if (window.history && window.history.pushState) {
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', function() {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role')?.toLowerCase();
        
        if (!token || role !== 'teacher') {
            window.location.replace('./login.html');
        } else {
            window.history.pushState(null, null, window.location.href);
        }
    });
}

// Console log - HIỂN THỊ TẤT CẢ ĐỂ DEBUG
const originalLog = console.log;
const originalWarn = console.warn;

// TẠM THỜI HIỂN THỊ TẤT CẢ LOG ĐỂ DEBUG
console.log = function(...args) {
    originalLog.apply(console, args);
};

console.warn = function(...args) {
    originalWarn.apply(console, args);
};

// API Base URL
const API_BASE_URL = window.location.origin.includes('localhost') 
    ? 'http://localhost:3000' 
    : window.location.origin;

// Data storage

let appData = {
    monthlyTrendChart: null,
    classes: [],
    students: [],
    exams: [],
    currentClassId: null,
    currentChart: null
};

let unreadCount = 0;
let examDetailContext = 'class';
let currentExam = null;
let currentExamId = null; // Lưu exam_id riêng để đảm bảo không bị mất
let examDetailDOMReady = false; // Flag đánh dấu DOM đã sẵn sàng
function formatScore(score) {
    if (!score || isNaN(score)) return '0';
    return parseFloat(score).toFixed(1);
}

// Đảm bảo overlay không chặn click khi trang load
document.addEventListener('DOMContentLoaded', function() {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.style.pointerEvents = 'none';
        overlay.classList.remove('active');
    }
});

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role')?.toLowerCase();

    if (!token || role !== 'teacher') {
        showNotification(' Vui lòng đăng nhập để truy cập dashboard!', 'error');
        setTimeout(() => window.location.href = './login.html', 1500);
        return;
    }

    const socket = io('http://localhost:3000', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Connected to Socket.io');
        socket.emit('join', `user_${localStorage.getItem('user_id')}`);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        showNotification('❌ Lỗi kết nối thời gian thực', 'error');
    });

    socket.on('notification', (notification) => {
        showNotification(notification.content, notification.type.toLowerCase());
        unreadCount++;
        updateNotificationBadge();
        fetchNotifications();
    });
    
    // ⭐ LẮNG NGHE SỰ KIỆN EXAM DELETED ĐỂ CẬP NHẬT UI
    socket.on('exam_deleted', (data) => {
        console.log('🔄 Exam deleted:', data);
        // Xóa khỏi appData
        if (appData.exams) {
            appData.exams = appData.exams.filter(e => e.exam_id !== data.exam_id);
        }
        // Reload UI
        renderExams();
        renderAllExams();
        renderDashboard();
        updateDashboardStats();
    });
    
    // ⭐ LẮNG NGHE SỰ KIỆN EXAM CREATED/UPDATED
    socket.on('exam_updated', (data) => {
        console.log('🔄 Exam updated:', data);
        renderExams();
        renderAllExams();
        renderDashboard();
    });

    try {
        const res = await fetch('http://localhost:3000/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể token không hợp lệ');
        }

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Lỗi tải thông tin giáo viên');
        }

        const data = await res.json();
        if (data && data.user) {
            document.getElementById('welcomeMessage').textContent =
                `👋 Chào mừng Thầy/Cô ${data.user.full_name || data.user.username}`;
            localStorage.setItem('user_id', data.user.user_id);
        }
    } catch (err) {
        console.error('Không thể tải thông tin giáo viên:', err);
        showNotification('❌ Lỗi tải thông tin giáo viên. Vui lòng đăng nhập lại.', 'error');
        setTimeout(() => window.location.href = './login.html', 1500);
    }

    await fetchClasses();
    await fetchNotifications();
    bindEvents();
    renderDashboard();
    initializeChart();
    updateStatsDropdown();
    
    // ⭐ TỰ ĐỘNG REFRESH DASHBOARD MỖI 30 GIÂY
    setInterval(() => {
        renderDashboard();
        if (appData.currentClassId) {
            renderExams();
        }
    }, 30000); // 30 giây
});

//
async function handleAddExam(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    console.log('🔵 Creating exam...');

    try {
        const response = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                examName: formData.get('examName'),
                examDate: formData.get('examDate'),
                examTime: formData.get('examTime'),  
                duration: formData.get('duration'),
                description: formData.get('description'),
                shuffle_questions: formData.get('shuffleQuestions') === '1' ? 1 : 0,
                shuffle_options: formData.get('shuffleOptions') === '1' ? 1 : 0
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tạo bài thi');
        }

        const result = await response.json();
        console.log('✅ Exam created:', result);
        
        // Lấy exam_id từ kết quả
        const newExamId = result.exam?.exam_id || result.exam_id;
        
        // Kiểm tra nếu có chọn đề thi để import
        const sourceExamId = formData.get('importExamId');
        if (sourceExamId && newExamId) {
            try {
                console.log('📥 Importing questions from exam', sourceExamId, 'to exam', newExamId);
                const importResponse = await fetch(`http://localhost:3000/api/teacher/exams/${newExamId}/copy-questions/${sourceExamId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (importResponse.ok) {
                    const importResult = await importResponse.json();
                    console.log('✅ Questions imported:', importResult);
                    showNotification(`✅ Tạo bài thi thành công! Đã import ${importResult.copied} câu hỏi.`, 'success');
                } else {
                    const errorData = await importResponse.json();
                    console.error('⚠️ Import failed:', errorData);
                    showNotification('✅ Tạo bài thi thành công! Nhưng import câu hỏi thất bại: ' + (errorData.error || 'Lỗi không xác định'), 'warning');
                }
            } catch (importError) {
                console.error('❌ Error importing questions:', importError);
                showNotification('✅ Tạo bài thi thành công! Nhưng có lỗi khi import câu hỏi.', 'warning');
            }
        } else {
            // Không có import, hiển thị thông báo bình thường
            const examCode = result.exam?.exam_code || result.exam_code;
            if (examCode) {
                showNotification('✅ Tạo bài thi thành công!', 'success');
                // Hiển thị modal mã code
                setTimeout(() => {
                    showExamCodeModal(examCode, result.exam?.title || result.exam?.exam_name || formData.get('examName'));
                }, 500);
            } else {
                showNotification('✅ Tạo bài thi thành công!', 'success');
            }
        }
        
        // Fetch lại exams từ server
        const examsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const classExams = await examsResponse.json();
        
        // Cập nhật appData
        if (!appData.exams) appData.exams = [];
        appData.exams = appData.exams.filter(e => e.class_id !== appData.currentClassId);
        appData.exams.push(...classExams);
        
        // Cập nhật UI
        document.getElementById('examCount').textContent = classExams.length;
        
        const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
        if (cls) cls.exams = classExams.length;
        
        renderExams();
        renderDashboard();
        hideAddExam();
        
        // ⭐ RELOAD DANH SÁCH BÀI THI Ở SECTION "Tạo bài thi" (nếu đang ở đó)
        const examsSection = document.getElementById('exams');
        if (examsSection && examsSection.classList.contains('active')) {
            // Đang ở section "Tạo bài thi", reload lại danh sách
            renderAllExams();
        }
        
        // Chuyển sang tab Bài thi (chỉ khi đang ở trong lớp học)
        const classDetail = document.getElementById('classDetail');
        if (classDetail && classDetail.style.display !== 'none') {
            // Đang ở trong chi tiết lớp học, chuyển sang tab Bài thi
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            const examsTab = document.querySelector('.tab[data-tab="exams"]');
            const examsTabContent = document.getElementById('exams-tab');
            if (examsTab) examsTab.classList.add('active');
            if (examsTabContent) examsTabContent.classList.add('active');
        }
        
        event.target.reset();
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Cập nhật renderExams để hiển thị GIỜ
async function renderExams() {
    const list = document.getElementById('examList');
    const classExams = appData.exams.filter(e => e.class_id === appData.currentClassId);
    
    console.log('🟢 renderExams - classExams:', classExams);
    
    if (classExams.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <div class="empty-state-text">Chưa có bài thi nào</div>
                <div class="empty-state-subtext">Thêm bài thi cho lớp học của bạn</div>
            </div>
        `;
        return;
    }

    list.innerHTML = classExams.map(exam => {
        const statusText = {
            'upcoming': 'Sắp diễn ra',
            'active': 'Đang diễn ra',
            'completed': 'Đã kết thúc'
        };
        
        return `
            <div class="exam-item">
                <div class="exam-header">
                    <div>
                        <div class="exam-title">${exam.title}</div>
                        <div class="exam-meta">
                            <span>📅 ${exam.exam_date}</span>
                            <span>⏱️ ${exam.duration} phút</span>
                            <span>👥 ${exam.submissions || 0} bài nộp</span>
                        </div>
                    </div>
                    <span class="exam-status status-${exam.status}">${statusText[exam.status]}</span>
                </div>
                <div class="exam-actions">
                    <button class="btn btn-small btn-primary" onclick="viewExamDetail(${exam.exam_id}, 'class')">Xem chi tiết</button>
                    <button class="btn btn-small btn-secondary" onclick="editExam(${exam.exam_id})">Chỉnh sửa</button>
                    <button class="btn btn-small btn-danger" onclick="deleteExam(${exam.exam_id}, event)">Xóa</button>
                </div>
            </div>
        `;
    }).join('');
}

function showNotifications() {
    // Kiểm tra nếu popup đã tồn tại thì đóng nó
    const existingPopup = document.querySelector('.notification-popup');
    if (existingPopup) {
        existingPopup.remove();
        return;
    }
    
    fetchNotifications();
    const notificationList = document.querySelector('#notifications .notification-list');
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>🔔 Thông báo nhận được</h3>
            <div class="notification-list">${notificationList.innerHTML}</div>
            <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Đóng</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Click outside to close - khi click ra ngoài popup-content thì đóng
    popup.addEventListener('click', function(e) {
        // Nếu click vào chính popup (vùng overlay) chứ không phải popup-content
        if (e.target === popup) {
            popup.remove();
        }
    });
    
    // Nhấn ESC để đóng
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

async function fetchClasses() {
    const token = localStorage.getItem('token');
    try {
       const response = await fetch('http://localhost:3000/api/teacher/classes', { 
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tải danh sách lớp');
        }

        appData.classes = await response.json();
        renderClassGrid();
        renderDashboard();
        updateStatsDropdown();
    } catch (error) {
        console.error('Lỗi trong fetchClasses:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Fetch notifications from API
async function fetchNotifications() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tải danh sách thông báo');
        }

        const notifications = await response.json();
        unreadCount = notifications.filter(n => !n.is_read).length;
        updateNotificationBadge();
        renderNotifications(notifications);
    } catch (error) {
        console.error('Lỗi trong fetchNotifications:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Update notification badge
function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    badge.style.position = 'relative';
    if (unreadCount > 0) {
        badge.innerHTML = `🔔 <span>${unreadCount}</span>`;
    } else {
        badge.innerHTML = '🔔';
    }
}

// Render notifications
function renderNotifications(notifications = []) {
    const notificationList = document.querySelector('#notifications .notification-list');
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📢</div>
                <div class="empty-state-text">Chưa có thông báo nào</div>
            </div>
        `;
        return;
    }

    notificationList.innerHTML = notifications.map(n => `
        <div class="notification-item${n.is_read ? '' : ' unread'}" onclick="markNotificationAsRead(${n.notification_id})">
            <div class="notification-header">
                <span class="notification-title">${n.content}</span>
                <span class="notification-time">${new Date(n.created_at).toLocaleString('vi-VN')}</span>
            </div>
            <div class="notification-content">
                ${n.related_type}: ${n.related_id}
            </div>
        </div>
    `).join('');
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi đánh dấu thông báo');
        }

        unreadCount = Math.max(0, unreadCount - 1);
        updateNotificationBadge();
        fetchNotifications();
    } catch (error) {
        console.error('Lỗi trong markNotificationAsRead:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Event bindings
function bindEvents() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    // Menu toggle button
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }
    
    // Overlay click - đóng sidebar
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeSidebar();
        });
    }
    
    // Menu items click
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            const section = this.dataset.section;
            
            // Đóng sidebar trên mobile trước khi navigate
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
            
            // Navigate sau một chút để sidebar đóng xong
            setTimeout(() => {
                navigateTo(section);
            }, 100);
        });
    });

    document.getElementById('searchClass').addEventListener('input', function(e) {
        filterClasses(e.target.value);
    });

    document.getElementById('filterClass').addEventListener('change', function(e) {
        filterClasses(document.getElementById('searchClass').value, e.target.value);
    });

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            // Kiểm tra nếu là tab trong exam detail thì dùng switchExamDetailTab
            if (tabName === 'exam-questions' || tabName === 'exam-students-status') {
                const tabNameForSwitch = tabName === 'exam-questions' ? 'questions' : 'students-status';
                switchExamDetailTab(tabNameForSwitch);
            } else {
                switchTab(tabName);
            }
        });
    });

    document.getElementById('searchStudent').addEventListener('input', function(e) {
        filterStudents(e.target.value);
    });

    // Đóng sidebar khi click bên ngoài (chỉ trên mobile)
    // Chỉ đóng khi click vào overlay, không đóng khi click vào các phần tử khác
    // Điều này tránh conflict với các click events khác
}

// Hàm đóng sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) {
        sidebar.classList.remove('open');
    }
    if (overlay) {
        overlay.classList.remove('active');
        // Đảm bảo overlay không chặn click sau khi đóng
        overlay.style.pointerEvents = 'none';
        overlay.style.display = 'none';
    }
}

// Navigation

function navigateTo(section) {
    
    // 1. Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.content-section').forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });
    const classList = document.getElementById('classList');
    const classDetail = document.getElementById('classDetail');
    const createClassForm = document.getElementById('createClassForm');
    const addStudentForm = document.getElementById('addStudentForm');
    const addExamForm = document.getElementById('addExamForm');
    
    if (classList) classList.style.display = 'none';
    if (classDetail) {
        classDetail.classList.remove('active');
        classDetail.style.display = 'none';
    }
    if (createClassForm) createClassForm.style.display = 'none';
    if (addStudentForm) addStudentForm.style.display = 'none';
    if (addExamForm) addExamForm.style.display = 'none';

    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.style.position = 'relative';
        targetSection.style.opacity = '1';
        targetSection.style.visibility = 'visible';
        targetSection.classList.add('active');
    } else {
        console.error('❌ Section not found:', section);
        return;
    }
    
    if (section === 'classes' && classList) {
        classList.style.display = 'block';
    }

    const titles = {
        'dashboard': 'Dashboard',
        'classes': 'Quản lý lớp học',
        'exams': 'Tạo bài thi',
        'grading': 'Chấm bài thi',
        'questions': 'Ngân hàng câu hỏi',
        'schedule': 'Lịch thi',
        'statistics': 'Thống kê',
        'notifications': 'Thông báo'
    };
    document.getElementById('pageTitle').textContent = titles[section] || section;

    if (section === 'exams') {
        console.log('🔵 Loading exams section...');
        setTimeout(() => {
            renderAllExams();
        }, 100);
    }

    if (section === 'notifications') {
        onNavigateToNotifications();
    }

    if (section === 'statistics') {
        loadStatistics();
    }    

    if (window.innerWidth <= 768) {
        closeSidebar();
    }
}
// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (window.innerWidth <= 768) {
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            closeSidebar();
        } else {
            sidebar.classList.add('open');
            if (overlay) {
                overlay.style.display = 'block';
                overlay.style.pointerEvents = 'auto';
                overlay.classList.add('active');
            }
        }
    } else {
        sidebar.classList.toggle('closed');
        mainContent.classList.toggle('expanded');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            overlay.style.pointerEvents = 'none';
        }
    }
}

async function renderDashboard() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/teacher/classes', {  
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) throw new Error('Lỗi tải dữ liệu dashboard');
        const classes = await response.json();
        
        // ⭐ CẬP NHẬT appData.classes VÀ ĐỒNG BỘ VỚI appData.exams
        appData.classes = classes;
        
        // ⭐ CẬP NHẬT SỐ LƯỢNG BÀI THI CHO MỖI LỚP DỰA TRÊN appData.exams
        if (appData.exams && appData.exams.length > 0) {
            classes.forEach(cls => {
                const examCount = appData.exams.filter(e => e.class_id === cls.class_id).length;
                cls.exams = examCount;
            });
        }
        
        const recentClasses = classes.slice(0, 2);
        const grid = document.getElementById('dashboardClasses');
        
        grid.innerHTML = recentClasses.map(cls => `
            <div class="class-card" onclick="viewClass(${cls.class_id})">
                <div class="class-card-header">
                    <div>
                        <div class="class-name">${cls.class_name}</div>
                        <div class="class-subject">${cls.subject_name} • Mã lớp: ${cls.class_code}</div>
                    </div>
                    <div style="font-size: 2rem;">${cls.icon}</div>
                </div>
                <div class="class-info">
                    <div class="class-info-item">
                        <div class="class-info-label">Học sinh</div>
                        <div class="class-info-value">${cls.students || 0}</div>
                    </div>
                    <div class="class-info-item">
                        <div class="class-info-label">Bài thi</div>
                        <div class="class-info-value">${cls.exams || 0}</div>
                    </div>
                    <div class="class-info-item">
                        <div class="class-info-label">Điểm TB</div>
                        <div class="class-info-value">${formatScore(cls.avg_score)}</div>
                    </div>
                </div>
            </div>
        `).join('');

        updateDashboardStats();
        loadRecentActivities(); // Load hoạt động gần đây
    } catch (error) {
        console.error('Lỗi trong renderDashboard:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Hàm load hoạt động gần đây
async function loadRecentActivities() {
    const token = localStorage.getItem('token');
    const activitiesList = document.getElementById('recentActivitiesList');
    
    if (!activitiesList) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/teacher/classes/recent-activities', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải hoạt động gần đây');
        }
        
        const activities = await response.json();
        
        if (activities.length === 0) {
            activitiesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <p>📭 Chưa có hoạt động nào gần đây</p>
                </div>
            `;
            return;
        }
        
        activitiesList.innerHTML = activities.map(activity => {
            const clickHandler = activity.exam_id 
                ? `onclick="viewExamDetail(${activity.exam_id})"` 
                : activity.class_id 
                    ? `onclick="viewClass(${activity.class_id})"` 
                    : '';
            
            return `
                <div class="notification-item" style="cursor: ${clickHandler ? 'pointer' : 'default'};" ${clickHandler}>
                    <div class="notification-header">
                        <span class="notification-title">${activity.icon} ${activity.title}</span>
                        <span class="notification-time">${activity.time}</span>
                    </div>
                    <div class="notification-content">${activity.content}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ Lỗi khi tải hoạt động gần đây:', error);
        activitiesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #f56565;">
                <p>❌ Không thể tải hoạt động gần đây</p>
                <button class="btn btn-primary" onclick="loadRecentActivities()" style="margin-top: 10px;">🔄 Thử lại</button>
            </div>
        `;
    }
}

function updateDashboardStats() {
    const classes = appData.classes || [];
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.students || 0), 0);
    const totalExams = classes.reduce((sum, cls) => sum + (cls.exams || 0), 0);
    const avgScore = classes.length > 0 
        ? formatScore(classes.reduce((sum, cls) => sum + (parseFloat(cls.avg_score) || 0), 0) / classes.length)
        : '0';

    document.getElementById('totalClasses').textContent = classes.length;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalExams').textContent = totalExams;
    document.getElementById('avgScore').textContent = avgScore;
}

// Class management
function renderClassGrid() {
    const grid = document.getElementById('classGrid');
    grid.innerHTML = appData.classes.map(cls => `
        <div class="class-card" onclick="viewClass(${cls.class_id})">
            <div class="class-card-header">
                <div>
                    <div class="class-name">${cls.class_name}</div>
                    <div class="class-subject">${cls.subject_name} • Mã lớp: ${cls.class_code}</div>
                </div>
                <div style="font-size: 2rem;">${cls.icon}</div>
            </div>
            <div class="class-info">
                <div class="class-info-item">
                    <div class="class-info-label">Học sinh</div>
                    <div class="class-info-value">${cls.students || 0}</div>
                </div>
                <div class="class-info-item">
                    <div class="class-info-label">Bài thi</div>
                    <div class="class-info-value">${cls.exams || 0}</div>
                </div>
                <div class="class-info-item">
                    <div class="class-info-label">Điểm TB</div>
                    <div class="class-info-value">${formatScore(cls.avg_score)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

function filterClasses(searchTerm, status = 'all') {
    let filtered = appData.classes;

    if (status !== 'all') {
        filtered = filtered.filter(cls => cls.status === status);
    }

    if (searchTerm) {
        filtered = filtered.filter(cls => 
            cls.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.subject_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    const grid = document.getElementById('classGrid');
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Không tìm thấy lớp học</div>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(cls => `
        <div class="class-card" onclick="viewClass(${cls.class_id})">
            <div class="class-card-header">
                <div>
                    <div class="class-name">${cls.class_name}</div>
                    <div class="class-subject">${cls.subject_name} • Mã lớp: ${cls.class_code}</div>
                </div>
                <div style="font-size: 2rem;">${cls.icon}</div>
            </div>
            <div class="class-info">
                <div class="class-info-item">
                    <div class="class-info-label">Học sinh</div>
                    <div class="class-info-value">${cls.students || 0}</div>
                </div>
                <div class="class-info-item">
                    <div class="class-info-label">Bài thi</div>
                    <div class="class-info-value">${cls.exams || 0}</div>
                </div>
                <div class="class-info-item">
                    <div class="class-info-label">Điểm TB</div>
                    <div class="class-info-value">${formatScore(cls.avg_score)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

async function viewClass(classId) {
    appData.currentClassId = classId;
    const cls = appData.classes.find(c => c.class_id === classId);
    
    if (!cls) return;

    document.getElementById('classList').style.display = 'none';
    document.getElementById('createClassForm').style.display = 'none';
    document.getElementById('editClassForm').style.display = 'none';
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('addExamForm').style.display = 'none';
    document.getElementById('classDetail').classList.add('active');
    
    document.getElementById('detailClassName').textContent = cls.class_name;
    document.getElementById('detailClassCode').textContent = cls.class_code;
    
    try {
        const token = localStorage.getItem('token');
        const studentsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/students`, {  
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!studentsResponse.ok) {
            throw new Error('Lỗi tải danh sách học sinh');
        }
        
        appData.students = await studentsResponse.json();
        document.getElementById('studentCount').textContent = appData.students.length;
console.log('🔵 Fetching exams for class:', classId);
        const examsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/exams`, {  
    headers: { 'Authorization': `Bearer ${token}` }
});

if (!examsResponse.ok) {
    throw new Error('Lỗi tải danh sách bài thi');
}

const classExams = await examsResponse.json();
console.log('✅ Exams loaded:', classExams);

// Cập nhật appData.exams
if (!appData.exams) appData.exams = [];
appData.exams = appData.exams.filter(e => e.class_id !== classId);
appData.exams.push(...classExams);

console.log('📊 Total exams in appData:', appData.exams.length);

// Cập nhật exam count
document.getElementById('examCount').textContent = classExams.length;

// Render các tab
renderStudents();
renderExams();
renderGrades();
        
    } catch (error) {
        console.error('❌ Error in viewClass:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

function backToClassList() {
    document.getElementById('classList').style.display = 'block';
    document.getElementById('classDetail').classList.remove('active');
    document.getElementById('createClassForm').style.display = 'none';
    document.getElementById('editClassForm').style.display = 'none';
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('addExamForm').style.display = 'none';
    appData.currentClassId = null;
}

function showCreateClass() {
    document.getElementById('classList').style.display = 'none';
    document.getElementById('classDetail').classList.remove('active');
    document.getElementById('editClassForm').style.display = 'none';
    document.getElementById('createClassForm').style.display = 'block';
}

function hideCreateClass() {
    document.getElementById('createClassForm').style.display = 'none';
    document.getElementById('classList').style.display = 'block';
}

async function handleCreateClass(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    try {
                const response = await fetch('http://localhost:3000/api/teacher/classes', {  

            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                className: formData.get('className'),
                subject: formData.get('subject'),
                description: formData.get('description'),
                academicYear: formData.get('academicYear'),
                icon: formData.get('icon')
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tạo lớp');
        }

        const { class: newClass } = await response.json();
        appData.classes.push({
            class_id: newClass.id,
            class_name: newClass.className,
            subject_name: newClass.subject,
            students: 0,
            exams: 0,
            avg_score: 0,
            class_code: newClass.classCode,
            icon: newClass.icon,
            status: newClass.status
        });

        renderClassGrid();
        renderDashboard();
        updateStatsDropdown();
        hideCreateClass();
        showNotification(`✅ Tạo lớp học thành công! Mã lớp: ${newClass.classCode}`);
    } catch (error) {
        console.error('Lỗi trong handleCreateClass:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

function editClass() {
    if (!appData.currentClassId) {
        showNotification('❌ Không tìm thấy lớp học', 'error');
        return;
    }

    const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
    if (!cls) {
        showNotification('❌ Không tìm thấy thông tin lớp học', 'error');
        return;
    }

    // Điền dữ liệu vào form
    document.getElementById('editClassName').value = cls.class_name || '';
    document.getElementById('editSubject').value = cls.subject_name || '';
    document.getElementById('editDescription').value = cls.description || '';
    document.getElementById('editAcademicYear').value = cls.academic_year || '2024-2025';
    document.getElementById('editIcon').value = cls.icon || '📚';

    // Hiển thị form chỉnh sửa
    document.getElementById('classDetail').classList.remove('active');
    document.getElementById('editClassForm').style.display = 'block';
}

function hideEditClass() {
    document.getElementById('editClassForm').style.display = 'none';
    document.getElementById('classDetail').classList.add('active');
}

async function handleEditClass(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');
    const classId = appData.currentClassId;

    if (!classId) {
        showNotification('❌ Không tìm thấy lớp học', 'error');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/teacher/classes/${classId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                className: formData.get('className'),
                subject: formData.get('subject'),
                description: formData.get('description'),
                academicYear: formData.get('academicYear'),
                icon: formData.get('icon')
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi cập nhật lớp');
        }

        const { class: updatedClass } = await response.json();
        
        // Cập nhật dữ liệu trong appData
        const classIndex = appData.classes.findIndex(c => c.class_id === classId);
        if (classIndex !== -1) {
            appData.classes[classIndex] = {
                ...appData.classes[classIndex],
                class_name: updatedClass.class_name,
                subject_name: updatedClass.subject_name,
                description: updatedClass.description,
                academic_year: updatedClass.academic_year,
                icon: updatedClass.icon
            };
        }

        // Cập nhật UI
        renderClassGrid();
        renderDashboard();
        updateStatsDropdown();
        
        // Cập nhật thông tin trong classDetail nếu đang hiển thị
        const classDetail = document.getElementById('classDetail');
        if (classDetail && classDetail.classList.contains('active')) {
            document.getElementById('detailClassName').textContent = updatedClass.class_name;
        }

        hideEditClass();
        showNotification(`✅ Cập nhật lớp học thành công!`);
    } catch (error) {
        console.error('Lỗi trong handleEditClass:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const tabElement = document.querySelector(`[data-tab="${tabName}"]`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    const contentElement = document.getElementById(tabName + '-tab');
    if (contentElement) {
        contentElement.classList.add('active');
    } else {
        console.warn(`Tab content not found: ${tabName}-tab`);
    }
}

function renderStudents() {
    const list = document.getElementById('studentList');
    
    if (appData.students.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">Chưa có học sinh nào</div>
                <div class="empty-state-subtext">Thêm học sinh vào lớp học của bạn</div>
            </div>
        `;
        return;
    }

    list.innerHTML = appData.students.map(student => `
        <div class="student-item">
            <div class="student-info">
                <div class="student-avatar">${student.full_name.charAt(0)}</div>
                <div class="student-details">
                    <h4>${student.full_name}</h4>
                    <p>MSSV: ${student.student_id} • ${student.email}</p>
                </div>
            </div>
            <div class="student-actions">
                <span style="font-weight: 600; color: #667eea; margin-right: 10px;">
                    Điểm TB: ${formatScore(student.avg_score)}
                </span>
                <button class="btn btn-small btn-danger" onclick="removeStudent(${student.user_id}, event)">Xóa</button>
            </div>
        </div>
    `).join('');
}

function filterStudents(searchTerm) {
    const filtered = appData.students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const list = document.getElementById('studentList');
    list.innerHTML = filtered.map(student => `
        <div class="student-item">
            <div class="student-info">
                <div class="student-avatar">${student.full_name.charAt(0)}</div>
                <div class="student-details">
                    <h4>${student.full_name}</h4>
                    <p>MSSV: ${student.student_id} • ${student.email}</p>
                </div>
            </div>
            <div class="student-actions">
                <span style="font-weight: 600; color: #667eea; margin-right: 10px;">Điểm TB: ${student.avg_score || 0}</span>
                <button class="btn btn-small btn-danger" onclick="removeStudent(${student.user_id}, event)">Xóa</button>
            </div>
        </div>
    `).join('');
}

function showAddStudent() {
    document.getElementById('classDetail').classList.remove('active');
    document.getElementById('addStudentForm').style.display = 'block';
}

function hideAddStudent() {
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('classDetail').classList.add('active');
}

async function showAddExam() {
    if (!appData.currentClassId) {
        showNotification('❗ Vui lòng chọn một lớp trước khi thêm bài thi', 'error');
        return;
    }

    const formWrapper = document.getElementById('addExamForm');
    if (!formWrapper) return;

    const form = formWrapper.querySelector('form');
    if (form) {
        form.reset();
        const timeInput = form.querySelector('input[type="time"]');
        if (timeInput && !timeInput.value) {
            timeInput.value = '08:00';
        }
    }

    // Load danh sách đề thi để import
    await loadExamsForImport();

    document.getElementById('classDetail').classList.remove('active');
    formWrapper.style.display = 'block';
}

// Hàm tải danh sách đề thi để import
async function loadExamsForImport() {
    const select = document.getElementById('importExamSelect');
    const infoDiv = document.getElementById('importExamInfo');
    const infoText = document.getElementById('importExamInfoText');
    
    if (!select) return;
    
    const token = localStorage.getItem('token');
    
    try {
        // Lấy tất cả bài thi của giáo viên
        const response = await fetch('http://localhost:3000/api/teacher/exams/all', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải danh sách đề thi');
        }
        
        const exams = await response.json();
        
        // Xóa các option cũ (trừ option đầu tiên)
        select.innerHTML = '<option value="">-- Chọn đề thi để import câu hỏi --</option>';
        
        // Thêm các đề thi vào select
        exams.forEach(exam => {
            const option = document.createElement('option');
            option.value = exam.exam_id;
            const examDate = exam.start_time ? new Date(exam.start_time).toLocaleDateString('vi-VN') : 'N/A';
            option.textContent = `${exam.title || exam.exam_name} (${examDate})`;
            select.appendChild(option);
        });
        
        // Thêm event listener để hiển thị thông tin đề thi được chọn
        select.onchange = async function() {
            const selectedExamId = this.value;
            if (selectedExamId) {
                // Lấy thông tin chi tiết đề thi
                try {
                    const detailResponse = await fetch(`http://localhost:3000/api/teacher/exams/${selectedExamId}/detail`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (detailResponse.ok) {
                        const examDetail = await detailResponse.json();
                        const questionCount = examDetail.total_questions || 0;
                        infoText.textContent = `Đề thi này có ${questionCount} câu hỏi. Tất cả câu hỏi sẽ được import vào bài thi mới.`;
                        infoDiv.style.display = 'block';
                    }
                } catch (err) {
                    console.error('Error loading exam details:', err);
                }
            } else {
                infoDiv.style.display = 'none';
            }
        };
        
    } catch (error) {
        console.error('Error loading exams for import:', error);
        // Không hiển thị lỗi để không làm gián đoạn quá trình tạo bài thi
    }
}

function hideAddExam() {
    const formWrapper = document.getElementById('addExamForm');
    if (formWrapper) {
        formWrapper.style.display = 'none';
    }
    
    // Reset import exam select
    const importSelect = document.getElementById('importExamSelect');
    const importInfo = document.getElementById('importExamInfo');
    if (importSelect) {
        importSelect.value = '';
    }
    if (importInfo) {
        importInfo.style.display = 'none';
    }
    
    document.getElementById('classDetail').classList.add('active');
}

async function handleAddStudent(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    try {
         const response = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/students`, {  
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentId: formData.get('studentId'),
                email: formData.get('email')
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi thêm học sinh');
        }

        const newStudent = await response.json();
        appData.students.push(newStudent);
        
        const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
        if (cls) cls.students = (cls.students || 0) + 1;
        
        renderStudents();
        renderDashboard();
        updateDashboardStats();
        hideAddStudent();
        showNotification('✅ Thêm học sinh thành công!');
        event.target.reset();
    } catch (error) {
        console.error('Lỗi trong handleAddStudent:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

async function removeStudent(id, event) {
    event.stopPropagation();
    if (!confirm('Bạn có chắc muốn xóa học sinh này khỏi lớp?')) return;

    const token = localStorage.getItem('token');
    try {
                const response = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/students/${id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi xóa học sinh');
        }

        appData.students = appData.students.filter(s => s.user_id !== id);
        const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
        if (cls && cls.students > 0) cls.students--;
        
        renderStudents();
        renderDashboard();
        updateDashboardStats();
        showNotification('✅ Đã xóa học sinh');
    } catch (error) {
        console.error('Lỗi trong removeStudent:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// ⭐ THAY THẾ HÀM renderAllExams() HOÀN TOÀN BẰNG CODE NÀY
async function renderAllExams() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('allExamsList');
    
    if (!container) {
        console.error('❌ [AllExams] #allExamsList element not found!');
        return;
    }
    
    // Show loading
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
            <div style="font-size: 1.1rem; font-weight: 500;">Đang tải danh sách bài thi...</div>
        </div>
    `;
    
    try {
        console.log('🔵 [AllExams] Fetching all exams...');
        
        const response = await fetch('http://localhost:3000/api/teacher/exams/all', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 [AllExams] Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tải danh sách bài thi');
        }
        
        const exams = await response.json();
        console.log('✅ [AllExams] Loaded', exams.length, 'exams');
        
        if (exams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-text">Chưa có bài thi nào</div>
                    <div class="empty-state-subtext">Tạo bài thi mới để bắt đầu</div>
                </div>
            `;
            return;
        }
        
        // Render exam list
        container.innerHTML = exams.map(exam => {
            const statusText = {
                'draft': '📝 Nháp',
                'upcoming': '⏰ Sắp diễn ra',
                'active': '✅ Đang diễn ra',
                'completed': '🏁 Đã kết thúc'
            }[exam.status] || exam.status;
            
            const statusClass = {
                'draft': 'status-draft',
                'upcoming': 'status-upcoming',
                'active': 'status-active',
                'completed': 'status-completed'
            }[exam.status] || '';
            
            return `
                <div class="exam-item" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: white; transition: all 0.3s;">
                    <div class="exam-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <div class="exam-title" style="font-size: 1.2rem; font-weight: 600; color: #2d3748; margin-bottom: 8px;">
                                ${exam.title || exam.exam_name}
                            </div>
                            <div class="exam-meta" style="display: flex; flex-wrap: wrap; gap: 15px; color: #718096; font-size: 0.9rem;">
                                <span>🏫 ${exam.class_name || 'Chưa có lớp'}</span>
                                <span>📅 ${new Date(exam.start_time).toLocaleDateString('vi-VN')}</span>
                                <span>⏱️ ${exam.duration} phút</span>
                                <span>📝 ${exam.submissions || 0} lượt thi</span>
                            </div>
                        </div>
                        <span class="exam-status ${statusClass}" style="padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            ${statusText}
                        </span>
                    </div>
                    <div class="exam-actions" style="display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="btn btn-primary btn-small" onclick="viewExamDetail(${exam.exam_id}, 'exams')" style="padding: 8px 16px;">
                            📋 Xem chi tiết
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="editExam(${exam.exam_id})" style="padding: 8px 16px;">
                            ✏️ Chỉnh sửa
                        </button>
                        <button class="btn btn-danger btn-small" onclick="deleteExam(${exam.exam_id}, event)" style="padding: 8px 16px;">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ [AllExams] Rendered successfully');
        
    } catch (error) {
        console.error('❌ [AllExams] Error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải danh sách bài thi</div>
                <div class="empty-state-subtext">${error.message}</div>
                <button class="btn btn-primary" onclick="renderAllExams()" style="margin-top: 15px;">
                    🔄 Thử lại
                </button>
            </div>
        `;
        showNotification('❌ ' + error.message, 'error');
    }
}

// render câu hỏi đã fix còn lỗi
function renderQuestionsList(container, questions, examId) {
    if (!container) return;
    
    container.innerHTML = '';
    
    if (questions && questions.length > 0) {
        questions.forEach((q, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question-item';
            questionDiv.style.cssText = 'border: 1px solid #e2e8f0; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: white;';
            
            questionDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <p style="font-weight: 600; color: #2d3748; margin-bottom: 8px;">
                            Câu ${q.question_order || index + 1} (${q.points} điểm): ${q.question_content}
                        </p>
                        <p style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">
                            <span style="background: #edf2f7; padding: 3px 8px; border-radius: 4px; margin-right: 5px;">
                                ${getQuestionTypeText(q.question_type)}
                            </span>
                            <span style="background: ${getDifficultyColor(q.difficulty)}; color: white; padding: 3px 8px; border-radius: 4px;">
                                ${q.difficulty}
                            </span>
                        </p>
                        
                        ${q.options && q.options.length > 0 ? `
                            <div style="margin: 10px 0;">
                                ${q.options.map((opt, i) => `
                                    <p style="color: ${opt.is_correct ? '#48bb78' : '#4a5568'}; margin: 5px 0; font-weight: ${opt.is_correct ? '600' : '400'};">
                                        ${String.fromCharCode(65 + i)}. ${opt.option_content} ${opt.is_correct ? '✅' : ''}
                                    </p>
                                `).join('')}
                            </div>
                        ` : `
                            <p style="color: #718096; font-style: italic;">Đáp án: ${q.correct_answer_text || 'Tự luận'}</p>
                        `}
                    </div>
                    
                    <button class="btn btn-small btn-danger" onclick="deleteQuestion(${examId}, ${q.question_id})" title="Xóa câu hỏi" style="margin-left: 10px;">
                        🗑️
                    </button>
                </div>
            `;
            container.appendChild(questionDiv);
        });
    } else {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">Chưa có câu hỏi nào</div>';
    }
}


// HELPER FUNCTIONS
function getQuestionTypeText(type) {
    const types = {
        'SingleChoice': '📝 Trắc nghiệm 1 đáp án',
        'MultipleChoice': '☑️ Trắc nghiệm nhiều đáp án',
        'FillInBlank': '✍️ Điền khẩu',
        'Essay': '📄 Tự luận'
    };
    return types[type] || type;
}

function getDifficultyColor(difficulty) {
    const colors = {
        'Easy': '#48bb78',
        'Medium': '#ed8936',
        'Hard': '#f56565'
    };
    return colors[difficulty] || '#718096';
}

function backToExamList() {
    console.log('🔵 [Back] Context:', examDetailContext);
    
    if (examDetailContext === 'class') {
        // Quay lại danh sách bài thi trong lớp
        const examDetail = document.getElementById('examDetail');
        const examListContainer = document.getElementById('examListContainer');
        
        if (examDetail) examDetail.style.display = 'none';
        if (examListContainer) examListContainer.style.display = 'block';
    } else {
        // Đóng modal (từ exams hoặc schedule)
        const modal = document.getElementById('examDetailModal');
        if (modal) modal.style.display = 'none';
    }
    
    // KHÔNG clear currentExamId để có thể dùng lại khi chuyển tab
    // currentExamId vẫn giữ nguyên
    currentExam = null;
    examDetailContext = 'class'; 
}

// Hàm chỉnh sửa bài thi (từ danh sách bài thi)
async function editExam(examId) {
    console.log('🔄 [editExam] Called with examId:', examId);
    
    if (!examId) {
        showNotification('❌ Không tìm thấy ID bài thi', 'error');
        return;
    }
    
    // Lưu examId
    currentExamId = examId;
    
    // Load dữ liệu bài thi đầy đủ
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/detail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải chi tiết bài thi');
        }
        
        const examData = await response.json();
        currentExam = examData;
        currentExamId = examData.exam_id;
        
        console.log('✅ Exam data loaded:', examData);
        
        // Hiển thị form chỉnh sửa
        await showEditExam();
        
    } catch (error) {
        console.error('❌ Error loading exam:', error);
        showNotification('❌ Lỗi tải dữ liệu bài thi: ' + error.message, 'error');
    }
}

// Hàm hiển thị form chỉnh sửa bài thi
async function showEditExam() {
    console.log('🔄 [showEditExam] Called');
    
    const examId = currentExamId || (currentExam && currentExam.exam_id);
    if (!examId) {
        showNotification('❌ Không tìm thấy ID bài thi', 'error');
        return;
    }
    
    // Load lại dữ liệu bài thi đầy đủ (bao gồm câu hỏi)
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/detail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải chi tiết bài thi');
        }
        
        const examData = await response.json();
        currentExam = examData;
        currentExamId = examData.exam_id;
        
        console.log('✅ Exam data loaded:', examData);
    } catch (error) {
        console.error('❌ Error loading exam:', error);
        showNotification('❌ Lỗi tải dữ liệu bài thi: ' + error.message, 'error');
        return;
    }
    
    if (!currentExam) {
        showNotification('❌ Không tìm thấy thông tin bài thi', 'error');
        return;
    }

    // Điền thông tin vào form
    const form = document.getElementById('editExamFormContent');
    if (!form) {
        console.error('❌ Không tìm thấy form editExamFormContent');
        showNotification('❌ Không tìm thấy form chỉnh sửa', 'error');
        return;
    }
    
    // Điền dữ liệu vào form
    const examIdInput = form.querySelector('[name="examId"]');
    const examNameInput = form.querySelector('[name="examName"]');
    const examDateInput = form.querySelector('[name="examDate"]');
    const examTimeInput = form.querySelector('[name="examTime"]');
    const durationInput = form.querySelector('[name="duration"]');
    const descriptionInput = form.querySelector('[name="description"]');
    const statusInput = form.querySelector('[name="status"]');
    
    if (examIdInput) examIdInput.value = currentExam.exam_id || currentExamId || '';
    if (examNameInput) examNameInput.value = currentExam.exam_name || currentExam.title || '';
    
    // Xử lý ngày và giờ
    if (currentExam.start_time) {
        const startTime = new Date(currentExam.start_time);
        if (examDateInput) {
            examDateInput.value = startTime.toISOString().split('T')[0];
        }
        if (examTimeInput) {
            const hours = String(startTime.getHours()).padStart(2, '0');
            const minutes = String(startTime.getMinutes()).padStart(2, '0');
            examTimeInput.value = `${hours}:${minutes}`;
        }
    }
    
    if (durationInput) durationInput.value = currentExam.duration || '';
    if (descriptionInput) descriptionInput.value = currentExam.description || '';
    if (statusInput) {
        statusInput.value = currentExam.status || currentExam.current_status || 'draft';
    }

    // Hiển thị danh sách câu hỏi
    const questionsContainer = document.getElementById('editExamQuestions');
    if (questionsContainer) {
        questionsContainer.innerHTML = '';
        if (currentExam.questions && currentExam.questions.length > 0) {
            currentExam.questions.forEach((q, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-item';
                questionDiv.style.cssText = 'background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e2e8f0;';
                questionDiv.innerHTML = `
                    <p style="margin-bottom: 10px;"><strong>Câu ${index + 1} (${q.points || 0} điểm):</strong> ${q.question_content || q.question_text || 'N/A'}</p>
                    <p style="margin-bottom: 5px; color: #718096; font-size: 0.9rem;"><strong>Loại:</strong> ${q.question_type || 'N/A'}</p>
                    <p style="margin-bottom: 5px; color: #718096; font-size: 0.9rem;"><strong>Độ khó:</strong> ${q.difficulty || 'N/A'}</p>
                    <p style="margin-bottom: 10px; color: #718096; font-size: 0.9rem;"><strong>Đáp án đúng:</strong> ${q.correct_answer_text || 'N/A'}</p>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary btn-small" onclick="showEditQuestionModal(${q.question_id})" style="padding: 6px 12px;">✏️ Sửa</button>
                        <button class="btn btn-danger btn-small" onclick="deleteQuestion(${currentExam.exam_id || currentExamId}, ${q.question_id})" style="padding: 6px 12px;">🗑️ Xóa</button>
                    </div>
                `;
                questionsContainer.appendChild(questionDiv);
            });
        } else {
            questionsContainer.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">📝 Chưa có câu hỏi nào trong bài thi.</p>';
        }
    }

    // Hiển thị form chỉnh sửa
    const examDetail = document.getElementById('examDetail');
    const examListContainer = document.getElementById('examListContainer');
    const editExamForm = document.getElementById('editExamForm');
    
    // Ẩn exam detail và exam list nếu có
    if (examDetail) {
        examDetail.style.display = 'none';
    }
    if (examListContainer) {
        examListContainer.style.display = 'none';
    }
    
    // Hiển thị form edit
    if (editExamForm) {
        editExamForm.style.display = 'block';
        editExamForm.style.visibility = 'visible';
        editExamForm.style.opacity = '1';
        console.log('✅ Edit form displayed');
    } else {
        console.error('❌ Không tìm thấy editExamForm');
        showNotification('❌ Không tìm thấy form chỉnh sửa', 'error');
    }
}

// Hàm ẩn form chỉnh sửa bài thi
function hideEditExam() {
    const examDetail = document.getElementById('examDetail');
    const examListContainer = document.getElementById('examListContainer');
    const editExamForm = document.getElementById('editExamForm');
    
    // Ẩn form edit
    if (editExamForm) {
        editExamForm.style.display = 'none';
        editExamForm.style.visibility = 'hidden';
    }
    
    // Hiển thị lại exam detail nếu đang ở trong class detail
    if (examDetail && examDetail.style.display !== 'none') {
        examDetail.style.display = 'block';
        examDetail.style.visibility = 'visible';
        examDetail.style.opacity = '1';
    } else if (examListContainer) {
        // Nếu không có exam detail, hiển thị lại danh sách bài thi
        examListContainer.style.display = 'block';
    } else {
        // Nếu không có cả 2, reload lại danh sách bài thi
        if (examDetailContext === 'class' && appData.currentClassId) {
            viewClassDetail(appData.currentClassId);
        } else {
            renderAllExams();
        }
    }
}

// Hàm xử lý lưu chỉnh sửa bài thi
async function handleEditExam(event) {
    event.preventDefault();
    console.log('🔄 [handleEditExam] Called');
    
    const form = event.target;
    const examIdInput = form.querySelector('[name="examId"]');
    const examNameInput = form.querySelector('[name="examName"]');
    const examDateInput = form.querySelector('[name="examDate"]');
    const examTimeInput = form.querySelector('[name="examTime"]');
    const durationInput = form.querySelector('[name="duration"]');
    const descriptionInput = form.querySelector('[name="description"]');
    const statusInput = form.querySelector('[name="status"]');
    
    if (!examIdInput || !examIdInput.value) {
        showNotification('❌ Không tìm thấy ID bài thi', 'error');
        return;
    }
    
    const examId = examIdInput.value;
    const examData = {
        examName: examNameInput ? examNameInput.value : '',
        examDate: examDateInput ? examDateInput.value : '',
        examTime: examTimeInput ? examTimeInput.value : '',
        duration: durationInput ? parseInt(durationInput.value) : 0,
        description: descriptionInput ? descriptionInput.value : '',
        status: statusInput ? statusInput.value : 'draft'
    };

    console.log('📤 Sending update request:', examData);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(examData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi cập nhật bài thi');
        }

        const result = await response.json();
        console.log('✅ Update successful:', result);
        
        showNotification('✅ Cập nhật bài thi thành công', 'success');
        
        // Ẩn form edit
        const editExamForm = document.getElementById('editExamForm');
        if (editExamForm) {
            editExamForm.style.display = 'none';
        }
        
        // Reload lại dữ liệu
        if (examDetailContext === 'class' && appData.currentClassId) {
            // Nếu đang ở trong class detail, reload lại class detail
            await viewClassDetail(appData.currentClassId);
        } else {
            // Nếu đang ở section exams, reload lại danh sách bài thi
            await renderAllExams();
        }
    } catch (err) {
        console.error('❌ Error updating exam:', err);
        showNotification('❌ Lỗi khi cập nhật bài thi: ' + err.message, 'error');
    }
}

// Hàm hiển thị modal chỉnh sửa câu hỏi
function showEditQuestionModal(questionId) {
    const question = currentExam.questions.find(q => q.question_id === questionId);
    if (!question) {
        showNotification('Không tìm thấy câu hỏi', 'error');
        return;
    }

    const form = document.getElementById('editQuestionForm');
    form.examId.value = currentExam.exam_id;
    form.questionId.value = questionId;
    form.questionContent.value = question.question_content;
    form.questionType.value = question.question_type;
    form.difficulty.value = question.difficulty;
    form.correctAnswerText.value = question.correct_answer_text;

    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';
    if (question.options && question.options.length > 0) {
        question.options.forEach((opt, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            optionDiv.innerHTML = `
                <input type="text" name="option${index}" value="${opt.option_content}" placeholder="Đáp án ${String.fromCharCode(65 + index)}" required>
                <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">Xóa</button>
            `;
            optionsList.appendChild(optionDiv);
        });
    }

    document.getElementById('editQuestionModal').style.display = 'flex';
}

// Hàm thêm đáp án mới trong modal chỉnh sửa câu hỏi
function addOption() {
    const optionsList = document.getElementById('optionsList');
    const index = optionsList.children.length;
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.innerHTML = `
        <input type="text" name="option${index}" placeholder="Đáp án ${String.fromCharCode(65 + index)}" required>
        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove()">Xóa</button>
    `;
    optionsList.appendChild(optionDiv);
}

// Hàm đóng modal chỉnh sửa câu hỏi
function closeEditQuestionModal() {
    document.getElementById('editQuestionModal').style.display = 'none';
}

// Hàm xử lý lưu chỉnh sửa câu hỏi
async function handleEditQuestion(event) {
    event.preventDefault();
    const form = event.target;
    const examId = form.examId.value;
    const questionId = form.questionId.value;
    const options = [];
    const inputs = form.querySelectorAll('input[name^="option"]');
    inputs.forEach(input => options.push({ content: input.value }));

    const questionData = {
        question_content: form.questionContent.value,
        question_type: form.questionType.value,
        difficulty: form.difficulty.value,
        correct_answer_text: form.correctAnswerText.value,
        options
    };

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/questions/${questionId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(questionData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi cập nhật câu hỏi');
        }

        showNotification('✅ Cập nhật câu hỏi thành công', 'success');
        closeEditQuestionModal();
        await viewExamDetail(examId); 
    } catch (err) {
        console.error('Error updating question:', err);
        showNotification('❌ Lỗi khi cập nhật câu hỏi: ' + err.message, 'error');
    }
}

// Hàm xóa câu hỏi
async function deleteQuestion(examId, questionId) {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi xóa câu hỏi');
        }

        showNotification('✅ Xóa câu hỏi thành công', 'success');
        await viewExamDetail(examId); 
    } catch (err) {
        console.error('Error deleting question:', err);
        showNotification('❌ Lỗi khi xóa câu hỏi: ' + err.message, 'error');
    }
}

async function deleteExam(examId, event) {
    event.stopPropagation();
    
    const token = localStorage.getItem('token');
    
    try {
        // Kiểm tra xem có dữ liệu gian lận không
        const checkResponse = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/check-cheating-data`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!checkResponse.ok) {
            throw new Error('Không thể kiểm tra dữ liệu gian lận');
        }

        const checkData = await checkResponse.json();
        const hasCheatingData = checkData.has_cheating_data;
        const cheatingCount = checkData.count || 0;

        // Nếu có dữ liệu gian lận, hiển thị modal cảnh báo
        if (hasCheatingData) {
            const confirmed = await showCheatingWarningModal(cheatingCount);
            if (!confirmed) {
                return; // User không xác nhận, không xóa
            }
        } else {
            // Nếu không có dữ liệu gian lận, chỉ cần confirm thông thường
            if (!confirm('Bạn có chắc muốn xóa bài thi này?')) {
                return;
            }
        }

        // Thực hiện xóa với confirmDelete = true nếu có dữ liệu gian lận
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}`, { 
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                confirmDelete: hasCheatingData
            })
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi xóa bài thi');
        }

        const result = await response.json();
        
        // ⭐ XÓA KHỎI appData
        appData.exams = appData.exams.filter(e => e.exam_id !== examId);
        
        // ⭐ RELOAD LẠI CLASSES TỪ SERVER ĐỂ CẬP NHẬT SỐ LƯỢNG BÀI THI CHÍNH XÁC
        try {
            const classesResponse = await fetch('http://localhost:3000/api/teacher/classes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (classesResponse.ok) {
                const classes = await classesResponse.json();
                appData.classes = classes;
                
                // Cập nhật số lượng bài thi cho class hiện tại
                const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
                if (cls) {
                    // Tìm lại số lượng bài thi từ server
                    const classExams = appData.exams.filter(e => e.class_id === appData.currentClassId);
                    cls.exams = classExams.length;
                }
            }
        } catch (err) {
            console.error('Lỗi reload classes:', err);
            // Fallback: giảm số lượng thủ công
            const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
            if (cls && cls.exams > 0) cls.exams--;
        }
        
        // ⭐ CẬP NHẬT UI
        renderExams();
        renderAllExams();
        renderDashboard(); // Hàm này sẽ reload classes và update stats
        updateDashboardStats();
        
        // ⭐ CẬP NHẬT SỐ LƯỢNG BÀI THI Ở CLASS DETAIL NẾU ĐANG MỞ
        const examCountEl = document.getElementById('examCount');
        if (examCountEl) {
            const classExams = appData.exams.filter(e => e.class_id === appData.currentClassId);
            examCountEl.textContent = classExams.length;
        }
        
        const message = hasCheatingData 
            ? `✅ Đã xóa bài thi thành công (đã xóa ${cheatingCount} bản ghi gian lận)`
            : '✅ Đã xóa bài thi thành công';
        showNotification(message);
    } catch (error) {
        console.error('Lỗi trong deleteExam:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Hiển thị modal cảnh báo khi có dữ liệu gian lận
function showCheatingWarningModal(cheatingCount) {
    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header" style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%);">
                    <h3>⚠️ Cảnh báo: Dữ liệu gian lận</h3>
                    <span class="close" onclick="closeCheatingWarningModal()" style="color: white;">&times;</span>
                </div>
                <div style="padding: 30px;">
                    <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                        <p style="margin: 0; color: #742a2a; font-size: 16px; line-height: 1.6;">
                            <strong>⚠️ Bài thi này đang có dữ liệu về gian lận của thí sinh!</strong>
                        </p>
                        <p style="margin: 10px 0 0 0; color: #742a2a; font-size: 14px;">
                            Số lượng bản ghi gian lận: <strong>${cheatingCount}</strong>
                        </p>
                    </div>
                    <p style="color: #2d3748; margin-bottom: 25px; line-height: 1.6;">
                        Nếu bạn xóa bài thi này, <strong>tất cả dữ liệu gian lận</strong> liên quan sẽ bị xóa vĩnh viễn và không thể khôi phục.
                    </p>
                    <p style="color: #718096; font-size: 14px; margin-bottom: 25px;">
                        Bạn có chắc chắn muốn tiếp tục xóa bài thi này không?
                    </p>
                    <div style="display: flex; gap: 15px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="closeCheatingWarningModal()" style="padding: 12px 24px;">
                            Hủy
                        </button>
                        <button class="btn btn-danger" onclick="confirmDeleteWithCheating()" style="padding: 12px 24px; background: #f56565;">
                            Xác nhận xóa
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.confirmDeleteWithCheating = () => {
            modal.remove();
            resolve(true);
        };
        
        window.closeCheatingWarningModal = () => {
            modal.remove();
            resolve(false);
        };
        
        // Đóng modal khi click ra ngoài
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                resolve(false);
            }
        });
    });
}


//  RENDER BẢNG ĐIỂM - HIỂN THỊ ĐIỂM TỪNG KỲ THI

async function renderGrades() {
    const container = document.getElementById('grades-tab');
    const token = localStorage.getItem('token');
    
    if (!container) {
        console.error('❌ [Grades] Container not found');
        return;
    }
    
    // Kiểm tra currentClassId trước khi gọi API
    if (!appData.currentClassId) {
        console.error('❌ [Grades] currentClassId is not set:', {
            currentClassId: appData.currentClassId,
            appData: appData
        });
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-text">Chưa chọn lớp học</div>
                <div class="empty-state-subtext">Vui lòng chọn một lớp học để xem bảng điểm</div>
            </div>
        `;
        return;
    }
    
    console.log('🔵 [Grades] Starting renderGrades with classId:', {
        currentClassId: appData.currentClassId,
        type: typeof appData.currentClassId,
        appData: appData
    });
    
    // Hiển thị loading
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 15px;">⏳</div>
            <div>Đang tải bảng điểm...</div>
        </div>
    `;
    
    try {
        // 1. Lấy danh sách học sinh
        const classId = appData.currentClassId;
        console.log('🔵 [Grades] Fetching students for classId:', classId, 'Type:', typeof classId);
        
        const studentsResponse = await fetch(
            `http://localhost:3000/api/teacher/classes/${classId}/students`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (!studentsResponse.ok) {
            const errorData = await studentsResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ [Grades] Students API error:', {
                status: studentsResponse.status,
                statusText: studentsResponse.statusText,
                error: errorData.error,
                classId: classId
            });
            throw new Error(errorData.error || 'Lỗi tải danh sách học sinh');
        }
        
        const students = await studentsResponse.json();
        console.log('✅ [Grades] Students loaded:', students.length);
        
        // 2. Lấy danh sách bài thi của lớp
        console.log('🔵 [Grades] Loading exams for class:', classId);
        
        const examsResponse = await fetch(
            `http://localhost:3000/api/teacher/classes/${classId}/exams`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (!examsResponse.ok) {
            const errorData = await examsResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('❌ [Grades] Exams API error:', {
                status: examsResponse.status,
                statusText: examsResponse.statusText,
                error: errorData.error,
                classId: classId
            });
            throw new Error(errorData.error || 'Lỗi tải danh sách bài thi');
        }
        
        const exams = await examsResponse.json();
        console.log('✅ [Grades] Exams loaded:', exams.length);
        
        // Check empty states
        if (students.length === 0) {
            container.innerHTML = `
                <h3 style="color: #2d3748; margin-bottom: 20px;">📊 Bảng điểm chi tiết</h3>
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">Chưa có học sinh nào</div>
                </div>
            `;
            return;
        }
        
        if (exams.length === 0) {
            container.innerHTML = `
                <h3 style="color: #2d3748; margin-bottom: 20px;">📊 Bảng điểm chi tiết</h3>
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-text">Chưa có bài thi nào</div>
                </div>
            `;
            return;
        }
        
        // 3. Lấy điểm từng bài thi cho từng học sinh
        console.log('🔵 [Grades] Loading grades for each student...');
        const gradesData = [];
        
        for (const student of students) {
            const studentGrades = {
                student_id: student.user_id,
                full_name: student.full_name,
                student_code: student.student_id,
                exams: {}
            };
            
            for (const exam of exams) {
                // Lấy điểm của học sinh trong bài thi này
                try {
                    const gradeResponse = await fetch(
                        `http://localhost:3000/api/teacher/exams/${exam.exam_id}/grades?student_id=${student.user_id}`,
                        { headers: { 'Authorization': `Bearer ${token}` } }
                    );
                    
                    if (gradeResponse.ok) {
                        const gradeData = await gradeResponse.json();
                        studentGrades.exams[exam.exam_id] = gradeData.score !== null 
                            ? parseFloat(gradeData.score).toFixed(1) 
                            : '-';
                    } else {
                        studentGrades.exams[exam.exam_id] = '-';
                    }
                } catch (err) {
                    console.warn(`⚠️ [Grades] Error loading grade for student ${student.user_id}, exam ${exam.exam_id}:`, err);
                    studentGrades.exams[exam.exam_id] = '-';
                }
            }
            
            gradesData.push(studentGrades);
        }
        
        console.log('✅ [Grades] Grades data loaded:', gradesData);
        
        // 4. Render bảng điểm
        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                <h3 style="color: #2d3748; margin: 0;">📊 Bảng điểm chi tiết</h3>
                <button class="btn btn-success" onclick="exportGradesToExcel()">
                    📥 Xuất Excel
                </button>
            </div>
            
            <div class="card" style="background: white; overflow-x: auto;">
                <table id="gradesTableDetail" style="width: 100%; border-collapse: collapse; min-width: 800px;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e2e8f0; background: #f7fafc;">
                            <th style="padding: 12px; text-align: left; position: sticky; left: 0; background: #f7fafc; z-index: 10;">
                                Học sinh
                            </th>
                            ${exams.map(exam => `
                                <th style="padding: 12px; text-align: center; min-width: 120px;">
                                    <div style="font-weight: 600; margin-bottom: 5px;">${exam.title || exam.exam_name}</div>
                                    <div style="font-size: 0.75rem; color: #718096; font-weight: 400;">
                                        ${new Date(exam.start_time).toLocaleDateString('vi-VN')}
                                    </div>
                                </th>
                            `).join('')}
                            <th style="padding: 12px; text-align: center; background: #edf2f7; font-weight: 700;">
                                Điểm TB
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gradesData.map(student => {
                            // Tính điểm TB
                            const scores = Object.values(student.exams).filter(s => s !== '-').map(s => parseFloat(s));
                            const avgScore = scores.length > 0 
                                ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1)
                                : '-';
                            
                            return `
                                <tr style="border-bottom: 1px solid #e2e8f0;">
                                    <td style="padding: 12px; position: sticky; left: 0; background: white; z-index: 5;">
                                        <div style="display: flex; align-items: center; gap: 10px;">
                                            <div class="student-avatar" style="width: 35px; height: 35px; font-size: 0.9rem;">
                                                ${student.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style="font-weight: 500;">${student.full_name}</div>
                                                <div style="font-size: 0.85rem; color: #718096;">
                                                    MSSV: ${student.student_code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    ${exams.map(exam => {
                                        const score = student.exams[exam.exam_id];
                                        const scoreNum = score !== '-' ? parseFloat(score) : null;
                                        const color = scoreNum === null ? '#cbd5e0' 
                                            : scoreNum >= 8 ? '#48bb78' 
                                            : scoreNum >= 6.5 ? '#4299e1' 
                                            : scoreNum >= 5 ? '#ffa502'
                                            : '#f56565';
                                        
                                        return `
                                            <td style="padding: 12px; text-align: center;">
                                                <span style="font-weight: 600; color: ${color}; font-size: 1.1rem;">
                                                    ${score}
                                                </span>
                                            </td>
                                        `;
                                    }).join('')}
                                    <td style="padding: 12px; text-align: center; background: #f7fafc;">
                                        <span style="font-weight: 700; font-size: 1.2rem; color: ${
                                            avgScore === '-' ? '#cbd5e0' 
                                            : parseFloat(avgScore) >= 8 ? '#48bb78' 
                                            : parseFloat(avgScore) >= 6.5 ? '#4299e1' 
                                            : '#f56565'
                                        };">
                                            ${avgScore}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #f7fafc; border-radius: 8px;">
                <h4 style="margin-bottom: 10px; color: #2d3748;">Chú thích:</h4>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.9rem;">
                    <span><span style="color: #48bb78; font-weight: 600;">●</span> Giỏi (≥ 8.0)</span>
                    <span><span style="color: #4299e1; font-weight: 600;">●</span> Khá (6.5 - 7.9)</span>
                    <span><span style="color: #ffa502; font-weight: 600;">●</span> TB (5.0 - 6.4)</span>
                    <span><span style="color: #f56565; font-weight: 600;">●</span> Yếu (< 5.0)</span>
                    <span><span style="color: #cbd5e0; font-weight: 600;">●</span> Chưa thi</span>
                </div>
            </div>
        `;
        
        console.log('✅ [Grades] Grades table rendered successfully');
        
    } catch (error) {
        console.error('❌ [Grades] Error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải bảng điểm</div>
                <div class="empty-state-subtext">${error.message}</div>
                <button class="btn btn-primary" onclick="renderGrades()" style="margin-top: 15px;">
                    🔄 Thử lại
                </button>
            </div>
        `;
    }
}

//  XUẤT BẢNG ĐIỂM RA EXCEL
function exportGradesToExcel() {
    const table = document.getElementById('gradesTableDetail');
    if (!table) {
        showNotification('❌ Không tìm thấy bảng điểm', 'error');
        return;
    }
    
    // Lấy tên lớp
    const className = document.getElementById('detailClassName').textContent;
    
    // Tạo CSV từ bảng
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowData = [];
        
        cols.forEach(col => {
            let text = col.textContent.trim();
            text = text.replace(/"/g, '""');
            rowData.push(`"${text}"`);
        });
        
        csv.push(rowData.join(','));
    });
    
    // Tạo BOM để Excel hiểu UTF-8
    const csvContent = '\ufeff' + csv.join('\n');
    
    // Tạo Blob và download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_diem_${className}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('✅ Đã xuất bảng điểm ra file CSV', 'success');
}

// Chart - Initialize with empty data, will be populated by loadStatistics()
function initializeChart() {
    const ctx = document.getElementById('statisticsChart');
    if (!ctx) return;
    
    if (appData.currentChart) {
        appData.currentChart.destroy();
    }
    
    appData.currentChart = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Giỏi (8-10)', 'Khá (6.5-8)', 'Trung bình (5-6.5)', 'Yếu (<5)'],
            datasets: [{
                label: 'Số lượng học sinh',
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(72, 187, 120, 0.8)',
                    'rgba(66, 153, 225, 0.8)',
                    'rgba(236, 201, 75, 0.8)',
                    'rgba(245, 101, 101, 0.8)'
                ],
                borderColor: [
                    'rgba(72, 187, 120, 1)',
                    'rgba(66, 153, 225, 1)',
                    'rgba(236, 201, 75, 1)',
                    'rgba(245, 101, 101, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function updateStatsDropdown() {
    const select = document.getElementById('statsClass');
    select.innerHTML = '<option value="all">Tất cả lớp</option>' + 
        appData.classes.map(cls => `<option value="${cls.class_id}">${cls.class_name}</option>`).join('');
}

// Load statistics from API
async function loadStatistics() {
    const token = localStorage.getItem('token');
    const classId = document.getElementById('statsClass')?.value || 'all';
    
    try {
        const url = classId === 'all' 
            ? 'http://localhost:3000/api/teacher/statistics'
            : `http://localhost:3000/api/teacher/statistics?classId=${classId}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải thống kê');
        }

        const stats = await response.json();
        
        // Store stats in appData for later use
        appData.currentStats = stats;
        
        // Update chart with real data
        updateChartWithData(stats);
        
        // Update statistics cards in HTML
        updateStatisticsCards(stats);
        
    } catch (err) {
        console.error('❌ Lỗi khi tải thống kê:', err);
        showNotification('❌ Không thể tải thống kê. Vui lòng thử lại.', 'error');
    }
}

function updateChartWithData(stats) {
    if (!appData.currentChart) {
        initializeChart();
    }
    
    const distribution = stats.class_stats?.distribution || stats.distribution;
    const chartType = document.getElementById('chartType')?.value || 'bar';
    
    // Update chart data
    const labels = ['Giỏi (8-10)', 'Khá (6.5-8)', 'Trung bình (5-6.5)', 'Yếu (<5)'];
    const data = [
        distribution['Giỏi (8-10)'] || 0,
        distribution['Khá (6.5-8)'] || 0,
        distribution['Trung bình (5-6.5)'] || 0,
        distribution['Yếu (<5)'] || 0
    ];
    
    // Destroy old chart if type changed
    if (appData.currentChart.config.type !== chartType) {
        appData.currentChart.destroy();
    }
    
    const ctx = document.getElementById('statisticsChart');
    if (!ctx) return;
    
    if (!appData.currentChart || appData.currentChart.config.type !== chartType) {
        appData.currentChart = new Chart(ctx.getContext('2d'), {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Số lượng học sinh',
                    data: data,
                    backgroundColor: [
                        'rgba(72, 187, 120, 0.8)',
                        'rgba(66, 153, 225, 0.8)',
                        'rgba(236, 201, 75, 0.8)',
                        'rgba(245, 101, 101, 0.8)'
                    ],
                    borderColor: [
                        'rgba(72, 187, 120, 1)',
                        'rgba(66, 153, 225, 1)',
                        'rgba(236, 201, 75, 1)',
                        'rgba(245, 101, 101, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: chartType === 'pie', position: 'bottom' }
                },
                scales: chartType !== 'pie' ? {
                    y: { beginAtZero: true }
                } : {}
            }
        });
    } else {
        // Update existing chart
        appData.currentChart.data.labels = labels;
        appData.currentChart.data.datasets[0].data = data;
        appData.currentChart.update();
    }
}

function updateStatisticsCards(stats) {
    // Update pass rate
    const passRateElement = document.getElementById('statPassRate');
    if (passRateElement && stats.pass_rate !== undefined) {
        passRateElement.textContent = `${stats.pass_rate}%`;
    }
    
    // Update average score
    const avgScoreElement = document.getElementById('statAvgScore');
    if (avgScoreElement && stats.avg_score !== undefined) {
        avgScoreElement.textContent = stats.avg_score;
    }
    
    // Update max score
    const maxScoreElement = document.getElementById('statMaxScore');
    if (maxScoreElement && stats.max_score !== undefined) {
        maxScoreElement.textContent = stats.max_score;
    }
    
    // Update min score
    const minScoreElement = document.getElementById('statMinScore');
    if (minScoreElement && stats.min_score !== undefined) {
        minScoreElement.textContent = stats.min_score;
    }
    
    // Update exam grading stats
    const gradedAttemptsElement = document.getElementById('statGradedAttempts');
    if (gradedAttemptsElement && stats.graded_attempts !== undefined) {
        gradedAttemptsElement.textContent = stats.graded_attempts;
    }
    
    const pendingAttemptsElement = document.getElementById('statPendingAttempts');
    if (pendingAttemptsElement && stats.pending_attempts !== undefined) {
        pendingAttemptsElement.textContent = stats.pending_attempts;
    }
    
    const totalAttemptsElement = document.getElementById('statTotalAttempts');
    if (totalAttemptsElement && stats.total_attempts !== undefined) {
        totalAttemptsElement.textContent = stats.total_attempts;
    }
    
    // Update question stats
    const totalQuestionsElement = document.getElementById('statTotalQuestions');
    if (totalQuestionsElement && stats.total_questions !== undefined) {
        totalQuestionsElement.textContent = stats.total_questions;
    }
    
    // Update exam status stats
    if (stats.exam_status) {
        const draftExamsElement = document.getElementById('statDraftExams');
        if (draftExamsElement) {
            draftExamsElement.textContent = stats.exam_status.draft || 0;
        }
        
        const upcomingExamsElement = document.getElementById('statUpcomingExams');
        if (upcomingExamsElement) {
            upcomingExamsElement.textContent = stats.exam_status.upcoming || 0;
        }
        
        const activeExamsElement = document.getElementById('statActiveExams');
        if (activeExamsElement) {
            activeExamsElement.textContent = stats.exam_status.active || 0;
        }
        
        const completedExamsElement = document.getElementById('statCompletedExams');
        if (completedExamsElement) {
            completedExamsElement.textContent = stats.exam_status.completed || 0;
        }
    }
    
    // Update student stats
    const studentsWithExamsElement = document.getElementById('statStudentsWithExams');
    if (studentsWithExamsElement && stats.students_with_exams !== undefined) {
        studentsWithExamsElement.textContent = stats.students_with_exams;
    }
    
    const studentsWithoutExamsElement = document.getElementById('statStudentsWithoutExams');
    if (studentsWithoutExamsElement && stats.students_without_exams !== undefined) {
        studentsWithoutExamsElement.textContent = stats.students_without_exams;
    }
    
    // Update top students
    renderTopStudents(stats.top_students || []);
    
    // Update subject stats
    renderSubjectStats(stats.subject_stats || []);
    
    // Update top exams
    renderTopExams(stats.top_exams || []);
    
    // Update monthly trend chart
    renderMonthlyTrendChart(stats.monthly_stats || []);
}

function renderTopStudents(students) {
    const container = document.getElementById('topStudentsList');
    if (!container) return;
    
    if (students.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = students.map((student, index) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ${index < 3 ? '#48bb78' : '#667eea'};">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${index < 3 ? '#48bb78' : '#667eea'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    ${index + 1}
                </div>
                <div>
                    <div style="font-weight: 600; color: #2d3748;">${student.full_name}</div>
                    <div style="font-size: 0.85rem; color: #718096;">${student.username} • ${student.exam_count} bài thi</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.5rem; font-weight: bold; color: #48bb78;">${student.avg_score}</div>
                <div style="font-size: 0.85rem; color: #718096;">Điểm TB</div>
            </div>
        </div>
    `).join('');
}

function renderSubjectStats(subjects) {
    const container = document.getElementById('subjectStatsList');
    if (!container) return;
    
    if (subjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = subjects.map(subject => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
            <div>
                <div style="font-weight: 600; color: #2d3748;">${subject.subject_name}</div>
                <div style="font-size: 0.85rem; color: #718096;">${subject.exam_count} bài thi • ${subject.attempt_count} lượt làm</div>
            </div>
            <div style="text-align: right; display: flex; gap: 20px;">
                <div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #2d3748;">${subject.avg_score}</div>
                    <div style="font-size: 0.85rem; color: #718096;">Điểm TB</div>
                </div>
                <div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #48bb78;">${subject.pass_rate}%</div>
                    <div style="font-size: 0.85rem; color: #718096;">Tỷ lệ đạt</div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderTopExams(exams) {
    const container = document.getElementById('topExamsList');
    if (!container) return;
    
    if (exams.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #718096;">Chưa có dữ liệu</p>';
        return;
    }
    
    container.innerHTML = exams.map(exam => `
        <div style="padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #9f7aea;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div>
                    <div style="font-weight: 600; color: #2d3748;">${exam.exam_name}</div>
                    <div style="font-size: 0.85rem; color: #718096;">${exam.class_name}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.2rem; font-weight: bold; color: #9f7aea;">${exam.attempt_count}</div>
                    <div style="font-size: 0.85rem; color: #718096;">Lượt làm</div>
                </div>
            </div>
            <div style="display: flex; gap: 20px; font-size: 0.9rem;">
                <div>
                    <span style="color: #718096;">Điểm TB:</span>
                    <span style="font-weight: 600; color: #2d3748; margin-left: 5px;">${exam.avg_score}</span>
                </div>
                <div>
                    <span style="color: #718096;">Cao nhất:</span>
                    <span style="font-weight: 600; color: #48bb78; margin-left: 5px;">${exam.max_score}</span>
                </div>
                <div>
                    <span style="color: #718096;">Thấp nhất:</span>
                    <span style="font-weight: 600; color: #f56565; margin-left: 5px;">${exam.min_score}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function renderMonthlyTrendChart(monthlyStats) {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;
    
    if (monthlyStats.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#718096';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Chưa có dữ liệu', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const labels = monthlyStats.map(m => {
        const [year, month] = m.month.split('-');
        const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        return `${monthNames[parseInt(month) - 1]}/${year}`;
    });
    const avgScores = monthlyStats.map(m => parseFloat(m.avg_score) || 0);
    const passRates = monthlyStats.map(m => parseFloat(m.pass_rate) || 0);
    
    // Destroy existing chart if any
    if (appData.monthlyTrendChart) {
        appData.monthlyTrendChart.destroy();
    }
    
    appData.monthlyTrendChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Điểm trung bình',
                    data: avgScores,
                    borderColor: 'rgba(72, 187, 120, 1)',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Tỷ lệ đạt (%)',
                    data: passRates,
                    borderColor: 'rgba(66, 153, 225, 1)',
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Điểm số'
                    }
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Tỷ lệ (%)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function updateStatistics() {
    loadStatistics();
}

async function updateChartType() {
    // Get current statistics data from appData or reload if needed
    const token = localStorage.getItem('token');
    const classId = document.getElementById('statsClass')?.value || 'all';
    
    try {
        const url = classId === 'all' 
            ? 'http://localhost:3000/api/teacher/statistics'
            : `http://localhost:3000/api/teacher/statistics?classId=${classId}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const stats = await response.json();
            updateChartWithData(stats);
        }
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật loại biểu đồ:', err);
    }
}

// ==================== NOTIFICATIONS SECTION ====================

// Biến lưu trữ dữ liệu
let allReceivedNotifications = [];
let allSentNotifications = [];
let allClassesForNotification = [];

// Chuyển đổi tab thông báo
function switchNotificationTab(tab) {
    // Ẩn tất cả tab
    document.querySelectorAll('.notification-tab-content').forEach(t => {
        t.style.display = 'none';
    });
    
    // Cập nhật active tab button
    document.querySelectorAll('[data-tab^="send"], [data-tab^="received"], [data-tab^="sent"]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Hiển thị tab được chọn
    if (tab === 'send') {
        document.getElementById('sendNotificationTab').style.display = 'block';
        document.querySelector('[data-tab="send-notification"]').classList.add('active');
        loadClassesForNotification();
    } else if (tab === 'received') {
        document.getElementById('receivedNotificationsTab').style.display = 'block';
        document.querySelector('[data-tab="received-notifications"]').classList.add('active');
        fetchNotifications();
    } else if (tab === 'sent') {
        document.getElementById('sentHistoryTab').style.display = 'block';
        document.querySelector('[data-tab="sent-history"]').classList.add('active');
        loadSentNotifications();
    }
}

// Load danh sách lớp cho form gửi thông báo
async function loadClassesForNotification() {
    const token = localStorage.getItem('token');
    const classSelect = document.getElementById('notificationClassSelect');
    
    if (!classSelect) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/teacher/classes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Lỗi tải danh sách lớp');
        
        const classes = await response.json();
        allClassesForNotification = classes;
        
        classSelect.innerHTML = '<option value="">-- Chọn lớp --</option>';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.class_id;
            option.textContent = `${cls.icon || '📚'} ${cls.class_name}`;
            classSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi load classes:', error);
        classSelect.innerHTML = '<option value="">❌ Lỗi tải danh sách lớp</option>';
    }
}

// Xử lý thay đổi đối tượng nhận
function handleRecipientChange() {
    const recipients = document.getElementById('notificationRecipients').value;
    const classSelectGroup = document.getElementById('classSelectGroup');
    const studentSelectGroup = document.getElementById('studentSelectGroup');
    
    if (recipients === 'class') {
        classSelectGroup.style.display = 'block';
        studentSelectGroup.style.display = 'none';
        loadClassesForNotification();
    } else if (recipients === 'student') {
        classSelectGroup.style.display = 'block';
        studentSelectGroup.style.display = 'block';
        loadClassesForNotification();
        // Load học sinh khi chọn lớp
        document.getElementById('notificationClassSelect').addEventListener('change', loadStudentsForNotification);
    } else {
        classSelectGroup.style.display = 'none';
        studentSelectGroup.style.display = 'none';
    }
}

// Load danh sách học sinh theo lớp
async function loadStudentsForNotification() {
    const classSelect = document.getElementById('notificationClassSelect');
    const studentSelect = document.getElementById('notificationStudentSelect');
    const token = localStorage.getItem('token');
    
    const selectedClasses = Array.from(classSelect.selectedOptions).map(opt => opt.value).filter(v => v);
    
    if (selectedClasses.length === 0) {
        studentSelect.innerHTML = '<option value="">-- Chọn lớp trước --</option>';
        return;
    }
    
    try {
        // Lấy học sinh từ tất cả lớp đã chọn
        let allStudents = [];
        for (const classId of selectedClasses) {
            const response = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const students = await response.json();
                allStudents = allStudents.concat(students);
            }
        }
        
        // Loại bỏ trùng lặp dựa trên user_id (vì student_id có thể là username)
        const uniqueStudents = Array.from(new Map(allStudents.map(s => [s.user_id, s])).values());
        
        studentSelect.innerHTML = '<option value="">-- Chọn học sinh --</option>';
        uniqueStudents.forEach(student => {
            const option = document.createElement('option');
            // Luôn dùng user_id, không dùng student_id (vì student_id có thể là username)
            option.value = student.user_id;
            option.textContent = `${student.full_name || student.username} (${student.username || student.email || ''})`;
            studentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi load students:', error);
        studentSelect.innerHTML = '<option value="">❌ Lỗi tải danh sách học sinh</option>';
    }
}

// Gửi thông báo
async function handleSendNotification(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const form = event.target;
    const sendBtn = document.getElementById('sendNotificationBtn');
    
    const title = document.getElementById('notificationTitle').value;
    const content = document.getElementById('notificationContent').value;
    const recipients = document.getElementById('notificationRecipients').value;
    const priority = document.getElementById('notificationPriority').value;
    const type = document.getElementById('notificationType').value;
    
    // Validate
    if (!title || !content || !recipients) {
        showNotification('❌ Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    
    let studentIds = [];
    
    if (recipients === 'all') {
        // Lấy tất cả học sinh từ tất cả lớp của giáo viên
        try {
            const classesResponse = await fetch('http://localhost:3000/api/teacher/classes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (classesResponse.ok) {
                const classes = await classesResponse.json();
                for (const cls of classes) {
                    const studentsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${cls.class_id}/students`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (studentsResponse.ok) {
                        const students = await studentsResponse.json();
                        // Luôn dùng user_id, không dùng student_id (vì student_id có thể là username)
                        studentIds = studentIds.concat(students.map(s => s.user_id).filter(id => id));
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi lấy danh sách học sinh:', error);
        }
    } else if (recipients === 'class') {
        const classSelect = document.getElementById('notificationClassSelect');
        const selectedClasses = Array.from(classSelect.selectedOptions).map(opt => opt.value).filter(v => v);
        
        if (selectedClasses.length === 0) {
            showNotification('❌ Vui lòng chọn ít nhất một lớp!', 'error');
            return;
        }
        
        // Lấy học sinh từ các lớp đã chọn
        for (const classId of selectedClasses) {
            try {
                const response = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/students`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const students = await response.json();
                    // Luôn dùng user_id, không dùng student_id (vì student_id có thể là username)
                    studentIds = studentIds.concat(students.map(s => s.user_id).filter(id => id));
                }
            } catch (error) {
                console.error(`Lỗi lấy học sinh lớp ${classId}:`, error);
            }
        }
    } else if (recipients === 'student') {
        const studentSelect = document.getElementById('notificationStudentSelect');
        studentIds = Array.from(studentSelect.selectedOptions).map(opt => opt.value).filter(v => v);
        
        if (studentIds.length === 0) {
            showNotification('❌ Vui lòng chọn ít nhất một học sinh!', 'error');
            return;
        }
        
        // Debug: Log studentIds để kiểm tra
        console.log('📋 Selected student IDs:', studentIds);
    }
    
    if (studentIds.length === 0) {
        showNotification('❌ Không tìm thấy học sinh nào để gửi thông báo!', 'error');
        return;
    }
    
    // Loại bỏ trùng lặp và filter các giá trị hợp lệ (user_id phải là số hoặc chuỗi số)
    studentIds = [...new Set(studentIds.filter(id => id && (typeof id === 'number' || /^\d+$/.test(String(id)))))];
    
    if (studentIds.length === 0) {
        showNotification('❌ Không có học sinh hợp lệ để gửi thông báo!', 'error');
        return;
    }
    
    console.log(`📤 Sending notification to ${studentIds.length} students:`, studentIds);
    
    // Disable button
    sendBtn.disabled = true;
    sendBtn.textContent = '⏳ Đang gửi...';
    
    try {
        // Gửi thông báo đến từng học sinh
        let successCount = 0;
        let failCount = 0;
        
        for (const studentId of studentIds) {
            try {
                const response = await fetch('http://localhost:3000/api/notifications/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipient_id: studentId,
                        title: title,
                        content: content,
                        type: type,
                        priority: priority
                    })
                });
                
                if (response.ok) {
                    successCount++;
                } else {
                    const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
                    console.error(`Lỗi gửi thông báo cho học sinh ${studentId}:`, errorData.error || errorData.message);
                    failCount++;
                }
            } catch (error) {
                console.error(`Lỗi gửi thông báo cho học sinh ${studentId}:`, error);
                failCount++;
            }
        }
        
        if (successCount > 0) {
            showNotification(`✅ Đã gửi thông báo thành công đến ${successCount} học sinh${failCount > 0 ? ` (${failCount} lỗi)` : ''}!`, 'success');
            form.reset();
            resetNotificationForm();
            loadSentNotifications(); // Refresh lịch sử
        } else {
            showNotification(`❌ Gửi thông báo thất bại!`, 'error');
        }
    } catch (error) {
        console.error('Lỗi gửi thông báo:', error);
        showNotification(`❌ Lỗi: ${error.message}`, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = '📤 Gửi thông báo';
    }
}

// Reset form thông báo
function resetNotificationForm() {
    document.getElementById('sendNotificationForm').reset();
    document.getElementById('classSelectGroup').style.display = 'none';
    document.getElementById('studentSelectGroup').style.display = 'none';
    document.getElementById('notificationClassSelect').innerHTML = '<option value="">-- Chọn lớp --</option>';
    document.getElementById('notificationStudentSelect').innerHTML = '<option value="">-- Chọn lớp trước --</option>';
}

// Xem trước thông báo
function previewNotification() {
    const title = document.getElementById('notificationTitle').value;
    const content = document.getElementById('notificationContent').value;
    const priority = document.getElementById('notificationPriority').value;
    const type = document.getElementById('notificationType').value;
    
    if (!title || !content) {
        showNotification('❌ Vui lòng nhập tiêu đề và nội dung để xem trước!', 'error');
        return;
    }
    
    const priorityLabels = {
        'normal': '🟢 Bình thường',
        'high': '🟡 Cao',
        'urgent': '🔴 Khẩn cấp'
    };
    
    const typeLabels = {
        'Info': 'ℹ️ Thông tin',
        'Warning': '⚠️ Cảnh báo',
        'Success': '✅ Thành công',
        'Error': '❌ Lỗi'
    };
    
    alert(`XEM TRƯỚC THÔNG BÁO\n\n` +
          `Tiêu đề: ${title}\n\n` +
          `Nội dung: ${content}\n\n` +
          `Mức độ: ${priorityLabels[priority] || priority}\n` +
          `Loại: ${typeLabels[type] || type}`);
}

// Cập nhật renderNotifications để hiển thị trong tab mới
function renderNotifications(notifications = []) {
    allReceivedNotifications = notifications;
    const notificationList = document.getElementById('receivedNotificationsList');
    
    if (!notificationList) {
        // Fallback cho phần cũ
        const oldList = document.querySelector('#notifications .notification-list');
        if (oldList) {
            renderNotificationsOld(notifications, oldList);
        }
        return;
    }
    
    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📢</div>
                <div class="empty-state-text">Chưa có thông báo nào</div>
            </div>
        `;
        return;
    }
    
    // Cập nhật số lượng chưa đọc
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const unreadCountElement = document.getElementById('unreadNotificationCount');
    if (unreadCountElement) {
        unreadCountElement.textContent = unreadCount;
    }
    
    notificationList.innerHTML = notifications.map(n => {
        const priorityClass = n.is_read ? '' : ' unread';
        const typeIcon = {
            'Info': 'ℹ️',
            'Warning': '⚠️',
            'Success': '✅',
            'Error': '❌'
        }[n.type] || '📢';
        
        return `
            <div class="notification-item${priorityClass}" onclick="markNotificationAsRead(${n.notification_id})">
                <div class="notification-header">
                    <span class="notification-title">${typeIcon} ${n.content}</span>
                    <span class="notification-time">${formatTimeAgo(n.created_at)}</span>
                </div>
                <div class="notification-content">
                    <span class="notification-type">${n.type || 'Info'}</span>
                    ${n.related_type && n.related_id ? ` • ${n.related_type}: ${n.related_id}` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    filterReceivedNotifications(); // Áp dụng filter hiện tại
}

// Render cho phần cũ (backward compatibility)
function renderNotificationsOld(notifications = [], container) {
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📢</div>
                <div class="empty-state-text">Chưa có thông báo nào</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(n => `
        <div class="notification-item${n.is_read ? '' : ' unread'}" onclick="markNotificationAsRead(${n.notification_id})">
            <div class="notification-header">
                <span class="notification-title">${n.content}</span>
                <span class="notification-time">${new Date(n.created_at).toLocaleString('vi-VN')}</span>
            </div>
            <div class="notification-content">
                ${n.related_type}: ${n.related_id}
            </div>
        </div>
    `).join('');
}

// Filter thông báo nhận được
function filterReceivedNotifications() {
    const searchTerm = document.getElementById('searchReceivedNotifications')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('filterNotificationType')?.value || 'all';
    const readFilter = document.getElementById('filterNotificationRead')?.value || 'all';
    
    const filtered = allReceivedNotifications.filter(n => {
        const matchSearch = !searchTerm || n.content.toLowerCase().includes(searchTerm);
        const matchType = typeFilter === 'all' || n.type === typeFilter;
        const matchRead = readFilter === 'all' || 
                         (readFilter === 'unread' && !n.is_read) ||
                         (readFilter === 'read' && n.is_read);
        
        return matchSearch && matchType && matchRead;
    });
    
    const notificationList = document.getElementById('receivedNotificationsList');
    if (!notificationList) return;
    
    if (filtered.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Không tìm thấy thông báo nào</div>
            </div>
        `;
        return;
    }
    
    notificationList.innerHTML = filtered.map(n => {
        const priorityClass = n.is_read ? '' : ' unread';
        const typeIcon = {
            'Info': 'ℹ️',
            'Warning': '⚠️',
            'Success': '✅',
            'Error': '❌'
        }[n.type] || '📢';
        
        return `
            <div class="notification-item${priorityClass}" onclick="markNotificationAsRead(${n.notification_id})">
                <div class="notification-header">
                    <span class="notification-title">${typeIcon} ${n.content}</span>
                    <span class="notification-time">${formatTimeAgo(n.created_at)}</span>
                </div>
                <div class="notification-content">
                    <span class="notification-type">${n.type || 'Info'}</span>
                    ${n.related_type && n.related_id ? ` • ${n.related_type}: ${n.related_id}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Đánh dấu tất cả thông báo đã đọc
async function markAllNotificationsAsRead() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('http://localhost:3000/api/notifications/mark-all-read', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            showNotification('✅ Đã đánh dấu tất cả thông báo đã đọc!', 'success');
            fetchNotifications();
        } else {
            throw new Error('Lỗi đánh dấu thông báo');
        }
    } catch (error) {
        console.error('Lỗi markAllNotificationsAsRead:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Load lịch sử thông báo đã gửi
async function loadSentNotifications() {
    const token = localStorage.getItem('token');
    const sentList = document.getElementById('sentNotificationsList');
    
    if (!sentList) return;
    
    sentList.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;"><p>⏳ Đang tải lịch sử...</p></div>';
    
    try {
        // Tạm thời lấy từ thông báo nhận được (vì chưa có API riêng)
        // TODO: Tạo API endpoint riêng cho lịch sử gửi thông báo
        const response = await fetch('http://localhost:3000/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Lỗi tải lịch sử');
        
        const notifications = await response.json();
        allSentNotifications = notifications; // Tạm thời dùng chung
        
        if (notifications.length === 0) {
            sentList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <div class="empty-state-text">Chưa có thông báo nào đã gửi</div>
                </div>
            `;
            return;
        }
        
        renderSentNotifications(notifications);
    } catch (error) {
        console.error('Lỗi loadSentNotifications:', error);
        sentList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải lịch sử: ${error.message}</div>
            </div>
        `;
    }
}

// Render lịch sử đã gửi
function renderSentNotifications(notifications) {
    const sentList = document.getElementById('sentNotificationsList');
    if (!sentList) return;
    
    sentList.innerHTML = notifications.map(n => {
        const typeIcon = {
            'Info': 'ℹ️',
            'Warning': '⚠️',
            'Success': '✅',
            'Error': '❌'
        }[n.type] || '📢';
        
        return `
            <div class="notification-item">
                <div class="notification-header">
                    <span class="notification-title">${typeIcon} ${n.content}</span>
                    <span class="notification-time">${formatTimeAgo(n.created_at)}</span>
                </div>
                <div class="notification-content">
                    <span class="notification-type">${n.type || 'Info'}</span>
                    ${n.related_type && n.related_id ? ` • ${n.related_type}: ${n.related_id}` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    filterSentNotifications();
}

// Filter thông báo đã gửi
function filterSentNotifications() {
    const searchTerm = document.getElementById('searchSentNotifications')?.value.toLowerCase() || '';
    const priorityFilter = document.getElementById('filterSentPriority')?.value || 'all';
    
    const filtered = allSentNotifications.filter(n => {
        const matchSearch = !searchTerm || n.content.toLowerCase().includes(searchTerm);
        // Tạm thời không có priority trong notification, sẽ cần cập nhật sau
        return matchSearch;
    });
    
    const sentList = document.getElementById('sentNotificationsList');
    if (!sentList) return;
    
    if (filtered.length === 0) {
        sentList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Không tìm thấy thông báo nào</div>
            </div>
        `;
        return;
    }
    
    sentList.innerHTML = filtered.map(n => {
        const typeIcon = {
            'Info': 'ℹ️',
            'Warning': '⚠️',
            'Success': '✅',
            'Error': '❌'
        }[n.type] || '📢';
        
        return `
            <div class="notification-item">
                <div class="notification-header">
                    <span class="notification-title">${typeIcon} ${n.content}</span>
                    <span class="notification-time">${formatTimeAgo(n.created_at)}</span>
                </div>
                <div class="notification-content">
                    <span class="notification-type">${n.type || 'Info'}</span>
                    ${n.related_type && n.related_id ? ` • ${n.related_type}: ${n.related_id}` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Format thời gian (ví dụ: "2 giờ trước")
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Hàm này sẽ được gọi từ navigateTo hiện có
function onNavigateToNotifications() {
    fetchNotifications();
    loadClassesForNotification();
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
// Hàm import câu hỏi từ Excel
async function importExamFromExcel(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    const token = localStorage.getItem('token');

    if (!file) {
        showNotification('❌ Vui lòng chọn file Excel hoặc CSV!', 'error');
        return;
    }

    // Kiểm tra context: import trong lớp học hay section Tạo bài thi
    const isClassContext = fileInput.id === 'importExcelClass';
    const resultContainer = isClassContext
        ? document.getElementById('importResultClass')
        : document.getElementById('importResultSection');
    const messageEl = isClassContext
        ? document.getElementById('importResultMessageClass')
        : document.getElementById('importResultMessageSection');
    const successCountEl = isClassContext
        ? document.getElementById('importSuccessCountClass')
        : document.getElementById('importSuccessCountSection');
    const errorCountEl = isClassContext
        ? document.getElementById('importErrorCountClass')
        : document.getElementById('importErrorCountSection');
    const errorsEl = isClassContext
        ? document.getElementById('importErrorsClass')
        : document.getElementById('importErrorsSection');

    // Hiển thị loading
    resultContainer.style.display = 'block';
    messageEl.textContent = 'Đang xử lý file...';
    successCountEl.textContent = '';
    errorCountEl.textContent = '';
    errorsEl.textContent = '';

    // Chọn examId (nếu trong lớp học, cần chọn bài thi)
    let examId;
    if (isClassContext) {
        // Lấy danh sách bài thi của lớp hiện tại
        const classExams = appData.exams.filter(e => e.class_id === appData.currentClassId);
        if (classExams.length === 0) {
            showNotification('❌ Chưa có bài thi nào trong lớp này!', 'error');
            resultContainer.style.display = 'none';
            fileInput.value = ''; // Reset input
            return;
        }

        // Hiển thị dropdown để chọn bài thi
        const selectExam = document.createElement('select');
        selectExam.id = 'selectExamForImport';
        selectExam.className = 'form-control';
        selectExam.style.marginBottom = '10px';
        selectExam.innerHTML = '<option value="">Chọn bài thi</option>' + 
            classExams.map(exam => `<option value="${exam.exam_id}">${exam.title || exam.exam_name}</option>`).join('');
        
        // Tạo container cho dropdown và button
        const selectContainer = document.createElement('div');
        selectContainer.id = 'selectExamContainer';
        selectContainer.innerHTML = `
            <h4 style="margin-bottom: 15px;">Chọn bài thi để import câu hỏi</h4>
            ${selectExam.outerHTML}
            <button class="btn btn-primary" onclick="proceedWithImportFromSelect('${fileInput.id}')" style="margin-top: 10px;">Xác nhận</button>
        `;
        
        // Giữ nguyên cấu trúc HTML gốc, chỉ thêm container chọn bài thi
        resultContainer.innerHTML = '';
        resultContainer.appendChild(selectContainer);
        resultContainer.style.display = 'block';
        
        // KHÔNG reset file input ở đây, để giữ file cho lần import
        return;
    } else {
        // Trong section Tạo bài thi: Tạo bài thi mới trước khi import
        try {
            const response = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    examName: `Bài thi từ Excel - ${new Date().toLocaleString('vi-VN')}`,
                    examDate: new Date().toISOString().split('T')[0],
                    examTime: '08:00',
                    duration: 60,
                    description: 'Bài thi được tạo từ file Excel',
                    shuffle_questions: 1, // Mặc định bật xáo trộn câu hỏi
                    shuffle_options: 1,    // Mặc định bật xáo trộn đáp án
                    status: 'draft'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi tạo bài thi');
            }

            const result = await response.json();
            examId = result.exam.exam_id;
            appData.exams.push(result.exam);
        } catch (error) {
            showNotification(`❌ ${error.message}`, 'error');
            resultContainer.style.display = 'none';
            fileInput.value = '';
            return;
        }
    }

    // Gọi hàm xử lý import
    proceedWithImport(null, fileInput.id, examId, file);
}

// Hàm xử lý import sau khi chọn examId từ dropdown
async function proceedWithImportFromSelect(inputId) {
    const selectExam = document.getElementById('selectExamForImport');
    if (!selectExam || !selectExam.value) {
        showNotification('❌ Vui lòng chọn bài thi!', 'error');
        return;
    }
    
    const fileInput = document.getElementById(inputId);
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        showNotification('❌ Vui lòng chọn lại file Excel!', 'error');
        return;
    }
    
    await proceedWithImport(null, inputId, selectExam.value, fileInput.files[0]);
}

// Hàm xử lý import sau khi chọn examId
async function proceedWithImport(buttonEl, inputId, examId, file) {
    const fileInput = document.getElementById(inputId);
    if (!file && (!fileInput || !fileInput.files || !fileInput.files[0])) {
        showNotification('❌ Vui lòng chọn lại file Excel!', 'error');
        return;
    }
    if (!examId) {
        examId = buttonEl ? buttonEl.previousElementSibling.value : '';
        if (!examId) {
            showNotification('❌ Vui lòng chọn bài thi!', 'error');
            return;
        }
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file || fileInput.files[0]);

    const isClassContext = inputId === 'importExcelClass';
    const resultContainer = isClassContext
        ? document.getElementById('importResultClass')
        : document.getElementById('importResultSection');
    const messageEl = isClassContext
        ? document.getElementById('importResultMessageClass')
        : document.getElementById('importResultMessageSection');
    const successCountEl = isClassContext
        ? document.getElementById('importSuccessCountClass')
        : document.getElementById('importSuccessCountSection');
    const errorCountEl = isClassContext
        ? document.getElementById('importErrorCountClass')
        : document.getElementById('importErrorCountSection');
    const errorsEl = isClassContext
        ? document.getElementById('importErrorsClass')
        : document.getElementById('importErrorsSection');

    try {
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/import-questions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi import câu hỏi');
        }

        const result = await response.json();
        console.log('✅ Import result:', result);

        // Khôi phục lại cấu trúc HTML gốc nếu đã bị thay thế
        if (isClassContext && !messageEl) {
            resultContainer.innerHTML = `
                <h4>Kết quả import câu hỏi</h4>
                <p id="importResultMessageClass"></p>
                <p id="importSuccessCountClass"></p>
                <p id="importErrorCountClass"></p>
                <p id="importErrorsClass" style="color: #f56565;"></p>
            `;
        }
        
        // Hiển thị kết quả
        resultContainer.style.display = 'block';
        const msgEl = isClassContext 
            ? document.getElementById('importResultMessageClass')
            : document.getElementById('importResultMessageSection');
        const successEl = isClassContext
            ? document.getElementById('importSuccessCountClass')
            : document.getElementById('importSuccessCountSection');
        const errorEl = isClassContext
            ? document.getElementById('importErrorCountClass')
            : document.getElementById('importErrorCountSection');
        const errorsEl = isClassContext
            ? document.getElementById('importErrorsClass')
            : document.getElementById('importErrorsSection');
        
        if (msgEl) msgEl.textContent = 'Import hoàn tất!';
        const importedCount = result.imported || result.copied || result.successCount || result.verified || 0;
        if (successEl) {
            if (importedCount > 0) {
                successEl.textContent = `Số câu hỏi import thành công: ${importedCount}`;
                successEl.style.color = '#48bb78';
            } else {
                successEl.textContent = '⚠️ Không có câu hỏi nào được import. Vui lòng kiểm tra file Excel và thử lại.';
                successEl.style.color = '#f56565';
            }
        }
        if (errorEl) errorEl.textContent = `Số lỗi: ${result.errors?.length || result.errorCount || 0}`;
        if (errorsEl) {
            errorsEl.innerHTML = result.errors && result.errors.length > 0
                ? result.errors.map(err => `<div>${err}</div>`).join('')
                : 'Không có lỗi';
        }
        
        console.log('📊 Import result summary:', {
            imported: importedCount,
            total: result.total,
            errors: result.errors?.length || 0,
            verified: result.verified
        });

        // Cập nhật danh sách bài thi
        if (isClassContext) {
            await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).then(classExams => {
                appData.exams = appData.exams.filter(e => e.class_id !== appData.currentClassId);
                appData.exams.push(...classExams);
                renderExams();
            });
            
            // ⭐ LUÔN RELOAD CHI TIẾT BÀI THI NẾU ĐANG XEM (KHÔNG CẦN KIỂM TRA ĐIỀU KIỆN PHỨC TẠP)
            const examDetail = document.getElementById('examDetail');
            const examIdNum = parseInt(examId);
            
            console.log('🔍 Checking exam detail state:', {
                examDetailExists: !!examDetail,
                examDetailDisplay: examDetail?.style.display,
                currentExamId: currentExam?.exam_id,
                targetExamId: examIdNum
            });
            
            // Nếu đang xem chi tiết bài thi, luôn reload
            if (examDetail && examDetail.style.display !== 'none') {
                console.log('🔄 Reloading exam detail after import (examId:', examIdNum, ')...');
                // Reload lại chi tiết bài thi để hiển thị câu hỏi mới
                setTimeout(async () => {
                    try {
                        await viewExamDetail(examIdNum, 'class');
                        console.log('✅ Exam detail reloaded successfully');
                    } catch (err) {
                        console.error('❌ Error reloading exam detail:', err);
                    }
                }, 500);
            } else {
                console.log('ℹ️ Exam detail not visible, skipping reload');
            }
        } else {
            await renderAllExams();
            
            // ⭐ LUÔN RELOAD CHI TIẾT BÀI THI TRONG MODAL NẾU ĐANG XEM
            const examDetailModal = document.getElementById('examDetailModal');
            const examIdNum = parseInt(examId);
            
            if (examDetailModal && examDetailModal.style.display === 'flex') {
                const isViewingThisExam = currentExam && (
                    parseInt(currentExam.exam_id) === examIdNum || 
                    currentExam.exam_id == examId ||
                    currentExam.exam_id === examId
                );
                
                if (isViewingThisExam) {
                    console.log('🔄 Reloading exam detail modal after import...');
                    setTimeout(async () => {
                        await viewExamDetail(examIdNum, 'exams');
                    }, 500);
                }
            }
        }

        showNotification('✅ Import câu hỏi thành công!', 'success');
        fileInput.value = ''; // Reset input
    } catch (error) {
        console.error('❌ Error in import:', error);
        showNotification(`❌ ${error.message}`, 'error');
        resultContainer.style.display = 'block';
        messageEl.textContent = 'Lỗi khi import câu hỏi';
        successCountEl.textContent = '';
        errorCountEl.textContent = '';
        errorsEl.textContent = error.message;
        fileInput.value = '';
    }
}

// ==================== ANTI-CHEATING FUNCTIONS ====================

let cheatingData = {
    logs: [],
    filteredLogs: [],
    currentStudentDetail: null
};

// Load danh sách bài thi
async function loadExamsForCheating() {
    const token = localStorage.getItem('token');
    const select = document.getElementById('filterExamCheating');
    
    try {
        console.log('🔵 [Cheating] Loading exams...');
        
        const response = await fetch('http://localhost:3000/api/teacher/exams/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 [Cheating] Response status:', response.status);
        
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ [Cheating] Error response:', text);
            throw new Error('Lỗi tải danh sách bài thi');
        }
        
        const exams = await response.json();
        console.log('✅ [Cheating] Loaded exams:', exams.length);
        
        if (select) {
            select.innerHTML = '<option value="all">Tất cả bài thi</option>' + 
                exams.map(e => `<option value="${e.exam_id}">${e.title || e.exam_name}</option>`).join('');
        }
    } catch (error) {
        console.error('❌ [Cheating] Error:', error);
        showNotification('❌ Lỗi tải danh sách bài thi', 'error');
    }
}

// Load logs gian lận
async function loadCheatingLogs() {
    const token = localStorage.getItem('token');
    const list = document.getElementById('cheatingLogsList');
    
    // Show loading
    if (list) {
        list.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 4rem; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
                    <div style="font-size: 1.1rem; font-weight: 500;">Đang tải dữ liệu giám sát...</div>
                    <div style="font-size: 0.9rem; color: #a0aec0; margin-top: 8px;">Vui lòng chờ trong giây lát</div>
                </td>
            </tr>
        `;
    }
    
    try {
        const examSelect = document.getElementById('filterExamCheating');
        const eventTypeSelect = document.getElementById('filterEventType');
        
        const examId = examSelect ? examSelect.value : 'all';
        const eventType = eventTypeSelect ? eventTypeSelect.value : 'all';
        
        console.log('🔵 [Cheating] Loading logs... examId:', examId, 'eventType:', eventType);
        
        // ✅ Build URL (explicit backend host to avoid same-origin HTML response)
       let url = 'http://localhost:3000/api/teacher/cheating/cheating-logs';
        const params = new URLSearchParams();
        if (examId !== 'all') params.append('exam_id', examId);
        if (eventType !== 'all') params.append('event_type', eventType);
        
        if (params.toString()) url += '?' + params.toString();
        
        console.log('📡 [Cheating] Fetching:', url);
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📡 [Cheating] Response status:', response.status);
        console.log('📡 [Cheating] Response headers:', [...response.headers.entries()]);
        
        // ✅ Check content type
        const contentType = response.headers.get('content-type');
        console.log('📄 [Cheating] Content-Type:', contentType);
        
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ [Cheating] Not JSON response:', text.substring(0, 200));
            throw new Error('Server trả về HTML thay vì JSON. Kiểm tra route /api/teacher/cheating');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const logs = await response.json();
        console.log('✅ [Cheating] Loaded logs:', logs.length);
        
        cheatingData.logs = logs;
        cheatingData.filteredLogs = logs;
        
        renderCheatingStats();
        renderCheatingLogs();
        
    } catch (error) {
        console.error('❌ [Cheating] Error:', error);
        
        if (list) {
            list.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #718096;">
                        <div style="font-size: 2rem; margin-bottom: 10px;">❌</div>
                        <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 10px;">Lỗi tải dữ liệu</div>
                        <div style="font-size: 0.9rem; color: #f56565; margin-bottom: 20px;">
                            ${error.message}
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="loadCheatingLogs()">
                                🔄 Thử lại
                            </button>
                            <button class="btn btn-secondary" onclick="console.log('Debug info:', {url: 'http://localhost:3000/api/teacher/cheating', token: localStorage.getItem('token')})">
                                🔍 Debug
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        showNotification('❌ ' + error.message, 'error');
    }
}

// Render stats
function renderCheatingStats() {
    const logs = cheatingData.logs;
    console.log('🔵 [Stats] Rendering stats for logs:', logs.length);
    
    const totalEl = document.getElementById('totalCheatingEvents');
    const tabEl = document.getElementById('totalTabSwitches');
    const copyEl = document.getElementById('totalCopyPaste');
    const suspiciousEl = document.getElementById('suspiciousStudents');
    
    if (totalEl) totalEl.textContent = logs.length;
    if (tabEl) tabEl.textContent = logs.filter(l => l.event_type === 'TabSwitch').length;
    if (copyEl) copyEl.textContent = logs.filter(l => l.event_type === 'CopyPaste').length;
    if (suspiciousEl) suspiciousEl.textContent = new Set(logs.map(l => l.student_id)).size;
    
    console.log('✅ [Stats] Stats updated');
}

// Render logs list
function renderCheatingLogs() {
    const list = document.getElementById('cheatingLogsList');
    if (!list) {
        console.error('❌ [Render] cheatingLogsList element not found');
        return;
    }

    const logs = cheatingData.filteredLogs;
    console.log('🔵 [Render] Rendering logs:', logs.length);

    if (logs.length === 0) {
        list.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #718096;">
                    <div style="font-size: 2rem; margin-bottom: 10px;">✅</div>
                    Không có vi phạm nào
                    <div style="font-size: 0.9rem; color: #a0aec0; margin-top: 5px;">
                        Hệ thống giám sát hoạt động tốt
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Group by student + exam
    const grouped = {};
    logs.forEach(log => {
        const key = `${log.student_id}_${log.exam_id}`;
        if (!grouped[key]) {
            grouped[key] = {
                student_id: log.student_id,
                student_name: log.student_name,
                exam_id: log.exam_id,
                exam_name: log.exam_name,
                attempt_id: log.attempt_id,
                violations: []
            };
        }
        grouped[key].violations.push(log);
    });

    list.innerHTML = Object.values(grouped).map(item => {
        const vCount = item.violations.length;
        const riskLevel = vCount >= 5 ? 'high' : vCount >= 3 ? 'medium' : 'low';
        const riskColor = { 'high': '#f56565', 'medium': '#ffa502', 'low': '#48bb78' }[riskLevel];
        const riskText = { 'high': 'Nguy hiểm', 'medium': 'Cảnh báo', 'low': 'Thấp' }[riskLevel];

        const types = {
            TabSwitch: { icon: '🚫', count: 0 },
            CopyPaste: { icon: '📋', count: 0 },
            WebcamSuspicious: { icon: '📷', count: 0 },
            DevTools: { icon: '🔧', count: 0 }
        };

        item.violations.forEach(v => {
            if (types[v.event_type]) types[v.event_type].count++;
        });

        return `
            <tr onclick="viewStudentCheatingDetail(${item.student_id}, ${item.exam_id}, ${item.attempt_id})">
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="student-avatar-small" style="background: ${riskColor};">
                            ${item.student_name.charAt(0)}
                        </div>
                        <div>
                            <div style="font-weight: 500; color: #2d3748;">${item.student_name}</div>
                            <div style="font-size: 0.85rem; color: #718096;">MSSV: ${item.student_id}</div>
                        </div>
                    </div>
                </td>
                <td style="color: #2d3748;">${item.exam_name}</td>
                <td style="text-align: center; color: #2d3748;">
                    ${Object.entries(types).filter(([_, v]) => v.count > 0).map(([k, v]) => `${v.icon} ${v.count}`).join(', ')}
                </td>
                <td style="text-align: center;">
                    <span class="risk-badge risk-${riskLevel}">
                        ${riskText}
                    </span>
                </td>
                <td style="text-align: right;">
                    <button class="btn btn-small btn-primary" style="padding: 6px 12px; font-size: 0.85rem;"
                            onclick="event.stopPropagation(); viewStudentCheatingDetail(${item.student_id}, ${item.exam_id}, ${item.attempt_id})">
                        Xem chi tiết
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter function
function filterCheatingLogs() {
    const searchInput = document.getElementById('searchCheating');
    if (!searchInput) return;
    
    const term = searchInput.value.toLowerCase();
    
    cheatingData.filteredLogs = term === '' 
        ? cheatingData.logs 
        : cheatingData.logs.filter(l => 
            l.student_name.toLowerCase().includes(term) ||
            l.exam_name.toLowerCase().includes(term)
        );
    
    renderCheatingLogs();
}

// View detail
async function viewStudentCheatingDetail(studentId, examId, attemptId) {
    const token = localStorage.getItem('token');
    
    try {
        console.log('🔵 [Detail] Loading:', attemptId);
        
        const response = await fetch(`http://localhost:3000/api/teacher/cheating/cheating-logs/${attemptId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tải chi tiết');
        }
        const data = await response.json();
        cheatingData.currentStudentDetail = data;
        // Toggle views
        const listCard = document.getElementById('cheatingListCard');
        const detailCard = document.getElementById('studentCheatingDetail');
        if (listCard) listCard.style.display = 'none';
        if (detailCard) detailCard.style.display = 'block';
        // Update info (với kiểm tra null)
        const nameEl = document.getElementById('studentCheatingName');
        const scoreEl = document.getElementById('studentCheatingScore');
        const examNameEl = document.getElementById('detailExamName');
        const examTimeEl = document.getElementById('detailExamTime');
        const violationsEl = document.getElementById('detailTotalViolations');
        
        if (nameEl) nameEl.textContent = data.student_name;
        if (scoreEl) scoreEl.textContent = data.score !== null ? `${data.score} điểm` : 'Chưa chấm';
        if (examNameEl) examNameEl.textContent = data.exam_name;
        if (examTimeEl) examTimeEl.textContent = new Date(data.start_time).toLocaleString('vi-VN');
        if (violationsEl) violationsEl.textContent = data.logs.length;
        
        // Render timeline
        const timeline = document.getElementById('cheatingTimeline');
        if (timeline) {
            timeline.innerHTML = data.logs.sort((a, b) => new Date(b.event_time) - new Date(a.event_time)).map(log => {
            const types = {
                TabSwitch: { icon: '🚫', color: '#f56565', name: 'Chuyển tab' },
                CopyPaste: { icon: '📋', color: '#ffa502', name: 'Copy/Paste' },
                WebcamSuspicious: { icon: '📷', color: '#4299e1', name: 'Lỗi webcam' },
                DevTools: { icon: '🔧', color: '#9f7aea', name: 'DevTools' }
            };
            
            const type = types[log.event_type] || { icon: '⚠️', color: '#cbd5e0', name: log.event_type };
            
            return `
                <div class="notification-item" style="border-left: 4px solid ${type.color};">
                    <div class="notification-header">
                        <span class="notification-title" style="font-weight: 600;">
                            ${type.icon} ${type.name}
                        </span>
                        <span class="notification-time">${new Date(log.event_time).toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="notification-content">${log.event_description || 'Không có mô tả'}</div>
                </div>
            `;
        }).join('');
        }
        
    } catch (error) {
        console.error('❌ [Detail] Error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// Back to list
function backToCheatingList() {
    const listCard = document.getElementById('cheatingListCard');
    const detailCard = document.getElementById('studentCheatingDetail');
    if (listCard) listCard.style.display = 'block';
    if (detailCard) detailCard.style.display = 'none';
    cheatingData.currentStudentDetail = null;
}

// Ban student
async function banStudent() {
    if (!cheatingData.currentStudentDetail) {
        showNotification('❌ Không có thông tin', 'error');
        return;
    }
    
    const reason = prompt('Lý do cấm thi:');
    if (!reason || !reason.trim()) {
        showNotification('❌ Vui lòng nhập lý do', 'error');
        return;
    }
    
    if (!confirm(`Cấm thi ${cheatingData.currentStudentDetail.student_name}?`)) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://localhost:3000/api/anti-cheating/ban-student', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attempt_id: cheatingData.currentStudentDetail.attempt_id,
                reason: reason.trim()
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi cấm thi');
        }
        
        showNotification('✅ Đã cấm thi', 'success');
        backToCheatingList();
        await loadCheatingLogs();
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// Export report
function exportCheatingReport() {
    if (cheatingData.logs.length === 0) {
        showNotification('❌ Không có dữ liệu', 'error');
        return;
    }
    
    const headers = ['Học sinh', 'Bài thi', 'Loại', 'Mô tả', 'Thời gian'];
    const rows = cheatingData.logs.map(l => [
        l.student_name,
        l.exam_name,
        l.event_type,
        l.event_description || '',
        new Date(l.event_time).toLocaleString('vi-VN')
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(r => csv += r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Gian_lan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('✅ Đã xuất báo cáo', 'success');
}

// ============================================
// 🎯 UNIFIED NAVIGATION SYSTEM
// ============================================

// Wrap original navigateTo
(function() {
    const _originalNavigateTo = navigateTo;
    
    window.navigateTo = async function(section) {
        console.log('🔵 [Navigation] Navigating to:', section);
        
        // Gọi navigation gốc
        _originalNavigateTo(section);
        
        // Load data SAU khi UI render
        setTimeout(async () => {
            switch(section) {
                case 'questions':
                    console.log('🔵 [Questions] Auto-loading...');
                    questionBankCurrentPage = 0;
                    await loadQuestionBankForSection();
                    break;
                    
                case 'grading':
                    await loadGradingSection();
                    break;
                    
                case 'anti-cheating':
                    await loadExamsForCheating();
                    await loadCheatingLogs();
                    break;
                    
                case 'exams':
                    await renderAllExams();
                    break;
                    
                case 'schedule':
                    await loadExamSchedule(currentScheduleFilter || 'all');
                    break;
            }
        }, 200);
    };
})();

// 📝 LOAD DANH SÁCH BÀI THI CẦN CHẤM
async function loadGradingSection() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('grading');
    
    console.log('🔵 [Grading] Container found:', !!container);
    
    if (!container) {
        console.error('❌ [Grading] #grading element not found!');
        return;
    }
    
    const classListContainer = document.getElementById('gradingClassList');
    
    if (!classListContainer) {
        console.error('❌ [Grading] #gradingClassList not found!');
        return;
    }
    
    // Show loading
    classListContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
            <div style="font-size: 1.1rem; font-weight: 500;">Đang tải danh sách bài cần chấm...</div>
        </div>
    `;
    
    try {
        console.log('🔵 [Grading] Fetching pending exams...');
        
        const response = await fetch('http://localhost:3000/api/teacher/grading/pending', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 [Grading] Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tải danh sách');
        }
        
        const data = await response.json();
        console.log('✅ [Grading] Data loaded:', data);
        console.log('✅ [Grading] Attempts:', data.attempts);
        
        // Update stats
        const totalPending = (data.pendingEssays || 0) + (data.pendingFillInBlank || 0);
        
        const pendingEl = document.getElementById('gradingPendingCount');
        const gradedEl = document.getElementById('gradingGradedCount');
        const essayEl = document.getElementById('gradingEssayCount');
        const fillEl = document.getElementById('gradingFillCount');
        
        if (pendingEl) pendingEl.textContent = totalPending;
        if (gradedEl) gradedEl.textContent = data.gradedCount || 0;
        if (essayEl) essayEl.textContent = data.pendingEssays || 0;
        if (fillEl) fillEl.textContent = data.pendingFillInBlank || 0;
        
        console.log('✅ [Grading] Stats updated:', { 
            totalPending, 
            graded: data.gradedCount,
            essays: data.pendingEssays,
            fill: data.pendingFillInBlank
        });
        
        // Nhóm bài thi theo lớp học
        const classGroups = {};
        if (data.attempts && data.attempts.length > 0) {
            data.attempts.forEach(attempt => {
                // Chuẩn hóa class_id thành string để so sánh dễ dàng
                const classId = attempt.class_id === null || attempt.class_id === undefined ? 'no-class' : String(attempt.class_id);
                const className = attempt.class_name || 'Không có lớp';
                
                if (!classGroups[classId]) {
                    classGroups[classId] = {
                        class_id: classId,
                        class_name: className,
                        attempts: []
                    };
                }
                classGroups[classId].attempts.push(attempt);
            });
        }
        
        console.log('🔵 [Grading] Class groups:', Object.keys(classGroups).map(k => ({
            id: k,
            name: classGroups[k].class_name,
            count: classGroups[k].attempts.length
        })));
        
        // Render danh sách lớp học
        const classListContainer = document.getElementById('gradingClassList');
        if (!classListContainer) {
            console.error('❌ [Grading] #gradingClassList not found!');
            return;
        }
        
        if (Object.keys(classGroups).length === 0) {
            classListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">Không có bài thi nào cần chấm</div>
                    <div class="empty-state-subtext">Tất cả bài thi đã được chấm điểm</div>
                </div>
            `;
            console.log('ℹ️ [Grading] No attempts to grade');
            return;
        }
        
        console.log('🔵 [Grading] Rendering', Object.keys(classGroups).length, 'classes...');
        
        classListContainer.innerHTML = Object.values(classGroups).map(classGroup => {
            const totalPending = classGroup.attempts.reduce((sum, a) => sum + parseInt(a.pending_questions || 0), 0);
            
            return `
                <div class="class-card" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f7fafc; transition: all 0.3s; cursor: pointer;" onclick="showClassGradingDetails('${classGroup.class_id}', '${classGroup.class_name.replace(/'/g, "\\'")}')">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h3 style="font-size: 1.3rem; font-weight: 600; color: #2d3748; margin-bottom: 8px;">
                                🏫 ${classGroup.class_name}
                            </h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 15px; color: #718096; font-size: 0.9rem;">
                                <span style="color: #ffa502; font-weight: 600;">
                                    ⚠️ ${totalPending} câu cần chấm
                                </span>
                                <span>📝 ${classGroup.attempts.length} bài thi</span>
                            </div>
                        </div>
                        <span style="background: #ffa502; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            Chờ chấm
                        </span>
                    </div>
                    <div style="color: #667eea; font-weight: 600; margin-top: 10px;">
                        👆 Click để xem chi tiết →
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ [Grading] Section rendered successfully!');
        
    } catch (error) {
        console.error('❌ [Grading] Error:', error);
        const classListContainer = document.getElementById('gradingClassList');
        if (classListContainer) {
            classListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <div class="empty-state-text">Lỗi tải danh sách bài cần chấm</div>
                    <div class="empty-state-subtext">${error.message}</div>
                    <button class="btn btn-primary" onclick="loadGradingSection()" style="margin-top: 15px;">
                        🔄 Thử lại
                    </button>
                </div>
            `;
        }
        showNotification('❌ ' + error.message, 'error');
    }
}

//  BẮT ĐẦU CHẤM BÀI
async function startGrading(attemptId, examId) {
    const token = localStorage.getItem('token');
    
    try {
        console.log('🔵 Loading grading detail:', attemptId);
        const response = await fetch(`http://localhost:3000/api/teacher/grading/${attemptId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải chi tiết bài làm');
        }
        
        const data = await response.json();
        console.log('✅ Grading detail:', data);
        
        // Hiển thị form chấm bài
        showGradingModal(data);
        
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// 🎨 HIỂN THỊ MODAL CHẤM BÀI
function showGradingModal(data) {
    const modal = document.getElementById('gradingModal');
    if (!modal) {
        console.error('❌ Modal không tồn tại!');
        return;
    }
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) {
        console.error('❌ Modal content không tồn tại!');
        return;
    }
    
    // ⭐ SỬA: Lấy cả câu đã chấm và chưa chấm để có thể sửa điểm
    // Bao gồm tất cả loại câu hỏi: Essay, FillInBlank, SingleChoice, MultipleChoice
    const ungraded = data.answers.filter(a => 
        !a.is_graded && (a.question_type === 'Essay' || a.question_type === 'FillInBlank')
    );
    
    // Lấy TẤT CẢ câu hỏi (kể cả trắc nghiệm) để có thể sửa điểm
    const allGradableQuestions = data.answers.filter(a => 
        a.question_type === 'Essay' || 
        a.question_type === 'FillInBlank' || 
        a.question_type === 'SingleChoice' || 
        a.question_type === 'MultipleChoice'
    );
    
    // Cập nhật title
    const modalTitle = modal.querySelector('#gradingModalTitle');
    if (modalTitle) {
        // Nếu đã chấm hết, hiển thị "Sửa điểm", nếu chưa thì "Chấm bài"
        const titleText = ungraded.length === 0 ? '✏️ Sửa điểm' : '✍️ Chấm bài';
        modalTitle.textContent = `${titleText}: ${data.exam_name}`;
    }
    
    // Cập nhật thông tin học sinh và bài thi
    const modalInfo = document.getElementById('gradingModalInfo');
    if (modalInfo) {
        modalInfo.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div>
                    <strong>👤 Học sinh:</strong> ${data.student_name}
                </div>
                <div>
                    <strong>🏫 Lớp:</strong> ${data.class_name || 'Không có lớp'}
                </div>
                <div>
                    <strong>📅 Nộp lúc:</strong> ${new Date(data.end_time).toLocaleString('vi-VN')}
                </div>
                <div>
                    <strong>📊 Điểm hiện tại:</strong> 
                    <span style="color: #667eea; font-weight: 600;">${data.current_score}/${data.total_points}</span>
                </div>
                <div>
                    <strong>⚠️ Chưa chấm:</strong> 
                    <span style="color: #ffa502; font-weight: 600;">${ungraded.length} câu</span>
                </div>
            </div>
        `;
    }
    
    // Cập nhật thông tin vi phạm gian lận
    const violationInfo = document.getElementById('gradingViolationInfo');
    if (violationInfo) {
        if (data.violation_count > 0) {
            violationInfo.style.display = 'block';
            const violationDetails = document.getElementById('violationDetails');
            if (violationDetails) {
                violationDetails.innerHTML = `
                    <div>
                        <strong>Tổng vi phạm:</strong> 
                        <span style="color: #c53030; font-weight: 600; font-size: 1.1rem;">${data.violation_count} lần</span>
                    </div>
                    ${data.tab_switch_count > 0 ? `
                        <div>
                            <strong>🚫 Chuyển tab:</strong> 
                            <span style="color: #c53030; font-weight: 600;">${data.tab_switch_count} lần</span>
                        </div>
                    ` : ''}
                    ${data.copy_paste_count > 0 ? `
                        <div>
                            <strong>📋 Copy/Paste:</strong> 
                            <span style="color: #c53030; font-weight: 600;">${data.copy_paste_count} lần</span>
                        </div>
                    ` : ''}
                    ${data.webcam_suspicious_count > 0 ? `
                        <div>
                            <strong>📷 Lỗi webcam:</strong> 
                            <span style="color: #c53030; font-weight: 600;">${data.webcam_suspicious_count} lần</span>
                        </div>
                    ` : ''}
                    ${data.devtools_count > 0 ? `
                        <div>
                            <strong>🔧 Mở DevTools:</strong> 
                            <span style="color: #c53030; font-weight: 600;">${data.devtools_count} lần</span>
                        </div>
                    ` : ''}
                    ${data.penalty_amount > 0 ? `
                        <div style="grid-column: 1 / -1; margin-top: 10px; padding-top: 10px; border-top: 1px solid #fc8181;">
                            <strong>💰 Đã bị trừ điểm:</strong> 
                            <span style="color: #c53030; font-weight: 600; font-size: 1.1rem;">-${data.penalty_amount} điểm</span>
                            ${data.penalty_reason ? `
                                <div style="margin-top: 5px; font-size: 0.9rem; color: #742a2a;">
                                    Lý do: ${data.penalty_reason}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                    <div style="grid-column: 1 / -1; margin-top: 10px; color: #742a2a; font-size: 0.9rem; font-style: italic;">
                        💡 Giáo viên có thể căn cứ vào thông tin vi phạm này để chấm điểm công bằng và chính xác hơn.
                    </div>
                `;
            }
        } else {
            violationInfo.style.display = 'none';
        }
    }
    
    // Cập nhật form chấm bài
    const questionsList = document.getElementById('gradingQuestionsList');
    const gradingForm = document.getElementById('gradingForm');
    
    if (questionsList && gradingForm) {
        // Cập nhật onsubmit của form
        gradingForm.onsubmit = (e) => submitGrading(e, data.attempt_id);
        
        // ⭐ SỬA: Hiển thị TẤT CẢ câu hỏi tự luận/điền khẩu (kể cả đã chấm) để có thể sửa điểm
        // Cập nhật danh sách câu hỏi
        questionsList.innerHTML = `
            ${allGradableQuestions.map((answer, index) => `
                <div class="card" style="margin-bottom: 20px; border-left: 4px solid #667eea;">
                    <h4 style="margin-bottom: 15px; color: #2d3748;">
                        Câu ${index + 1}: ${answer.question_content}
                    </h4>
                    
                    <div style="margin-bottom: 15px;">
                        <strong>Loại:</strong> 
                        <span class="tag">${
                            answer.question_type === 'Essay' ? 'Tự luận' : 
                            answer.question_type === 'FillInBlank' ? 'Điền khẩu' :
                            answer.question_type === 'SingleChoice' ? 'Trắc nghiệm 1 lựa chọn' :
                            answer.question_type === 'MultipleChoice' ? 'Trắc nghiệm nhiều lựa chọn' :
                            answer.question_type
                        }</span>
                        <span class="tag" style="background: #4299e1;">Độ khó: ${answer.difficulty}</span>
                        <span class="tag" style="background: #48bb78;">Điểm tối đa: ${answer.points}</span>
                        ${answer.is_correct !== null && answer.is_correct !== undefined ? `
                            <span class="tag" style="background: ${answer.is_correct == 1 ? '#48bb78' : '#f56565'};">
                                ${answer.is_correct == 1 ? '✅ Đúng' : '❌ Sai'} (Tự động)
                            </span>
                        ` : ''}
                    </div>
                    
                    ${answer.correct_answer_text ? `
                        <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #26de81;">
                            <strong style="color: #2d3748;">✅ Đáp án đúng:</strong>
                            <div style="margin-top: 8px; color: #2d3748;">${answer.correct_answer_text}</div>
                        </div>
                    ` : ''}
                    
                    <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                        <strong style="color: #2d3748;">📝 Câu trả lời của học sinh:</strong>
                        <div style="margin-top: 8px; color: #2d3748; white-space: pre-wrap;">
                            ${answer.answer_text || answer.option_id || '<em style="color: #cbd5e0;">Học sinh chưa trả lời</em>'}
                        </div>
                        ${(answer.question_type === 'SingleChoice' || answer.question_type === 'MultipleChoice') && answer.is_correct !== null ? `
                            <div style="margin-top: 8px; padding: 8px; background: ${answer.is_correct == 1 ? '#e6fffa' : '#fff5f5'}; border-radius: 4px;">
                                <strong>Kết quả tự động:</strong> 
                                <span style="color: ${answer.is_correct == 1 ? '#26de81' : '#f56565'}; font-weight: 600;">
                                    ${answer.is_correct == 1 ? '✅ Đúng' : '❌ Sai'}
                                </span>
                                ${answer.is_correct == 1 ? ` (Được ${answer.points} điểm tự động)` : ' (0 điểm)'}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label>
                            <strong>Điểm:</strong> (0 - ${answer.points})
                            <span style="color: #f56565;">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="score_${answer.question_id}" 
                            min="0" 
                            max="${answer.points}" 
                            step="0.5"
                            class="input-field"
                            placeholder="VD: 0, 0.5, 1, 1.5..."
                            value="${answer.teacher_score !== null && answer.teacher_score !== undefined ? answer.teacher_score : (answer.is_correct == 1 ? answer.points : 0)}"
                            required
                            style="max-width: 150px;"
                        >
                        ${answer.teacher_score !== null && answer.teacher_score !== undefined ? `
                            <small style="color: #48bb78; display: block; margin-top: 5px;">
                                💡 Điểm đã chỉnh sửa: ${answer.teacher_score}/${answer.points}
                            </small>
                        ` : (answer.question_type === 'SingleChoice' || answer.question_type === 'MultipleChoice') ? `
                            <small style="color: #4299e1; display: block; margin-top: 5px;">
                                💡 Điểm tự động: ${answer.is_correct == 1 ? answer.points : 0}/${answer.points} (Có thể chỉnh sửa)
                            </small>
                        ` : ''}
                    </div>
                    
                    <div class="form-group">
                        <label><strong>Nhận xét:</strong> (Không bắt buộc)</label>
                        <textarea 
                            name="comment_${answer.question_id}" 
                            rows="3" 
                            class="input-field"
                            placeholder="Nhập nhận xét cho học sinh..."
                        >${answer.teacher_comment || ''}</textarea>
                    </div>
                </div>
            `).join('')}
            
            ${allGradableQuestions.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">Không có câu hỏi cần chấm</div>
                </div>
            ` : ''}
            
            ${allGradableQuestions.length > 0 ? `
                <div class="card" style="background: #fff5f5; border-left: 4px solid #f56565; margin-top: 20px;">
                    <h4 style="margin-bottom: 10px; color: #2d3748;">
                        📝 ${ungraded.length === 0 ? 'Lý do chỉnh sửa điểm' : 'Lý do chấm điểm'} 
                        <span style="color: #f56565;">*</span>
                    </h4>
                    <p style="color: #718096; font-size: 14px; margin-bottom: 15px;">
                        ${ungraded.length === 0 
                            ? 'Vui lòng nhập lý do khi chỉnh sửa điểm. Lý do này sẽ được ghi lại trong lịch sử và học sinh có thể xem.'
                            : 'Vui lòng nhập lý do khi chấm điểm. Lý do này sẽ được ghi lại trong lịch sử và học sinh có thể xem.'
                        }
                    </p>
                    <div class="form-group">
                        <textarea 
                            id="gradingReason" 
                            name="reason" 
                            rows="3" 
                            class="input-field"
                            placeholder="VD: ${ungraded.length === 0 ? 'Điều chỉnh điểm do học sinh trình bày tốt hơn mong đợi...' : 'Học sinh trả lời đúng và trình bày rõ ràng...'}"
                            required
                            style="width: 100%;"
                        ></textarea>
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    // Hiển thị modal
    modal.style.display = 'flex';
}

// 💾 SUBMIT ĐIỂM CHẤM BÀI
async function submitGrading(event, attemptId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const token = localStorage.getItem('token');
    const grades = [];
    const inputs = form.querySelectorAll('input[name^="score_"]');
    
    // Lấy lý do chỉnh sửa
    const reason = document.getElementById('gradingReason')?.value.trim() || '';
    if (!reason) {
        showNotification('❌ Vui lòng nhập lý do chỉnh sửa điểm!', 'error');
        return;
    }
    
    inputs.forEach(input => {
        const questionId = input.name.replace('score_', '');
        const score = parseFloat(input.value);
        const comment = formData.get(`comment_${questionId}`) || '';
        
        grades.push({
            question_id: parseInt(questionId),
            teacher_score: score,
            teacher_comment: comment
        });
    });
    
    console.log('🔵 Submitting grades:', grades);
    
    try {
        const response = await fetch(`http://localhost:3000/api/teacher/grading/${attemptId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ grades, reason })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lưu điểm');
        }
        
        const result = await response.json();
        console.log('✅ Grading submitted:', result);
        
        showNotification('✅ Đã lưu điểm thành công!', 'success');
        closeGradingModal();
        
        // ⭐ RELOAD CẢ HAI TAB: Cần chấm và Lịch sử đã chấm
        await loadGradingSection();
        
        // Kiểm tra xem đang ở tab nào và reload tab đó
        const pendingTab = document.getElementById('pendingGradingTab');
        const historyTab = document.getElementById('gradedHistoryTab');
        
        if (historyTab && historyTab.style.display !== 'none') {
            // Đang ở tab lịch sử, reload lại
            await loadGradedHistory();
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// ĐÓNG MODAL
function closeGradingModal() {
    const modal = document.getElementById('gradingModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Lưu trữ dữ liệu lớp học để hiển thị chi tiết
let gradingClassData = {};

// 📋 HIỂN THỊ CHI TIẾT BÀI THI CẦN CHẤM CỦA MỘT LỚP
function showClassGradingDetails(classId, className) {
    const token = localStorage.getItem('token');
    
    // Lấy dữ liệu từ API
    fetch('http://localhost:3000/api/teacher/grading/pending', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        console.log('🔵 [Class Grading] All attempts:', data.attempts);
        console.log('🔵 [Class Grading] Looking for classId:', classId, 'Type:', typeof classId);
        
        // Lọc bài thi theo lớp - so sánh cả số và string
        const classAttempts = data.attempts.filter(a => {
            const attemptClassId = a.class_id === null || a.class_id === undefined ? 'no-class' : String(a.class_id);
            const searchClassId = classId === 'no-class' ? 'no-class' : String(classId);
            console.log('🔵 [Class Grading] Comparing:', attemptClassId, '===', searchClassId);
            return attemptClassId === searchClassId;
        });
        
        console.log('🔵 [Class Grading] Filtered attempts:', classAttempts.length);
        
        if (classAttempts.length === 0) {
            showNotification('Không có bài thi nào cần chấm trong lớp này', 'info');
            return;
        }
        
        // Tạo modal để hiển thị danh sách bài thi
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h3>📋 Danh sách bài cần chấm - ${className}</h3>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div style="padding: 20px;">
                    <p style="color: #718096; margin-bottom: 20px;">
                        Tổng cộng: <strong>${classAttempts.length}</strong> bài thi cần chấm
                    </p>
                    <div class="exam-list">
                        ${classAttempts.map(attempt => `
                            <div class="exam-item" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: #f7fafc;">
                                <div class="exam-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                    <div style="flex: 1;">
                                        <div class="exam-title" style="font-size: 1.2rem; font-weight: 600; color: #2d3748; margin-bottom: 8px;">
                                            ${attempt.exam_name}
                                        </div>
                                        <div class="exam-meta" style="display: flex; flex-wrap: wrap; gap: 15px; color: #718096; font-size: 0.9rem;">
                                            <span>👤 ${attempt.student_name}</span>
                                            <span>📅 ${new Date(attempt.end_time).toLocaleString('vi-VN')}</span>
                                            <span>⏱️ ${attempt.duration} phút</span>
                                            <span style="color: #ffa502; font-weight: 600;">
                                                ⚠️ ${attempt.pending_questions} câu chưa chấm
                                            </span>
                                        </div>
                                    </div>
                                    <span class="exam-status" style="background: #ffa502; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                                        Chờ chấm
                                    </span>
                                </div>
                                <div class="exam-actions" style="display: flex; gap: 10px;">
                                    <button class="btn btn-primary" onclick="startGrading(${attempt.attempt_id}, ${attempt.exam_id}); this.closest('.modal').remove();" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                        ✍️ Chấm bài
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    })
    .catch(error => {
        console.error('❌ [Class Grading] Error:', error);
        showNotification('❌ Lỗi khi tải danh sách bài thi: ' + error.message, 'error');
    });
}

// 🔄 CHUYỂN TAB GIỮA "CẦN CHẤM" VÀ "LỊCH SỬ"
function switchGradingTab(tab) {
    const pendingTab = document.getElementById('pendingGradingTab');
    const historyTab = document.getElementById('gradedHistoryTab');
    const pendingBtn = document.querySelector('[data-tab="pending-grading"]');
    const historyBtn = document.querySelector('[data-tab="graded-history"]');
    
    if (tab === 'pending') {
        pendingTab.style.display = 'block';
        historyTab.style.display = 'none';
        if (pendingBtn) pendingBtn.classList.add('active');
        if (historyBtn) historyBtn.classList.remove('active');
    } else {
        pendingTab.style.display = 'none';
        historyTab.style.display = 'block';
        if (pendingBtn) pendingBtn.classList.remove('active');
        if (historyBtn) historyBtn.classList.add('active');
        
        // Load lịch sử khi chuyển sang tab này
        loadGradedHistory();
    }
}

// 📜 LOAD LỊCH SỬ BÀI ĐÃ CHẤM
async function loadGradedHistory() {
    const token = localStorage.getItem('token');
    const historyList = document.getElementById('gradedHistoryList');
    
    if (!historyList) {
        console.error('❌ [Grading History] #gradedHistoryList not found!');
        return;
    }
    
    historyList.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: #666;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
            <div style="font-size: 1.1rem; font-weight: 500;">Đang tải lịch sử...</div>
        </div>
    `;
    
    try {
        const response = await fetch('http://localhost:3000/api/teacher/grading/graded', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định' }));
            throw new Error(errorData.error || 'Lỗi tải lịch sử');
        }
        
        const data = await response.json();
        
        if (!data.attempts || data.attempts.length === 0) {
            historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <div class="empty-state-text">Chưa có bài thi nào đã chấm</div>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = data.attempts.map(attempt => `
            <div class="exam-item" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: #f7fafc;">
                <div class="exam-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div class="exam-title" style="font-size: 1.2rem; font-weight: 600; color: #2d3748; margin-bottom: 8px;">
                            ${attempt.exam_name}
                        </div>
                        <div class="exam-meta" style="display: flex; flex-wrap: wrap; gap: 15px; color: #718096; font-size: 0.9rem;">
                            <span>👤 ${attempt.student_name}</span>
                            <span>🏫 ${attempt.class_name || 'Không có lớp'}</span>
                            <span>📅 ${new Date(attempt.end_time).toLocaleString('vi-VN')}</span>
                            <span>⏱️ ${attempt.duration} phút</span>
                            ${attempt.violation_count > 0 ? `
                                <span style="color: #f56565; font-weight: 600;">
                                    ⚠️ ${attempt.violation_count} vi phạm
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px;">
                        <span style="background: #48bb78; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            Đã chấm
                        </span>
                        <span style="color: #667eea; font-weight: 600; font-size: 1.1rem;">
                            ${parseFloat(attempt.score || 0).toFixed(1)} điểm
                        </span>
                    </div>
                </div>
                <div class="exam-actions" style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary" onclick="startGrading(${attempt.attempt_id}, ${attempt.exam_id})" style="padding: 10px 20px; background: #718096; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        👁️ Xem lại
                    </button>
                    <button class="btn btn-primary" onclick="startGrading(${attempt.attempt_id}, ${attempt.exam_id})" style="padding: 10px 20px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                        ✏️ Sửa điểm
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ [Grading History] Error:', error);
        historyList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải lịch sử</div>
                <div class="empty-state-subtext">${error.message}</div>
                <button class="btn btn-primary" onclick="loadGradedHistory()" style="margin-top: 15px;">
                    🔄 Thử lại
                </button>
            </div>
        `;
    }
}

let manualExamQuestions = [];
let questionBankData = [];
let selectedQuestionsFromBank = new Set();

function showManualExamCreation() {
    const examsSection = document.getElementById('exams');
    const originalCards = examsSection.querySelector('.card');
    originalCards.style.display = 'none';
    
    const manualForm = document.createElement('div');
    manualForm.id = 'manualExamCreationForm';
    manualForm.innerHTML = `
        <button class="back-btn" onclick="hideManualExamCreation()">← Quay lại</button>
        
        <div class="card">
            <h2 class="card-title">✏️ Tạo Đề Thi Thủ Công</h2>
            
            <div class="form-group">
                <label>Tên bài thi <span style="color: #f56565;">*</span></label>
                <input type="text" id="manualExamName" class="form-control" placeholder="VD: Kiểm tra 15 phút">
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Ngày thi <span style="color: #f56565;">*</span></label>
                    <input type="date" id="manualExamDate" class="form-control">
                </div>
                <div class="form-group">
                    <label>Giờ thi <span style="color: #f56565;">*</span></label>
                    <input type="time" id="manualExamTime" class="form-control" value="08:00">
                </div>
            </div>
            
            <div class="form-group">
                <label>Thời lượng (phút) <span style="color: #f56565;">*</span></label>
                <input type="number" id="manualExamDuration" class="form-control" placeholder="45" min="1">
            </div>
            
            <div class="form-group">
                <label>Mô tả</label>
                <textarea id="manualExamDesc" class="form-control" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label style="font-weight: 600; margin-bottom: 12px; display: block; color: #2d3748;">🔀 Xáo trộn</label>
                <div class="shuffle-options">
                    <label class="shuffle-checkbox-label">
                        <input type="checkbox" id="manualShuffleQuestions" value="1" class="shuffle-checkbox">
                        <span>Xáo trộn thứ tự câu hỏi</span>
                    </label>
                    <label class="shuffle-checkbox-label">
                        <input type="checkbox" id="manualShuffleOptions" value="1" class="shuffle-checkbox">
                        <span>Xáo trộn thứ tự đáp án</span>
                    </label>
                </div>
                <small style="color: #718096; display: block; margin-top: 10px; font-size: 0.85rem; line-height: 1.4;">
                    Mỗi học sinh sẽ nhận thứ tự câu hỏi/đáp án khác nhau để tránh gian lận
                </small>
            </div>
            
            <hr style="margin: 30px 0; border-top: 2px solid #e2e8f0;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #2d3748;">📋 Câu hỏi (<span id="manualQuestionCount">0</span>)</h3>
                <button class="btn btn-success" onclick="addManualQuestion()">+ Thêm câu hỏi</button>
            </div>
            
            <div id="manualQuestionsList"></div>
            
            <div style="margin-top: 30px; display: flex; gap: 15px;">
                <button class="btn btn-primary" onclick="saveManualExam()">💾 Lưu đề thi</button>
                <button class="btn btn-secondary" onclick="hideManualExamCreation()">Hủy</button>
            </div>
        </div>
    `;
    
    examsSection.appendChild(manualForm);
    renderManualQuestionsList();
}

function hideManualExamCreation() {
    const form = document.getElementById('manualExamCreationForm');
    if (form) form.remove();
    
    const examsSection = document.getElementById('exams');
    const originalCards = examsSection.querySelector('.card');
    originalCards.style.display = 'block';
    
    manualExamQuestions = [];
}

// 2️⃣ THÊM CÂU HỎI THỦ CÔNG
function addManualQuestion() {
    const modal = document.createElement('div');
    modal.id = 'manualQuestionModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h3>Thêm câu hỏi</h3>
                <span class="close" onclick="closeManualQuestionModal()">&times;</span>
            </div>
            
            <div class="form-group">
                <label>Nội dung câu hỏi <span style="color: #f56565;">*</span></label>
                <textarea id="mqContent" class="form-control" rows="4"></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div class="form-group">
                    <label>Loại câu hỏi</label>
                    <select id="mqType" class="form-control" onchange="handleManualQuestionTypeChange()">
                        <option value="SingleChoice">Trắc nghiệm 1 đáp án</option>
                        <option value="MultipleChoice">Trắc nghiệm nhiều đáp án</option>
                        <option value="FillInBlank">Điền khẩu</option>
                        <option value="Essay">Tự luận</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Độ khó</label>
                    <select id="mqDifficulty" class="form-control">
                        <option value="Easy">Dễ</option>
                        <option value="Medium">Trung bình</option>
                        <option value="Hard">Khó</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Điểm</label>
                    <input type="number" id="mqPoints" class="form-control" value="1" min="0.5" step="0.5">
                </div>
            </div>
            
            <div id="mqOptionsContainer" class="form-group">
                <label>Đáp án</label>
                <div id="mqOptionsList"></div>
                <button type="button" class="btn btn-secondary btn-small" onclick="addManualOption()">+ Thêm đáp án</button>
            </div>
            
            <div id="mqCorrectAnswerContainer" class="form-group">
                <label>Đáp án đúng <span style="color: #f56565;">*</span></label>
                <input type="text" id="mqCorrectAnswer" class="form-control" placeholder="Nhập đáp án đúng">
            </div>
            
            <div style="margin-top: 20px; display: flex; gap: 15px;">
                <button class="btn btn-success" onclick="saveManualQuestion()">✅ Thêm</button>
                <button class="btn btn-secondary" onclick="closeManualQuestionModal()">Hủy</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    handleManualQuestionTypeChange();
}

function handleManualQuestionTypeChange() {
    const type = document.getElementById('mqType').value;
    const optionsContainer = document.getElementById('mqOptionsContainer');
    const correctAnswerContainer = document.getElementById('mqCorrectAnswerContainer');
    
    if (type === 'SingleChoice' || type === 'MultipleChoice') {
        optionsContainer.style.display = 'block';
        const list = document.getElementById('mqOptionsList');
        
        if (list.children.length === 0) {
            for (let i = 0; i < 4; i++) {
                addManualOption();
            }
        }
        
        if (type === 'SingleChoice') {
            correctAnswerContainer.innerHTML = `
                <label>Đáp án đúng <span style="color: #f56565;">*</span></label>
                <div id="mqRadioGroup"></div>
            `;
        } else {
            correctAnswerContainer.innerHTML = `
                <label>Đáp án đúng (chọn nhiều) <span style="color: #f56565;">*</span></label>
                <div id="mqCheckboxGroup"></div>
            `;
        }
        updateManualCorrectAnswerOptions();
    } else {
        optionsContainer.style.display = 'none';
        correctAnswerContainer.innerHTML = `
            <label>Đáp án đúng <span style="color: #f56565;">*</span></label>
            <input type="text" id="mqCorrectAnswer" class="form-control" placeholder="Nhập đáp án đúng">
        `;
    }
}

function addManualOption() {
    const list = document.getElementById('mqOptionsList');
    const index = list.children.length;
    const letter = String.fromCharCode(65 + index);
    
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `
        <span style="width: 30px; height: 35px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700;">${letter}</span>
        <input type="text" class="form-control" placeholder="Đáp án ${letter}" oninput="updateManualCorrectAnswerOptions()">
        <button type="button" class="btn btn-danger btn-small" onclick="this.parentElement.remove(); updateManualCorrectAnswerOptions()">Xóa</button>
    `;
    list.appendChild(div);
    updateManualCorrectAnswerOptions();
}

function updateManualCorrectAnswerOptions() {
    const type = document.getElementById('mqType').value;
    if (type !== 'SingleChoice' && type !== 'MultipleChoice') return;
    
    const list = document.getElementById('mqOptionsList');
    const options = Array.from(list.children);
    
    const container = type === 'SingleChoice' 
        ? document.getElementById('mqRadioGroup')
        : document.getElementById('mqCheckboxGroup');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    options.forEach((opt, i) => {
        const letter = String.fromCharCode(65 + i);
        const text = opt.querySelector('input[type="text"]').value;
        
        if (text.trim()) {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '8px';
            label.style.marginBottom = '8px';
            
            if (type === 'SingleChoice') {
                label.innerHTML = `
                    <input type="radio" name="mqCorrect" value="${letter}">
                    ${letter}. ${text.substring(0, 40)}${text.length > 40 ? '...' : ''}
                `;
            } else {
                label.innerHTML = `
                    <input type="checkbox" name="mqCorrect" value="${letter}">
                    ${letter}. ${text.substring(0, 40)}${text.length > 40 ? '...' : ''}
                `;
            }
            
            container.appendChild(label);
        }
    });
}

function saveManualQuestion() {
    const content = document.getElementById('mqContent').value.trim();
    const type = document.getElementById('mqType').value;
    const difficulty = document.getElementById('mqDifficulty').value;
    const points = parseFloat(document.getElementById('mqPoints').value);
    
    if (!content) {
        showNotification('❌ Vui lòng nhập nội dung câu hỏi', 'error');
        return;
    }
    
    const question = {
        content,
        type,
        difficulty,
        points,
        options: [],
        correctAnswer: ''
    };
    
    // Lấy options và đáp án đúng
    if (type === 'SingleChoice' || type === 'MultipleChoice') {
        const optionsList = document.getElementById('mqOptionsList');
        question.options = Array.from(optionsList.children).map(opt => 
            opt.querySelector('input[type="text"]').value.trim()
        ).filter(o => o);
        
        if (question.options.length < 2) {
            showNotification('❌ Trắc nghiệm phải có ít nhất 2 đáp án', 'error');
            return;
        }
        
        if (type === 'SingleChoice') {
            const checked = document.querySelector('input[name="mqCorrect"]:checked');
            if (!checked) {
                showNotification('❌ Vui lòng chọn đáp án đúng', 'error');
                return;
            }
            question.correctAnswer = checked.value;
        } else {
            const checked = Array.from(document.querySelectorAll('input[name="mqCorrect"]:checked'));
            if (checked.length === 0) {
                showNotification('❌ Vui lòng chọn đáp án đúng', 'error');
                return;
            }
            question.correctAnswer = checked.map(c => c.value).join(',');
        }
    } else {
        const answer = document.getElementById('mqCorrectAnswer').value.trim();
        if (!answer) {
            showNotification('❌ Vui lòng nhập đáp án đúng', 'error');
            return;
        }
        question.correctAnswer = answer;
    }
    
    manualExamQuestions.push(question);
    renderManualQuestionsList();
    closeManualQuestionModal();
    showNotification('✅ Đã thêm câu hỏi', 'success');
}

function closeManualQuestionModal() {
    const modal = document.getElementById('manualQuestionModal');
    if (modal) modal.remove();
}

function renderManualQuestionsList() {
    const list = document.getElementById('manualQuestionsList');
    const count = document.getElementById('manualQuestionCount');
    
    if (count) count.textContent = manualExamQuestions.length;
    
    if (!list) return;
    
    if (manualExamQuestions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">Chưa có câu hỏi nào</p>';
        return;
    }
    
    list.innerHTML = manualExamQuestions.map((q, i) => `
        <div class="question-item" style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>Câu ${i + 1} (${q.points} điểm)</strong>
                <button class="btn btn-danger btn-small" onclick="deleteManualQuestion(${i})">Xóa</button>
            </div>
            <p>${q.content}</p>
            <div style="color: #718096; font-size: 0.9rem;">
                Loại: ${q.type} | Độ khó: ${q.difficulty}
            </div>
            ${q.options.length > 0 ? `
                <div style="margin-top: 10px;">
                    ${q.options.map((opt, j) => `
                        <div>${String.fromCharCode(65 + j)}. ${opt}</div>
                    `).join('')}
                    <div style="color: #48bb78; font-weight: 600; margin-top: 5px;">
                        Đáp án đúng: ${q.correctAnswer}
                    </div>
                </div>
            ` : `
                <div style="color: #48bb78; font-weight: 600; margin-top: 5px;">
                    Đáp án: ${q.correctAnswer}
                </div>
            `}
        </div>
    `).join('');
}

function deleteManualQuestion(index) {
    if (confirm('Xóa câu hỏi này?')) {
        manualExamQuestions.splice(index, 1);
        renderManualQuestionsList();
    }
}

async function saveManualExam() {
    const name = document.getElementById('manualExamName')?.value.trim();
    const date = document.getElementById('manualExamDate')?.value;
    const time = document.getElementById('manualExamTime')?.value;
    const duration = parseInt(document.getElementById('manualExamDuration')?.value);
    const desc = document.getElementById('manualExamDesc')?.value.trim();
    
    console.log('🔵 [Manual] Saving exam...', { 
        name, 
        date, 
        time, 
        duration, 
        questionsCount: manualExamQuestions.length 
    });
    
    //  Validate
    if (!name) {
        showNotification('❌ Vui lòng nhập tên bài thi', 'error');
        return;
    }
    if (!date) {
        showNotification('❌ Vui lòng chọn ngày thi', 'error');
        return;
    }
    if (!time) {
        showNotification('❌ Vui lòng chọn giờ thi', 'error');
        return;
    }
    if (!duration || duration <= 0) {
        showNotification('❌ Vui lòng nhập thời lượng hợp lệ', 'error');
        return;
    }
    if (manualExamQuestions.length === 0) {
        showNotification('❌ Vui lòng thêm ít nhất 1 câu hỏi', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    //  Chọn lớp để gán bài thi
    const classId = await promptSelectClass();
    if (!classId) {
        console.log('❌ [Manual] User cancelled class selection');
        return;
    }
    
    console.log('✅ [Manual] Selected class:', classId);
    
    try {
        //  BƯỚC 1: Tạo bài thi
        console.log('🔵 [Manual] Step 1: Creating exam...');
        
        const examRes = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/exams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                examName: name,
                examDate: date,
                examTime: time,
                duration,
                description: desc || 'Đề thi tạo thủ công',
                shuffle_questions: document.getElementById('manualShuffleQuestions')?.checked ? 1 : 0,
                shuffle_options: document.getElementById('manualShuffleOptions')?.checked ? 1 : 0
            })
        });
        
        console.log('📡 [Manual] Exam response status:', examRes.status);
        
        if (!examRes.ok) {
            const errorText = await examRes.text();
            console.error('❌ [Manual] Exam error response:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.error || 'Lỗi tạo bài thi');
            } catch {
                throw new Error(`HTTP ${examRes.status}: ${errorText.substring(0, 100)}`);
            }
        }
        
        const examData = await examRes.json();
        console.log('✅ [Manual] Exam created:', examData);
        
        // Hiển thị mã code bài thi
        const examCode = examData.exam?.exam_code || examData.exam_code;
        if (examCode) {
            showNotification('✅ Tạo bài thi thành công!', 'success');
            // Hiển thị modal mã code
            setTimeout(() => {
                showExamCodeModal(examCode, examData.exam?.title || examData.exam?.exam_name || name);
            }, 500);
        }
        
        //  Lấy exam_id
        const examId = examData.exam?.exam_id || examData.exam_id;
        
        if (!examId) {
            console.error('❌ [Manual] No exam_id in response:', examData);
            throw new Error('Không nhận được ID bài thi từ server');
        }
        
        console.log('✅ [Manual] Exam ID:', examId);
        
        // BƯỚC 2: Thêm câu hỏi
        console.log('🔵 [Manual] Step 2: Adding', manualExamQuestions.length, 'questions...');
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < manualExamQuestions.length; i++) {
            const q = manualExamQuestions[i];
            
            try {
                console.log(`🔵 [Manual] Question ${i + 1}/${manualExamQuestions.length}:`, {
                    content: q.content.substring(0, 40),
                    type: q.type,
                    difficulty: q.difficulty,
                    optionsCount: q.options.length
                });
const requestBody = {
    question_content: q.content,
    question_type: q.type,
    difficulty: q.difficulty,
    subject_id: null,
    options: []
};

// Chỉ thêm correct_answer_text nếu KHÔNG phải Essay
if (q.type === 'Essay' || q.type === 'FillInBlank') {
    requestBody.correct_answer_text = q.correctAnswer || 'Tự luận';
} else {
    requestBody.correct_answer_text = q.correctAnswer;
}

if ((q.type === 'SingleChoice' || q.type === 'MultipleChoice') && q.options.length > 0) {
    requestBody.options = q.options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        let isCorrect = false;
        
        if (q.type === 'SingleChoice') {
            isCorrect = (q.correctAnswer.toUpperCase() === letter);
        } else {
            const correctAnswers = q.correctAnswer.toUpperCase().split(',').map(a => a.trim());
            isCorrect = correctAnswers.includes(letter);
        }
        
        return {
            text: opt,
            is_correct: isCorrect
        };
    });
}

console.log(`📤 [Manual] Sending question ${i + 1}:`, JSON.stringify(requestBody, null, 2));
                
                //  Xử lý options cho trắc nghiệm
                if ((q.type === 'SingleChoice' || q.type === 'MultipleChoice') && q.options.length > 0) {
                    requestBody.options = q.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        let isCorrect = false;
                        
                        if (q.type === 'SingleChoice') {
                            isCorrect = (q.correctAnswer.toUpperCase() === letter);
                        } else {
                            const correctAnswers = q.correctAnswer.toUpperCase().split(',').map(a => a.trim());
                            isCorrect = correctAnswers.includes(letter);
                        }
                        
                        return {
                            text: opt,   
                            is_correct: isCorrect
                        };
                    });
                }
                
                console.log(`📤 [Manual] Sending question ${i + 1}:`, requestBody);
                
                //  GỌI API THÊM CÂU HỎI
                const qRes = await fetch('http://localhost:3000/api/teacher/exams/question-bank', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
                
                console.log(`📡 [Manual] Question ${i + 1} response status:`, qRes.status);
                
                if (!qRes.ok) {
                    const errorText = await qRes.text();
                    console.error(`❌ [Manual] Question ${i + 1} error:`, errorText);
                    
                    try {
                        const errorData = JSON.parse(errorText);
                        throw new Error(errorData.error || `HTTP ${qRes.status}`);
                    } catch {
                        throw new Error(errorText.substring(0, 100));
                    }
                }
                
                const qData = await qRes.json();
                console.log(`✅ [Manual] Question ${i + 1} created:`, qData);
                
                const questionId = qData.question_id;
                
                if (!questionId) {
                    throw new Error('Không nhận được question_id từ server');
                }
                
                //  BƯỚC 3: Link câu hỏi với bài thi
                console.log(`🔵 [Manual] Linking question ${questionId} to exam ${examId}...`);
                
                const linkRes = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/questions/${questionId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        points: q.points || 1
                    })
                });
                
                if (!linkRes.ok) {
                    const linkError = await linkRes.text();
                    console.warn(`⚠️ [Manual] Link warning:`, linkError);
                }
                
                successCount++;
                console.log(`✅ [Manual] Question ${i + 1} completed`);
                
            } catch (err) {
                console.error(`❌ [Manual] Error with question ${i + 1}:`, err);
                errors.push(`Câu ${i + 1}: ${err.message}`);
                errorCount++;
            }
        }
        
        console.log('✅ [Manual] Summary:', { 
            total: manualExamQuestions.length,
            success: successCount, 
            errors: errorCount 
        });
        
        // 🎉 BƯỚC 4: Thông báo kết quả
        if (errorCount > 0) {
            showNotification(
                `⚠️ Đã tạo bài thi nhưng có ${errorCount}/${manualExamQuestions.length} câu hỏi lỗi`,
                'warning'
            );
            console.error('❌ [Manual] Error details:', errors);
        } else {
            showNotification(
                `✅ Đã tạo đề thi "${name}" thành công với ${successCount} câu hỏi!`,
                'success'
            );
        }
        
        //  BƯỚC 5: Cleanup và reload
        manualExamQuestions = [];
        hideManualExamCreation();
        
        // ⭐ RELOAD TẤT CẢ DANH SÁCH BÀI THI
        await renderAllExams(); 
        
        // Reload trong lớp học nếu đang xem lớp đó
        if (appData.currentClassId === classId) {
            const examsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/exams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (examsResponse.ok) {
                const classExams = await examsResponse.json();
                appData.exams = appData.exams.filter(e => e.class_id !== classId);
                appData.exams.push(...classExams);
                renderExams();
            }
        }
        
        // ⭐ ĐẢM BẢO GIỮ NGUYÊN TAB HIỆN TẠI (không reload trang)
        // Không làm gì cả, chỉ reload dữ liệu
        
    } catch (err) {
        console.error('❌ [Manual] Fatal error:', err);
        console.error('❌ [Manual] Stack:', err.stack);
        showNotification('❌ Lỗi: ' + err.message, 'error');
    }
}

// 3️⃣ NGÂN HÀNG CÂU HỎI
async function showQuestionBankSelection() {
    const examsSection = document.getElementById('exams');
    const originalCards = examsSection.querySelector('.card');
    originalCards.style.display = 'none';
    
    const bankView = document.createElement('div');
    bankView.id = 'questionBankView';
    bankView.innerHTML = `
        <button class="back-btn" onclick="hideQuestionBankView()">← Quay lại</button>
        
        <div class="card">
            <h2 class="card-title">📚 Chọn từ Ngân hàng câu hỏi</h2>
            
            <div class="search-bar" style="margin-bottom: 20px;">
                <input type="text" class="search-input" id="qbSearch" placeholder="🔍 Tìm kiếm câu hỏi..." oninput="filterQuestionBank()">
            </div>
            
            <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                <select class="form-control" id="qbFilterDiff" onchange="filterQuestionBank()">
                    <option value="all">Tất cả độ khó</option>
                    <option value="Easy">Dễ</option>
                    <option value="Medium">Trung bình</option>
                    <option value="Hard">Khó</option>
                </select>
                <select class="form-control" id="qbFilterType" onchange="filterQuestionBank()">
                    <option value="all">Tất cả loại</option>
                    <option value="SingleChoice">Trắc nghiệm 1 đáp án</option>
                    <option value="MultipleChoice">Trắc nghiệm nhiều đáp án</option>
                    <option value="FillInBlank">Điền khẩu</option>
                    <option value="Essay">Tự luận</option>
                </select>
            </div>
            
            <div style="background: #667eea; color: white; padding: 12px 20px; border-radius: 10px; margin-bottom: 20px; font-weight: 600;">
                Đã chọn: <span id="qbSelectedCount">0</span> câu hỏi
            </div>
            
            <div id="qbList" style="max-height: 500px; overflow-y: auto;"></div>
            
            <div style="margin-top: 30px; display: flex; gap: 15px;">
                <button class="btn btn-primary" onclick="createExamFromQuestionBank()">✅ Tạo đề thi</button>
                <button class="btn btn-secondary" onclick="hideQuestionBankView()">Hủy</button>
            </div>
        </div>
    `;
    
    examsSection.appendChild(bankView);
    await loadQuestionBank();
}

async function loadQuestionBank() {
    const token = localStorage.getItem('token');
    const list = document.getElementById('qbList');
    
    if (!list) {
        console.error('❌ Element #qbList not found!');
        return;
    }
    
    list.innerHTML = '<p style="text-align: center; padding: 40px;">⏳ Đang tải...</p>';
    
    try {
        console.log('🔵 [QB] Fetching question bank...');
        
        const res = await fetch('http://localhost:3000/api/teacher/exams/question-bank', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 [QB] Response status:', res.status);
        
        if (!res.ok) {
            const errorData = await res.json();
            console.error('❌ [QB] Error response:', errorData);
            throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        
        const data = await res.json();
        console.log('✅ [QB] Data received:', data);
        
        if (data && data.questions && Array.isArray(data.questions)) {
            questionBankData = data.questions;
            console.log('✅ [QB] Loaded', questionBankData.length, 'questions');
        } else if (Array.isArray(data)) {
            questionBankData = data;
            console.log('✅ [QB] Loaded', questionBankData.length, 'questions (array)');
        } else {
            console.error('❌ [QB] Unexpected data format:', data);
            throw new Error('Dữ liệu trả về không đúng định dạng');
        }
        
        filterQuestionBank();
        
    } catch (err) {
        console.error('❌ [QB] Error:', err);
        list.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #f56565; font-size: 1.2rem; margin-bottom: 10px;">❌ ${err.message}</p>
                <button class="btn btn-primary" onclick="loadQuestionBank()">🔄 Thử lại</button>
            </div>
        `;
    }
}

function filterQuestionBank() {
    const search = document.getElementById('qbSearch').value.toLowerCase();
    const diff = document.getElementById('qbFilterDiff').value;
    const type = document.getElementById('qbFilterType').value;
    
    let filtered = questionBankData;
    
    if (search) {
        filtered = filtered.filter(q => q.question_content.toLowerCase().includes(search));
    }
    if (diff !== 'all') {
        filtered = filtered.filter(q => q.difficulty === diff);
    }
    if (type !== 'all') {
        filtered = filtered.filter(q => q.question_type === type);
    }
    
    renderQuestionBankList(filtered);
}

function renderQuestionBankList(questions) {
    const list = document.getElementById('qbList');
    
    if (questions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">Không tìm thấy câu hỏi</p>';
        return;
    }
    
    list.innerHTML = questions.map(q => {
        const isSelected = selectedQuestionsFromBank.has(q.question_id);
        return `
            <div class="question-bank-item ${isSelected ? 'selected' : ''}" style="cursor: pointer; padding: 15px; border: 2px solid ${isSelected ? '#48bb78' : '#e2e8f0'}; border-radius: 10px; margin-bottom: 10px;" onclick="toggleQuestionSelection(${q.question_id})">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="margin-bottom: 10px;">
                            <span class="tag tag-${q.difficulty.toLowerCase()}">${q.difficulty}</span>
                            <span class="tag">${q.question_type}</span>
                        </div>
                        <p style="margin-bottom: 10px; font-weight: 500;">${q.question_content}</p>
                        <div style="color: #718096; font-size: 0.85rem;">
                            Đáp án: ${q.correct_answer_text}
                        </div>
                    </div>
                    <div style="font-size: 24px;">
                        ${isSelected ? '✅' : '⬜'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.getElementById('qbSelectedCount').textContent = selectedQuestionsFromBank.size;
}

function toggleQuestionSelection(questionId) {
    if (selectedQuestionsFromBank.has(questionId)) {
        selectedQuestionsFromBank.delete(questionId);
    } else {
        selectedQuestionsFromBank.add(questionId);
    }
    filterQuestionBank();
}

async function createExamFromQuestionBank() {
    if (selectedQuestionsFromBank.size === 0) {
        showNotification('❌ Vui lòng chọn ít nhất 1 câu hỏi', 'error');
        return;
    }
    
    const examName = prompt('Tên bài thi:');
    if (!examName) return;
    
    const classId = await promptSelectClass();
    if (!classId) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const examRes = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/exams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                examName,
                examDate: new Date().toISOString().split('T')[0],
                examTime: '08:00',
                duration: 60,
                description: 'Tạo từ ngân hàng câu hỏi',
                shuffle_questions: 1, // Mặc định bật shuffle khi tạo từ question bank
                shuffle_options: 1
            })
        });
        
        if (!examRes.ok) throw new Error('Lỗi tạo bài thi');
        
        const examData = await examRes.json();
        const { exam } = examData;
        const examId = exam.exam_id;
        
        // Hiển thị mã code bài thi
        const examCode = exam.exam_code || examData.exam_code;
        if (examCode) {
            showNotification('✅ Tạo bài thi thành công!', 'success');
            // Hiển thị modal mã code
            setTimeout(() => {
                showExamCodeModal(examCode, examName);
            }, 500);
        }
        for (const qId of selectedQuestionsFromBank) {
            await fetch(`http://localhost:3000/api/teacher/exams/${examId}/questions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question_id: qId, points: 1 })
            });
        }
        
        showNotification('✅ Đã tạo đề thi từ ngân hàng!', 'success');
        hideQuestionBankView();
        
        // ⭐ RELOAD DANH SÁCH BÀI THI VÀ GIỮ NGUYÊN TAB
        await renderAllExams();
        
        // Reset selection
        selectedQuestionsFromBank.clear();
        
    } catch (err) {
        console.error(err);
        showNotification('❌ ' + err.message, 'error');
    }
}

function hideQuestionBankView() {
    const view = document.getElementById('questionBankView');
    if (view) view.remove();
    
    const examsSection = document.getElementById('exams');
    const originalCards = examsSection.querySelector('.card');
    originalCards.style.display = 'block';
    
    selectedQuestionsFromBank.clear();
}

// 4️⃣ HELPER: CHỌN LỚP
function promptSelectClass() {
    return new Promise(resolve => {
        if (appData.classes.length === 0) {
            showNotification('❌ Chưa có lớp học nào', 'error');
            resolve(null);
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3>Chọn lớp học</h3>
                <select id="selectClassForExam" class="form-control" style="margin: 20px 0;">
                    <option value="">-- Chọn lớp --</option>
                    ${appData.classes.map(c => `<option value="${c.class_id}">${c.class_name}</option>`).join('')}
                </select>
                <div style="display: flex; gap: 15px;">
                    <button class="btn btn-primary" onclick="confirmClassSelection()">Xác nhận</button>
                    <button class="btn btn-secondary" onclick="cancelClassSelection()">Hủy</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        window.confirmClassSelection = () => {
            const classId = document.getElementById('selectClassForExam').value;
            if (!classId) {
                showNotification('❌ Vui lòng chọn lớp', 'error');
                return;
            }
            modal.remove();
            resolve(parseInt(classId));
        };
        
        window.cancelClassSelection = () => {
            modal.remove();
            resolve(null);
        };
    });
}

// 5️ CẬP NHẬT SỰ KIỆN ONCLICK CHO CÁC NÚT
document.addEventListener('DOMContentLoaded', function() {
    // Đợi 500ms để đảm bảo DOM đã load xong
    setTimeout(() => {
        // Tìm nút "Tạo thủ công" trong section exams
        const examsSection = document.getElementById('exams');
        if (examsSection) {
            const cards = examsSection.querySelectorAll('.card[style*="cursor: pointer"]');
            
            cards.forEach(card => {
                const title = card.querySelector('h3');
                if (title && title.textContent.includes('Tạo thủ công')) {
                    card.onclick = showManualExamCreation;
                }
            });
        }
        addQuestionBankButton();
    }, 500);
});

// Hàm thêm nút "Ngân hàng câu hỏi"
function addQuestionBankButton() {
    const examsSection = document.getElementById('exams');
    if (!examsSection) return;
    
    const cardGrid = examsSection.querySelector('div[style*="grid-template-columns"]');
    if (!cardGrid) return;
    
    // Kiểm tra xem đã có nút "Ngân hàng câu hỏi" chưa
    const existingCards = cardGrid.querySelectorAll('.card');
    let hasQuestionBank = false;
    existingCards.forEach(card => {
        const title = card.querySelector('h3');
        if (title && title.textContent.includes('Ngân hàng câu hỏi')) {
            hasQuestionBank = true;
        }
    });
    
    if (hasQuestionBank) return;
    
    // Tạo nút mới
    const newCard = document.createElement('div');
    newCard.className = 'card';
    newCard.style.cursor = 'pointer';
    newCard.style.textAlign = 'center';
    newCard.style.transition = 'all 0.3s ease';
    newCard.onclick = showQuestionBankSelection;
    
    newCard.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
        <h3 style="margin-bottom: 10px;">Ngân hàng câu hỏi</h3>
        <p style="color: #718096;">Chọn từ kho câu hỏi có sẵn</p>
    `;
    
    // Thêm vào grid (trước nút Import Excel)
    const importCard = Array.from(existingCards).find(card => {
        const title = card.querySelector('h3');
        return title && title.textContent.includes('Import từ Excel');
    });
    
    if (importCard) {
        cardGrid.insertBefore(newCard, importCard);
    } else {
        cardGrid.appendChild(newCard);
    }
}

// 📚 LOAD NGÂN HÀNG CÂU HỎI CHO SECTION "NGÂN HÀNG CÂU HỎI"
let questionBankCurrentPage = 0;
let questionBankTotalPages = 0;
const questionBankPageSize = 20;
let questionBankFilters = {
    search: '',
    subject_id: 'all',
    difficulty: 'all',
    question_type: 'all'
};

async function loadQuestionBankForSection() {
    console.log('🔵 [QuestionBank] Loading...');
    
    const questionList = document.getElementById('questionList');
    if (!questionList) {
        console.error('❌ [QuestionBank] #questionList not found!');
        return;
    }
    
    const token = localStorage.getItem('token');
    const searchInput = document.getElementById('questionSearchInput');
    const subjectSelect = document.getElementById('questionSubjectSelect');
    const difficultySelect = document.getElementById('questionDifficultySelect');
    
    // Lấy filters từ UI
    if (searchInput) questionBankFilters.search = searchInput.value.trim();
    if (subjectSelect) questionBankFilters.subject_id = subjectSelect.value;
    if (difficultySelect) questionBankFilters.difficulty = difficultySelect.value;
    
    console.log('🔵 [QuestionBank] Filters:', questionBankFilters);
    
    questionList.innerHTML = '<div style="text-align: center; padding: 40px;"><p>⏳ Đang tải câu hỏi...</p></div>';
    
    try {
        const params = new URLSearchParams({
            limit: questionBankPageSize,
            offset: questionBankCurrentPage * questionBankPageSize,
            ...(questionBankFilters.search && { search: questionBankFilters.search }),
            ...(questionBankFilters.subject_id !== 'all' && { subject_id: questionBankFilters.subject_id }),
            ...(questionBankFilters.difficulty !== 'all' && { difficulty: questionBankFilters.difficulty }),
            ...(questionBankFilters.question_type !== 'all' && { question_type: questionBankFilters.question_type })
        });
        
        const url = `http://localhost:3000/api/teacher/exams/question-bank?${params}`;
        console.log('📡 [QuestionBank] Fetching:', url);
        
        const res = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 [QuestionBank] Response status:', res.status);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ [QuestionBank] Error response:', errorText);
            throw new Error('Không thể tải danh sách câu hỏi (HTTP ' + res.status + ')');
        }
        
        const data = await res.json();
        console.log('✅ [QuestionBank] Data received:', data);
        
        // Xử lý cả 2 format: { questions: [], total: N } hoặc trực tiếp array
        let questions = [];
        let total = 0;
        
        if (Array.isArray(data)) {
            questions = data;
            total = data.length;
        } else if (data.questions && Array.isArray(data.questions)) {
            questions = data.questions;
            total = data.total || data.questions.length;
        } else {
            console.error('❌ [QuestionBank] Unexpected data format:', data);
            throw new Error('Dữ liệu trả về không đúng định dạng');
        }
        
        console.log('✅ [QuestionBank] Questions:', questions.length, 'Total:', total);
        
        questionBankTotalPages = Math.ceil(total / questionBankPageSize);
        
        if (questions.length === 0) {
            questionList.innerHTML = '<div style="text-align: center; padding: 40px;"><p>📭 Chưa có câu hỏi nào trong ngân hàng</p></div>';
            return;
        }
        
        // Hiển thị câu hỏi
        questionList.innerHTML = questions.map(q => {
            const difficultyColors = {
                'Easy': '#48bb78',
                'Medium': '#ed8936',
                'Hard': '#f56565'
            };
            const difficultyLabels = {
                'Easy': 'Dễ',
                'Medium': 'Trung bình',
                'Hard': 'Khó'
            };
            const typeLabels = {
                'SingleChoice': 'Trắc nghiệm 1 đáp án',
                'MultipleChoice': 'Trắc nghiệm nhiều đáp án',
                'FillInBlank': 'Điền khẩu',
                'Essay': 'Tự luận'
            };
            
            return `
                <div class="question-item" style="border: 2px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 15px; background: white;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <span style="background: #667eea; color: white; padding: 4px 10px; border-radius: 5px; font-size: 12px;">${q.subject_name || 'Chưa có môn'}</span>
                            <span style="background: ${difficultyColors[q.difficulty] || '#667eea'}; color: white; padding: 4px 10px; border-radius: 5px; font-size: 12px;">
                                ${difficultyLabels[q.difficulty] || q.difficulty}
                            </span>
                            <span style="background: #a0aec0; color: white; padding: 4px 10px; border-radius: 5px; font-size: 12px;">
                                ${typeLabels[q.question_type] || q.question_type}
                            </span>
                        </div>
                    </div>
                    <div style="margin-bottom: 15px; color: #2d3748; font-size: 15px;">
                        ${q.question_content || 'Chưa có nội dung'}
                    </div>
                    ${q.correct_answer_text ? `
                        <div style="padding: 10px; background: #e6fffa; border-left: 3px solid #48bb78; border-radius: 5px; font-size: 13px;">
                            <strong>✅ Đáp án:</strong> ${q.correct_answer_text}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        console.log('✅ [QuestionBank] Rendered', questions.length, 'questions');
        
        // Thêm pagination nếu cần...
        
    } catch (err) {
        console.error('❌ [QuestionBank] Error:', err);
        questionList.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #f56565;">❌ ${err.message}</p>
                <button class="btn btn-primary" onclick="loadQuestionBankForSection()">🔄 Thử lại</button>
            </div>
        `;
    }
}

// Xóa các câu hỏi trùng nhau trong ngân hàng câu hỏi
async function removeDuplicateQuestions() {
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa tất cả các câu hỏi trùng nhau?\n\nHệ thống sẽ giữ lại câu hỏi được tạo sớm nhất trong mỗi nhóm trùng và xóa các câu hỏi còn lại.\n\nHành động này không thể hoàn tác!')) {
        return;
    }

    const token = localStorage.getItem('token');
    const questionList = document.getElementById('questionList');
    
    if (questionList) {
        questionList.innerHTML = '<div style="text-align: center; padding: 40px;"><p>⏳ Đang xóa câu hỏi trùng nhau...</p></div>';
    }

    try {
        const response = await fetch('http://localhost:3000/api/teacher/exams/question-bank/duplicates', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi xóa câu hỏi trùng nhau');
        }

        const result = await response.json();
        
        if (result.deleted_count > 0) {
            showNotification(
                `✅ Đã xóa ${result.deleted_count} câu hỏi trùng nhau!\nTìm thấy ${result.duplicates_found} nhóm câu hỏi trùng.`,
                'success'
            );
            
            // Reload danh sách câu hỏi
            if (questionList) {
                await loadQuestionBankForSection();
            }
        } else {
            showNotification('ℹ️ Không có câu hỏi trùng nhau nào để xóa.', 'info');
        }

    } catch (error) {
        console.error('❌ Error removing duplicate questions:', error);
        showNotification(`❌ ${error.message}`, 'error');
        
        if (questionList) {
            await loadQuestionBankForSection();
        }
    }
}

// Load câu hỏi khi vào section "Ngân hàng câu hỏi"
const originalShowSection = window.showSection || function(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
};

window.showSection = function(sectionId) {
    originalShowSection(sectionId);
    if (sectionId === 'questions') {
        questionBankCurrentPage = 0;
        loadQuestionBankForSection();
    }
};

// Thêm event listeners cho search và filters
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const searchInput = document.getElementById('questionSearchInput');
        const subjectSelect = document.getElementById('questionSubjectSelect');
        const difficultySelect = document.getElementById('questionDifficultySelect');
        
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    questionBankCurrentPage = 0;
                    loadQuestionBankForSection();
                }, 500); // Debounce 500ms
            });
        }
        
        if (subjectSelect) {
            subjectSelect.addEventListener('change', function() {
                questionBankCurrentPage = 0;
                loadQuestionBankForSection();
            });
        }
        
        if (difficultySelect) {
            difficultySelect.addEventListener('change', function() {
                questionBankCurrentPage = 0;
                loadQuestionBankForSection();
            });
        }
    }, 1000);
});

// 📅 LOAD LỊCH THI
let currentScheduleFilter = 'all';

async function loadExamSchedule(filter = 'all') {
    currentScheduleFilter = filter;
    const examScheduleList = document.getElementById('examScheduleList');
    const scheduleTitle = document.getElementById('scheduleTitle');
    
    if (!examScheduleList) return;
    
    const token = localStorage.getItem('token');
    
    // Update filter buttons
    ['all', 'upcoming', 'active', 'completed'].forEach(f => {
        const btn = document.getElementById(`scheduleFilter${f.charAt(0).toUpperCase() + f.slice(1)}`);
        if (btn) {
            btn.className = f === filter ? 'btn btn-small btn-primary' : 'btn btn-small btn-secondary';
        }
    });
    
    // Update title
    const titles = {
        'all': 'Tất cả lịch thi',
        'upcoming': 'Lịch thi sắp tới',
        'active': 'Đang diễn ra',
        'completed': 'Đã kết thúc'
    };
    if (scheduleTitle) scheduleTitle.textContent = titles[filter] || 'Lịch thi';
    
    examScheduleList.innerHTML = '<div style="text-align: center; padding: 40px;"><p>⏳ Đang tải lịch thi...</p></div>';
    
    try {
        const res = await fetch('http://localhost:3000/api/teacher/exams/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Không thể tải lịch thi');
        
        let exams = await res.json();
        
        // Filter theo status
        if (filter !== 'all') {
            exams = exams.filter(exam => exam.status === filter);
        }
        
        // Sắp xếp: upcoming và active trước, completed sau
        exams.sort((a, b) => {
            if ((a.status === 'upcoming' || a.status === 'active') && b.status === 'completed') return -1;
            if (a.status === 'completed' && (b.status === 'upcoming' || b.status === 'active')) return 1;
            return new Date(b.start_time) - new Date(a.start_time);
        });
        
        if (exams.length === 0) {
            examScheduleList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #718096;">📭 Chưa có bài thi nào ${filter === 'all' ? '' : `ở trạng thái ${titles[filter]}`}</p>
                </div>
            `;
            return;
        }
        
        examScheduleList.innerHTML = exams.map(exam => {
            const startTime = new Date(exam.start_time);
            const endTime = new Date(startTime.getTime() + (exam.duration || 0) * 60000);
            const now = new Date();
            
            // Tính status
            let status = exam.status;
            let statusClass = 'status-upcoming';
            let statusText = 'Sắp diễn ra';
            
            if (status === 'active' || (now >= startTime && now < endTime)) {
                statusClass = 'status-active';
                statusText = 'Đang diễn ra';
            } else if (status === 'completed' || now >= endTime) {
                statusClass = 'status-completed';
                statusText = 'Đã kết thúc';
            } else if (now < startTime) {
                statusClass = 'status-upcoming';
                statusText = 'Sắp diễn ra';
            }
            
            // Format thời gian
            const dateStr = startTime.toLocaleDateString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            });
            const timeStr = startTime.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Tính thời gian còn lại hoặc đã qua
            let timeInfo = '';
            if (now < startTime) {
                const diff = startTime - now;
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                if (hours > 24) {
                    const days = Math.floor(hours / 24);
                    timeInfo = `<span style="color: #667eea;">Còn ${days} ngày</span>`;
                } else if (hours > 0) {
                    timeInfo = `<span style="color: #667eea;">Còn ${hours} giờ ${minutes} phút</span>`;
                } else {
                    timeInfo = `<span style="color: #667eea;">Còn ${minutes} phút</span>`;
                }
            } else if (now >= startTime && now < endTime) {
                const diff = endTime - now;
                const minutes = Math.floor(diff / (1000 * 60));
                timeInfo = `<span style="color: #48bb78; font-weight: 600;">Còn ${minutes} phút</span>`;
            }
            
            return `
                <div class="exam-item">
                    <div class="exam-header">
                        <div style="flex: 1;">
                            <div class="exam-title">${exam.title || exam.exam_name || 'Bài thi'}</div>
                            <div class="exam-meta">
                                <span>🏫 ${exam.class_name || 'Chưa có lớp'}</span>
                                <span>📅 ${dateStr}</span>
                                <span>⏰ ${timeStr}</span>
                                <span>⏱️ ${exam.duration || 0} phút</span>
                                ${exam.submissions ? `<span>📝 ${exam.submissions} lượt thi</span>` : ''}
                            </div>
                            ${timeInfo ? `<div style="margin-top: 8px; font-size: 13px;">${timeInfo}</div>` : ''}
                            ${exam.description ? `<div style="margin-top: 8px; color: #718096; font-size: 13px;">${exam.description}</div>` : ''}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
                            <span class="exam-status ${statusClass}">${statusText}</span>
<button class="btn btn-small btn-primary" onclick="viewExamDetail(${exam.exam_id}, 'schedule')">📋 Chi tiết</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('❌ Error loading exam schedule:', err);
        examScheduleList.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #f56565;">❌ Lỗi khi tải lịch thi</p>
                <button class="btn btn-primary" onclick="loadExamSchedule('${filter}')">🔄 Thử lại</button>
            </div>
        `;
    }
}


function closeExamDetailModal() {
    const modal = document.getElementById('examDetailModal');
    if (modal) modal.style.display = 'none';
}

// Hàm hiển thị chi tiết bài thi
async function viewExamDetail(examId, context = 'class') {
    const token = localStorage.getItem('token');
    
    // Lưu context để dùng cho backToExamList()
    examDetailContext = context;
    
    try {
        console.log('🔵 [ExamDetail] Loading exam:', examId, 'Context:', context);
        
        // Fetch chi tiết bài thi
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/detail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải chi tiết bài thi');
        }
        
        const exam = await response.json();
        console.log('✅ [ExamDetail] Exam loaded:', exam);
        
        // Lưu exam hiện tại
        currentExam = exam;
        currentExamId = exam.exam_id; // Lưu exam_id riêng
        console.log('✅ [viewExamDetail] currentExam set:', currentExam);
        console.log('✅ [viewExamDetail] currentExamId saved:', currentExamId);
        
        // Xử lý theo context
        if (context === 'class') {
            // Hiển thị trong phần class detail (đang ở trong 1 lớp)
            showExamDetailInClass(exam);
        } else {
            // Hiển thị trong modal (từ section exams hoặc schedule)
            showExamDetailModal(exam);
        }
        
    } catch (error) {
        console.error('❌ [ExamDetail] Error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// Hiển thị chi tiết bài thi trong modal (từ section exams)
function showExamDetailModal(exam) {
    const modal = document.getElementById('examDetailModal');
    const modalContent = document.getElementById('examDetailModalContent');
    const modalTitle = document.getElementById('examDetailModalTitle');
    
    if (!modal || !modalContent) return;
    
    modalTitle.textContent = `📋 ${exam.exam_name}`;
    
    const statusText = {
        'draft': '📝 Nháp',
        'upcoming': '⏰ Sắp diễn ra',
        'active': '🟢 Đang diễn ra',
        'completed': '✅ Đã kết thúc',
        'deleted': '🗑️ Đã xóa'
    };
    
    const statusClass = {
        'draft': 'status-draft',
        'upcoming': 'status-upcoming',
        'active': 'status-active',
        'completed': 'status-completed'
    };
    
    const startTime = new Date(exam.start_time);
    const dateStr = startTime.toLocaleDateString('vi-VN');
    const timeStr = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    modalContent.innerHTML = `
        <!-- Thông tin cơ bản -->
        <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">🏫 Lớp học</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${exam.class_name || 'Chưa có lớp'}</p>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">📅 Ngày thi</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${dateStr} ${timeStr}</p>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">⏱️ Thời lượng</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${exam.duration} phút</p>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">🔐 Mã code</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #667eea; font-family: 'Courier New', monospace; letter-spacing: 2px;">${exam.password || 'Chưa có'}</p>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">📊 Trạng thái</p>
                    <span class="exam-status ${statusClass[exam.current_status] || 'status-draft'}" style="padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                        ${statusText[exam.current_status] || exam.current_status}
                    </span>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">📝 Số câu hỏi</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${exam.total_questions || 0} câu</p>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">⭐ Tổng điểm</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #48bb78;">${parseFloat(exam.total_points || 0).toFixed(1)} điểm</p>
                </div>
                <div>
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">👥 Số bài nộp</p>
                    <p style="font-size: 1.1rem; font-weight: 600; color: #2d3748;">${exam.total_attempts || 0} bài</p>
                </div>
            </div>
            ${exam.description ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">📄 Mô tả</p>
                    <p style="font-size: 1rem; color: #2d3748;">${exam.description}</p>
                </div>
            ` : ''}
        </div>
        
        <h3 style="color: #2d3748; margin-bottom: 15px; font-size: 1.3rem;">📋 Danh sách câu hỏi</h3>
        <div id="examDetailModalQuestions" class="question-list"></div>
    `;
    
    // Render danh sách câu hỏi
    if (exam.questions && exam.questions.length > 0) {
        renderQuestionsList(document.getElementById('examDetailModalQuestions'), exam.questions, exam.exam_id);
    } else {
        document.getElementById('examDetailModalQuestions').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #718096;">
                <p>📝 Chưa có câu hỏi nào trong bài thi này</p>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

// Hiển thị chi tiết bài thi trong phần class detail
function showExamDetailInClass(exam) {
    const examDetail = document.getElementById('examDetail');
    const examListContainer = document.getElementById('examListContainer');
    
    if (!examDetail || !examListContainer) return;
    
    // ✅ Reset flag khi bắt đầu load exam detail mới
    examDetailDOMReady = false;
    
    // Ẩn danh sách, hiển thị chi tiết
    examListContainer.style.display = 'none';
    examDetail.style.display = 'block';
    
    // ✅ QUAN TRỌNG: Force browser render toàn bộ examDetail
    void examDetail.offsetHeight;
    
    // Cập nhật thông tin
    document.getElementById('examDetailTitle').textContent = exam.exam_name || 'Chi tiết bài thi';
    document.getElementById('examDetailClass').textContent = exam.class_name || 'Chưa có lớp';
    
    const startTime = new Date(exam.start_time);
    const dateStr = startTime.toLocaleDateString('vi-VN');
    const timeStr = startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('examDetailDate').textContent = `${dateStr} ${timeStr}`;
    document.getElementById('examDetailDuration').textContent = `${exam.duration} phút`;
    document.getElementById('examDetailCode').textContent = exam.password || 'Chưa có';
    document.getElementById('examDetailQuestionCount').textContent = `${exam.total_questions || 0} câu`;
    document.getElementById('examDetailTotalPoints').textContent = `${parseFloat(exam.total_points || 0).toFixed(1)} điểm`;
    document.getElementById('examDetailSubmissions').textContent = `${exam.total_attempts || 0} bài`;
    document.getElementById('examDetailDescription').textContent = exam.description || 'Không có mô tả';
    
    const statusText = {
        'draft': '📝 Nháp',
        'upcoming': '⏰ Sắp diễn ra',
        'active': '🟢 Đang diễn ra',
        'completed': '✅ Đã kết thúc',
        'deleted': '🗑️ Đã xóa'
    };
    document.getElementById('examDetailStatus').innerHTML = `<span class="exam-status status-${exam.current_status || 'draft'}" style="padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${statusText[exam.current_status] || exam.current_status}</span>`;
    
    // Lưu exam hiện tại để dùng cho các hàm khác
    currentExam = exam;
    currentExamId = exam.exam_id; // Lưu exam_id riêng
    console.log('✅ [showExamDetailInClass] currentExam set:', currentExam);
    console.log('✅ [showExamDetailInClass] exam_id:', currentExam.exam_id);
    console.log('✅ [showExamDetailInClass] currentExamId saved:', currentExamId);
    
    // ✅ Force browser render toàn bộ exam detail
    void examDetail.offsetHeight;
    
    // Đánh dấu DOM đã sẵn sàng
    examDetailDOMReady = true;
    
    // Khởi tạo tabs
    initializeExamDetailTabs();
    
    // Switch sang tab questions
    switchExamDetailTab('questions');
}

// Khởi tạo các tab trong exam detail
function initializeExamDetailTabs() {
    const questionsTabBtn = document.querySelector('[data-tab="exam-questions"]');
    const studentsStatusTabBtn = document.querySelector('[data-tab="exam-students-status"]');
    
    if (questionsTabBtn) questionsTabBtn.classList.add('active');
    if (studentsStatusTabBtn) studentsStatusTabBtn.classList.remove('active');
}

// Hàm hiển thị modal mã code bài thi
function showExamCodeModal(examCode, examName) {
    const modal = document.getElementById('examCodeModal');
    const codeDisplay = document.getElementById('examCodeDisplay');
    const codeName = document.getElementById('examCodeName');
    const copySuccessMsg = document.getElementById('copySuccessMsg');
    
    if (modal && codeDisplay) {
        codeDisplay.textContent = examCode;
        if (codeName) {
            codeName.textContent = examName || '';
        }
        copySuccessMsg.style.display = 'none';
        modal.style.display = 'flex';
        
        // Lưu mã code vào data attribute để dùng khi copy
        modal.setAttribute('data-exam-code', examCode);
    }
}

// Hàm đóng modal mã code
function closeExamCodeModal() {
    const modal = document.getElementById('examCodeModal');
    if (modal) {
        modal.style.display = 'none';
        const copySuccessMsg = document.getElementById('copySuccessMsg');
        if (copySuccessMsg) copySuccessMsg.style.display = 'none';
    }
}

// Hàm copy mã code vào clipboard
function copyExamCode() {
    const modal = document.getElementById('examCodeModal');
    const examCode = modal ? modal.getAttribute('data-exam-code') : '';
    const copyBtn = document.getElementById('copyCodeBtn');
    const copySuccessMsg = document.getElementById('copySuccessMsg');
    
    if (!examCode) {
        showNotification(' Không tìm thấy mã code!', 'error');
        return;
    }
    
    // Copy vào clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(examCode).then(() => {
            // Hiển thị thông báo thành công
            if (copySuccessMsg) {
                copySuccessMsg.style.display = 'block';
                if (copyBtn) {
                    copyBtn.textContent = '✅ Đã copy!';
                    copyBtn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
                }
                setTimeout(() => {
                    copySuccessMsg.style.display = 'none';
                    if (copyBtn) {
                        copyBtn.textContent = '📋 Copy mã code';
                        copyBtn.style.background = '';
                    }
                }, 3000);
            }
        }).catch(err => {
            console.error('Lỗi copy:', err);
            showNotification(' Không thể copy mã code. Vui lòng copy thủ công!', 'error');
        });
    } else {
        // Fallback cho trình duyệt cũ
        const textArea = document.createElement('textarea');
        textArea.value = examCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (copySuccessMsg) {
                copySuccessMsg.style.display = 'block';
                setTimeout(() => {
                    copySuccessMsg.style.display = 'none';
                }, 3000);
            }
        } catch (err) {
            showNotification(' Không thể copy mã code. Vui lòng copy thủ công!', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function viewExamQuestions(examId) {
    closeExamDetailModal();
    if (window.showSection) {
        showSection('exams');
    }
    showNotification('Tính năng xem câu hỏi đang được phát triển', 'info');
}

function viewExamGrades(examId) {
    closeExamDetailModal();
    if (window.showSection) {
        showSection('exams');
    }
    showNotification('Tính năng xem điểm đang được phát triển', 'info');
}

// Đóng modal khi click outside
document.addEventListener('click', function(event) {
    const examDetailModal = document.getElementById('examDetailModal');
    if (event.target === examDetailModal) {
        closeExamDetailModal();
    }
    
    // Đóng modal mã code khi click bên ngoài
    const examCodeModal = document.getElementById('examCodeModal');
    if (event.target === examCodeModal) {
        closeExamCodeModal();
    }
});

// Load lịch thi khi vào section
const originalShowSectionSchedule = window.showSection;
window.showSection = function(sectionId) {
    if (originalShowSectionSchedule) originalShowSectionSchedule(sectionId);
    if (sectionId === 'schedule') {
        loadExamSchedule(currentScheduleFilter || 'all');
    }
};

// Responsive
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeSidebar();
    }
});

// Load theme từ localStorage khi trang load
(function() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
})();

// Setup event listener sau khi DOM loaded
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            
            // Lưu vào localStorage
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            
            // Cập nhật icon
            updateThemeIcon(isDark);
            
            // Hiển thị thông báo (không dùng emoji để tránh bị filter)
            const message = isDark ? 'Đã chuyển sang chế độ tối' : 'Đã chuyển sang chế độ sáng';
            showNotification(message, 'info');
        });
    }
});

function updateThemeIcon(isDark) {
    const icon = document.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = isDark ? '☀️' : '🌙';
    }
}

// ==================== AI EXAM MODAL FUNCTIONS ====================
let aiGeneratedQuestions = [];
let selectedClassForAI = null;

// Mở modal
function openAIModal() {
    document.getElementById('aiExamModal').classList.add('active');
    loadClassesForAI();
    
    // Set giá trị mặc định cho ngày thi (ngày mai)
    const examDate = document.getElementById('aiExamDate');
    if (examDate && !examDate.value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        examDate.value = tomorrow.toISOString().split('T')[0];
    }
}

// Đóng modal
function closeAIModal() {
    document.getElementById('aiExamModal').classList.remove('active');
    resetAIModal();
}

// Load danh sách lớp
async function loadClassesForAI() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            return;
        }

        // Sử dụng URL tuyệt đối giống như hàm fetchClasses
        const response = await fetch('http://localhost:3000/api/teacher/classes', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Lỗi khi tải danh sách lớp');
            } else {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Server trả về dữ liệu không hợp lệ');
            }
        }

        const classes = await response.json();
        const select = document.getElementById('aiClassSelect');
        
        if (!select) {
            console.error('aiClassSelect element not found');
            return;
        }
        
        select.innerHTML = '<option value="">-- Không gắn lớp --</option>';
        if (Array.isArray(classes) && classes.length > 0) {
            classes.forEach(cls => {
                const option = document.createElement('option');
                option.value = cls.class_id;
                option.textContent = cls.class_name || cls.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading classes:', error);
        showAIAlert(` ${error.message}`, 'error');
    }
}

// Xử lý submit form
document.addEventListener('DOMContentLoaded', function() {
    const aiExamForm = document.getElementById('aiExamForm');
    if (aiExamForm) {
        aiExamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await generateAIExam();
        });
    }

    // Đóng modal khi click bên ngoài
    const aiModal = document.getElementById('aiExamModal');
    if (aiModal) {
        aiModal.addEventListener('click', (e) => {
            if (e.target.id === 'aiExamModal') {
                closeAIModal();
            }
        });
    }
});

// Tạo đề thi với AI
async function generateAIExam() {
    const subject = document.getElementById('aiSubject').value.trim();
    const topic = document.getElementById('aiTopic').value.trim();
    const numQuestions = parseInt(document.getElementById('aiNumQuestions').value);
    const difficulty = document.getElementById('aiDifficulty').value;
    const additional = document.getElementById('aiAdditional').value.trim();
    selectedClassForAI = document.getElementById('aiClassSelect').value;

    // Lấy loại câu hỏi
    const types = Array.from(document.querySelectorAll('input[name="aiQuestionType"]:checked'))
        .map(cb => cb.value);

    if (types.length === 0) {
        showAIAlert('Vui lòng chọn ít nhất một loại câu hỏi!', 'error');
        return;
    }

    // Hiện loading
    document.getElementById('aiExamForm').style.display = 'none';
    document.getElementById('aiLoading').classList.add('active');
    document.getElementById('aiResult').classList.remove('active');

    try {
        // Sử dụng URL tuyệt đối giống như các hàm khác
        const response = await fetch('http://localhost:3000/api/ai/generate-exam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                subject,
                topic,
                numQuestions,
                difficulty,
                questionTypes: types,
                additionalRequirements: additional
            })
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.message || 'Có lỗi xảy ra');
            } else {
                const text = await response.text();
                console.error('Response is not JSON:', text.substring(0, 200));
                throw new Error('Server trả về dữ liệu không hợp lệ');
            }
        }

        const data = await response.json();
        aiGeneratedQuestions = data.questions || [];

        if (aiGeneratedQuestions.length === 0) {
            throw new Error('Không có câu hỏi nào được tạo');
        }

        displayAIResults(aiGeneratedQuestions);
        showAIAlert(` Đã tạo thành công ${aiGeneratedQuestions.length} câu hỏi!`, 'success');

    } catch (error) {
        console.error('Error:', error);
        showAIAlert(` ${error.message}`, 'error');
        document.getElementById('aiExamForm').style.display = 'block';
    } finally {
        document.getElementById('aiLoading').classList.remove('active');
    }
}

// Hiển thị kết quả
function displayAIResults(questions) {
    const choiceCount = questions.filter(q => 
        q.type === 'SingleChoice' || q.type === 'MultipleChoice'
    ).length;
    const otherCount = questions.filter(q => 
        q.type === 'Essay' || q.type === 'FillInBlank'
    ).length;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 10), 0);

    document.getElementById('aiStatTotal').textContent = questions.length;
    document.getElementById('aiStatPoints').textContent = totalPoints;
    document.getElementById('aiStatChoice').textContent = choiceCount;
    document.getElementById('aiStatOther').textContent = otherCount;

    const previewHTML = questions.map((q, index) => {
        const typeText = {
            'SingleChoice': '1 đáp án',
            'MultipleChoice': 'Nhiều đáp án',
            'FillInBlank': 'Điền khẩu',
            'Essay': 'Tự luận'
        }[q.type];

        let optionsHTML = '';
        if (q.options && q.options.length > 0) {
            const correctAnswers = q.correctAnswer.split(',').map(a => a.trim());
            optionsHTML = `
                <div class="ai-options">
                    ${q.options.map((opt, i) => {
                        const letter = String.fromCharCode(65 + i);
                        const isCorrect = correctAnswers.includes(letter);
                        return `<div class="ai-option ${isCorrect ? 'correct' : ''}">${opt} ${isCorrect ? '✓' : ''}</div>`;
                    }).join('')}
                </div>
            `;
        } else {
            optionsHTML = `
                <div style="background: #edf2f7; padding: 8px; border-radius: 6px; margin-top: 8px; font-size: 13px;">
                    <strong>Đáp án:</strong> ${q.correctAnswer}
                </div>
            `;
        }

        return `
            <div class="ai-question-preview">
                <div class="ai-question-header">
                    <span class="ai-question-number">Câu ${index + 1}</span>
                    <div>
                        <span class="difficulty-badge difficulty-${q.difficulty}">${q.difficulty}</span>
                        <span style="margin-left: 8px; color: #667eea; font-weight: 600; font-size: 13px;">${q.points || 10}đ</span>
                    </div>
                </div>
                <div class="ai-question-text">${q.questionText}</div>
                <div style="font-size: 12px; color: #718096; margin-bottom: 8px;">
                    <strong>Loại:</strong> ${typeText}
                </div>
                ${optionsHTML}
            </div>
        `;
    }).join('');

    document.getElementById('aiPreviewList').innerHTML = previewHTML;
    document.getElementById('aiResult').classList.add('active');
}

// Lưu đề thi
async function saveAIExam() {
    if (aiGeneratedQuestions.length === 0) {
        showAIAlert('Không có câu hỏi nào để lưu!', 'error');
        return;
    }

    const subject = document.getElementById('aiSubject').value.trim();
    const topic = document.getElementById('aiTopic').value.trim();
    const token = localStorage.getItem('token');

    if (!token) {
        showAIAlert(' Vui lòng đăng nhập lại!', 'error');
        return;
    }

    // Kiểm tra classId
    if (!selectedClassForAI) {
        showAIAlert(' Vui lòng chọn lớp học để gắn bài thi!', 'error');
        return;
    }

    try {
        // Bước 1: Tạo exam - lấy thông tin từ form
        const examName = `${subject} - ${topic}`;
        const examDate = document.getElementById('aiExamDate').value;
        const examTime = document.getElementById('aiExamTime').value;
        const duration = parseInt(document.getElementById('aiExamDuration').value) || 60;
        const description = document.getElementById('aiExamDescription').value.trim() || 
                           `Đề thi được tạo tự động bằng AI - ${subject}: ${topic}`;

        // Validate ngày giờ
        if (!examDate || !examTime) {
            showAIAlert(' Vui lòng chọn ngày và giờ thi!', 'error');
            return;
        }

        // Kiểm tra ngày thi phải trong tương lai hoặc hôm nay nhưng giờ chưa qua
        const examDateTime = new Date(`${examDate}T${examTime}`);
        const now = new Date();
        if (examDateTime <= now) {
            showAIAlert(' Ngày và giờ thi phải trong tương lai!', 'error');
            return;
        }
        
        const examResponse = await fetch(`http://localhost:3000/api/teacher/classes/${selectedClassForAI}/exams`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                examName: examName,
                examDate: examDate,
                examTime: examTime,
                duration: duration,
                description: description,
                shuffle_questions: document.getElementById('aiShuffleQuestions')?.checked ? 1 : 0,
                shuffle_options: document.getElementById('aiShuffleOptions')?.checked ? 1 : 0
            })
        });

        if (!examResponse.ok) {
            const errorData = await examResponse.json();
            throw new Error(errorData.error || 'Không thể tạo bài thi');
        }

        const examData = await examResponse.json();
        const examId = examData.exam?.exam_id || examData.exam_id;
        const examCode = examData.exam?.exam_code || examData.exam_code;

        if (!examId) {
            throw new Error('Không nhận được ID bài thi từ server');
        }

        // Bước 2: Thêm các câu hỏi vào exam
        let successCount = 0;
        let errorCount = 0;

        for (const q of aiGeneratedQuestions) {
            try {
                // Chuẩn hóa dữ liệu câu hỏi
                const questionData = {
                    question_content: q.questionText,
                    question_type: q.type,
                    difficulty: q.difficulty || 'Medium',
                    correct_answer_text: q.correctAnswer,
                    options: []
                };

                // Thêm options cho trắc nghiệm
                if ((q.type === 'SingleChoice' || q.type === 'MultipleChoice') && q.options && q.options.length > 0) {
                    const correctAnswers = q.correctAnswer.toUpperCase().split(',').map(a => a.trim());
                    questionData.options = q.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        return {
                            text: opt.replace(/^[A-Z]\.\s*/, ''), // Loại bỏ "A. " nếu có
                            is_correct: correctAnswers.includes(letter)
                        };
                    });
                }

                // Thêm câu hỏi vào ngân hàng câu hỏi
                const questionResponse = await fetch('http://localhost:3000/api/teacher/exams/question-bank', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(questionData)
                });

                if (!questionResponse.ok) {
                    const questionErrorText = await questionResponse.text();
                    let questionErrorMsg = 'Không thể thêm câu hỏi vào ngân hàng';
                    try {
                        const questionErrorData = JSON.parse(questionErrorText);
                        questionErrorMsg = questionErrorData.error || questionErrorData.message || questionErrorMsg;
                    } catch {
                        questionErrorMsg = questionErrorText.substring(0, 100) || questionErrorMsg;
                    }
                    throw new Error(questionErrorMsg);
                }

                const questionResult = await questionResponse.json();
                const questionId = questionResult.question_id || questionResult.question?.question_id;

                if (!questionId) {
                    throw new Error('Không nhận được ID câu hỏi');
                }

                // Gắn câu hỏi vào exam - sử dụng endpoint đúng với questionId trong URL
                const attachResponse = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/questions/${questionId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        points: q.points || 10
                    })
                });

                if (!attachResponse.ok) {
                    const attachErrorText = await attachResponse.text();
                    let attachErrorMsg = 'Không thể gắn câu hỏi vào bài thi';
                    try {
                        const attachErrorData = JSON.parse(attachErrorText);
                        attachErrorMsg = attachErrorData.error || attachErrorData.message || attachErrorMsg;
                    } catch {
                        attachErrorMsg = attachErrorText.substring(0, 100) || attachErrorMsg;
                    }
                    throw new Error(attachErrorMsg);
                }

                successCount++;
            } catch (error) {
                console.error('Error adding question:', error);
                errorCount++;
            }
        }

        if (successCount > 0) {
            showAIAlert(` Đã lưu thành công ${successCount}/${aiGeneratedQuestions.length} câu hỏi!${errorCount > 0 ? ` (${errorCount} lỗi)` : ''}`, 'success');
            
            // Hiển thị mã code nếu có
            if (examCode) {
                setTimeout(() => {
                    if (typeof showExamCodeModal === 'function') {
                        showExamCodeModal(examCode, examName);
                    }
                }, 500);
            }
            
            setTimeout(async () => {
                closeAIModal();
                if (typeof renderAllExams === 'function') {
                    await renderAllExams();
                } else if (typeof loadAllExams === 'function') {
                    await loadAllExams();
                } else if (typeof loadExams === 'function') {
                    await loadExams();
                }
                
            }, 2000);
        } else {
            throw new Error('Không thể lưu bất kỳ câu hỏi nào');
        }

    } catch (error) {
        console.error('Error:', error);
        showAIAlert(`❌ ${error.message}`, 'error');
    }
}

// Tải JSON
function downloadAIJSON() {
    if (aiGeneratedQuestions.length === 0) {
        showAIAlert('Không có câu hỏi nào để tải!', 'error');
        return;
    }

    const dataStr = JSON.stringify(aiGeneratedQuestions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_ai_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showAIAlert(' Đã tải xuống file JSON!', 'success');
}

// Hiển thị thông báo
function showAIAlert(message, type) {
    const container = document.getElementById('aiAlertContainer');
    if (!container) return;
    
    const alertHTML = `
        <div class="ai-alert ai-alert-${type}">
            ${message}
        </div>
    `;
    container.innerHTML = alertHTML;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Reset form
function resetAIForm() {
    const form = document.getElementById('aiExamForm');
    if (form) {
        form.reset();
    }
    const numQuestions = document.getElementById('aiNumQuestions');
    if (numQuestions) {
        numQuestions.value = 10;
    }
    const firstCheckbox = document.querySelector('input[name="aiQuestionType"]');
    if (firstCheckbox) {
        firstCheckbox.checked = true;
    }
    
    // Set giá trị mặc định cho ngày thi (ngày mai)
    const examDate = document.getElementById('aiExamDate');
    if (examDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        examDate.value = tomorrow.toISOString().split('T')[0];
    }
    
    // Set giá trị mặc định cho giờ và thời lượng
    const examTime = document.getElementById('aiExamTime');
    if (examTime) {
        examTime.value = '08:00';
    }
    
    const examDuration = document.getElementById('aiExamDuration');
    if (examDuration) {
        examDuration.value = 60;
    }
}

// Reset modal
function resetAIModal() {
    aiGeneratedQuestions = [];
    selectedClassForAI = null;
    const form = document.getElementById('aiExamForm');
    if (form) {
        form.style.display = 'block';
    }
    const result = document.getElementById('aiResult');
    if (result) {
        result.classList.remove('active');
    }
    const alertContainer = document.getElementById('aiAlertContainer');
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
    resetAIForm();
}

// Hàm đăng xuất
function logout() {
    if (confirm('🔒 Bạn có chắc muốn đăng xuất?')) {
        showNotification('👋 Đang đăng xuất...', 'info');
        
        // Xóa tất cả thông tin đăng nhập
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user_id');
        
        // Xóa session storage nếu có
        sessionStorage.clear();
        
        setTimeout(() => {
            // Dùng replace() thay vì href để không lưu vào history
            // Điều này ngăn người dùng bấm nút forward để quay lại dashboard
            window.location.replace('./login.html');
        }, 1000);
    }
}

// ============================================
// 📊 QUẢN LÝ TRẠNG THÁI NỘP BÀI CỦA HỌC SINH
// ============================================

let studentsStatusData = null;
let studentsStatusInterval = null;

// Chuyển tab trong exam detail
function switchExamDetailTab(tabName) {
    // Force log để debug
    if (window.console && window.console.log) {
        window.console.log('🔄 [switchExamDetailTab] Switching to tab:', tabName);
        window.console.log('🔄 [switchExamDetailTab] currentExam:', currentExam);
    }

    const questionsTab = document.getElementById('examQuestionsTab');
    const studentsStatusTab = document.getElementById('examStudentsStatusTab');
    const questionsTabBtn = document.querySelector('[data-tab="exam-questions"]');
    const studentsStatusTabBtn = document.querySelector('[data-tab="exam-students-status"]');

    console.log('🔄 [switchExamDetailTab] Elements found:', {
        questionsTab: !!questionsTab,
        studentsStatusTab: !!studentsStatusTab,
        questionsTabBtn: !!questionsTabBtn,
        studentsStatusTabBtn: !!studentsStatusTabBtn
    });

    // Clear any previous interval when switching tabs
    if (typeof studentsStatusInterval !== 'undefined' && studentsStatusInterval) {
        clearInterval(studentsStatusInterval);
        studentsStatusInterval = null;
    }

    if (tabName === 'questions') {
        // Show questions tab, hide students status
        if (questionsTab) {
            questionsTab.style.display = 'block';
            questionsTab.classList.add('active');
        }
        if (studentsStatusTab) {
            studentsStatusTab.style.display = 'none';
            studentsStatusTab.classList.remove('active');
        }
        if (questionsTabBtn) questionsTabBtn.classList.add('active');
        if (studentsStatusTabBtn) studentsStatusTabBtn.classList.remove('active');

        // Ensure questions render function runs
        try { renderExamQuestions(); } catch (err) { console.warn('renderExamQuestions error', err); }
        return;
    }

    // Tab: Trạng thái nộp bài
    if (tabName === 'students-status') {
        // Hiển thị tab
        if (questionsTab) {
            questionsTab.style.display = 'none';
            questionsTab.classList.remove('active');
        }
        if (studentsStatusTab) {
            studentsStatusTab.style.display = 'block';
            studentsStatusTab.classList.add('active');
        }
        if (questionsTabBtn) questionsTabBtn.classList.remove('active');
        if (studentsStatusTabBtn) studentsStatusTabBtn.classList.add('active');
        
        // Load dữ liệu
        const examId = currentExamId || (currentExam && currentExam.exam_id);
        if (examId) {
            loadStudentsStatusSimple(examId);
        }
        return;
    }

    // fallback: hide both
    if (questionsTab) { questionsTab.style.display = 'none'; questionsTab.classList.remove('active'); }
    if (studentsStatusTab) { studentsStatusTab.style.display = 'none'; studentsStatusTab.classList.remove('active'); }
}

// ============================================
// 👥 TRẠNG THÁI NỘP BÀI - CODE MỚI ĐƠN GIẢN
// ============================================

// Load trạng thái nộp bài của học sinh
async function loadStudentsStatusSimple(examId) {
    if (!examId) {
        console.error('❌ Không có exam ID');
        return;
    }
    
    const token = localStorage.getItem('token');
    const statsContainer = document.getElementById('examStatusStats');
    const listContainer = document.getElementById('examStudentsStatusList');
    
    if (!statsContainer || !listContainer) {
        console.error('❌ Không tìm thấy containers');
        return;
    }
    
    // Hiển thị loading
    statsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Đang tải...</div>';
    listContainer.innerHTML = '<div style="text-align: center; padding: 20px;">⏳ Đang tải...</div>';
    
    try {
        const response = await fetch(`http://localhost:3000/api/teacher/monitoring/${examId}/students-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải dữ liệu');
        }
        
        const data = await response.json();
        
        // Render thống kê
        renderStatsSimple(data.stats || {});
        
        // Render danh sách học sinh
        renderStudentsListSimple(data.students || [], data.exam || {});
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #e53e3e;">
                <p>❌ ${error.message}</p>
                <button class="btn btn-primary" onclick="loadStudentsStatusSimple(${examId})" style="margin-top: 10px;">
                    🔄 Thử lại
                </button>
            </div>
        `;
    }
}

// Render thống kê
function renderStatsSimple(stats) {
    const container = document.getElementById('examStatusStats');
    if (!container) return;
    
    container.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${stats.total_students || 0}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">Tổng số học sinh</div>
        </div>
        <div style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${stats.in_progress || 0}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">Đang làm bài</div>
        </div>
        <div style="background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${stats.submitted || 0}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">Đã nộp bài</div>
        </div>
        <div style="background: linear-gradient(135deg, #718096 0%, #4a5568 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
            <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${stats.not_started || 0}</div>
            <div style="font-size: 0.9rem; opacity: 0.9;">Chưa bắt đầu</div>
        </div>
    `;
}

// Render danh sách học sinh
function renderStudentsListSimple(students, exam) {
    const container = document.getElementById('examStudentsStatusList');
    if (!container) return;
    
    if (!students || students.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">📝 Chưa có học sinh nào</div>';
        return;
    }
    
    container.innerHTML = students.map(student => {
        const statusBadge = `
            <span style="padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: ${student.status_color || '#718096'}; color: white;">
                ${student.status_text || 'Chưa bắt đầu'}
            </span>
        `;
        
        let scoreInfo = '';
        if (student.score !== null && student.score !== undefined) {
            scoreInfo = `
                <div style="margin-top: 8px;">
                    <span style="font-size: 1.2rem; font-weight: 700; color: #38a169;">
                        ${student.score} điểm
                    </span>
                    ${exam.total_points > 0 ? `<span style="color: #718096; font-size: 0.9rem;">/ ${exam.total_points}</span>` : ''}
                </div>
            `;
        }
        
        return `
            <div class="student-status-card" style="background: white; border: 2px solid ${student.status_color || '#e2e8f0'}; border-radius: 12px; padding: 20px;" data-status="${student.status || 'not_started'}" data-name="${(student.full_name || '').toLowerCase()}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <div style="font-size: 1.1rem; font-weight: 600; color: #2d3748; margin-bottom: 5px;">
                            ${student.full_name || 'Không có tên'}
                        </div>
                        <div style="color: #718096; font-size: 0.9rem;">
                            ${student.email || student.username || ''}
                        </div>
                    </div>
                    <div>
                        ${statusBadge}
                    </div>
                </div>
                ${scoreInfo}
            </div>
        `;
    }).join('');
}

// Làm mới dữ liệu
function refreshStudentsStatus() {
    const examId = currentExamId || (currentExam && currentExam.exam_id);
    if (examId) {
        loadStudentsStatusSimple(examId);
    }
}

// Lọc học sinh
function filterStudentStatus() {
    const searchInput = document.getElementById('searchStudentStatus');
    const filterSelect = document.getElementById('filterStudentStatus');
    const cards = document.querySelectorAll('.student-status-card');
    
    const searchTerm = (searchInput?.value || '').toLowerCase();
    const filterValue = filterSelect?.value || 'all';
    
    cards.forEach(card => {
        const status = card.getAttribute('data-status') || '';
        const name = card.getAttribute('data-name') || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesFilter = filterValue === 'all' || status === filterValue;
        
        card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
    });
}

// Render danh sách câu hỏi
function renderExamQuestions() {
    const questionsContainer = document.getElementById('examDetailQuestions');
    if (!questionsContainer) {
        console.error('❌ Không tìm thấy container câu hỏi');
        return;
    }
    
    if (!currentExam) {
        console.error('❌ currentExam không tồn tại');
        questionsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #718096;">
                <p>❌ Không có dữ liệu bài thi</p>
            </div>
        `;
        return;
    }
    
    if (currentExam.questions && currentExam.questions.length > 0) {
        renderQuestionsList(questionsContainer, currentExam.questions, currentExam.exam_id);
    } else {
        questionsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #718096;">
                <p>📝 Chưa có câu hỏi nào trong bài thi này</p>
            </div>
        `;
    }
}

// ============================================
// CODE CŨ - ĐÃ XÓA, DÙNG loadStudentsStatusSimple
// ============================================

// Load trạng thái học sinh từ API (CŨ - KHÔNG DÙNG)
async function loadStudentsStatus_OLD(examId) {
    console.log('🔄 [loadStudentsStatus] Called with examId:', examId);
    
    if (!examId) {
        console.error('❌ Exam ID không tồn tại');
        alert('Lỗi: Exam ID = ' + examId);
        return;
    }
    
    const token = localStorage.getItem('token');
    const statsContainer = document.getElementById('examStatusStats');
    const listContainer = document.getElementById('examStudentsStatusList');
    
    console.log('🔍 [loadStudentsStatus] Containers:', {
        listContainer: !!listContainer,
        statsContainer: !!statsContainer
    });
    
    if (!listContainer || !statsContainer) {
        console.error('❌ Không tìm thấy containers trong loadStudentsStatus');
        alert('Lỗi: Containers không tìm thấy trong loadStudentsStatus!');
        return;
    }
    
    try {
        // Hiển thị loading
        listContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">⏳ Đang tải...</div>';
        if (statsContainer) {
            statsContainer.innerHTML = '';
        }
        
        const response = await fetch(`http://localhost:3000/api/teacher/monitoring/${examId}/students-status`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải trạng thái học sinh');
        }
        
        const data = await response.json();
        studentsStatusData = data;
        
        console.log('✅ API response received:', {
            stats: data.stats,
            studentsCount: data.students?.length
        });
        
        // ✅ Render thống kê
        renderStudentsStatusStats(data.stats || {});
        
        // ✅ Render danh sách học sinh
        renderStudentsStatusList(data.students || [], data.exam || {});
        
        // Tự động refresh mỗi 10 giây nếu bài thi đang diễn ra
        if (data.exam.exam_status === 'active') {
            if (studentsStatusInterval) {
                clearInterval(studentsStatusInterval);
            }
            studentsStatusInterval = setInterval(() => {
                loadStudentsStatus(examId);
            }, 10000); // 10 giây
        } else {
            if (studentsStatusInterval) {
                clearInterval(studentsStatusInterval);
                studentsStatusInterval = null;
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading students status:', error);
        if (listContainer) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e53e3e;">
                    <p>❌ ${error.message}</p>
                    <button class="btn btn-primary" onclick="loadStudentsStatus(${examId})" style="margin-top: 10px;">
                        🔄 Thử lại
                    </button>
                </div>
            `;
        }
    }
}

// Render thống kê (CŨ - KHÔNG DÙNG)
function renderStudentsStatusStats_OLD(stats) {
    const container = document.getElementById('examStatusStats');
    if (!container || !document.body.contains(container)) {
        console.error('❌ [renderStudentsStatusStats] Container không tồn tại hoặc không trong DOM');
        return;
    }
    
    // Đảm bảo stats có giá trị mặc định
    const safeStats = {
        total_students: stats?.total_students || 0,
        in_progress: stats?.in_progress || 0,
        submitted: stats?.submitted || 0,
        not_started: stats?.not_started || 0
    };
    
    try {
        container.innerHTML = `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${safeStats.total_students}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Tổng số học sinh</div>
            </div>
            <div style="background: linear-gradient(135deg, #3182ce 0%, #2c5282 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${safeStats.in_progress}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Đang làm bài</div>
            </div>
            <div style="background: linear-gradient(135deg, #38a169 0%, #2f855a 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${safeStats.submitted}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Đã nộp bài</div>
            </div>
            <div style="background: linear-gradient(135deg, #718096 0%, #4a5568 100%); color: white; padding: 20px; border-radius: 12px; text-align: center;">
                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 5px;">${safeStats.not_started}</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Chưa bắt đầu</div>
            </div>
        `;
    } catch (error) {
        console.error('❌ [renderStudentsStatusStats] Lỗi khi render:', error);
    }
}

// Render danh sách học sinh (CŨ - KHÔNG DÙNG)
function renderStudentsStatusList_OLD(students, exam) {
    const container = document.getElementById('examStudentsStatusList');
    if (!container || !document.body.contains(container)) {
        console.error('❌ [renderStudentsStatusList] Container không tồn tại hoặc không trong DOM');
        return;
    }
    
    // Đảm bảo students là array
    const safeStudents = Array.isArray(students) ? students : [];
    const safeExam = exam || {};
    
    if (safeStudents.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">📝 Chưa có học sinh nào</div>';
        return;
    }
    
    try {
        container.innerHTML = safeStudents.map(student => {
        const statusBadge = `
            <span style="padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; background: ${student.status_color}; color: white;">
                ${student.status_text}
            </span>
        `;
        
        let timeInfo = '';
        if (student.status === 'InProgress' && student.time_remaining !== null) {
            const minutes = Math.floor(student.time_remaining / 60);
            const seconds = student.time_remaining % 60;
            timeInfo = `
                <div style="margin-top: 8px; color: #e53e3e; font-weight: 600;">
                    ⏱️ Còn lại: ${minutes}:${seconds.toString().padStart(2, '0')}
                </div>
            `;
        } else if (student.start_time) {
            const startTime = new Date(student.start_time);
            timeInfo = `
                <div style="margin-top: 8px; color: #718096; font-size: 0.9rem;">
                    🕐 Bắt đầu: ${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
            `;
        }
        
        let scoreInfo = '';
        if (student.score !== null) {
            scoreInfo = `
                <div style="margin-top: 8px;">
                    <span style="font-size: 1.2rem; font-weight: 700; color: #38a169;">
                        ${student.score} điểm
                    </span>
                    ${exam.total_points > 0 ? `<span style="color: #718096; font-size: 0.9rem;">/ ${exam.total_points}</span>` : ''}
                </div>
            `;
        }
        
        let progressBar = '';
        if (student.status === 'InProgress' && student.total_questions > 0) {
            progressBar = `
                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.85rem; color: #718096;">
                        <span>Tiến độ: ${student.answered_count}/${student.total_questions} câu</span>
                        <span>${student.progress}%</span>
                    </div>
                    <div style="background: #e2e8f0; border-radius: 10px; height: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #3182ce 0%, #2c5282 100%); height: 100%; width: ${student.progress}%; transition: width 0.3s;"></div>
                    </div>
                </div>
            `;
        }
        
        let warningBadges = '';
        if (student.is_banned) {
            warningBadges += '<span style="background: #e53e3e; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 5px;">🚫 Bị cấm</span>';
        }
        if (student.cheating_detected) {
            warningBadges += '<span style="background: #d69e2e; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 5px;">⚠️ Gian lận</span>';
        }
        if (student.penalty_amount > 0) {
            warningBadges += `<span style="background: #ed8936; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; margin-left: 5px;">-${student.penalty_amount} điểm</span>`;
        }
        
        return `
            <div class="student-status-card" style="background: white; border: 2px solid ${student.status_color || '#e2e8f0'}; border-radius: 12px; padding: 20px; transition: all 0.3s;" data-status="${student.status}" data-name="${student.full_name.toLowerCase()}">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div style="flex: 1;">
                        <div style="font-size: 1.1rem; font-weight: 600; color: #2d3748; margin-bottom: 5px;">
                            ${student.full_name}
                            ${warningBadges}
                        </div>
                        <div style="color: #718096; font-size: 0.9rem;">
                            ${student.email || student.username}
                        </div>
                    </div>
                    <div>
                        ${statusBadge}
                    </div>
                </div>
                ${timeInfo}
                ${scoreInfo}
                ${progressBar}
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('❌ [renderStudentsStatusList] Lỗi khi render:', error);
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #e53e3e;">❌ Lỗi khi hiển thị danh sách học sinh</div>';
    }
}

// Lọc học sinh theo trạng thái và tên
function filterStudentStatus() {
    const searchInput = document.getElementById('searchStudentStatus');
    const filterSelect = document.getElementById('filterStudentStatus');
    const cards = document.querySelectorAll('.student-status-card');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filterValue = filterSelect ? filterSelect.value : 'all';
    
    cards.forEach(card => {
        const status = card.getAttribute('data-status');
        const name = card.getAttribute('data-name') || '';
        
        const matchesSearch = name.includes(searchTerm);
        const matchesFilter = filterValue === 'all' || status === filterValue || 
                            (filterValue === 'banned' && card.innerHTML.includes('Bị cấm'));
        
        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Làm mới trạng thái học sinh
function refreshStudentsStatus() {
    // Ưu tiên dùng currentExamId
    const examId = currentExamId || (currentExam && currentExam.exam_id);
    
    if (examId) {
        loadStudentsStatus(examId);
        showNotification('🔄 Đang làm mới dữ liệu...', 'info');
    } else {
        console.error('❌ Không tìm thấy exam_id để refresh');
        showNotification('❌ Không tìm thấy ID bài thi', 'error');
    }
}
