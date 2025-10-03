
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mysql = require('mysql2');

dotenv.config(); 

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('Server đang chạy!');
});

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
db.connect(err => {
  if (err) {
    console.error('Lỗi kết nối cơ sở dữ liệu:', err);
    return;
  }
  console.log('Kết nối cơ sở dữ liệu thành công!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
