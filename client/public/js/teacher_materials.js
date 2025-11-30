// ============================================
// 📚 QUẢN LÝ TÀI LIỆU HỌC TẬP
// ============================================

// Render danh sách tài liệu
async function renderMaterials() {
    if (!appData.currentClassId) {
        return;
    }

    const materialsList = document.getElementById('materialsList');
    if (!materialsList) {
        console.warn('⚠️ [Materials] materialsList element not found');
        return;
    }

    try {
        // Hiển thị loading
        materialsList.innerHTML = '<div style="text-align: center; padding: 40px; color: #718096;">⏳ Đang tải...</div>';

        // Sử dụng apiGet từ api.js
        const materials = await apiGet(`/api/teacher/classes/${appData.currentClassId}/materials`);

        if (!materials || materials.length === 0) {
            materialsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-text">Chưa có tài liệu nào</div>
                    <div class="empty-state-subtext">Thêm tài liệu học tập cho lớp học của bạn</div>
                </div>
            `;
            return;
        }

        // Render danh sách tài liệu
        materialsList.innerHTML = materials.map(material => {
            const fileIcon = getFileIcon(material.file_type);
            const fileSize = formatFileSize(material.file_size);
            const uploadDate = new Date(material.upload_date).toLocaleDateString('vi-VN');

            return `
                <div class="material-item" style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <span style="font-size: 2rem;">${fileIcon}</span>
                            <div>
                                <h4 style="margin: 0; color: #2d3748; font-size: 1.1rem;">${material.title}</h4>
                                <p style="margin: 4px 0 0 0; color: #718096; font-size: 0.9rem;">${material.file_name}</p>
                            </div>
                        </div>
                        ${material.description ? `<p style="color: #4a5568; margin: 8px 0; font-size: 0.95rem;">${material.description}</p>` : ''}
                        <div style="display: flex; gap: 15px; margin-top: 10px; font-size: 0.85rem; color: #718096;">
                            <span>📦 ${fileSize}</span>
                            <span>📅 ${uploadDate}</span>
                            <span>🔗 Liên kết với ${material.linked_questions_count || 0} câu hỏi</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button class="btn btn-secondary" onclick="linkMaterialToQuestions(${material.material_id}, '${material.title.replace(/'/g, "\\'")}')" style="padding: 8px 16px; font-size: 0.9rem;">
                            🔗 Liên kết với câu hỏi
                        </button>
                        <button onclick="downloadMaterial(${material.material_id})" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">
                            📥 Tải xuống
                        </button>
                        <button class="btn btn-danger" onclick="deleteMaterial(${material.material_id}, '${material.title.replace(/'/g, "\\'")}')" style="padding: 8px 16px; font-size: 0.9rem;">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('❌ [Materials] Error loading materials:', error);
        materialsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div class="empty-state-text">Lỗi tải danh sách tài liệu</div>
                <div class="empty-state-subtext">${error.message}</div>
                <button class="btn btn-primary" onclick="renderMaterials()" style="margin-top: 15px;">🔄 Thử lại</button>
            </div>
        `;
    }
}

// Hiển thị form upload tài liệu
function showUploadMaterialForm() {
    const materialsList = document.getElementById('materialsList');
    if (!materialsList) return;

    const uploadForm = document.createElement('div');
    uploadForm.id = 'uploadMaterialForm';
    uploadForm.style.cssText = 'background: white; border: 2px solid #667eea; border-radius: 12px; padding: 25px; margin-bottom: 20px;';
    uploadForm.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #2d3748;">📤 Upload tài liệu mới</h3>
            <button class="btn btn-secondary" onclick="hideUploadMaterialForm()" style="padding: 6px 12px;">✕</button>
        </div>
        <form id="materialUploadForm" onsubmit="handleUploadMaterial(event)">
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Tiêu đề tài liệu <span style="color: #f56565;">*</span></label>
                <input type="text" id="materialTitle" class="form-control" required placeholder="VD: Tài liệu ôn tập Chương 1" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
            </div>
            <div class="form-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Mô tả</label>
                <textarea id="materialDescription" class="form-control" rows="3" placeholder="Mô tả về tài liệu..." style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; resize: vertical;"></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3748;">Chọn file <span style="color: #f56565;">*</span></label>
                <input type="file" id="materialFile" required accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" style="width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <small style="color: #718096; display: block; margin-top: 5px;">Chấp nhận: PDF, Word, Excel, PowerPoint, Text (tối đa 50MB)</small>
            </div>
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn btn-primary" style="flex: 1; padding: 12px;">📤 Upload</button>
                <button type="button" class="btn btn-secondary" onclick="hideUploadMaterialForm()" style="padding: 12px 24px;">Hủy</button>
            </div>
        </form>
    `;

    materialsList.insertBefore(uploadForm, materialsList.firstChild);
}

// Ẩn form upload
function hideUploadMaterialForm() {
    const form = document.getElementById('uploadMaterialForm');
    if (form) {
        form.remove();
    }
}

// Xử lý upload tài liệu
async function handleUploadMaterial(event) {
    event.preventDefault();

    if (!appData.currentClassId) {
        showNotification('❌ Vui lòng chọn lớp học', 'error');
        return;
    }

    const title = document.getElementById('materialTitle')?.value.trim();
    const description = document.getElementById('materialDescription')?.value.trim();
    const fileInput = document.getElementById('materialFile');

    if (!title) {
        showNotification('❌ Vui lòng nhập tiêu đề tài liệu', 'error');
        return;
    }

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        showNotification('❌ Vui lòng chọn file để upload', 'error');
        return;
    }

    const file = fileInput.files[0];

    // Kiểm tra kích thước file (50MB)
    if (file.size > 50 * 1024 * 1024) {
        showNotification('❌ File quá lớn! Tối đa 50MB', 'error');
        return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '⏳ Đang upload...';

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        if (description) {
            formData.append('description', description);
        }

        // Sử dụng fetch trực tiếp vì apiPost không hỗ trợ FormData tốt
        const token = localStorage.getItem('token');
        // Build URL (tương tự như trong api.js)
        const baseUrl = (window.CONFIG && window.CONFIG.API_BASE_URL) || '';
        const url = `/api/teacher/classes/${appData.currentClassId}/materials`;
        const fullUrl = baseUrl ? (baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl) + (url.startsWith('/') ? url : '/' + url) : url;
        
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        // Kiểm tra response có text không trước khi parse JSON
        const text = await response.text();
        let data;
        
        if (!text || text.trim() === '') {
            // Response rỗng
            if (!response.ok) {
                throw new Error(`Upload thất bại: HTTP ${response.status}`);
            }
            throw new Error('Server không trả về dữ liệu');
        }

        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error('❌ [Materials] Invalid JSON response:', text.substring(0, 200));
            throw new Error(`Lỗi phản hồi từ server: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(data.error || data.message || `Upload thất bại: HTTP ${response.status}`);
        }

        showNotification('✅ Upload tài liệu thành công!', 'success');
        hideUploadMaterialForm();
        await renderMaterials();

    } catch (error) {
        console.error('❌ [Materials] Upload error:', error);
        showNotification(`❌ ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Xóa tài liệu
async function deleteMaterial(materialId, materialTitle) {
    if (!confirm(`Bạn có chắc muốn xóa tài liệu "${materialTitle}"?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }

    try {
        await apiDelete(`/api/teacher/materials/${materialId}`);
        showNotification('✅ Xóa tài liệu thành công', 'success');
        await renderMaterials();
    } catch (error) {
        console.error('❌ [Materials] Delete error:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Liên kết tài liệu với câu hỏi
async function linkMaterialToQuestions(materialId, materialTitle) {
    if (!appData.currentClassId) {
        showNotification('❌ Vui lòng chọn lớp học', 'error');
        return;
    }

    // Lấy danh sách câu hỏi của lớp
    try {
        const classExams = await apiGet(`/api/teacher/classes/${appData.currentClassId}/exams`);
        if (!classExams || classExams.length === 0) {
            showNotification('❌ Lớp học này chưa có bài thi nào', 'error');
            return;
        }

        // Lấy tất cả câu hỏi từ các bài thi
        const allQuestions = [];
        for (const exam of classExams) {
            try {
                const response = await apiGet(`/api/teacher/exams/${exam.exam_id}/questions`);
                // API trả về object có cấu trúc { exam_name, total_questions, questions: [...] }
                const questions = response?.questions || (Array.isArray(response) ? response : []);
                if (questions && questions.length > 0) {
                    questions.forEach(q => {
                        allQuestions.push({
                            ...q,
                            exam_title: exam.title || exam.exam_name
                        });
                    });
                }
            } catch (err) {
                console.warn('Error loading questions for exam:', exam.exam_id, err);
            }
        }

        if (allQuestions.length === 0) {
            showNotification('❌ Không tìm thấy câu hỏi nào', 'error');
            return;
        }

        // Hiển thị modal chọn câu hỏi
        showQuestionSelectionModal(materialId, materialTitle, allQuestions);

    } catch (error) {
        console.error('❌ [Materials] Error loading questions:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Hiển thị modal chọn câu hỏi
function showQuestionSelectionModal(materialId, materialTitle, questions) {
    // Tạo modal
    const modal = document.createElement('div');
    modal.id = 'questionSelectionModal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 25px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #2d3748;">🔗 Liên kết tài liệu với câu hỏi</h3>
                <button onclick="closeQuestionSelectionModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #718096;">✕</button>
            </div>
            <p style="color: #4a5568; margin-bottom: 20px;">Tài liệu: <strong>${materialTitle}</strong></p>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                ${questions.map((q, idx) => `
                    <label style="display: flex; align-items: start; gap: 10px; padding: 10px; border-bottom: 1px solid #f7fafc; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f7fafc'" onmouseout="this.style.background='white'">
                        <input type="checkbox" value="${q.question_id}" class="question-checkbox" style="margin-top: 4px;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #2d3748; margin-bottom: 4px;">Câu ${idx + 1}: ${q.question_content?.substring(0, 100)}${q.question_content?.length > 100 ? '...' : ''}</div>
                            <div style="font-size: 0.85rem; color: #718096;">Bài thi: ${q.exam_title || 'N/A'}</div>
                        </div>
                    </label>
                `).join('')}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-primary" onclick="saveMaterialQuestionLinks(${materialId})" style="flex: 1; padding: 12px;">💾 Lưu liên kết</button>
                <button class="btn btn-secondary" onclick="closeQuestionSelectionModal()" style="padding: 12px 24px;">Hủy</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Đóng modal chọn câu hỏi
function closeQuestionSelectionModal() {
    const modal = document.getElementById('questionSelectionModal');
    if (modal) {
        modal.remove();
    }
}

// Lưu liên kết tài liệu với câu hỏi
async function saveMaterialQuestionLinks(materialId) {
    const checkboxes = document.querySelectorAll('.question-checkbox:checked');
    const questionIds = Array.from(checkboxes).map(cb => cb.value);

    if (questionIds.length === 0) {
        showNotification('❌ Vui lòng chọn ít nhất một câu hỏi', 'error');
        return;
    }

    try {
        // Liên kết với từng câu hỏi
        for (const questionId of questionIds) {
            try {
                await apiPost(`/api/teacher/questions/${questionId}/materials/${materialId}`);
            } catch (err) {
                console.warn(`Warning linking question ${questionId}:`, err.message);
            }
        }

        showNotification(`✅ Đã liên kết tài liệu với ${questionIds.length} câu hỏi`, 'success');
        closeQuestionSelectionModal();
        await renderMaterials();

    } catch (error) {
        console.error('❌ [Materials] Error saving links:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// Helper: Lấy icon theo loại file
function getFileIcon(fileType) {
    const icons = {
        '.pdf': '📄',
        '.doc': '📝',
        '.docx': '📝',
        '.xls': '📊',
        '.xlsx': '📊',
        '.ppt': '📽️',
        '.pptx': '📽️',
        '.txt': '📄'
    };
    return icons[fileType.toLowerCase()] || '📄';
}

// Helper: Format kích thước file
// Download tài liệu
async function downloadMaterial(materialId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('❌ Vui lòng đăng nhập lại!', 'error');
            return;
        }

        showNotification('📥 Đang tải xuống...', 'info');

        // Build URL với CONFIG.API_BASE_URL để đảm bảo gửi đến đúng server
        const baseUrl = (window.CONFIG && window.CONFIG.API_BASE_URL) || '';
        const downloadUrl = `${baseUrl}/api/teacher/materials/${materialId}/download`;
        
        // Sử dụng fetch với URL đầy đủ
        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Lỗi tải xuống' }));
            throw new Error(errorData.error || 'Lỗi tải xuống tài liệu');
        }

        // Lấy blob từ response
        const blob = await response.blob();
        
        // Tạo URL từ blob
        const url = window.URL.createObjectURL(blob);
        
        // Tạo link tạm để download
        const link = document.createElement('a');
        link.href = url;
        link.style.display = 'none';
        
        // Lấy tên file từ header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let downloadFileName = `material_${materialId}`;
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
                downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
                if (downloadFileName.startsWith("UTF-8''")) {
                    downloadFileName = decodeURIComponent(downloadFileName.substring(7));
                }
            }
        }
        
        link.download = downloadFileName;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup sau 100ms
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('✅ Tải xuống thành công!', 'success');
    } catch (error) {
        console.error('Lỗi download tài liệu:', error);
        showNotification(`❌ ${error.message || 'Lỗi tải xuống tài liệu'}`, 'error');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

