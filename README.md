# Edexis - Hệ Thống Thi Trực Tuyến Thông Minh

## Giới thiệu

**Edexis** là nền tảng thi trực tuyến hiện đại, ứng dụng AI để tự động sinh đề, chống gian lận thông minh, quản lý lớp học và phân tích kết quả học tập. Hệ thống hỗ trợ giáo viên và học sinh với giao diện thân thiện, đa nền tảng, bảo mật dữ liệu và trải nghiệm giáo dục số toàn diện.

## Tính năng nổi bật

- Đăng ký và đăng nhập cho học sinh, giáo viên
- Quản lý lớp học, bài thi, ngân hàng câu hỏi
- Làm bài kiểm tra trực tuyến, nộp bài, xem kết quả
- Khiếu nại điểm, nhận thông báo, phản hồi
- Dashboard trực quan, biểu đồ thống kê, bảng xếp hạng
- Chống gian lận bằng AI, lưu trữ dữ liệu an toàn

## Cấu trúc dự án

- `client/`: Giao diện web cho người dùng
  - `src/pages/`: Các trang HTML (đăng nhập, đăng ký, dashboard, kết quả, khiếu nại, thông báo,...)
  - `public/js/`: Các file JavaScript cho chức năng động
- `server/`: API backend (Node.js, Express, MySQL, Sequelize)
  - `controllers/`, `routes/`, `models/`, `services/`, `middleware/`, `config/`
- `docs/`: Tài liệu bổ sung
- `tests/`: Kiểm thử tự động

## Hướng dẫn sử dụng

### 1. Cài đặt

**Yêu cầu:** Node.js, npm, MySQL

**Bước 1:** Clone dự án về máy
```sh
git clone https://github.com/yourusername/edexis-web.git
cd edexis-web
```

**Bước 2:** Cài đặt dependencies cho client và server
```sh
cd client
npm install
cd ../server
npm install @google/genai openai bcrypt jsonwebtoken express cors express-fileupload express-rate-limit multer mysql2 sequelize csv-parse exceljs xlsx pdfkit nodemailer dotenv socket.io uuid
npm install --save-dev nodemon


```

**Bước 3:** Tạo database MySQL và cấu hình thông tin trong `server/.env`

**Bước 4:** Khởi động server
```sh
cd vào server chạy 
npm run dev or node app.js
```
Server chạy tại `http://localhost:3000`

**Bước 5:** Mở giao diện client
- Mở file `client/index.html` trên trình duyệt
- Hoặc dùng live server extension của VSCode

### 2. Đăng ký & Đăng nhập

- Truy cập trang đăng ký: `src/pages/register.html`
- Đăng nhập: `src/pages/login.html`
- Sau khi đăng nhập, hệ thống tự động chuyển đến dashboard phù hợp (học sinh/giáo viên)

### 3. Sử dụng các chức năng chính

- **Học sinh:** Xem lịch thi, làm bài, xem kết quả, gửi khiếu nại, nhận thông báo
- **Giáo viên:** Tạo lớp, tạo đề thi, chấm bài, gửi thông báo, quản lý câu hỏi, xem thống kê

### 4. API Backend

- API chạy tại `http://localhost:3000/api/`
- Xem chi tiết các endpoint trong thư mục `server/routes/`

### 5. Kiểm thử

- Các test nằm trong thư mục `tests/`
- Chạy test với Jest (nếu có)

## Đóng góp & phát triển

- Fork dự án, tạo nhánh mới, gửi pull request
- Đóng góp thêm tính năng, sửa lỗi, cải thiện UI/UX

## Liên hệ & hỗ trợ

- Email: support@edexis.vn
- Trung tâm trợ giúp: [docs/](docs/)

---

**Cảm ơn bạn đã sử dụng Edexis!**
