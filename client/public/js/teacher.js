// /client/public/js/teacher.js
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
        
        showNotification('✅ Thêm bài thi thành công!');
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
    fetchNotifications(); // Lấy danh sách thông báo
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

// Fetch classes from API
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
    console.log('🔵 Navigating to:', section);
    
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
        console.log('✅ Showing:', section);
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
        appData.classes = classes; // Lưu vào appData
        
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
    } catch (error) {
        console.error('Lỗi trong renderDashboard:', error);
        showNotification(`❌ ${error.message}`, 'error');
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
        
        // 1. Fetch students
        const studentsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${classId}/students`, {  
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!studentsResponse.ok) {
            throw new Error('Lỗi tải danh sách học sinh');
        }
        
        appData.students = await studentsResponse.json();
        document.getElementById('studentCount').textContent = appData.students.length;
        
       // 2. Fetch exams
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

// Cập nhật examCount sau khi renderExams đã fetch xong
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
    const list = document.getElementById('allExamsList');
    const token = localStorage.getItem('token');

    // Hiển thị loading
    list.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 15px;">⏳</div>
            <div>Đang tải danh sách bài thi...</div>
        </div>
    `;

    try {
        console.log('🔵 Fetching all exams...');
        
        const response = await fetch('http://localhost:3000/api/teacher/exams/all', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}: Lỗi tải danh sách bài thi`);
        }

        const allExams = await response.json();
        console.log('✅ All exams loaded:', allExams.length, 'exams');
        console.log('📊 Data:', allExams);

        if (!Array.isArray(allExams)) {
            throw new Error('Dữ liệu trả về không phải mảng');
        }

        if (allExams.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-text">Chưa có bài thi nào</div>
                    <div class="empty-state-subtext">Tạo bài thi mới để bắt đầu</div>
                </div>
            `;
            return;
        }

        list.innerHTML = allExams.map(exam => {
            const statusText = {
                'upcoming': 'Sắp diễn ra',
                'active': 'Đang diễn ra',
                'completed': 'Đã kết thúc',
                'draft': 'Nháp'
            };
            
            const statusColors = {
                'upcoming': '#ffa502',
                'active': '#26de81',
                'completed': '#95a5a6',
                'draft': '#a29bfe'
            };
            
            // Format date từ start_time hoặc exam_date
            let examDate = 'Chưa có ngày';
            const dateStr = exam.start_time || exam.exam_date;
            if (dateStr) {
                try {
                    const date = new Date(dateStr);
                    examDate = date.toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } catch (e) {
                    console.error('Date parse error:', e);
                    examDate = dateStr; // Fallback
                }
            }
            
            const status = exam.status || 'draft';
            
            return `
                <div class="exam-item" style="border-left: 4px solid ${statusColors[status]};">
                    <div class="exam-header">
                        <div>
                            <div class="exam-title">${exam.title || exam.exam_name || 'Không có tên'}</div>
                            <div class="exam-meta">
                                <span>🏫 ${exam.class_name || 'Chưa gán lớp'}</span>
                                <span>📅 ${examDate}</span>
                                <span>⏱️ ${exam.duration || 0} phút</span>
                                <span>👥 ${exam.submissions || 0} bài nộp</span>
                            </div>
                        </div>
                        <span class="exam-status status-${status}">${statusText[status] || 'Không rõ'}</span>
                    </div>
                    <div class="exam-actions">
                        <button class="btn btn-small btn-primary" onclick="viewExamDetail(${exam.exam_id})">Xem chi tiết</button>
                        <button class="btn btn-small btn-secondary" onclick="editExam(${exam.exam_id})">Chỉnh sửa</button>
                        <button class="btn btn-small btn-danger" onclick="deleteExam(${exam.exam_id}, event)">Xóa</button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('✅ Rendered successfully!');

    } catch (error) {
        console.error('❌ Error in renderAllExams:', error);
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải danh sách bài thi</div>
                <div class="empty-state-subtext">${error.message}</div>
                <button class="btn btn-primary" onclick="renderAllExams()" style="margin-top: 15px;">🔄 Thử lại</button>
            </div>
        `;
    }
}

function showAddExam() {
    document.getElementById('classDetail').classList.remove('active');
    document.getElementById('addExamForm').style.display = 'block';
}

async function handleAddExam(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');

    console.log('🔵 Creating exam for class:', appData.currentClassId);

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
                duration: formData.get('duration'),
                description: formData.get('description'),
                status: formData.get('status')
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi tạo bài thi');
        }

        const result = await response.json();
        console.log('✅ Exam created:', result);
        
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
        
        // Cập nhật class data
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
        
        showNotification('✅ Thêm bài thi thành công!');
        event.target.reset();
    } catch (error) {
        console.error('❌ Error:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

function hideAddExam() {
    document.getElementById('addExamForm').style.display = 'none';
    document.getElementById('classDetail').classList.add('active');
}


async function renderExams() {
    const list = document.getElementById('examList');
    
    if (!appData.exams) {
        appData.exams = [];
    }
    
    const classExams = appData.exams.filter(e => e.class_id === appData.currentClassId);
    
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
        
        // ✅ Format date từ start_time hoặc exam_date
        let examDate = 'Chưa có ngày';
        const dateStr = exam.start_time || exam.exam_date;
        if (dateStr) {
            const date = new Date(dateStr);
            examDate = date.toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return `
            <div class="exam-item">
                <div class="exam-header">
                    <div>
                        <div class="exam-title">${exam.title}</div>
                        <div class="exam-meta">
                            <span>📅 ${examDate}</span>
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

// Biến lưu trữ thông tin bài thi hiện tại
let currentExam = null;

// Hàm quay lại danh sách bài thi
function backToExamList() {
    const examListContainer = document.getElementById('examListContainer');
    const examDetail = document.getElementById('examDetail');
    const editExamForm = document.getElementById('editExamForm');
    
    // Ẩn detail và edit form
    if (examDetail) {
        examDetail.style.display = 'none';
        examDetail.style.visibility = 'hidden';
    }
    if (editExamForm) {
        editExamForm.style.display = 'none';
        editExamForm.style.visibility = 'hidden';
    }
    
    // Hiện list
    if (examListContainer) {
        examListContainer.style.display = 'block';
        examListContainer.style.visibility = 'visible';
        examListContainer.style.opacity = '1';
    }
    
    currentExam = null;
    console.log('✅ Back to exam list');
}

// Hàm hiển thị chi tiết bài thi
async function viewExamDetail(examId) {
    try {
        const token = localStorage.getItem('token');
        
        // Fetch thông tin bài thi
        const examsResponse = await fetch('http://localhost:3000/api/teacher/exams/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!examsResponse.ok) {
            throw new Error('Lỗi tải thông tin bài thi');
        }
        
        const exams = await examsResponse.json();
        const exam = exams.find(e => e.exam_id === parseInt(examId));
        
        if (!exam) {
            showNotification('Không tìm thấy bài thi', 'error');
            return;
        }

        // Fetch danh sách câu hỏi
        const questionsResponse = await fetch(`http://localhost:3000/api/teacher/exams/${examId}/questions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!questionsResponse.ok) {
            throw new Error('Lỗi tải danh sách câu hỏi');
        }
        
        const questionsData = await questionsResponse.json();
        currentExam = { ...exam, questions: questionsData.questions || [] };

        // ✅ FIX: Ẩn/hiện đúng cách với setAttribute
        const examListContainer = document.getElementById('examListContainer');
        const examDetail = document.getElementById('examDetail');
        const editExamForm = document.getElementById('editExamForm');
        
        // Ẩn list và edit form
        if (examListContainer) {
            examListContainer.style.display = 'none';
            examListContainer.style.visibility = 'hidden';
        }
        if (editExamForm) {
            editExamForm.style.display = 'none';
            editExamForm.style.visibility = 'hidden';
        }
        
        // Hiện exam detail
        if (examDetail) {
            examDetail.style.display = 'block';
            examDetail.style.visibility = 'visible';
            examDetail.style.opacity = '1';
            examDetail.style.position = 'relative';
            examDetail.style.zIndex = '10';
        }

        // ✅ Cập nhật thông tin (với kiểm tra null)
        const titleEl = document.getElementById('examDetailTitle');
        const classEl = document.getElementById('examDetailClass');
        const dateEl = document.getElementById('examDetailDate');
        const durationEl = document.getElementById('examDetailDuration');
        const descEl = document.getElementById('examDetailDescription');
        const statusEl = document.getElementById('examDetailStatus');
        
        if (titleEl) titleEl.textContent = exam.title || exam.exam_name || 'Không có tên';
        if (classEl) classEl.textContent = exam.class_name || 'Không có lớp';
        if (dateEl) dateEl.textContent = new Date(exam.start_time).toLocaleString('vi-VN');
        if (durationEl) durationEl.textContent = exam.duration;
        if (descEl) descEl.textContent = exam.description || 'Không có mô tả';
        if (statusEl) {
            statusEl.textContent = {
                draft: 'Nháp',
                upcoming: 'Sắp diễn ra',
                active: 'Đang diễn ra',
                completed: 'Đã kết thúc'
            }[exam.status] || exam.status;
        }

        // Hiển thị danh sách câu hỏi
        const questionsContainer = document.getElementById('examDetailQuestions');
        if (questionsContainer) {
            questionsContainer.innerHTML = '';
            
            if (questionsData.questions && questionsData.questions.length > 0) {
                questionsData.questions.forEach((q, index) => {
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
                    `;
                    questionsContainer.appendChild(questionDiv);
                });
            } else {
                questionsContainer.innerHTML = '<p>Chưa có câu hỏi nào trong bài thi.</p>';
            }
        }

        console.log('✅ Exam detail displayed successfully');
    } catch (err) {
        console.error('Error viewing exam details:', err);
        showNotification('❌ Lỗi: ' + err.message, 'error');
    }
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

    // ✅ Toggle display
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
        await viewExamDetail(examId); // Tải lại chi tiết bài thi
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
        await viewExamDetail(examId); // Tải lại chi tiết bài thi
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
        await viewExamDetail(examId); // Tải lại chi tiết bài thi
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

// ============================================
// 📊 RENDER BẢNG ĐIỂM - HIỂN THỊ ĐIỂM TỪNG KỲ THI
// ============================================
async function renderGrades() {
    const container = document.getElementById('grades-tab');
    const token = localStorage.getItem('token');
    
    // Hiển thị loading
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <div style="font-size: 3rem; margin-bottom: 15px;">⏳</div>
            <div>Đang tải bảng điểm...</div>
        </div>
    `;
    
    try {
        // 1. Lấy danh sách học sinh
        const studentsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/students`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!studentsResponse.ok) throw new Error('Lỗi tải danh sách học sinh');
        const students = await studentsResponse.json();
        
        // 2. Lấy danh sách bài thi của lớp
        const examsResponse = await fetch(`http://localhost:3000/api/teacher/classes/${appData.currentClassId}/exams`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!examsResponse.ok) throw new Error('Lỗi tải danh sách bài thi');
        const exams = await examsResponse.json();
        
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
        const gradesData = [];
        
        for (const student of students) {
            const studentGrades = {
                student_id: student.user_id,
                full_name: student.full_name,
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
                        studentGrades.exams[exam.exam_id] = gradeData.score !== null ? parseFloat(gradeData.score).toFixed(1) : '-';
                    } else {
                        studentGrades.exams[exam.exam_id] = '-';
                    }
                } catch {
                    studentGrades.exams[exam.exam_id] = '-';
                }
            }
            
            gradesData.push(studentGrades);
        }
        
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
                                                    MSSV: ${student.student_id}
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
        
        console.log('✅ Grades table rendered successfully');
        
    } catch (error) {
        console.error('❌ Error rendering grades:', error);
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

// ============================================
// 📥 XUẤT BẢNG ĐIỂM RA EXCEL
// ============================================
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
            // Lấy text, bỏ qua HTML
            let text = col.textContent.trim();
            // Escape dấu ngoặc kép
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

// Chart
function initializeChart() {
    const ctx = document.getElementById('statisticsChart').getContext('2d');
    appData.currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Giỏi (8-10)', 'Khá (6.5-8)', 'Trung bình (5-6.5)', 'Yếu (<5)'],
            datasets: [{
                label: 'Số lượng học sinh',
                data: [25, 45, 65, 21],
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

function updateStatistics() {
    showNotification('Đang cập nhật thống kê...', 'info');
}

function updateChartType() {
    const chartType = document.getElementById('chartType').value;
    if (appData.currentChart) {
        appData.currentChart.destroy();
    }

    const ctx = document.getElementById('statisticsChart').getContext('2d');
    appData.currentChart = new Chart(ctx, {
        type: chartType,
        data: {
            labels: ['Giỏi (8-10)', 'Khá (6.5-8)', 'Trung bình (5-6.5)', 'Yếu (<5)'],
            datasets: [{
                label: 'Số lượng học sinh',
                data: [25, 45, 65, 21],
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
        fileInput.value = ''; // Reset input để có thể chọn lại file
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
        
        // ✅ Build URL
        let url = 'http://localhost:3000/api/teacher/cheating-logs';
        const params = new URLSearchParams();
        if (examId !== 'all') params.append('exam_id', examId);
        if (eventType !== 'all') params.append('event_type', eventType);
        
        if (params.toString()) url += '?' + params.toString();
        
        console.log('📡 [Cheating] Fetching:', url);
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
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
            throw new Error('Server trả về HTML thay vì JSON. Kiểm tra route /api/teacher/cheating-logs');
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
                            <button class="btn btn-secondary" onclick="console.log('Debug info:', {url: 'http://localhost:3000/api/teacher/cheating-logs', token: localStorage.getItem('token')})">
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
        
        const response = await fetch(`http://localhost:3000/api/teacher/cheating-logs/${attemptId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
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
        // Update info
        document.getElementById('studentCheatingName').textContent = data.student_name;
        document.getElementById('studentCheatingScore').textContent = data.score !== null ? `${data.score} điểm` : 'Chưa chấm';
        document.getElementById('detailExamName').textContent = data.exam_name;
        document.getElementById('detailExamTime').textContent = new Date(data.start_time).toLocaleString('vi-VN');
        document.getElementById('detailTotalViolations').textContent = data.logs.length;
        // Render timeline
        const timeline = document.getElementById('cheatingTimeline');
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
        
    } catch (error) {
        console.error('❌ [Detail] Error:', error);
        showNotification('❌ ' + error.message, 'error');
    }
}

// Back to list
function backToCheatingList() {
    document.getElementById('cheatingListCard').style.display = 'block';
    document.getElementById('studentCheatingDetail').style.display = 'none';
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
        const response = await fetch('http://localhost:3000/api/teacher/ban-student', {
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

//  Hook vào navigateTo
if (typeof window.originalNavigateTo === 'undefined') {
    window.originalNavigateTo = navigateTo;
    navigateTo = async function(section) {
        window.originalNavigateTo(section);
        
        if (section === 'anti-cheating') {
            console.log('🔵 [Nav] Loading anti-cheating section');
            await loadExamsForCheating();
            await loadCheatingLogs();
        }
    };
}
// 📝 LOAD DANH SÁCH BÀI THI CẦN CHẤM
async function loadGradingSection() {
    const token = localStorage.getItem('token');
    const container = document.getElementById('grading');
    
    try {
        console.log('🔵 Loading grading section...');
        const response = await fetch('http://localhost:3000/api/teacher/grading/pending', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Lỗi tải danh sách bài cần chấm');
        }
        const data = await response.json();
        console.log('✅ Grading data:', data);
        const totalPending = data.pendingEssays + data.pendingFillInBlank;
        document.querySelector('#grading .stat-card:nth-child(1) .stat-number').textContent = totalPending;
        document.querySelector('#grading .stat-card:nth-child(2) .stat-number').textContent = data.gradedCount;
        document.querySelector('#grading .stat-card:nth-child(3) .stat-number').textContent = data.pendingEssays;
        document.querySelector('#grading .stat-card:nth-child(4) .stat-number').textContent = data.pendingChoice;
        const list = container.querySelector('.card:last-child');
        
        if (data.attempts.length === 0) {
            list.innerHTML = `
                <h2 class="card-title" style="margin-bottom: 20px;">Danh sách bài cần chấm</h2>
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div class="empty-state-text">Không có bài thi nào cần chấm</div>
                    <div class="empty-state-subtext">Tất cả bài thi đã được chấm điểm</div>
                </div>
            `;
            return;
        }
        
        list.innerHTML = `
            <h2 class="card-title" style="margin-bottom: 20px;">Danh sách bài cần chấm</h2>
            <div class="exam-list">
                ${data.attempts.map(attempt => `
                    <div class="exam-item">
                        <div class="exam-header">
                            <div>
                                <div class="exam-title">${attempt.exam_name}</div>
                                <div class="exam-meta">
                                    <span>👤 ${attempt.student_name}</span>
                                    <span>📅 ${new Date(attempt.end_time).toLocaleString('vi-VN')}</span>
                                    <span>⏱️ ${attempt.duration} phút</span>
                                    <span style="color: #ffa502; font-weight: 600;">
                                        ⚠️ ${attempt.pending_questions} câu chưa chấm
                                    </span>
                                </div>
                            </div>
                            <span class="exam-status" style="background: #ffa502;">Chờ chấm</span>
                        </div>
                        <div class="exam-actions">
                            <button class="btn btn-primary" onclick="startGrading(${attempt.attempt_id}, ${attempt.exam_id})">
                                ✍️ Chấm bài
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        console.log('✅ Grading section loaded');
        
    } catch (error) {
        console.error('❌ Error loading grading section:', error);
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

// 🔄 HOOK VÀO NAVIGATION
if (typeof window.originalNavigateToGrading === 'undefined') {
    window.originalNavigateToGrading = navigateTo;
    navigateTo = async function(section) {
        window.originalNavigateToGrading(section);
        
        if (section === 'grading') {
            console.log('🔵 Loading grading section');
            await loadGradingSection();
        }
    };
}
// TẠO THỦ CÔNG & NGÂN HÀNG CÂU HỎI

// State lưu câu hỏi đang tạo
let manualExamQuestions = [];
let questionBankData = [];
let selectedQuestionsFromBank = new Set();

//  XỬ LÝ CLICK "TẠO THỦ CÔNG"
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
        
        const { exam } = await examRes.json();
        const examId = exam.exam_id;
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
                    console.log('✅ Đã gắn sự kiện cho nút Tạo thủ công');
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
    
    console.log('✅ Đã thêm nút Ngân hàng câu hỏi');
}

// Responsive
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});
