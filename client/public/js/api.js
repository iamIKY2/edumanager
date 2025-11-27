// API Helper Functions
// Tự động xử lý URLs, headers, và error handling

(function() {
    'use strict';
    
    // Đảm bảo CONFIG đã được load
    if (typeof window.CONFIG === 'undefined') {
        console.error('❌ CONFIG chưa được load! Đảm bảo config.js được load trước api.js');
    }
    
    /**
     * Main API call function
     * @param {string} endpoint - API endpoint (ví dụ: '/api/user/profile')
     * @param {object} options - Fetch options (method, headers, body, etc.)
     * @returns {Promise} Response data (đã parse JSON)
     */
    async function apiCall(endpoint, options = {}) {
        // Build URL
        const baseUrl = window.CONFIG?.API_BASE_URL || '';
        const url = baseUrl + endpoint;
        
        // Tự động thêm Authorization header nếu có token
        const token = localStorage.getItem('token');
        const headers = {
            ...options.headers
        };
        
        if (token && !headers['Authorization'] && !headers['authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Merge options
        const fetchOptions = {
            ...options,
            headers: headers
        };
        
        try {
            const response = await fetch(url, fetchOptions);
            
            // Xử lý response
            if (!response.ok) {
                // Thử parse error message
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
                }
                
                // Throw error với thông tin chi tiết
                const error = new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
                error.status = response.status;
                error.data = errorData;
                throw error;
            }
            
            // Parse JSON response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            // Nếu không phải JSON, trả về text
            return await response.text();
            
        } catch (error) {
            // Network error hoặc parse error
            console.error('❌ API Call Error:', {
                url: url,
                endpoint: endpoint,
                error: error.message
            });
            
            // Cải thiện thông báo lỗi cho "Failed to fetch"
            if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
                const friendlyError = new Error('Không thể kết nối đến server. Vui lòng kiểm tra:\n- Kết nối mạng\n- Server đang chạy\n- URL API đúng');
                friendlyError.originalError = error;
                throw friendlyError;
            }
            
            throw error;
        }
    }
    
    /**
     * GET request
     */
    function apiGet(endpoint, options = {}) {
        return apiCall(endpoint, {
            ...options,
            method: 'GET'
        });
    }
    
    /**
     * POST request
     */
    function apiPost(endpoint, data = null, options = {}) {
        const fetchOptions = {
            ...options,
            method: 'POST'
        };
        
        // Nếu có data, tự động stringify và set Content-Type
        if (data !== null) {
            fetchOptions.headers = {
                'Content-Type': 'application/json',
                ...fetchOptions.headers
            };
            fetchOptions.body = JSON.stringify(data);
        }
        
        return apiCall(endpoint, fetchOptions);
    }
    
    /**
     * PUT request
     */
    function apiPut(endpoint, data = null, options = {}) {
        const fetchOptions = {
            ...options,
            method: 'PUT'
        };
        
        if (data !== null) {
            fetchOptions.headers = {
                'Content-Type': 'application/json',
                ...fetchOptions.headers
            };
            fetchOptions.body = JSON.stringify(data);
        }
        
        return apiCall(endpoint, fetchOptions);
    }
    
    /**
     * DELETE request
     */
    function apiDelete(endpoint, options = {}) {
        return apiCall(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }
    
    /**
     * PATCH request
     */
    function apiPatch(endpoint, data = null, options = {}) {
        const fetchOptions = {
            ...options,
            method: 'PATCH'
        };
        
        if (data !== null) {
            fetchOptions.headers = {
                'Content-Type': 'application/json',
                ...fetchOptions.headers
            };
            fetchOptions.body = JSON.stringify(data);
        }
        
        return apiCall(endpoint, fetchOptions);
    }
    
    // Export functions to window
    window.apiCall = apiCall;
    window.apiGet = apiGet;
    window.apiPost = apiPost;
    window.apiPut = apiPut;
    window.apiDelete = apiDelete;
    window.apiPatch = apiPatch;
    
    // Log (chỉ trong development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('✅ API Helper Functions loaded');
    }
})();


