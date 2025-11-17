
function showNotification(message, type = 'info') {
    const toastContainer = document.createElement('div');
    toastContainer.className = `toast align-items-center text-white bg-${type} border-0`;
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '1050';
    toastContainer.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toastContainer);
    const toast = new bootstrap.Toast(toastContainer);
    toast.show();
    setTimeout(() => toastContainer.remove(), 3000);
}

// Lấy token từ localStorage
const token = localStorage.getItem('token');
if (!token) {
    showNotification('Vui lòng đăng nhập để truy cập dashboard!', 'error');
    setTimeout(() => window.location.href = './login.html', 1500);
    throw new Error('No token');
}


// Biến toàn cục để lưu dữ liệu gốc cho lọc users và chi tiết môn học
let allUsers = [];
let allStudents = [];

// Toggle Sidebar
document.getElementById('toggleSidebar')?.addEventListener('click', function() {
    document.getElementById('sidebar').classList.toggle('show');
});

// Navigation and Section Switching
const pageTitles = {
    'dashboard': 'Dashboard Tổng Quan',
    'users': 'Quản Lý Người Dùng',
    'exams': 'Quản Lý Kỳ Thi',
    'questions': 'Ngân Hàng Câu Hỏi',
    'subjects': 'Quản Lý Môn Học',
    'reports': 'Báo Cáo & Thống Kê',
    'settings': 'Cài Đặt Hệ Thống'
};

// Hàm xử lý quick action
function handleQuickAction(sectionName, buttonId) {
    switchSection(sectionName);
    // Đợi section được hiển thị rồi mới click button
    setTimeout(() => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.click();
        } else {
            console.warn(`Không tìm thấy button với ID: ${buttonId}`);
        }
    }, 200);
}

// Hàm chuyển đổi section
function switchSection(sectionName) {
    // Kiểm tra sectionName hợp lệ
    if (!sectionName || sectionName === 'null' || sectionName === 'undefined') {
        console.warn('switchSection được gọi với giá trị không hợp lệ:', sectionName);
        return;
    }
    
    // Cập nhật navigation
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.querySelector(`.nav-link[data-section="${sectionName}"]`);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    // Ẩn tất cả sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Hiển thị section được chọn
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Section hiển thị:', sectionName + '-section');
    } else {
        console.error('Không tìm thấy section:', sectionName + '-section');
    }
    
    // Cập nhật tiêu đề
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.textContent = pageTitles[sectionName] || 'Dashboard';
    }
    
    // Load dữ liệu tương ứng
    if (sectionName === 'dashboard') {
        setTimeout(loadDashboardData, 100);
    } else if (sectionName === 'users') {
        setTimeout(loadUsersData, 100);
    } else if (sectionName === 'exams') {
        setTimeout(loadExamsData, 100);
    } else if (sectionName === 'questions') {
        setTimeout(loadQuestionsData, 100);
    } else if (sectionName === 'subjects') {
        setTimeout(loadSubjectsData, 100);
    } else if (sectionName === 'reports') {
        setTimeout(loadReportsData, 100);
    } else if (sectionName === 'monitor-cheating') {
        setTimeout(loadCheatingData, 100);
    } else if (sectionName === 'settings') {
        console.log('Đang load settings...');
        setTimeout(loadSettingsData, 100);
    }
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const sectionName = this.getAttribute('data-section');
        if (sectionName) {
            switchSection(sectionName);
        } else {
            console.warn('Nav link không có data-section:', this);
        }
    });
});

// DARK MODE FUNCTIONALITY
(function() {
    // Kiểm tra theme đã lưu hoặc sử dụng light mode mặc định
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateDarkModeIcon(savedTheme === 'dark');

    // Toggle dark mode
    document.getElementById('toggleDarkMode')?.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateDarkModeIcon(newTheme === 'dark');
    });

    function updateDarkModeIcon(isDark) {
        const icon = document.getElementById('darkModeIcon');
        if (icon) {
            icon.className = isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
        }
    }
})();

// SETTINGS FUNCTIONALITY - NEW FEATURES

// Backup Functions
async function createBackup() {
    try {
        showNotification('Đang tạo bản sao lưu...', 'info');
        const response = await fetch('http://localhost:3000/api/admin/backup/create', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        showNotification('Tạo bản sao lưu thành công!', 'success');
    } catch (err) {
        showNotification('Lỗi tạo bản sao lưu: ' + err.message, 'error');
    }
}

async function viewBackupHistory() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/backup/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const backups = await response.json();
        
        if (backups.length === 0) {
            showNotification('Chưa có bản backup nào', 'info');
            return;
        }
        
        // Hiển thị danh sách backup trong modal hoặc alert
        const backupList = backups.map(b => 
            `- ${b.backup_file} (${(b.backup_size / 1024).toFixed(2)} KB) - ${new Date(b.created_at).toLocaleString('vi-VN')}`
        ).join('\n');
        
        alert('Lịch sử backup:\n\n' + backupList);
    } catch (err) {
        showNotification('Lỗi tải lịch sử backup: ' + err.message, 'error');
    }
}

async function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    const overwrite = document.getElementById('restoreOverwrite')?.checked;
    if (!fileInput || !fileInput.files.length) {
        showNotification('Vui lòng chọn file sao lưu!', 'error');
        return;
    }
    if (!confirm('Bạn có chắc chắn muốn khôi phục? Dữ liệu hiện tại có thể bị mất!')) return;
    
    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('overwrite', overwrite ? 'true' : 'false');
        
        showNotification('Đang khôi phục...', 'info');
        const response = await fetch('http://localhost:3000/api/admin/backup/restore', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        const data = await response.json();
        showNotification('Khôi phục thành công!', 'success');
        // Clear file input
        fileInput.value = '';
    } catch (err) {
        console.error('Lỗi khôi phục:', err);
        showNotification('Lỗi khôi phục: ' + err.message, 'error');
    }
}

// Logs Functions
function viewSystemLogs() {
    showNotification('Đang tải log...', 'info');
    window.open('http://localhost:3000/api/admin/logs/view', '_blank');
}

async function exportLogs() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/logs/export', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        showNotification('Xuất log thành công!', 'success');
    } catch (err) {
        showNotification('Lỗi xuất log: ' + err.message, 'error');
    }
}

async function clearOldLogs() {
    if (!confirm('Bạn có chắc chắn muốn xóa log cũ?')) return;
    try {
        const response = await fetch('http://localhost:3000/api/admin/logs/clear', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        showNotification('Xóa log cũ thành công!', 'success');
    } catch (err) {
        showNotification('Lỗi xóa log: ' + err.message, 'error');
    }
}

// API Functions
function generateAPIKey() {
    const apiKey = 'api_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    document.getElementById('apiKey').value = apiKey;
    showNotification('Đã tạo API Key mới!', 'success');
}

function copyAPIKey() {
    const apiKeyInput = document.getElementById('apiKey');
    apiKeyInput.select();
    document.execCommand('copy');
    showNotification('Đã sao chép API Key!', 'success');
}

// Performance Functions
function viewPerformanceStats() {
    showNotification('Đang tải thống kê hiệu suất...', 'info');
    // Có thể mở modal hoặc chuyển đến trang thống kê
}

async function clearCache() {
    if (!confirm('Bạn có chắc chắn muốn xóa cache?')) return;
    try {
        const response = await fetch('http://localhost:3000/api/admin/cache/clear', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        showNotification('Xóa cache thành công!', 'success');
    } catch (err) {
        showNotification('Lỗi xóa cache: ' + err.message, 'error');
    }
}

async function optimizeDatabase() {
    if (!confirm('Bạn có chắc chắn muốn tối ưu database? Quá trình này có thể mất vài phút.')) return;
    try {
        showNotification('Đang tối ưu database...', 'info');
        const response = await fetch('http://localhost:3000/api/admin/database/optimize', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        showNotification('Tối ưu database thành công!', 'success');
    } catch (err) {
        showNotification('Lỗi tối ưu database: ' + err.message, 'error');
    }
}

// ==========================================
// SETTINGS FUNCTIONALITY
// ==========================================
async function loadSettingsData() {
    try {
        console.log('Đang tải cài đặt...');
        const response = await fetch('http://localhost:3000/api/admin/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Lỗi API settings:', response.status, errorText);
            showNotification('Lỗi tải cài đặt: ' + errorText, 'error');
            // Vẫn hiển thị form với giá trị mặc định
            return;
        }
        const settings = await response.json();
        
        console.log('Settings loaded:', settings);
        
        if (!settings || Object.keys(settings).length === 0) {
            console.warn('Settings rỗng, sử dụng giá trị mặc định');
        }

        // Fill exam settings
        if (settings.exam) {
            const defaultDurationEl = document.getElementById('defaultDuration');
            if (defaultDurationEl) defaultDurationEl.value = settings.exam.defaultDuration || 60;
            const defaultPassingScoreEl = document.getElementById('defaultPassingScore');
            if (defaultPassingScoreEl) defaultPassingScoreEl.value = settings.exam.defaultPassingScore || 5.0;
            const enableAutoSubmitEl = document.getElementById('enableAutoSubmit');
            if (enableAutoSubmitEl) enableAutoSubmitEl.checked = settings.exam.enableAutoSubmit !== false;
            const enableReviewBeforeSubmitEl = document.getElementById('enableReviewBeforeSubmit');
            if (enableReviewBeforeSubmitEl) enableReviewBeforeSubmitEl.checked = settings.exam.enableReviewBeforeSubmit !== false;
        }

        // Fill anti-cheat settings
        if (settings.antiCheat) {
            const maxWarningsEl = document.getElementById('maxWarnings');
            if (maxWarningsEl) maxWarningsEl.value = settings.antiCheat.maxWarnings || 3;
            const enableWebcamMonitoringEl = document.getElementById('enableWebcamMonitoring');
            if (enableWebcamMonitoringEl) enableWebcamMonitoringEl.checked = settings.antiCheat.enableWebcamMonitoring !== false;
            const enableTabSwitchDetectionEl = document.getElementById('enableTabSwitchDetection');
            if (enableTabSwitchDetectionEl) enableTabSwitchDetectionEl.checked = settings.antiCheat.enableTabSwitchDetection !== false;
            const enableCopyPasteDetectionEl = document.getElementById('enableCopyPasteDetection');
            if (enableCopyPasteDetectionEl) enableCopyPasteDetectionEl.checked = settings.antiCheat.enableCopyPasteDetection !== false;
        }

        // Fill notification settings
        if (settings.notification) {
            const enableEmailEl = document.getElementById('enableEmail');
            if (enableEmailEl) enableEmailEl.checked = settings.notification.enableEmail === true;
            const notifyExamStartEl = document.getElementById('notifyExamStart');
            if (notifyExamStartEl) notifyExamStartEl.checked = settings.notification.notifyExamStart !== false;
            const notifyExamEndEl = document.getElementById('notifyExamEnd');
            if (notifyExamEndEl) notifyExamEndEl.checked = settings.notification.notifyExamEnd !== false;
            const notifyScoreAvailableEl = document.getElementById('notifyScoreAvailable');
            if (notifyScoreAvailableEl) notifyScoreAvailableEl.checked = settings.notification.notifyScoreAvailable !== false;
        }

        // Fill security settings
        if (settings.security) {
            const sessionTimeoutEl = document.getElementById('sessionTimeout');
            if (sessionTimeoutEl) sessionTimeoutEl.value = settings.security.sessionTimeout || 30;
            const maxLoginAttemptsEl = document.getElementById('maxLoginAttempts');
            if (maxLoginAttemptsEl) maxLoginAttemptsEl.value = settings.security.maxLoginAttempts || 5;
            const accountLockoutDurationEl = document.getElementById('accountLockoutDuration');
            if (accountLockoutDurationEl) accountLockoutDurationEl.value = settings.security.accountLockoutDuration || 15;
            const requireStrongPasswordEl = document.getElementById('requireStrongPassword');
            if (requireStrongPasswordEl) requireStrongPasswordEl.checked = settings.security.requireStrongPassword === true;
            const enableTwoFactorEl = document.getElementById('enableTwoFactor');
            if (enableTwoFactorEl) enableTwoFactorEl.checked = settings.security.enableTwoFactor === true;
            const enableIPWhitelistEl = document.getElementById('enableIPWhitelist');
            if (enableIPWhitelistEl) enableIPWhitelistEl.checked = settings.security.enableIPWhitelist === true;
        }

        // Fill display settings
        if (settings.display) {
            const languageEl = document.getElementById('language');
            if (languageEl) languageEl.value = settings.display.language || 'vi';
            
            const primaryColorEl = document.getElementById('primaryColor');
            if (primaryColorEl) primaryColorEl.value = settings.display.primaryColor || '#0d6efd';
            
            const fontSizeEl = document.getElementById('fontSize');
            if (fontSizeEl) fontSizeEl.value = settings.display.fontSize || 'medium';
            
            const compactModeEl = document.getElementById('compactMode');
            if (compactModeEl) compactModeEl.checked = settings.display.compactMode === true;
            
            const showAnimationsEl = document.getElementById('showAnimations');
            if (showAnimationsEl) showAnimationsEl.checked = settings.display.showAnimations !== false;
            
            const showTooltipsEl = document.getElementById('showTooltips');
            if (showTooltipsEl) showTooltipsEl.checked = settings.display.showTooltips !== false;
            
            const itemsPerPageEl = document.getElementById('itemsPerPage');
            if (itemsPerPageEl) itemsPerPageEl.value = settings.display.itemsPerPage || 25;
            
            // Áp dụng settings ngay lập tức
            applyDisplaySettings(settings.display);
            
            // Lưu vào localStorage
            localStorage.setItem('systemSettings', JSON.stringify(settings));
        }

        // Fill email settings
        if (settings.email) {
            const smtpHostEl = document.getElementById('smtpHost');
            if (smtpHostEl) smtpHostEl.value = settings.email.smtpHost || '';
            const smtpPortEl = document.getElementById('smtpPort');
            if (smtpPortEl) smtpPortEl.value = settings.email.smtpPort || '';
            const smtpSecureEl = document.getElementById('smtpSecure');
            if (smtpSecureEl) smtpSecureEl.value = settings.email.smtpSecure || 'tls';
            const smtpEmailEl = document.getElementById('smtpEmail');
            if (smtpEmailEl) smtpEmailEl.value = settings.email.smtpEmail || '';
            const emailFromNameEl = document.getElementById('emailFromName');
            if (emailFromNameEl) emailFromNameEl.value = settings.email.emailFromName || '';
            // Không fill password field vì lý do bảo mật
        }

        // Fill user settings
        if (settings.user) {
            const minPasswordLengthEl = document.getElementById('minPasswordLength');
            if (minPasswordLengthEl) minPasswordLengthEl.value = settings.user.minPasswordLength || 8;
            const passwordExpiryDaysEl = document.getElementById('passwordExpiryDays');
            if (passwordExpiryDaysEl) passwordExpiryDaysEl.value = settings.user.passwordExpiryDays || 90;
            const preventPasswordReuseEl = document.getElementById('preventPasswordReuse');
            if (preventPasswordReuseEl) preventPasswordReuseEl.checked = settings.user.preventPasswordReuse === true;
            const allowStudentRegistrationEl = document.getElementById('allowStudentRegistration');
            if (allowStudentRegistrationEl) allowStudentRegistrationEl.checked = settings.user.allowStudentRegistration === true;
            const requireEmailVerificationEl = document.getElementById('requireEmailVerification');
            if (requireEmailVerificationEl) requireEmailVerificationEl.checked = settings.user.requireEmailVerification === true;
            const maxStudentsPerClassEl = document.getElementById('maxStudentsPerClass');
            if (maxStudentsPerClassEl) maxStudentsPerClassEl.value = settings.user.maxStudentsPerClass || 50;
        }

        // Fill system settings
        if (settings.system) {
            const questionsPerPageEl = document.getElementById('questionsPerPage');
            if (questionsPerPageEl) questionsPerPageEl.value = settings.system.questionsPerPage || 20;
            const autoSaveIntervalEl = document.getElementById('autoSaveInterval');
            if (autoSaveIntervalEl) autoSaveIntervalEl.value = settings.system.autoSaveInterval || 60;
            const logRetentionDaysEl = document.getElementById('logRetentionDays');
            if (logRetentionDaysEl) logRetentionDaysEl.value = settings.system.logRetentionDays || 30;
            const backupFrequencyEl = document.getElementById('backupFrequency');
            if (backupFrequencyEl) backupFrequencyEl.value = settings.system.backupFrequency || 7;
            const enableMaintenanceModeEl = document.getElementById('enableMaintenanceMode');
            if (enableMaintenanceModeEl) enableMaintenanceModeEl.checked = settings.system.enableMaintenanceMode === true;
            const enableCachingEl = document.getElementById('enableCaching');
            if (enableCachingEl) enableCachingEl.checked = settings.system.enableCaching !== false;
            // Không fill password field vì lý do bảo mật
        }

        // Fill backup settings
        if (settings.backup) {
            const backupScheduleEl = document.getElementById('backupSchedule');
            if (backupScheduleEl) backupScheduleEl.value = settings.backup.schedule || 'weekly';
            const backupRetentionEl = document.getElementById('backupRetention');
            if (backupRetentionEl) backupRetentionEl.value = settings.backup.retention || 7;
            const backupIncludeFilesEl = document.getElementById('backupIncludeFiles');
            if (backupIncludeFilesEl) backupIncludeFilesEl.checked = settings.backup.includeFiles !== false;
            const backupCompressEl = document.getElementById('backupCompress');
            if (backupCompressEl) backupCompressEl.checked = settings.backup.compress !== false;
        }

        // Fill logs settings
        if (settings.logs) {
            const logLevelEl = document.getElementById('logLevel');
            if (logLevelEl) logLevelEl.value = settings.logs.level || 'info';
            const maxLogFileSizeEl = document.getElementById('maxLogFileSize');
            if (maxLogFileSizeEl) maxLogFileSizeEl.value = settings.logs.maxFileSize || 10;
            const logUserActionsEl = document.getElementById('logUserActions');
            if (logUserActionsEl) logUserActionsEl.checked = settings.logs.logUserActions === true;
            const logAPIRequestsEl = document.getElementById('logAPIRequests');
            if (logAPIRequestsEl) logAPIRequestsEl.checked = settings.logs.logAPIRequests === true;
            const enableSystemMonitoringEl = document.getElementById('enableSystemMonitoring');
            if (enableSystemMonitoringEl) enableSystemMonitoringEl.checked = settings.logs.enableSystemMonitoring === true;
            const monitoringIntervalEl = document.getElementById('monitoringInterval');
            if (monitoringIntervalEl) monitoringIntervalEl.value = settings.logs.monitoringInterval || 5;
            const cpuThresholdEl = document.getElementById('cpuThreshold');
            if (cpuThresholdEl) cpuThresholdEl.value = settings.logs.cpuThreshold || 80;
            const ramThresholdEl = document.getElementById('ramThreshold');
            if (ramThresholdEl) ramThresholdEl.value = settings.logs.ramThreshold || 85;
        }

        // Fill API settings
        if (settings.api) {
            const enableAPIEl = document.getElementById('enableAPI');
            if (enableAPIEl) enableAPIEl.checked = settings.api.enableAPI === true;
            const apiKeyEl = document.getElementById('apiKey');
            if (apiKeyEl) apiKeyEl.value = settings.api.apiKey || '';
            const apiRateLimitEl = document.getElementById('apiRateLimit');
            if (apiRateLimitEl) apiRateLimitEl.value = settings.api.rateLimit || 100;
            const apiTokenExpiryEl = document.getElementById('apiTokenExpiry');
            if (apiTokenExpiryEl) apiTokenExpiryEl.value = settings.api.tokenExpiry || 60;
            const enableGoogleIntegrationEl = document.getElementById('enableGoogleIntegration');
            if (enableGoogleIntegrationEl) enableGoogleIntegrationEl.checked = settings.api.enableGoogleIntegration === true;
            const googleClientIdEl = document.getElementById('googleClientId');
            if (googleClientIdEl) googleClientIdEl.value = settings.api.googleClientId || '';
            const enableFacebookIntegrationEl = document.getElementById('enableFacebookIntegration');
            if (enableFacebookIntegrationEl) enableFacebookIntegrationEl.checked = settings.api.enableFacebookIntegration === true;
            const facebookAppIdEl = document.getElementById('facebookAppId');
            if (facebookAppIdEl) facebookAppIdEl.value = settings.api.facebookAppId || '';
            const webhookUrlEl = document.getElementById('webhookUrl');
            if (webhookUrlEl) webhookUrlEl.value = settings.api.webhookUrl || '';
            const webhookOnExamStartEl = document.getElementById('webhookOnExamStart');
            if (webhookOnExamStartEl) webhookOnExamStartEl.checked = settings.api.webhookOnExamStart === true;
            const webhookOnExamEndEl = document.getElementById('webhookOnExamEnd');
            if (webhookOnExamEndEl) webhookOnExamEndEl.checked = settings.api.webhookOnExamEnd === true;
        }

        // Fill performance settings
        if (settings.performance) {
            const perfEl = document.getElementById('enableCDN');
            if (perfEl) perfEl.checked = settings.performance.enableCDN === true;
            const cdnUrlEl = document.getElementById('cdnUrl');
            if (cdnUrlEl) cdnUrlEl.value = settings.performance.cdnUrl || '';
            const gzipEl = document.getElementById('enableGzip');
            if (gzipEl) gzipEl.checked = settings.performance.enableGzip === true;
            const cacheDurEl = document.getElementById('cacheDuration');
            if (cacheDurEl) cacheDurEl.value = settings.performance.cacheDuration || 3600;
            const poolEl = document.getElementById('dbPoolSize');
            if (poolEl) poolEl.value = settings.performance.dbPoolSize || 10;
            const queryCacheEl = document.getElementById('enableQueryCache');
            if (queryCacheEl) queryCacheEl.checked = settings.performance.enableQueryCache === true;
            const queryDurEl = document.getElementById('queryCacheDuration');
            if (queryDurEl) queryDurEl.value = settings.performance.queryCacheDuration || 300;
            const imgOptEl = document.getElementById('enableImageOptimization');
            if (imgOptEl) imgOptEl.checked = settings.performance.enableImageOptimization === true;
            const maxImgEl = document.getElementById('maxImageSize');
            if (maxImgEl) maxImgEl.value = settings.performance.maxImageSize || 5;
            const imgQualEl = document.getElementById('imageQuality');
            if (imgQualEl) imgQualEl.value = settings.performance.imageQuality || 80;
        }
    } catch (err) {
        console.error('Lỗi tải cài đặt:', err);
        showNotification('Lỗi tải cài đặt: ' + err.message, 'error');
        // Vẫn hiển thị form với giá trị mặc định
    }
}

// Save settings
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', async () => {
        console.log('Nút Save được click');
        try {
            const settings = {
            exam: {
                defaultDuration: parseInt(document.getElementById('defaultDuration').value),
                defaultPassingScore: parseFloat(document.getElementById('defaultPassingScore').value),
                enableAutoSubmit: document.getElementById('enableAutoSubmit').checked,
                enableReviewBeforeSubmit: document.getElementById('enableReviewBeforeSubmit').checked
            },
            antiCheat: {
                maxWarnings: parseInt(document.getElementById('maxWarnings').value),
                enableWebcamMonitoring: document.getElementById('enableWebcamMonitoring').checked,
                enableTabSwitchDetection: document.getElementById('enableTabSwitchDetection').checked,
                enableCopyPasteDetection: document.getElementById('enableCopyPasteDetection').checked
            },
            notification: {
                enableEmail: document.getElementById('enableEmail').checked,
                notifyExamStart: document.getElementById('notifyExamStart').checked,
                notifyExamEnd: document.getElementById('notifyExamEnd').checked,
                notifyScoreAvailable: document.getElementById('notifyScoreAvailable').checked
            },
            security: {
                sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
                maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
                accountLockoutDuration: parseInt(document.getElementById('accountLockoutDuration').value),
                requireStrongPassword: document.getElementById('requireStrongPassword').checked,
                enableTwoFactor: document.getElementById('enableTwoFactor').checked,
                enableIPWhitelist: document.getElementById('enableIPWhitelist').checked
            },
            display: {
                language: document.getElementById('language').value,
                primaryColor: document.getElementById('primaryColor').value,
                fontSize: document.getElementById('fontSize').value,
                compactMode: document.getElementById('compactMode').checked,
                showAnimations: document.getElementById('showAnimations').checked,
                showTooltips: document.getElementById('showTooltips').checked,
                itemsPerPage: parseInt(document.getElementById('itemsPerPage').value)
            },
            email: {
                smtpHost: document.getElementById('smtpHost').value,
                smtpPort: document.getElementById('smtpPort').value ? parseInt(document.getElementById('smtpPort').value) : null,
                smtpSecure: document.getElementById('smtpSecure').value,
                smtpEmail: document.getElementById('smtpEmail').value,
                emailFromName: document.getElementById('emailFromName').value
            },
            user: {
                minPasswordLength: parseInt(document.getElementById('minPasswordLength').value),
                passwordExpiryDays: parseInt(document.getElementById('passwordExpiryDays').value),
                preventPasswordReuse: document.getElementById('preventPasswordReuse').checked,
                allowStudentRegistration: document.getElementById('allowStudentRegistration').checked,
                requireEmailVerification: document.getElementById('requireEmailVerification').checked,
                maxStudentsPerClass: parseInt(document.getElementById('maxStudentsPerClass').value)
            },
            system: {
                questionsPerPage: parseInt(document.getElementById('questionsPerPage').value),
                autoSaveInterval: parseInt(document.getElementById('autoSaveInterval').value),
                logRetentionDays: parseInt(document.getElementById('logRetentionDays').value),
                backupFrequency: parseInt(document.getElementById('backupFrequency').value),
                enableMaintenanceMode: document.getElementById('enableMaintenanceMode').checked,
                enableCaching: document.getElementById('enableCaching').checked
            },
            backup: {
                schedule: document.getElementById('backupSchedule')?.value || 'weekly',
                retention: parseInt(document.getElementById('backupRetention')?.value || 7),
                includeFiles: document.getElementById('backupIncludeFiles')?.checked || false,
                compress: document.getElementById('backupCompress')?.checked || false
            },
            logs: {
                level: document.getElementById('logLevel')?.value || 'info',
                maxFileSize: parseInt(document.getElementById('maxLogFileSize')?.value || 10),
                logUserActions: document.getElementById('logUserActions')?.checked || false,
                logAPIRequests: document.getElementById('logAPIRequests')?.checked || false,
                enableSystemMonitoring: document.getElementById('enableSystemMonitoring')?.checked || false,
                monitoringInterval: parseInt(document.getElementById('monitoringInterval')?.value || 5),
                cpuThreshold: parseInt(document.getElementById('cpuThreshold')?.value || 80),
                ramThreshold: parseInt(document.getElementById('ramThreshold')?.value || 85)
            },
            api: {
                enableAPI: document.getElementById('enableAPI')?.checked || false,
                apiKey: document.getElementById('apiKey')?.value || '',
                rateLimit: parseInt(document.getElementById('apiRateLimit')?.value || 100),
                tokenExpiry: parseInt(document.getElementById('apiTokenExpiry')?.value || 60),
                enableGoogleIntegration: document.getElementById('enableGoogleIntegration')?.checked || false,
                googleClientId: document.getElementById('googleClientId')?.value || '',
                enableFacebookIntegration: document.getElementById('enableFacebookIntegration')?.checked || false,
                facebookAppId: document.getElementById('facebookAppId')?.value || '',
                webhookUrl: document.getElementById('webhookUrl')?.value || '',
                webhookOnExamStart: document.getElementById('webhookOnExamStart')?.checked || false,
                webhookOnExamEnd: document.getElementById('webhookOnExamEnd')?.checked || false
            },
            performance: {
                enableCDN: document.getElementById('enableCDN')?.checked || false,
                cdnUrl: document.getElementById('cdnUrl')?.value || '',
                enableGzip: document.getElementById('enableGzip')?.checked || false,
                cacheDuration: parseInt(document.getElementById('cacheDuration')?.value || 3600),
                dbPoolSize: parseInt(document.getElementById('dbPoolSize')?.value || 10),
                enableQueryCache: document.getElementById('enableQueryCache')?.checked || false,
                queryCacheDuration: parseInt(document.getElementById('queryCacheDuration')?.value || 300),
                enableImageOptimization: document.getElementById('enableImageOptimization')?.checked || false,
                maxImageSize: parseInt(document.getElementById('maxImageSize')?.value || 5),
                imageQuality: parseInt(document.getElementById('imageQuality')?.value || 80)
            }
        };

        // Chỉ thêm password nếu có nhập
        const adminPassword = document.getElementById('defaultAdminPassword').value;
        if (adminPassword && adminPassword.trim() !== '') {
            settings.system.defaultAdminPassword = adminPassword;
        }

        const smtpPassword = document.getElementById('smtpPassword').value;
        if (smtpPassword && smtpPassword.trim() !== '') {
            settings.email.smtpPassword = smtpPassword;
        }

            const response = await fetch('http://localhost:3000/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Lỗi lưu cài đặt');

            showNotification('Lưu cài đặt thành công!', 'success');
            // Clear password field sau khi lưu
            const adminPasswordField = document.getElementById('defaultAdminPassword');
            if (adminPasswordField) adminPasswordField.value = '';
            
            // Lưu tất cả settings vào localStorage để áp dụng ngay
            localStorage.setItem('systemSettings', JSON.stringify(settings));
            
            // Áp dụng display settings ngay sau khi lưu
            if (settings.display) {
                applyDisplaySettings(settings.display);
                localStorage.setItem('displaySettings', JSON.stringify(settings.display));
            }
            
            // Áp dụng các settings khác
            applySystemSettings(settings);
        } catch (err) {
            console.error('Lỗi lưu cài đặt:', err);
            showNotification('Lỗi: ' + err.message, 'error');
        }
    });
} else {
    console.error('Không tìm thấy nút saveSettingsBtn');
}

// Reset settings
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener('click', async () => {
        console.log('Nút Reset được click');
        if (!confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) return;
        
        try {
            // Reset về default values
            document.getElementById('defaultDuration').value = 60;
            document.getElementById('defaultPassingScore').value = 5.0;
            document.getElementById('enableAutoSubmit').checked = true;
            document.getElementById('enableReviewBeforeSubmit').checked = true;
            
            document.getElementById('maxWarnings').value = 3;
            document.getElementById('enableWebcamMonitoring').checked = true;
            document.getElementById('enableTabSwitchDetection').checked = true;
            document.getElementById('enableCopyPasteDetection').checked = true;
            
            document.getElementById('enableEmail').checked = false;
            document.getElementById('notifyExamStart').checked = true;
            document.getElementById('notifyExamEnd').checked = true;
            document.getElementById('notifyScoreAvailable').checked = true;
            
            // Reset security settings
            document.getElementById('sessionTimeout').value = 30;
            document.getElementById('maxLoginAttempts').value = 5;
            document.getElementById('accountLockoutDuration').value = 15;
            document.getElementById('requireStrongPassword').checked = false;
            document.getElementById('enableTwoFactor').checked = false;
            document.getElementById('enableIPWhitelist').checked = false;
            
            // Reset display settings
            document.getElementById('language').value = 'vi';
            document.getElementById('primaryColor').value = '#0d6efd';
            document.getElementById('fontSize').value = 'medium';
            document.getElementById('compactMode').checked = false;
            document.getElementById('showAnimations').checked = true;
            document.getElementById('showTooltips').checked = true;
            document.getElementById('itemsPerPage').value = 25;
            
            // Reset email settings
            document.getElementById('smtpHost').value = '';
            document.getElementById('smtpPort').value = '';
            document.getElementById('smtpSecure').value = 'tls';
            document.getElementById('smtpEmail').value = '';
            document.getElementById('smtpPassword').value = '';
            document.getElementById('emailFromName').value = '';
            
            // Reset user settings
            document.getElementById('minPasswordLength').value = 8;
            document.getElementById('passwordExpiryDays').value = 90;
            document.getElementById('preventPasswordReuse').checked = false;
            document.getElementById('allowStudentRegistration').checked = true;
            document.getElementById('requireEmailVerification').checked = false;
            document.getElementById('maxStudentsPerClass').value = 50;
            
            // Reset system settings
            document.getElementById('questionsPerPage').value = 20;
            document.getElementById('autoSaveInterval').value = 60;
            document.getElementById('logRetentionDays').value = 30;
            document.getElementById('backupFrequency').value = 7;
            document.getElementById('enableMaintenanceMode').checked = false;
            document.getElementById('enableCaching').checked = true;
            document.getElementById('defaultAdminPassword').value = '';
            
            showNotification('Đã đặt lại về mặc định. Nhấn "Lưu cài đặt" để áp dụng.', 'info');
        } catch (err) {
            console.error('Lỗi reset settings:', err);
            showNotification('Lỗi: ' + err.message, 'error');
        }
    });
} else {
    console.error('Không tìm thấy nút resetSettingsBtn');
}

// SYSTEM SETTINGS MANAGER - ÁP DỤNG TẤT CẢ SETTINGS

// Hàm lấy settings từ localStorage hoặc trả về default
function getSystemSettings() {
    const saved = localStorage.getItem('systemSettings');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Lỗi parse system settings:', e);
        }
    }
    return null;
}

// Hàm lấy một setting cụ thể
function getSetting(category, key, defaultValue = null) {
    const settings = getSystemSettings();
    if (settings && settings[category] && settings[category][key] !== undefined) {
        return settings[category][key];
    }
    return defaultValue;
}

// Áp dụng tất cả system settings
function applySystemSettings(settings) {
    if (!settings) return;
    
    // Áp dụng exam settings
    if (settings.exam) {
        // Có thể thêm logic để áp dụng exam settings vào các form tạo exam
        console.log('Exam settings applied:', settings.exam);
    }
    
    // Áp dụng security settings
    if (settings.security) {
        // Có thể thêm logic để áp dụng security settings
        console.log('Security settings applied:', settings.security);
    }
    
    // Áp dụng notification settings
    if (settings.notification) {
        // Có thể thêm logic để áp dụng notification settings
        console.log('Notification settings applied:', settings.notification);
    }
    
    // Áp dụng user settings
    if (settings.user) {
        // Có thể thêm logic để áp dụng user settings
        console.log('User settings applied:', settings.user);
    }
    
    // Áp dụng system settings
    if (settings.system) {
        // Có thể thêm logic để áp dụng system settings
        console.log('System settings applied:', settings.system);
    }
}

// DISPLAY SETTINGS - ÁP DỤNG NGAY
function applyDisplaySettings(displaySettings) {
    if (!displaySettings) return;
    
    // Áp dụng màu chủ đạo
    if (displaySettings.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', displaySettings.primaryColor);
        // Áp dụng cho các button primary
        const style = document.createElement('style');
        style.id = 'dynamic-primary-color';
        style.textContent = `
            .btn-primary, .btn-primary:hover, .btn-primary:focus {
                background-color: ${displaySettings.primaryColor} !important;
                border-color: ${displaySettings.primaryColor} !important;
            }
            .btn-outline-primary {
                color: ${displaySettings.primaryColor} !important;
                border-color: ${displaySettings.primaryColor} !important;
            }
            .btn-outline-primary:hover {
                background-color: ${displaySettings.primaryColor} !important;
                color: white !important;
            }
            .nav-link.active {
                color: ${displaySettings.primaryColor} !important;
            }
            .text-primary {
                color: ${displaySettings.primaryColor} !important;
            }
            a {
                color: ${displaySettings.primaryColor} !important;
            }
            a:hover {
                color: ${displaySettings.primaryColor} !important;
                opacity: 0.8;
            }
        `;
        // Xóa style cũ nếu có
        const oldStyle = document.getElementById('dynamic-primary-color');
        if (oldStyle) oldStyle.remove();
        document.head.appendChild(style);
    }
    
    // Áp dụng font size
    if (displaySettings.fontSize) {
        const fontSizeMap = {
            'small': '14px',
            'medium': '16px',
            'large': '18px'
        };
        const fontSize = fontSizeMap[displaySettings.fontSize] || '16px';
        document.documentElement.style.setProperty('--base-font-size', fontSize);
        document.body.style.fontSize = fontSize;
    }
    
    // Áp dụng ngôn ngữ
    if (displaySettings.language) {
        document.documentElement.lang = displaySettings.language;
        // Có thể thêm logic để thay đổi text dựa trên ngôn ngữ
        // Hiện tại chỉ set lang attribute
    }
    
    // Áp dụng compact mode
    if (displaySettings.compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    
    // Áp dụng animations
    if (!displaySettings.showAnimations) {
        document.body.classList.add('no-animations');
    } else {
        document.body.classList.remove('no-animations');
    }
}

// Sử dụng setTimeout để đảm bảo DOM đã sẵn sàng
setTimeout(function() {
    const primaryColorEl = document.getElementById('primaryColor');
    if (primaryColorEl) {
        primaryColorEl.addEventListener('input', function() {
            const displaySettings = {
                primaryColor: this.value,
                language: document.getElementById('language')?.value || 'vi',
                fontSize: document.getElementById('fontSize')?.value || 'medium',
                compactMode: document.getElementById('compactMode')?.checked || false,
                showAnimations: document.getElementById('showAnimations')?.checked !== false,
                showTooltips: document.getElementById('showTooltips')?.checked !== false,
                itemsPerPage: parseInt(document.getElementById('itemsPerPage')?.value || 25)
            };
            applyDisplaySettings(displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
        });
    }
    
    const languageEl = document.getElementById('language');
    if (languageEl) {
        languageEl.addEventListener('change', function() {
            const displaySettings = {
                primaryColor: document.getElementById('primaryColor')?.value || '#0d6efd',
                language: this.value,
                fontSize: document.getElementById('fontSize')?.value || 'medium',
                compactMode: document.getElementById('compactMode')?.checked || false,
                showAnimations: document.getElementById('showAnimations')?.checked !== false,
                showTooltips: document.getElementById('showTooltips')?.checked !== false,
                itemsPerPage: parseInt(document.getElementById('itemsPerPage')?.value || 25)
            };
            applyDisplaySettings(displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
            showNotification('Ngôn ngữ đã thay đổi. Vui lòng làm mới trang để áp dụng đầy đủ.', 'info');
        });
    }
    
    const fontSizeEl = document.getElementById('fontSize');
    if (fontSizeEl) {
        fontSizeEl.addEventListener('change', function() {
            const displaySettings = {
                primaryColor: document.getElementById('primaryColor')?.value || '#0d6efd',
                language: document.getElementById('language')?.value || 'vi',
                fontSize: this.value,
                compactMode: document.getElementById('compactMode')?.checked || false,
                showAnimations: document.getElementById('showAnimations')?.checked !== false,
                showTooltips: document.getElementById('showTooltips')?.checked !== false,
                itemsPerPage: parseInt(document.getElementById('itemsPerPage')?.value || 25)
            };
            applyDisplaySettings(displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
        });
    }
    
    const compactModeEl = document.getElementById('compactMode');
    if (compactModeEl) {
        compactModeEl.addEventListener('change', function() {
            const displaySettings = {
                primaryColor: document.getElementById('primaryColor')?.value || '#0d6efd',
                language: document.getElementById('language')?.value || 'vi',
                fontSize: document.getElementById('fontSize')?.value || 'medium',
                compactMode: this.checked,
                showAnimations: document.getElementById('showAnimations')?.checked !== false,
                showTooltips: document.getElementById('showTooltips')?.checked !== false,
                itemsPerPage: parseInt(document.getElementById('itemsPerPage')?.value || 25)
            };
            applyDisplaySettings(displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
        });
    }
    
    const showAnimationsEl = document.getElementById('showAnimations');
    if (showAnimationsEl) {
        showAnimationsEl.addEventListener('change', function() {
            const displaySettings = {
                primaryColor: document.getElementById('primaryColor')?.value || '#0d6efd',
                language: document.getElementById('language')?.value || 'vi',
                fontSize: document.getElementById('fontSize')?.value || 'medium',
                compactMode: document.getElementById('compactMode')?.checked || false,
                showAnimations: this.checked,
                showTooltips: document.getElementById('showTooltips')?.checked !== false,
                itemsPerPage: parseInt(document.getElementById('itemsPerPage')?.value || 25)
            };
            applyDisplaySettings(displaySettings);
            localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
        });
    }
    
    // Load display settings từ localStorage khi trang load
    const savedDisplaySettings = localStorage.getItem('displaySettings');
    if (savedDisplaySettings) {
        try {
            const settings = JSON.parse(savedDisplaySettings);
            applyDisplaySettings(settings);
        } catch (e) {
            console.error('Lỗi parse display settings:', e);
        }
    }
}, 500);

// Hàm cập nhật biểu đồ userChart
function updateUserChart(role, data) {
    const userCtx = document.getElementById('userChart');
    if (userCtx.chartInstance) {
        userCtx.chartInstance.destroy();
    }

    const chartData = role === 'Student' ? data.studentData : data.teacherData;
    const label = role === 'Student' ? 'Sinh viên mới' : 'Giáo viên mới';
    const labels = data.months || ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10'];

    userCtx.chartInstance = new Chart(userCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: chartData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                borderColor: role === 'Student' ? '#0d6efd' : '#198754',
                backgroundColor: role === 'Student' ? 'rgba(13, 110, 253, 0.1)' : 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// Hàm tạo lại biểu đồ với loại mới
function recreateChart(ctx, type, data, options) {
    if (ctx.chartInstance) {
        ctx.chartInstance.destroy();
    }
    ctx.chartInstance = new Chart(ctx.getContext('2d'), {
        type: type,
        data: data,
        options: options
    });
}

// Hàm lấy dữ liệu thống kê
async function loadDashboardData() {
    try {
        // Lấy dữ liệu thống kê tổng quan
        const statsResponse = await fetch('http://localhost:3000/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!statsResponse.ok) throw new Error(await statsResponse.text());
        const statsData = await statsResponse.json();
        
        // Lấy dữ liệu biểu đồ
        const chartsResponse = await fetch('http://localhost:3000/api/admin/dashboard/charts', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!chartsResponse.ok) throw new Error(await chartsResponse.text());
        const chartsData = await chartsResponse.json();
        
        
        // Cập nhật thống kê
        const statValues = document.querySelectorAll('#dashboard-section .stat-value');
        if (statValues[0]) statValues[0].textContent = statsData.students || 0;
        if (statValues[1]) statValues[1].textContent = statsData.teachers || 0;
        if (statValues[2]) statValues[2].textContent = statsData.activeExams || 0;
        if (statValues[3]) statValues[3].textContent = statsData.questions || 0;

        // Cập nhật phần trăm thay đổi
        const statChanges = document.querySelectorAll('#dashboard-section .stat-change');
        if (statChanges[0]) {
            const studentChange = chartsData.changes?.students || 0;
            const isPositive = studentChange >= 0;
            statChanges[0].innerHTML = `<i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(studentChange)}% so với tháng trước`;
            statChanges[0].className = `stat-change ${isPositive ? 'text-success' : 'text-danger'}`;
        }
        if (statChanges[1]) {
            const teacherChange = chartsData.changes?.teachers || 0;
            const isPositive = teacherChange >= 0;
            statChanges[1].innerHTML = `<i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(teacherChange)}% so với tháng trước`;
            statChanges[1].className = `stat-change ${isPositive ? 'text-success' : 'text-danger'}`;
        }
        if (statChanges[2]) {
            const examChange = chartsData.changes?.exams || 0;
            const isPositive = examChange >= 0;
            statChanges[2].innerHTML = `<i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> ${Math.abs(examChange)}% so với tháng trước`;
            statChanges[2].className = `stat-change ${isPositive ? 'text-success' : 'text-danger'}`;
        }
        if (statChanges[3]) {
            const newQuestions = chartsData.changes?.newQuestions || 0;
            statChanges[3].innerHTML = `<i class="bi bi-plus"></i> +${newQuestions} câu hỏi mới`;
            statChanges[3].className = 'stat-change text-success';
        }

        // 1. Biểu đồ người dùng mới
        const userChartCtx = document.getElementById('userChart');
        if (userChartCtx) {
            const userChartType = document.getElementById('userChartType')?.value || 'line';
            const isStudent = document.getElementById('studentBtn')?.classList.contains('active') !== false;
            
            const chartData = {
                student: chartsData.userChart?.students || [],
                teacher: chartsData.userChart?.teachers || []
            };
            userChartCtx.chartData = chartData;
            userChartCtx.currentType = userChartType;
            userChartCtx.isStudent = isStudent;
            
            const currentData = isStudent ? chartData.student : chartData.teacher;
            const currentColor = isStudent ? '#0d6efd' : '#198754';
            const currentLabel = isStudent ? 'Sinh viên mới' : 'Giáo viên mới';
            
            let chartConfig = {
                labels: chartsData.userChart?.labels || [],
                datasets: [{
                    label: currentLabel,
                    data: currentData,
                    borderColor: currentColor,
                        backgroundColor: userChartType === 'area' ? (currentColor === '#0d6efd' ? 'rgba(13, 110, 253, 0.1)' : 'rgba(25, 135, 84, 0.1)') : currentColor,
                    tension: userChartType === 'line' || userChartType === 'area' ? 0.4 : 0,
                    fill: userChartType === 'area'
                }]
            };
            
            recreateChart(userChartCtx, userChartType, chartConfig, {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            });
        }

        // 2. Biểu đồ tỷ lệ hoàn thành
        const completionCtx = document.getElementById('completionChart');
        if (completionCtx) {
            const completionChartType = document.getElementById('completionChartType')?.value || 'doughnut';
            const completionData = chartsData.completionChart || {};
            
            // Cập nhật phần trăm
            document.getElementById('completedPercent').textContent = completionData.completed?.toFixed(1) + '%' || '0%';
            document.getElementById('inProgressPercent').textContent = completionData.inProgress?.toFixed(1) + '%' || '0%';
            document.getElementById('abandonedPercent').textContent = completionData.abandoned?.toFixed(1) + '%' || '0%';
            
            const completionChartData = {
                labels: ['Hoàn thành', 'Đang làm', 'Bỏ dở'],
                datasets: [{
                    data: [
                        completionData.completed || 0,
                        completionData.inProgress || 0,
                        completionData.abandoned || 0
                    ],
                    backgroundColor: ['#198754', '#ffc107', '#dc3545']
                }]
            };
            
            recreateChart(completionCtx, completionChartType, completionChartData, {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { 
                    legend: { 
                        position: completionChartType === 'bar' ? 'top' : 'bottom',
                        display: completionChartType !== 'bar'
                    } 
                },
                scales: completionChartType === 'bar' ? { y: { beginAtZero: true } } : {}
            });
        }

        // 3. Biểu đồ phân bố điểm số
        const scoreCtx = document.getElementById('scoreChart');
        if (scoreCtx) {
            const scoreChartType = document.getElementById('scoreChartType')?.value || 'bar';
            const scoreData = chartsData.scoreChart || {};
            
            const scoreChartData = {
                labels: scoreData.labels || [],
                datasets: [{
                    label: 'Số sinh viên',
                    data: scoreData.data || [],
                    backgroundColor: scoreChartType === 'pie' || scoreChartType === 'doughnut' 
                        ? ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd']
                        : '#0d6efd'
                }]
            };
            
            recreateChart(scoreCtx, scoreChartType, scoreChartData, {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { 
                    legend: { 
                        display: scoreChartType === 'pie' || scoreChartType === 'doughnut',
                        position: 'bottom'
                    } 
                },
                scales: scoreChartType === 'bar' || scoreChartType === 'line' ? { y: { beginAtZero: true } } : {}
            });
        }

        // 4. Biểu đồ kỳ thi theo tháng
        const examCtx = document.getElementById('examChart');
        if (examCtx) {
            const examChartType = document.getElementById('examChartType')?.value || 'bar';
            const examData = chartsData.examChart || {};
            
            const examChartData = {
                labels: examData.labels || [],
                datasets: [{
                    label: 'Kỳ thi',
                    data: examData.data || [],
                    backgroundColor: examChartType === 'bar' ? '#198754' : 'rgba(25, 135, 84, 0.1)',
                    borderColor: '#198754',
                    tension: examChartType === 'line' || examChartType === 'area' ? 0.4 : 0,
                    fill: examChartType === 'area'
                }]
            };
            
            recreateChart(examCtx, examChartType, examChartData, {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            });
        }

        // Thêm event listeners cho các dropdown chọn loại biểu đồ
        setupChartTypeListeners();
        
        // Thêm event listeners cho nút Sinh viên/Giáo viên
        setupUserRoleButtons();
        
        // Tải hoạt động gần đây
        loadRecentActivities();
        
        // Kiểm tra cảnh báo gian lận
        checkCheatingAlerts();
        
    } catch (err) {
        console.error('Lỗi chi tiết:', err);
        showNotification('Lỗi tải dữ liệu thống kê: ' + err.message, 'error');
    }
}

// Hàm tải hoạt động gần đây
async function loadRecentActivities() {
    const activitiesList = document.getElementById('recentActivitiesList');
    if (!activitiesList) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/recent-activities', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Lỗi tải hoạt động gần đây');
        
        const activities = await response.json();
        
        if (activities.length === 0) {
            activitiesList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-inbox"></i>
                    <p class="mb-0 mt-2">Chưa có hoạt động nào gần đây</p>
                </div>
            `;
            return;
        }
        
        activitiesList.innerHTML = activities.map(activity => {
            let clickHandler = '';
            if (activity.exam_id) {
                clickHandler = `onclick="switchSection('exams'); setTimeout(() => { if (typeof viewExamDetail === 'function') viewExamDetail(${activity.exam_id}); }, 100);"`;
            } else if (activity.user_id) {
                clickHandler = `onclick="switchSection('users');"`;
            }
            
            const cursorStyle = clickHandler ? 'cursor: pointer;' : '';
            
            return `
                <div class="border-bottom pb-2 mb-2" style="${cursorStyle}" ${clickHandler}>
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <div class="d-flex align-items-center gap-2 mb-1">
                                <span style="font-size: 1.2em;">${activity.icon}</span>
                                <strong class="small">${activity.title}</strong>
                            </div>
                            <div class="text-muted small">${activity.content}</div>
                        </div>
                        <span class="text-muted small">${activity.time}</span>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Lỗi tải hoạt động gần đây:', err);
        activitiesList.innerHTML = `
            <div class="text-center text-danger py-3">
                <i class="bi bi-exclamation-triangle"></i>
                <p class="mb-0 mt-2">Không thể tải hoạt động</p>
            </div>
        `;
    }
}

// Hàm kiểm tra cảnh báo gian lận
async function checkCheatingAlerts() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/monitor/cheating/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        const totalViolations = data.totalStats?.total_violations || 0;
        const recentViolations = data.dailyStats?.reduce((sum, day) => sum + (day.count || 0), 0) || 0;
        
        const cheatingAlert = document.getElementById('cheatingAlert');
        if (cheatingAlert) {
            if (recentViolations > 0) {
                cheatingAlert.style.display = 'block';
                cheatingAlert.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i> 
                    <small>Có ${recentViolations} cảnh báo gian lận trong 24h qua</small>
                `;
            } else {
                cheatingAlert.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Lỗi kiểm tra cảnh báo:', err);
    }
}

// Hàm thiết lập event listeners cho các dropdown chọn loại biểu đồ
function setupChartTypeListeners() {
    // Biểu đồ người dùng
    const userChartType = document.getElementById('userChartType');
    if (userChartType) {
        userChartType.addEventListener('change', (e) => {
            const userChartCtx = document.getElementById('userChart');
            if (userChartCtx && userChartCtx.chartData) {
                const newType = e.target.value;
                const isStudent = userChartCtx.isStudent !== false;
                const currentData = isStudent ? userChartCtx.chartData.student : userChartCtx.chartData.teacher;
                const currentColor = isStudent ? '#0d6efd' : '#198754';
                const currentLabel = isStudent ? 'Sinh viên mới' : 'Giáo viên mới';
                
                const chartConfig = {
                    labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                    datasets: [{
                        label: currentLabel,
                        data: currentData,
                        borderColor: currentColor,
                        backgroundColor: newType === 'area' ? (currentColor === '#0d6efd' ? 'rgba(13, 110, 253, 0.1)' : 'rgba(25, 135, 84, 0.1)') : currentColor,
                        tension: newType === 'line' || newType === 'area' ? 0.4 : 0,
                        fill: newType === 'area'
                    }]
                };
                
                recreateChart(userChartCtx, newType, chartConfig, {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                });
                userChartCtx.currentType = newType;
            }
        });
    }
    
    // Biểu đồ tỷ lệ hoàn thành
    const completionChartType = document.getElementById('completionChartType');
    if (completionChartType) {
        completionChartType.addEventListener('change', async (e) => {
            const completionCtx = document.getElementById('completionChart');
            if (completionCtx) {
                try {
                    const response = await fetch('http://localhost:3000/api/admin/dashboard/charts', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    const completionData = data.completionChart || {};
                    
                    const chartData = {
                        labels: ['Hoàn thành', 'Đang làm', 'Bỏ dở'],
                        datasets: [{
                            data: [
                                completionData.completed || 0,
                                completionData.inProgress || 0,
                                completionData.abandoned || 0
                            ],
                            backgroundColor: ['#198754', '#ffc107', '#dc3545']
                        }]
                    };
                    
                    recreateChart(completionCtx, e.target.value, chartData, {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { 
                            legend: { 
                                position: e.target.value === 'bar' ? 'top' : 'bottom',
                                display: e.target.value !== 'bar'
                            } 
                        },
                        scales: e.target.value === 'bar' ? { y: { beginAtZero: true } } : {}
                    });
                } catch (err) {
                    console.error('Lỗi cập nhật biểu đồ:', err);
                }
            }
        });
    }
    
    // Biểu đồ phân bố điểm
    const scoreChartType = document.getElementById('scoreChartType');
    if (scoreChartType) {
        scoreChartType.addEventListener('change', async (e) => {
            const scoreCtx = document.getElementById('scoreChart');
            if (scoreCtx) {
                try {
                    const response = await fetch('http://localhost:3000/api/admin/dashboard/charts', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    const scoreData = data.scoreChart || {};
                    
                    const chartData = {
                        labels: scoreData.labels || [],
                        datasets: [{
                            label: 'Số sinh viên',
                            data: scoreData.data || [],
                            backgroundColor: e.target.value === 'pie' || e.target.value === 'doughnut'
                                ? ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd']
                                : '#0d6efd'
                        }]
                    };
                    
                    recreateChart(scoreCtx, e.target.value, chartData, {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { 
                            legend: { 
                                display: e.target.value === 'pie' || e.target.value === 'doughnut',
                                position: 'bottom'
                            } 
                        },
                        scales: e.target.value === 'bar' || e.target.value === 'line' ? { y: { beginAtZero: true } } : {}
                    });
                } catch (err) {
                    console.error('Lỗi cập nhật biểu đồ:', err);
                }
            }
        });
    }
    
    // Biểu đồ kỳ thi
    const examChartType = document.getElementById('examChartType');
    if (examChartType) {
        examChartType.addEventListener('change', async (e) => {
            const examCtx = document.getElementById('examChart');
            if (examCtx) {
                try {
                    const response = await fetch('http://localhost:3000/api/admin/dashboard/charts', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    const examData = data.examChart || {};
                    
                    const chartData = {
                        labels: examData.labels || [],
                        datasets: [{
                            label: 'Kỳ thi',
                            data: examData.data || [],
                            backgroundColor: e.target.value === 'bar' ? '#198754' : 'rgba(25, 135, 84, 0.1)',
                            borderColor: '#198754',
                            tension: e.target.value === 'line' || e.target.value === 'area' ? 0.4 : 0,
                            fill: e.target.value === 'area'
                        }]
                    };
                    
                    recreateChart(examCtx, e.target.value, chartData, {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    });
                } catch (err) {
                    console.error('Lỗi cập nhật biểu đồ:', err);
                }
            }
        });
    }
}

// Hàm thiết lập event listeners cho nút Sinh viên/Giáo viên
function setupUserRoleButtons() {
    const studentBtn = document.getElementById('studentBtn');
    const teacherBtn = document.getElementById('teacherBtn');
    const userChartCtx = document.getElementById('userChart');
    
    if (studentBtn && teacherBtn && userChartCtx && userChartCtx.chartData) {
        // Xóa event listeners cũ
        const newStudentBtn = studentBtn.cloneNode(true);
        const newTeacherBtn = teacherBtn.cloneNode(true);
        studentBtn.parentNode.replaceChild(newStudentBtn, studentBtn);
        teacherBtn.parentNode.replaceChild(newTeacherBtn, teacherBtn);
        
        newStudentBtn.addEventListener('click', () => {
            newStudentBtn.classList.add('active');
            newTeacherBtn.classList.remove('active');
            if (userChartCtx.chartInstance && userChartCtx.chartData) {
                const chartType = userChartCtx.currentType || 'line';
                userChartCtx.isStudent = true;
                userChartCtx.chartInstance.data.datasets[0].label = 'Sinh viên mới';
                userChartCtx.chartInstance.data.datasets[0].data = userChartCtx.chartData.student;
                userChartCtx.chartInstance.data.datasets[0].borderColor = '#0d6efd';
                userChartCtx.chartInstance.data.datasets[0].backgroundColor = chartType === 'area' 
                    ? 'rgba(13, 110, 253, 0.1)' 
                    : '#0d6efd';
                userChartCtx.chartInstance.update();
            }
        });
        
        newTeacherBtn.addEventListener('click', () => {
            newTeacherBtn.classList.add('active');
            newStudentBtn.classList.remove('active');
            if (userChartCtx.chartInstance && userChartCtx.chartData) {
                const chartType = userChartCtx.currentType || 'line';
                userChartCtx.isStudent = false;
                userChartCtx.chartInstance.data.datasets[0].label = 'Giáo viên mới';
                userChartCtx.chartInstance.data.datasets[0].data = userChartCtx.chartData.teacher;
                userChartCtx.chartInstance.data.datasets[0].borderColor = '#198754';
                userChartCtx.chartInstance.data.datasets[0].backgroundColor = chartType === 'area'
                    ? 'rgba(25, 135, 84, 0.1)'
                    : '#198754';
                userChartCtx.chartInstance.update();
            }
        });
    }
}

// Hàm lọc và render bảng users
function filterUsersData() {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase().trim() || '';
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const statusFilter = document.getElementById('userStatusFilter')?.value || '';

    let filteredUsers = allUsers;

    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
            user.full_name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
        );
    }

    if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
    }

    if (statusFilter) {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
    }

    const tbody = document.querySelector('#users-section tbody');
    if (!tbody) {
        console.error('Không tìm thấy tbody trong users-section');
        showNotification('Lỗi giao diện: Không tìm thấy bảng người dùng', 'error');
        return;
    }

    tbody.innerHTML = '';

    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không tìm thấy dữ liệu phù hợp</td></tr>';
        return;
    }

    filteredUsers.forEach(user => {
        const roleClass = {
            'Student': 'bg-primary',
            'Teacher': 'bg-success',
            'Admin': 'bg-danger'
        }[user.role] || 'bg-secondary';

        const statusClass = user.status === 'active' ? 'bg-success' : 'bg-danger';
        const statusText = user.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động';

        tbody.innerHTML += `
            <tr>
                <td>#${user.user_id}</td>
                <td><strong>${user.full_name}</strong></td>
                <td>${user.email}</td>
                <td><span class="badge ${roleClass}">${user.role}</span></td>
                <td>${new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-info" onclick="viewUser(${user.user_id})"><i class="bi bi-eye"></i></button>
                        ${user.role !== 'Admin' ? `<button class="btn btn-sm btn-danger" onclick="deleteUser(${user.user_id})"><i class="bi bi-trash"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
}

// Hàm lấy danh sách người dùng
async function loadUsersData() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const users = await response.json();
        
        allUsers = users.map(user => ({
            ...user,
            status: user.status || 'active'
        }));
        
        filterUsersData();
        
        const userSearch = document.getElementById('userSearch');
        const userRoleFilter = document.getElementById('userRoleFilter');
        const userStatusFilter = document.getElementById('userStatusFilter');

        if (userSearch) {
            userSearch.addEventListener('input', filterUsersData);
        } else {
            console.warn('Không tìm thấy input#userSearch');
        }

        if (userRoleFilter) {
            userRoleFilter.addEventListener('change', filterUsersData);
        } else {
            console.warn('Không tìm thấy select#userRoleFilter');
        }

        if (userStatusFilter) {
            userStatusFilter.addEventListener('change', filterUsersData);
        } else {
            console.warn('Không tìm thấy select#userStatusFilter');
        }
        
    } catch (err) {
        console.error('Lỗi tải dữ liệu người dùng:', err);
        showNotification('Lỗi tải dữ liệu người dùng: ' + err.message, 'error');
    }
}

// Trong admin.html, hàm filterStudentsData
function filterStudentsData() {
  const searchTerm = document.getElementById('studentSearch')?.value.toLowerCase().trim() || '';
  const tbody = document.querySelector('#studentListTableBody');
  if (!tbody) return;

  let filteredStudents = allStudents;

  if (searchTerm) {
    filteredStudents = filteredStudents.filter(student => 
      student.full_name.toLowerCase().includes(searchTerm)
    );
  }

  // Sắp xếp theo điểm
  const sortHeader = document.querySelector('#studentListTable .sortable[data-sort="avg_score"]');
  const sortOrder = sortHeader?.dataset.order || 'desc';
  filteredStudents.sort((a, b) => {
    const scoreA = Number(a.avg_score) || 0;
    const scoreB = Number(b.avg_score) || 0;
    return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });

  tbody.innerHTML = '';

  if (filteredStudents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy sinh viên</td></tr>';
    return;
  }

  filteredStudents.forEach(student => {
    const score = Number(student.avg_score) || 0;
    const scoreClass = score >= 8 ? 'bg-success' : score >= 5 ? 'bg-warning' : 'bg-danger';
    // Lấy subjectId từ URL hoặc lưu trong biến toàn cục
    const subjectId = window.currentSubjectId || '';
    tbody.innerHTML += `
      <tr>
        <td>${student.user_id}</td>
        <td><strong>${student.full_name}</strong></td>
        <td>${student.email}</td>
        <td><span class="badge ${scoreClass}">${score.toFixed(1)}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="viewStudentScores(${subjectId}, ${student.user_id})">
            <i class="bi bi-eye"></i> Xem chi tiết
          </button>
        </td>
      </tr>
    `;
  });
}

// Cập nhật hàm viewSubject
async function viewSubject(subjectId) {
  try {
    // Lưu subjectId để dùng trong viewStudentScores
    window.currentSubjectId = subjectId;
    
    const response = await fetch(`http://localhost:3000/api/admin/subjects/${subjectId}/details`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();

    // Ẩn danh sách môn học, hiện chi tiết
    const subjectsList = document.getElementById('subjectsList');
    const subjectDetail = document.getElementById('subjectDetail');
    if (subjectsList) subjectsList.style.display = 'none';
    if (subjectDetail) subjectDetail.style.display = 'block';

    // Cập nhật thông tin
    document.getElementById('subjectNameDetail').textContent = data.subject_name || 'Không xác định';
    document.getElementById('studentCount').textContent = data.student_count || 0;
    document.getElementById('teacherName').textContent = data.teacher.full_name || 'Chưa có';
    document.getElementById('avgScore').textContent = Number(data.stats.avg_score || 0).toFixed(1);
    document.getElementById('maxScore').textContent = Number(data.stats.max_score || 0).toFixed(1);
    document.getElementById('minScore').textContent = Number(data.stats.min_score || 0).toFixed(1);

    // Lưu danh sách sinh viên
    allStudents = (data.students || []).map(student => ({
      ...student,
      avg_score: Number(student.avg_score) || 0
    }));

    // Render bảng sinh viên
    filterStudentsData();

    // Gắn sự kiện tìm kiếm sinh viên
    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
      studentSearch.value = '';
      studentSearch.addEventListener('input', filterStudentsData);
    }

    // Gắn sự kiện sắp xếp theo điểm
    const sortHeader = document.querySelector('#studentListTable .sortable[data-sort="avg_score"]');
    if (sortHeader) {
      sortHeader.addEventListener('click', () => {
        sortHeader.dataset.order = sortHeader.dataset.order === 'desc' ? 'asc' : 'desc';
        const icon = sortHeader.querySelector('i');
        if (icon) {
          icon.className = sortHeader.dataset.order === 'desc' ? 'bi bi-sort-down' : 'bi bi-sort-up';
        }
        filterStudentsData();
      });
    }

    // Gắn sự kiện xuất CSV
    const exportBtn = document.getElementById('exportScoresBtn');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const csvContent = [
          ['ID', 'Họ tên', 'Email', 'Điểm trung bình'].join(','),
          ...allStudents.map(student => [
            student.user_id,
            `"${student.full_name}"`,
            student.email,
            Number(student.avg_score || 0).toFixed(1)
          ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${data.subject_name}_diem_sinh_vien.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        showNotification('Xuất file CSV thành công!', 'success');
      };
    }

    // Gắn sự kiện nút Quay lại
    const backBtn = document.getElementById('backToSubjectsBtn');
    if (backBtn) {
      backBtn.onclick = () => {
        if (subjectDetail) subjectDetail.style.display = 'none';
        if (subjectsList) subjectsList.style.display = 'block';
        loadSubjectsData();
      };
    }

    showNotification('Đã tải chi tiết môn học thành công!', 'success');
  } catch (err) {
    console.error('Lỗi tải chi tiết môn học:', err);
    showNotification('Lỗi tải chi tiết môn học: ' + err.message, 'error');
  }
}
// Hàm lấy danh sách môn học
async function loadSubjectsData() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/subjects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const subjects = await response.json();
        
        const tbody = document.querySelector('#subjectsTableBody');
        tbody.innerHTML = '';
        
        if (subjects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có dữ liệu</td></tr>';
        } else {
            subjects.forEach(subject => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${subject.subject_id}</strong></td>
                        <td>${subject.subject_name}</td>
                        <td>${subject.question_count}</td>
                        <td>${subject.exam_count}</td>
                        <td><span class="badge bg-success">${subject.status}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-sm btn-info" onclick="viewSubject(${subject.subject_id})"><i class="bi bi-eye"></i></button>
                                <button class="btn btn-sm btn-danger" onclick="deleteSubject(${subject.subject_id})"><i class="bi bi-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }

        // Cập nhật thống kê môn học
        const statValue = document.querySelector('#subjects-section .stat-value');
        if (statValue) statValue.textContent = subjects.length;

        // Đảm bảo hiển thị danh sách môn học
        document.getElementById('subjectsList').style.display = 'block';
        document.getElementById('subjectDetail').style.display = 'none';
    } catch (err) {
        showNotification('Lỗi tải dữ liệu môn học: ' + err.message, 'error');
    }
}

// Hàm lấy danh sách kỳ thi
async function loadExamsData() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const exams = await response.json();
        
        const tbody = document.querySelector('#exams-section tbody');
        tbody.innerHTML = '';
        
        if (exams.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        exams.forEach(exam => {
            const statusClass = {
                'completed': 'bg-success',
                'active': 'bg-primary',
                'upcoming': 'bg-info'
            }[exam.status] || 'bg-secondary';
            
            tbody.innerHTML += `
                <tr>
                    <td>#${exam.exam_id}</td>
                    <td><strong>${exam.exam_name}</strong></td>
                    <td>${exam.subject_name || 'Chưa có môn'}</td>
                    <td>${exam.teacher_name || 'Chưa có giáo viên'}</td>
                    <td>${exam.duration} phút</td>
                    <td>${exam.student_count}</td>
                    <td><span class="badge ${statusClass}">${exam.status}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-info" onclick="viewExam(${exam.exam_id})"><i class="bi bi-eye"></i></button>
                            ${exam.status !== 'active' ? `<button class="btn btn-sm btn-danger" onclick="deleteExam(${exam.exam_id})"><i class="bi bi-trash"></i></button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showNotification('Lỗi tải dữ liệu kỳ thi: ' + err.message, 'error');
    }
}

// Hàm lấy danh sách câu hỏi
async function loadQuestionsData() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/questions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const questions = await response.json();
        
        const tbody = document.querySelector('#questions-section tbody');
        tbody.innerHTML = '';
        
        if (questions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        questions.forEach(question => {
            const difficultyClass = {
                'Easy': 'bg-success',
                'Medium': 'bg-warning',
                'Hard': 'bg-danger'
            }[question.difficulty] || 'bg-secondary';
            const rateClass = question.correct_rate >= 80 ? 'text-success' : question.correct_rate >= 50 ? 'text-warning' : 'text-danger';
            
            tbody.innerHTML += `
                <tr>
                    <td>#${question.question_id}</td>
                    <td><strong>${question.question_content}</strong></td>
                    <td>${question.subject_name || 'Chưa có môn'}</td>
                    <td><span class="badge ${difficultyClass}">${question.difficulty}</span></td>
                    <td>${question.type}</td>
                    <td><span class="${rateClass}">${question.correct_rate}%</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-info" onclick="viewQuestion(${question.question_id})"><i class="bi bi-eye"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${question.question_id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showNotification('Lỗi tải dữ liệu câu hỏi: ' + err.message, 'error');
    }
}

// Khai báo biến cho reports section (cần đặt trước các hàm sử dụng nó)
let allReportsData = [];
let currentReportCharts = {};
let currentReportFilters = {
    period: 'month',
    subject_id: '',
    start_date: '',
    end_date: ''
};

// Xử lý thêm người dùng
document.getElementById('addUserBtn')?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
    modal.show();
});

document.getElementById('saveUserBtn')?.addEventListener('click', async () => {
    const username = document.getElementById('userUsername').value;
    const full_name = document.getElementById('userFullName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;

    if (!username || !full_name || !email || !password || !role) {
        showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, full_name, email, password, role })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification('Thêm người dùng thành công!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
        document.getElementById('addUserForm').reset();
        loadUsersData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
});

// Xử lý thêm môn học
document.getElementById('addSubjectBtn')?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('addSubjectModal'));
    modal.show();
});

document.getElementById('saveSubjectBtn')?.addEventListener('click', async () => {
    const subject_name = document.getElementById('subjectName').value;

    if (!subject_name) {
        showNotification('Vui lòng nhập tên môn học!', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/admin/subjects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject_name })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification('Thêm môn học thành công!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addSubjectModal')).hide();
        document.getElementById('addSubjectForm').reset();
        loadSubjectsData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
});

// Xử lý thêm kỳ thi
document.getElementById('addExamBtn')?.addEventListener('click', async () => {
    // Load danh sách môn học và giáo viên
    try {
        // Load subjects
        const subjectsResponse = await fetch('http://localhost:3000/api/admin/subjects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const subjects = await subjectsResponse.json();
        
        const subjectSelect = document.getElementById('examSubjectId');
        subjectSelect.innerHTML = '<option value="">Chọn môn học</option>';
        subjects.forEach(subject => {
            subjectSelect.innerHTML += `<option value="${subject.subject_id}">${subject.subject_name}</option>`;
        });
        
        // Load teachers
        const usersResponse = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersResponse.json();
        const teachers = users.filter(u => u.role === 'Teacher');
        
        const teacherSelect = document.getElementById('examTeacherId');
        teacherSelect.innerHTML = '<option value="">Chọn giáo viên</option>';
        teachers.forEach(teacher => {
            teacherSelect.innerHTML += `<option value="${teacher.user_id}">${teacher.full_name} (${teacher.email})</option>`;
        });
        
        const modal = new bootstrap.Modal(document.getElementById('addExamModal'));
        modal.show();
    } catch (err) {
        showNotification('Lỗi tải dữ liệu: ' + err.message, 'error');
    }
});

document.getElementById('saveExamBtn')?.addEventListener('click', async () => {
    const exam_name = document.getElementById('examName').value;
    const subject_id = document.getElementById('examSubjectId').value;
    const duration = document.getElementById('examDuration').value;
    
    if (!exam_name || !subject_id || !duration) {
        showNotification('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/exams', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                exam_name, 
                subject_id: parseInt(subject_id), 
                duration: parseInt(duration),
                teacher_id: document.getElementById('examTeacherId').value ? parseInt(document.getElementById('examTeacherId').value) : null
            })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        showNotification('Tạo kỳ thi thành công!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('addExamModal')).hide();
        document.getElementById('addExamForm').reset();
        loadExamsData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
});

// Các hàm xóa
async function deleteUser(userId) {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification('Xóa người dùng thành công!', 'success');
        loadUsersData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
}

async function deleteExam(examId) {
    if (!confirm('Bạn có chắc muốn xóa kỳ thi này?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/exams/${examId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification('Xóa kỳ thi thành công!', 'success');
        loadExamsData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification('Xóa câu hỏi thành công!', 'success');
        loadQuestionsData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
}

async function deleteSubject(subjectId) {
    if (!confirm('Bạn có chắc muốn xóa môn học này?')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/admin/subjects/${subjectId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification('Xóa môn học thành công!', 'success');
        loadSubjectsData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
}

// Hàm lọc và render bảng log gian lận
let allCheatingLogs = [];

function filterCheatingLogs() {
    const examFilter = document.getElementById('examFilter')?.value || '';
    const studentFilter = document.getElementById('studentFilter')?.value || '';
    const eventTypeFilter = document.getElementById('eventTypeFilter')?.value || '';

    let filteredLogs = allCheatingLogs;

    if (examFilter) {
        filteredLogs = filteredLogs.filter(log => log.exam_id == examFilter);
    }
    if (studentFilter) {
        filteredLogs = filteredLogs.filter(log => log.student_id == studentFilter);
    }
    if (eventTypeFilter) {
        filteredLogs = filteredLogs.filter(log => log.event_type === eventTypeFilter);
    }

    const tbody = document.getElementById('cheatingTableBody');
    tbody.innerHTML = '';

    if (filteredLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không tìm thấy dữ liệu</td></tr>';
        return;
    }

    filteredLogs.forEach(log => {
        const eventClass = {
            'TabSwitch': 'bg-warning',
            'CopyPaste': 'bg-danger',
            'WebcamSuspicious': 'bg-info'
        }[log.event_type] || 'bg-secondary';
        
        const eventLabels = {
            'TabSwitch': '🚫 Chuyển tab',
            'CopyPaste': '📋 Copy/Paste',
            'WebcamSuspicious': '📷 Webcam đáng ngờ'
        };
        
        const statusBadge = log.is_banned 
            ? '<span class="badge bg-danger">Đã cấm</span>' 
            : log.cheating_detected 
                ? '<span class="badge bg-warning">Đã phát hiện</span>' 
                : '<span class="badge bg-secondary">Đang theo dõi</span>';

        tbody.innerHTML += `
            <tr>
                <td><strong>${log.student_name || 'N/A'}</strong><br><small class="text-muted">ID: ${log.student_id}</small></td>
                <td>${log.exam_name || 'N/A'}</td>
                <td>${log.teacher_name || 'N/A'}</td>
                <td>${log.class_name || 'Chưa có lớp'}</td>
                <td><span class="badge ${eventClass}">${eventLabels[log.event_type] || log.event_type}</span></td>
                <td><small>${log.event_description || 'Không có mô tả'}</small></td>
                <td><small>${new Date(log.event_time).toLocaleString('vi-VN')}</small></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        ${!log.is_banned ? `
                            <button class="btn btn-danger" onclick="penalize(${log.attempt_id}, 'ban', '${log.exam_name}', ${log.student_id})" title="Cấm thi">
                                <i class="bi bi-ban"></i>
                            </button>
                            <button class="btn btn-warning" onclick="penalize(${log.attempt_id}, 'deduct_points', '${log.exam_name}', ${log.student_id})" title="Trừ điểm">
                                <i class="bi bi-dash-circle"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-info" onclick="viewCheatingDetail(${log.attempt_id})" title="Xem chi tiết">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Hàm lấy dữ liệu giám sát gian lận (cải thiện)
async function loadCheatingData() {
    try {
        // Lấy filter params
        const examId = document.getElementById('examFilter')?.value || '';
        const studentId = document.getElementById('studentFilter')?.value || '';
        const eventType = document.getElementById('eventTypeFilter')?.value || '';
        const startDate = document.getElementById('startDateFilter')?.value || '';
        const endDate = document.getElementById('endDateFilter')?.value || '';
        
        let url = 'http://localhost:3000/api/admin/monitor/cheating?';
        const params = [];
        if (examId) params.push(`exam_id=${examId}`);
        if (studentId) params.push(`student_id=${studentId}`);
        if (eventType) params.push(`event_type=${eventType}`);
        if (startDate) params.push(`start_date=${startDate}`);
        if (endDate) params.push(`end_date=${endDate}`);
        url += params.join('&');
        
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        
        allCheatingLogs = data.logs;
        filterCheatingLogs();

        // Lấy danh sách bài thi để filter
        const examResponse = await fetch('http://localhost:3000/api/admin/exams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const exams = await examResponse.json();
        const examFilter = document.getElementById('examFilter');
        examFilter.innerHTML = '<option value="">Tất cả kỳ thi</option>';
        exams.forEach(exam => {
            examFilter.innerHTML += `<option value="${exam.exam_id}">${exam.exam_name}</option>`;
        });

        // Lấy danh sách học sinh để filter
        const studentResponse = await fetch('http://localhost:3000/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const students = await studentResponse.json();
        const studentFilter = document.getElementById('studentFilter');
        studentFilter.innerHTML = '<option value="">Tất cả học sinh</option>';
        students.filter(s => s.role === 'Student').forEach(student => {
            studentFilter.innerHTML += `<option value="${student.user_id}">${student.full_name}</option>`;
        });

        // Cập nhật thống kê
        const statsResponse = await fetch('http://localhost:3000/api/admin/monitor/cheating/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsData = await statsResponse.json();
        
        // Cập nhật thống kê tổng quan
        const totalStats = statsData.totalStats || {};
        document.getElementById('totalViolations').textContent = totalStats.total_violations || 0;
        document.getElementById('violatingStudents').textContent = totalStats.total_violating_students || 0;
        document.getElementById('affectedExams').textContent = totalStats.affected_exams || 0;
        document.getElementById('bannedStudents').textContent = totalStats.banned_students || 0;

        // Cập nhật biểu đồ gian lận
        const cheatingCtx = document.getElementById('cheatingChart');
        if (cheatingCtx) {
            if (cheatingCtx.chartInstance) {
                cheatingCtx.chartInstance.destroy();
            }
            
            const eventLabels = {
                'TabSwitch': '🚫 Chuyển tab',
                'CopyPaste': '📋 Copy/Paste',
                'WebcamSuspicious': '📷 Webcam đáng ngờ'
            };
            
            cheatingCtx.chartInstance = new Chart(cheatingCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: statsData.stats.map(s => eventLabels[s.event_type] || s.event_type),
                    datasets: [{
                        label: 'Số lần vi phạm',
                        data: statsData.stats.map(s => s.count),
                        backgroundColor: ['#ffc107', '#dc3545', '#17a2b8'],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // Cập nhật top vi phạm
        const topViolators = document.getElementById('topViolators');
        topViolators.innerHTML = '';
        if (statsData.topViolators && statsData.topViolators.length > 0) {
            statsData.topViolators.forEach((v, index) => {
                topViolators.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                        <div>
                            <div class="fw-bold">#${index + 1} ${v.full_name}</div>
                            <small class="text-muted">${v.email || ''}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-danger rounded-pill">${v.violation_count}</span>
                            <div class="small text-muted">${v.affected_exams} bài thi</div>
                        </div>
                    </li>
                `;
            });
        } else {
            topViolators.innerHTML = '<li class="list-group-item text-center text-muted">Chưa có dữ liệu</li>';
        }

        // Cập nhật top bài thi vi phạm
        const topExamsBody = document.getElementById('topExamsBody');
        if (topExamsBody) {
            topExamsBody.innerHTML = '';
            if (statsData.topExams && statsData.topExams.length > 0) {
                statsData.topExams.forEach((exam, index) => {
                    topExamsBody.innerHTML += `
                        <tr>
                            <td><strong>#${index + 1} ${exam.exam_name}</strong></td>
                            <td>${exam.class_name || 'Chưa có lớp'}</td>
                            <td><span class="badge bg-danger">${exam.violation_count}</span></td>
                            <td><span class="badge bg-warning">${exam.violating_students}</span></td>
                        </tr>
                    `;
                });
            } else {
                topExamsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
            }
        }

        // Gắn sự kiện cho bộ lọc
        document.getElementById('examFilter')?.addEventListener('change', loadCheatingData);
        document.getElementById('studentFilter')?.addEventListener('change', loadCheatingData);
        document.getElementById('eventTypeFilter')?.addEventListener('change', loadCheatingData);
        document.getElementById('startDateFilter')?.addEventListener('change', loadCheatingData);
        document.getElementById('endDateFilter')?.addEventListener('change', loadCheatingData);
        document.getElementById('refreshCheatingBtn')?.addEventListener('click', () => {
            document.getElementById('examFilter').value = '';
            document.getElementById('studentFilter').value = '';
            document.getElementById('eventTypeFilter').value = '';
            document.getElementById('startDateFilter').value = '';
            document.getElementById('endDateFilter').value = '';
            loadCheatingData();
        });

        // Gắn sự kiện xuất CSV
        document.getElementById('exportCheatingCsv')?.addEventListener('click', () => {
            window.location.href = 'http://localhost:3000/api/admin/monitor/cheating/export';
        });
    } catch (err) {
        console.error('Lỗi tải dữ liệu gian lận:', err);
        showNotification('Lỗi tải dữ liệu gian lận: ' + err.message, 'error');
    }
}

// Hàm xử lý hành động cấm/trừ điểm (cải thiện)
async function penalize(attemptId, action, examName = '', studentId = null) {
    if (!confirm(`Bạn có chắc muốn ${action === 'ban' ? 'CẤM THI' : 'TRỪ ĐIỂM'} cho học sinh này?`)) {
        return;
    }
    
    try {
        let body = { attempt_id: attemptId, action };
        if (action === 'deduct_points') {
            const points = prompt(`Nhập số điểm trừ (0-10):`);
            if (!points || isNaN(points) || points < 0 || points > 10) {
                showNotification('Số điểm trừ không hợp lệ! Vui lòng nhập từ 0 đến 10', 'error');
                return;
            }
            body.points_deducted = parseFloat(points);
            body.reason = prompt('Nhập lý do trừ điểm:') || 'Vi phạm quy định thi';
        } else {
            body.reason = prompt('Nhập lý do cấm thi:') || 'Vi phạm quy định thi nghiêm trọng';
        }

        const response = await fetch('http://localhost:3000/api/admin/penalize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message);

        showNotification(data.message || 'Thao tác thành công!', 'success');
        setTimeout(() => loadCheatingData(), 500);
    } catch (err) {
        console.error('Lỗi penalize:', err);
        showNotification('Lỗi: ' + (err.message || 'Không thể thực hiện thao tác'), 'error');
    }
}

// Hàm xem chi tiết vi phạm
async function viewCheatingDetail(attemptId) {
    try {
        const log = allCheatingLogs.find(l => l.attempt_id === attemptId);
        if (!log) {
            showNotification('Không tìm thấy thông tin vi phạm', 'error');
            return;
        }
        
        // Tìm tất cả vi phạm của attempt này
        const violations = allCheatingLogs.filter(l => l.attempt_id === attemptId);
        
        let message = `📋 Chi tiết vi phạm:\n\n`;
        message += `Học sinh: ${log.student_name}\n`;
        message += `Bài thi: ${log.exam_name}\n`;
        message += `Lớp: ${log.class_name || 'N/A'}\n`;
        message += `Giáo viên: ${log.teacher_name || 'N/A'}\n`;
        message += `Điểm: ${log.score || 'Chưa có'}\n`;
        message += `Trạng thái: ${log.is_banned ? 'Đã bị cấm' : 'Đang theo dõi'}\n\n`;
        message += `Tổng số vi phạm: ${violations.length}\n\n`;
        message += `Danh sách vi phạm:\n`;
        violations.forEach((v, i) => {
            message += `${i + 1}. ${v.event_type}: ${v.event_description} - ${new Date(v.event_time).toLocaleString('vi-VN')}\n`;
        });
        
        alert(message);
    } catch (err) {
        showNotification('Lỗi xem chi tiết: ' + err.message, 'error');
    }
}

// Hàm xem webcam
function viewWebcam(studentId) {
    let socket;
    if (typeof io !== 'undefined') {
        socket = io('http://localhost:3000', {
            auth: {
                token: localStorage.getItem('token')
            }
        });
    }
    socket.emit('request_webcam', { student_id: studentId });
    const modal = new bootstrap.Modal(document.getElementById('webcamModal'));
    modal.show();
}

// Hàm import câu hỏi
document.getElementById('importQuestionBtn')?.addEventListener('click', () => {
    const modal = new bootstrap.Modal(document.getElementById('importQuestionModal'));
    fetch('http://localhost:3000/api/admin/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()).then(data => {
        const examSelect = document.getElementById('importExamId');
        examSelect.innerHTML = '<option value="">Không chọn kỳ thi</option>';
        data.forEach(exam => {
            examSelect.innerHTML += `<option value="${exam.exam_id}">${exam.exam_name}</option>`;
        });
    });
    modal.show();
});

document.getElementById('saveImportBtn')?.addEventListener('click', async () => {
    const examId = document.getElementById('importExamId').value;
    const file = document.getElementById('importFile').files[0];
    if (!file) {
        showNotification('Vui lòng chọn file!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('exam_id', examId);
    formData.append('file', file);

    try {
        const response = await fetch('http://localhost:3000/api/admin/questions/import', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        showNotification(data.message, 'success');
        if (data.errors) {
            showNotification('Lỗi: ' + data.errors.join('\n'), 'error');
        }
        bootstrap.Modal.getInstance(document.getElementById('importQuestionModal')).hide();
        loadQuestionsData();
    } catch (err) {
        showNotification('Lỗi: ' + err.message, 'error');
    }
});

document.getElementById('previewImportBtn')?.addEventListener('click', async () => {
    const file = document.getElementById('importFile').files[0];
    if (!file) {
        showNotification('Vui lòng chọn file!', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        let questions = [];
        if (file.name.endsWith('.csv')) {
            questions = await new Promise((resolve, reject) => {
                parse(e.target.result, { columns: true, trim: true }, (err, output) => {
                    if (err) reject(err);
                    resolve(output);
                });
            });
        } else {
            const workbook = xlsx.read(e.target.result, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            questions = xlsx.utils.sheet_to_json(sheet);
        }

        const preview = document.getElementById('previewQuestions');
        preview.innerHTML = '';
        questions.forEach((q, i) => {
            preview.innerHTML += `
                <div class="mb-3">
                    <p><strong>Câu ${i + 1}: ${q['question_content'] || q['Câu hỏi']}</strong> (${q['question_type'] || q['Loại câu hỏi']}, ${q['difficulty'] || q['Độ khó']})</p>
                    ${q['option_1'] ? `
                        <p>Đáp án 1: ${q['option_1']}</p>
                        <p>Đáp án 2: ${q['option_2']}</p>
                        ${q['option_3'] ? `<p>Đáp án 3: ${q['option_3']}</p>` : ''}
                        ${q['option_4'] ? `<p>Đáp án 4: ${q['option_4']}</p>` : ''}
                    ` : ''}
                    <p>Đáp án đúng: ${q['correct_answer_text'] || q['Đáp án đúng']}</p>
                </div>
            `;
        });
    };
    reader.readAsArrayBuffer(file);
});

// Socket.IO cho thông báo gian lận
let socket;
if (typeof io !== 'undefined') {
    socket = io('http://localhost:3000', {
        auth: {
            token: localStorage.getItem('token')
        }
    });
    socket.on('connect', () => {
        socket.emit('join', 'admin');
    });
    socket.on('cheating_alert', (data) => {
        showNotification(`Vi phạm: ${data.event_type} từ học sinh ${data.student_id}`, 'warning');
        loadCheatingData();
    });
}

// Cập nhật loadQuestionsData để render bảng câu hỏi
async function loadQuestionsData() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/questions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const questions = await response.json();
        
        const tbody = document.querySelector('#questionsTableBody');
        tbody.innerHTML = '';
        
        if (questions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        questions.forEach(question => {
            const difficultyClass = {
                'Easy': 'bg-success',
                'Medium': 'bg-warning',
                'Hard': 'bg-danger'
            }[question.difficulty] || 'bg-secondary';
            const rateClass = question.correct_rate >= 80 ? 'text-success' : question.correct_rate >= 50 ? 'text-warning' : 'text-danger';
            
            tbody.innerHTML += `
                <tr>
                    <td>#${question.question_id}</td>
                    <td><strong>${question.question_content}</strong></td>
                    <td>${question.subject_name || 'Chưa có môn'}</td>
                    <td><span class="badge ${difficultyClass}">${question.difficulty}</span></td>
                    <td>${question.type}</td>
                    <td><span class="${rateClass}">${question.correct_rate}%</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-info" onclick="viewQuestion(${question.question_id})"><i class="bi bi-eye"></i></button>
                            <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${question.question_id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        showNotification('Lỗi tải dữ liệu câu hỏi: ' + err.message, 'error');
    }
}

// Khởi tạo dữ liệu giám sát gian lận (đã được xử lý trong navigation handler ở trên)

// Các hàm view (placeholder cho users, exams, questions)
function viewUser(userId) {
    showNotification('Tính năng xem chi tiết sẽ được phát triển sau', 'info');
}

// Hàm xem chi tiết kỳ thi
async function viewExam(examId) {
    try {
        const modal = new bootstrap.Modal(document.getElementById('viewExamModal'));
        const contentDiv = document.getElementById('examDetailContent');
        
        // Hiển thị loading
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </div>
        `;
        
        modal.show();
        
        // Lấy dữ liệu chi tiết
        const response = await fetch(`http://localhost:3000/api/admin/exams/${examId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        
        const { exam, attempts, stats } = data;
        
        // Hiển thị chi tiết
        contentDiv.innerHTML = `
            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 class="mb-3">Thông tin kỳ thi</h5>
                    <table class="table table-bordered">
                        <tr>
                            <th style="width: 40%;">Tên kỳ thi:</th>
                            <td><strong>${exam.exam_name}</strong></td>
                        </tr>
                        <tr>
                            <th>Môn học:</th>
                            <td>${exam.subject_name || 'Chưa có'}</td>
                        </tr>
                        <tr>
                            <th>Giáo viên:</th>
                            <td>${exam.teacher_name || 'Chưa có'}</td>
                        </tr>
                        <tr>
                            <th>Thời gian làm bài:</th>
                            <td>${exam.duration} phút</td>
                        </tr>
                        <tr>
                            <th>Trạng thái:</th>
                            <td>
                                <span class="badge ${
                                    exam.status === 'completed' ? 'bg-success' :
                                    exam.status === 'active' ? 'bg-primary' :
                                    exam.status === 'upcoming' ? 'bg-info' : 'bg-secondary'
                                }">${exam.status}</span>
                            </td>
                        </tr>
                        <tr>
                            <th>Tổng số học sinh:</th>
                            <td>${stats.total_students || 0}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h5 class="mb-3">Thống kê</h5>
                    <div class="row g-3">
                        <div class="col-6">
                            <div class="stat-card">
                                <div class="stat-label">Tổng lượt thi</div>
                                <div class="stat-value">${stats.total_attempts || 0}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card">
                                <div class="stat-label">Đã nộp bài</div>
                                <div class="stat-value">${stats.submitted_count || 0}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card">
                                <div class="stat-label">Điểm trung bình</div>
                                <div class="stat-value">${parseFloat(stats.avg_score || 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card">
                                <div class="stat-label">Tỷ lệ hoàn thành</div>
                                <div class="stat-value">${parseFloat(stats.completion_rate || 0).toFixed(1)}%</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card">
                                <div class="stat-label">Điểm cao nhất</div>
                                <div class="stat-value">${parseFloat(stats.highest_score || 0).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="stat-card">
                                <div class="stat-label">Điểm thấp nhất</div>
                                <div class="stat-value">${parseFloat(stats.lowest_score || 0).toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <h5 class="mb-3">Danh sách học sinh tham gia</h5>
            <div class="table-responsive">
                <table class="table table-hover table-sm">
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Điểm số</th>
                            <th>Trạng thái</th>
                            <th>Thời gian làm</th>
                            <th>Cảnh báo gian lận</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${attempts.length === 0 ? 
                            '<tr><td colspan="6" class="text-center">Chưa có học sinh nào tham gia</td></tr>' :
                            attempts.map(attempt => `
                                <tr>
                                    <td>${attempt.full_name}</td>
                                    <td>${attempt.email}</td>
                                    <td>
                                        ${attempt.score !== null ? 
                                            `<span class="badge ${
                                                parseFloat(attempt.score) >= 8 ? 'bg-success' :
                                                parseFloat(attempt.score) >= 6.5 ? 'bg-primary' :
                                                parseFloat(attempt.score) >= 5 ? 'bg-warning' : 'bg-danger'
                                            }">${parseFloat(attempt.score).toFixed(2)}</span>` :
                                            '<span class="text-muted">Chưa có</span>'
                                        }
                                    </td>
                                    <td>
                                        <span class="badge ${
                                            attempt.status === 'Submitted' ? 'bg-success' :
                                            attempt.status === 'InProgress' ? 'bg-primary' :
                                            attempt.status === 'AutoSubmitted' ? 'bg-warning' : 'bg-secondary'
                                        }">${attempt.status}</span>
                                    </td>
                                    <td>
                                        ${attempt.start_time ? 
                                            `${attempt.duration_minutes || 0} phút` : 
                                            'Chưa bắt đầu'
                                        }
                                    </td>
                                    <td>
                                        ${attempt.cheating_warnings > 0 ? 
                                            `<span class="badge bg-danger">${attempt.cheating_warnings}</span>` :
                                            '<span class="text-muted">0</span>'
                                        }
                                    </td>
                                </tr>
                            `).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        document.getElementById('examDetailContent').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Lỗi tải dữ liệu: ${err.message}
            </div>
        `;
    }
}

function viewQuestion(questionId) {
    showNotification('Tính năng xem chi tiết sẽ được phát triển sau', 'info');
}

// Hàm xem chi tiết điểm số của học sinh
async function viewStudentScores(subjectId, studentId) {
    try {
        const modal = new bootstrap.Modal(document.getElementById('viewStudentScoresModal'));
        const contentDiv = document.getElementById('studentScoresContent');
        
        // Hiển thị loading
        contentDiv.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </div>
        `;
        
        modal.show();
        
        // Lấy dữ liệu chi tiết điểm số
        const response = await fetch(`http://localhost:3000/api/admin/subjects/${subjectId}/students/${studentId}/scores`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        
        const { student, subject, scores, stats } = data;
        
        // Hiển thị chi tiết điểm số
        contentDiv.innerHTML = `
            <div class="mb-4">
                <h5 class="mb-3">Thông tin học sinh</h5>
                <div class="row">
                    <div class="col-md-4">
                        <p><strong>Họ tên:</strong> ${student.full_name}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Email:</strong> ${student.email}</p>
                    </div>
                    <div class="col-md-4">
                        <p><strong>Môn học:</strong> ${subject.subject_name}</p>
                    </div>
                </div>
            </div>
            
            <div class="mb-4">
                <h5 class="mb-3">Thống kê tổng quan</h5>
                <div class="row g-3">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-label">Tổng số bài thi</div>
                            <div class="stat-value">${stats.total_exams || 0}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-label">Đã làm bài</div>
                            <div class="stat-value">${stats.attempted_exams || 0}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-label">Đã nộp bài</div>
                            <div class="stat-value">${stats.submitted_exams || 0}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-label">Điểm trung bình</div>
                            <div class="stat-value ${parseFloat(stats.avg_score || 0) >= 5 ? 'text-success' : 'text-danger'}">
                                ${parseFloat(stats.avg_score || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-label">Điểm cao nhất</div>
                            <div class="stat-value text-success">${parseFloat(stats.highest_score || 0).toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-label">Điểm thấp nhất</div>
                            <div class="stat-value text-danger">${parseFloat(stats.lowest_score || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <h5 class="mb-3">Chi tiết điểm số từng bài thi</h5>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Tên bài thi</th>
                            <th>Tổng điểm</th>
                            <th>Điểm đạt được</th>
                            <th>Tỷ lệ</th>
                            <th>Trạng thái</th>
                            <th>Thời gian làm bài</th>
                            <th>Thời gian nộp</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${scores.length === 0 ? 
                            '<tr><td colspan="8" class="text-center">Chưa có dữ liệu điểm số</td></tr>' :
                            scores.map((score, index) => {
                                const examScore = parseFloat(score.score) || 0;
                                const totalPoints = parseFloat(score.total_points) || 1;
                                const percentage = totalPoints > 0 ? (examScore / totalPoints * 100).toFixed(1) : 0;
                                
                                const scoreClass = examScore >= totalPoints * 0.8 ? 'bg-success' :
                                                  examScore >= totalPoints * 0.65 ? 'bg-primary' :
                                                  examScore >= totalPoints * 0.5 ? 'bg-warning' : 'bg-danger';
                                
                                const statusClass = score.status === 'Submitted' ? 'bg-success' :
                                                   score.status === 'InProgress' ? 'bg-primary' :
                                                   score.status === 'AutoSubmitted' ? 'bg-warning' : 'bg-secondary';
                                
                                const statusText = score.status_text || score.status || 'Chưa làm';
                                
                                const startTime = score.start_time ? new Date(score.start_time).toLocaleString('vi-VN') : 'Chưa bắt đầu';
                                const endTime = score.end_time ? new Date(score.end_time).toLocaleString('vi-VN') : 'Chưa nộp';
                                
                                return `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td><strong>${score.exam_name}</strong></td>
                                        <td>${totalPoints.toFixed(2)}</td>
                                        <td>
                                            ${score.score !== null ? 
                                                `<span class="badge ${scoreClass}">${examScore.toFixed(2)}</span>` :
                                                '<span class="text-muted">Chưa có</span>'
                                            }
                                        </td>
                                        <td>
                                            ${score.score !== null ? 
                                                `<span class="${parseFloat(percentage) >= 50 ? 'text-success' : 'text-danger'}">${percentage}%</span>` :
                                                '<span class="text-muted">-</span>'
                                            }
                                        </td>
                                        <td>
                                            <span class="badge ${statusClass}">${statusText}</span>
                                        </td>
                                        <td>
                                            ${score.duration_minutes !== null ? 
                                                `${score.duration_minutes} phút` : 
                                                '<span class="text-muted">-</span>'
                                            }
                                        </td>
                                        <td><small>${endTime}</small></td>
                                    </tr>
                                `;
                            }).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        document.getElementById('studentScoresContent').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> Lỗi tải dữ liệu: ${err.message}
            </div>
        `;
    }
}
// ==========================================
// THÊM CODE NÀY VÀO CUỐI PHẦN <script> TRONG admin.html
// (Sau dòng: setTimeout(loadDashboardData, 100);)
// ==========================================

// Hàm tải dữ liệu báo cáo (CẢI TIẾN)
async function loadReportsData() {
    try {
        showLoading('reportTotalExams');
        
        const params = new URLSearchParams(currentReportFilters);
        const response = await fetch(`http://localhost:3000/api/admin/reports?${params}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        
        // Cập nhật thống kê tổng quan
        updateReportStats(data.stats || {});
        
        // Cập nhật biểu đồ
        updateScoreTrendChart(data.trend || []);
        updateGradeDistributionChart(data.gradeDistribution || []);
        updateSubjectComparisonChart(data.subjectComparison || []);
        
        // Cập nhật bảng top students
        updateTopStudentsTable(data.topStudents || []);
        updateWarningStudentsTable(data.warningStudents || []);
        
        // Cập nhật bảng chi tiết
        allReportsData = data.details || [];
        renderReportTable(allReportsData);
        
        showNotification('Đã tải báo cáo thành công!', 'success');
        
    } catch (err) {
        console.error('Lỗi tải báo cáo:', err);
        showNotification('Lỗi tải dữ liệu báo cáo: ' + err.message, 'error');
        document.getElementById('reportTotalExams').textContent = '0';
    }
}

// Cập nhật thống kê tổng quan
function updateReportStats(stats) {
    document.getElementById('reportTotalExams').textContent = stats.total_exams || 0;
    document.getElementById('reportCompletionRate').textContent = 
        (parseFloat(stats.completion_rate) || 0).toFixed(1) + '%';
    document.getElementById('reportAvgScore').textContent = 
        (parseFloat(stats.average_score) || 0).toFixed(2);
    document.getElementById('reportCheatingWarnings').textContent = 
        stats.cheating_warnings || 0;
    
    // Cập nhật xu hướng
    const completionTrend = stats.completion_trend || 0;
    const scoreTrend = stats.score_trend || 0;
    
    updateTrendIndicator('reportCompletionTrend', completionTrend, '%');
    updateTrendIndicator('reportScoreTrend', scoreTrend, '');
    
    document.getElementById('reportCheatingDetail').textContent = 
        `${stats.violating_students || 0} học sinh vi phạm`;
}

function updateTrendIndicator(elementId, value, suffix) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const isPositive = value >= 0;
    element.className = `stat-change ${isPositive ? 'text-success' : 'text-danger'}`;
    element.innerHTML = `
        <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> 
        ${isPositive ? '+' : ''}${value.toFixed(1)}${suffix}
    `;
}

// Cập nhật biểu đồ xu hướng điểm
function updateScoreTrendChart(trendData) {
    const ctx = document.getElementById('scoreTrendChart');
    if (!ctx) return;
    
    if (currentReportCharts.scoreTrend) {
        currentReportCharts.scoreTrend.destroy();
    }
    
    const chartType = document.querySelector('[data-chart-type].active')?.dataset.chartType || 'line';
    
    currentReportCharts.scoreTrend = new Chart(ctx.getContext('2d'), {
        type: chartType,
        data: {
            labels: trendData.map(d => d.label || d.date),
            datasets: [{
                label: 'Điểm trung bình',
                data: trendData.map(d => d.avg_score),
                borderColor: '#0d6efd',
                backgroundColor: chartType === 'line' ? 'rgba(13, 110, 253, 0.1)' : '#0d6efd',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Điểm TB: ${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Cập nhật biểu đồ phân bố xếp loại
function updateGradeDistributionChart(gradeData) {
    const ctx = document.getElementById('gradeDistributionChart');
    if (!ctx) return;
    
    if (currentReportCharts.gradeDistribution) {
        currentReportCharts.gradeDistribution.destroy();
    }
    
    const excellent = gradeData.find(g => g.grade === 'Xuất sắc')?.count || 0;
    const good = gradeData.find(g => g.grade === 'Khá')?.count || 0;
    const average = gradeData.find(g => g.grade === 'Trung bình')?.count || 0;
    const weak = gradeData.find(g => g.grade === 'Yếu')?.count || 0;
    const total = excellent + good + average + weak;
    
    // Cập nhật phần trăm
    document.getElementById('excellentPercent').textContent = 
        total > 0 ? ((excellent / total) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('goodPercent').textContent = 
        total > 0 ? ((good / total) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('averagePercent').textContent = 
        total > 0 ? ((average / total) * 100).toFixed(1) + '%' : '0%';
    document.getElementById('weakPercent').textContent = 
        total > 0 ? ((weak / total) * 100).toFixed(1) + '%' : '0%';
    
    currentReportCharts.gradeDistribution = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Xuất sắc', 'Khá', 'Trung bình', 'Yếu'],
            datasets: [{
                data: [excellent, good, average, weak],
                backgroundColor: ['#198754', '#0d6efd', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Cập nhật biểu đồ so sánh môn học
function updateSubjectComparisonChart(subjectData) {
    const ctx = document.getElementById('subjectComparisonChart');
    if (!ctx) return;
    
    if (currentReportCharts.subjectComparison) {
        currentReportCharts.subjectComparison.destroy();
    }
    
    currentReportCharts.subjectComparison = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: subjectData.map(s => s.subject_name),
            datasets: [{
                label: 'Điểm trung bình',
                data: subjectData.map(s => s.avg_score),
                backgroundColor: '#0d6efd'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Cập nhật bảng top students
function updateTopStudentsTable(students) {
    const tbody = document.getElementById('topStudentsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Chưa có dữ liệu</td></tr>';
        return;
    }
    
    students.forEach((student, index) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${student.full_name}</td>
                <td><span class="badge bg-success">${(parseFloat(student.avg_score) || 0).toFixed(2)}</span></td>
                <td>${student.exam_count}</td>
            </tr>
        `;
    });
}

// Cập nhật bảng students cần hỗ trợ
function updateWarningStudentsTable(students) {
    const tbody = document.getElementById('warningStudentsTable');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Không có học sinh cần hỗ trợ</td></tr>';
        return;
    }
    
    students.forEach((student, index) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>${student.full_name}</td>
                <td><span class="badge bg-danger">${(parseFloat(student.avg_score) || 0).toFixed(2)}</span></td>
                <td><span class="badge bg-warning">${student.warning_count || 0}</span></td>
            </tr>
        `;
    });
}

// Render bảng báo cáo chi tiết
function renderReportTable(data, page = 1, pageSize = 10) {
    const tbody = document.getElementById('examReportTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>';
        return;
    }
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = data.slice(start, end);
    
    pageData.forEach(exam => {
        const completionClass = exam.completion_rate >= 80 ? 'bg-success' : 
                               exam.completion_rate >= 50 ? 'bg-warning' : 'bg-danger';
        const scoreClass = exam.average_score >= 8 ? 'bg-success' : 
                          exam.average_score >= 6.5 ? 'bg-primary' :
                          exam.average_score >= 5 ? 'bg-warning' : 'bg-danger';
        const cheatingClass = exam.cheating_warnings > 5 ? 'bg-danger' : 
                             exam.cheating_warnings > 0 ? 'bg-warning' : 'bg-success';
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${exam.exam_name}</strong></td>
                <td>${exam.subject_name || 'N/A'}</td>
                <td>${exam.student_count}</td>
                <td><span class="badge ${completionClass}">${(parseFloat(exam.completion_rate) || 0).toFixed(1)}%</span></td>
                <td><span class="badge ${scoreClass}">${(parseFloat(exam.average_score) || 0).toFixed(2)}</span></td>
                <td>${exam.highest_score ? (parseFloat(exam.highest_score) || 0).toFixed(2) : 'N/A'}</td>
                <td>${exam.lowest_score ? (parseFloat(exam.lowest_score) || 0).toFixed(2) : 'N/A'}</td>
                <td><span class="badge ${cheatingClass}">${exam.cheating_warnings}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewExamReport(${exam.exam_id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    // Cập nhật pagination
    updateReportPagination(data.length, page, pageSize);
}

// Cập nhật pagination
function updateReportPagination(total, currentPage, pageSize) {
    const pagination = document.getElementById('reportPagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(total / pageSize);
    
    pagination.innerHTML = '';
    
    // Nút Previous
    pagination.innerHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Trước</a>
        </li>
    `;
    
    // Các trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pagination.innerHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            pagination.innerHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Nút Next
    pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Sau</a>
        </li>
    `;
    
    // Gắn sự kiện click
    pagination.querySelectorAll('a.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page) renderReportTable(allReportsData, page, pageSize);
        });
    });
}

// Xem chi tiết báo cáo kỳ thi
function viewExamReport(examId) {
    // Chuyển sang tab exams và load chi tiết
    document.querySelector('[data-section="exams"]').click();
    setTimeout(() => viewExam(examId), 100);
}

// Xuất Excel
document.getElementById('exportExcel')?.addEventListener('click', async () => {
    try {
        const params = new URLSearchParams(currentReportFilters);
        window.location.href = `http://localhost:3000/api/admin/reports/export/excel?${params}`;
        showNotification('Đang tải file Excel...', 'info');
    } catch (err) {
        showNotification('Lỗi xuất Excel: ' + err.message, 'error');
    }
});

// Áp dụng bộ lọc
document.getElementById('applyReportFilter')?.addEventListener('click', () => {
    currentReportFilters.period = document.getElementById('reportPeriod').value;
    currentReportFilters.subject_id = document.getElementById('reportSubjectFilter').value;
    
    if (currentReportFilters.period === 'custom') {
        currentReportFilters.start_date = document.getElementById('startDate').value;
        currentReportFilters.end_date = document.getElementById('endDate').value;
    }
    
    loadReportsData();
});

// Reset bộ lọc
document.getElementById('resetReportFilter')?.addEventListener('click', () => {
    document.getElementById('reportPeriod').value = 'month';
    document.getElementById('reportSubjectFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('customDateRange').style.display = 'none';
    document.getElementById('customDateRangeTo').style.display = 'none';
    
    currentReportFilters = {
        period: 'month',
        subject_id: '',
        start_date: '',
        end_date: ''
    };
    
    loadReportsData();
});

// Hiển thị custom date range khi chọn "Tùy chỉnh"
document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
    const customDateRange = document.getElementById('customDateRange');
    const customDateRangeTo = document.getElementById('customDateRangeTo');
    
    if (e.target.value === 'custom') {
        customDateRange.style.display = 'block';
        customDateRangeTo.style.display = 'block';
    } else {
        customDateRange.style.display = 'none';
        customDateRangeTo.style.display = 'none';
    }
});

// Chuyển đổi kiểu biểu đồ xu hướng
document.querySelectorAll('[data-chart-type]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('[data-chart-type]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Reload chart với type mới
        const trendData = currentReportCharts.scoreTrend?.data.labels.map((label, i) => ({
            label,
            avg_score: currentReportCharts.scoreTrend.data.datasets[0].data[i]
        })) || [];
        updateScoreTrendChart(trendData);
    });
});

// Tìm kiếm trong bảng báo cáo
document.getElementById('searchExamReport')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredData = allReportsData.filter(exam => 
        exam.exam_name.toLowerCase().includes(searchTerm) ||
        (exam.subject_name && exam.subject_name.toLowerCase().includes(searchTerm))
    );
    renderReportTable(filteredData);
});

// Sắp xếp bảng báo cáo
document.querySelectorAll('#examReportTableBody').forEach(table => {
    table.closest('table')?.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            const currentOrder = th.dataset.order || 'asc';
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
            
            // Reset tất cả các icon
            document.querySelectorAll('.sortable i').forEach(icon => {
                icon.className = 'bi bi-arrow-down-up';
            });
            
            // Cập nhật icon hiện tại
            const icon = th.querySelector('i');
            if (icon) {
                icon.className = newOrder === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down';
            }
            th.dataset.order = newOrder;
            
            // Sắp xếp dữ liệu
            allReportsData.sort((a, b) => {
                let aVal = a[sortKey];
                let bVal = b[sortKey];
                
                // Xử lý các trường hợp đặc biệt
                if (sortKey === 'exam_name' || sortKey === 'subject') {
                    aVal = (aVal || '').toString().toLowerCase();
                    bVal = (bVal || '').toString().toLowerCase();
                } else {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                }
                
                if (newOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
            
            renderReportTable(allReportsData);
        });
    });
});

// Xuất PDF
document.getElementById('exportPDF')?.addEventListener('click', async () => {
    try {
        const params = new URLSearchParams(currentReportFilters);
        const token = localStorage.getItem('token');
        
        // PDF export cần authorization header, nên dùng fetch thay vì window.location
        const response = await fetch(`http://localhost:3000/api/admin/reports/export/pdf?${params}`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        
        if (!response.ok) throw new Error('Lỗi xuất PDF');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bao_cao_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Đã xuất PDF thành công!', 'success');
    } catch (err) {
        console.error('Lỗi xuất PDF:', err);
        showNotification('Lỗi xuất PDF: ' + err.message, 'error');
    }
});

// In báo cáo
document.getElementById('printReport')?.addEventListener('click', () => {
    window.print();
});

// Tải danh sách môn học cho bộ lọc
async function loadSubjectsForReportFilter() {
    try {
        const response = await fetch('http://localhost:3000/api/admin/subjects', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const subjects = await response.json();
        
        const select = document.getElementById('reportSubjectFilter');
        if (select) {
            select.innerHTML = '<option value="">Tất cả môn học</option>';
            subjects.forEach(subject => {
                select.innerHTML += `<option value="${subject.subject_id}">${subject.subject_name}</option>`;
            });
        }
    } catch (err) {
        console.error('Lỗi tải môn học:', err);
    }
}

// Helper function: Show loading
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    }
}

// Khởi tạo khi vào reports section
const reportsNavLink = document.querySelector('[data-section="reports"]');
if (reportsNavLink) {
    const originalClickHandler = reportsNavLink.onclick;
    reportsNavLink.onclick = function(e) {
        if (originalClickHandler) originalClickHandler.call(this, e);
        setTimeout(() => {
            loadSubjectsForReportFilter();
            loadReportsData();
        }, 100);
    };
}
// Khởi tạo dữ liệu ban đầu
setTimeout(loadDashboardData, 100);