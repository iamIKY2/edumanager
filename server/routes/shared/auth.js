const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const db = req.db;
    const { username, email, password, role, full_name } = req.body;

    // Kiểm tra dữ liệu
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Thiếu dữ liệu!' });
    }

    // Kiểm tra email đã tồn tại
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng!' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user - ĐỔI TÊN CỘT
    await db.query(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name || username, role]
    );

    // Lấy user vừa tạo
    const [newUser] = await db.query(
      'SELECT user_id, username, email, full_name, role FROM users WHERE email = ?', 
      [email]
    );
    
    res.status(201).json({ 
      message: 'Đăng ký thành công!', 
      user: newUser[0] 
    });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi server!', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập email và password!' });
    }

    // Lấy user - ĐỔI TÊN CỘT
    const [users] = await req.db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email không tồn tại!' });
    }

    const user = users[0];
    
    console.log('User found:', {
      user_id: user.user_id,
      email: user.email,
      hasPassword: !!user.password_hash
    });

    // Kiểm tra password_hash
    if (!user.password_hash) {
      console.error('❌ Password hash is NULL for user:', user.email);
      return res.status(500).json({ error: 'Tài khoản chưa có mật khẩu!' });
    }

    // So sánh password - ĐỔI TÊN CỘT
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ error: 'Mật khẩu không đúng!' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Đăng nhập thành công!', 
      token, 
      role: user.role 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi server!', details: err.message });
  }
});

module.exports = router;