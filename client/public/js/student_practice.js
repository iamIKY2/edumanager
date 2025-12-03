// student_practice.js - Quản lý tạo đề luyện tập bằng AI

let selectedAIModel = null;
let currentMaterialId = null;
let currentPrompt = '';

// ============================================
// Hiển thị modal chọn AI model
// ============================================
async function showAIModelModal(context = 'student', onSelectCallback = null) {
    const modal = document.getElementById('aiModelModal');
    if (!modal) {
        createAIModelModal();
    }
    
    const modalElement = document.getElementById('aiModelModal');
    const quotaInfo = document.getElementById('quotaInfo');
    
    // Nếu là học sinh, hiển thị quota
    if (context === 'student') {
        quotaInfo.style.display = 'block';
        await loadStudentQuota();
    } else {
        quotaInfo.style.display = 'none';
    }
    
    // Kiểm tra preference
    const preference = await getUserAIPreference();
    if (preference) {
        document.getElementById('rememberPreference').checked = true;
    }
    
    // Lưu callback
    if (onSelectCallback) {
        modalElement.dataset.callback = 'custom';
        window.aiModelSelectCallback = onSelectCallback;
    }
    
    modalElement.style.display = 'flex';
}

// ============================================
// Tạo modal HTML
// ============================================
function createAIModelModal() {
    const modal = document.createElement('div');
    modal.id = 'aiModelModal';
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: none; align-items: center; justify-content: center;';
    
    modal.innerHTML = `
        <div class="ai-model-modal-content" style="background: white; border-radius: 15px; padding: 30px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative;">
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #2d3748;">🤖 Chọn AI Model</h2>
                <span class="close-btn" onclick="closeAIModelModal()" style="font-size: 28px; cursor: pointer; color: #666;">&times;</span>
            </div>
            
            <div id="quotaInfo" class="quota-info" style="display: none; background: #f7fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #2d3748;">📊 Quota của bạn hôm nay:</h3>
                <div class="quota-bars" style="display: flex; flex-direction: column; gap: 10px;">
                    <div class="quota-item" style="display: flex; align-items: center; gap: 10px;">
                        <span style="min-width: 60px; font-weight: 600;">Groq:</span>
                        <div class="quota-bar" style="flex: 1; height: 8px; background: #e1e8ed; border-radius: 4px; overflow: hidden;">
                            <div class="quota-fill" id="groqQuota" style="height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s; width: 0%;"></div>
                        </div>
                        <span id="groqQuotaText" style="min-width: 50px; text-align: right; font-size: 14px;">0/10</span>
                    </div>
                    <div class="quota-item" style="display: flex; align-items: center; gap: 10px;">
                        <span style="min-width: 60px; font-weight: 600;">Gemini:</span>
                        <div class="quota-bar" style="flex: 1; height: 8px; background: #e1e8ed; border-radius: 4px; overflow: hidden;">
                            <div class="quota-fill" id="geminiQuota" style="height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s; width: 0%;"></div>
                        </div>
                        <span id="geminiQuotaText" style="min-width: 50px; text-align: right; font-size: 14px;">0/5</span>
                    </div>
                </div>
            </div>
            
            <div class="model-options" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <!-- Groq Option -->
                <div class="model-card" data-model="groq" onclick="selectAIModel('groq')" style="border: 2px solid #e1e8ed; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s; background: white;">
                    <div class="model-header" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div class="model-icon" style="font-size: 2.5rem;">⚡</div>
                        <div class="model-title" style="flex: 1;">
                            <h3 style="margin: 0; font-size: 1.3rem; color: #2d3748;">Groq (Llama 3.1)</h3>
                            <span class="badge badge-fast" style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: #e6fffa; color: #234e52; margin-top: 5px;">Nhanh nhất</span>
                        </div>
                    </div>
                    <div class="model-features" style="margin: 15px 0;">
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">⚡</span>
                            <span>Tốc độ: <strong>Rất nhanh</strong> (~2 giây)</span>
                        </div>
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">✅</span>
                            <span>Chất lượng: <strong>Cao</strong></span>
                        </div>
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">📊</span>
                            <span>Quota: <strong id="groqQuotaDisplay">10 lần/ngày</strong></span>
                        </div>
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">💰</span>
                            <span>Chi phí: <strong>Thấp</strong></span>
                        </div>
                    </div>
                    <div class="model-suggestion" style="background: #f7fafc; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 0.85rem; color: #667eea; border-left: 3px solid #667eea;">
                        💡 Phù hợp: Tạo đề nhanh, câu hỏi đơn giản đến trung bình
                    </div>
                    <button class="btn-select-model" data-model="groq" onclick="event.stopPropagation(); selectAIModel('groq');" style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; transition: all 0.3s; margin-top: 10px;">
                        ⚡ Chọn Groq
                    </button>
                </div>
                
                <!-- Gemini Option -->
                <div class="model-card" data-model="gemini" onclick="selectAIModel('gemini')" style="border: 2px solid #e1e8ed; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.3s; background: white;">
                    <div class="model-header" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                        <div class="model-icon" style="font-size: 2.5rem;">🧠</div>
                        <div class="model-title" style="flex: 1;">
                            <h3 style="margin: 0; font-size: 1.3rem; color: #2d3748;">Gemini 2.5 Flash</h3>
                            <span class="badge badge-quality" style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: #eef2ff; color: #4338ca; margin-top: 5px;">Chất lượng cao</span>
                        </div>
                    </div>
                    <div class="model-features" style="margin: 15px 0;">
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">⏱️</span>
                            <span>Tốc độ: <strong>Trung bình</strong> (~5 giây)</span>
                        </div>
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">✅</span>
                            <span>Chất lượng: <strong>Rất cao</strong></span>
                        </div>
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">📊</span>
                            <span>Quota: <strong id="geminiQuotaDisplay">5 lần/ngày</strong></span>
                        </div>
                        <div class="feature-item" style="display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.9rem; color: #4a5568;">
                            <span class="icon" style="font-size: 1.2rem; width: 24px; text-align: center;">💰</span>
                            <span>Chi phí: <strong>Miễn phí</strong></span>
                        </div>
                    </div>
                    <div class="model-suggestion" style="background: #f7fafc; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 0.85rem; color: #667eea; border-left: 3px solid #667eea;">
                        💡 Phù hợp: Đề phức tạp, câu hỏi khó, cần độ chính xác cao
                    </div>
                    <button class="btn-select-model" data-model="gemini" onclick="event.stopPropagation(); selectAIModel('gemini');" style="width: 100%; padding: 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; cursor: pointer; transition: all 0.3s; margin-top: 10px;">
                        🧠 Chọn Gemini
                    </button>
                </div>
            </div>
            
            <div class="preference-option" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e1e8ed;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 0.9rem; color: #4a5568;">
                    <input type="checkbox" id="rememberPreference" style="width: 18px; height: 18px; cursor: pointer;">
                    <span>Nhớ lựa chọn của tôi (không hỏi lại lần sau)</span>
                </label>
            </div>
            
            <div class="modal-footer" style="margin-top: 20px; text-align: right;">
                <button class="btn btn-secondary" onclick="closeAIModelModal()" style="padding: 10px 20px; border: none; border-radius: 8px; background: #95a5a6; color: white; cursor: pointer; font-weight: 600;">Hủy</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Thêm CSS cho hover effect
    const style = document.createElement('style');
    style.textContent = `
        .model-card:hover {
            border-color: #667eea !important;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
        }
        .model-card.selected {
            border-color: #667eea !important;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
        }
        .btn-select-model:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        @media (max-width: 768px) {
            .model-options {
                grid-template-columns: 1fr !important;
            }
            .ai-model-modal-content {
                width: 95% !important;
                padding: 20px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// Chọn AI model
// ============================================
async function selectAIModel(model) {
    const remember = document.getElementById('rememberPreference')?.checked || false;
    
    // Lưu preference nếu cần
    if (remember) {
        await saveUserAIPreference(model);
    }
    
    // Đóng modal
    closeAIModelModal();
    
    // Lưu vào biến global
    selectedAIModel = model;
    
    // Trigger event
    window.dispatchEvent(new CustomEvent('aiModelSelected', { 
        detail: { model, remember } 
    }));
    
    // Nếu có custom callback
    if (window.aiModelSelectCallback) {
        window.aiModelSelectCallback(model);
        window.aiModelSelectCallback = null;
    }
}

// ============================================
// Đóng modal
// ============================================
function closeAIModelModal() {
    const modal = document.getElementById('aiModelModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// Load quota học sinh
// ============================================
async function loadStudentQuota() {
    try {
        const quota = await apiGet('/api/ai/quota');
        
        // Update Groq quota
        const groqUsed = quota.groq?.used || 0;
        const groqLimit = quota.groq?.limit || 10;
        const groqRemaining = quota.groq?.remaining || 0;
        
        const groqQuotaEl = document.getElementById('groqQuota');
        const groqQuotaTextEl = document.getElementById('groqQuotaText');
        const groqQuotaDisplayEl = document.getElementById('groqQuotaDisplay');
        
        if (groqQuotaEl) groqQuotaEl.style.width = `${(groqUsed / groqLimit) * 100}%`;
        if (groqQuotaTextEl) groqQuotaTextEl.textContent = `${groqUsed}/${groqLimit}`;
        if (groqQuotaDisplayEl) groqQuotaDisplayEl.textContent = `${groqRemaining} lần/ngày`;
        
        // Update Gemini quota
        const geminiUsed = quota.gemini?.used || 0;
        const geminiLimit = quota.gemini?.limit || 5;
        const geminiRemaining = quota.gemini?.remaining || 0;
        
        const geminiQuotaEl = document.getElementById('geminiQuota');
        const geminiQuotaTextEl = document.getElementById('geminiQuotaText');
        const geminiQuotaDisplayEl = document.getElementById('geminiQuotaDisplay');
        
        if (geminiQuotaEl) geminiQuotaEl.style.width = `${(geminiUsed / geminiLimit) * 100}%`;
        if (geminiQuotaTextEl) geminiQuotaTextEl.textContent = `${geminiUsed}/${geminiLimit}`;
        if (geminiQuotaDisplayEl) geminiQuotaDisplayEl.textContent = `${geminiRemaining} lần/ngày`;
        
    } catch (error) {
        console.error('Error loading quota:', error);
    }
}

// ============================================
// Lưu preference
// ============================================
async function saveUserAIPreference(model) {
    try {
        await apiPost('/api/ai/preference', { model });
    } catch (error) {
        console.error('Error saving preference:', error);
    }
}

// ============================================
// Lấy preference
// ============================================
async function getUserAIPreference() {
    try {
        const response = await apiGet('/api/ai/preference');
        return response?.model || null;
    } catch (error) {
        return null;
    }
}

// ============================================
// Load danh sách tài liệu
// ============================================
async function loadPracticeMaterials() {
    try {
        const response = await apiGet('/api/student/practice/materials');
        const select = document.getElementById('practiceMaterialSelect');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">-- Chọn tài liệu --</option>';
        
        if (response.materials && response.materials.length > 0) {
            response.materials.forEach(material => {
                const option = document.createElement('option');
                option.value = material.material_id;
                
                // Hiển thị gợi ý số câu hỏi (không bắt buộc)
                let questionInfo = '';
                if (material.estimated_questions && material.estimated_questions > 0) {
                    questionInfo = ` - Gợi ý: ~${material.estimated_questions} câu hỏi`;
                } else if (material.word_count === 0 || !material.word_count) {
                    questionInfo = ' - Chưa extract nội dung';
                } else {
                    questionInfo = ' - Đang xử lý...';
                }
                
                // Hiển thị loại file với icon phù hợp
                const fileTypeMap = {
                    '.pdf': '📄 PDF',
                    '.doc': '📝 Word',
                    '.docx': '📝 Word',
                    '.xls': '📊 Excel',
                    '.xlsx': '📊 Excel',
                    '.ppt': '📊 PowerPoint',
                    '.pptx': '📊 PowerPoint',
                    '.txt': '📄 Text'
                };
                const fileTypeLabel = fileTypeMap[material.file_type] || `📎 ${material.file_type.toUpperCase().replace('.', '')}`;
                
                option.textContent = `${material.title} (${fileTypeLabel}) - ${material.teacher_name}${questionInfo}`;
                option.dataset.material = JSON.stringify(material);
                select.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Không có tài liệu nào từ giáo viên';
            option.disabled = true;
            select.appendChild(option);
        }
        
        // Thêm event listener để cập nhật số câu hỏi tối đa khi chọn file
        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption && selectedOption.dataset.material) {
                try {
                    const material = JSON.parse(selectedOption.dataset.material);
                    const numQuestionsInput = document.getElementById('practiceNumQuestions');
                    
                    if (numQuestionsInput && material.estimated_questions && material.estimated_questions > 0) {
                        // Tăng max value lên cao để cho phép học sinh tự chọn linh hoạt
                        // Không giới hạn chặt, chỉ đặt max cao (200 câu) để tránh nhập sai
                        numQuestionsInput.max = 200;
                        
                        // Không ép buộc điều chỉnh giá trị hiện tại
                        // Học sinh có thể tự chọn số câu hỏi mong muốn
                        
                        // Hiển thị gợi ý (không bắt buộc)
                        const infoText = `💡 Gợi ý: File này có thể tạo khoảng ${material.estimated_questions} câu hỏi. Bạn có thể chọn số câu hỏi linh hoạt (1-200 câu).`;
                        let infoEl = document.getElementById('materialQuestionInfo');
                        if (!infoEl) {
                            infoEl = document.createElement('small');
                            infoEl.id = 'materialQuestionInfo';
                            infoEl.style.cssText = 'color: #667eea; font-size: 12px; margin-top: 5px; display: block; font-weight: 500;';
                            select.parentElement.appendChild(infoEl);
                        }
                        infoEl.textContent = infoText;
                    } else {
                        // Xóa thông báo nếu không có thông tin
                        const infoEl = document.getElementById('materialQuestionInfo');
                        if (infoEl) {
                            infoEl.remove();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing material data:', e);
                }
            } else {
                // Xóa thông báo khi không chọn file
                const infoEl = document.getElementById('materialQuestionInfo');
                if (infoEl) {
                    infoEl.remove();
                }
            }
        });
    } catch (error) {
        console.error('Error loading materials:', error);
        showNotification('❌ Lỗi khi tải danh sách tài liệu', 'error');
    }
}

// ============================================
// Tạo đề luyện tập với AI
// ============================================
async function createPracticeExamWithAI() {
    const materialSelect = document.getElementById('practiceMaterialSelect');
    const promptInput = document.getElementById('practicePrompt');
    const numQuestions = document.getElementById('practiceNumQuestions');
    const difficulty = document.getElementById('practiceDifficulty');
    
    if (!materialSelect || !promptInput) {
        showNotification('❌ Không tìm thấy form tạo đề', 'error');
        return;
    }
    
    const materialId = materialSelect.value;
    const prompt = promptInput.value.trim();
    
    if (!materialId) {
        showNotification('❌ Vui lòng chọn tài liệu', 'error');
        return;
    }
    
    if (!prompt) {
        showNotification('❌ Vui lòng nhập mô tả đề thi', 'error');
        return;
    }
    
    // Lưu thông tin
    currentMaterialId = materialId;
    currentPrompt = prompt;
    
    // Hiển thị modal chọn AI model
    await showAIModelModal('student', async (selectedModel) => {
        await proceedCreatePracticeExam(selectedModel);
    });
}

// ============================================
// Tiến hành tạo đề sau khi chọn model
// ============================================
async function proceedCreatePracticeExam(aiModel) {
    const materialSelect = document.getElementById('practiceMaterialSelect');
    const promptInput = document.getElementById('practicePrompt');
    const numQuestions = document.getElementById('practiceNumQuestions');
    const difficulty = document.getElementById('practiceDifficulty');
    
    const materialId = currentMaterialId || materialSelect.value;
    const prompt = currentPrompt || promptInput.value.trim();
    const numQ = parseInt(numQuestions?.value || 10);
    const diff = difficulty?.value || 'Medium';
    
    // Hiển thị loading spinner
    const loadingEl = document.getElementById('practiceLoading');
    const createBtn = document.getElementById('practiceCreateBtn');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
    if (createBtn) {
        createBtn.disabled = true;
    }
    
    try {
        const result = await apiPost('/api/student/practice/ai/create', {
            material_id: parseInt(materialId),
            prompt: prompt,
            options: {
                numberOfQuestions: numQ,
                questionType: 'SingleChoice',
                difficulty: diff
            },
            ai_model: aiModel
        });
        
        if (result.success) {
            // Ẩn loading
            if (loadingEl) loadingEl.style.display = 'none';
            if (createBtn) createBtn.disabled = false;
            
            showNotification(`✅ Đã tạo đề luyện tập thành công! (${result.total_questions} câu hỏi)`, 'success');
            
            // Reset form
            if (promptInput) promptInput.value = '';
            if (materialSelect) materialSelect.value = '';
            
            // Load lại danh sách đề
            await loadPracticeExams();
            
            // Chuyển sang tab "Đề luyện tập của tôi"
            showSection('my-practice');
        }
    } catch (error) {
        console.error('Error creating practice exam:', error);
        
        // Ẩn loading
        if (loadingEl) loadingEl.style.display = 'none';
        if (createBtn) createBtn.disabled = false;
        
        showNotification(`❌ ${error.message || 'Lỗi khi tạo đề luyện tập'}`, 'error');
    }
}

// ============================================
// Load danh sách đề luyện tập
// ============================================
async function loadPracticeExams() {
    try {
        const response = await apiGet('/api/student/practice/exams');
        const container = document.getElementById('practiceExamsList');
        
        if (!container) return;
        
        if (!response.exams || response.exams.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">📚</div>
                    <p>Bạn chưa có đề luyện tập nào</p>
                    <button class="btn btn-primary" onclick="showSection('create-practice')" style="margin-top: 20px;">
                        Tạo đề luyện tập ngay
                    </button>
                </div>
            `;
            return;
        }
        
        // Load attempts cho mỗi exam
        const examsWithAttempts = await Promise.all(
            response.exams.map(async (exam) => {
                try {
                    const attemptsData = await apiGet(`/api/student/practice/exams/${exam.practice_exam_id}/attempts`);
                    exam.attempts = attemptsData.attempts || [];
                } catch (error) {
                    console.error(`Error loading attempts for exam ${exam.practice_exam_id}:`, error);
                    exam.attempts = [];
                }
                return exam;
            })
        );
        
        container.innerHTML = examsWithAttempts.map(exam => {
            const providerBadge = exam.ai_provider === 'groq' ? 
                '<span style="background: #e6fffa; color: #234e52; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">⚡ Groq</span>' :
                '<span style="background: #eef2ff; color: #4338ca; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">🧠 Gemini</span>';
            
            const attemptsHTML = exam.attempts && exam.attempts.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e1e8ed;">
                    <div style="font-weight: 600; margin-bottom: 10px; color: #2d3748;">📚 Lịch sử làm bài:</div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${exam.attempts.map(attempt => {
                            const percentage = attempt.total_points > 0 ? 
                                ((attempt.score / attempt.total_points) * 100).toFixed(1) : 0;
                            const dateStr = new Date(attempt.start_time).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f7fafc; border-radius: 8px; cursor: pointer;" 
                                     onclick="viewPracticeResult(${exam.practice_exam_id}, ${attempt.attempt_id})">
                                    <div>
                                        <div style="font-weight: 600; color: #2d3748;">${dateStr}</div>
                                        <div style="font-size: 0.85rem; color: #666;">${attempt.duration_minutes || 0} phút</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: #667eea; font-size: 1.1rem;">
                                            ${attempt.score}/${attempt.total_points}
                                        </div>
                                        <div style="font-size: 0.85rem; color: #666;">${percentage}%</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '';
            
            return `
                <div class="practice-exam-card" style="background: white; border: 2px solid #e1e8ed; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 8px 0; color: #2d3748;">${exam.exam_name}</h3>
                            <div style="display: flex; gap: 15px; flex-wrap: wrap; font-size: 0.9rem; color: #666;">
                                <span>📊 ${exam.total_questions} câu hỏi</span>
                                <span>📅 ${new Date(exam.created_at).toLocaleDateString('vi-VN')}</span>
                                ${exam.attempt_count > 0 ? `<span>✅ Đã làm ${exam.attempt_count} lần</span>` : ''}
                                ${exam.best_score ? `<span>🏆 Điểm cao nhất: ${exam.best_score}</span>` : ''}
                            </div>
                        </div>
                        <div>
                            ${providerBadge}
                        </div>
                    </div>
                    ${attemptsHTML}
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button class="btn btn-primary" onclick="startPracticeExam(${exam.practice_exam_id})" style="flex: 1; padding: 10px;">
                            ▶️ Bắt đầu làm bài
                        </button>
                        <button class="btn btn-secondary" onclick="deletePracticeExam(${exam.practice_exam_id})" style="padding: 10px 15px;">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading practice exams:', error);
        const container = document.getElementById('practiceExamsList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff4757;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">❌</div>
                    <p>Lỗi khi tải danh sách đề luyện tập</p>
                    <button class="btn btn-primary" onclick="loadPracticeExams()" style="margin-top: 20px;">
                        Thử lại
                    </button>
                </div>
            `;
        }
    }
}

// ============================================
// Bắt đầu làm đề luyện tập
// ============================================
function startPracticeExam(practiceExamId) {
    // Chuyển đến trang làm bài luyện tập
    window.location.href = `./student_practice_exam.html?practice_exam_id=${practiceExamId}`;
}

// ============================================
// Xem kết quả lần làm bài trước
// ============================================
function viewPracticeResult(practiceExamId, attemptId) {
    window.location.href = `./student_practice_result.html?practice_exam_id=${practiceExamId}&attempt_id=${attemptId}`;
}

// ============================================
// Xóa đề luyện tập
// ============================================
async function deletePracticeExam(practiceExamId) {
    if (!confirm('Bạn có chắc muốn xóa đề luyện tập này? Tất cả lịch sử làm bài cũng sẽ bị xóa.')) {
        return;
    }
    
    try {
        await apiDelete(`/api/student/practice/exams/${practiceExamId}`);
        showNotification('✅ Đã xóa đề luyện tập', 'success');
        await loadPracticeExams();
    } catch (error) {
        console.error('Error deleting practice exam:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// ============================================
// Load materials khi vào section
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Override showSection để load materials khi vào create-practice
    const originalShowSection = window.showSection;
    if (originalShowSection) {
        window.showSection = function(sectionId) {
            originalShowSection(sectionId);
            
            if (sectionId === 'create-practice') {
                loadPracticeMaterials();
            } else if (sectionId === 'my-practice') {
                loadPracticeExams();
            }
        };
    }
    
    // Kiểm tra nếu quay về từ trang kết quả, tự động load lại danh sách
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'result') {
        // Chờ một chút để đảm bảo DOM đã load
        setTimeout(() => {
            if (typeof showSection === 'function') {
                showSection('my-practice');
            } else {
                loadPracticeExams();
            }
        }, 500);
        
        // Xóa param để không reload lại lần sau
        window.history.replaceState({}, '', window.location.pathname);
    }
});

// Helper function để show notification (nếu chưa có)
if (typeof showNotification === 'undefined') {
    window.showNotification = function(message, type = 'info') {
        alert(message);
    };
}

