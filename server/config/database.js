const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Tải file .env từ thư mục gốc của dự án
dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false
});

module.exports = sequelize;