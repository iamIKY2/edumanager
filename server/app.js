const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const http = require('http'); // ✅ THÊM HTTP
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth.js'); 
const userRoutes = require('./routes/user.js'); 
const classRoutes = require('./routes/classes.js');
const examRoutes = require('./routes/exams.js');
const submissionRoutes = require('./routes/submissions.js');
const complaintRoutes = require('./routes/complaints.js');
const notificationRoutes = require('./routes/notifications.js');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// ✅ TẠO HTTP SERVER (quan trọng cho Socket.IO)
const server = http.createServer(app);

// ✅ KHỞI TẠO SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: '*', // Cho phép tất cả origins (trong production nên giới hạn)
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Hỗ trợ cả 2 phương thức
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ SOCKET.IO EVENT HANDLERS
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Lắng nghe client join room (class/exam)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  // Lắng nghe client leave room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`Socket ${socket.id} left room: ${roomId}`);
  });

  // Xử lý disconnect
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
  });

  // Custom events (ví dụ)
  socket.on('student-submit', (data) => {
    console.log('Student submitted:', data);
    // Gửi notification tới teacher
    io.to(data.classId).emit('new-submission', data);
  });
});

// ✅ GẮN io VÀO app.locals để dùng trong routes
app.locals.io = io;

app.use(cors({ origin: '*' }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.pool = pool;

app.use((req, res, next) => {
  req.db = app.locals.pool;
  req.io = app.locals.io; 
  next();
});

app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT 1');
    res.json({ message: 'Backend working!', dbCheck: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/classes', classRoutes); 
app.use('/api/exams', examRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend running at http://127.0.0.1:${port}`);
  console.log(`🔌 Socket.IO ready`);
});