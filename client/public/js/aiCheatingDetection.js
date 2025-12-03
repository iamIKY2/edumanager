// client/public/js/aiCheatingDetection.js
// Module AI phát hiện gian lận từ webcam - FIXED VERSION

class AICheatingDetection {
    constructor(options = {}) {
        this.videoElement = options.videoElement;
        this.onViolationDetected = options.onViolationDetected || (() => {});
        this.onVideoReady = options.onVideoReady || (() => {});
        
        // Cấu hình
        this.detectionInterval = options.detectionInterval || 3000;
        this.faceAwayThreshold = options.faceAwayThreshold || 0.3;
        this.violationBuffer = [];
        this.isProcessing = false;
        this.lastFaceDetectedTime = Date.now();
        this.consecutiveNoFaceCount = 0;
        this.minConsecutiveNoFace = 10;
        this.objectDetectionSkip = 0;
        this.phoneDetectionHistory = [];
        this.phoneDetectionThreshold = 2;
        
        // Trạng thái
        this.isDetecting = false;
        this.detectionTimer = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.videoStream = null;
        
        // Thống kê
        this.stats = {
            faceAwayCount: 0,
            multiplePeopleCount: 0,
            phoneDetectedCount: 0,
            totalDetections: 0
        };
        
        // Load TensorFlow.js models
        this.faceDetectionModel = null;
        this.objectDetectionModel = null;
        this.isModelLoaded = false;
        
        // ⭐ CRITICAL FIX: Thêm flag để track video recording state
        this.isRecordingVideo = false;
        this.recordingPromises = new Set(); // Track tất cả recording promises
        
        // ⭐ Global error handlers
        this.initGlobalErrorHandlers();
    }
    
    initGlobalErrorHandlers() {
        // ⭐ CRITICAL: Chặn tất cả unhandled rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🔍 [UnhandledRejection] Caught:', event.reason);
            
            // Luôn preventDefault để không reload
            event.preventDefault();
            
            // Log chi tiết
            if (event.reason instanceof Error) {
                console.error('🔍 [UnhandledRejection] Stack:', event.reason.stack);
            }
        });
        
        // Handler cho JavaScript errors
        window.addEventListener('error', (event) => {
            const isFromAIDetection = event.filename?.includes('aiCheatingDetection') ||
                                     event.error?.stack?.includes('aiCheatingDetection');
            
            if (isFromAIDetection) {
                console.error('🔍 [GlobalError] AI Detection error:', event.error);
                // Không làm gì thêm, chỉ log
            }
        });
    }

    async initialize() {
        try {
            if (typeof tf === 'undefined') {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
            }
            
            // Load face detection
            try {
                if (typeof faceDetection === 'undefined') {
                    await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection@1.0.1/dist/face-detection.min.js');
                }
                
                if (typeof faceDetection !== 'undefined') {
                    const faceModel = faceDetection.SupportedModels.MediaPipeFaceDetector;
                    const faceDetectorConfig = {
                        runtime: 'mediapipe',
                        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4',
                        maxFaces: 2
                    };
                    this.faceDetectionModel = await faceDetection.createDetector(faceModel, faceDetectorConfig);
                }
            } catch (error) {
                console.error('❌ Face Detection load failed:', error);
                this.faceDetectionModel = null;
            }
            
            // Load object detection
            try {
                await this.loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.js');
                this.objectDetectionModel = await cocoSsd.load();
            } catch (error) {
                this.objectDetectionModel = null;
            }
            
            this.isModelLoaded = true;
            return true;
        } catch (error) {
            console.error('❌ AI models load error:', error);
            this.useSimpleDetection = true;
            return false;
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async startDetection(videoStream) {
        if (!this.videoElement) {
            console.error('❌ No video element');
            return false;
        }

        this.videoStream = videoStream;
        this.videoElement.srcObject = videoStream;
        
        await new Promise((resolve) => {
            this.videoElement.onloadedmetadata = () => {
                this.videoElement.play();
                resolve();
            };
        });

        this.startRecording();

        if (this.isModelLoaded) {
            this.isDetecting = true;
            this.detectLoop();
        } else {
            this.startSimpleDetection();
        }

        this.onVideoReady();
        return true;
    }

    async detectLoop() {
        if (!this.isDetecting) return;
        
        if (this.isProcessing) {
            this.detectionTimer = setTimeout(() => this.detectLoop(), this.detectionInterval);
            return;
        }

        this.isProcessing = true;

        try {
            let facePredictions = [];
            let objectPredictions = [];

            if (this.faceDetectionModel) {
                try {
                    if (this.videoElement && this.videoElement.readyState >= 2) {
                        if (typeof this.faceDetectionModel.detect === 'function') {
                            facePredictions = await this.faceDetectionModel.detect(this.videoElement);
                        } else if (typeof this.faceDetectionModel.estimateFaces === 'function') {
                            facePredictions = await this.faceDetectionModel.estimateFaces(this.videoElement, false);
                        }
                    }
                } catch (error) {
                    facePredictions = [];
                }
            }

            if (this.objectDetectionModel) {
                try {
                    if (!this.objectDetectionSkip || this.objectDetectionSkip >= 1) {
                        objectPredictions = await this.objectDetectionModel.detect(this.videoElement);
                        this.objectDetectionSkip = 0;
                    } else {
                        this.objectDetectionSkip++;
                        objectPredictions = [];
                    }
                } catch (error) {
                    objectPredictions = [];
                }
            }

            await this.analyzeDetections(facePredictions, objectPredictions);

        } catch (error) {
            console.error('❌ Detection error:', error);
        } finally {
            this.isProcessing = false;
        }

        this.detectionTimer = setTimeout(() => this.detectLoop(), this.detectionInterval);
    }

    async analyzeDetections(facePredictions, objectPredictions) {
        this.stats.totalDetections++;

        const hasValidFace = facePredictions.length > 0 && 
            facePredictions.some(face => {
                const confidence = face.probability || face.score || 1.0;
                return confidence > 0.3;
            });

        if (!hasValidFace) {
            if (this.videoElement && this.videoElement.readyState >= 2) {
                const hasAnyFace = facePredictions && facePredictions.length > 0;
                
                if (!hasAnyFace) {
                    this.consecutiveNoFaceCount++;
                    this.stats.faceAwayCount++;
                } else {
                    if (this.consecutiveNoFaceCount > 0) {
                        this.consecutiveNoFaceCount = Math.max(0, this.consecutiveNoFaceCount - 2);
                    }
                }
                
                const timeSinceLastFace = Date.now() - this.lastFaceDetectedTime;
                const minTimeWithoutFace = 45000;
                const minConsecutiveCount = 15;
                
                if (this.consecutiveNoFaceCount >= minConsecutiveCount && 
                    timeSinceLastFace >= minTimeWithoutFace &&
                    !hasAnyFace) {
                    
                    const lastFaceAwayAlert = this.violationBuffer
                        .filter(v => v.type === 'FaceAway')
                        .sort((a, b) => b.timestamp - a.timestamp)[0];
                    
                    if (!lastFaceAwayAlert || (Date.now() - lastFaceAwayAlert.timestamp) > 90000) {
                        console.log('⚠️ [AI Detection] Face away detected');
                        // ⭐ CRITICAL FIX: Wrap trong try-catch và không await
                        this.handleViolationSafe('FaceAway', 'Quay mặt đi khỏi màn hình');
                        this.stats.faceAwayCount = 0;
                        this.consecutiveNoFaceCount = 0;
                    }
                }
            }
        } else {
            this.stats.faceAwayCount = 0;
            this.consecutiveNoFaceCount = 0;
            this.lastFaceDetectedTime = Date.now();

            if (facePredictions.length > 1) {
                const lastMultiplePeopleAlert = this.violationBuffer
                    .filter(v => v.type === 'MultiplePeople')
                    .sort((a, b) => b.timestamp - a.timestamp)[0];
                
                if (!lastMultiplePeopleAlert || (Date.now() - lastMultiplePeopleAlert.timestamp) > 10000) {
                    this.stats.multiplePeopleCount++;
                    console.log('⚠️ [AI Detection] Multiple people detected');
                    this.handleViolationSafe('MultiplePeople', `Phát hiện ${facePredictions.length} người trong khung hình`);
                }
            }
        }

        const suspiciousObjects = objectPredictions.filter(obj => {
            const className = obj.class.toLowerCase();
            const confidence = obj.score || obj.probability || 0;
            return ['cell phone', 'handbag', 'backpack'].includes(className) &&
                   confidence > 0.4;
        });

        if (suspiciousObjects.length > 0) {
            const now = Date.now();
            const detectedItems = suspiciousObjects.map(o => {
                const translations = {
                    'cell phone': 'điện thoại',
                    'handbag': 'túi xách',
                    'backpack': 'ba lô'
                };
                return translations[o.class.toLowerCase()] || o.class;
            }).join(', ');
            
            this.phoneDetectionHistory.push({
                timestamp: now,
                items: detectedItems,
                confidence: Math.max(...suspiciousObjects.map(o => o.score || o.probability || 0))
            });
            
            this.phoneDetectionHistory = this.phoneDetectionHistory.filter(
                h => (now - h.timestamp) < 10000
            );
            
            if (this.phoneDetectionHistory.length >= this.phoneDetectionThreshold) {
                const lastPhoneAlert = this.violationBuffer
                    .filter(v => v.type === 'PhoneDetected')
                    .sort((a, b) => b.timestamp - a.timestamp)[0];
                
                if (!lastPhoneAlert || (now - lastPhoneAlert.timestamp) > 20000) {
                    this.stats.phoneDetectedCount++;
                    console.log(`⚠️ [AI Detection] Phone detected: ${detectedItems}`);
                    this.handleViolationSafe('PhoneDetected', `Phát hiện ${detectedItems} trong khung hình`);
                    this.phoneDetectionHistory = [];
                }
            }
        } else {
            const now = Date.now();
            this.phoneDetectionHistory = this.phoneDetectionHistory.filter(
                h => (now - h.timestamp) < 5000
            );
        }
    }

    // ⭐ NEW: Safe wrapper cho handleViolation
    handleViolationSafe(violationType, description) {
        try {
            // Tạo promise và track nó
            const promise = this.handleViolation(violationType, description);
            
            if (promise && typeof promise.catch === 'function') {
                // Add vào tracking set
                this.recordingPromises.add(promise);
                
                // Bắt lỗi và remove khỏi tracking
                promise
                    .catch(err => {
                        console.error('❌ [Violation Handler] Error:', err);
                    })
                    .finally(() => {
                        this.recordingPromises.delete(promise);
                    });
            }
        } catch (error) {
            console.error('❌ [Violation Handler] Sync error:', error);
        }
    }

    async handleViolation(violationType, description) {
        const violationId = `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Gọi callback - không await
            if (this.onViolationDetected) {
                const callbackPromise = this.onViolationDetected({
                    type: violationType,
                    description: description,
                    timestamp: Date.now()
                });
                
                if (callbackPromise && typeof callbackPromise.catch === 'function') {
                    callbackPromise.catch(err => {
                        console.error(`❌ [${violationId}] Callback error:`, err);
                    });
                }
            }

            // ⭐ CRITICAL FIX: Ghi video hoàn toàn background - KHÔNG BLOCK UI
            // Chạy ngay lập tức, không await, không block
            if (!this.isRecordingVideo) {
                // ⭐ CHẠY HOÀN TOÀN BACKGROUND - KHÔNG BLOCK UI
                // Sử dụng requestIdleCallback nếu có, nếu không thì setTimeout với delay 0
                const scheduleRecording = () => {
                    const recordPromise = this._recordViolationVideoSafe(violationType);
                    this.recordingPromises.add(recordPromise);
                    recordPromise.finally(() => {
                        this.recordingPromises.delete(recordPromise);
                    });
                };
                
                if (window.requestIdleCallback) {
                    window.requestIdleCallback(scheduleRecording, { timeout: 1000 });
                } else {
                    setTimeout(scheduleRecording, 0); // Chạy ngay sau khi UI update
                }
            }
            
        } catch (error) {
            console.error(`❌ [${violationId}] Error:`, error);
        }
    }

    // ⭐ NEW: Safe wrapper cho _recordViolationVideo
    async _recordViolationVideoSafe(violationType) {
        // Kiểm tra xem có đang ghi không
        if (this.isRecordingVideo) {
            console.warn('⚠️ [Video] Already recording, skip');
            return;
        }

        try {
            this.isRecordingVideo = true;
            await this._recordViolationVideo(violationType);
        } catch (error) {
            console.error('❌ [Video] Recording error:', error);
            // Không throw, chỉ log
        } finally {
            this.isRecordingVideo = false;
        }
    }

    async _recordViolationVideo(violationType) {
        const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            if (!this.videoStream || !this.videoStream.active) {
                return;
            }
            
            const codecOptions = [
                { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 500000 },
                { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 800000 },
                { mimeType: 'video/webm', videoBitsPerSecond: 1000000 }
            ];
            
            let recorderOptions = null;
            for (const option of codecOptions) {
                if (MediaRecorder.isTypeSupported(option.mimeType)) {
                    recorderOptions = option;
                    break;
                }
            }
            
            if (!recorderOptions) {
                recorderOptions = { mimeType: 'video/webm', videoBitsPerSecond: 500000 };
            }
            
            const tempRecorder = new MediaRecorder(this.videoStream, recorderOptions);
            const tempChunks = [];
            
            // ⭐ CRITICAL: Thêm error handler chi tiết
            tempRecorder.onerror = (event) => {
                console.error(`❌ [${videoId}] MediaRecorder error:`, event);
            };
            
            tempRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    tempChunks.push(event.data);
                }
            };
            
            // ⭐ CRITICAL: Wrap start() trong try-catch
            try {
                tempRecorder.start();
            } catch (startError) {
                console.error(`❌ [${videoId}] Start error:`, startError);
                return; // Không throw
            }
            
            // ⭐ CRITICAL: Promise với proper error handling
            await new Promise((resolve) => {
                let isResolved = false;
                
                const timeoutId = setTimeout(() => {
                    if (isResolved) return;
                    isResolved = true;
                    
                    try {
                        if (tempRecorder.state === 'recording' || tempRecorder.state === 'paused') {
                            tempRecorder.stop();
                        }
                        resolve();
                    } catch (stopError) {
                        console.error(`❌ [${videoId}] Stop error:`, stopError);
                        resolve(); // Vẫn resolve
                    }
                }, 5000);
                
                // Error handler
                tempRecorder.onerror = () => {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeoutId);
                    resolve(); // Luôn resolve, không reject
                };
            });
            
            // Đợi onstop
            await new Promise((resolve) => {
                const stopTimeout = setTimeout(() => {
                    resolve();
                }, 2000);
                
                tempRecorder.onstop = () => {
                    clearTimeout(stopTimeout);
                    resolve();
                };
            });

            // Tạo blob
            if (tempChunks.length === 0) {
                return;
            }
            
            let blob;
            try {
                blob = new Blob(tempChunks, { type: 'video/webm' });
                if (blob.size === 0) {
                    return;
                }
            } catch (blobError) {
                console.error(`❌ [${videoId}] Blob error:`, blobError);
                return;
            }
            
            const attemptId = window.currentAttemptId || window.examData?.attempt_id;
            const examId = window.examData?.exam_id;

            if (!attemptId || !examId) {
                return;
            }
            
            const formData = new FormData();
            formData.append('video', blob, `violation_${violationType}_${Date.now()}.webm`);
            formData.append('attempt_id', attemptId);
            formData.append('event_type', violationType);
            formData.append('violation_time', Date.now());
            formData.append('duration_before', 2500);
            formData.append('duration_after', 2500);

            const token = localStorage.getItem('token');
            if (!token) {
                return;
            }
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 15000);
            
            let apiUrl = `/api/student/exams/${examId}/violation-video`;
            
            if (typeof window !== 'undefined' && window.buildUrl) {
                apiUrl = window.buildUrl(apiUrl);
            } else if (window.CONFIG?.API_BASE_URL) {
                const baseUrl = window.CONFIG.API_BASE_URL.endsWith('/') 
                    ? window.CONFIG.API_BASE_URL.slice(0, -1) 
                    : window.CONFIG.API_BASE_URL;
                apiUrl = `${baseUrl}${apiUrl}`;
            }
            
            // ⭐ CRITICAL: Wrap fetch trong try-catch
            let response;
            try {
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData,
                    signal: controller.signal,
                    keepalive: false
                });
            } catch (fetchError) {
                clearTimeout(timeoutId);
                console.error(`❌ [${videoId}] Fetch error:`, fetchError);
                return; // Không throw
            }

            clearTimeout(timeoutId);

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ [${videoId}] Video saved:`, result);
            }
            
        } catch (error) {
            console.error('❌ [Video] Error:', error);
            // Không throw
        }
    }

    startSimpleDetection() {
        const checkInterval = setInterval(() => {
            if (!this.videoStream || this.videoStream.getVideoTracks().length === 0) {
                this.handleViolationSafe('WebcamSuspicious', 'Webcam bị tắt hoặc lỗi');
            }
        }, 5000);

        this.detectionTimer = checkInterval;
    }

    startRecording() {
        this.mediaRecorder = null;
    }

    // ⭐ NEW: Đợi tất cả recordings hoàn thành trước khi stop
    async stopDetection() {
        this.isDetecting = false;
        
        if (this.detectionTimer) {
            clearTimeout(this.detectionTimer);
            this.detectionTimer = null;
        }

        // ⭐ Đợi tất cả recording promises hoàn thành
        if (this.recordingPromises.size > 0) {
            console.log(`🔍 Waiting for ${this.recordingPromises.size} recordings...`);
            try {
                await Promise.allSettled(Array.from(this.recordingPromises));
            } catch (error) {
                console.error('❌ Error waiting for recordings:', error);
            }
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }

        console.log('🛑 AI detection stopped');
    }

    getStats() {
        return { ...this.stats };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AICheatingDetection;
}