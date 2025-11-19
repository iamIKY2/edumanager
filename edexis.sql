-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost
-- Thời gian đã tạo: Th10 19, 2025 lúc 01:14 PM
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
(3, 25, 'TabSwitch', 'Chuyển tab lần 3', '2025-10-31 18:15:18'),
(4, 35, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-07 16:11:06'),
(5, 35, 'WebcamSuspicious', 'Không thể truy cập webcam', '2025-11-07 16:11:13'),
(6, 37, 'WebcamSuspicious', 'Không thể truy cập webcam', '2025-11-14 15:05:21'),
(7, 37, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-14 15:05:27'),
(8, 38, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-14 15:13:20'),
(9, 38, 'TabSwitch', 'Chuyển tab lần 2', '2025-11-14 15:13:20'),
(10, 39, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-15 10:35:30'),
(11, 39, 'TabSwitch', 'Chuyển tab lần 2', '2025-11-15 10:35:31'),
(12, 39, 'TabSwitch', 'Chuyển tab lần 3', '2025-11-15 10:35:32'),
(13, 39, 'TabSwitch', 'Chuyển tab lần 4', '2025-11-15 10:35:33'),
(14, 39, 'CopyPaste', 'Cố gắng copy', '2025-11-15 10:35:47'),
(15, 39, 'TabSwitch', 'Chuyển tab lần 5', '2025-11-15 10:35:49'),
(16, 39, 'TabSwitch', 'Chuyển tab lần 6', '2025-11-15 10:36:04'),
(17, 39, 'TabSwitch', 'Chuyển tab lần 7', '2025-11-15 10:36:05'),
(18, 39, 'TabSwitch', 'Chuyển tab lần 8', '2025-11-15 10:36:06'),
(19, 39, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-15 10:39:23'),
(20, 39, 'TabSwitch', 'Chuyển tab lần 2', '2025-11-15 10:39:24'),
(21, 39, 'TabSwitch', 'Chuyển tab lần 3', '2025-11-15 10:39:25'),
(22, 39, 'TabSwitch', 'Chuyển tab lần 4', '2025-11-15 10:39:26'),
(23, 42, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-17 12:29:27'),
(24, 43, 'WebcamSuspicious', 'Không thể truy cập webcam', '2025-11-18 08:01:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `backup_history`
--

CREATE TABLE `backup_history` (
  `backup_id` int NOT NULL,
  `backup_file` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `backup_size` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `backup_history`
--

INSERT INTO `backup_history` (`backup_id`, `backup_file`, `backup_size`, `created_at`, `created_by`) VALUES
(1, 'backup_2025-11-17_10-02-59.json', 524040, '2025-11-17 03:02:59', 1),
(2, 'backup_2025-11-17_10-03-43.json', 524264, '2025-11-17 03:03:43', 1),
(3, 'backup_2025-11-18_08-08-54.json', 589924, '2025-11-18 01:08:54', 1);

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
  `teacher_response` text,
  `status` enum('Pending','Resolved','Rejected') DEFAULT 'Pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `complaints`
--

INSERT INTO `complaints` (`complaint_id`, `student_id`, `exam_id`, `content`, `teacher_response`, `status`, `created_at`, `updated_at`) VALUES
(1, 4, 69, 'tets khiếu nại học sinh', NULL, 'Pending', '2025-11-17 12:06:37', NULL),
(2, 4, 65, 'lỗi web cam', NULL, 'Pending', '2025-11-17 12:33:03', NULL),
(3, 4, 79, 'tets khiếu nại lần 3', 'Điểm đã được chỉnh sửa. Lý do: sửa điểm. Điểm mới: 10.0 điểm.', 'Resolved', '2025-11-17 12:42:51', '2025-11-17 05:43:35'),
(4, 4, 82, 'ngu như chó', NULL, 'Pending', '2025-11-18 08:04:42', NULL);

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
(60, 'tets10', 2, 7, 10, '2025-11-01 09:08:00', NULL, NULL, 0, 0, 0, '2025-11-01 09:06:30', 6, 'Đề thi tạo thủ công', 'upcoming'),
(63, 'test mã pin lần 3', 2, 7, 10, '2025-11-06 12:55:00', NULL, '426341', 0, 0, 0, '2025-11-06 12:54:08', 6, 'Đề thi tạo thủ công', 'upcoming'),
(65, 'test 10', 2, 7, 15, '2025-11-07 16:07:00', NULL, '776598', 0, 0, 0, '2025-11-07 16:08:01', 6, '', 'upcoming'),
(68, 'cho thằng nhân ', 2, 7, 13, '2025-11-14 15:05:00', NULL, '771244', 0, 0, 0, '2025-11-14 15:02:41', 6, '', 'upcoming'),
(69, 'test 3.6', 2, 7, 10, '2025-11-14 15:11:00', NULL, '878020', 0, 0, 0, '2025-11-14 15:10:44', 6, 'Đề thi tạo thủ công', 'upcoming'),
(74, 'điện toán đám mây - rds', 3, 7, 10, '2025-11-15 10:35:00', NULL, '133906', 0, 0, 0, '2025-11-15 10:34:49', 7, 'Đề thi được tạo tự động bằng AI - điện toán đám mây: rds', 'upcoming'),
(76, 'test lần 3', 3, 7, 3, '2025-11-16 09:22:00', NULL, '312666', 0, 0, 0, '2025-11-16 09:20:53', 7, 'Đề thi tạo thủ công', 'upcoming'),
(79, 'tets chấm điểm', 3, 7, 9, '2025-11-17 12:29:00', NULL, '939935', 0, 0, 0, '2025-11-17 12:27:30', 7, 'Đề thi tạo thủ công', 'upcoming'),
(80, 'alo', 3, 7, 1, '2025-11-17 01:00:00', NULL, '912238', 0, 0, 0, '2025-11-17 12:49:10', 7, 'Đề thi tạo thủ công', 'upcoming'),
(82, 'nhập môn khai thác dữ liệu - thuật toán cart', 3, 7, 14, '2025-11-18 08:00:00', NULL, '400216', 0, 0, 0, '2025-11-18 07:56:29', 7, 'Đề thi được tạo tự động bằng AI - nhập môn khai thác dữ liệu: thuật toán cart', 'upcoming');

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
  `cheating_detected` tinyint(1) DEFAULT '0',
  `penalty_reason` text COMMENT 'Lý do trừ điểm (ví dụ: chuyển tab quá 3 lần)',
  `penalty_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Số điểm bị trừ'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `exam_attempts`
--

INSERT INTO `exam_attempts` (`attempt_id`, `exam_id`, `student_id`, `start_time`, `end_time`, `score`, `status`, `is_fully_graded`, `created_at`, `is_banned`, `penalty_points`, `cheating_detected`, `penalty_reason`, `penalty_amount`) VALUES
(17, 37, 4, '2025-10-20 21:29:08', '2025-10-20 21:40:37', 3.00, 'Submitted', 0, '2025-10-20 21:29:08', 0, 0.00, 0, NULL, 0.00),
(18, 38, 4, '2025-10-26 11:16:11', '2025-10-26 11:17:42', 8.00, 'Submitted', 0, '2025-10-26 11:16:11', 0, 0.00, 0, NULL, 0.00),
(19, 49, 4, '2025-10-27 09:15:15', '2025-10-27 09:15:25', 9.50, 'Submitted', 1, '2025-10-27 09:15:15', 0, 0.00, 0, NULL, 0.00),
(25, 54, 4, '2025-10-31 18:15:15', '2025-10-31 18:15:28', 10.00, 'Submitted', 1, '2025-10-31 18:15:15', 0, 0.00, 1, NULL, 0.00),
(33, 60, 4, '2025-11-01 09:08:14', '2025-11-01 09:08:18', 10.00, 'Submitted', 1, '2025-11-01 09:08:14', 0, 0.00, 0, NULL, 0.00),
(34, 63, 4, '2025-11-06 12:55:24', '2025-11-06 12:55:36', 10.00, 'Submitted', 1, '2025-11-06 12:55:24', 0, 0.00, 0, NULL, 0.00),
(35, 65, 4, '2025-11-07 16:10:57', '2025-11-07 16:11:19', 0.00, 'Submitted', 1, '2025-11-07 16:10:57', 0, 0.00, 1, NULL, 0.00),
(37, 68, 4, '2025-11-14 15:05:08', '2025-11-14 15:07:58', 3.00, 'Submitted', 1, '2025-11-14 15:05:08', 0, 0.00, 1, NULL, 0.00),
(38, 69, 4, '2025-11-14 15:11:19', '2025-11-14 15:13:08', 8.00, 'Submitted', 1, '2025-11-14 15:11:19', 0, 0.00, 1, NULL, 0.00),
(39, 74, 4, '2025-11-15 10:35:23', '2025-11-15 10:39:30', 9.00, 'Submitted', 1, '2025-11-15 10:35:23', 0, 0.00, 1, 'Bị trừ 1 điểm (10% điểm trắc nghiệm) do chuyển tab 12 lần (vượt quá giới hạn 3 lần)', 1.00),
(41, 76, 4, '2025-11-16 09:22:18', '2025-11-16 09:22:25', 10.00, 'Submitted', 1, '2025-11-16 09:22:18', 0, 0.00, 0, NULL, 0.00),
(42, 79, 4, '2025-11-17 12:29:18', '2025-11-17 12:29:25', 10.00, 'Submitted', 1, '2025-11-17 12:29:18', 0, 0.00, 1, NULL, 0.00),
(43, 82, 4, '2025-11-18 08:00:58', '2025-11-18 08:03:35', 4.00, 'Submitted', 1, '2025-11-18 08:00:58', 0, 0.00, 1, NULL, 0.00);

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
(33, 326, NULL, 'qqqq', 0, 10.00, '1', 1, '2025-11-01 09:08:18', 7, '2025-11-17 12:38:11'),
(34, 329, NULL, 'hello', 0, 10.00, 'tốt', 1, '2025-11-06 12:55:36', 7, '2025-11-06 12:55:51'),
(38, 410, NULL, NULL, NULL, 8.00, '', 1, '2025-11-17 12:22:46', 7, '2025-11-17 12:22:46'),
(39, 437, 1125, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 438, 1130, NULL, 1, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 439, 1133, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 440, 1137, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 441, 1141, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(41, 443, NULL, 'oke', 0, 10.00, 'tốt', 1, '2025-11-16 09:22:25', 7, '2025-11-16 09:22:47'),
(43, 449, 1147, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 450, 1149, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 451, 1155, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 452, 1159, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 453, 1163, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 454, 1168, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 455, 1171, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 456, 1173, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 457, 1180, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 458, 1182, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 459, 1187, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 460, 1189, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 461, 1193, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 462, 1200, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 463, 1202, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 464, 1208, NULL, 0, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 465, 1212, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 466, 1214, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 467, 1219, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(43, 468, 1222, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL);

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
(60, 326, 1, 10.00),
(63, 329, 1, 10.00),
(65, 350, 1, 0.50),
(65, 351, 2, 0.50),
(65, 352, 3, 0.50),
(65, 353, 4, 0.50),
(65, 354, 5, 0.50),
(65, 355, 6, 0.50),
(65, 356, 7, 0.50),
(65, 357, 8, 0.50),
(65, 358, 9, 0.50),
(65, 359, 10, 0.50),
(65, 360, 11, 0.50),
(65, 361, 12, 0.50),
(65, 362, 13, 0.50),
(65, 363, 14, 0.50),
(65, 364, 15, 0.50),
(65, 365, 16, 0.50),
(65, 366, 17, 0.50),
(65, 367, 18, 0.50),
(65, 368, 19, 0.50),
(65, 369, 20, 0.50),
(68, 390, 1, 0.50),
(68, 391, 2, 0.50),
(68, 392, 3, 0.50),
(68, 393, 4, 0.50),
(68, 394, 5, 0.50),
(68, 395, 6, 0.50),
(68, 396, 7, 0.50),
(68, 397, 8, 0.50),
(68, 398, 9, 0.50),
(68, 399, 10, 0.50),
(68, 400, 11, 0.50),
(68, 401, 12, 0.50),
(68, 402, 13, 0.50),
(68, 403, 14, 0.50),
(68, 404, 15, 0.50),
(68, 405, 16, 0.50),
(68, 406, 17, 0.50),
(68, 407, 18, 0.50),
(68, 408, 19, 0.50),
(68, 409, 20, 0.50),
(69, 410, 1, 10.00),
(74, 437, 1, 10.00),
(74, 438, 2, 10.00),
(74, 439, 3, 10.00),
(74, 440, 4, 10.00),
(74, 441, 5, 10.00),
(76, 443, 1, 10.00),
(79, 446, 1, 10.00),
(80, 447, 1, 10.00),
(82, 449, 1, 0.50),
(82, 450, 2, 0.50),
(82, 451, 3, 0.50),
(82, 452, 4, 0.50),
(82, 453, 5, 0.50),
(82, 454, 6, 0.50),
(82, 455, 7, 0.50),
(82, 456, 8, 0.50),
(82, 457, 9, 0.50),
(82, 458, 10, 0.50),
(82, 459, 11, 0.50),
(82, 460, 12, 0.50),
(82, 461, 13, 0.50),
(82, 462, 14, 0.50),
(82, 463, 15, 0.50),
(82, 464, 16, 0.50),
(82, 465, 17, 0.50),
(82, 466, 18, 0.50),
(82, 467, 19, 0.50),
(82, 468, 20, 0.50);

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
  `related_type` varchar(50) DEFAULT NULL COMMENT 'Loại đối tượng liên quan (Class, Exam, Msg, etc.)'
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
(9, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:34:07', 1, 'Exam'),
(10, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:34:15', 2, 'Exam'),
(11, 7, 'Bài thi \"lab3\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:37:31', 3, 'Exam'),
(12, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:44:31', 4, 'Exam'),
(13, 7, 'Bài thi \"lab4\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:47:38', 5, 'Exam'),
(14, 7, 'Bài thi \"lab5\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:49:13', 6, 'Exam'),
(15, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 14:50:09', 7, 'Exam'),
(16, 7, 'Bài thi \"lab10\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:06:03', 8, 'Exam'),
(17, 7, 'Bài thi \"lab7\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:08:00', 9, 'Exam'),
(18, 7, 'Bài thi \"lab7\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:09:26', 10, 'Exam'),
(19, 7, 'Bài thi \"lab31\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:10:32', 11, 'Exam'),
(20, 7, 'Bài thi \"lab21\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:12:09', 12, 'Exam'),
(21, 7, 'Bài thi \"abc\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-10-17 15:13:43', 13, 'Exam'),
(22, 7, 'Bài thi \"12\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:16:42', 14, 'Exam'),
(23, 7, 'Bài thi \"lan1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:21:19', 15, 'Exam'),
(24, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 15:26:13', 16, 'Exam'),
(25, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 21:37:20', 17, 'Exam'),
(26, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-17 21:40:03', 18, 'Exam'),
(27, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-18 09:37:25', 19, 'Exam'),
(28, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-18 09:39:17', 20, 'Exam'),
(29, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-18 09:39:49', 21, 'Exam'),
(30, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-18 09:43:12', 22, 'Exam'),
(31, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-18 14:53:11', 23, 'Exam'),
(32, 7, 'Bài thi \"Bài thi từ Excel - 21:42:58 19/10/2025\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 21:42:58', 24, 'Exam'),
(33, 7, 'Đã nhập 20 câu hỏi vào bài thi \"Bài thi từ Excel - 21:42:58 19/10/2025\"', 'Info', 1, '2025-10-19 21:42:58', 24, 'Exam'),
(34, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 21:46:46', 25, 'Exam'),
(35, 7, 'Bài thi \"Bài thi từ Excel - 21:49:05 19/10/2025\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 21:49:05', 26, 'Exam'),
(36, 7, 'Đã nhập 20 câu hỏi vào bài thi \"Bài thi từ Excel - 21:49:05 19/10/2025\"', 'Info', 1, '2025-10-19 21:49:05', 26, 'Exam'),
(37, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 21:51:36', 27, 'Exam'),
(38, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab1\"', 'Info', 1, '2025-10-19 21:52:10', 27, 'Exam'),
(39, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 21:57:48', 28, 'Exam'),
(40, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab2\"', 'Info', 1, '2025-10-19 21:58:01', 28, 'Exam'),
(41, 7, 'Bài thi \"lab3\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 22:09:42', 29, 'Exam'),
(42, 7, 'Bài thi \"lab3\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-19 22:09:42', 30, 'Exam'),
(43, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab3\"', 'Info', 1, '2025-10-19 22:09:57', 29, 'Exam'),
(44, 7, 'Bài thi \"cấu trúc máy tính \" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 09:11:29', 31, 'Exam'),
(45, 7, 'Đã nhập 20 câu hỏi vào bài thi \"cấu trúc máy tính \"', 'Info', 1, '2025-10-20 09:11:41', 31, 'Exam'),
(46, 7, 'Bài thi \"lab4\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 09:31:47', 32, 'Exam'),
(47, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab4\"', 'Info', 1, '2025-10-20 09:31:58', 32, 'Exam'),
(48, 7, 'Bài thi \"lab6\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 09:53:58', 33, 'Exam'),
(49, 7, 'Đã nhập 19 câu hỏi vào bài thi \"lab6\"', 'Info', 1, '2025-10-20 09:54:14', 33, 'Exam'),
(50, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 15:00:28', 34, 'Exam'),
(51, 7, 'Đã nhập 19 câu hỏi vào bài thi \"lab9\"', 'Info', 1, '2025-10-20 15:00:49', 34, 'Exam'),
(52, 7, 'Bài thi \"lab10\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 15:27:20', 35, 'Exam'),
(53, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab10\"', 'Info', 1, '2025-10-20 15:27:37', 35, 'Exam'),
(54, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 20:17:23', 36, 'Exam'),
(55, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab1\"', 'Info', 1, '2025-10-20 20:17:37', 36, 'Exam'),
(56, 7, 'Bài thi \"lab2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-20 21:24:08', 37, 'Exam'),
(57, 7, 'Đã nhập 19 câu hỏi vào bài thi \"lab2\"', 'Info', 1, '2025-10-20 21:24:20', 37, 'Exam'),
(58, 7, 'Học sinh nguyen đã tham gia lớp 26th03', 'Info', 1, '2025-10-22 09:09:58', 6, 'Class'),
(59, 7, 'Bài thi \"giữa kỳ\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-26 11:07:22', 38, 'Exam'),
(60, 7, 'Đã nhập 20 câu hỏi vào bài thi \"giữa kỳ\"', 'Info', 1, '2025-10-26 11:07:34', 38, 'Exam'),
(61, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-26 17:10:51', 39, 'Exam'),
(62, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-26 17:11:16', 40, 'Exam'),
(63, 7, 'Bài thi \"lab10\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 08:38:28', 41, 'Exam'),
(64, 7, 'Bài thi \"lab4\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 08:52:53', 42, 'Exam'),
(65, 7, 'Bài thi \"lab5\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 08:56:15', 43, 'Exam'),
(66, 7, 'Bài thi \"lab6\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 08:57:42', 44, 'Exam'),
(67, 7, 'Bài thi \"lab8\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 09:01:04', 45, 'Exam'),
(68, 7, 'Bài thi \"lab9\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 09:03:46', 46, 'Exam'),
(69, 7, 'Bài thi \"lab1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 09:10:15', 47, 'Exam'),
(70, 7, 'Bài thi \"lab21\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 09:12:24', 48, 'Exam'),
(71, 7, 'Bài thi \"kiem tra\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-27 09:14:03', 49, 'Exam'),
(72, 7, 'Đã thêm câu hỏi mới: \"tên của e...\"', 'Info', 1, '2025-10-27 09:14:03', 258, 'Question'),
(73, 7, 'Bài thi \"lab0\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-28 07:02:49', 50, 'Exam'),
(74, 7, 'Đã nhập 20 câu hỏi vào bài thi \"lab0\"', 'Info', 1, '2025-10-28 07:03:32', 50, 'Exam'),
(75, 7, 'Bài thi \"tets1\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-28 19:00:59', 51, 'Exam'),
(76, 7, 'Đã thêm câu hỏi mới: \"điện toán đám mây là gì...\"', 'Info', 1, '2025-10-28 19:00:59', 279, 'Question'),
(77, 7, 'Bài thi \"kiem tra lan2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-31 15:29:31', 52, 'Exam'),
(78, 7, 'Đã nhập 20 câu hỏi vào bài thi \"kiem tra lan2\"', 'Info', 1, '2025-10-31 15:29:49', 52, 'Exam'),
(79, 7, 'Bài thi \"kiem tra lan3\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-31 15:41:22', 53, 'Exam'),
(80, 7, 'Đã nhập 20 câu hỏi vào bài thi \"kiem tra lan3\"', 'Info', 1, '2025-10-31 15:41:58', 53, 'Exam'),
(81, 7, 'Bài thi \"test4\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-10-31 18:13:54', 54, 'Exam'),
(82, 7, 'Đã thêm câu hỏi mới: \"trong mysql việc sử dụng tiếng việt có dấu thì dùn...\"', 'Info', 1, '2025-10-31 18:13:54', 320, 'Question'),
(83, 7, 'Bài thi \"test4\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-01 08:02:47', 55, 'Exam'),
(84, 7, 'Đã thêm câu hỏi mới: \"kiểu dữ liệu số trong js là gì...\"', 'Info', 1, '2025-11-01 08:02:47', 321, 'Question'),
(85, 7, 'Bài thi \"test 6\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-01 08:11:59', 56, 'Exam'),
(86, 7, 'Đã thêm câu hỏi mới: \"ngôn ngữ nào lập trình hướng đối tượng...\"', 'Info', 1, '2025-11-01 08:11:59', 322, 'Question'),
(87, 7, 'Bài thi \"test 7\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-01 08:18:56', 57, 'Exam'),
(88, 7, 'Đã thêm câu hỏi mới: \"test 1...\"', 'Info', 1, '2025-11-01 08:18:56', 323, 'Question'),
(89, 7, 'Bài thi \"test noti\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-01 08:43:51', 58, 'Exam'),
(90, 7, 'Đã thêm câu hỏi mới: \"qqqq...\"', 'Info', 1, '2025-11-01 08:43:51', 324, 'Question'),
(91, 7, 'Bài thi \"test 9\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-01 08:53:53', 59, 'Exam'),
(92, 7, 'Đã thêm câu hỏi mới: \"qqqq...\"', 'Info', 1, '2025-11-01 08:53:53', 325, 'Question'),
(93, 7, 'Bài thi \"tets10\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-01 09:06:30', 60, 'Exam'),
(94, 7, 'Đã thêm câu hỏi mới: \"1111...\"', 'Info', 1, '2025-11-01 09:06:30', 326, 'Question'),
(95, 4, 'Bài thi \"tets10\" của bạn đã được chấm điểm. Điểm số: 1.0 điểm', 'Info', 1, '2025-11-01 09:08:46', 60, 'Exam'),
(96, 7, 'Bài thi \"test mã pin\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-06 12:47:26', 61, 'Exam'),
(97, 7, 'Đã thêm câu hỏi mới: \"hello...\"', 'Info', 1, '2025-11-06 12:47:26', 327, 'Question'),
(98, 7, 'Bài thi \"test mã pin lần 2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-06 12:49:11', 62, 'Exam'),
(99, 7, 'Đã thêm câu hỏi mới: \"heloo...\"', 'Info', 1, '2025-11-06 12:49:11', 328, 'Question'),
(100, 7, 'Bài thi \"test mã pin lần 3\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-06 12:54:08', 63, 'Exam'),
(101, 7, 'Đã thêm câu hỏi mới: \"hello...\"', 'Info', 1, '2025-11-06 12:54:08', 329, 'Question'),
(102, 4, 'Bài thi \"test mã pin lần 3\" của bạn đã được chấm điểm. Điểm số: 10.0 điểm', 'Info', 1, '2025-11-06 12:55:51', 63, 'Exam'),
(103, 7, 'Bài thi \"Bài thi từ Excel - 15:59:52 7/11/2025\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-07 15:59:52', 64, 'Exam'),
(104, 7, 'Đã nhập 20 câu hỏi vào bài thi \"Bài thi từ Excel - 15:59:52 7/11/2025\"', 'Info', 1, '2025-11-07 15:59:52', 64, 'Exam'),
(105, 7, 'Bài thi \"test 10\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-07 16:08:01', 65, 'Exam'),
(106, 7, 'Đã nhập 20 câu hỏi vào bài thi \"test 10\"', 'Info', 1, '2025-11-07 16:08:17', 65, 'Exam'),
(107, 7, 'Bài thi \"test 36\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-11 09:20:56', 66, 'Exam'),
(108, 7, 'Đã nhập 20 câu hỏi vào bài thi \"test 36\"', 'Info', 1, '2025-11-11 09:21:12', 66, 'Exam'),
(109, 7, 'Bài thi \"đasa\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-13 18:37:48', 67, 'Exam'),
(110, 7, 'Bài thi \"cho thằng nhân \" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-14 15:02:41', 68, 'Exam'),
(111, 7, 'Đã nhập 20 câu hỏi vào bài thi \"cho thằng nhân \"', 'Info', 1, '2025-11-14 15:03:01', 68, 'Exam'),
(112, 7, 'Bài thi \"test 3.6\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-14 15:10:44', 69, 'Exam'),
(113, 7, 'Đã thêm câu hỏi mới: \"thầy nhân dạy tiếng nhật ở trường đại học bình dươ...\"', 'Info', 1, '2025-11-14 15:10:44', 410, 'Question'),
(114, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 4.0 điểm', 'Info', 1, '2025-11-14 15:14:21', 69, 'Exam'),
(115, 7, 'Bài thi \"điện toán đám mây - các câu hỏi về vpc ec2\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-15 09:44:49', 70, 'Exam'),
(116, 7, 'Đã thêm câu hỏi mới: \"Trình bày khái niệm Amazon Virtual Private Cloud (...\"', 'Info', 1, '2025-11-15 09:44:49', 411, 'Question'),
(117, 7, 'Đã thêm câu hỏi mới: \"Phân biệt sự khác nhau cơ bản giữa Public Subnet v...\"', 'Info', 1, '2025-11-15 09:44:49', 412, 'Question'),
(118, 7, 'Đã thêm câu hỏi mới: \"So sánh và phân biệt các cơ chế bảo mật Security G...\"', 'Info', 1, '2025-11-15 09:44:49', 413, 'Question'),
(119, 7, 'Đã thêm câu hỏi mới: \"Giải thích khái niệm Elastic IP Address (EIP) tron...\"', 'Info', 1, '2025-11-15 09:44:49', 414, 'Question'),
(120, 7, 'Đã thêm câu hỏi mới: \"Mô tả vai trò và chức năng của Internet Gateway (I...\"', 'Info', 1, '2025-11-15 09:44:49', 415, 'Question'),
(121, 7, 'Đã thêm câu hỏi mới: \"Giải thích mục đích của Route Table (Bảng định tuy...\"', 'Info', 1, '2025-11-15 09:44:49', 416, 'Question'),
(122, 7, 'Đã thêm câu hỏi mới: \"Giải thích tại sao cần có NAT Gateway hoặc NAT Ins...\"', 'Info', 1, '2025-11-15 09:44:49', 417, 'Question'),
(123, 7, 'Đã thêm câu hỏi mới: \"Mô tả VPC Peering. Trong những tình huống nào bạn ...\"', 'Info', 1, '2025-11-15 09:44:49', 418, 'Question'),
(124, 7, 'Đã thêm câu hỏi mới: \"Khi triển khai các phiên bản EC2, hãy trình bày cá...\"', 'Info', 1, '2025-11-15 09:44:49', 419, 'Question'),
(125, 7, 'Đã thêm câu hỏi mới: \"Giải thích mục đích và sự khác biệt cơ bản giữa AW...\"', 'Info', 1, '2025-11-15 09:44:49', 420, 'Question'),
(126, 7, 'Bài thi \"điện toán đám mây - các câu hỏi về vpc ec2\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-15 09:44:59', 71, 'Exam'),
(127, 7, 'Đã thêm câu hỏi mới: \"Trình bày khái niệm Amazon Virtual Private Cloud (...\"', 'Info', 1, '2025-11-15 09:44:59', 421, 'Question'),
(128, 7, 'Đã thêm câu hỏi mới: \"Phân biệt sự khác nhau cơ bản giữa Public Subnet v...\"', 'Info', 1, '2025-11-15 09:44:59', 422, 'Question'),
(129, 7, 'Đã thêm câu hỏi mới: \"So sánh và phân biệt các cơ chế bảo mật Security G...\"', 'Info', 1, '2025-11-15 09:44:59', 423, 'Question'),
(130, 7, 'Đã thêm câu hỏi mới: \"Giải thích khái niệm Elastic IP Address (EIP) tron...\"', 'Info', 1, '2025-11-15 09:44:59', 424, 'Question'),
(131, 7, 'Đã thêm câu hỏi mới: \"Mô tả vai trò và chức năng của Internet Gateway (I...\"', 'Info', 1, '2025-11-15 09:44:59', 425, 'Question'),
(132, 7, 'Đã thêm câu hỏi mới: \"Giải thích mục đích của Route Table (Bảng định tuy...\"', 'Info', 1, '2025-11-15 09:44:59', 426, 'Question'),
(133, 7, 'Đã thêm câu hỏi mới: \"Giải thích tại sao cần có NAT Gateway hoặc NAT Ins...\"', 'Info', 1, '2025-11-15 09:44:59', 427, 'Question'),
(134, 7, 'Đã thêm câu hỏi mới: \"Mô tả VPC Peering. Trong những tình huống nào bạn ...\"', 'Info', 1, '2025-11-15 09:44:59', 428, 'Question'),
(135, 7, 'Đã thêm câu hỏi mới: \"Khi triển khai các phiên bản EC2, hãy trình bày cá...\"', 'Info', 1, '2025-11-15 09:45:00', 429, 'Question'),
(136, 7, 'Đã thêm câu hỏi mới: \"Giải thích mục đích và sự khác biệt cơ bản giữa AW...\"', 'Info', 1, '2025-11-15 09:45:00', 430, 'Question'),
(137, 7, 'Bài thi \"điện toán đám mây - vpc ec2\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-15 09:51:38', 72, 'Exam'),
(138, 7, 'Đã thêm câu hỏi mới: \"Trong AWS VPC, thành phần nào chịu trách nhiệm chí...\"', 'Info', 1, '2025-11-15 09:51:38', 431, 'Question'),
(139, 7, 'Đã thêm câu hỏi mới: \"Một EC2 instance được triển khai trong một private...\"', 'Info', 1, '2025-11-15 09:51:38', 432, 'Question'),
(140, 7, 'Đã thêm câu hỏi mới: \"Điểm khác biệt quan trọng nào sau đây là *chính xá...\"', 'Info', 1, '2025-11-15 09:51:38', 433, 'Question'),
(141, 7, 'Đã thêm câu hỏi mới: \"Để một EC2 instance trong public subnet có thể nhậ...\"', 'Info', 1, '2025-11-15 09:51:38', 434, 'Question'),
(142, 7, 'Đã thêm câu hỏi mới: \"Một EC2 instance có cả địa chỉ IP riêng (private I...\"', 'Info', 1, '2025-11-15 09:51:38', 435, 'Question'),
(143, 7, 'Bài thi \"test cheatting\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-15 10:32:12', 73, 'Exam'),
(144, 7, 'Đã thêm câu hỏi mới: \"hello...\"', 'Info', 1, '2025-11-15 10:32:12', 436, 'Question'),
(145, 7, 'Bài thi \"điện toán đám mây - rds\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-15 10:34:49', 74, 'Exam'),
(146, 7, 'Đã thêm câu hỏi mới: \"Một ứng dụng yêu cầu tính sẵn sàng cao cho cơ sở d...\"', 'Info', 1, '2025-11-15 10:34:49', 437, 'Question'),
(147, 7, 'Đã thêm câu hỏi mới: \"So với việc tự quản lý một cơ sở dữ liệu quan hệ t...\"', 'Info', 1, '2025-11-15 10:34:49', 438, 'Question'),
(148, 7, 'Đã thêm câu hỏi mới: \"Một ứng dụng web đang gặp phải tình trạng nghẽn cổ...\"', 'Info', 1, '2025-11-15 10:34:49', 439, 'Question'),
(149, 7, 'Đã thêm câu hỏi mới: \"Để kiểm soát quyền truy cập mạng vào một phiên bản...\"', 'Info', 1, '2025-11-15 10:34:49', 440, 'Question'),
(150, 7, 'Đã thêm câu hỏi mới: \"Loại lưu trữ Amazon RDS nào thường được khuyến ngh...\"', 'Info', 1, '2025-11-15 10:34:49', 441, 'Question'),
(151, 7, 'Bài thi \"test chấm bài thi\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-16 09:03:28', 75, 'Exam'),
(152, 7, 'Đã thêm câu hỏi mới: \"tets...\"', 'Info', 1, '2025-11-16 09:03:28', 442, 'Question'),
(153, 7, 'Bài thi \"test lần 3\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-16 09:20:53', 76, 'Exam'),
(154, 7, 'Đã thêm câu hỏi mới: \"test...\"', 'Info', 1, '2025-11-16 09:20:53', 443, 'Question'),
(155, 4, 'Bài thi \"test lần 3\" của bạn đã được chấm điểm. Điểm số: 10.0 điểm', 'Info', 1, '2025-11-16 09:22:47', 76, 'Exam'),
(156, 4, 'tets noti \n\ntets noti', 'Info', 1, '2025-11-17 10:41:10', NULL, NULL),
(157, 8, 'tets noti \n\ntets noti', 'Info', 0, '2025-11-17 10:41:10', NULL, NULL),
(158, 4, 'tets noti lần 2\n\ntets noti lần 2', 'Info', 1, '2025-11-17 10:42:36', NULL, NULL),
(159, 7, 'Học sinh thuan đã gửi khiếu nại về bài thi \"test 3.6\" (Lớp 26th03)', 'Warning', 1, '2025-11-17 12:06:37', 1, 'Comp'),
(160, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 0.0 điểm', 'Info', 1, '2025-11-17 12:07:40', 69, 'Exam'),
(161, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 0.0 điểm', 'Info', 1, '2025-11-17 12:08:28', 69, 'Exam'),
(162, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 0.0 điểm', 'Info', 1, '2025-11-17 12:12:48', 69, 'Exam'),
(163, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 0.0 điểm', 'Info', 1, '2025-11-17 12:13:09', 69, 'Exam'),
(164, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 0.0 điểm', 'Info', 1, '2025-11-17 12:19:03', 69, 'Exam'),
(165, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 0.0 điểm', 'Info', 1, '2025-11-17 12:20:20', 69, 'Exam'),
(166, 4, 'Bài thi \"test 3.6\" của bạn đã được chấm điểm. Điểm số: 8.0 điểm', 'Info', 1, '2025-11-17 12:22:46', 69, 'Exam'),
(167, 7, 'Bài thi \"tets chấm điểm\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-17 12:24:44', 77, 'Exam'),
(168, 7, 'Đã thêm câu hỏi mới: \"hello...\"', 'Info', 1, '2025-11-17 12:24:44', 444, 'Question'),
(169, 7, 'Bài thi \"tets lần 12\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-17 12:25:55', 78, 'Exam'),
(170, 7, 'Đã thêm câu hỏi mới: \"....\"', 'Info', 1, '2025-11-17 12:25:55', 445, 'Question'),
(171, 7, 'Bài thi \"tets chấm điểm\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-17 12:27:30', 79, 'Exam'),
(172, 7, 'Đã thêm câu hỏi mới: \"....\"', 'Info', 1, '2025-11-17 12:27:30', 446, 'Question'),
(173, 4, 'Bài thi \"tets chấm điểm\" của bạn đã được chấm điểm. Điểm số: 10.0 điểm', 'Info', 1, '2025-11-17 12:29:54', 79, 'Exam'),
(174, 7, 'Học sinh thuan đã gửi khiếu nại về bài thi \"test 10\" (Lớp 26th03)', 'Warning', 1, '2025-11-17 12:33:03', 2, 'Comp'),
(175, 4, 'Bài thi \"tets10\" của bạn đã được chấm điểm. Điểm số: 10.0 điểm', 'Info', 1, '2025-11-17 12:38:11', 60, 'Exam'),
(176, 4, 'Bài thi \"tets chấm điểm\" của bạn đã được chấm điểm. Điểm số: 9.0 điểm', 'Info', 1, '2025-11-17 12:41:01', 79, 'Exam'),
(177, 7, 'Học sinh thuan đã gửi khiếu nại về bài thi \"tets chấm điểm\" (Lớp 26th02)', 'Warning', 1, '2025-11-17 12:42:51', 3, 'Comp'),
(178, 4, 'Bài thi \"tets chấm điểm\" của bạn đã được chấm điểm. Điểm số: 10.0 điểm', 'Info', 1, '2025-11-17 12:43:35', 79, 'Exam'),
(179, 7, 'Bài thi \"alo\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-17 12:49:10', 80, 'Exam'),
(180, 7, 'Đã thêm câu hỏi mới: \"....\"', 'Info', 1, '2025-11-17 12:49:10', 447, 'Question'),
(181, 7, 'Bài thi \"alo alo\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-17 12:50:23', 81, 'Exam'),
(182, 7, 'Đã thêm câu hỏi mới: \"test 1...\"', 'Info', 1, '2025-11-17 12:50:23', 448, 'Question'),
(183, 7, 'Bài thi \"nhập môn khai thác dữ liệu - thuật toán cart\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-18 07:56:29', 82, 'Exam'),
(184, 7, 'Đã thêm câu hỏi mới: \"Thuật toán CART viết tắt của cụm từ nào?...\"', 'Info', 1, '2025-11-18 07:56:30', 449, 'Question'),
(185, 7, 'Đã thêm câu hỏi mới: \"Thuật toán CART được sử dụng cho những loại bài to...\"', 'Info', 1, '2025-11-18 07:56:30', 450, 'Question'),
(186, 7, 'Đã thêm câu hỏi mới: \"Tiêu chí nào sau đây thường được sử dụng để đánh g...\"', 'Info', 1, '2025-11-18 07:56:30', 451, 'Question'),
(187, 7, 'Đã thêm câu hỏi mới: \"Khi xây dựng cây CART cho bài toán hồi quy, tiêu c...\"', 'Info', 1, '2025-11-18 07:56:30', 452, 'Question'),
(188, 7, 'Đã thêm câu hỏi mới: \"Mục tiêu chính của thuật toán CART khi tìm một điể...\"', 'Info', 1, '2025-11-18 07:56:30', 453, 'Question'),
(189, 7, 'Đã thêm câu hỏi mới: \"Quá trình \"tỉa cây\" (pruning) trong thuật toán CAR...\"', 'Info', 1, '2025-11-18 07:56:30', 454, 'Question'),
(190, 7, 'Đã thêm câu hỏi mới: \"Điều gì xảy ra nếu một cây CART được huấn luyện qu...\"', 'Info', 1, '2025-11-18 07:56:30', 455, 'Question'),
(191, 7, 'Đã thêm câu hỏi mới: \"Một nút lá (leaf node) trong cây quyết định CART đ...\"', 'Info', 1, '2025-11-18 07:56:30', 456, 'Question'),
(192, 7, 'Đã thêm câu hỏi mới: \"Khi xử lý các biến liên tục trong CART, thuật toán...\"', 'Info', 1, '2025-11-18 07:56:30', 457, 'Question'),
(193, 7, 'Đã thêm câu hỏi mới: \"Ưu điểm chính của cây quyết định CART so với một s...\"', 'Info', 1, '2025-11-18 07:56:30', 458, 'Question'),
(194, 7, 'Đã thêm câu hỏi mới: \"Nhược điểm nào sau đây thường gặp ở cây quyết định...\"', 'Info', 1, '2025-11-18 07:56:30', 459, 'Question'),
(195, 7, 'Đã thêm câu hỏi mới: \"Sự khác biệt cơ bản giữa tỉa cây trước (pre-prunin...\"', 'Info', 1, '2025-11-18 07:56:30', 460, 'Question'),
(196, 7, 'Đã thêm câu hỏi mới: \"Chỉ số Gini Impurity được tính như thế nào cho một...\"', 'Info', 1, '2025-11-18 07:56:30', 461, 'Question'),
(197, 7, 'Đã thêm câu hỏi mới: \"Đối với một bài toán phân lớp nhị phân, nếu một nú...\"', 'Info', 1, '2025-11-18 07:56:30', 462, 'Question'),
(198, 7, 'Đã thêm câu hỏi mới: \"Khi chọn một đặc trưng để phân tách tại một nút, C...\"', 'Info', 1, '2025-11-18 07:56:30', 463, 'Question'),
(199, 7, 'Đã thêm câu hỏi mới: \"Thuật toán CART xử lý các biến phân loại (categori...\"', 'Info', 1, '2025-11-18 07:56:30', 464, 'Question'),
(200, 7, 'Đã thêm câu hỏi mới: \"Điều nào sau đây KHÔNG phải là một tiêu chí dừng p...\"', 'Info', 1, '2025-11-18 07:56:30', 465, 'Question'),
(201, 7, 'Đã thêm câu hỏi mới: \"Trong ngữ cảnh của cây CART, \"tầm quan trọng của đ...\"', 'Info', 1, '2025-11-18 07:56:30', 466, 'Question'),
(202, 7, 'Đã thêm câu hỏi mới: \"Khi nào thì một cây quyết định CART được coi là \"q...\"', 'Info', 1, '2025-11-18 07:56:30', 467, 'Question'),
(203, 7, 'Đã thêm câu hỏi mới: \"Giả sử một cây CART đã được huấn luyện. Để đưa ra ...\"', 'Info', 1, '2025-11-18 07:56:30', 468, 'Question'),
(204, 7, 'Học sinh thuan đã gửi khiếu nại về bài thi \"nhập môn khai thác dữ liệu - thuật toán cart\" (Lớp 26th02)', 'Warning', 1, '2025-11-18 08:04:42', 4, 'Comp');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `otps`
--

CREATE TABLE `otps` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `verified` tinyint(1) NOT NULL DEFAULT '0',
  `attempts` int NOT NULL DEFAULT '0',
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `otps`
--

INSERT INTO `otps` (`id`, `email`, `otp`, `expiresAt`, `verified`, `attempts`, `createdAt`, `updatedAt`) VALUES
('43d6e144-da4c-4125-a722-f0edb6873cc1', 'maipanh35@gmail.com', '592349', '2025-11-18 07:12:05', 0, 0, '2025-11-18 07:07:05', '2025-11-18 07:07:05');

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
(326, NULL, 7, '1111', 'FillInBlank', 'Easy', '111', NULL, '2025-11-01 09:06:30', '2025-11-01 09:06:30'),
(327, NULL, 7, 'hello', 'FillInBlank', 'Easy', '.', NULL, '2025-11-06 12:47:26', '2025-11-06 12:47:26'),
(328, NULL, 7, 'heloo', 'FillInBlank', 'Easy', '.', NULL, '2025-11-06 12:49:11', '2025-11-06 12:49:11'),
(329, NULL, 7, 'hello', 'FillInBlank', 'Easy', '.', NULL, '2025-11-06 12:54:08', '2025-11-06 12:54:08'),
(330, 2, 7, 'Ngôn ngữ C# được phát triển bởi công ty nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(331, 2, 7, 'Đuôi mở rộng của tệp mã nguồn C# là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(332, 2, 7, 'C# là ngôn ngữ thuộc nền tảng nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(333, 2, 7, 'Phương thức Main trong C# có vai trò gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(334, 2, 7, 'Kiểu dữ liệu nào được dùng để lưu trữ số nguyên trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(335, 2, 7, 'Từ khóa nào dùng để khai báo lớp trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(336, 2, 7, 'Từ khóa nào được dùng để kế thừa lớp khác trong C#?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(337, 2, 7, 'Từ khóa nào để tạo đối tượng mới trong C#?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(338, 2, 7, 'Namespace trong C# dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(339, 2, 7, 'Phương thức ToString() trong C# dùng để?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(340, 2, 7, 'Từ khóa nào trong C# được dùng để xử lý ngoại lệ?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(341, 2, 7, 'Trong C#, mảng được khai báo bằng ký hiệu nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(342, 2, 7, 'Cấu trúc điều kiện trong C# được viết bằng từ khóa nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(343, 2, 7, 'C# có thể lập trình hướng đối tượng không?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(344, 2, 7, 'Công cụ IDE phổ biến nhất để lập trình C# là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(345, 2, 7, 'Phương thức nào được gọi khi khởi tạo đối tượng?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(346, 2, 7, 'Để nhập dữ liệu từ bàn phím trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(347, 2, 7, 'Để in dữ liệu ra màn hình trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(348, 2, 7, 'Từ khóa nào được dùng để ngăn lớp bị kế thừa?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(349, 2, 7, 'Kiểu dữ liệu nào dùng để lưu giá trị true/false?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 15:59:52', '2025-11-07 15:59:52'),
(350, 2, 7, 'Ngôn ngữ C# được phát triển bởi công ty nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(351, 2, 7, 'Đuôi mở rộng của tệp mã nguồn C# là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(352, 2, 7, 'C# là ngôn ngữ thuộc nền tảng nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(353, 2, 7, 'Phương thức Main trong C# có vai trò gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(354, 2, 7, 'Kiểu dữ liệu nào được dùng để lưu trữ số nguyên trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(355, 2, 7, 'Từ khóa nào dùng để khai báo lớp trong C#?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(356, 2, 7, 'Từ khóa nào được dùng để kế thừa lớp khác trong C#?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(357, 2, 7, 'Từ khóa nào để tạo đối tượng mới trong C#?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(358, 2, 7, 'Namespace trong C# dùng để làm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(359, 2, 7, 'Phương thức ToString() trong C# dùng để?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(360, 2, 7, 'Từ khóa nào trong C# được dùng để xử lý ngoại lệ?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(361, 2, 7, 'Trong C#, mảng được khai báo bằng ký hiệu nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(362, 2, 7, 'Cấu trúc điều kiện trong C# được viết bằng từ khóa nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(363, 2, 7, 'C# có thể lập trình hướng đối tượng không?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(364, 2, 7, 'Công cụ IDE phổ biến nhất để lập trình C# là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(365, 2, 7, 'Phương thức nào được gọi khi khởi tạo đối tượng?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17');
INSERT INTO `question_bank` (`question_id`, `subject_id`, `teacher_id`, `question_content`, `question_type`, `difficulty`, `correct_answer_text`, `import_id`, `created_at`, `updated_at`) VALUES
(366, 2, 7, 'Để nhập dữ liệu từ bàn phím trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(367, 2, 7, 'Để in dữ liệu ra màn hình trong C#, dùng phương thức nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(368, 2, 7, 'Từ khóa nào được dùng để ngăn lớp bị kế thừa?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(369, 2, 7, 'Kiểu dữ liệu nào dùng để lưu giá trị true/false?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-07 16:08:17', '2025-11-07 16:08:17'),
(370, 2, 7, 'Điện toán đám mây (Cloud Computing) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(371, 2, 7, 'Dịch vụ IaaS cung cấp điều gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(372, 2, 7, 'Dịch vụ SaaS viết tắt của gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(373, 2, 7, 'Google Drive thuộc loại dịch vụ đám mây nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(374, 2, 7, 'PaaS cung cấp cho người dùng điều gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(375, 2, 7, 'AWS, Azure, và Google Cloud là ví dụ của?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(376, 2, 7, 'Ưu điểm chính của điện toán đám mây là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(377, 2, 7, 'Người dùng có thể truy cập dịch vụ đám mây bằng cách nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(378, 2, 7, 'Private Cloud là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(379, 2, 7, 'Public Cloud là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(380, 2, 7, 'Hybrid Cloud là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(381, 2, 7, 'Điện toán đám mây giúp tiết kiệm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(382, 2, 7, 'Cloud Storage là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(383, 2, 7, 'Tính năng chính của điện toán đám mây là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(384, 2, 7, 'Microsoft OneDrive là ví dụ của loại dịch vụ nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(385, 2, 7, 'Người dùng chỉ trả tiền cho tài nguyên sử dụng trong mô hình nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(386, 2, 7, 'Virtualization (ảo hóa) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(387, 2, 7, 'Đặc điểm nào sau đây đúng với đám mây công cộng?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(388, 2, 7, 'Cloud Computing giúp doanh nghiệp như thế nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(389, 2, 7, 'Dịch vụ điện toán đám mây nào cho phép người dùng triển khai máy chủ ảo?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-11 09:21:12', '2025-11-11 09:21:12'),
(390, 2, 7, 'Mẫu kiến trúc nào được sử dụng phổ biến trong các framework xây dựng HTTT?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(391, 2, 7, 'Trong MVC, Controller có vai trò gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(392, 2, 7, 'ORM trong framework giúp gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(393, 2, 7, 'RESTful API đảm bảo nguyên tắc nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(394, 2, 7, 'Mục tiêu của Dependency Injection là gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(395, 2, 7, 'Framework được dùng nhiều nhất để xây HTTT doanh nghiệp?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(396, 2, 7, 'Khái niệm Middleware thuộc framework nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(397, 2, 7, 'Tính năng Migration trong framework dùng để?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(398, 2, 7, 'Spring Boot dùng mô hình tiêm phụ thuộc nào?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(399, 2, 7, 'Service Layer trong HTTT đảm bảo điều gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(400, 2, 7, 'Entity trong ORM đại diện cho gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(401, 2, 7, 'Repository Pattern có vai trò gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(402, 2, 7, 'Framework nào mạnh nhất cho xử lý dữ liệu lớn?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(403, 2, 7, 'Trong xây HTTT, Load Balancing dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(404, 2, 7, 'Caching được dùng để?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(405, 2, 7, 'JWT thường dùng trong framework để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(406, 2, 7, 'Docker hỗ trợ HTTT bằng cách?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(407, 2, 7, 'CI/CD giúp ích gì cho HTTT?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(408, 2, 7, 'Microservices trong HTTT có đặc điểm gì?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(409, 2, 7, 'API Gateway trong hệ thống microservices dùng để?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-14 15:03:01', '2025-11-14 15:03:01'),
(410, NULL, 7, 'thầy nhân dạy tiếng nhật ở trường đại học bình dương', 'FillInBlank', 'Easy', '.', NULL, '2025-11-14 15:10:44', '2025-11-14 15:10:44'),
(411, NULL, 7, 'Trình bày khái niệm Amazon Virtual Private Cloud (VPC) và giải thích tại sao nó lại là nền tảng quan trọng cho việc triển khai các phiên bản EC2 trong AWS.', 'Essay', 'Medium', 'Amazon VPC là một mạng ảo riêng biệt, cô lập logic trong đám mây AWS của bạn, nơi bạn có thể khởi chạy các tài nguyên AWS, bao gồm các phiên bản EC2. Nó quan trọng vì:\n1.  **Cô lập mạng**: Cung cấp một môi trường mạng riêng tư, tách biệt hoàn toàn với các khách hàng AWS khác, đảm bảo dữ liệu và ứng dụng của bạn không bị lộ ra ngoài. \n2.  **Kiểm soát kiến trúc mạng**: Cho phép bạn định nghĩa không gian địa chỉ IP riêng (CIDR block), tạo các subnet, cấu hình bảng định tuyến, và các gateway mạng. \n3.  **Bảo mật nâng cao**: Cung cấp các lớp bảo mật như Security Groups (nhóm bảo mật) và Network Access Control Lists (NACLs) để kiểm soát lưu lượng truy cập vào và ra khỏi các phiên bản EC2 ở cấp độ instance và subnet. \n4.  **Linh hoạt triển khai**: Hỗ trợ triển khai kiến trúc mạng đa tầng (multi-tier) với các subnet công cộng và riêng tư, cho phép các ứng dụng có thể truy cập internet hoặc chỉ được truy cập nội bộ.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(412, NULL, 7, 'Phân biệt sự khác nhau cơ bản giữa Public Subnet và Private Subnet trong VPC, và giải thích vai trò của mỗi loại đối với khả năng truy cập Internet của các phiên bản EC2.', 'Essay', 'Medium', '1.  **Public Subnet (Subnet Công cộng)**:\n    *   **Định nghĩa**: Một subnet có bảng định tuyến (route table) được cấu hình để định tuyến lưu lượng truy cập ra Internet thông qua một Internet Gateway (IGW).\n    *   **Khả năng truy cập Internet**: Các phiên bản EC2 trong Public Subnet có thể truy cập trực tiếp Internet và ngược lại (nếu có Public IP hoặc Elastic IP và Security Group cho phép). Chúng thường được sử dụng cho các máy chủ web, cân bằng tải, hoặc bất kỳ tài nguyên nào cần tương tác trực tiếp với Internet.\n2.  **Private Subnet (Subnet Riêng tư)**:\n    *   **Định nghĩa**: Một subnet không có bảng định tuyến được cấu hình để định tuyến lưu lượng trực tiếp ra Internet qua IGW.\n    *   **Khả năng truy cập Internet**: Các phiên bản EC2 trong Private Subnet không thể truy cập trực tiếp Internet. Để các instance này có thể truy cập Internet (ví dụ: để tải xuống bản cập nhật hoặc patch), chúng cần định tuyến lưu lượng thông qua một NAT Gateway hoặc NAT Instance trong một Public Subnet. Chúng thường được sử dụng cho các máy chủ cơ sở dữ liệu, máy chủ ứng dụng nội bộ, hoặc bất kỳ tài nguyên nào không cần lộ ra Internet.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(413, NULL, 7, 'So sánh và phân biệt các cơ chế bảo mật Security Groups và Network Access Control Lists (NACLs) trong ngữ cảnh bảo vệ các phiên bản EC2 trong VPC.', 'Essay', 'Medium', '1.  **Security Groups (Nhóm bảo mật)**:\n    *   **Cấp độ**: Hoạt động ở cấp độ phiên bản (instance level).\n    *   **Trạng thái**: Có trạng thái (stateful) - nếu bạn cho phép lưu lượng truy cập vào, lưu lượng phản hồi tự động được cho phép ra ngoài, và ngược lại.\n    *   **Quy tắc**: Cho phép hoặc từ chối lưu lượng truy cập. Chỉ có các quy tắc \'ALLOW\' (cho phép) được định nghĩa; mọi thứ không được phép sẽ tự động bị từ chối.\n    *   **Phạm vi**: Áp dụng cho một hoặc nhiều phiên bản EC2.\n    *   **Đánh giá**: Đánh giá tất cả các quy tắc trước khi cho phép hoặc từ chối lưu lượng. \n2.  **Network Access Control Lists (NACLs)**:\n    *   **Cấp độ**: Hoạt động ở cấp độ subnet (subnet level).\n    *   **Trạng thái**: Không trạng thái (stateless) - bạn phải định nghĩa cả quy tắc vào (inbound) và ra (outbound) một cách riêng biệt.\n    *   **Quy tắc**: Cho phép hoặc từ chối lưu lượng truy cập. Có thể định nghĩa cả quy tắc \'ALLOW\' và \'DENY\' (từ chối).\n    *   **Phạm vi**: Áp dụng cho tất cả các phiên bản EC2 trong subnet mà nó được liên kết.\n    *   **Đánh giá**: Đánh giá các quy tắc theo thứ tự số thứ tự (rule number) từ thấp đến cao, và dừng lại ở quy tắc đầu tiên phù hợp.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(414, NULL, 7, 'Giải thích khái niệm Elastic IP Address (EIP) trong AWS. Tại sao việc sử dụng EIP lại có lợi cho các phiên bản EC2, đặc biệt trong các kịch bản cần độ sẵn sàng cao?', 'Essay', 'Medium', 'Elastic IP Address (EIP) là một địa chỉ IPv4 công cộng tĩnh, được phân bổ cho tài khoản AWS của bạn. Nó có thể được liên kết với một phiên bản EC2, một interface mạng (network interface), hoặc một NAT Gateway.\n\n**Lợi ích khi sử dụng EIP cho EC2:**\n1.  **Độ sẵn sàng cao**: Nếu phiên bản EC2 của bạn gặp sự cố hoặc cần được thay thế, bạn có thể nhanh chóng gán lại EIP cho một phiên bản EC2 khác (trong cùng VPC) mà không cần thay đổi bản ghi DNS, giúp giảm thiểu thời gian ngừng hoạt động (downtime). Điều này rất quan trọng trong các kịch bản cần duy trì kết nối liên tục.\n2.  **Địa chỉ IP ổn định**: Địa chỉ IP công cộng mặc định của một phiên bản EC2 sẽ thay đổi mỗi khi instance được dừng và khởi động lại. EIP cung cấp một địa chỉ IP công cộng ổn định, không thay đổi ngay cả khi instance được dừng/khởi động lại hoặc được chuyển sang một instance khác. Điều này giúp các ứng dụng hoặc dịch vụ bên ngoài luôn có thể kết nối đến instance của bạn thông qua một địa chỉ IP nhất quán.\n3.  **Dễ dàng quản lý**: EIP giúp đơn giản hóa việc quản lý kết nối và cấu hình DNS, vì bạn luôn trỏ đến cùng một địa chỉ IP.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(415, NULL, 7, 'Mô tả vai trò và chức năng của Internet Gateway (IGW) trong kiến trúc VPC. Làm thế nào IGW giúp các phiên bản EC2 trong Public Subnet giao tiếp với Internet?', 'Essay', 'Medium', 'Internet Gateway (IGW) là một thành phần logic có khả năng mở rộng theo chiều ngang, cung cấp kết nối giữa VPC và Internet. Nó đóng vai trò là điểm vào/ra cho lưu lượng truy cập từ/đến Internet.\n\n**Vai trò của IGW đối với EC2 trong Public Subnet:**\n1.  **Cung cấp đích đến (target) cho bảng định tuyến**: Để một phiên bản EC2 trong Public Subnet có thể giao tiếp với Internet, bảng định tuyến của subnet đó phải chứa một tuyến đường (route) trỏ đến IGW cho lưu lượng truy cập Internet (thường là 0.0.0.0/0).\n2.  **Thực hiện NAT**: Khi một phiên bản EC2 có địa chỉ IP công cộng (Public IP hoặc Elastic IP) gửi hoặc nhận lưu lượng truy cập từ Internet, IGW thực hiện chuyển đổi địa chỉ mạng (Network Address Translation - NAT) giữa địa chỉ IP riêng của instance và địa chỉ IP công cộng của nó.\n\n**Quá trình hoạt động:**\n*   Khi một phiên bản EC2 trong Public Subnet (có Public IP/EIP) muốn truy cập Internet, lưu lượng truy cập sẽ được định tuyến thông qua IGW theo quy tắc trong bảng định tuyến của subnet. IGW sẽ chuyển tiếp yêu cầu ra Internet.\n*   Khi lưu lượng từ Internet muốn đến phiên bản EC2 đó, nó sẽ đến IGW, IGW sẽ thực hiện NAT để chuyển tiếp lưu lượng đến địa chỉ IP riêng của instance trong VPC.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(416, NULL, 7, 'Giải thích mục đích của Route Table (Bảng định tuyến) trong một VPC. Cho một ví dụ về cách một Route Table có thể được cấu hình để cho phép một Public Subnet truy cập Internet.', 'Essay', 'Medium', 'Route Table (Bảng định tuyến) là một tập hợp các quy tắc, được gọi là các tuyến đường (routes), được sử dụng để điều khiển nơi lưu lượng mạng từ một subnet hoặc gateway được định hướng đi tới. Mỗi subnet trong VPC phải được liên kết với một Route Table.\n\n**Mục đích**: Route Table xác định đường dẫn mà các gói tin sẽ đi qua để đến đích mong muốn (trong VPC, ra Internet, đến một VPC khác, v.v.).\n\n**Ví dụ về cấu hình Route Table cho Public Subnet truy cập Internet:**\nGiả sử chúng ta có một VPC với dải IP 10.0.0.0/16 và một Public Subnet 10.0.1.0/24.\n\nMột Route Table cho Public Subnet sẽ có các tuyến đường sau:\n1.  **Destination**: 10.0.0.0/16\n    *   **Target**: `local`\n    *   **Giải thích**: Tuyến đường này là tuyến đường mặc định, cho phép tất cả các tài nguyên trong VPC giao tiếp với nhau. Tất cả lưu lượng dành cho các địa chỉ IP trong dải CIDR của VPC sẽ được giữ lại trong mạng nội bộ VPC.\n2.  **Destination**: 0.0.0.0/0\n    *   **Target**: `igw-xxxxxxxxxxxxxxxxx` (ID của Internet Gateway đã gắn vào VPC)\n    *   **Giải thích**: Tuyến đường này là tuyến đường mặc định cho lưu lượng ra Internet (tất cả các địa chỉ IP không nằm trong VPC). Bằng cách trỏ nó đến Internet Gateway, các phiên bản EC2 trong Public Subnet có thể gửi và nhận lưu lượng từ Internet.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(417, NULL, 7, 'Giải thích tại sao cần có NAT Gateway hoặc NAT Instance trong một VPC. Mô tả cách chúng cho phép các phiên bản EC2 trong Private Subnet truy cập Internet mà vẫn duy trì tính riêng tư.', 'Essay', 'Medium', '**Sự cần thiết của NAT Gateway/Instance:**\nCác phiên bản EC2 trong Private Subnet cần truy cập Internet vì nhiều lý do (ví dụ: tải xuống bản cập nhật hệ điều hành, cài đặt gói phần mềm, kết nối với các dịch vụ AWS khác như S3 hoặc DynamoDB). Tuy nhiên, chúng không được phép có địa chỉ IP công cộng và không thể truy cập Internet trực tiếp thông qua Internet Gateway để duy trì tính riêng tư và bảo mật.\n\n**Cách NAT Gateway/Instance hoạt động:**\n1.  **Vị trí**: Cả NAT Gateway và NAT Instance đều được triển khai trong một Public Subnet và được gán một Elastic IP Address (EIP).\n2.  **Bảng định tuyến (Route Table)**: Bảng định tuyến của Private Subnet được cấu hình với một tuyến đường mặc định (0.0.0.0/0) trỏ đến NAT Gateway hoặc NAT Instance.\n3.  **Quá trình truy cập Internet**: Khi một phiên bản EC2 trong Private Subnet muốn truy cập Internet, nó gửi lưu lượng đến NAT Gateway/Instance. NAT Gateway/Instance sau đó thực hiện Network Address Translation (NAT), thay thế địa chỉ IP riêng của instance bằng địa chỉ IP công cộng (EIP) của chính nó, sau đó gửi yêu cầu ra Internet thông qua Internet Gateway.\n4.  **Phản hồi**: Khi phản hồi từ Internet trở về, nó sẽ đến EIP của NAT Gateway/Instance. NAT Gateway/Instance sẽ dịch địa chỉ lại và chuyển tiếp phản hồi về phiên bản EC2 trong Private Subnet.\n\nNhờ cơ chế này, các instance trong Private Subnet có thể khởi tạo kết nối ra Internet nhưng không thể bị truy cập trực tiếp từ Internet, duy trì tính riêng tư và bảo mật.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(418, NULL, 7, 'Mô tả VPC Peering. Trong những tình huống nào bạn sẽ sử dụng VPC Peering, và những giới hạn chính của nó là gì?', 'Essay', 'Medium', 'VPC Peering là một kết nối mạng giữa hai VPC, cho phép các tài nguyên trong mỗi VPC giao tiếp với nhau bằng địa chỉ IP riêng của chúng, giống như thể chúng nằm trong cùng một mạng. Các VPC có thể thuộc cùng một tài khoản AWS hoặc các tài khoản AWS khác nhau, và có thể nằm trong cùng một hoặc các khu vực (Region) khác nhau.\n\n**Tình huống sử dụng VPC Peering:**\n1.  **Chia sẻ tài nguyên**: Khi bạn có các ứng dụng hoặc dịch vụ cần truy cập các tài nguyên (ví dụ: cơ sở dữ liệu, dịch vụ microservice) được triển khai trong một VPC khác.\n2.  **Mô hình hub-and-spoke**: Một VPC trung tâm (hub) có thể được peering với nhiều VPC khác (spoke) để quản lý tập trung hoặc chia sẻ các dịch vụ chung.\n3.  **Hợp nhất hoặc mua lại**: Khi hai công ty sáp nhập và cần kết nối các tài nguyên AWS của họ mà không di chuyển chúng.\n\n**Giới hạn chính của VPC Peering:**\n1.  **Không có tính chuyển tiếp (No transitive peering)**: Nếu VPC A được peering với VPC B, và VPC B được peering với VPC C, thì VPC A không thể trực tiếp giao tiếp với VPC C thông qua VPC B. Bạn cần tạo kết nối peering trực tiếp giữa VPC A và VPC C.\n2.  **Không trùng lặp CIDR blocks**: Hai VPC đang peering không được có các dải CIDR IP trùng lặp.\n3.  **Số lượng peering giới hạn**: Mỗi VPC có giới hạn về số lượng kết nối peering có thể thiết lập.\n4.  **Cấu hình DNS resolver**: Cần cấu hình DNS resolver phù hợp nếu muốn phân giải tên miền riêng giữa các VPC được peering.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(419, NULL, 7, 'Khi triển khai các phiên bản EC2, hãy trình bày các yếu tố quan trọng liên quan đến kiến trúc VPC (như subnet, Availability Zone, và bảo mật) cần được xem xét để đảm bảo hiệu suất và độ sẵn sàng cao.', 'Essay', 'Medium', 'Khi triển khai EC2, cần xem xét các yếu tố VPC sau:\n1.  **Subnet**: \n    *   **Phân loại**: Xác định xem instance cần truy cập Internet (Public Subnet) hay chỉ truy cập nội bộ (Private Subnet). Đặt các máy chủ web/load balancer vào Public Subnet và máy chủ ứng dụng/cơ sở dữ liệu vào Private Subnet. \n    *   **Kích thước**: Đảm bảo subnet có đủ địa chỉ IP cho nhu cầu hiện tại và tương lai. \n2.  **Availability Zone (AZ)**:\n    *   **Phân tán**: Luôn triển khai các phiên bản EC2 quan trọng (hoặc các nhóm EC2) trên nhiều AZ khác nhau để tăng cường khả năng chịu lỗi và độ sẵn sàng. Nếu một AZ gặp sự cố, ứng dụng vẫn hoạt động ở các AZ khác.\n    *   **Độ trễ**: Xem xét độ trễ khi giao tiếp giữa các AZ nếu ứng dụng yêu cầu hiệu suất cao giữa các thành phần.\n3.  **Bảo mật (Security Groups và NACLs)**:\n    *   **Security Groups**: Cấu hình các quy tắc \'allow\' cần thiết cho từng phiên bản EC2 hoặc nhóm instance. Chỉ mở các cổng và địa chỉ IP nguồn thực sự cần thiết. Ví dụ: mở cổng 80/443 cho máy chủ web từ mọi nơi, cổng 22 cho SSH từ IP quản trị viên.\n    *   **NACLs**: Sử dụng NACLs ở cấp độ subnet để tạo thêm một lớp bảo mật không trạng thái, đặc biệt hữu ích để chặn các dải IP độc hại hoặc thiết lập các chính sách bảo mật rộng hơn cho toàn bộ subnet.\n4.  **Bảng định tuyến (Route Tables)**: Đảm bảo rằng Route Table của subnet được cấu hình đúng để các phiên bản EC2 có thể giao tiếp với các tài nguyên mong muốn (trong VPC, ra Internet, qua peering, v.v.).\n5.  **Elastic IP/NAT Gateway**: Nếu các instance trong Private Subnet cần truy cập Internet, đảm bảo có NAT Gateway/Instance được cấu hình đúng và Private Subnet có route trỏ đến đó. Nếu các instance trong Public Subnet cần địa chỉ IP tĩnh, sử dụng Elastic IP.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(420, NULL, 7, 'Giải thích mục đích và sự khác biệt cơ bản giữa AWS VPN Gateway và AWS Direct Connect trong việc kết nối mạng On-Premise với VPC của bạn.', 'Essay', 'Medium', 'Cả AWS VPN Gateway và AWS Direct Connect đều là các dịch vụ giúp kết nối mạng On-Premise (tại chỗ) của bạn với VPC trong AWS, nhưng chúng khác nhau về cách thức, hiệu suất và chi phí.\n\n1.  **AWS VPN Gateway (Site-to-Site VPN)**:\n    *   **Mục đích**: Thiết lập một kết nối bảo mật (IPsec VPN) qua mạng Internet công cộng giữa trung tâm dữ liệu On-Premise của bạn và VPC của bạn.\n    *   **Cách thức**: Dữ liệu được mã hóa và truyền qua Internet công cộng. Bạn cần một Customer Gateway (thiết bị/phần mềm VPN) ở phía On-Premise.\n    *   **Đặc điểm**: \n        *   **Chi phí**: Thường thấp hơn, dựa trên giờ sử dụng và chi phí truyền dữ liệu.\n        *   **Hiệu suất**: Phụ thuộc vào chất lượng và băng thông của kết nối Internet công cộng, có thể biến động về độ trễ và thông lượng.\n        *   **Bảo mật**: Dữ liệu được mã hóa, an toàn trên Internet.\n        *   **Triển khai**: Nhanh chóng và dễ dàng triển khai.\n\n2.  **AWS Direct Connect**:\n    *   **Mục đích**: Thiết lập một kết nối mạng vật lý riêng, chuyên dụng từ trung tâm dữ liệu On-Premise của bạn đến một điểm POP (Point of Presence) của AWS, sau đó đến VPC của bạn.\n    *   **Cách thức**: Dữ liệu truyền qua một đường truyền cáp quang riêng, không đi qua Internet công cộng. Yêu cầu hợp tác với một đối tác Direct Connect hoặc nhà cung cấp dịch vụ mạng.\n    *   **Đặc điểm**: \n        *   **Chi phí**: Thường cao hơn VPN, bao gồm phí cổng kết nối và chi phí truyền dữ liệu, cùng với chi phí từ nhà cung cấp dịch vụ mạng.\n        *   **Hiệu suất**: Cung cấp băng thông cao, độ trễ thấp và ổn định, nhất quán hơn nhiều so với VPN qua Internet.\n        *   **Bảo mật**: Dữ liệu không đi qua Internet công cộng, tăng cường bảo mật và tuân thủ.\n        *   **Triển khai**: Mất nhiều thời gian hơn để thiết lập do yêu cầu hạ tầng vật lý.\n\n**Khi nào sử dụng cái nào:**\n*   **VPN Gateway**: Thích hợp cho các trường hợp cần kết nối nhanh chóng, chi phí thấp, cho các ứng dụng không yêu cầu băng thông cực cao hoặc độ trễ cực thấp, hoặc như một giải pháp dự phòng cho Direct Connect.\n*   **Direct Connect**: Thích hợp cho các ứng dụng doanh nghiệp quan trọng, yêu cầu băng thông cao, độ trễ thấp, ổn định, và cần tuân thủ các quy định bảo mật nghiêm ngặt.', NULL, '2025-11-15 09:44:49', '2025-11-15 09:44:49'),
(421, NULL, 7, 'Trình bày khái niệm Amazon Virtual Private Cloud (VPC) và giải thích tại sao nó lại là nền tảng quan trọng cho việc triển khai các phiên bản EC2 trong AWS.', 'Essay', 'Medium', 'Amazon VPC là một mạng ảo riêng biệt, cô lập logic trong đám mây AWS của bạn, nơi bạn có thể khởi chạy các tài nguyên AWS, bao gồm các phiên bản EC2. Nó quan trọng vì:\n1.  **Cô lập mạng**: Cung cấp một môi trường mạng riêng tư, tách biệt hoàn toàn với các khách hàng AWS khác, đảm bảo dữ liệu và ứng dụng của bạn không bị lộ ra ngoài. \n2.  **Kiểm soát kiến trúc mạng**: Cho phép bạn định nghĩa không gian địa chỉ IP riêng (CIDR block), tạo các subnet, cấu hình bảng định tuyến, và các gateway mạng. \n3.  **Bảo mật nâng cao**: Cung cấp các lớp bảo mật như Security Groups (nhóm bảo mật) và Network Access Control Lists (NACLs) để kiểm soát lưu lượng truy cập vào và ra khỏi các phiên bản EC2 ở cấp độ instance và subnet. \n4.  **Linh hoạt triển khai**: Hỗ trợ triển khai kiến trúc mạng đa tầng (multi-tier) với các subnet công cộng và riêng tư, cho phép các ứng dụng có thể truy cập internet hoặc chỉ được truy cập nội bộ.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(422, NULL, 7, 'Phân biệt sự khác nhau cơ bản giữa Public Subnet và Private Subnet trong VPC, và giải thích vai trò của mỗi loại đối với khả năng truy cập Internet của các phiên bản EC2.', 'Essay', 'Medium', '1.  **Public Subnet (Subnet Công cộng)**:\n    *   **Định nghĩa**: Một subnet có bảng định tuyến (route table) được cấu hình để định tuyến lưu lượng truy cập ra Internet thông qua một Internet Gateway (IGW).\n    *   **Khả năng truy cập Internet**: Các phiên bản EC2 trong Public Subnet có thể truy cập trực tiếp Internet và ngược lại (nếu có Public IP hoặc Elastic IP và Security Group cho phép). Chúng thường được sử dụng cho các máy chủ web, cân bằng tải, hoặc bất kỳ tài nguyên nào cần tương tác trực tiếp với Internet.\n2.  **Private Subnet (Subnet Riêng tư)**:\n    *   **Định nghĩa**: Một subnet không có bảng định tuyến được cấu hình để định tuyến lưu lượng trực tiếp ra Internet qua IGW.\n    *   **Khả năng truy cập Internet**: Các phiên bản EC2 trong Private Subnet không thể truy cập trực tiếp Internet. Để các instance này có thể truy cập Internet (ví dụ: để tải xuống bản cập nhật hoặc patch), chúng cần định tuyến lưu lượng thông qua một NAT Gateway hoặc NAT Instance trong một Public Subnet. Chúng thường được sử dụng cho các máy chủ cơ sở dữ liệu, máy chủ ứng dụng nội bộ, hoặc bất kỳ tài nguyên nào không cần lộ ra Internet.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(423, NULL, 7, 'So sánh và phân biệt các cơ chế bảo mật Security Groups và Network Access Control Lists (NACLs) trong ngữ cảnh bảo vệ các phiên bản EC2 trong VPC.', 'Essay', 'Medium', '1.  **Security Groups (Nhóm bảo mật)**:\n    *   **Cấp độ**: Hoạt động ở cấp độ phiên bản (instance level).\n    *   **Trạng thái**: Có trạng thái (stateful) - nếu bạn cho phép lưu lượng truy cập vào, lưu lượng phản hồi tự động được cho phép ra ngoài, và ngược lại.\n    *   **Quy tắc**: Cho phép hoặc từ chối lưu lượng truy cập. Chỉ có các quy tắc \'ALLOW\' (cho phép) được định nghĩa; mọi thứ không được phép sẽ tự động bị từ chối.\n    *   **Phạm vi**: Áp dụng cho một hoặc nhiều phiên bản EC2.\n    *   **Đánh giá**: Đánh giá tất cả các quy tắc trước khi cho phép hoặc từ chối lưu lượng. \n2.  **Network Access Control Lists (NACLs)**:\n    *   **Cấp độ**: Hoạt động ở cấp độ subnet (subnet level).\n    *   **Trạng thái**: Không trạng thái (stateless) - bạn phải định nghĩa cả quy tắc vào (inbound) và ra (outbound) một cách riêng biệt.\n    *   **Quy tắc**: Cho phép hoặc từ chối lưu lượng truy cập. Có thể định nghĩa cả quy tắc \'ALLOW\' và \'DENY\' (từ chối).\n    *   **Phạm vi**: Áp dụng cho tất cả các phiên bản EC2 trong subnet mà nó được liên kết.\n    *   **Đánh giá**: Đánh giá các quy tắc theo thứ tự số thứ tự (rule number) từ thấp đến cao, và dừng lại ở quy tắc đầu tiên phù hợp.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(424, NULL, 7, 'Giải thích khái niệm Elastic IP Address (EIP) trong AWS. Tại sao việc sử dụng EIP lại có lợi cho các phiên bản EC2, đặc biệt trong các kịch bản cần độ sẵn sàng cao?', 'Essay', 'Medium', 'Elastic IP Address (EIP) là một địa chỉ IPv4 công cộng tĩnh, được phân bổ cho tài khoản AWS của bạn. Nó có thể được liên kết với một phiên bản EC2, một interface mạng (network interface), hoặc một NAT Gateway.\n\n**Lợi ích khi sử dụng EIP cho EC2:**\n1.  **Độ sẵn sàng cao**: Nếu phiên bản EC2 của bạn gặp sự cố hoặc cần được thay thế, bạn có thể nhanh chóng gán lại EIP cho một phiên bản EC2 khác (trong cùng VPC) mà không cần thay đổi bản ghi DNS, giúp giảm thiểu thời gian ngừng hoạt động (downtime). Điều này rất quan trọng trong các kịch bản cần duy trì kết nối liên tục.\n2.  **Địa chỉ IP ổn định**: Địa chỉ IP công cộng mặc định của một phiên bản EC2 sẽ thay đổi mỗi khi instance được dừng và khởi động lại. EIP cung cấp một địa chỉ IP công cộng ổn định, không thay đổi ngay cả khi instance được dừng/khởi động lại hoặc được chuyển sang một instance khác. Điều này giúp các ứng dụng hoặc dịch vụ bên ngoài luôn có thể kết nối đến instance của bạn thông qua một địa chỉ IP nhất quán.\n3.  **Dễ dàng quản lý**: EIP giúp đơn giản hóa việc quản lý kết nối và cấu hình DNS, vì bạn luôn trỏ đến cùng một địa chỉ IP.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(425, NULL, 7, 'Mô tả vai trò và chức năng của Internet Gateway (IGW) trong kiến trúc VPC. Làm thế nào IGW giúp các phiên bản EC2 trong Public Subnet giao tiếp với Internet?', 'Essay', 'Medium', 'Internet Gateway (IGW) là một thành phần logic có khả năng mở rộng theo chiều ngang, cung cấp kết nối giữa VPC và Internet. Nó đóng vai trò là điểm vào/ra cho lưu lượng truy cập từ/đến Internet.\n\n**Vai trò của IGW đối với EC2 trong Public Subnet:**\n1.  **Cung cấp đích đến (target) cho bảng định tuyến**: Để một phiên bản EC2 trong Public Subnet có thể giao tiếp với Internet, bảng định tuyến của subnet đó phải chứa một tuyến đường (route) trỏ đến IGW cho lưu lượng truy cập Internet (thường là 0.0.0.0/0).\n2.  **Thực hiện NAT**: Khi một phiên bản EC2 có địa chỉ IP công cộng (Public IP hoặc Elastic IP) gửi hoặc nhận lưu lượng truy cập từ Internet, IGW thực hiện chuyển đổi địa chỉ mạng (Network Address Translation - NAT) giữa địa chỉ IP riêng của instance và địa chỉ IP công cộng của nó.\n\n**Quá trình hoạt động:**\n*   Khi một phiên bản EC2 trong Public Subnet (có Public IP/EIP) muốn truy cập Internet, lưu lượng truy cập sẽ được định tuyến thông qua IGW theo quy tắc trong bảng định tuyến của subnet. IGW sẽ chuyển tiếp yêu cầu ra Internet.\n*   Khi lưu lượng từ Internet muốn đến phiên bản EC2 đó, nó sẽ đến IGW, IGW sẽ thực hiện NAT để chuyển tiếp lưu lượng đến địa chỉ IP riêng của instance trong VPC.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(426, NULL, 7, 'Giải thích mục đích của Route Table (Bảng định tuyến) trong một VPC. Cho một ví dụ về cách một Route Table có thể được cấu hình để cho phép một Public Subnet truy cập Internet.', 'Essay', 'Medium', 'Route Table (Bảng định tuyến) là một tập hợp các quy tắc, được gọi là các tuyến đường (routes), được sử dụng để điều khiển nơi lưu lượng mạng từ một subnet hoặc gateway được định hướng đi tới. Mỗi subnet trong VPC phải được liên kết với một Route Table.\n\n**Mục đích**: Route Table xác định đường dẫn mà các gói tin sẽ đi qua để đến đích mong muốn (trong VPC, ra Internet, đến một VPC khác, v.v.).\n\n**Ví dụ về cấu hình Route Table cho Public Subnet truy cập Internet:**\nGiả sử chúng ta có một VPC với dải IP 10.0.0.0/16 và một Public Subnet 10.0.1.0/24.\n\nMột Route Table cho Public Subnet sẽ có các tuyến đường sau:\n1.  **Destination**: 10.0.0.0/16\n    *   **Target**: `local`\n    *   **Giải thích**: Tuyến đường này là tuyến đường mặc định, cho phép tất cả các tài nguyên trong VPC giao tiếp với nhau. Tất cả lưu lượng dành cho các địa chỉ IP trong dải CIDR của VPC sẽ được giữ lại trong mạng nội bộ VPC.\n2.  **Destination**: 0.0.0.0/0\n    *   **Target**: `igw-xxxxxxxxxxxxxxxxx` (ID của Internet Gateway đã gắn vào VPC)\n    *   **Giải thích**: Tuyến đường này là tuyến đường mặc định cho lưu lượng ra Internet (tất cả các địa chỉ IP không nằm trong VPC). Bằng cách trỏ nó đến Internet Gateway, các phiên bản EC2 trong Public Subnet có thể gửi và nhận lưu lượng từ Internet.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(427, NULL, 7, 'Giải thích tại sao cần có NAT Gateway hoặc NAT Instance trong một VPC. Mô tả cách chúng cho phép các phiên bản EC2 trong Private Subnet truy cập Internet mà vẫn duy trì tính riêng tư.', 'Essay', 'Medium', '**Sự cần thiết của NAT Gateway/Instance:**\nCác phiên bản EC2 trong Private Subnet cần truy cập Internet vì nhiều lý do (ví dụ: tải xuống bản cập nhật hệ điều hành, cài đặt gói phần mềm, kết nối với các dịch vụ AWS khác như S3 hoặc DynamoDB). Tuy nhiên, chúng không được phép có địa chỉ IP công cộng và không thể truy cập Internet trực tiếp thông qua Internet Gateway để duy trì tính riêng tư và bảo mật.\n\n**Cách NAT Gateway/Instance hoạt động:**\n1.  **Vị trí**: Cả NAT Gateway và NAT Instance đều được triển khai trong một Public Subnet và được gán một Elastic IP Address (EIP).\n2.  **Bảng định tuyến (Route Table)**: Bảng định tuyến của Private Subnet được cấu hình với một tuyến đường mặc định (0.0.0.0/0) trỏ đến NAT Gateway hoặc NAT Instance.\n3.  **Quá trình truy cập Internet**: Khi một phiên bản EC2 trong Private Subnet muốn truy cập Internet, nó gửi lưu lượng đến NAT Gateway/Instance. NAT Gateway/Instance sau đó thực hiện Network Address Translation (NAT), thay thế địa chỉ IP riêng của instance bằng địa chỉ IP công cộng (EIP) của chính nó, sau đó gửi yêu cầu ra Internet thông qua Internet Gateway.\n4.  **Phản hồi**: Khi phản hồi từ Internet trở về, nó sẽ đến EIP của NAT Gateway/Instance. NAT Gateway/Instance sẽ dịch địa chỉ lại và chuyển tiếp phản hồi về phiên bản EC2 trong Private Subnet.\n\nNhờ cơ chế này, các instance trong Private Subnet có thể khởi tạo kết nối ra Internet nhưng không thể bị truy cập trực tiếp từ Internet, duy trì tính riêng tư và bảo mật.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(428, NULL, 7, 'Mô tả VPC Peering. Trong những tình huống nào bạn sẽ sử dụng VPC Peering, và những giới hạn chính của nó là gì?', 'Essay', 'Medium', 'VPC Peering là một kết nối mạng giữa hai VPC, cho phép các tài nguyên trong mỗi VPC giao tiếp với nhau bằng địa chỉ IP riêng của chúng, giống như thể chúng nằm trong cùng một mạng. Các VPC có thể thuộc cùng một tài khoản AWS hoặc các tài khoản AWS khác nhau, và có thể nằm trong cùng một hoặc các khu vực (Region) khác nhau.\n\n**Tình huống sử dụng VPC Peering:**\n1.  **Chia sẻ tài nguyên**: Khi bạn có các ứng dụng hoặc dịch vụ cần truy cập các tài nguyên (ví dụ: cơ sở dữ liệu, dịch vụ microservice) được triển khai trong một VPC khác.\n2.  **Mô hình hub-and-spoke**: Một VPC trung tâm (hub) có thể được peering với nhiều VPC khác (spoke) để quản lý tập trung hoặc chia sẻ các dịch vụ chung.\n3.  **Hợp nhất hoặc mua lại**: Khi hai công ty sáp nhập và cần kết nối các tài nguyên AWS của họ mà không di chuyển chúng.\n\n**Giới hạn chính của VPC Peering:**\n1.  **Không có tính chuyển tiếp (No transitive peering)**: Nếu VPC A được peering với VPC B, và VPC B được peering với VPC C, thì VPC A không thể trực tiếp giao tiếp với VPC C thông qua VPC B. Bạn cần tạo kết nối peering trực tiếp giữa VPC A và VPC C.\n2.  **Không trùng lặp CIDR blocks**: Hai VPC đang peering không được có các dải CIDR IP trùng lặp.\n3.  **Số lượng peering giới hạn**: Mỗi VPC có giới hạn về số lượng kết nối peering có thể thiết lập.\n4.  **Cấu hình DNS resolver**: Cần cấu hình DNS resolver phù hợp nếu muốn phân giải tên miền riêng giữa các VPC được peering.', NULL, '2025-11-15 09:44:59', '2025-11-15 09:44:59'),
(429, NULL, 7, 'Khi triển khai các phiên bản EC2, hãy trình bày các yếu tố quan trọng liên quan đến kiến trúc VPC (như subnet, Availability Zone, và bảo mật) cần được xem xét để đảm bảo hiệu suất và độ sẵn sàng cao.', 'Essay', 'Medium', 'Khi triển khai EC2, cần xem xét các yếu tố VPC sau:\n1.  **Subnet**: \n    *   **Phân loại**: Xác định xem instance cần truy cập Internet (Public Subnet) hay chỉ truy cập nội bộ (Private Subnet). Đặt các máy chủ web/load balancer vào Public Subnet và máy chủ ứng dụng/cơ sở dữ liệu vào Private Subnet. \n    *   **Kích thước**: Đảm bảo subnet có đủ địa chỉ IP cho nhu cầu hiện tại và tương lai. \n2.  **Availability Zone (AZ)**:\n    *   **Phân tán**: Luôn triển khai các phiên bản EC2 quan trọng (hoặc các nhóm EC2) trên nhiều AZ khác nhau để tăng cường khả năng chịu lỗi và độ sẵn sàng. Nếu một AZ gặp sự cố, ứng dụng vẫn hoạt động ở các AZ khác.\n    *   **Độ trễ**: Xem xét độ trễ khi giao tiếp giữa các AZ nếu ứng dụng yêu cầu hiệu suất cao giữa các thành phần.\n3.  **Bảo mật (Security Groups và NACLs)**:\n    *   **Security Groups**: Cấu hình các quy tắc \'allow\' cần thiết cho từng phiên bản EC2 hoặc nhóm instance. Chỉ mở các cổng và địa chỉ IP nguồn thực sự cần thiết. Ví dụ: mở cổng 80/443 cho máy chủ web từ mọi nơi, cổng 22 cho SSH từ IP quản trị viên.\n    *   **NACLs**: Sử dụng NACLs ở cấp độ subnet để tạo thêm một lớp bảo mật không trạng thái, đặc biệt hữu ích để chặn các dải IP độc hại hoặc thiết lập các chính sách bảo mật rộng hơn cho toàn bộ subnet.\n4.  **Bảng định tuyến (Route Tables)**: Đảm bảo rằng Route Table của subnet được cấu hình đúng để các phiên bản EC2 có thể giao tiếp với các tài nguyên mong muốn (trong VPC, ra Internet, qua peering, v.v.).\n5.  **Elastic IP/NAT Gateway**: Nếu các instance trong Private Subnet cần truy cập Internet, đảm bảo có NAT Gateway/Instance được cấu hình đúng và Private Subnet có route trỏ đến đó. Nếu các instance trong Public Subnet cần địa chỉ IP tĩnh, sử dụng Elastic IP.', NULL, '2025-11-15 09:45:00', '2025-11-15 09:45:00'),
(430, NULL, 7, 'Giải thích mục đích và sự khác biệt cơ bản giữa AWS VPN Gateway và AWS Direct Connect trong việc kết nối mạng On-Premise với VPC của bạn.', 'Essay', 'Medium', 'Cả AWS VPN Gateway và AWS Direct Connect đều là các dịch vụ giúp kết nối mạng On-Premise (tại chỗ) của bạn với VPC trong AWS, nhưng chúng khác nhau về cách thức, hiệu suất và chi phí.\n\n1.  **AWS VPN Gateway (Site-to-Site VPN)**:\n    *   **Mục đích**: Thiết lập một kết nối bảo mật (IPsec VPN) qua mạng Internet công cộng giữa trung tâm dữ liệu On-Premise của bạn và VPC của bạn.\n    *   **Cách thức**: Dữ liệu được mã hóa và truyền qua Internet công cộng. Bạn cần một Customer Gateway (thiết bị/phần mềm VPN) ở phía On-Premise.\n    *   **Đặc điểm**: \n        *   **Chi phí**: Thường thấp hơn, dựa trên giờ sử dụng và chi phí truyền dữ liệu.\n        *   **Hiệu suất**: Phụ thuộc vào chất lượng và băng thông của kết nối Internet công cộng, có thể biến động về độ trễ và thông lượng.\n        *   **Bảo mật**: Dữ liệu được mã hóa, an toàn trên Internet.\n        *   **Triển khai**: Nhanh chóng và dễ dàng triển khai.\n\n2.  **AWS Direct Connect**:\n    *   **Mục đích**: Thiết lập một kết nối mạng vật lý riêng, chuyên dụng từ trung tâm dữ liệu On-Premise của bạn đến một điểm POP (Point of Presence) của AWS, sau đó đến VPC của bạn.\n    *   **Cách thức**: Dữ liệu truyền qua một đường truyền cáp quang riêng, không đi qua Internet công cộng. Yêu cầu hợp tác với một đối tác Direct Connect hoặc nhà cung cấp dịch vụ mạng.\n    *   **Đặc điểm**: \n        *   **Chi phí**: Thường cao hơn VPN, bao gồm phí cổng kết nối và chi phí truyền dữ liệu, cùng với chi phí từ nhà cung cấp dịch vụ mạng.\n        *   **Hiệu suất**: Cung cấp băng thông cao, độ trễ thấp và ổn định, nhất quán hơn nhiều so với VPN qua Internet.\n        *   **Bảo mật**: Dữ liệu không đi qua Internet công cộng, tăng cường bảo mật và tuân thủ.\n        *   **Triển khai**: Mất nhiều thời gian hơn để thiết lập do yêu cầu hạ tầng vật lý.\n\n**Khi nào sử dụng cái nào:**\n*   **VPN Gateway**: Thích hợp cho các trường hợp cần kết nối nhanh chóng, chi phí thấp, cho các ứng dụng không yêu cầu băng thông cực cao hoặc độ trễ cực thấp, hoặc như một giải pháp dự phòng cho Direct Connect.\n*   **Direct Connect**: Thích hợp cho các ứng dụng doanh nghiệp quan trọng, yêu cầu băng thông cao, độ trễ thấp, ổn định, và cần tuân thủ các quy định bảo mật nghiêm ngặt.', NULL, '2025-11-15 09:45:00', '2025-11-15 09:45:00'),
(431, NULL, 7, 'Trong AWS VPC, thành phần nào chịu trách nhiệm chính trong việc định nghĩa dải địa chỉ IP cho toàn bộ mạng ảo của bạn?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(432, NULL, 7, 'Một EC2 instance được triển khai trong một private subnet cần truy cập Internet để tải xuống các bản cập nhật. Thành phần VPC nào là *thiết yếu* để cho phép kết nối Internet ra bên ngoài mà không cần địa chỉ IP công cộng cho EC2 instance đó?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(433, NULL, 7, 'Điểm khác biệt quan trọng nào sau đây là *chính xác* khi so sánh Nhóm bảo mật (Security Group) và Danh sách kiểm soát truy cập mạng (Network ACL - NACL) trong AWS VPC?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(434, NULL, 7, 'Để một EC2 instance trong public subnet có thể nhận được lưu lượng truy cập từ Internet (ví dụ: SSH hoặc HTTP), ngoài việc có một địa chỉ IP công cộng hoặc Elastic IP, thành phần VPC nào phải được cấu hình *chính xác* để hướng lưu lượng từ Internet Gateway đến subnet chứa instance đó?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(435, NULL, 7, 'Một EC2 instance có cả địa chỉ IP riêng (private IP) và địa chỉ IP công cộng (public IP) được cấp bởi AWS. Khi instance này khởi tạo một kết nối ra ngoài Internet, địa chỉ IP nào sẽ được nhìn thấy làm nguồn (source) của lưu lượng truy cập từ góc nhìn bên ngoài Internet?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(436, NULL, 7, 'hello', 'Essay', 'Easy', '.', NULL, '2025-11-15 10:32:12', '2025-11-15 10:32:12'),
(437, NULL, 7, 'Một ứng dụng yêu cầu tính sẵn sàng cao cho cơ sở dữ liệu của nó và phải tự động chuyển đổi sang phiên bản dự phòng (standby instance) trong trường hợp có sự cố. Tính năng Amazon RDS nào sau đây đáp ứng tốt nhất yêu cầu này?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(438, NULL, 7, 'So với việc tự quản lý một cơ sở dữ liệu quan hệ trên một phiên bản EC2, lợi ích chính của việc sử dụng Amazon RDS là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(439, NULL, 7, 'Một ứng dụng web đang gặp phải tình trạng nghẽn cổ chai về hiệu suất do số lượng truy vấn đọc (read queries) cao trên cơ sở dữ liệu Amazon RDS của nó. Để giảm tải và cải thiện thông lượng đọc, tính năng RDS nào nên được triển khai?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(440, NULL, 7, 'Để kiểm soát quyền truy cập mạng vào một phiên bản Amazon RDS, đảm bảo rằng chỉ các máy chủ ứng dụng cụ thể mới có thể kết nối được, dịch vụ hoặc tính năng AWS nào nên được cấu hình?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(441, NULL, 7, 'Loại lưu trữ Amazon RDS nào thường được khuyến nghị cho các cơ sở dữ liệu sản xuất yêu cầu hiệu suất cao và hoạt động I/O nhất quán, phù hợp với các khối lượng công việc giao dịch (transactional workloads)?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(442, NULL, 7, 'tets', 'Essay', 'Easy', '.', NULL, '2025-11-16 09:03:28', '2025-11-16 09:03:28'),
(443, NULL, 7, 'test', 'Essay', 'Easy', '.', NULL, '2025-11-16 09:20:53', '2025-11-16 09:20:53'),
(445, NULL, 7, '.', 'Essay', 'Easy', '.', NULL, '2025-11-17 12:25:55', '2025-11-17 12:25:55'),
(446, NULL, 7, '.', 'Essay', 'Easy', '.', NULL, '2025-11-17 12:27:30', '2025-11-17 12:27:30'),
(447, NULL, 7, '.', 'Essay', 'Easy', '.', NULL, '2025-11-17 12:49:10', '2025-11-17 12:49:10'),
(448, NULL, 7, 'test 1', 'Essay', 'Easy', 'tets 1', NULL, '2025-11-17 12:50:23', '2025-11-17 12:50:23'),
(449, NULL, 7, 'Thuật toán CART viết tắt của cụm từ nào?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(450, NULL, 7, 'Thuật toán CART được sử dụng cho những loại bài toán nào trong khai thác dữ liệu?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(451, NULL, 7, 'Tiêu chí nào sau đây thường được sử dụng để đánh giá độ tinh khiết (purity) của các nút trong cây CART cho bài toán phân lớp?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(452, NULL, 7, 'Khi xây dựng cây CART cho bài toán hồi quy, tiêu chí phân tách (splitting criterion) phổ biến nhất là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(453, NULL, 7, 'Mục tiêu chính của thuật toán CART khi tìm một điểm phân tách tốt nhất tại một nút là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(454, NULL, 7, 'Quá trình \"tỉa cây\" (pruning) trong thuật toán CART được thực hiện với mục đích chính nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(455, NULL, 7, 'Điều gì xảy ra nếu một cây CART được huấn luyện quá sâu mà không có quá trình tỉa cây hoặc các ràng buộc về độ sâu?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(456, NULL, 7, 'Một nút lá (leaf node) trong cây quyết định CART đại diện cho điều gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(457, NULL, 7, 'Khi xử lý các biến liên tục trong CART, thuật toán tìm điểm phân tách tối ưu bằng cách nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(458, NULL, 7, 'Ưu điểm chính của cây quyết định CART so với một số mô hình phức tạp hơn là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(459, NULL, 7, 'Nhược điểm nào sau đây thường gặp ở cây quyết định CART?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(460, NULL, 7, 'Sự khác biệt cơ bản giữa tỉa cây trước (pre-pruning) và tỉa cây sau (post-pruning) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(461, NULL, 7, 'Chỉ số Gini Impurity được tính như thế nào cho một nút trong cây quyết định?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(462, NULL, 7, 'Đối với một bài toán phân lớp nhị phân, nếu một nút là \"tinh khiết\" (pure), giá trị Gini Impurity của nút đó sẽ là bao nhiêu?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(463, NULL, 7, 'Khi chọn một đặc trưng để phân tách tại một nút, CART sẽ tìm kiếm đặc trưng nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(464, NULL, 7, 'Thuật toán CART xử lý các biến phân loại (categorical variables) như thế nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(465, NULL, 7, 'Điều nào sau đây KHÔNG phải là một tiêu chí dừng phổ biến cho việc xây dựng cây CART?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(466, NULL, 7, 'Trong ngữ cảnh của cây CART, \"tầm quan trọng của đặc trưng\" (feature importance) thường được tính toán dựa trên yếu tố nào?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(467, NULL, 7, 'Khi nào thì một cây quyết định CART được coi là \"quá khớp\" (overfitting)?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(468, NULL, 7, 'Giả sử một cây CART đã được huấn luyện. Để đưa ra dự đoán cho một mẫu dữ liệu mới, quy trình nào sẽ được thực hiện?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30');

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
(784, 319, 'float', 0),
(785, 330, 'Google', 0),
(786, 330, 'Microsoft', 1),
(787, 330, 'Apple', 0),
(788, 330, 'Oracle', 0),
(789, 331, '.java', 0),
(790, 331, '.cpp', 0),
(791, 331, '.cs', 1),
(792, 331, '.c', 0),
(793, 332, '.NET', 1),
(794, 332, 'JVM', 0),
(795, 332, 'Android', 0),
(796, 332, 'Python', 0),
(797, 333, 'Khởi tạo đối tượng', 0),
(798, 333, 'Là điểm bắt đầu của chương trình', 1),
(799, 333, 'Khai báo biến', 0),
(800, 333, 'Gọi hàm', 0),
(801, 334, 'int', 1),
(802, 334, 'float', 0),
(803, 334, 'double', 0),
(804, 334, 'char', 0),
(805, 335, 'class', 1),
(806, 335, 'struct', 0),
(807, 335, 'interface', 0),
(808, 335, 'namespace', 0),
(809, 336, 'inherits', 0),
(810, 336, 'extends', 0),
(811, 336, 'base', 0),
(812, 336, ':', 1),
(813, 337, 'object', 0),
(814, 337, 'this', 0),
(815, 337, 'new', 1),
(816, 337, 'create', 0),
(817, 338, 'Tổ chức mã nguồn', 1),
(818, 338, 'Khai báo biến', 0),
(819, 338, 'Định nghĩa hàm', 0),
(820, 338, 'Gán giá trị', 0),
(821, 339, 'So sánh chuỗi', 0),
(822, 339, 'Chuyển đối tượng thành chuỗi', 1),
(823, 339, 'In ra màn hình', 0),
(824, 339, 'Xóa đối tượng', 0),
(825, 340, 'catch', 1),
(826, 340, 'if', 0),
(827, 340, 'while', 0),
(828, 340, 'switch', 0),
(829, 341, '()', 0),
(830, 341, '{}', 0),
(831, 341, '[]', 1),
(832, 341, '<>', 0),
(833, 342, 'loop', 0),
(834, 342, 'if', 1),
(835, 342, 'switch', 0),
(836, 342, 'case', 0),
(837, 343, 'Không', 0),
(838, 343, 'Có', 1),
(839, 343, 'Chỉ 1 phần', 0),
(840, 343, 'Chưa xác định', 0),
(841, 344, 'Eclipse', 0),
(842, 344, 'Visual Studio', 1),
(843, 344, 'IntelliJ', 0),
(844, 344, 'Code::Blocks', 0),
(845, 345, 'init', 0),
(846, 345, 'start', 0),
(847, 345, 'constructor', 1),
(848, 345, 'Main', 0),
(849, 346, 'Console.ReadLine()', 1),
(850, 346, 'Console.Write()', 0),
(851, 346, 'Input()', 0),
(852, 346, 'Read()', 0),
(853, 347, 'Console.Out()', 0),
(854, 347, 'Console.Print()', 0),
(855, 347, 'Console.WriteLine()', 1),
(856, 347, 'Write()', 0),
(857, 348, 'static', 0),
(858, 348, 'final', 0),
(859, 348, 'sealed', 1),
(860, 348, 'readonly', 0),
(861, 349, 'bool', 1),
(862, 349, 'int', 0),
(863, 349, 'string', 0),
(864, 349, 'float', 0),
(865, 350, 'Google', 0),
(866, 350, 'Microsoft', 1),
(867, 350, 'Apple', 0),
(868, 350, 'Oracle', 0),
(869, 351, '.java', 0),
(870, 351, '.cpp', 0),
(871, 351, '.cs', 1),
(872, 351, '.c', 0),
(873, 352, '.NET', 1),
(874, 352, 'JVM', 0),
(875, 352, 'Android', 0),
(876, 352, 'Python', 0),
(877, 353, 'Khởi tạo đối tượng', 0),
(878, 353, 'Là điểm bắt đầu của chương trình', 1),
(879, 353, 'Khai báo biến', 0),
(880, 353, 'Gọi hàm', 0),
(881, 354, 'int', 1),
(882, 354, 'float', 0),
(883, 354, 'double', 0),
(884, 354, 'char', 0),
(885, 355, 'class', 1),
(886, 355, 'struct', 0),
(887, 355, 'interface', 0),
(888, 355, 'namespace', 0),
(889, 356, 'inherits', 0),
(890, 356, 'extends', 0),
(891, 356, 'base', 0),
(892, 356, ':', 1),
(893, 357, 'object', 0),
(894, 357, 'this', 0),
(895, 357, 'new', 1),
(896, 357, 'create', 0),
(897, 358, 'Tổ chức mã nguồn', 1),
(898, 358, 'Khai báo biến', 0),
(899, 358, 'Định nghĩa hàm', 0),
(900, 358, 'Gán giá trị', 0),
(901, 359, 'So sánh chuỗi', 0),
(902, 359, 'Chuyển đối tượng thành chuỗi', 1),
(903, 359, 'In ra màn hình', 0),
(904, 359, 'Xóa đối tượng', 0),
(905, 360, 'catch', 1),
(906, 360, 'if', 0),
(907, 360, 'while', 0),
(908, 360, 'switch', 0),
(909, 361, '()', 0),
(910, 361, '{}', 0),
(911, 361, '[]', 1),
(912, 361, '<>', 0),
(913, 362, 'loop', 0),
(914, 362, 'if', 1),
(915, 362, 'switch', 0),
(916, 362, 'case', 0),
(917, 363, 'Không', 0),
(918, 363, 'Có', 1),
(919, 363, 'Chỉ 1 phần', 0),
(920, 363, 'Chưa xác định', 0),
(921, 364, 'Eclipse', 0),
(922, 364, 'Visual Studio', 1),
(923, 364, 'IntelliJ', 0),
(924, 364, 'Code::Blocks', 0),
(925, 365, 'init', 0),
(926, 365, 'start', 0),
(927, 365, 'constructor', 1),
(928, 365, 'Main', 0),
(929, 366, 'Console.ReadLine()', 1),
(930, 366, 'Console.Write()', 0),
(931, 366, 'Input()', 0),
(932, 366, 'Read()', 0),
(933, 367, 'Console.Out()', 0),
(934, 367, 'Console.Print()', 0),
(935, 367, 'Console.WriteLine()', 1),
(936, 367, 'Write()', 0),
(937, 368, 'static', 0),
(938, 368, 'final', 0),
(939, 368, 'sealed', 1),
(940, 368, 'readonly', 0),
(941, 369, 'bool', 1),
(942, 369, 'int', 0),
(943, 369, 'string', 0),
(944, 369, 'float', 0),
(945, 370, 'Lưu trữ dữ liệu cục bộ', 0),
(946, 370, 'Lưu trữ và xử lý dữ liệu qua Internet', 1),
(947, 370, 'Sử dụng phần cứng mạnh', 0),
(948, 370, 'Chia sẻ dữ liệu qua USB', 0),
(949, 371, 'Phần mềm', 0),
(950, 371, 'Cơ sở hạ tầng ảo hóa', 1),
(951, 371, 'Ứng dụng web', 0),
(952, 371, 'Máy tính để bàn', 0),
(953, 372, 'Software as a Service', 1),
(954, 372, 'System as a Software', 0),
(955, 372, 'Storage as a Server', 0),
(956, 372, 'Solution as a Software', 0),
(957, 373, 'SaaS', 1),
(958, 373, 'PaaS', 0),
(959, 373, 'IaaS', 0),
(960, 373, 'CaaS', 0),
(961, 374, 'Phần cứng vật lý', 0),
(962, 374, 'Nền tảng phát triển ứng dụng', 1),
(963, 374, 'Ứng dụng hoàn chỉnh', 0),
(964, 374, 'Cơ sở dữ liệu cục bộ', 0),
(965, 375, 'Nhà cung cấp dịch vụ đám mây', 1),
(966, 375, 'Phần mềm văn phòng', 0),
(967, 375, 'Thiết bị mạng', 0),
(968, 375, 'Trình duyệt web', 0),
(969, 376, 'Chi phí cao', 0),
(970, 376, 'Không bảo mật', 0),
(971, 376, 'Khả năng mở rộng và linh hoạt', 1),
(972, 376, 'Khó bảo trì', 0),
(973, 377, 'Qua Internet', 1),
(974, 377, 'Qua USB', 0),
(975, 377, 'Qua Bluetooth', 0),
(976, 377, 'Qua mạng LAN', 0),
(977, 378, 'Đám mây công cộng', 0),
(978, 378, 'Đám mây dùng riêng cho một tổ chức', 1),
(979, 378, 'Đám mây của Google', 0),
(980, 378, 'Đám mây chia sẻ', 0),
(981, 379, 'Dịch vụ đám mây công cộng', 1),
(982, 379, 'Dịch vụ đám mây cá nhân', 0),
(983, 379, 'Dịch vụ nội bộ', 0),
(984, 379, 'Dịch vụ không có Internet', 0),
(985, 380, 'Kết hợp giữa đám mây công cộng và riêng tư', 1),
(986, 380, 'Đám mây chỉ cho nội bộ', 0),
(987, 380, 'Đám mây offline', 0),
(988, 380, 'Không có thật', 0),
(989, 381, 'Điện năng', 0),
(990, 381, 'Chi phí đầu tư hạ tầng', 1),
(991, 381, 'Băng thông mạng', 0),
(992, 381, 'Dung lượng bộ nhớ RAM', 0),
(993, 382, 'Dịch vụ lưu trữ dữ liệu trực tuyến', 1),
(994, 382, 'Phần mềm diệt virus', 0),
(995, 382, 'Hệ điều hành', 0),
(996, 382, 'Ứng dụng văn phòng', 0),
(997, 383, 'Khả năng mở rộng linh hoạt', 1),
(998, 383, 'Tốc độ chậm', 0),
(999, 383, 'Phụ thuộc thiết bị', 0),
(1000, 383, 'Không thể chia sẻ', 0),
(1001, 384, 'PaaS', 0),
(1002, 384, 'SaaS', 1),
(1003, 384, 'IaaS', 0),
(1004, 384, 'CaaS', 0),
(1005, 385, 'Pay-as-you-go', 1),
(1006, 385, 'Trả phí cố định', 0),
(1007, 385, 'Miễn phí', 0),
(1008, 385, 'Gói trọn đời', 0),
(1009, 386, 'Tăng tốc CPU', 0),
(1010, 386, 'Tạo bản sao ảo của tài nguyên', 1),
(1011, 386, 'Sao lưu dữ liệu', 0),
(1012, 386, 'Chia sẻ mạng', 0),
(1013, 387, 'Chỉ một tổ chức sử dụng', 0),
(1014, 387, 'Chia sẻ tài nguyên giữa nhiều người dùng', 1),
(1015, 387, 'Không dùng Internet', 0),
(1016, 387, 'Miễn phí hoàn toàn', 0),
(1017, 388, 'Giảm chi phí hạ tầng và bảo trì', 1),
(1018, 388, 'Tăng chi phí phần cứng', 0),
(1019, 388, 'Phụ thuộc địa lý', 0),
(1020, 388, 'Cần nhân lực lớn hơn', 0),
(1021, 389, 'IaaS', 1),
(1022, 389, 'PaaS', 0),
(1023, 389, 'SaaS', 0),
(1024, 389, 'FaaS', 0),
(1025, 390, 'MVC', 1),
(1026, 390, 'MVT', 0),
(1027, 390, 'MVU', 0),
(1028, 390, 'MVP', 0),
(1029, 391, 'Quản lý giao diện', 0),
(1030, 391, 'Xử lý nghiệp vụ và điều hướng', 1),
(1031, 391, 'Quản lý dữ liệu', 0),
(1032, 391, 'Giao tiếp API', 0),
(1033, 392, 'Tăng tốc giao diện', 0),
(1034, 392, 'Tối ưu CSS', 0),
(1035, 392, 'Quản lý database bằng đối tượng', 1),
(1036, 392, 'Xử lý cache', 0),
(1037, 393, 'Stateless', 1),
(1038, 393, 'Stateful', 0),
(1039, 393, 'Đồng bộ tuyệt đối', 0),
(1040, 393, 'Luồng gắn kết chặt', 0),
(1041, 394, 'Giảm tính phụ thuộc giữa các module', 1),
(1042, 394, 'Tăng hiệu năng UI', 0),
(1043, 394, 'Tăng kích thước code', 0),
(1044, 394, 'Cải thiện CSS', 0),
(1045, 395, '.NET', 1),
(1046, 395, 'Angular', 0),
(1047, 395, 'Bootstrap', 0),
(1048, 395, 'Firebase', 0),
(1049, 396, 'Laravel', 0),
(1050, 396, '.NET Core', 0),
(1051, 396, 'Spring Boot', 0),
(1052, 396, 'Cả 3 đáp án trên', 1),
(1053, 397, 'Quản lý thay đổi cấu trúc DB', 1),
(1054, 397, 'Quản lý UI', 0),
(1055, 397, 'Tăng tốc API', 0),
(1056, 397, 'Xử lý lỗi runtime', 0),
(1057, 398, 'Setter', 0),
(1058, 398, 'Constructor', 0),
(1059, 398, 'Field Injection', 0),
(1060, 398, 'Tất cả loại trên', 1),
(1061, 399, 'Tách biệt nghiệp vụ khỏi UI & DB', 1),
(1062, 399, 'Quản lý giao diện', 0),
(1063, 399, 'Quản lý CSS', 0),
(1064, 399, 'Quản lý route', 0),
(1065, 400, 'Bảng trong DB', 1),
(1066, 400, 'File log', 0),
(1067, 400, 'Session', 0),
(1068, 400, 'API', 0),
(1069, 401, 'Truy cập dữ liệu có cấu trúc', 1),
(1070, 401, 'Tối ưu UI', 0),
(1071, 401, 'Quản lý thread', 0),
(1072, 401, 'Nén dữ liệu', 0),
(1073, 402, 'React', 0),
(1074, 402, 'Spring', 1),
(1075, 402, 'Django', 0),
(1076, 402, 'Flutter', 0),
(1077, 403, 'Tăng giao diện đẹp', 0),
(1078, 403, 'Chia tải xử lý giữa nhiều server', 1),
(1079, 403, 'Nén ảnh', 0),
(1080, 403, 'Tối ưu database', 0),
(1081, 404, 'Giảm truy vấn DB', 1),
(1082, 404, 'Giảm dung lượng RAM', 0),
(1083, 404, 'Tăng màu sắc UI', 0),
(1084, 404, 'Tăng số lượng route', 0),
(1085, 405, 'Mã hóa mật khẩu', 0),
(1086, 405, 'Xác thực người dùng', 1),
(1087, 405, 'Tối ưu API', 0),
(1088, 405, 'Render UI', 0),
(1089, 406, 'Tối ưu UI', 0),
(1090, 406, 'Đóng gói ứng dụng thành container dễ triển khai', 1),
(1091, 406, 'Làm đẹp CSS', 0),
(1092, 406, 'Tăng tốc HTML', 0),
(1093, 407, 'Tự động hóa build & deploy', 1),
(1094, 407, 'Tăng FPS', 0),
(1095, 407, 'Giảm băng thông', 0),
(1096, 407, 'Tăng RAM', 0),
(1097, 408, 'Các service độc lập', 1),
(1098, 408, 'Tất cả phụ thuộc chặt chẽ', 0),
(1099, 408, 'Chạy chung một tiến trình duy nhất', 0),
(1100, 408, 'Không giao tiếp với nhau', 0),
(1101, 409, 'Quản lý request vào toàn hệ thống', 1),
(1102, 409, 'Tăng dung lượng DB', 0),
(1103, 409, 'Gắn kết UI', 0),
(1104, 409, 'Biên dịch code', 0),
(1105, 431, 'Subnet', 0),
(1106, 431, 'Bảng định tuyến (Route Table)', 0),
(1107, 431, 'Nhóm bảo mật (Security Group)', 0),
(1108, 431, 'Khối CIDR (CIDR Block) của VPC', 1),
(1109, 432, 'Internet Gateway', 0),
(1110, 432, 'NAT Gateway', 1),
(1111, 432, 'Virtual Private Gateway', 0),
(1112, 432, 'VPC Endpoint', 0),
(1113, 433, 'Security Group là stateless, NACL là stateful.', 0),
(1114, 433, 'Security Group hoạt động ở cấp độ Subnet, NACL hoạt động ở cấp độ Instance.', 0),
(1115, 433, 'Security Group chỉ cho phép các luật \"ALLOW\" (ngầm định từ chối tất cả), trong khi NACL cho phép cả luật \"ALLOW\" và \"DENY\".', 1),
(1116, 433, 'Security Group xử lý lưu lượng truy cập ra (outbound) trước, NACL xử lý lưu lượng truy cập vào (inbound) trước.', 0),
(1117, 434, 'Network ACL', 0),
(1118, 434, 'Bảng định tuyến (Route Table)', 1),
(1119, 434, 'Nhóm bảo mật (Security Group)', 0),
(1120, 434, 'Peering Connection', 0),
(1121, 435, 'Địa chỉ IP riêng của instance.', 0),
(1122, 435, 'Địa chỉ IP công cộng của instance.', 1),
(1123, 435, 'Địa chỉ IP công cộng của NAT Gateway (nếu có sử dụng).', 0),
(1124, 435, 'Địa chỉ IP của Internet Gateway.', 0),
(1125, 437, 'Read Replicas', 0),
(1126, 437, 'Multi-AZ Deployment', 1),
(1127, 437, 'Database Snapshots', 0),
(1128, 437, 'Aurora Serverless', 0),
(1129, 438, 'Cung cấp quyền truy cập root hoàn toàn vào hệ điều hành cơ bản.', 0),
(1130, 438, 'Tự động hóa các tác vụ quản trị phổ biến như vá lỗi, sao lưu và nhân bản.', 1),
(1131, 438, 'Cho phép truy cập SSH trực tiếp vào máy chủ cơ sở dữ liệu.', 0),
(1132, 438, 'Cung cấp nhiều lựa chọn công cụ cơ sở dữ liệu hơn có thể cài đặt trên EC2.', 0),
(1133, 439, 'Kích hoạt triển khai Multi-AZ.', 0),
(1134, 439, 'Tăng kích thước lưu trữ của phiên bản chính.', 0),
(1135, 439, 'Tạo một hoặc nhiều Read Replicas.', 1),
(1136, 439, 'Nâng cấp phiên bản cơ sở dữ liệu chính lên một loại phiên bản EC2 lớn hơn.', 0),
(1137, 440, 'IAM Roles', 0),
(1138, 440, 'NACLs (Network Access Control Lists)', 0),
(1139, 440, 'Security Groups', 1),
(1140, 440, 'AWS WAF (Web Application Firewall)', 0),
(1141, 441, 'Standard Storage (Magnetic)', 0),
(1142, 441, 'General Purpose SSD (gp2/gp3)', 0),
(1143, 441, 'Provisioned IOPS SSD (io1/io2)', 1),
(1144, 441, 'EBS Cold HDD (sc1)', 0),
(1145, 449, 'Classification And Regression Trees', 1),
(1146, 449, 'Categorical And Recursive Trees', 0),
(1147, 449, 'Computational Algorithms for Regression and Trees', 0),
(1148, 449, 'Classification Algorithms for Random Trees', 0),
(1149, 450, 'Chỉ phân lớp (Classification)', 0),
(1150, 450, 'Chỉ hồi quy (Regression)', 0),
(1151, 450, 'Cả phân lớp và hồi quy', 1),
(1152, 450, 'Chỉ phân cụm (Clustering)', 0),
(1153, 451, 'Độ lỗi bình phương trung bình (Mean Squared Error - MSE)', 0),
(1154, 451, 'Chỉ số Gini (Gini Impurity)', 1),
(1155, 451, 'Sai số tuyệt đối trung bình (Mean Absolute Error - MAE)', 0),
(1156, 451, 'Hệ số tương quan (Correlation Coefficient)', 0),
(1157, 452, 'Entropy', 0),
(1158, 452, 'Chỉ số Gini', 0),
(1159, 452, 'Độ lỗi bình phương trung bình (Mean Squared Error - MSE)', 1),
(1160, 452, 'Tỷ lệ lỗi phân loại (Classification Error Rate)', 0),
(1161, 453, 'Tăng độ phức tạp của cây', 0),
(1162, 453, 'Giảm thiểu chi phí tính toán', 0),
(1163, 453, 'Tối đa hóa sự đồng nhất (homogeneity) của các nút con sau khi phân tách', 1),
(1164, 453, 'Đảm bảo mỗi nút con có số lượng mẫu bằng nhau', 0),
(1165, 454, 'Tăng tốc độ huấn luyện của cây', 0),
(1166, 454, 'Giảm thiểu nguy cơ quá khớp (overfitting)', 1),
(1167, 454, 'Tăng độ phức tạp của mô hình để xử lý dữ liệu lớn hơn', 0),
(1168, 454, 'Thay đổi loại bài toán từ phân lớp sang hồi quy', 0),
(1169, 455, 'Cây sẽ có hiệu suất kém trên tập huấn luyện', 0),
(1170, 455, 'Cây sẽ trở nên quá đơn giản (underfitting)', 0),
(1171, 455, 'Cây có thể bị quá khớp (overfitting) với dữ liệu huấn luyện', 1),
(1172, 455, 'Cây sẽ tự động chọn các đặc trưng quan trọng nhất', 0),
(1173, 456, 'Một điểm phân tách tiếp theo', 0),
(1174, 456, 'Điểm bắt đầu của cây (root node)', 0),
(1175, 456, 'Một dự đoán hoặc nhãn lớp cuối cùng', 1),
(1176, 456, 'Một điều kiện logic phức tạp', 0),
(1177, 457, 'Chia biến thành các khoảng bằng nhau ngẫu nhiên', 0),
(1178, 457, 'Thử tất cả các giá trị duy nhất của biến làm điểm phân tách', 1),
(1179, 457, 'Sử dụng các thuật toán tối ưu hóa phức tạp như Gradient Descent', 0),
(1180, 457, 'Chỉ xem xét các giá trị trung bình của biến', 0),
(1181, 458, 'Luôn đạt độ chính xác cao nhất trên mọi tập dữ liệu', 0),
(1182, 458, 'Không bị ảnh hưởng bởi dữ liệu ngoại lai (outliers)', 0),
(1183, 458, 'Dễ giải thích và trực quan hóa (interpretability)', 1),
(1184, 458, 'Yêu cầu ít dữ liệu huấn luyện hơn', 0),
(1185, 459, 'Khó xử lý dữ liệu có nhiều chiều (high-dimensional data)', 0),
(1186, 459, 'Khó xử lý các biến phân loại', 0),
(1187, 459, 'Có xu hướng không ổn định (instability) và nhạy cảm với những thay đổi nhỏ trong dữ liệu', 1),
(1188, 459, 'Không thể xử lý cả bài toán phân lớp và hồi quy', 0),
(1189, 460, 'Tỉa cây trước sử dụng chỉ số Gini, tỉa cây sau sử dụng Entropy.', 0),
(1190, 460, 'Tỉa cây trước ngăn không cho cây phát triển quá mức ngay từ đầu, tỉa cây sau cắt bớt cây sau khi nó đã phát triển đầy đủ.', 1),
(1191, 460, 'Tỉa cây trước chỉ áp dụng cho hồi quy, tỉa cây sau cho phân lớp.', 0),
(1192, 460, 'Tỉa cây trước cần tập kiểm định, tỉa cây sau thì không.', 0),
(1193, 461, 'G = sum(p_i * log(p_i))', 0),
(1194, 461, 'G = 1 - sum(p_i^2)', 1),
(1195, 461, 'G = 1 - max(p_i)', 0),
(1196, 461, 'G = sum(|y_i - y_mean|)', 0),
(1197, 462, '1.0', 0),
(1198, 462, '0.5', 0),
(1199, 462, '0.0', 1),
(1200, 462, 'Không thể xác định', 0),
(1201, 463, 'Đặc trưng có ít giá trị duy nhất nhất', 0),
(1202, 463, 'Đặc trưng có giá trị trung bình lớn nhất', 0),
(1203, 463, 'Đặc trưng mang lại sự giảm impurity (impurity reduction) lớn nhất', 1),
(1204, 463, 'Đặc trưng có mối tương quan mạnh nhất với các đặc trưng khác', 0),
(1205, 464, 'Chỉ sử dụng các biến nhị phân', 0),
(1206, 464, 'Biến đổi chúng thành các biến liên tục', 0),
(1207, 464, 'Tìm cách nhóm các giá trị phân loại thành hai tập con để tối ưu hóa sự phân tách', 1),
(1208, 464, 'Bỏ qua các biến phân loại', 0),
(1209, 465, 'Đạt đến độ sâu tối đa cho phép của cây', 0),
(1210, 465, 'Số lượng mẫu trong một nút nhỏ hơn ngưỡng tối thiểu', 0),
(1211, 465, 'Mức giảm độ tinh khiết (impurity decrease) sau khi phân tách không đáng kể', 0),
(1212, 465, 'Độ chính xác của cây đạt 100% trên tập kiểm định', 1),
(1213, 466, 'Số lần đặc trưng xuất hiện trong cây', 0),
(1214, 466, 'Tổng mức giảm độ tinh khiết mà đặc trưng đó mang lại trên toàn bộ cây', 1),
(1215, 466, 'Vị trí của đặc trưng trong tập dữ liệu ban đầu', 0),
(1216, 466, 'Độ phức tạp tính toán liên quan đến đặc trưng', 0),
(1217, 467, 'Khi nó có hiệu suất kém trên cả tập huấn luyện và tập kiểm định.', 0),
(1218, 467, 'Khi nó dự đoán sai trên tập huấn luyện nhưng chính xác trên tập kiểm định.', 0),
(1219, 467, 'Khi nó học quá chi tiết dữ liệu huấn luyện, dẫn đến hiệu suất tốt trên tập huấn luyện nhưng kém trên dữ liệu mới (tập kiểm định).', 1),
(1220, 467, 'Khi nó quá đơn giản để nắm bắt các mối quan hệ trong dữ liệu.', 0),
(1221, 468, 'Mẫu dữ liệu được đưa từ nút lá lên nút gốc để tìm ra đường đi.', 0),
(1222, 468, 'Mẫu dữ liệu được đưa từ nút gốc xuống các nút con theo các điều kiện phân tách cho đến khi đạt đến một nút lá, và giá trị của nút lá đó là dự đoán.', 1),
(1223, 468, 'Mẫu dữ liệu được so sánh với tất cả các mẫu trong tập huấn luyện.', 0),
(1224, 468, 'Thuật toán tạo lại cây từ đầu với mẫu dữ liệu mới.', 0);

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
-- Cấu trúc bảng cho bảng `score_audit_logs`
--

CREATE TABLE `score_audit_logs` (
  `log_id` int NOT NULL,
  `attempt_id` bigint NOT NULL,
  `question_id` bigint DEFAULT NULL,
  `old_score` decimal(10,2) DEFAULT NULL,
  `new_score` decimal(10,2) DEFAULT NULL COMMENT 'Điểm câu hỏi mới (NULL nếu chỉ thay đổi tổng điểm)',
  `old_total_score` decimal(10,2) DEFAULT NULL,
  `new_total_score` decimal(10,2) DEFAULT NULL COMMENT 'Tổng điểm mới (NULL nếu chỉ thay đổi điểm câu hỏi)',
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Lý do chỉnh sửa điểm (bắt buộc)',
  `edited_by` bigint NOT NULL COMMENT 'ID giáo viên chỉnh sửa',
  `edited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `score_audit_logs`
--

INSERT INTO `score_audit_logs` (`log_id`, `attempt_id`, `question_id`, `old_score`, `new_score`, `old_total_score`, `new_total_score`, `reason`, `edited_by`, `edited_at`) VALUES
(1, 41, 443, 0.00, 10.00, NULL, NULL, 'không cần', 7, '2025-11-16 02:22:47'),
(2, 41, NULL, NULL, NULL, 0.00, 10.00, 'không cần', 7, '2025-11-16 02:22:47'),
(3, 38, 410, 0.00, 10.00, NULL, NULL, 'lỗi sơ xuất chấm điểm', 7, '2025-11-17 05:07:40'),
(4, 38, NULL, NULL, NULL, 4.00, 0.00, 'lỗi sơ xuất chấm điểm', 7, '2025-11-17 05:07:40'),
(5, 38, 410, 0.00, 10.00, NULL, NULL, 'sơ xuất', 7, '2025-11-17 05:08:28'),
(6, 38, 410, 0.00, 10.00, NULL, NULL, '.', 7, '2025-11-17 05:12:48'),
(7, 38, 410, 0.00, 10.00, NULL, NULL, '.', 7, '2025-11-17 05:13:09'),
(8, 38, 410, 0.00, 8.00, NULL, NULL, ',', 7, '2025-11-17 05:22:46'),
(9, 38, NULL, NULL, NULL, 0.00, 8.00, ',', 7, '2025-11-17 05:22:46'),
(10, 42, 446, 0.00, 10.00, NULL, NULL, '.', 7, '2025-11-17 05:29:54'),
(11, 33, 326, 1.00, 10.00, NULL, NULL, '.', 7, '2025-11-17 05:38:11'),
(12, 33, NULL, NULL, NULL, 1.00, 10.00, '.', 7, '2025-11-17 05:38:11'),
(13, 42, 446, 10.00, 9.00, NULL, NULL, '.', 7, '2025-11-17 05:41:00'),
(14, 42, NULL, NULL, NULL, 10.00, 9.00, '.', 7, '2025-11-17 05:41:00'),
(15, 42, 446, 9.00, 10.00, NULL, NULL, 'sửa điểm', 7, '2025-11-17 05:43:35'),
(16, 42, NULL, NULL, NULL, 9.00, 10.00, 'sửa điểm', 7, '2025-11-17 05:43:35');

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
-- Cấu trúc bảng cho bảng `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('antiCheat.enableCopyPasteDetection', 'true', '2025-11-19 09:16:53'),
('antiCheat.enableTabSwitchDetection', 'true', '2025-11-19 09:16:53'),
('antiCheat.enableWebcamMonitoring', 'true', '2025-11-19 09:16:53'),
('antiCheat.maxWarnings', '3', '2025-11-19 09:16:53'),
('api.enableAPI', 'false', '2025-11-19 09:16:53'),
('api.enableFacebookIntegration', 'false', '2025-11-19 09:16:53'),
('api.enableGoogleIntegration', 'false', '2025-11-19 09:16:53'),
('api.facebookAppId', '\"\"', '2025-11-19 09:16:53'),
('api.googleClientId', '\"\"', '2025-11-19 09:16:53'),
('api.rateLimit', '100', '2025-11-19 09:16:53'),
('api.tokenExpiry', '60', '2025-11-19 09:16:53'),
('api.webhookOnExamEnd', 'false', '2025-11-19 09:16:53'),
('api.webhookOnExamStart', 'false', '2025-11-19 09:16:53'),
('api.webhookUrl', '\"\"', '2025-11-19 09:16:53'),
('backup.compress', 'true', '2025-11-19 09:16:53'),
('backup.includeFiles', 'true', '2025-11-19 09:16:53'),
('backup.retention', '7', '2025-11-19 09:16:53'),
('backup.schedule', '\"weekly\"', '2025-11-19 09:16:53'),
('display.compactMode', 'false', '2025-11-19 09:16:53'),
('display.fontSize', '\"medium\"', '2025-11-19 09:16:53'),
('display.itemsPerPage', '25', '2025-11-19 09:16:53'),
('display.language', '\"vi\"', '2025-11-19 09:16:53'),
('display.primaryColor', '\"#7abd94\"', '2025-11-19 09:16:53'),
('display.showAnimations', 'true', '2025-11-19 09:16:53'),
('display.showTooltips', 'true', '2025-11-19 09:16:53'),
('email.emailFromName', '\"\"', '2025-11-19 09:16:53'),
('email.smtpEmail', '\"\"', '2025-11-19 09:16:53'),
('email.smtpHost', '\"\"', '2025-11-19 09:16:53'),
('email.smtpPort', 'null', '2025-11-19 09:16:53'),
('email.smtpSecure', '\"tls\"', '2025-11-19 09:16:53'),
('exam.defaultDuration', '60', '2025-11-19 09:16:53'),
('exam.defaultPassingScore', '5', '2025-11-19 09:16:53'),
('exam.enableAutoSubmit', 'true', '2025-11-19 09:16:53'),
('exam.enableReviewBeforeSubmit', 'true', '2025-11-19 09:16:53'),
('logs.cpuThreshold', '80', '2025-11-19 09:16:53'),
('logs.enableSystemMonitoring', 'false', '2025-11-19 09:16:53'),
('logs.level', '\"info\"', '2025-11-19 09:16:53'),
('logs.logAPIRequests', 'false', '2025-11-19 09:16:53'),
('logs.logUserActions', 'false', '2025-11-19 09:16:53'),
('logs.maxFileSize', '10', '2025-11-19 09:16:53'),
('logs.monitoringInterval', '5', '2025-11-19 09:16:53'),
('logs.ramThreshold', '85', '2025-11-19 09:16:53'),
('notification.enableEmail', 'false', '2025-11-19 09:16:53'),
('notification.notifyExamEnd', 'true', '2025-11-19 09:16:53'),
('notification.notifyExamStart', 'true', '2025-11-19 09:16:53'),
('notification.notifyScoreAvailable', 'true', '2025-11-19 09:16:53'),
('performance.cacheDuration', '3600', '2025-11-19 09:16:53'),
('performance.cdnUrl', '\"\"', '2025-11-19 09:16:53'),
('performance.dbPoolSize', '10', '2025-11-19 09:16:53'),
('performance.enableCDN', 'false', '2025-11-19 09:16:53'),
('performance.enableGzip', 'false', '2025-11-19 09:16:53'),
('performance.enableImageOptimization', 'false', '2025-11-19 09:16:53'),
('performance.enableQueryCache', 'false', '2025-11-19 09:16:53'),
('performance.imageQuality', '80', '2025-11-19 09:16:53'),
('performance.maxImageSize', '5', '2025-11-19 09:16:53'),
('performance.queryCacheDuration', '300', '2025-11-19 09:16:53'),
('security.accountLockoutDuration', '15', '2025-11-19 09:16:53'),
('security.enableIPWhitelist', 'false', '2025-11-19 09:16:53'),
('security.enableTwoFactor', 'false', '2025-11-19 09:16:53'),
('security.maxLoginAttempts', '5', '2025-11-19 09:16:53'),
('security.requireStrongPassword', 'false', '2025-11-19 09:16:53'),
('security.sessionTimeout', '30', '2025-11-19 09:16:53'),
('system.autoSaveInterval', '60', '2025-11-19 09:16:53'),
('system.backupFrequency', '7', '2025-11-19 09:16:53'),
('system.enableCaching', 'true', '2025-11-19 09:16:53'),
('system.enableMaintenanceMode', 'false', '2025-11-19 09:16:53'),
('system.logRetentionDays', '30', '2025-11-19 09:16:53'),
('system.questionsPerPage', '20', '2025-11-19 09:16:53'),
('user.allowStudentRegistration', 'true', '2025-11-19 09:16:53'),
('user.maxStudentsPerClass', '50', '2025-11-19 09:16:53'),
('user.minPasswordLength', '8', '2025-11-19 09:16:53'),
('user.passwordExpiryDays', '90', '2025-11-19 09:16:53'),
('user.preventPasswordReuse', 'false', '2025-11-19 09:16:53'),
('user.requireEmailVerification', 'false', '2025-11-19 09:16:53');

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
  `password_hash` varchar(255) DEFAULT NULL COMMENT 'Mật khẩu đã hash. NULL nếu đăng nhập bằng Google OAuth',
  `google_id` varchar(255) DEFAULT NULL COMMENT 'Google OAuth ID để liên kết tài khoản Google',
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `role` enum('Student','Teacher','Admin') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(15) DEFAULT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL COMMENT 'Giới tính: male (Nam), female (Nữ), other (Khác)',
  `class_id` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `google_id`, `email`, `full_name`, `role`, `created_at`, `updated_at`, `phone`, `dob`, `gender`, `class_id`) VALUES
(1, 'admin', '$2b$10$ZERYixpbgC0.62btiNvUn.d8fuqWQ.lPXsAgwig1ZDLatLZNK35BK', NULL, 'admin@edexis.com', 'Admin', 'Admin', '2025-10-04 09:52:29', '2025-10-15 13:44:03', NULL, NULL, NULL, NULL),
(4, 'thu', '$2b$10$NdaaaYBwM3Rfj3./sVSgMODdPsYF/1IjS2iJkB9YKWdV.epa71pcG', NULL, 'th@gmail.com', 'Bùi Đức Thuần', 'Student', '2025-10-04 13:20:43', '2025-11-18 16:35:09', '0399697281', '2005-03-17', 'male', NULL),
(5, 'thao', '$2b$10$OdKcmlA0f3yIulShiJvNbu8s1MG91mITzFRkvsDj6X.iciu88n3gy', NULL, 'zxc@gmail.com', 'thao', 'Teacher', '2025-10-04 20:09:10', '2025-10-04 20:09:10', NULL, NULL, NULL, NULL),
(7, 'thao123', '$2b$10$NKbXGUGDermaTd69S7cx3O/nPmEnzGqLIuRaC9MV4rso3QuJHFSnu', NULL, 'tha@gamil.com', 'thao123', 'Teacher', '2025-10-11 16:49:53', '2025-10-11 16:49:53', NULL, NULL, NULL, NULL),
(8, 'nguyen', '$2b$10$Uh08rbrmSb9Se4VFs8pvl.eUidsaTexnVtJNDgMo3zmXv/tsMeKW.', NULL, 'ng@gmail.com', 'nguyen', 'Student', '2025-10-22 09:08:52', '2025-10-22 09:08:52', NULL, NULL, NULL, NULL),
(10, 'maipanh35', NULL, '117451791166846615134', 'maipanh35@gmail.com', 'Phương Anh', 'Teacher', '2025-11-18 16:22:55', '2025-11-18 16:22:55', NULL, NULL, NULL, NULL),
(11, 'lan258079a', '$2b$10$HdMTaiw892QkORRxiA8MiOEpV8G.mztjwnFAj7qlEfwwDYhNK1dbW', '103657516417655516305', 'lan258079a@gmail.com', 'Thanh Lan', 'Student', '2025-11-18 16:25:03', '2025-11-18 16:26:12', NULL, NULL, NULL, NULL);

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
-- Chỉ mục cho bảng `backup_history`
--
ALTER TABLE `backup_history`
  ADD PRIMARY KEY (`backup_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_created_by` (`created_by`);

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
-- Chỉ mục cho bảng `otps`
--
ALTER TABLE `otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_expiresAt` (`expiresAt`),
  ADD KEY `idx_verified` (`verified`);

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
-- Chỉ mục cho bảng `score_audit_logs`
--
ALTER TABLE `score_audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `idx_attempt_id` (`attempt_id`),
  ADD KEY `idx_edited_by` (`edited_by`),
  ADD KEY `idx_edited_at` (`edited_at`);

--
-- Chỉ mục cho bảng `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Chỉ mục cho bảng `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`),
  ADD KEY `idx_updated_at` (`updated_at`);

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
  ADD KEY `class_id` (`class_id`),
  ADD KEY `idx_google_id` (`google_id`);

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
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT cho bảng `backup_history`
--
ALTER TABLE `backup_history`
  MODIFY `backup_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `complaints`
--
ALTER TABLE `complaints`
  MODIFY `complaint_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `exams`
--
ALTER TABLE `exams`
  MODIFY `exam_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=83;

--
-- AUTO_INCREMENT cho bảng `exam_attempts`
--
ALTER TABLE `exam_attempts`
  MODIFY `attempt_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT cho bảng `import_logs`
--
ALTER TABLE `import_logs`
  MODIFY `import_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=205;

--
-- AUTO_INCREMENT cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  MODIFY `question_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=469;

--
-- AUTO_INCREMENT cho bảng `question_options`
--
ALTER TABLE `question_options`
  MODIFY `option_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1225;

--
-- AUTO_INCREMENT cho bảng `score_audit_logs`
--
ALTER TABLE `score_audit_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

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
  MODIFY `user_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
-- Các ràng buộc cho bảng `score_audit_logs`
--
ALTER TABLE `score_audit_logs`
  ADD CONSTRAINT `score_audit_logs_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `exam_attempts` (`attempt_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `score_audit_logs_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `score_audit_logs_ibfk_3` FOREIGN KEY (`edited_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
