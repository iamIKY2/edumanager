const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');

// Load environment variables FIRST
dotenv.config();

// Import email service
const emailService = require('./services/emailService');

// Shared routes
const authRoutes = require('./routes/shared/auth');
const userRoutes = require('./routes/shared/user');
const sharedClassesRoutes = require('./routes/shared/classes');
const complaintRoutes = require('./routes/shared/complaints');
const notificationRoutes = require('./routes/shared/notifications');

// Teacher routes
const teacherClassesRoutes = require('./routes/teacher/classes');
const teacherExamRoutes = require('./routes/teacher/exams'); 
const teacherCheatingRoutes = require('./routes/teacher/cheating');
const gradingRoutes = require('./routes/teacher/grading');
const teacherStatisticsRoutes = require('./routes/teacher/statistics');

// Student routes
const studentClassesRoutes = require('./routes/student/classes');
const studentExamRoutes = require('./routes/student/exams'); 
const submissionRoutes = require('./routes/student/submissions');
const studentStatisticsRoutes = require('./routes/student/statistics');

// Admin routes
const adminRoutes = require('./routes/admin/admin');

// App configuration
const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Tạo HTTP server cho Socket.IO
const server = http.createServer(app);

// Cấu hình CORS
const corsOptions = {
  origin: isProduction
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Khởi tạo Socket.IO với xác thực
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware xác thực Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Xử lý Socket.IO events
io.on('connection', (socket) => {
  const userId = socket.user.id || socket.user.user_id;
  console.log(`✅ Client connected: ${socket.id}, User ID: ${userId}`);
  console.log(`🔵 [Socket] User object:`, socket.user);

  socket.join(`user_${userId}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });

  socket.on('student-submit', (data) => {
    console.log('Student submitted:', data);
    const userId = socket.user.id || socket.user.user_id;
    io.to(data.classId).emit('new-submission', {
      ...data,
      submittedBy: userId,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// Gắn Socket.IO vào app.locals
app.locals.io = io;

// Cấu hình middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tạo MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edexis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
pool.getConnection()
  .then(conn => {
    console.log(' Database connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

app.locals.pool = pool;

// Middleware để truyền db và io
app.use((req, res, next) => {
  req.db = app.locals.pool;
  req.io = app.locals.io;
  next();
});

// Test email service khi khởi động
emailService.testConnection().then(isReady => {
  if (!isReady) {
    console.warn('⚠️  Email service chưa sẵn sàng. Kiểm tra lại cấu hình EMAIL trong .env!');
  }
});

// Route kiểm tra server và database
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT 1');
    res.json({ message: 'Backend working!', dbCheck: rows });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// Route để serve trang forgot-password
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Shared routes 
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/classes', sharedClassesRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);

// Teacher routes
app.use('/api/teacher/classes', teacherClassesRoutes);
app.use('/api/teacher/exams', teacherExamRoutes); 
app.use('/api/teacher/cheating', teacherCheatingRoutes);
app.use('/api/teacher/grading', gradingRoutes);
app.use('/api/teacher/statistics', teacherStatisticsRoutes);

// Student routes
app.use('/api/student/classes', studentClassesRoutes);
app.use('/api/student/exams', studentExamRoutes); 
app.use('/api/student/submissions', submissionRoutes);
app.use('/api/student/statistics', studentStatisticsRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// 404 handler 
app.use((req, res, next) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error stack:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: isProduction ? undefined : err.message,
  });
});

// Cleanup OTP hết hạn mỗi giờ
setInterval(async () => {
  try {
    const [result] = await pool.query('DELETE FROM otps WHERE expiresAt < NOW()');
    if (result.affectedRows > 0) {
      console.log(`🧹 Đã xóa ${result.affectedRows} OTP hết hạn`);
    }
  } catch (error) {
    console.error('❌ Lỗi khi xóa OTP:', error.message);
  }
}, 60 * 60 * 1000); // Mỗi 1 giờ

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(` Backend running at http://0.0.0.0:${port}`);
  console.log(` Socket.IO ready`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Forgot password page: http://localhost:${port}/forgot-password`);
});