-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost
-- Thời gian đã tạo: Th10 06, 2025 lúc 05:39 AM
-- Phiên bản máy phục vụ: 8.0.40
-- Phiên bản PHP: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `edexis`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `admin_logs`
--

CREATE TABLE `admin_logs` (
  `log_id` bigint NOT NULL,
  `admin_id` bigint NOT NULL,
  `action_type` enum('cancel_exam','edit_score','review_cheating','other') NOT NULL,
  `details` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `anti_cheating_logs`
--

CREATE TABLE `anti_cheating_logs` (
  `log_id` bigint NOT NULL,
  `attempt_id` bigint DEFAULT NULL,
  `event_type` enum('TabSwitch','CopyPaste','WebcamSuspicious') NOT NULL,
  `event_description` text,
  `event_time` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `anti_cheating_logs`
--

INSERT INTO `anti_cheating_logs` (`log_id`, `attempt_id`, `event_type`, `event_description`, `event_time`) VALUES
(1, 25, 'TabSwitch', 'Chuyển tab lần 1', '2025-10-31 18:15:16'),
(2, 25, 'TabSwitch', 'Chuyển tab lần 2', '2025-10-31 18:15:17'),
(3, 25, 'TabSwitch', 'Chuyển tab lần 3', '2025-10-31 18:15:18');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `classes`
--

CREATE TABLE `classes` (
  `class_id` bigint NOT NULL,
  `class_name` varchar(100) NOT NULL,
  `subject_id` bigint DEFAULT NULL,
  `teacher_id` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `join_code` varchar(10) DEFAULT NULL,
  `description` text,
  `academic_year` varchar(20) DEFAULT NULL,
  `class_code` varchar(10) NOT NULL,
  `icon` varchar(10) DEFAULT NULL,
  `status` enum('active','archived','deleted') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `classes`
--

INSERT INTO `classes` (`class_id`, `class_name`, `subject_id`, `teacher_id`, `created_at`, `join_code`, `description`, `academic_year`, `class_code`, `icon`, `status`) VALUES
(6, '26th03', 2, 7, '2025-10-14 14:11:52', NULL, '', '2024-2025', 'CLSUKMA50', '📚', 'active'),
(7, '26th02', 3, 7, '2025-10-15 08:57:13', NULL, '', '2024-2025', 'CLSKL6J0W', '💻', 'active');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `class_students`
--

CREATE TABLE `class_students` (
  `class_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `joined_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `class_students`
--

INSERT INTO `class_students` (`class_id`, `student_id`, `joined_at`) VALUES
(6, 4, '2025-10-14 14:12:50'),
(6, 8, '2025-10-22 09:09:58'),
(7, 4, '2025-10-15 08:57:46');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `complaints`
--

CREATE TABLE `complaints` (
  `complaint_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `exam_id` bigint NOT NULL,
  `content` text NOT NULL,
  `status` enum('Pending','Resolved','Rejected') DEFAULT 'Pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `exams`
--

CREATE TABLE `exams` (
  `exam_id` bigint NOT NULL,
  `exam_name` varchar(100) NOT NULL,
  `subject_id` bigint DEFAULT NULL,
  `teacher_id` bigint DEFAULT NULL,
  `duration` int NOT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `password` varchar(50) DEFAULT NULL,
  `is_dynamic` tinyint(1) DEFAULT '0',
  `shuffle_questions` tinyint(1) DEFAULT '0',
  `shuffle_options` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `class_id` bigint DEFAULT NULL,
  `description` text,
  `status` enum('draft','upcoming','active','completed','deleted') DEFAULT 'draft'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `exams`
--

INSERT INTO `exams` (`exam_id`, `exam_name`, `subject_id`, `teacher_id`, `duration`, `start_time`, `end_time`, `password`, `is_dynamic`, `shuffle_questions`, `shuffle_options`, `created_at`, `class_id`, `description`, `status`) VALUES
(37, 'lab2', 2, 7, 60, '2025-10-20 21:29:00', NULL, NULL, 0, 0, 0, '2025-10-20 21:24:08', 6, '', 'upcoming'),
(38, 'giữa kỳ', 2, 7, 25, '2025-10-26 11:12:00', NULL, NULL, 0, 0, 0, '2025-10-26 11:07:22', 6, '', 'upcoming'),
(49, 'kiem tra', 2, 7, 10, '2025-10-27 09:15:00', NULL, NULL, 0, 0, 0, '2025-10-27 09:14:03', 6, 'Đề thi tạo thủ công', 'upcoming'),
(54, 'test4', 2, 7, 9, '2025-10-31 18:15:00', NULL, NULL, 0, 0, 0, '2025-10-31 18:13:54', 6, 'Đề thi tạo thủ công', 'upcoming'),
(60, 'tets10', 2, 7, 10, '2025-11-01 09:08:00', NULL, NULL, 0, 0, 0, '2025-11-01 09:06:30', 6, 'Đề thi tạo thủ công', 'upcoming');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `exam_attempts`
--

CREATE TABLE `exam_attempts` (
  `attempt_id` bigint NOT NULL,
  `exam_id` bigint DEFAULT NULL,
  `student_id` bigint DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `status` enum('InProgress','Submitted','AutoSubmitted') DEFAULT 'InProgress',
  `is_fully_graded` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_banned` tinyint(1) DEFAULT '0',
  `penalty_points` decimal(5,2) DEFAULT '0.00',
  `cheating_detected` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `exam_attempts`
--

INSERT INTO `exam_attempts` (`attempt_id`, `exam_id`, `student_id`, `start_time`, `end_time`, `score`, `status`, `is_fully_graded`, `created_at`, `is_banned`, `penalty_points`, `cheating_detected`) VALUES
(17, 37, 4, '2025-10-20 21:29:08', '2025-10-20 21:40:37', 3.00, 'Submitted', 0, '2025-10-20 21:29:08', 0, 0.00, 0),
(18, 38, 4, '2025-10-26 11:16:11', '2025-10-26 11:17:42', 8.00, 'Submitted', 0, '2025-10-26 11:16:11', 0, 0.00, 0),
(19, 49, 4, '2025-10-27 09:15:15', '2025-10-27 09:15:25', 9.50, 'Submitted', 1, '2025-10-27 09:15:15', 0, 0.00, 0),
(25, 54, 4, '2025-10-31 18:15:15', '2025-10-31 18:15:28', 10.00, 'Submitted', 1, '2025-10-31 18:15:15', 0, 0.00, 1),
(33, 60, 4, '2025-11-01 09:08:14', '2025-11-01 09:08:18', 1.00, 'Submitted', 1, '2025-11-01 09:08:14', 0, 0.00, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `exam_attempt_answers`
--

CREATE TABLE `exam_attempt_answers` (
  `attempt_id` bigint NOT NULL,
  `question_id` bigint NOT NULL,
  `option_id` bigint DEFAULT NULL,
  `answer_text` text,
  `is_correct` tinyint(1) DEFAULT NULL,
  `teacher_score` decimal(5,2) DEFAULT NULL,
  `teacher_comment` text,
  `is_graded` tinyint(1) DEFAULT '0',
  `answered_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `exam_attempt_answers`
--

INSERT INTO `exam_attempt_answers` (`attempt_id`, `question_id`, `option_id`, `answer_text`, `is_correct`, `teacher_score`, `teacher_comment`, `is_graded`, `answered_at`, `updated_by`, `updated_at`) VALUES
(17, 219, 389, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 220, 393, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 221, 397, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 222, 401, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 223, 405, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 224, 409, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 225, 413, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 226, 417, NULL, 1, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 227, 421, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 228, 425, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 229, 429, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 230, 433, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 231, 437, NULL, 1, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 232, 441, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 233, 445, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 234, 449, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 235, 453, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 236, 457, NULL, 0, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(17, 237, 461, NULL, 1, NULL, NULL, 0, '2025-10-20 21:40:37', NULL, NULL),
(18, 238, 466, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 239, 470, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 240, 473, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 241, 477, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 242, 482, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 243, 485, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 244, 491, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 245, 493, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 246, 498, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 247, 501, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 248, 506, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 249, 510, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:41', NULL, NULL),
(18, 250, 513, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 251, 517, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 252, 523, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 253, 526, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 254, 529, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 255, 534, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 256, 537, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(18, 257, 541, NULL, NULL, NULL, NULL, 0, '2025-10-26 11:17:42', NULL, NULL),
(19, 258, NULL, 'bùi đức thuần', 0, 9.50, 'tốt', 1, '2025-10-27 09:15:25', 7, '2025-10-31 14:11:41'),
(33, 326, NULL, 'qqqq', 0, 1.00, '1', 1, '2025-11-01 09:08:18', 7, '2025-11-01 09:08:46');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `exam_classes`
--

CREATE TABLE `exam_classes` (
  `exam_id` bigint NOT NULL,
  `class_id` bigint NOT NULL,
  `assigned_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `exam_questions`
--

CREATE TABLE `exam_questions` (
  `exam_id` bigint NOT NULL,
  `question_id` bigint NOT NULL,
  `question_order` int DEFAULT NULL,
  `points` decimal(5,2) DEFAULT '1.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `exam_questions`
--

INSERT INTO `exam_questions` (`exam_id`, `question_id`, `question_order`, `points`) VALUES
(37, 219, 1, 1.00),
(37, 220, 2, 1.00),
(37, 221, 3, 1.00),
(37, 222, 4, 1.00),
(37, 223, 5, 1.00),
(37, 224, 6, 1.00),
(37, 225, 7, 1.00),
(37, 226, 8, 1.00),
(37, 227, 9, 1.00),
(37, 228, 10, 1.00),
(37, 229, 11, 1.00),
(37, 230, 12, 1.00),
(37, 231, 13, 1.00),
(37, 232, 14, 1.00),
(37, 233, 15, 1.00),
(37, 234, 16, 1.00),
(37, 235, 17, 1.00),
(37, 236, 18, 1.00),
(37, 237, 19, 1.00),
(38, 238, 1, 0.50),
(38, 239, 2, 0.50),
(38, 240, 3, 0.50),
(38, 241, 4, 0.50),
(38, 242, 5, 0.50),
(38, 243, 6, 0.50),
(38, 244, 7, 0.50),
(38, 245, 8, 0.50),
(38, 246, 9, 0.50),
(38, 247, 10, 0.50),
(38, 248, 11, 0.50),
(38, 249, 12, 0.50),
(38, 250, 13, 0.50),
(38, 251, 14, 0.50),
(38, 252, 15, 0.50),
(38, 253, 16, 0.50),
(38, 254, 17, 0.50),
(38, 255, 18, 0.50),
(38, 256, 19, 0.50),
(38, 257, 20, 0.50),
(49, 258, 1, 10.00),
(54, 320, 1, 10.00),
(60, 326, 1, 10.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `import_logs`
--

CREATE TABLE `import_logs` (
  `import_id` bigint NOT NULL,
  `teacher_id` bigint DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` enum('Excel','PDF') NOT NULL,
  `import_type` enum('Questions','Exam') NOT NULL,
  `status` enum('Pending','Success','Failed') DEFAULT 'Pending',
  `error_message` text,
  `imported_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `content` text NOT NULL,
  `type` enum('Info','Warning','Error') NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `related_id` bigint DEFAULT NULL,
  `related_type` enum('Class','Exam','Complaint','AntiCheating','Question') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `content`, `type`, `is_read`, `created_at`, `related_id`, `related_type`) VALUES
(1, 7, 'Lớp học mới \"26th01\" đã được tạo', 'Info', 1, '2025-10-14 07:55:40', 3, 'Class'),
(2, 7, 'Học sinh thu đã tham gia lớp 26th01', 'Info', 1, '2025-10-14 07:56:19', 3, 'Class'),
(3, 7, 'Lớp học mới \"26th03\" đã được tạo', 'Info', 1, '2025-10-14 14:05:44', 4, 'Class'),
(4, 7, 'Lớp học mới \"26th03\" đã được tạo', 'Info', 1, '2025-10-14 14:10:40', 5, 'Class'),
(5, 7, 'Lớp học mới \"26th03\" đã được tạo', 'Info', 1, '2025-10-14 14:11:52', 6, 'Class'),
(6, 7, 'Học sinh thu đã tham gia lớp 26th03', 'Info', 1, '2025-10-14 14:12:50', 6, 'Class'),
(7, 7, 'Lớp học mới \"26th02\" đã được tạo', 'Info', 1, '2025-10-15 08:57:13', 7, 'Class'),
(8, 7, 'Học sinh thu đã tham gia lớp 26th02', 'Info', 1, '2025-10-15 08:57:46', 7, 'Class'),
(9, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:34:07', 1, 'Exam'),
(10, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:34:15', 2, 'Exam'),
(11, 7, 'Bài thi \"lab3\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:37:31', 3, 'Exam'),
(12, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:44:31', 4, 'Exam'),
(13, 7, 'Bài thi \"lab4\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:47:38', 5, 'Exam'),
(14, 7, 'Bài thi \"lab5\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:49:13', 6, 'Exam'),
(15, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 14:50:09', 7, 'Exam'),
(16, 7, 'Bài thi \"lab10\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:06:03', 8, 'Exam'),
(17, 7, 'Bài thi \"lab7\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:08:00', 9, 'Exam'),
(18, 7, 'Bài thi \"lab7\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:09:26', 10, 'Exam'),
(19, 7, 'Bài thi \"lab31\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:10:32', 11, 'Exam'),
(20, 7, 'Bài thi \"lab21\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:12:09', 12, 'Exam'),
(21, 7, 'Bài thi \"abc\" đã được thêm vào lớp 26th02', 'Info', 0, '2025-10-17 15:13:43', 13, 'Exam'),
(22, 7, 'Bài thi \"12\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:16:42', 14, 'Exam'),
(23, 7, 'Bài thi \"lan1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:21:19', 15, 'Exam'),
(24, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 15:26:13', 16, 'Exam'),
(25, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 21:37:20', 17, 'Exam'),
(26, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-17 21:40:03', 18, 'Exam'),
(27, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-18 09:37:25', 19, 'Exam'),
(28, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-18 09:39:17', 20, 'Exam'),
(29, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-18 09:39:49', 21, 'Exam'),
(30, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-18 09:43:12', 22, 'Exam'),
(31, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-18 14:53:11', 23, 'Exam'),
(32, 7, 'Bài thi \"Bài thi từ Excel - 21:42:58 19/10/2025\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 21:42:58', 24, 'Exam'),
(33, 7, 'Đã nhập 20 câu hỏi vào bài thi \"Bài thi từ Excel - 21:42:58 19/10/2025\"', 'Info', 0, '2025-10-19 21:42:58', 24, 'Exam'),
(34, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 21:46:46', 25, 'Exam'),
(35, 7, 'Bài thi \"Bài thi từ Excel - 21:49:05 19/10/2025\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 21:49:05', 26, 'Exam'),
(36, 7, 'Đã nhập 20 câu hỏi vào bài thi \"Bài thi từ Excel - 21:49:05 19/10/2025\"', 'Info', 0, '2025-10-19 21:49:05', 26, 'Exam'),
(37, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 21:51:36', 27, 'Exam'),
(38, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab1\"', 'Info', 0, '2025-10-19 21:52:10', 27, 'Exam'),
(39, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 21:57:48', 28, 'Exam'),
(40, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab2\"', 'Info', 0, '2025-10-19 21:58:01', 28, 'Exam'),
(41, 7, 'Bài thi \"lab3\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 22:09:42', 29, 'Exam'),
(42, 7, 'Bài thi \"lab3\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-19 22:09:42', 30, 'Exam'),
(43, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab3\"', 'Info', 0, '2025-10-19 22:09:57', 29, 'Exam'),
(44, 7, 'Bài thi \"cấu trúc máy tính \" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 09:11:29', 31, 'Exam'),
(45, 7, 'Đã nhập 20 câu hỏi vào bài thi \"cấu trúc máy tính \"', 'Info', 0, '2025-10-20 09:11:41', 31, 'Exam'),
(46, 7, 'Bài thi \"lab4\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 09:31:47', 32, 'Exam'),
(47, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab4\"', 'Info', 0, '2025-10-20 09:31:58', 32, 'Exam'),
(48, 7, 'Bài thi \"lab6\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 09:53:58', 33, 'Exam'),
(49, 7, 'Đã nhập 19 câu hỏi vào bài thi \"lab6\"', 'Info', 0, '2025-10-20 09:54:14', 33, 'Exam'),
(50, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 15:00:28', 34, 'Exam'),
(51, 7, 'Đã nhập 19 câu hỏi vào bài thi \"lab9\"', 'Info', 0, '2025-10-20 15:00:49', 34, 'Exam'),
(52, 7, 'Bài thi \"lab10\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 15:27:20', 35, 'Exam'),
(53, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab10\"', 'Info', 0, '2025-10-20 15:27:37', 35, 'Exam'),
(54, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 20:17:23', 36, 'Exam'),
(55, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab1\"', 'Info', 0, '2025-10-20 20:17:37', 36, 'Exam'),
(56, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-20 21:24:08', 37, 'Exam'),
(57, 7, 'Đã nhập 19 câu hỏi vào bài thi \"lab2\"', 'Info', 0, '2025-10-20 21:24:20', 37, 'Exam'),
(58, 7, 'Học sinh nguyen đã tham gia lớp 26th03', 'Info', 0, '2025-10-22 09:09:58', 6, 'Class'),
(59, 7, 'Bài thi \"giữa kỳ\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-26 11:07:22', 38, 'Exam'),
(60, 7, 'Đã nhập 20 câu hỏi vào bài thi \"giữa kỳ\"', 'Info', 0, '2025-10-26 11:07:34', 38, 'Exam'),
(61, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-26 17:10:51', 39, 'Exam'),
(62, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-26 17:11:16', 40, 'Exam'),
(63, 7, 'Bài thi \"lab10\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 08:38:28', 41, 'Exam'),
(64, 7, 'Bài thi \"lab4\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 08:52:53', 42, 'Exam'),
(65, 7, 'Bài thi \"lab5\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 08:56:15', 43, 'Exam'),
(66, 7, 'Bài thi \"lab6\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 08:57:42', 44, 'Exam'),
(67, 7, 'Bài thi \"lab8\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 09:01:04', 45, 'Exam'),
(68, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 09:03:46', 46, 'Exam'),
(69, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 09:10:15', 47, 'Exam'),
(70, 7, 'Bài thi \"lab21\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 09:12:24', 48, 'Exam'),
(71, 7, 'Bài thi \"kiem tra\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-27 09:14:03', 49, 'Exam'),
(72, 7, 'Đã thêm câu hỏi mới: \"tên của e...\"', 'Info', 0, '2025-10-27 09:14:03', 258, 'Question'),
(73, 7, 'Bài thi \"lab0\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-28 07:02:49', 50, 'Exam'),
(74, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab0\"', 'Info', 0, '2025-10-28 07:03:32', 50, 'Exam'),
(75, 7, 'Bài thi \"tets1\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-28 19:00:59', 51, 'Exam'),
(76, 7, 'Đã thêm câu hỏi mới: \"điện toán đám mây là gì...\"', 'Info', 0, '2025-10-28 19:00:59', 279, 'Question'),
(77, 7, 'Bài thi \"kiem tra lan2\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-31 15:29:31', 52, 'Exam'),
(78, 7, 'Đã nhập 20 câu hỏi vào bài thi \"kiem tra lan2\"', 'Info', 0, '2025-10-31 15:29:49', 52, 'Exam'),
(79, 7, 'Bài thi \"kiem tra lan3\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-31 15:41:22', 53, 'Exam'),
(80, 7, 'Đã nhập 20 câu hỏi vào bài thi \"kiem tra lan3\"', 'Info', 0, '2025-10-31 15:41:58', 53, 'Exam'),
(81, 7, 'Bài thi \"test4\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-10-31 18:13:54', 54, 'Exam'),
(82, 7, 'Đã thêm câu hỏi mới: \"trong mysql việc sử dụng tiếng việt có dấu thì dùn...\"', 'Info', 0, '2025-10-31 18:13:54', 320, 'Question'),
(83, 7, 'Bài thi \"test4\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-11-01 08:02:47', 55, 'Exam'),
(84, 7, 'Đã thêm câu hỏi mới: \"kiểu dữ liệu số trong js là gì...\"', 'Info', 0, '2025-11-01 08:02:47', 321, 'Question'),
(85, 7, 'Bài thi \"test 6\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-11-01 08:11:59', 56, 'Exam'),
(86, 7, 'Đã thêm câu hỏi mới: \"ngôn ngữ nào lập trình hướng đối tượng...\"', 'Info', 0, '2025-11-01 08:11:59', 322, 'Question'),
(87, 7, 'Bài thi \"test 7\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-11-01 08:18:56', 57, 'Exam'),
(88, 7, 'Đã thêm câu hỏi mới: \"test 1...\"', 'Info', 0, '2025-11-01 08:18:56', 323, 'Question'),
(89, 7, 'Bài thi \"test noti\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-11-01 08:43:51', 58, 'Exam'),
(90, 7, 'Đã thêm câu hỏi mới: \"qqqq...\"', 'Info', 0, '2025-11-01 08:43:51', 324, 'Question'),
(91, 7, 'Bài thi \"test 9\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-11-01 08:53:53', 59, 'Exam'),
(92, 7, 'Đã thêm câu hỏi mới: \"qqqq...\"', 'Info', 0, '2025-11-01 08:53:53', 325, 'Question'),
(93, 7, 'Bài thi \"tets10\" đã được thêm vào lớp 26th03', 'Info', 0, '2025-11-01 09:06:30', 60, 'Exam'),
(94, 7, 'Đã thêm câu hỏi mới: \"1111...\"', 'Info', 0, '2025-11-01 09:06:30', 326, 'Question'),
(95, 4, 'Bài thi \"tets10\" của bạn đã được chấm điểm. Điểm số: 1.0 điểm', 'Info', 1, '2025-11-01 09:08:46', 60, 'Exam');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `question_bank`
--

CREATE TABLE `question_bank` (
  `question_id` bigint NOT NULL,
  `subject_id` bigint DEFAULT NULL,
  `teacher_id` bigint DEFAULT NULL,
  `question_content` text NOT NULL,
  `question_type` enum('SingleChoice','MultipleChoice','FillInBlank','Essay') NOT NULL,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL,
  `correct_answer_text` text,
  `import_id` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `question_bank`
--

INSERT INTO `question_bank` (`question_id`, `subject_id`, `teacher_id`, `question_content`, `question_type`, `difficulty`, `correct_answer_text`, `import_id`, `created_at`, `updated_at`) VALUES
(1, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(2, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(3, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(4, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(5, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(6, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(7, 2, 7, 'Trong Excel, hàm tính tổng là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(8, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(9, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(10, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(11, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(12, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(13, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(14, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(15, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(16, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(17, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(18, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(19, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(20, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:42:58', '2025-10-19 21:42:58'),
(21, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(22, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(23, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(24, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(25, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(26, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(27, 2, 7, 'Trong Excel, hàm tính tổng là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(28, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(29, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(30, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(31, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(32, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(33, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(34, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(35, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(36, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(37, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(38, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(39, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(40, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:49:05', '2025-10-19 21:49:05'),
(41, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(42, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(43, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(44, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(45, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(46, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(47, 2, 7, 'Trong Excel, hàm tính tổng là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(48, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(49, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(50, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(51, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(52, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(53, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(54, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(55, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(56, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(57, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(58, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(59, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(60, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:52:10', '2025-10-19 21:52:10'),
(61, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(62, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(63, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(64, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(65, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(66, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(67, 2, 7, 'Trong Excel, hàm tính tổng là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(68, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(69, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(70, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(71, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(72, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(73, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(74, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(75, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(76, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(77, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(78, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(79, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(80, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 21:58:01', '2025-10-19 21:58:01'),
(81, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(82, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(83, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(84, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(85, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(86, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(87, 2, 7, 'Trong Excel, hàm tính tổng là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(88, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(89, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(90, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(91, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(92, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(93, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(94, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(95, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(96, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(97, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(98, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(99, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-19 22:09:56', '2025-10-19 22:09:56'),
(100, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-19 22:09:57', '2025-10-19 22:09:57'),
(101, 2, 7, 'CPU là viết tắt của cụm từ nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(102, 2, 7, 'Bộ phận nào trong CPU dùng để thực hiện các phép tính số học và logic?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(103, 2, 7, 'Bộ nhớ trong của máy tính gồm những gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(104, 2, 7, 'Thanh ghi (Register) có đặc điểm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(105, 2, 7, 'Đơn vị đo tốc độ CPU thường dùng là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(106, 2, 7, 'Bus là gì trong máy tính?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(107, 2, 7, 'Máy tính thực hiện chương trình theo nguyên tắc nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(108, 2, 7, 'Trong kiến trúc Von Neumann, bộ nhớ dùng để lưu gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(109, 2, 7, 'Cache memory có chức năng gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(110, 2, 7, 'Đơn vị đo dung lượng bộ nhớ là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(111, 2, 7, 'ROM khác RAM ở điểm nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(112, 2, 7, 'Bus dữ liệu có nhiệm vụ gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(113, 2, 7, 'Bộ nhớ chính của máy tính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(114, 2, 7, 'Thiết bị nào là thiết bị vào/ra (I/O)?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(115, 2, 7, 'Chu kỳ máy (Machine Cycle) gồm các bước nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(116, 2, 7, 'Pipeline trong CPU dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(117, 2, 7, 'Hệ thống máy tính gồm mấy thành phần chính?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(118, 2, 7, 'Bus địa chỉ có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(119, 2, 7, 'BIOS được lưu ở đâu?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(120, 2, 7, 'Tốc độ truy cập của các loại bộ nhớ theo thứ tự nhanh đến chậm là?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:11:41', '2025-10-20 09:11:41'),
(121, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:31:57', '2025-10-20 09:31:57'),
(122, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:57', '2025-10-20 09:31:57'),
(123, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:57', '2025-10-20 09:31:57'),
(124, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:57', '2025-10-20 09:31:57'),
(125, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:57', '2025-10-20 09:31:57'),
(126, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(127, 2, 7, 'Trong Excel, hàm tính tổng là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(128, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(129, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(130, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(131, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(132, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(133, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(134, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(135, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(136, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(137, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(138, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(139, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(140, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:31:58', '2025-10-20 09:31:58'),
(141, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(142, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(143, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(144, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(145, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(146, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(147, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(148, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(149, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(150, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(151, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(152, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(154, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(155, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(156, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(157, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(158, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(159, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 09:54:14', '2025-10-20 09:54:14'),
(160, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(161, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(162, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(163, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(164, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(165, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(166, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(167, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(168, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(169, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(170, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(171, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(172, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(173, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(174, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(175, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(176, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(177, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(178, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:00:49', '2025-10-20 15:00:49'),
(179, 2, 7, 'CPU là viết tắt của cụm từ nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(180, 2, 7, 'Bộ phận nào trong CPU dùng để thực hiện các phép tính số học và logic?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(181, 2, 7, 'Bộ nhớ trong của máy tính gồm những gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(182, 2, 7, 'Thanh ghi (Register) có đặc điểm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(183, 2, 7, 'Đơn vị đo tốc độ CPU thường dùng là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(184, 2, 7, 'Bus là gì trong máy tính?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(185, 2, 7, 'Máy tính thực hiện chương trình theo nguyên tắc nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(186, 2, 7, 'Trong kiến trúc Von Neumann, bộ nhớ dùng để lưu gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(187, 2, 7, 'Cache memory có chức năng gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(188, 2, 7, 'Đơn vị đo dung lượng bộ nhớ là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:27:36', '2025-10-20 15:27:36'),
(189, 2, 7, 'ROM khác RAM ở điểm nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(190, 2, 7, 'Bus dữ liệu có nhiệm vụ gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(191, 2, 7, 'Bộ nhớ chính của máy tính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(192, 2, 7, 'Thiết bị nào là thiết bị vào/ra (I/O)?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(193, 2, 7, 'Chu kỳ máy (Machine Cycle) gồm các bước nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(194, 2, 7, 'Pipeline trong CPU dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(195, 2, 7, 'Hệ thống máy tính gồm mấy thành phần chính?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(196, 2, 7, 'Bus địa chỉ có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(197, 2, 7, 'BIOS được lưu ở đâu?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(198, 2, 7, 'Tốc độ truy cập của các loại bộ nhớ theo thứ tự nhanh đến chậm là?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 15:27:37', '2025-10-20 15:27:37'),
(199, 2, 7, 'CPU là viết tắt của cụm từ nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(200, 2, 7, 'Bộ phận nào trong CPU dùng để thực hiện các phép tính số học và logic?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(201, 2, 7, 'Bộ nhớ trong của máy tính gồm những gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(202, 2, 7, 'Thanh ghi (Register) có đặc điểm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(203, 2, 7, 'Đơn vị đo tốc độ CPU thường dùng là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(204, 2, 7, 'Bus là gì trong máy tính?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(205, 2, 7, 'Máy tính thực hiện chương trình theo nguyên tắc nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(206, 2, 7, 'Trong kiến trúc Von Neumann, bộ nhớ dùng để lưu gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(207, 2, 7, 'Cache memory có chức năng gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(208, 2, 7, 'Đơn vị đo dung lượng bộ nhớ là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(209, 2, 7, 'ROM khác RAM ở điểm nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(210, 2, 7, 'Bus dữ liệu có nhiệm vụ gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(211, 2, 7, 'Bộ nhớ chính của máy tính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(212, 2, 7, 'Thiết bị nào là thiết bị vào/ra (I/O)?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(213, 2, 7, 'Chu kỳ máy (Machine Cycle) gồm các bước nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(214, 2, 7, 'Pipeline trong CPU dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(215, 2, 7, 'Hệ thống máy tính gồm mấy thành phần chính?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(216, 2, 7, 'Bus địa chỉ có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(217, 2, 7, 'BIOS được lưu ở đâu?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(218, 2, 7, 'Tốc độ truy cập của các loại bộ nhớ theo thứ tự nhanh đến chậm là?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 20:17:37', '2025-10-20 20:17:37'),
(219, 2, 7, 'Thiết bị nào dưới đây là thiết bị nhập?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(220, 2, 7, 'Thiết bị nào dùng để hiển thị thông tin ra?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(221, 2, 7, 'Hệ điều hành là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(222, 2, 7, 'Phím tắt sao chép văn bản trong Windows là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(223, 2, 7, 'Đơn vị đo dung lượng nhỏ nhất là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(224, 2, 7, 'Trong Word, để in đậm văn bản, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(225, 2, 7, 'Thiết bị nào lưu trữ dữ liệu lâu dài?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(226, 2, 7, 'Phần mềm nào sau đây dùng để soạn thảo văn bản?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(227, 2, 7, 'Internet là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(228, 2, 7, 'Trong PowerPoint, phím tắt bắt đầu trình chiếu là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(229, 2, 7, 'Để mở Task Manager, ta dùng tổ hợp phím nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(230, 2, 7, 'CPU có chức năng chính là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(231, 2, 7, 'RAM là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(232, 2, 7, 'Phần mềm diệt virus là loại phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(233, 2, 7, 'Tập tin có phần mở rộng .xls thuộc phần mềm nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(234, 2, 7, 'Trong máy tính, BIOS dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(235, 2, 7, 'Trình duyệt web nào sau đây không thuộc Microsoft?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(236, 2, 7, 'Trong Windows, Recycle Bin dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(237, 2, 7, 'Tổ hợp phím Ctrl + Z có tác dụng gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-20 21:24:20', '2025-10-20 21:24:20'),
(238, 2, 7, 'Điện toán đám mây (Cloud Computing) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(239, 2, 7, 'Dịch vụ IaaS cung cấp điều gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(240, 2, 7, 'Dịch vụ SaaS viết tắt của gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(241, 2, 7, 'Google Drive thuộc loại dịch vụ đám mây nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(242, 2, 7, 'PaaS cung cấp cho người dùng điều gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(243, 2, 7, 'AWS, Azure, và Google Cloud là ví dụ của?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(244, 2, 7, 'Ưu điểm chính của điện toán đám mây là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(245, 2, 7, 'Người dùng có thể truy cập dịch vụ đám mây bằng cách nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(246, 2, 7, 'Private Cloud là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(247, 2, 7, 'Public Cloud là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(248, 2, 7, 'Hybrid Cloud là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(249, 2, 7, 'Điện toán đám mây giúp tiết kiệm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(250, 2, 7, 'Cloud Storage là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(251, 2, 7, 'Tính năng chính của điện toán đám mây là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(252, 2, 7, 'Microsoft OneDrive là ví dụ của loại dịch vụ nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(253, 2, 7, 'Người dùng chỉ trả tiền cho tài nguyên sử dụng trong mô hình nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(254, 2, 7, 'Virtualization (ảo hóa) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(255, 2, 7, 'Đặc điểm nào sau đây đúng với đám mây công cộng?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(256, 2, 7, 'Cloud Computing giúp doanh nghiệp như thế nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(257, 2, 7, 'Dịch vụ điện toán đám mây nào cho phép người dùng triển khai máy chủ ảo?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-26 11:07:34', '2025-10-26 11:07:34'),
(258, NULL, 7, 'tên của e', 'Essay', 'Easy', 'câu trả lời', NULL, '2025-10-27 09:14:03', '2025-10-27 09:14:03'),
(259, 2, 7, 'Điện toán đám mây (Cloud Computing) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(260, 2, 7, 'Dịch vụ IaaS cung cấp điều gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(261, 2, 7, 'Dịch vụ SaaS viết tắt của gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(262, 2, 7, 'Google Drive thuộc loại dịch vụ đám mây nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(263, 2, 7, 'PaaS cung cấp cho người dùng điều gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(264, 2, 7, 'AWS, Azure, và Google Cloud là ví dụ của?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(265, 2, 7, 'Ưu điểm chính của điện toán đám mây là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(266, 2, 7, 'Người dùng có thể truy cập dịch vụ đám mây bằng cách nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(267, 2, 7, 'Private Cloud là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(268, 2, 7, 'Public Cloud là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(269, 2, 7, 'Hybrid Cloud là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(270, 2, 7, 'Điện toán đám mây giúp tiết kiệm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(271, 2, 7, 'Cloud Storage là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(272, 2, 7, 'Tính năng chính của điện toán đám mây là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(273, 2, 7, 'Microsoft OneDrive là ví dụ của loại dịch vụ nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:31', '2025-10-28 07:03:31'),
(274, 2, 7, 'Người dùng chỉ trả tiền cho tài nguyên sử dụng trong mô hình nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:32', '2025-10-28 07:03:32'),
(275, 2, 7, 'Virtualization (ảo hóa) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:32', '2025-10-28 07:03:32'),
(276, 2, 7, 'Đặc điểm nào sau đây đúng với đám mây công cộng?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-28 07:03:32', '2025-10-28 07:03:32'),
(277, 2, 7, 'Cloud Computing giúp doanh nghiệp như thế nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:32', '2025-10-28 07:03:32'),
(278, 2, 7, 'Dịch vụ điện toán đám mây nào cho phép người dùng triển khai máy chủ ảo?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-28 07:03:32', '2025-10-28 07:03:32'),
(279, NULL, 7, 'điện toán đám mây là gì', 'FillInBlank', 'Easy', 'câu trả lời', NULL, '2025-10-28 19:00:59', '2025-10-28 19:00:59'),
(280, 2, 7, 'Ngôn ngữ C# được phát triển bởi công ty nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(281, 2, 7, 'Đuôi mở rộng của tệp mã nguồn C# là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(282, 2, 7, 'C# là ngôn ngữ thuộc nền tảng nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(283, 2, 7, 'Phương thức Main trong C# có vai trò gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(284, 2, 7, 'Kiểu dữ liệu nào được dùng để lưu trữ số nguyên trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(285, 2, 7, 'Từ khóa nào dùng để khai báo lớp trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(286, 2, 7, 'Từ khóa nào được dùng để kế thừa lớp khác trong C#?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(287, 2, 7, 'Từ khóa nào để tạo đối tượng mới trong C#?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(288, 2, 7, 'Namespace trong C# dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(289, 2, 7, 'Phương thức ToString() trong C# dùng để?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(290, 2, 7, 'Từ khóa nào trong C# được dùng để xử lý ngoại lệ?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(291, 2, 7, 'Trong C#, mảng được khai báo bằng ký hiệu nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(292, 2, 7, 'Cấu trúc điều kiện trong C# được viết bằng từ khóa nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(293, 2, 7, 'C# có thể lập trình hướng đối tượng không?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(294, 2, 7, 'Công cụ IDE phổ biến nhất để lập trình C# là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(295, 2, 7, 'Phương thức nào được gọi khi khởi tạo đối tượng?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(296, 2, 7, 'Để nhập dữ liệu từ bàn phím trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(297, 2, 7, 'Để in dữ liệu ra màn hình trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(298, 2, 7, 'Từ khóa nào được dùng để ngăn lớp bị kế thừa?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(299, 2, 7, 'Kiểu dữ liệu nào dùng để lưu giá trị true/false?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:29:49', '2025-10-31 15:29:49'),
(300, 2, 7, 'Ngôn ngữ C# được phát triển bởi công ty nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(301, 2, 7, 'Đuôi mở rộng của tệp mã nguồn C# là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(302, 2, 7, 'C# là ngôn ngữ thuộc nền tảng nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(303, 2, 7, 'Phương thức Main trong C# có vai trò gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(304, 2, 7, 'Kiểu dữ liệu nào được dùng để lưu trữ số nguyên trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(305, 2, 7, 'Từ khóa nào dùng để khai báo lớp trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(306, 2, 7, 'Từ khóa nào được dùng để kế thừa lớp khác trong C#?', 'SingleChoice', 'Medium', 'D', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(307, 2, 7, 'Từ khóa nào để tạo đối tượng mới trong C#?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(308, 2, 7, 'Namespace trong C# dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(309, 2, 7, 'Phương thức ToString() trong C# dùng để?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(310, 2, 7, 'Từ khóa nào trong C# được dùng để xử lý ngoại lệ?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(311, 2, 7, 'Trong C#, mảng được khai báo bằng ký hiệu nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(312, 2, 7, 'Cấu trúc điều kiện trong C# được viết bằng từ khóa nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(313, 2, 7, 'C# có thể lập trình hướng đối tượng không?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(314, 2, 7, 'Công cụ IDE phổ biến nhất để lập trình C# là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(315, 2, 7, 'Phương thức nào được gọi khi khởi tạo đối tượng?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(316, 2, 7, 'Để nhập dữ liệu từ bàn phím trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(317, 2, 7, 'Để in dữ liệu ra màn hình trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(318, 2, 7, 'Từ khóa nào được dùng để ngăn lớp bị kế thừa?', 'SingleChoice', 'Medium', 'C', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(319, 2, 7, 'Kiểu dữ liệu nào dùng để lưu giá trị true/false?', 'SingleChoice', 'Medium', 'A', NULL, '2025-10-31 15:41:58', '2025-10-31 15:41:58'),
(320, NULL, 7, 'trong mysql việc sử dụng tiếng việt có dấu thì dùng kiểu dữ liệu nào', 'FillInBlank', 'Easy', 'nvarchar', NULL, '2025-10-31 18:13:54', '2025-10-31 18:13:54'),
(321, NULL, 7, 'kiểu dữ liệu số trong js là gì', 'FillInBlank', 'Easy', 'number', NULL, '2025-11-01 08:02:47', '2025-11-01 08:02:47'),
(322, NULL, 7, 'ngôn ngữ nào lập trình hướng đối tượng', 'FillInBlank', 'Easy', 'C#.C++', NULL, '2025-11-01 08:11:59', '2025-11-01 08:11:59'),
(323, NULL, 7, 'test 1', 'FillInBlank', 'Easy', '...', NULL, '2025-11-01 08:18:56', '2025-11-01 08:18:56'),
(324, NULL, 7, 'qqqq', 'FillInBlank', 'Easy', 'qqq', NULL, '2025-11-01 08:43:51', '2025-11-01 08:43:51'),
(326, NULL, 7, '1111', 'FillInBlank', 'Easy', '111', NULL, '2025-11-01 09:06:30', '2025-11-01 09:06:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `question_options`
--

CREATE TABLE `question_options` (
  `option_id` bigint NOT NULL,
  `question_id` bigint DEFAULT NULL,
  `option_content` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `question_options`
--

INSERT INTO `question_options` (`option_id`, `question_id`, `option_content`, `is_correct`) VALUES
(1, 121, 'Máy in', 0),
(2, 121, 'Màn hình', 0),
(3, 121, 'Chuột', 1),
(4, 121, 'Máy chiếu', 0),
(5, 122, 'Bàn phím', 0),
(6, 122, 'Màn hình', 1),
(7, 122, 'Chuột', 0),
(8, 122, 'Máy quét', 0),
(9, 123, 'Phần cứng', 0),
(10, 123, 'Phần mềm hệ thống', 1),
(11, 123, 'Phần mềm ứng dụng', 0),
(12, 123, 'Thiết bị ngoại vi', 0),
(13, 124, 'Ctrl + X', 0),
(14, 124, 'Ctrl + C', 1),
(15, 124, 'Ctrl + V', 0),
(16, 124, 'Ctrl + A', 0),
(17, 125, 'Byte', 0),
(18, 125, 'Bit', 1),
(19, 125, 'KB', 0),
(20, 125, 'MB', 0),
(21, 126, 'Ctrl + I', 0),
(22, 126, 'Ctrl + U', 0),
(23, 126, 'Ctrl + B', 1),
(24, 126, 'Ctrl + P', 0),
(25, 128, 'RAM', 0),
(26, 128, 'Ổ cứng', 1),
(27, 128, 'CPU', 0),
(28, 128, 'Cache', 0),
(29, 129, 'Microsoft Word', 1),
(30, 129, 'Microsoft Excel', 0),
(31, 129, 'Microsoft Access', 0),
(32, 129, 'Microsoft Paint', 0),
(33, 130, 'Một trình duyệt web', 0),
(34, 130, 'Một mạng máy tính toàn cầu', 1),
(35, 130, 'Một hệ điều hành', 0),
(36, 130, 'Một phần mềm chat', 0),
(37, 131, 'F2', 0),
(38, 131, 'F5', 1),
(39, 131, 'Ctrl + P', 0),
(40, 131, 'Alt + F4', 0),
(41, 132, 'Ctrl + Alt + Del', 0),
(42, 132, 'Alt + Tab', 0),
(43, 132, 'Ctrl + Shift + Esc', 0),
(44, 132, 'Cả A và C đều đúng', 1),
(45, 133, 'Lưu trữ dữ liệu', 0),
(46, 133, 'Thực hiện và điều khiển xử lý dữ liệu', 1),
(47, 133, 'Hiển thị dữ liệu', 0),
(48, 133, 'Kết nối mạng', 0),
(49, 134, 'Bộ nhớ truy cập ngẫu nhiên', 1),
(50, 134, 'Bộ nhớ chỉ đọc', 0),
(51, 134, 'Ổ đĩa cứng', 0),
(52, 134, 'Bộ xử lý trung tâm', 0),
(53, 135, 'Phần mềm hệ thống', 0),
(54, 135, 'Phần mềm tiện ích', 1),
(55, 135, 'Phần mềm độc hại', 0),
(56, 135, 'Phần mềm văn phòng', 0),
(57, 136, 'Word', 0),
(58, 136, 'Excel', 1),
(59, 136, 'Access', 0),
(60, 136, 'PowerPoint', 0),
(61, 137, 'Lưu trữ dữ liệu', 0),
(62, 137, 'Khởi động và kiểm tra phần cứng', 1),
(63, 137, 'Chạy ứng dụng', 0),
(64, 137, 'Cập nhật phần mềm', 0),
(65, 138, 'Internet Explorer', 0),
(66, 138, 'Edge', 0),
(67, 138, 'Chrome', 1),
(68, 138, 'Bing', 0),
(69, 139, 'Lưu file tạm thời', 0),
(70, 139, 'Chứa các file đã xóa', 1),
(71, 139, 'Chứa file hệ thống', 0),
(72, 139, 'Chứa file cài đặt', 0),
(73, 140, 'Hoàn tác thao tác vừa làm', 1),
(74, 140, 'Lưu tài liệu', 0),
(75, 140, 'Đóng cửa sổ', 0),
(76, 140, 'Cắt văn bản', 0),
(77, 141, 'Máy in', 0),
(78, 141, 'Màn hình', 0),
(79, 141, 'Chuột', 1),
(80, 141, 'Máy chiếu', 0),
(81, 142, 'Bàn phím', 0),
(82, 142, 'Màn hình', 1),
(83, 142, 'Chuột', 0),
(84, 142, 'Máy quét', 0),
(85, 143, 'Phần cứng', 0),
(86, 143, 'Phần mềm hệ thống', 1),
(87, 143, 'Phần mềm ứng dụng', 0),
(88, 143, 'Thiết bị ngoại vi', 0),
(89, 144, 'Ctrl + X', 0),
(90, 144, 'Ctrl + C', 1),
(91, 144, 'Ctrl + V', 0),
(92, 144, 'Ctrl + A', 0),
(93, 145, 'Byte', 0),
(94, 145, 'Bit', 1),
(95, 145, 'KB', 0),
(96, 145, 'MB', 0),
(97, 146, 'Ctrl + I', 0),
(98, 146, 'Ctrl + U', 0),
(99, 146, 'Ctrl + B', 1),
(100, 146, 'Ctrl + P', 0),
(101, 147, 'RAM', 0),
(102, 147, 'Ổ cứng', 1),
(103, 147, 'CPU', 0),
(104, 147, 'Cache', 0),
(105, 148, 'Microsoft Word', 1),
(106, 148, 'Microsoft Excel', 0),
(107, 148, 'Microsoft Access', 0),
(108, 148, 'Microsoft Paint', 0),
(109, 149, 'Một trình duyệt web', 0),
(110, 149, 'Một mạng máy tính toàn cầu', 1),
(111, 149, 'Một hệ điều hành', 0),
(112, 149, 'Một phần mềm chat', 0),
(113, 150, 'F2', 0),
(114, 150, 'F5', 1),
(115, 150, 'Ctrl + P', 0),
(116, 150, 'Alt + F4', 0),
(117, 151, 'Ctrl + Alt + Del', 0),
(118, 151, 'Alt + Tab', 0),
(119, 151, 'Ctrl + Shift + Esc', 0),
(120, 151, 'Cả A và C đều đúng', 1),
(121, 152, 'Lưu trữ dữ liệu', 0),
(122, 152, 'Thực hiện và điều khiển xử lý dữ liệu', 1),
(123, 152, 'Hiển thị dữ liệu', 0),
(124, 152, 'Kết nối mạng', 0),
(129, 154, 'Phần mềm hệ thống', 0),
(130, 154, 'Phần mềm tiện ích', 1),
(131, 154, 'Phần mềm độc hại', 0),
(132, 154, 'Phần mềm văn phòng', 0),
(133, 155, 'Word', 0),
(134, 155, 'Excel', 1),
(135, 155, 'Access', 0),
(136, 155, 'PowerPoint', 0),
(137, 156, 'Lưu trữ dữ liệu', 0),
(138, 156, 'Khởi động và kiểm tra phần cứng', 1),
(139, 156, 'Chạy ứng dụng', 0),
(140, 156, 'Cập nhật phần mềm', 0),
(141, 157, 'Internet Explorer', 0),
(142, 157, 'Edge', 0),
(143, 157, 'Chrome', 1),
(144, 157, 'Bing', 0),
(145, 158, 'Lưu file tạm thời', 0),
(146, 158, 'Chứa các file đã xóa', 1),
(147, 158, 'Chứa file hệ thống', 0),
(148, 158, 'Chứa file cài đặt', 0),
(149, 159, 'Hoàn tác thao tác vừa làm', 1),
(150, 159, 'Lưu tài liệu', 0),
(151, 159, 'Đóng cửa sổ', 0),
(152, 159, 'Cắt văn bản', 0),
(153, 160, 'Máy in', 0),
(154, 160, 'Màn hình', 0),
(155, 160, 'Chuột', 1),
(156, 160, 'Máy chiếu', 0),
(157, 161, 'Bàn phím', 0),
(158, 161, 'Màn hình', 1),
(159, 161, 'Chuột', 0),
(160, 161, 'Máy quét', 0),
(161, 162, 'Phần cứng', 0),
(162, 162, 'Phần mềm hệ thống', 1),
(163, 162, 'Phần mềm ứng dụng', 0),
(164, 162, 'Thiết bị ngoại vi', 0),
(165, 163, 'Ctrl + X', 0),
(166, 163, 'Ctrl + C', 1),
(167, 163, 'Ctrl + V', 0),
(168, 163, 'Ctrl + A', 0),
(169, 164, 'Byte', 0),
(170, 164, 'Bit', 1),
(171, 164, 'KB', 0),
(172, 164, 'MB', 0),
(173, 165, 'Ctrl + I', 0),
(174, 165, 'Ctrl + U', 0),
(175, 165, 'Ctrl + B', 1),
(176, 165, 'Ctrl + P', 0),
(177, 166, 'RAM', 0),
(178, 166, 'Ổ cứng', 1),
(179, 166, 'CPU', 0),
(180, 166, 'Cache', 0),
(181, 167, 'Microsoft Word', 1),
(182, 167, 'Microsoft Excel', 0),
(183, 167, 'Microsoft Access', 0),
(184, 167, 'Microsoft Paint', 0),
(185, 168, 'Một trình duyệt web', 0),
(186, 168, 'Một mạng máy tính toàn cầu', 1),
(187, 168, 'Một hệ điều hành', 0),
(188, 168, 'Một phần mềm chat', 0),
(189, 169, 'F2', 0),
(190, 169, 'F5', 1),
(191, 169, 'Ctrl + P', 0),
(192, 169, 'Alt + F4', 0),
(193, 170, 'Ctrl + Alt + Del', 0),
(194, 170, 'Alt + Tab', 0),
(195, 170, 'Ctrl + Shift + Esc', 0),
(196, 170, 'Cả A và C đều đúng', 1),
(197, 171, 'Lưu trữ dữ liệu', 0),
(198, 171, 'Thực hiện và điều khiển xử lý dữ liệu', 1),
(199, 171, 'Hiển thị dữ liệu', 0),
(200, 171, 'Kết nối mạng', 0),
(201, 172, 'Bộ nhớ truy cập ngẫu nhiên', 1),
(202, 172, 'Bộ nhớ chỉ đọc', 0),
(203, 172, 'Ổ đĩa cứng', 0),
(204, 172, 'Bộ xử lý trung tâm', 0),
(205, 173, 'Phần mềm hệ thống', 0),
(206, 173, 'Phần mềm tiện ích', 1),
(207, 173, 'Phần mềm độc hại', 0),
(208, 173, 'Phần mềm văn phòng', 0),
(209, 174, 'Word', 0),
(210, 174, 'Excel', 1),
(211, 174, 'Access', 0),
(212, 174, 'PowerPoint', 0),
(213, 175, 'Lưu trữ dữ liệu', 0),
(214, 175, 'Khởi động và kiểm tra phần cứng', 1),
(215, 175, 'Chạy ứng dụng', 0),
(216, 175, 'Cập nhật phần mềm', 0),
(217, 176, 'Internet Explorer', 0),
(218, 176, 'Edge', 0),
(219, 176, 'Chrome', 1),
(220, 176, 'Bing', 0),
(221, 177, 'Lưu file tạm thời', 0),
(222, 177, 'Chứa các file đã xóa', 1),
(223, 177, 'Chứa file hệ thống', 0),
(224, 177, 'Chứa file cài đặt', 0),
(225, 178, 'Hoàn tác thao tác vừa làm', 1),
(226, 178, 'Lưu tài liệu', 0),
(227, 178, 'Đóng cửa sổ', 0),
(228, 178, 'Cắt văn bản', 0),
(229, 179, 'Central Process Unit', 0),
(230, 179, 'Central Processing Unit', 1),
(231, 179, 'Control Processing Unit', 0),
(232, 179, 'Central Program Unit', 0),
(233, 180, 'Bộ điều khiển', 0),
(234, 180, 'Bộ nhớ', 0),
(235, 180, 'Bộ số học và logic (ALU)', 1),
(236, 180, 'Thanh ghi', 0),
(237, 181, 'ROM và RAM', 1),
(238, 181, 'HDD và SSD', 0),
(239, 181, 'CD và DVD', 0),
(240, 181, 'Cache và Disk', 0),
(241, 182, 'Dung lượng lớn, tốc độ chậm', 0),
(242, 182, 'Dung lượng nhỏ, tốc độ rất nhanh', 1),
(243, 182, 'Dung lượng lớn, tốc độ thấp', 0),
(244, 182, 'Không lưu trữ dữ liệu', 0),
(245, 183, 'Byte', 0),
(246, 183, 'Bit', 0),
(247, 183, 'Hz', 1),
(248, 183, 'MB', 0),
(249, 184, 'Đường truyền dữ liệu giữa các bộ phận', 1),
(250, 184, 'Bộ nhớ ngoài', 0),
(251, 184, 'Bộ xử lý trung tâm', 0),
(252, 184, 'Thiết bị ngoại vi', 0),
(253, 185, 'Nguyên tắc tuần tự', 0),
(254, 185, 'Nguyên tắc song song', 0),
(255, 185, 'Nguyên tắc Von Neumann', 1),
(256, 185, 'Nguyên tắc logic', 0),
(257, 186, 'Chỉ dữ liệu', 0),
(258, 186, 'Chỉ lệnh', 0),
(259, 186, 'Cả lệnh và dữ liệu', 1),
(260, 186, 'Không có chức năng lưu', 0),
(261, 187, 'Tăng dung lượng RAM', 0),
(262, 187, 'Giảm tải cho CPU', 0),
(263, 187, 'Tăng tốc độ truy cập dữ liệu', 1),
(264, 187, 'Lưu trữ dữ liệu lâu dài', 0),
(265, 188, 'Hertz', 0),
(266, 188, 'Byte', 1),
(267, 188, 'Volt', 0),
(268, 188, 'Bit/s', 0),
(269, 189, 'RAM lưu lâu dài, ROM tạm thời', 0),
(270, 189, 'ROM lưu tạm thời, RAM lâu dài', 0),
(271, 189, 'ROM chỉ đọc, RAM đọc/ghi được', 1),
(272, 189, 'Không có khác biệt', 0),
(273, 190, 'Truyền dữ liệu', 1),
(274, 190, 'Truyền địa chỉ', 0),
(275, 190, 'Truyền tín hiệu điều khiển', 0),
(276, 190, 'Tất cả các ý trên', 0),
(277, 191, 'ROM', 0),
(278, 191, 'RAM', 1),
(279, 191, 'Cache', 0),
(280, 191, 'Ổ cứng', 0),
(281, 192, 'Bàn phím', 0),
(282, 192, 'Màn hình', 0),
(283, 192, 'Ổ đĩa USB', 0),
(284, 192, 'Cả ba đều đúng', 1),
(285, 193, 'Nạp lệnh, giải mã, thực thi', 1),
(286, 193, 'Khởi động, chạy, tắt', 0),
(287, 193, 'Nhập, xử lý, xuất', 0),
(288, 193, 'Nạp dữ liệu, lưu dữ liệu', 0),
(289, 194, 'Tăng tốc độ xử lý bằng cách song song hóa', 1),
(290, 194, 'Giảm điện năng tiêu thụ', 0),
(291, 194, 'Lưu trữ dữ liệu', 0),
(292, 194, 'Tăng dung lượng bộ nhớ', 0),
(293, 195, '2', 0),
(294, 195, '3', 0),
(295, 195, '4', 1),
(296, 195, '5', 0),
(297, 196, 'Xác định vị trí dữ liệu cần truy cập', 1),
(298, 196, 'Truyền dữ liệu', 0),
(299, 196, 'Truyền tín hiệu điều khiển', 0),
(300, 196, 'Kết nối thiết bị ngoại vi', 0),
(301, 197, 'RAM', 0),
(302, 197, 'ROM', 1),
(303, 197, 'Ổ cứng', 0),
(304, 197, 'Cache', 0),
(305, 198, 'Cache → RAM → Ổ cứng', 1),
(306, 198, 'RAM → Cache → Ổ cứng', 0),
(307, 198, 'Ổ cứng → Cache → RAM', 0),
(308, 198, 'ROM → RAM → Cache', 0),
(309, 199, 'Central Process Unit', 0),
(310, 199, 'Central Processing Unit', 1),
(311, 199, 'Control Processing Unit', 0),
(312, 199, 'Central Program Unit', 0),
(313, 200, 'Bộ điều khiển', 0),
(314, 200, 'Bộ nhớ', 0),
(315, 200, 'Bộ số học và logic (ALU)', 1),
(316, 200, 'Thanh ghi', 0),
(317, 201, 'ROM và RAM', 1),
(318, 201, 'HDD và SSD', 0),
(319, 201, 'CD và DVD', 0),
(320, 201, 'Cache và Disk', 0),
(321, 202, 'Dung lượng lớn, tốc độ chậm', 0),
(322, 202, 'Dung lượng nhỏ, tốc độ rất nhanh', 1),
(323, 202, 'Dung lượng lớn, tốc độ thấp', 0),
(324, 202, 'Không lưu trữ dữ liệu', 0),
(325, 203, 'Byte', 0),
(326, 203, 'Bit', 0),
(327, 203, 'Hz', 1),
(328, 203, 'MB', 0),
(329, 204, 'Đường truyền dữ liệu giữa các bộ phận', 1),
(330, 204, 'Bộ nhớ ngoài', 0),
(331, 204, 'Bộ xử lý trung tâm', 0),
(332, 204, 'Thiết bị ngoại vi', 0),
(333, 205, 'Nguyên tắc tuần tự', 0),
(334, 205, 'Nguyên tắc song song', 0),
(335, 205, 'Nguyên tắc Von Neumann', 1),
(336, 205, 'Nguyên tắc logic', 0),
(337, 206, 'Chỉ dữ liệu', 0),
(338, 206, 'Chỉ lệnh', 0),
(339, 206, 'Cả lệnh và dữ liệu', 1),
(340, 206, 'Không có chức năng lưu', 0),
(341, 207, 'Tăng dung lượng RAM', 0),
(342, 207, 'Giảm tải cho CPU', 0),
(343, 207, 'Tăng tốc độ truy cập dữ liệu', 1),
(344, 207, 'Lưu trữ dữ liệu lâu dài', 0),
(345, 208, 'Hertz', 0),
(346, 208, 'Byte', 1),
(347, 208, 'Volt', 0),
(348, 208, 'Bit/s', 0),
(349, 209, 'RAM lưu lâu dài, ROM tạm thời', 0),
(350, 209, 'ROM lưu tạm thời, RAM lâu dài', 0),
(351, 209, 'ROM chỉ đọc, RAM đọc/ghi được', 1),
(352, 209, 'Không có khác biệt', 0),
(353, 210, 'Truyền dữ liệu', 1),
(354, 210, 'Truyền địa chỉ', 0),
(355, 210, 'Truyền tín hiệu điều khiển', 0),
(356, 210, 'Tất cả các ý trên', 0),
(357, 211, 'ROM', 0),
(358, 211, 'RAM', 1),
(359, 211, 'Cache', 0),
(360, 211, 'Ổ cứng', 0),
(361, 212, 'Bàn phím', 0),
(362, 212, 'Màn hình', 0),
(363, 212, 'Ổ đĩa USB', 0),
(364, 212, 'Cả ba đều đúng', 1),
(365, 213, 'Nạp lệnh, giải mã, thực thi', 1),
(366, 213, 'Khởi động, chạy, tắt', 0),
(367, 213, 'Nhập, xử lý, xuất', 0),
(368, 213, 'Nạp dữ liệu, lưu dữ liệu', 0),
(369, 214, 'Tăng tốc độ xử lý bằng cách song song hóa', 1),
(370, 214, 'Giảm điện năng tiêu thụ', 0),
(371, 214, 'Lưu trữ dữ liệu', 0),
(372, 214, 'Tăng dung lượng bộ nhớ', 0),
(373, 215, '2', 0),
(374, 215, '3', 0),
(375, 215, '4', 1),
(376, 215, '5', 0),
(377, 216, 'Xác định vị trí dữ liệu cần truy cập', 1),
(378, 216, 'Truyền dữ liệu', 0),
(379, 216, 'Truyền tín hiệu điều khiển', 0),
(380, 216, 'Kết nối thiết bị ngoại vi', 0),
(381, 217, 'RAM', 0),
(382, 217, 'ROM', 1),
(383, 217, 'Ổ cứng', 0),
(384, 217, 'Cache', 0),
(385, 218, 'Cache → RAM → Ổ cứng', 1),
(386, 218, 'RAM → Cache → Ổ cứng', 0),
(387, 218, 'Ổ cứng → Cache → RAM', 0),
(388, 218, 'ROM → RAM → Cache', 0),
(389, 219, 'Máy in', 0),
(390, 219, 'Màn hình', 0),
(391, 219, 'Chuột', 1),
(392, 219, 'Máy chiếu', 0),
(393, 220, 'Bàn phím', 0),
(394, 220, 'Màn hình', 1),
(395, 220, 'Chuột', 0),
(396, 220, 'Máy quét', 0),
(397, 221, 'Phần cứng', 0),
(398, 221, 'Phần mềm hệ thống', 1),
(399, 221, 'Phần mềm ứng dụng', 0),
(400, 221, 'Thiết bị ngoại vi', 0),
(401, 222, 'Ctrl + X', 0),
(402, 222, 'Ctrl + C', 1),
(403, 222, 'Ctrl + V', 0),
(404, 222, 'Ctrl + A', 0),
(405, 223, 'Byte', 0),
(406, 223, 'Bit', 1),
(407, 223, 'KB', 0),
(408, 223, 'MB', 0),
(409, 224, 'Ctrl + I', 0),
(410, 224, 'Ctrl + U', 0),
(411, 224, 'Ctrl + B', 1),
(412, 224, 'Ctrl + P', 0),
(413, 225, 'RAM', 0),
(414, 225, 'Ổ cứng', 1),
(415, 225, 'CPU', 0),
(416, 225, 'Cache', 0),
(417, 226, 'Microsoft Word', 1),
(418, 226, 'Microsoft Excel', 0),
(419, 226, 'Microsoft Access', 0),
(420, 226, 'Microsoft Paint', 0),
(421, 227, 'Một trình duyệt web', 0),
(422, 227, 'Một mạng máy tính toàn cầu', 1),
(423, 227, 'Một hệ điều hành', 0),
(424, 227, 'Một phần mềm chat', 0),
(425, 228, 'F2', 0),
(426, 228, 'F5', 1),
(427, 228, 'Ctrl + P', 0),
(428, 228, 'Alt + F4', 0),
(429, 229, 'Ctrl + Alt + Del', 0),
(430, 229, 'Alt + Tab', 0),
(431, 229, 'Ctrl + Shift + Esc', 0),
(432, 229, 'Cả A và C đều đúng', 1),
(433, 230, 'Lưu trữ dữ liệu', 0),
(434, 230, 'Thực hiện và điều khiển xử lý dữ liệu', 1),
(435, 230, 'Hiển thị dữ liệu', 0),
(436, 230, 'Kết nối mạng', 0),
(437, 231, 'Bộ nhớ truy cập ngẫu nhiên', 1),
(438, 231, 'Bộ nhớ chỉ đọc', 0),
(439, 231, 'Ổ đĩa cứng', 0),
(440, 231, 'Bộ xử lý trung tâm', 0),
(441, 232, 'Phần mềm hệ thống', 0),
(442, 232, 'Phần mềm tiện ích', 1),
(443, 232, 'Phần mềm độc hại', 0),
(444, 232, 'Phần mềm văn phòng', 0),
(445, 233, 'Word', 0),
(446, 233, 'Excel', 1),
(447, 233, 'Access', 0),
(448, 233, 'PowerPoint', 0),
(449, 234, 'Lưu trữ dữ liệu', 0),
(450, 234, 'Khởi động và kiểm tra phần cứng', 1),
(451, 234, 'Chạy ứng dụng', 0),
(452, 234, 'Cập nhật phần mềm', 0),
(453, 235, 'Internet Explorer', 0),
(454, 235, 'Edge', 0),
(455, 235, 'Chrome', 1),
(456, 235, 'Bing', 0),
(457, 236, 'Lưu file tạm thời', 0),
(458, 236, 'Chứa các file đã xóa', 1),
(459, 236, 'Chứa file hệ thống', 0),
(460, 236, 'Chứa file cài đặt', 0),
(461, 237, 'Hoàn tác thao tác vừa làm', 1),
(462, 237, 'Lưu tài liệu', 0),
(463, 237, 'Đóng cửa sổ', 0),
(464, 237, 'Cắt văn bản', 0),
(465, 238, 'Lưu trữ dữ liệu cục bộ', 0),
(466, 238, 'Lưu trữ và xử lý dữ liệu qua Internet', 1),
(467, 238, 'Sử dụng phần cứng mạnh', 0),
(468, 238, 'Chia sẻ dữ liệu qua USB', 0),
(469, 239, 'Phần mềm', 0),
(470, 239, 'Cơ sở hạ tầng ảo hóa', 1),
(471, 239, 'Ứng dụng web', 0),
(472, 239, 'Máy tính để bàn', 0),
(473, 240, 'Software as a Service', 1),
(474, 240, 'System as a Software', 0),
(475, 240, 'Storage as a Server', 0),
(476, 240, 'Solution as a Software', 0),
(477, 241, 'SaaS', 1),
(478, 241, 'PaaS', 0),
(479, 241, 'IaaS', 0),
(480, 241, 'CaaS', 0),
(481, 242, 'Phần cứng vật lý', 0),
(482, 242, 'Nền tảng phát triển ứng dụng', 1),
(483, 242, 'Ứng dụng hoàn chỉnh', 0),
(484, 242, 'Cơ sở dữ liệu cục bộ', 0),
(485, 243, 'Nhà cung cấp dịch vụ đám mây', 1),
(486, 243, 'Phần mềm văn phòng', 0),
(487, 243, 'Thiết bị mạng', 0),
(488, 243, 'Trình duyệt web', 0),
(489, 244, 'Chi phí cao', 0),
(490, 244, 'Không bảo mật', 0),
(491, 244, 'Khả năng mở rộng và linh hoạt', 1),
(492, 244, 'Khó bảo trì', 0),
(493, 245, 'Qua Internet', 1),
(494, 245, 'Qua USB', 0),
(495, 245, 'Qua Bluetooth', 0),
(496, 245, 'Qua mạng LAN', 0),
(497, 246, 'Đám mây công cộng', 0),
(498, 246, 'Đám mây dùng riêng cho một tổ chức', 1),
(499, 246, 'Đám mây của Google', 0),
(500, 246, 'Đám mây chia sẻ', 0),
(501, 247, 'Dịch vụ đám mây công cộng', 1),
(502, 247, 'Dịch vụ đám mây cá nhân', 0),
(503, 247, 'Dịch vụ nội bộ', 0),
(504, 247, 'Dịch vụ không có Internet', 0),
(505, 248, 'Kết hợp giữa đám mây công cộng và riêng tư', 1),
(506, 248, 'Đám mây chỉ cho nội bộ', 0),
(507, 248, 'Đám mây offline', 0),
(508, 248, 'Không có thật', 0),
(509, 249, 'Điện năng', 0),
(510, 249, 'Chi phí đầu tư hạ tầng', 1),
(511, 249, 'Băng thông mạng', 0),
(512, 249, 'Dung lượng bộ nhớ RAM', 0),
(513, 250, 'Dịch vụ lưu trữ dữ liệu trực tuyến', 1),
(514, 250, 'Phần mềm diệt virus', 0),
(515, 250, 'Hệ điều hành', 0),
(516, 250, 'Ứng dụng văn phòng', 0),
(517, 251, 'Khả năng mở rộng linh hoạt', 1),
(518, 251, 'Tốc độ chậm', 0),
(519, 251, 'Phụ thuộc thiết bị', 0),
(520, 251, 'Không thể chia sẻ', 0),
(521, 252, 'PaaS', 0),
(522, 252, 'SaaS', 1),
(523, 252, 'IaaS', 0),
(524, 252, 'CaaS', 0),
(525, 253, 'Pay-as-you-go', 1),
(526, 253, 'Trả phí cố định', 0),
(527, 253, 'Miễn phí', 0),
(528, 253, 'Gói trọn đời', 0),
(529, 254, 'Tăng tốc CPU', 0),
(530, 254, 'Tạo bản sao ảo của tài nguyên', 1),
(531, 254, 'Sao lưu dữ liệu', 0),
(532, 254, 'Chia sẻ mạng', 0),
(533, 255, 'Chỉ một tổ chức sử dụng', 0),
(534, 255, 'Chia sẻ tài nguyên giữa nhiều người dùng', 1),
(535, 255, 'Không dùng Internet', 0),
(536, 255, 'Miễn phí hoàn toàn', 0),
(537, 256, 'Giảm chi phí hạ tầng và bảo trì', 1),
(538, 256, 'Tăng chi phí phần cứng', 0),
(539, 256, 'Phụ thuộc địa lý', 0),
(540, 256, 'Cần nhân lực lớn hơn', 0),
(541, 257, 'IaaS', 1),
(542, 257, 'PaaS', 0),
(543, 257, 'SaaS', 0),
(544, 257, 'FaaS', 0),
(545, 259, 'Lưu trữ dữ liệu cục bộ', 0),
(546, 259, 'Lưu trữ và xử lý dữ liệu qua Internet', 1),
(547, 259, 'Sử dụng phần cứng mạnh', 0),
(548, 259, 'Chia sẻ dữ liệu qua USB', 0),
(549, 260, 'Phần mềm', 0),
(550, 260, 'Cơ sở hạ tầng ảo hóa', 1),
(551, 260, 'Ứng dụng web', 0),
(552, 260, 'Máy tính để bàn', 0),
(553, 261, 'Software as a Service', 1),
(554, 261, 'System as a Software', 0),
(555, 261, 'Storage as a Server', 0),
(556, 261, 'Solution as a Software', 0),
(557, 262, 'SaaS', 1),
(558, 262, 'PaaS', 0),
(559, 262, 'IaaS', 0),
(560, 262, 'CaaS', 0),
(561, 263, 'Phần cứng vật lý', 0),
(562, 263, 'Nền tảng phát triển ứng dụng', 1),
(563, 263, 'Ứng dụng hoàn chỉnh', 0),
(564, 263, 'Cơ sở dữ liệu cục bộ', 0),
(565, 264, 'Nhà cung cấp dịch vụ đám mây', 1),
(566, 264, 'Phần mềm văn phòng', 0),
(567, 264, 'Thiết bị mạng', 0),
(568, 264, 'Trình duyệt web', 0),
(569, 265, 'Chi phí cao', 0),
(570, 265, 'Không bảo mật', 0),
(571, 265, 'Khả năng mở rộng và linh hoạt', 1),
(572, 265, 'Khó bảo trì', 0),
(573, 266, 'Qua Internet', 1),
(574, 266, 'Qua USB', 0),
(575, 266, 'Qua Bluetooth', 0),
(576, 266, 'Qua mạng LAN', 0),
(577, 267, 'Đám mây công cộng', 0),
(578, 267, 'Đám mây dùng riêng cho một tổ chức', 1),
(579, 267, 'Đám mây của Google', 0),
(580, 267, 'Đám mây chia sẻ', 0),
(581, 268, 'Dịch vụ đám mây công cộng', 1),
(582, 268, 'Dịch vụ đám mây cá nhân', 0),
(583, 268, 'Dịch vụ nội bộ', 0),
(584, 268, 'Dịch vụ không có Internet', 0),
(585, 269, 'Kết hợp giữa đám mây công cộng và riêng tư', 1),
(586, 269, 'Đám mây chỉ cho nội bộ', 0),
(587, 269, 'Đám mây offline', 0),
(588, 269, 'Không có thật', 0),
(589, 270, 'Điện năng', 0),
(590, 270, 'Chi phí đầu tư hạ tầng', 1),
(591, 270, 'Băng thông mạng', 0),
(592, 270, 'Dung lượng bộ nhớ RAM', 0),
(593, 271, 'Dịch vụ lưu trữ dữ liệu trực tuyến', 1),
(594, 271, 'Phần mềm diệt virus', 0),
(595, 271, 'Hệ điều hành', 0),
(596, 271, 'Ứng dụng văn phòng', 0),
(597, 272, 'Khả năng mở rộng linh hoạt', 1),
(598, 272, 'Tốc độ chậm', 0),
(599, 272, 'Phụ thuộc thiết bị', 0),
(600, 272, 'Không thể chia sẻ', 0),
(601, 273, 'PaaS', 0),
(602, 273, 'SaaS', 1),
(603, 273, 'IaaS', 0),
(604, 273, 'CaaS', 0),
(605, 274, 'Pay-as-you-go', 1),
(606, 274, 'Trả phí cố định', 0),
(607, 274, 'Miễn phí', 0),
(608, 274, 'Gói trọn đời', 0),
(609, 275, 'Tăng tốc CPU', 0),
(610, 275, 'Tạo bản sao ảo của tài nguyên', 1),
(611, 275, 'Sao lưu dữ liệu', 0),
(612, 275, 'Chia sẻ mạng', 0),
(613, 276, 'Chỉ một tổ chức sử dụng', 0),
(614, 276, 'Chia sẻ tài nguyên giữa nhiều người dùng', 1),
(615, 276, 'Không dùng Internet', 0),
(616, 276, 'Miễn phí hoàn toàn', 0),
(617, 277, 'Giảm chi phí hạ tầng và bảo trì', 1),
(618, 277, 'Tăng chi phí phần cứng', 0),
(619, 277, 'Phụ thuộc địa lý', 0),
(620, 277, 'Cần nhân lực lớn hơn', 0),
(621, 278, 'IaaS', 1),
(622, 278, 'PaaS', 0),
(623, 278, 'SaaS', 0),
(624, 278, 'FaaS', 0),
(625, 280, 'Google', 0),
(626, 280, 'Microsoft', 1),
(627, 280, 'Apple', 0),
(628, 280, 'Oracle', 0),
(629, 281, '.java', 0),
(630, 281, '.cpp', 0),
(631, 281, '.cs', 1),
(632, 281, '.c', 0),
(633, 282, '.NET', 1),
(634, 282, 'JVM', 0),
(635, 282, 'Android', 0),
(636, 282, 'Python', 0),
(637, 283, 'Khởi tạo đối tượng', 0),
(638, 283, 'Là điểm bắt đầu của chương trình', 1),
(639, 283, 'Khai báo biến', 0),
(640, 283, 'Gọi hàm', 0),
(641, 284, 'int', 1),
(642, 284, 'float', 0),
(643, 284, 'double', 0),
(644, 284, 'char', 0),
(645, 285, 'class', 1),
(646, 285, 'struct', 0),
(647, 285, 'interface', 0),
(648, 285, 'namespace', 0),
(649, 286, 'inherits', 0),
(650, 286, 'extends', 0),
(651, 286, 'base', 0),
(652, 286, ':', 1),
(653, 287, 'object', 0),
(654, 287, 'this', 0),
(655, 287, 'new', 1),
(656, 287, 'create', 0),
(657, 288, 'Tổ chức mã nguồn', 1),
(658, 288, 'Khai báo biến', 0),
(659, 288, 'Định nghĩa hàm', 0),
(660, 288, 'Gán giá trị', 0),
(661, 289, 'So sánh chuỗi', 0),
(662, 289, 'Chuyển đối tượng thành chuỗi', 1),
(663, 289, 'In ra màn hình', 0),
(664, 289, 'Xóa đối tượng', 0),
(665, 290, 'catch', 1),
(666, 290, 'if', 0),
(667, 290, 'while', 0),
(668, 290, 'switch', 0),
(669, 291, '()', 0),
(670, 291, '{}', 0),
(671, 291, '[]', 1),
(672, 291, '<>', 0),
(673, 292, 'loop', 0),
(674, 292, 'if', 1),
(675, 292, 'switch', 0),
(676, 292, 'case', 0),
(677, 293, 'Không', 0),
(678, 293, 'Có', 1),
(679, 293, 'Chỉ 1 phần', 0),
(680, 293, 'Chưa xác định', 0),
(681, 294, 'Eclipse', 0),
(682, 294, 'Visual Studio', 1),
(683, 294, 'IntelliJ', 0),
(684, 294, 'Code::Blocks', 0),
(685, 295, 'init', 0),
(686, 295, 'start', 0),
(687, 295, 'constructor', 1),
(688, 295, 'Main', 0),
(689, 296, 'Console.ReadLine()', 1),
(690, 296, 'Console.Write()', 0),
(691, 296, 'Input()', 0),
(692, 296, 'Read()', 0),
(693, 297, 'Console.Out()', 0),
(694, 297, 'Console.Print()', 0),
(695, 297, 'Console.WriteLine()', 1),
(696, 297, 'Write()', 0),
(697, 298, 'static', 0),
(698, 298, 'final', 0),
(699, 298, 'sealed', 1),
(700, 298, 'readonly', 0),
(701, 299, 'bool', 1),
(702, 299, 'int', 0),
(703, 299, 'string', 0),
(704, 299, 'float', 0),
(705, 300, 'Google', 0),
(706, 300, 'Microsoft', 1),
(707, 300, 'Apple', 0),
(708, 300, 'Oracle', 0),
(709, 301, '.java', 0),
(710, 301, '.cpp', 0),
(711, 301, '.cs', 1),
(712, 301, '.c', 0),
(713, 302, '.NET', 1),
(714, 302, 'JVM', 0),
(715, 302, 'Android', 0),
(716, 302, 'Python', 0),
(717, 303, 'Khởi tạo đối tượng', 0),
(718, 303, 'Là điểm bắt đầu của chương trình', 1),
(719, 303, 'Khai báo biến', 0),
(720, 303, 'Gọi hàm', 0),
(721, 304, 'int', 1),
(722, 304, 'float', 0),
(723, 304, 'double', 0),
(724, 304, 'char', 0),
(725, 305, 'class', 1),
(726, 305, 'struct', 0),
(727, 305, 'interface', 0),
(728, 305, 'namespace', 0),
(729, 306, 'inherits', 0),
(730, 306, 'extends', 0),
(731, 306, 'base', 0),
(732, 306, ':', 1),
(733, 307, 'object', 0),
(734, 307, 'this', 0),
(735, 307, 'new', 1),
(736, 307, 'create', 0),
(737, 308, 'Tổ chức mã nguồn', 1),
(738, 308, 'Khai báo biến', 0),
(739, 308, 'Định nghĩa hàm', 0),
(740, 308, 'Gán giá trị', 0),
(741, 309, 'So sánh chuỗi', 0),
(742, 309, 'Chuyển đối tượng thành chuỗi', 1),
(743, 309, 'In ra màn hình', 0),
(744, 309, 'Xóa đối tượng', 0),
(745, 310, 'catch', 1),
(746, 310, 'if', 0),
(747, 310, 'while', 0),
(748, 310, 'switch', 0),
(749, 311, '()', 0),
(750, 311, '{}', 0),
(751, 311, '[]', 1),
(752, 311, '<>', 0),
(753, 312, 'loop', 0),
(754, 312, 'if', 1),
(755, 312, 'switch', 0),
(756, 312, 'case', 0),
(757, 313, 'Không', 0),
(758, 313, 'Có', 1),
(759, 313, 'Chỉ 1 phần', 0),
(760, 313, 'Chưa xác định', 0),
(761, 314, 'Eclipse', 0),
(762, 314, 'Visual Studio', 1),
(763, 314, 'IntelliJ', 0),
(764, 314, 'Code::Blocks', 0),
(765, 315, 'init', 0),
(766, 315, 'start', 0),
(767, 315, 'constructor', 1),
(768, 315, 'Main', 0),
(769, 316, 'Console.ReadLine()', 1),
(770, 316, 'Console.Write()', 0),
(771, 316, 'Input()', 0),
(772, 316, 'Read()', 0),
(773, 317, 'Console.Out()', 0),
(774, 317, 'Console.Print()', 0),
(775, 317, 'Console.WriteLine()', 1),
(776, 317, 'Write()', 0),
(777, 318, 'static', 0),
(778, 318, 'final', 0),
(779, 318, 'sealed', 1),
(780, 318, 'readonly', 0),
(781, 319, 'bool', 1),
(782, 319, 'int', 0),
(783, 319, 'string', 0),
(784, 319, 'float', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `question_statistics`
--

CREATE TABLE `question_statistics` (
  `question_id` bigint NOT NULL,
  `total_attempts` int DEFAULT '0',
  `correct_attempts` int DEFAULT '0',
  `difficulty_score` decimal(5,2) DEFAULT NULL,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` bigint NOT NULL,
  `subject_name` varchar(100) NOT NULL,
  `description` text,
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `subjects`
--

INSERT INTO `subjects` (`subject_id`, `subject_name`, `description`, `created_by`, `created_at`) VALUES
(2, 'điện toán đám mây', 'Môn học: điện toán đám mây', 7, '2025-10-14 14:11:52'),
(3, 'xây dựng httt', 'Môn học: xây dựng httt', 7, '2025-10-15 08:57:13');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `teacher_actions`
--

CREATE TABLE `teacher_actions` (
  `action_id` bigint NOT NULL,
  `teacher_id` bigint NOT NULL,
  `exam_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `action_type` enum('edit_score','ban_student','other') NOT NULL,
  `details` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `user_id` bigint NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('Student','Teacher','Admin') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(15) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `class_id` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `email`, `full_name`, `role`, `created_at`, `updated_at`, `phone`, `dob`, `class_id`) VALUES
(1, 'admin', '$2b$10$ZERYixpbgC0.62btiNvUn.d8fuqWQ.lPXsAgwig1ZDLatLZNK35BK', 'admin@edexis.com', 'Admin', 'Admin', '2025-10-04 09:52:29', '2025-10-15 13:44:03', NULL, NULL, NULL),
(2, 'thuan', '$2b$10$x38Qh9.jWUdcBILheUepNe1gZZrXfDd5acOfhKtZOSjgP86dyq/.u', 'maipanh35@gmail.com', 'thuan', 'Student', '2025-10-04 11:14:17', '2025-10-04 11:14:17', NULL, NULL, NULL),
(3, 'test1', '$2b$10$UH31JXVBVprjK3Ryud6E8uPnpLRj1kZKqp73l/IQ7wn4OQdFEBgYe', 'thuan@gmail.com', 'test1', 'Teacher', '2025-10-04 12:58:49', '2025-10-04 12:58:49', NULL, NULL, NULL),
(4, 'thu', '$2b$10$NdaaaYBwM3Rfj3./sVSgMODdPsYF/1IjS2iJkB9YKWdV.epa71pcG', 'th@gmail.com', 'thuan', 'Student', '2025-10-04 13:20:43', '2025-10-17 13:15:39', '0399697281', '2005-03-22', NULL),
(5, 'thao', '$2b$10$OdKcmlA0f3yIulShiJvNbu8s1MG91mITzFRkvsDj6X.iciu88n3gy', 'zxc@gmail.com', 'thao', 'Teacher', '2025-10-04 20:09:10', '2025-10-04 20:09:10', NULL, NULL, NULL),
(7, 'thao123', '$2b$10$NKbXGUGDermaTd69S7cx3O/nPmEnzGqLIuRaC9MV4rso3QuJHFSnu', 'tha@gamil.com', 'thao123', 'Teacher', '2025-10-11 16:49:53', '2025-10-11 16:49:53', NULL, NULL, NULL),
(8, 'nguyen', '$2b$10$Uh08rbrmSb9Se4VFs8pvl.eUidsaTexnVtJNDgMo3zmXv/tsMeKW.', 'ng@gmail.com', 'nguyen', 'Student', '2025-10-22 09:08:52', '2025-10-22 09:08:52', NULL, NULL, NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Chỉ mục cho bảng `anti_cheating_logs`
--
ALTER TABLE `anti_cheating_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `attempt_id` (`attempt_id`);

--
-- Chỉ mục cho bảng `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`class_id`),
  ADD UNIQUE KEY `class_code` (`class_code`),
  ADD UNIQUE KEY `join_code` (`join_code`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Chỉ mục cho bảng `class_students`
--
ALTER TABLE `class_students`
  ADD PRIMARY KEY (`class_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Chỉ mục cho bảng `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`complaint_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `exam_id` (`exam_id`);

--
-- Chỉ mục cho bảng `exams`
--
ALTER TABLE `exams`
  ADD PRIMARY KEY (`exam_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `fk_exams_class_id` (`class_id`);

--
-- Chỉ mục cho bảng `exam_attempts`
--
ALTER TABLE `exam_attempts`
  ADD PRIMARY KEY (`attempt_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_exam_student` (`exam_id`,`student_id`);

--
-- Chỉ mục cho bảng `exam_attempt_answers`
--
ALTER TABLE `exam_attempt_answers`
  ADD PRIMARY KEY (`attempt_id`,`question_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `option_id` (`option_id`),
  ADD KEY `idx_is_graded` (`is_graded`),
  ADD KEY `fk_updated_by` (`updated_by`);

--
-- Chỉ mục cho bảng `exam_classes`
--
ALTER TABLE `exam_classes`
  ADD PRIMARY KEY (`exam_id`,`class_id`),
  ADD KEY `class_id` (`class_id`);

--
-- Chỉ mục cho bảng `exam_questions`
--
ALTER TABLE `exam_questions`
  ADD PRIMARY KEY (`exam_id`,`question_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Chỉ mục cho bảng `import_logs`
--
ALTER TABLE `import_logs`
  ADD PRIMARY KEY (`import_id`),
  ADD KEY `teacher_id` (`teacher_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `import_id` (`import_id`),
  ADD KEY `idx_subject_difficulty` (`subject_id`,`difficulty`);

--
-- Chỉ mục cho bảng `question_options`
--
ALTER TABLE `question_options`
  ADD PRIMARY KEY (`option_id`),
  ADD KEY `question_id` (`question_id`);

--
-- Chỉ mục cho bảng `question_statistics`
--
ALTER TABLE `question_statistics`
  ADD PRIMARY KEY (`question_id`);

--
-- Chỉ mục cho bảng `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Chỉ mục cho bảng `teacher_actions`
--
ALTER TABLE `teacher_actions`
  ADD PRIMARY KEY (`action_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `exam_id` (`exam_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `class_id` (`class_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `anti_cheating_logs`
--
ALTER TABLE `anti_cheating_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `complaints`
--
ALTER TABLE `complaints`
  MODIFY `complaint_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `exams`
--
ALTER TABLE `exams`
  MODIFY `exam_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT cho bảng `exam_attempts`
--
ALTER TABLE `exam_attempts`
  MODIFY `attempt_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `import_logs`
--
ALTER TABLE `import_logs`
  MODIFY `import_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  MODIFY `question_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=327;

--
-- AUTO_INCREMENT cho bảng `question_options`
--
ALTER TABLE `question_options`
  MODIFY `option_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=785;

--
-- AUTO_INCREMENT cho bảng `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `teacher_actions`
--
ALTER TABLE `teacher_actions`
  MODIFY `action_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `anti_cheating_logs`
--
ALTER TABLE `anti_cheating_logs`
  ADD CONSTRAINT `anti_cheating_logs_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`attempt_id`);

--
-- Các ràng buộc cho bảng `classes`
--
ALTER TABLE `classes`
  ADD CONSTRAINT `classes_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`),
  ADD CONSTRAINT `classes_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `class_students`
--
ALTER TABLE `class_students`
  ADD CONSTRAINT `class_students_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`),
  ADD CONSTRAINT `class_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `complaints_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `complaints_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`);

--
-- Các ràng buộc cho bảng `exams`
--
ALTER TABLE `exams`
  ADD CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`),
  ADD CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_exams_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`);

--
-- Các ràng buộc cho bảng `exam_attempts`
--
ALTER TABLE `exam_attempts`
  ADD CONSTRAINT `exam_attempts_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`),
  ADD CONSTRAINT `exam_attempts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `exam_attempt_answers`
--
ALTER TABLE `exam_attempt_answers`
  ADD CONSTRAINT `exam_attempt_answers_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`attempt_id`),
  ADD CONSTRAINT `exam_attempt_answers_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`),
  ADD CONSTRAINT `exam_attempt_answers_ibfk_3` FOREIGN KEY (`option_id`) REFERENCES `question_options` (`option_id`),
  ADD CONSTRAINT `fk_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `exam_classes`
--
ALTER TABLE `exam_classes`
  ADD CONSTRAINT `exam_classes_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`),
  ADD CONSTRAINT `exam_classes_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`);

--
-- Các ràng buộc cho bảng `exam_questions`
--
ALTER TABLE `exam_questions`
  ADD CONSTRAINT `exam_questions_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`),
  ADD CONSTRAINT `exam_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`);

--
-- Các ràng buộc cho bảng `import_logs`
--
ALTER TABLE `import_logs`
  ADD CONSTRAINT `import_logs_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  ADD CONSTRAINT `question_bank_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`),
  ADD CONSTRAINT `question_bank_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `question_bank_ibfk_3` FOREIGN KEY (`import_id`) REFERENCES `import_logs` (`import_id`);

--
-- Các ràng buộc cho bảng `question_options`
--
ALTER TABLE `question_options`
  ADD CONSTRAINT `question_options_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`);

--
-- Các ràng buộc cho bảng `question_statistics`
--
ALTER TABLE `question_statistics`
  ADD CONSTRAINT `question_statistics_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`);

--
-- Các ràng buộc cho bảng `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `teacher_actions`
--
ALTER TABLE `teacher_actions`
  ADD CONSTRAINT `teacher_actions_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `teacher_actions_ibfk_2` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`exam_id`),
  ADD CONSTRAINT `teacher_actions_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
