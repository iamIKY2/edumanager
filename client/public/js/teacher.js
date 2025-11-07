// /client/public/js/teacher.js
//  CHỈ HIỂN THỊ LOG LỖI
const originalLog = console.log;
const originalWarn = console.warn;

console.log = function(...args) {
    const firstArg = String(args[0] || '');
    if (firstArg.includes('❌') || firstArg.toLowerCase().includes('error')) {
        originalLog.apply(console, args);
    }
};

console.warn = function(...args) {
    const firstArg = String(args[0] || '');
    if (firstArg.includes('⚠️')) {
        originalWarn.apply(console, args);
    }
};


// Data storage

let appData = {
    classes: [],
    students: [],
    exams: [],
    currentClassId: null,
    currentChart: null
};

let unreadCount = 0;
function formatScore(score) {
    if (!score || isNaN(score)) return '0';
    return parseFloat(score).toFixed(1);
}

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role')?.toLowerCase();

    if (!token || role !== 'teacher') {
        showNotification('❌ Vui lòng đăng nhập để truy cập dashboard!', 'error');
        setTimeout(() => window.location.href = './login.html', 1500);
        return;
    }

    const socket = io('http://localhost:3000', {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('Connected to Socket.io');
        const userId = localStorage.getItem('user_id');
        // Chỉ emit join nếu userId hợp lệ
        if (userId && userId !== 'null' && userId !== 'undefined') {
            socket.emit('join', `user_${userId}`);
        } else {
            console.warn('⚠️ [Socket] Cannot join room: userId is invalid');
        }
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
});

//
async function handleAddExam(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    console.log('🔵 Creating exam...');

    try {
        const response = await fetch(`http://localhost:3000/api/classes/${appData.currentClassId}/exams`, {
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
                description: formData.get('description')
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tạo bài thi');
        }

        const result = await response.json();
        console.log('✅ Exam created:', result);
        
        // Hiển thị mã code bài thi cho giáo viên
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
        
        // Fetch lại exams từ server
        const examsResponse = await fetch(`http://localhost:3000/api/classes/${appData.currentClassId}/exams`, {
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
        
        // Chuyển sang tab Bài thi
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('.tab[data-tab="exams"]').classList.add('active');
        document.getElementById('exams-tab').classList.add('active');
        
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
                    <button class="btn btn-small btn-primary" onclick="viewExamDetail(${exam.exam_id})">Xem chi tiết</button>
                    <button class="btn btn-small btn-secondary" onclick="editExam(${exam.exam_id})">Chỉnh sửa</button>
                    <button class="btn btn-small btn-danger" onclick="deleteExam(${exam.exam_id}, event)">Xóa</button>
                </div>
            </div>
        `;
    }).join('');
}

function showNotifications() {
    fetchNotifications();
    const notificationList = document.querySelector('#notifications .notification-list');
    const popup = document.createElement('div');
    popup.className = 'notification-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Thông báo nhận được</h3>
            <div class="notification-list">${notificationList.innerHTML}</div>
            <button class="btn btn-secondary" onclick="this.parentElement.parentElement.remove()">Đóng</button>
        </div>
    `;
    document.body.appendChild(popup);
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
    document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
    
   document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        const section = this.dataset.section;
        navigateTo(section);
        
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
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
            switchTab(tabName);
        });
    });

    document.getElementById('searchStudent').addEventListener('input', function(e) {
        filterStudents(e.target.value);
    });

    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                sidebar.classList.remove('open');
            }
        }
    });
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
        fetchNotifications();
    }

    if (section === 'statistics') {
        loadStatistics();
    }    

    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
}
// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('closed');
        mainContent.classList.toggle('expanded');
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
        appData.classes = classes;
        
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

const examCountInClass = appData.exams.filter(e => e.class_id === classId).length;
document.getElementById('examCount').textContent = examCountInClass;
    
    renderStudents();
    renderGrades();


function backToClassList() {
    document.getElementById('classList').style.display = 'block';
    document.getElementById('classDetail').classList.remove('active');
    document.getElementById('createClassForm').style.display = 'none';
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('addExamForm').style.display = 'none';
    appData.currentClassId = null;
}

function showCreateClass() {
    document.getElementById('classList').style.display = 'none';
    document.getElementById('classDetail').classList.remove('active');
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
    showNotification('Tính năng chỉnh sửa lớp đang được phát triển', 'info');
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');
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

// hàm back to exam list fix lỗi 
function backToExamList() {
    if (examDetailContext === 'exams') {
        const modal = document.getElementById('examDetailModal');
        if (modal) modal.style.display = 'none';
    } else {
        const examDetail = document.getElementById('examDetail');
        const editExamForm = document.getElementById('editExamForm');
        const examListContainer = document.getElementById('examListContainer');
        
        if (examDetail) examDetail.style.display = 'none';
        if (editExamForm) editExamForm.style.display = 'none';
        if (examListContainer) examListContainer.style.display = 'block';
    }
    
    currentExam = null;
    examDetailContext = 'class';
}

function closeExamDetailModal() {
    const modal = document.getElementById('examDetailModal');
    if (modal) modal.style.display = 'none';
    currentExam = null;
    examDetailContext = 'class';
}

// Hàm hiển thị form chỉnh sửa bài thi
function showEditExam() {
    if (!currentExam) {
        showNotification('Không tìm thấy thông tin bài thi', 'error');
        return;
    }

    // Điền thông tin vào form
    const form = document.getElementById('editExamFormContent');
    if (form) {
        form.examId.value = currentExam.exam_id;
        form.examName.value = currentExam.title || currentExam.exam_name;
        form.examDate.value = new Date(currentExam.start_time).toISOString().split('T')[0];
        form.examTime.value = new Date(currentExam.start_time).toISOString().split('T')[1].slice(0, 5);
        form.duration.value = currentExam.duration;
        form.description.value = currentExam.description || '';
        form.status.value = currentExam.status;
    }

    // Hiển thị danh sách câu hỏi
    const questionsContainer = document.getElementById('editExamQuestions');
    if (questionsContainer) {
        questionsContainer.innerHTML = '';
        if (currentExam.questions && currentExam.questions.length > 0) {
            currentExam.questions.forEach((q, index) => {
                const questionDiv = document.createElement('div');
                questionDiv.className = 'question-item';
                questionDiv.innerHTML = `
                    <p><strong>Câu ${index + 1} (${q.points} điểm):</strong> ${q.question_content}</p>
                    <p><strong>Loại:</strong> ${q.question_type}</p>
                    <p><strong>Độ khó:</strong> ${q.difficulty}</p>
                    ${q.options && q.options.length > 0 ? `
                        <div class="options">
                            ${q.options.map((opt, i) => `
                                <p class="option ${opt.is_correct ? 'correct' : ''}">
                                    ${String.fromCharCode(65 + i)}. ${opt.option_content}
                                    ${opt.is_correct ? '(Đúng)' : ''}
                                </p>
                            `).join('')}
                        </div>
                    ` : ''}
                    <p><strong>Đáp án đúng:</strong> ${q.correct_answer_text}</p>
                    <div class="actions">
                        <button class="btn btn-secondary btn-small" onclick="showEditQuestionModal(${q.question_id})">✏️ Sửa</button>
                        <button class="btn btn-danger btn-small" onclick="deleteQuestion(${currentExam.exam_id}, ${q.question_id})">🗑️ Xóa</button>
                    </div>
                `;
                questionsContainer.appendChild(questionDiv);
            });
        } else {
            questionsContainer.innerHTML = '<p>Chưa có câu hỏi nào trong bài thi.</p>';
        }
    }

    //  Toggle display
    const examDetail = document.getElementById('examDetail');
    const editExamForm = document.getElementById('editExamForm');
    
    if (examDetail) {
        examDetail.style.display = 'none';
        examDetail.style.visibility = 'hidden';
    }
    if (editExamForm) {
        editExamForm.style.display = 'block';
        editExamForm.style.visibility = 'visible';
        editExamForm.style.opacity = '1';
    }
}

// Hàm ẩn form chỉnh sửa bài thi
function hideEditExam() {
    const examDetail = document.getElementById('examDetail');
    const editExamForm = document.getElementById('editExamForm');
    
    if (editExamForm) {
        editExamForm.style.display = 'none';
        editExamForm.style.visibility = 'hidden';
    }
    if (examDetail) {
        examDetail.style.display = 'block';
        examDetail.style.visibility = 'visible';
        examDetail.style.opacity = '1';
    }
}

// Hàm xử lý lưu chỉnh sửa bài thi
async function handleEditExam(event) {
    event.preventDefault();
    const form = event.target;
    const examId = form.examId.value;
    const examData = {
        examName: form.examName.value,
        examDate: form.examDate.value,
        examTime: form.examTime.value,
        duration: parseInt(form.duration.value),
        description: form.description.value,
        status: form.status.value
    };

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

        showNotification('✅ Cập nhật bài thi thành công', 'success');
        await viewExamDetail(examId); 
    } catch (err) {
        console.error('Error updating exam:', err);
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
    if (!confirm('Bạn có chắc muốn xóa bài thi này?')) return;

    const token = localStorage.getItem('token');
    try {
                const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Phản hồi không phải JSON, có thể server trả về HTML');
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi xóa bài thi');
        }

        appData.exams = appData.exams.filter(e => e.exam_id !== examId);
        const cls = appData.classes.find(c => c.class_id === appData.currentClassId);
        if (cls && cls.exams > 0) cls.exams--;
        
        renderExams();
        renderAllExams();
        renderDashboard();
        updateDashboardStats();
        showNotification('✅ Đã xóa bài thi');
    } catch (error) {
        console.error('Lỗi trong deleteExam:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}


//  RENDER BẢNG ĐIỂM - HIỂN THỊ ĐIỂM TỪNG KỲ THI

async function renderGrades() {
    const container = document.getElementById('grades-tab');
    const token = localStorage.getItem('token');
    
    if (!container) {
        console.error('❌ [Grades] Container not found');
        return;
    }
    
    // Hiển thị loading
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 15px;">⏳</div>
            <div>Đang tải bảng điểm...</div>
        </div>
    `;
    
    try {
        // 1. Lấy danh sách học sinh
        
        const studentsResponse = await fetch(
            `http://localhost:3000/api/teacher/classes/${appData.currentClassId}/students`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (!studentsResponse.ok) {
            const errorData = await studentsResponse.json();
            throw new Error(errorData.error || 'Lỗi tải danh sách học sinh');
        }
        
        const students = await studentsResponse.json();
        console.log('✅ [Grades] Students loaded:', students.length);
        
        // 2. Lấy danh sách bài thi của lớp
        console.log('🔵 [Grades] Loading exams for class:', appData.currentClassId);
        
        const examsResponse = await fetch(
            `http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, 
            { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (!examsResponse.ok) {
            const errorData = await examsResponse.json();
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

// Notifications
function handleSendNotification(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    showNotification('✅ Đã gửi thông báo thành công!');
    event.target.reset();
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
        selectExam.innerHTML = '<option value="">Chọn bài thi</option>' + 
            classExams.map(exam => `<option value="${exam.exam_id}">${exam.title || exam.exam_name}</option>`).join('');
        resultContainer.innerHTML = `
            <h4>Chọn bài thi để import câu hỏi</h4>
            ${selectExam.outerHTML}
            <button class="btn btn-primary" onclick="proceedWithImport(this, '${fileInput.id}')">Xác nhận</button>
        `;
        fileInput.value = ''; 
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

// Hàm xử lý import sau khi chọn examId
async function proceedWithImport(buttonEl, inputId, examId, file) {
    const fileInput = document.getElementById(inputId);
    if (!file && !fileInput.files[0]) {
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

        // Hiển thị kết quả
        resultContainer.style.display = 'block';
        messageEl.textContent = 'Import hoàn tất!';
        successCountEl.textContent = `Số câu hỏi import thành công: ${result.successCount || 0}`;
        errorCountEl.textContent = `Số lỗi: ${result.errorCount || 0}`;
        errorsEl.innerHTML = result.errors && result.errors.length > 0
            ? result.errors.map(err => `<div>${err}</div>`).join('')
            : 'Không có lỗi';

        // Cập nhật danh sách bài thi
        if (isClassContext) {
            await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json()).then(classExams => {
                appData.exams = appData.exams.filter(e => e.class_id !== appData.currentClassId);
                appData.exams.push(...classExams);
                renderExams();
            });
        } else {
            await renderAllExams();
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
        const response = await fetch('/api/anti-cheating/ban-student', {
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
    
    const examListContainer = document.getElementById('gradingExamList');
    
    if (!examListContainer) {
        console.error('❌ [Grading] #gradingExamList not found!');
        return;
    }
    
    // Show loading
    examListContainer.innerHTML = `
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
        
        // Render exam list
        if (!data.attempts || data.attempts.length === 0) {
            examListContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">Không có bài thi nào cần chấm</div>
                    <div class="empty-state-subtext">Tất cả bài thi đã được chấm điểm</div>
                </div>
            `;
            console.log('ℹ️ [Grading] No attempts to grade');
            return;
        }
        
        console.log('🔵 [Grading] Rendering', data.attempts.length, 'attempts...');
        
        examListContainer.innerHTML = data.attempts.map(attempt => {
            console.log('🔵 [Grading] Rendering attempt:', attempt);
            
            return `
                <div class="exam-item" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; background: #f7fafc; transition: all 0.3s;">
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
                        <button class="btn btn-primary" onclick="startGrading(${attempt.attempt_id}, ${attempt.exam_id})" style="padding: 10px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                            ✍️ Chấm bài
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ [Grading] Section rendered successfully!');
        
    } catch (error) {
        console.error('❌ [Grading] Error:', error);
        examListContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải danh sách bài cần chấm</div>
                <div class="empty-state-subtext">${error.message}</div>
                <button class="btn btn-primary" onclick="loadGradingSection()" style="margin-top: 15px;">
                    🔄 Thử lại
                </button>
            </div>
        `;
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
    let modal = document.getElementById('gradingModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'gradingModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    const ungraded = data.answers.filter(a => 
        !a.is_graded && (a.question_type === 'Essay' || a.question_type === 'FillInBlank')
    );
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
            <div class="modal-header">
                <h3>✍️ Chấm bài: ${data.exam_name}</h3>
                <span class="close" onclick="closeGradingModal()">&times;</span>
            </div>
            
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong>👤 Học sinh:</strong> ${data.student_name}
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
            </div>
            
            <form id="gradingForm" onsubmit="submitGrading(event, ${data.attempt_id})">
                ${ungraded.map((answer, index) => `
                    <div class="card" style="margin-bottom: 20px; border-left: 4px solid #667eea;">
                        <h4 style="margin-bottom: 15px; color: #2d3748;">
                            Câu ${index + 1}: ${answer.question_content}
                        </h4>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>Loại:</strong> 
                            <span class="tag">${answer.question_type === 'Essay' ? 'Tự luận' : 'Điền khẩu'}</span>
                            <span class="tag" style="background: #4299e1;">Độ khó: ${answer.difficulty}</span>
                            <span class="tag" style="background: #48bb78;">Điểm tối đa: ${answer.points}</span>
                        </div>
                        
                        ${answer.correct_answer_text ? `
                            <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #26de81;">
                                <strong style="color: #2d3748;">✅ Đáp án gợi ý:</strong>
                                <div style="margin-top: 8px; color: #2d3748;">${answer.correct_answer_text}</div>
                            </div>
                        ` : ''}
                        
                        <div style="background: #fff5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                            <strong style="color: #2d3748;">📝 Câu trả lời của học sinh:</strong>
                            <div style="margin-top: 8px; color: #2d3748; white-space: pre-wrap;">
                                ${answer.answer_text || '<em style="color: #cbd5e0;">Học sinh chưa trả lời</em>'}
                            </div>
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
                                required
                                style="max-width: 150px;"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label><strong>Nhận xét:</strong> (Không bắt buộc)</label>
                            <textarea 
                                name="comment_${answer.question_id}" 
                                rows="3" 
                                class="input-field"
                                placeholder="Nhập nhận xét cho học sinh..."
                            ></textarea>
                        </div>
                    </div>
                `).join('')}
                
                ${ungraded.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-state-icon">✅</div>
                        <div class="empty-state-text">Tất cả câu hỏi đã được chấm</div>
                    </div>
                ` : ''}
                
                <div style="margin-top: 30px; display: flex; gap: 15px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="closeGradingModal()">
                        Hủy
                    </button>
                    <button type="submit" class="btn btn-success" ${ungraded.length === 0 ? 'disabled' : ''}>
                        💾 Lưu điểm
                    </button>
                </div>
            </form>
        </div>
    `;
    
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
            body: JSON.stringify({ grades })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi khi lưu điểm');
        }
        
        const result = await response.json();
        console.log('✅ Grading submitted:', result);
        
        showNotification('✅ Đã lưu điểm thành công!', 'success');
        closeGradingModal();
        
        await loadGradingSection();
        
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
                description: desc || 'Đề thi tạo thủ công'
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
        await renderAllExams(); 
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
                description: 'Tạo từ ngân hàng câu hỏi'
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
        await renderAllExams();
        
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
                            <button class="btn btn-small btn-primary" onclick="viewExamDetail(${exam.exam_id})">📋 Chi tiết</button>
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
    
    try {
        // Fetch chi tiết bài thi
        const response = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/detail`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Lỗi tải chi tiết bài thi');
        }
        
        const exam = await response.json();
        
        // Xử lý theo context
        if (context === 'exams') {
            // Hiển thị trong modal
            showExamDetailModal(exam);
        } else {
            // Hiển thị trong phần class detail
            showExamDetailInClass(exam);
        }
        
    } catch (error) {
        console.error('❌ Error loading exam detail:', error);
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
    
    // Ẩn danh sách, hiển thị chi tiết
    examListContainer.style.display = 'none';
    examDetail.style.display = 'block';
    
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
    
    // Render danh sách câu hỏi
    const questionsContainer = document.getElementById('examDetailQuestions');
    if (exam.questions && exam.questions.length > 0) {
        renderQuestionsList(questionsContainer, exam.questions, exam.exam_id);
    } else {
        questionsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #718096;">
                <p>📝 Chưa có câu hỏi nào trong bài thi này</p>
            </div>
        `;
    }
    
    // Lưu exam hiện tại để dùng cho các hàm khác
    currentExam = exam;
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
        showNotification('❌ Không tìm thấy mã code!', 'error');
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
            showNotification('❌ Không thể copy mã code. Vui lòng copy thủ công!', 'error');
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
            showNotification('❌ Không thể copy mã code. Vui lòng copy thủ công!', 'error');
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
        document.getElementById('sidebar').classList.remove('open');
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
