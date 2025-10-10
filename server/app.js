const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

const authRoutes = require('./routes/auth.js'); 
const userRoutes = require('./routes/user.js'); 

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

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
  next();
});

app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT 1');
    res.json({ message: 'Backend ', dbCheck: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes); 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(` Backend running at http://127.0.0.1:${port}`);
});