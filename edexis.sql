-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: localhost
-- Thời gian đã tạo: Th10 30, 2025 lúc 06:24 AM
-- Phiên bản máy phục vụ: 8.4.3
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
-- Cấu trúc bảng cho bảng `ai_system_quota`
--

CREATE TABLE `ai_system_quota` (
  `quota_id` int NOT NULL,
  `date` date NOT NULL,
  `provider` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'groq hoặc gemini',
  `total_requests` int DEFAULT '0',
  `total_tokens` bigint DEFAULT '0',
  `limit_requests` int DEFAULT '100' COMMENT 'Giới hạn requests/ngày',
  `limit_tokens` bigint DEFAULT '250000' COMMENT 'Giới hạn tokens/ngày',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ai_system_quota`
--

INSERT INTO `ai_system_quota` (`quota_id`, `date`, `provider`, `total_requests`, `total_tokens`, `limit_requests`, `limit_tokens`, `updated_at`) VALUES
(1, '2025-11-28', 'groq', 3, 0, 100, 250000, '2025-11-28 23:59:01'),
(3, '2025-11-30', 'groq', 1, 0, 100, 250000, '2025-11-30 08:53:56');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `ai_usage_logs`
--

CREATE TABLE `ai_usage_logs` (
  `log_id` int NOT NULL,
  `user_id` bigint NOT NULL,
  `provider` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'groq hoặc gemini',
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'create_practice_exam, create_exam, etc',
  `tokens_used` int DEFAULT '0',
  `practice_exam_id` int DEFAULT NULL,
  `exam_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_date` date GENERATED ALWAYS AS (cast(`created_at` as date)) STORED,
  `created_week` int GENERATED ALWAYS AS (yearweek(`created_at`,0)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `ai_usage_logs`
--

INSERT INTO `ai_usage_logs` (`log_id`, `user_id`, `provider`, `action_type`, `tokens_used`, `practice_exam_id`, `exam_id`, `created_at`) VALUES
(1, 7, 'groq', 'create_exam', 0, NULL, NULL, '2025-11-28 23:46:28'),
(2, 7, 'groq', 'create_exam', 0, NULL, NULL, '2025-11-28 23:51:25'),
(3, 4, 'groq', 'create_practice_exam', 0, 1, NULL, '2025-11-28 23:59:01'),
(4, 4, 'groq', 'create_practice_exam', 0, 2, NULL, '2025-11-30 08:53:56');

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
(24, 43, 'WebcamSuspicious', 'Không thể truy cập webcam', '2025-11-18 08:01:05'),
(39, 65, 'TabSwitch', 'Chuyển tab lần 1', '2025-11-28 22:18:17');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `backup_history`
--

CREATE TABLE `backup_history` (
  `backup_id` int NOT NULL,
  `backup_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
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
(7, '26th02', 3, 7, '2025-10-15 08:57:13', NULL, '', '2024-2025', 'CLSKL6J0W', '💻', 'active'),
(8, '26th01', 4, 7, '2025-11-30 08:37:21', NULL, '', '2025-2026', 'CLS9DT8V7', '💻', 'deleted');

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
(6, 16, '2025-11-28 13:01:58'),
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
(3, 4, 79, 'tets khiếu nại lần 3', 'Điểm đã được chỉnh sửa. Lý do: sửa điểm. Điểm mới: 10.0 điểm.', 'Resolved', '2025-11-17 12:42:51', '2025-11-17 05:43:35'),
(4, 4, 82, 'ngu như chó', NULL, 'Pending', '2025-11-18 08:04:42', NULL),
(6, 4, 107, 'tets sửa điểm', 'Điểm đã được chỉnh sửa. Lý do: tets sửa điểm của giáo viên to học sinh. Điểm mới: 1.5 điểm.', 'Resolved', '2025-11-29 09:19:23', '2025-11-29 02:20:57');

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
(54, 'test 11', 2, 7, 9, '2025-10-31 18:15:00', NULL, NULL, 0, 0, 0, '2025-10-31 18:13:54', 6, 'Đề thi tạo thủ công', 'upcoming'),
(74, 'điện toán đám mây - rds', 3, 7, 10, '2025-11-15 10:35:00', NULL, '133906', 0, 0, 0, '2025-11-15 10:34:49', 7, 'Đề thi được tạo tự động bằng AI - điện toán đám mây: rds', 'upcoming'),
(79, 'tets chấm điểm', 3, 7, 9, '2025-11-17 12:29:00', NULL, '939935', 0, 0, 0, '2025-11-17 12:27:30', 7, 'Đề thi tạo thủ công', 'upcoming'),
(82, 'nhập môn khai thác dữ liệu - thuật toán cart', 3, 7, 14, '2025-11-18 08:00:00', NULL, '400216', 0, 0, 0, '2025-11-18 07:56:29', 7, 'Đề thi được tạo tự động bằng AI - nhập môn khai thác dữ liệu: thuật toán cart', 'upcoming'),
(83, 'tets abc', 3, 7, 5, '2025-11-20 19:42:00', NULL, '815413', 0, 0, 0, '2025-11-20 19:40:23', 7, 'Đề thi tạo thủ công', 'upcoming'),
(107, 'Lập trình C#.NET - Kiểm Tra', 2, 7, 20, '2025-11-28 22:17:00', NULL, '235428', 0, 1, 1, '2025-11-28 22:16:36', 6, 'Đề thi được tạo tự động bằng AI - Lập trình C#.NET: Kiểm Tra', 'upcoming');

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
(39, 74, 4, '2025-11-15 10:35:23', '2025-11-15 10:39:30', 9.00, 'Submitted', 1, '2025-11-15 10:35:23', 0, 0.00, 1, 'Bị trừ 1 điểm (10% điểm trắc nghiệm) do chuyển tab 12 lần (vượt quá giới hạn 3 lần)', 1.00),
(42, 79, 4, '2025-11-17 12:29:18', '2025-11-17 12:29:25', 10.00, 'Submitted', 1, '2025-11-17 12:29:18', 0, 0.00, 1, NULL, 0.00),
(43, 82, 4, '2025-11-18 08:00:58', '2025-11-18 08:03:35', 4.00, 'Submitted', 1, '2025-11-18 08:00:58', 0, 0.00, 1, NULL, 0.00),
(44, 83, 4, '2025-11-20 19:42:11', '2025-11-20 19:42:23', 10.00, 'Submitted', 1, '2025-11-20 19:42:11', 0, 0.00, 0, NULL, 0.00),
(65, 107, 4, '2025-11-28 22:17:36', '2025-11-28 22:18:14', 1.50, 'Submitted', 1, '2025-11-28 22:17:36', 0, 0.00, 1, NULL, 0.00),
(66, 107, 8, '2025-11-28 22:32:05', '2025-11-28 22:32:32', 1.50, 'Submitted', 1, '2025-11-28 22:32:05', 0, 0.00, 0, NULL, 0.00);

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
(39, 437, 1125, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 438, 1130, NULL, 1, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 439, 1133, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 440, 1137, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
(39, 441, 1141, NULL, 0, NULL, NULL, 0, '2025-11-15 10:39:30', NULL, NULL),
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
(43, 468, 1222, NULL, 1, NULL, NULL, 0, '2025-11-18 08:03:35', NULL, NULL),
(44, 469, NULL, 'hello', 0, 10.00, '', 1, '2025-11-20 19:42:23', 7, '2025-11-20 19:42:42'),
(65, 830, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 831, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 832, 2755, NULL, 1, 0.50, '', 1, '2025-11-28 22:18:14', 7, '2025-11-29 09:20:57'),
(65, 833, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 834, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 835, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 836, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 837, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 838, 2780, NULL, 0, 0.50, '', 1, '2025-11-28 22:18:14', 7, '2025-11-29 09:20:57'),
(65, 839, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 840, 2785, NULL, 0, 0.50, '', 1, '2025-11-28 22:18:14', 7, '2025-11-29 09:20:57'),
(65, 841, 2792, NULL, 0, 0.00, '', 1, '2025-11-28 22:18:14', 7, '2025-11-29 09:20:57'),
(65, 842, 2796, NULL, 0, 0.00, '', 1, '2025-11-28 22:18:14', 7, '2025-11-29 09:20:57'),
(65, 843, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 844, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 845, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 846, 2812, NULL, 0, 0.00, '', 1, '2025-11-28 22:18:14', 7, '2025-11-29 09:20:57'),
(65, 847, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 848, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(65, 849, NULL, NULL, NULL, 0.00, '', 1, '2025-11-29 09:20:57', 7, '2025-11-29 09:20:57'),
(66, 832, 2754, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 834, 2761, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 835, 2766, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 836, 2772, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 837, 2776, NULL, 1, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 838, 2780, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 839, 2783, NULL, 1, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 845, 2805, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 848, 2817, NULL, 0, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL),
(66, 849, 2822, NULL, 1, NULL, NULL, 0, '2025-11-28 22:32:31', NULL, NULL);

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
(74, 437, 1, 10.00),
(74, 438, 2, 10.00),
(74, 439, 3, 10.00),
(74, 440, 4, 10.00),
(74, 441, 5, 10.00),
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
(82, 468, 20, 0.50),
(83, 469, 1, 10.00),
(107, 830, 1, 0.50),
(107, 831, 2, 0.50),
(107, 832, 3, 0.50),
(107, 833, 4, 0.50),
(107, 834, 5, 0.50),
(107, 835, 6, 0.50),
(107, 836, 7, 0.50),
(107, 837, 8, 0.50),
(107, 838, 9, 0.50),
(107, 839, 10, 0.50),
(107, 840, 11, 0.50),
(107, 841, 12, 0.50),
(107, 842, 13, 0.50),
(107, 843, 14, 0.50),
(107, 844, 15, 0.50),
(107, 845, 16, 0.50),
(107, 846, 17, 0.50),
(107, 847, 18, 0.50),
(107, 848, 19, 0.50),
(107, 849, 20, 0.50);

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
-- Cấu trúc bảng cho bảng `materials`
--

CREATE TABLE `materials` (
  `material_id` int NOT NULL,
  `class_id` int UNSIGNED NOT NULL,
  `teacher_id` int UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'pdf, docx, xlsx, pptx, etc.',
  `file_size` int NOT NULL COMMENT 'bytes',
  `upload_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `materials`
--

INSERT INTO `materials` (`material_id`, `class_id`, `teacher_id`, `title`, `description`, `file_name`, `file_path`, `file_type`, `file_size`, `upload_date`, `updated_at`) VALUES
(2, 6, 7, 'c# và net', NULL, 'C# va Net Framework.pdf', 'D:\\laragon\\www\\Edexis-web\\server\\uploads\\materials\\material-1764340226572-232052761.pdf', '.pdf', 4145761, '2025-11-28 21:30:26', '2025-11-28 21:30:26');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `material_cache`
--

CREATE TABLE `material_cache` (
  `material_id` int NOT NULL,
  `extracted_content` longtext COLLATE utf8mb4_unicode_ci,
  `word_count` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `material_cache`
--

INSERT INTO `material_cache` (`material_id`, `extracted_content`, `word_count`, `created_at`, `updated_at`) VALUES
(2, 'PDF file detected. Please install pdf-parse package for full support.\nFor now, you can use AI to extract text from PDF.', 21, '2025-11-28 23:54:56', '2025-11-28 23:54:56');

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
(204, 7, 'Học sinh thuan đã gửi khiếu nại về bài thi \"nhập môn khai thác dữ liệu - thuật toán cart\" (Lớp 26th02)', 'Warning', 1, '2025-11-18 08:04:42', 4, 'Comp'),
(205, 7, 'Bài thi \"tets abc\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-20 19:40:23', 83, 'Exam'),
(206, 7, 'Đã thêm câu hỏi mới: \"alo alo...\"', 'Info', 1, '2025-11-20 19:40:23', 469, 'Question'),
(207, 4, 'Bài thi \"tets abc\" của bạn đã được chấm điểm. Điểm số: 10.0 điểm', 'Info', 0, '2025-11-20 19:42:42', 83, 'Exam'),
(208, 7, 'Bài thi \"kiến trúc máy tính - kiến thức cơ bản về pc\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-20 19:45:52', 84, 'Exam'),
(209, 7, 'Đã thêm câu hỏi mới: \"Bộ phận nào sau đây được coi là \'bộ não\' của máy t...\"', 'Info', 1, '2025-11-20 19:45:52', 470, 'Question'),
(210, 7, 'Đã thêm câu hỏi mới: \"RAM (Random Access Memory) có chức năng chính là g...\"', 'Info', 1, '2025-11-20 19:45:52', 471, 'Question'),
(211, 7, 'Đã thêm câu hỏi mới: \"Thiết bị nào sau đây là một thiết bị đầu vào (inpu...\"', 'Info', 1, '2025-11-20 19:45:52', 472, 'Question'),
(212, 7, 'Đã thêm câu hỏi mới: \"Ổ đĩa cứng (Hard Disk Drive - HDD) được sử dụng ch...\"', 'Info', 1, '2025-11-20 19:45:53', 473, 'Question'),
(213, 7, 'Đã thêm câu hỏi mới: \"Thành phần nào trên bo mạch chủ (mainboard) chịu t...\"', 'Info', 1, '2025-11-20 19:45:53', 474, 'Question'),
(214, 7, 'Đã thêm câu hỏi mới: \"GPU (Graphics Processing Unit) có vai trò chính là...\"', 'Info', 1, '2025-11-20 19:45:53', 475, 'Question'),
(215, 7, 'Đã thêm câu hỏi mới: \"Thiết bị nào sau đây là một thiết bị đầu ra (outpu...\"', 'Info', 1, '2025-11-20 19:45:53', 476, 'Question'),
(216, 7, 'Đã thêm câu hỏi mới: \"Hệ điều hành (Operating System - OS) là gì?...\"', 'Info', 1, '2025-11-20 19:45:53', 477, 'Question'),
(217, 7, 'Đã thêm câu hỏi mới: \"Cổng USB (Universal Serial Bus) được sử dụng để là...\"', 'Info', 1, '2025-11-20 19:45:53', 478, 'Question'),
(218, 7, 'Đã thêm câu hỏi mới: \"Thành phần nào có nhiệm vụ chuyển đổi dòng điện xo...\"', 'Info', 1, '2025-11-20 19:45:53', 479, 'Question'),
(219, 7, 'Đã thêm câu hỏi mới: \"ROM (Read-Only Memory) có đặc điểm nổi bật nào?...\"', 'Info', 1, '2025-11-20 19:45:53', 480, 'Question'),
(220, 7, 'Đã thêm câu hỏi mới: \"Một màn hình máy tính được phân loại là loại thiết...\"', 'Info', 1, '2025-11-20 19:45:53', 481, 'Question'),
(221, 7, 'Đã thêm câu hỏi mới: \"Để kết nối máy tính với mạng Internet có dây, chún...\"', 'Info', 1, '2025-11-20 19:45:53', 482, 'Question'),
(222, 7, 'Đã thêm câu hỏi mới: \"Phần mềm (Software) là gì?...\"', 'Info', 1, '2025-11-20 19:45:53', 483, 'Question'),
(223, 7, 'Đã thêm câu hỏi mới: \"Đơn vị đo tốc độ xử lý của CPU thường là gì?...\"', 'Info', 1, '2025-11-20 19:45:53', 484, 'Question'),
(224, 7, 'Đã thêm câu hỏi mới: \"SSD (Solid State Drive) có ưu điểm chính nào so vớ...\"', 'Info', 1, '2025-11-20 19:45:53', 485, 'Question'),
(225, 7, 'Đã thêm câu hỏi mới: \"Bộ phận nào giúp tản nhiệt cho CPU để tránh quá nó...\"', 'Info', 1, '2025-11-20 19:45:53', 486, 'Question'),
(226, 7, 'Đã thêm câu hỏi mới: \"BIOS (Basic Input/Output System) được lưu trữ ở đâ...\"', 'Info', 1, '2025-11-20 19:45:53', 487, 'Question'),
(227, 7, 'Đã thêm câu hỏi mới: \"Phím tắt thông dụng nào dùng để sao chép (copy) vă...\"', 'Info', 1, '2025-11-20 19:45:53', 488, 'Question'),
(228, 7, 'Đã thêm câu hỏi mới: \"Bo mạch chủ (Motherboard) có vai trò chính là gì?...\"', 'Info', 1, '2025-11-20 19:45:53', 489, 'Question'),
(229, 7, 'Bài thi \"mạng máy tính - kiến thức cơ bản về mạng máy tính\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 20:42:18', 85, 'Exam'),
(230, 7, 'Đã thêm câu hỏi mới: \"Mạng máy tính là gì?...\"', 'Info', 1, '2025-11-20 20:42:18', 490, 'Question'),
(231, 7, 'Đã thêm câu hỏi mới: \"Viết tắt LAN trong mạng máy tính có nghĩa là gì?...\"', 'Info', 1, '2025-11-20 20:42:18', 491, 'Question'),
(232, 7, 'Đã thêm câu hỏi mới: \"Thiết bị mạng nào hoạt động ở tầng vật lý (Physica...\"', 'Info', 1, '2025-11-20 20:42:19', 492, 'Question'),
(233, 7, 'Đã thêm câu hỏi mới: \"Địa chỉ IP (Internet Protocol) có chức năng chính ...\"', 'Info', 1, '2025-11-20 20:42:19', 493, 'Question'),
(234, 7, 'Đã thêm câu hỏi mới: \"Giao thức nào được sử dụng để phân giải tên miền (...\"', 'Info', 1, '2025-11-20 20:42:19', 494, 'Question'),
(235, 7, 'Đã thêm câu hỏi mới: \"Trong mô hình OSI, tầng nào chịu trách nhiệm cho v...\"', 'Info', 1, '2025-11-20 20:42:19', 495, 'Question'),
(236, 7, 'Đã thêm câu hỏi mới: \"Trong mô hình TCP/IP, tầng nào tương đương với sự ...\"', 'Info', 1, '2025-11-20 20:42:19', 496, 'Question'),
(237, 7, 'Đã thêm câu hỏi mới: \"Sự khác biệt cơ bản nhất giữa giao thức TCP (Trans...\"', 'Info', 1, '2025-11-20 20:42:19', 497, 'Question'),
(238, 7, 'Đã thêm câu hỏi mới: \"Thiết bị mạng nào chịu trách nhiệm chính trong việ...\"', 'Info', 1, '2025-11-20 20:42:19', 498, 'Question'),
(239, 7, 'Đã thêm câu hỏi mới: \"Khi bạn truy cập một trang web bảo mật (ví dụ: ngâ...\"', 'Info', 1, '2025-11-20 20:42:19', 499, 'Question'),
(240, 7, 'Đã thêm câu hỏi mới: \"Địa chỉ MAC (Media Access Control) là gì?...\"', 'Info', 1, '2025-11-20 20:42:19', 500, 'Question'),
(241, 7, 'Đã thêm câu hỏi mới: \"Giao thức DHCP (Dynamic Host Configuration Protoco...\"', 'Info', 1, '2025-11-20 20:42:19', 501, 'Question'),
(242, 7, 'Đã thêm câu hỏi mới: \"Cổng (port) dịch vụ nào thường được sử dụng cho gi...\"', 'Info', 1, '2025-11-20 20:42:19', 502, 'Question'),
(243, 7, 'Đã thêm câu hỏi mới: \"Lớp nào của địa chỉ IPv4 (Class A, B, C) thường đư...\"', 'Info', 1, '2025-11-20 20:42:19', 503, 'Question'),
(244, 7, 'Đã thêm câu hỏi mới: \"Loại cáp mạng nào là phổ biến nhất hiện nay cho cá...\"', 'Info', 1, '2025-11-20 20:42:19', 504, 'Question'),
(245, 7, 'Đã thêm câu hỏi mới: \"Khi một máy tính trong mạng LAN gửi một gói tin tớ...\"', 'Info', 1, '2025-11-20 20:42:19', 505, 'Question'),
(246, 7, 'Đã thêm câu hỏi mới: \"Một quản trị viên mạng cần chia một mạng con có đị...\"', 'Info', 1, '2025-11-20 20:42:19', 506, 'Question'),
(247, 7, 'Đã thêm câu hỏi mới: \"Sự khác biệt cốt lõi giữa IPv4 và IPv6, ngoài kích...\"', 'Info', 1, '2025-11-20 20:42:19', 507, 'Question'),
(248, 7, 'Đã thêm câu hỏi mới: \"Tường lửa (Firewall) hoạt động chủ yếu ở những tần...\"', 'Info', 1, '2025-11-20 20:42:19', 508, 'Question'),
(249, 7, 'Đã thêm câu hỏi mới: \"Trong mô hình Client-Server, vai trò chính của Ser...\"', 'Info', 1, '2025-11-20 20:42:19', 509, 'Question'),
(250, 7, 'Bài thi \"Androi\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 20:56:04', 86, 'Exam'),
(251, 7, 'Bài thi \"test \" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:02:48', 87, 'Exam'),
(252, 7, 'Bài thi \"test import\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:08:31', 88, 'Exam'),
(253, 7, 'Bài thi \"tets import\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:12:03', 89, 'Exam'),
(254, 7, 'Bài thi \"Bài thi từ Excel - 21:13:37 20/11/2025\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:13:37', 90, 'Exam'),
(255, 7, 'Bài thi \"test import\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:15:55', 91, 'Exam'),
(256, 7, 'Đã nhập 20 câu hỏi vào bài thi \"test import\"', 'Info', 1, '2025-11-20 21:16:04', 91, 'Exam'),
(257, 7, 'Bài thi \"test import\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:25:54', 92, 'Exam'),
(258, 7, 'Đã nhập 20 câu hỏi vào bài thi \"test import\"', 'Info', 1, '2025-11-20 21:26:02', 92, 'Exam'),
(259, 7, 'Bài thi \"tets import lần 4\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:37:15', 93, 'Exam'),
(260, 7, 'Đã nhập 20 câu hỏi vào bài thi \"tets import lần 4\"', 'Info', 1, '2025-11-20 21:37:29', 93, 'Exam'),
(261, 7, 'Bài thi \"test import lần 5\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:43:28', 94, 'Exam'),
(262, 7, 'Đã nhập 20 câu hỏi vào bài thi \"test import lần 5\"', 'Info', 1, '2025-11-20 21:43:59', 94, 'Exam'),
(263, 7, 'Bài thi \"tets import lần 7\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:46:30', 95, 'Exam'),
(264, 7, 'Đã nhập 20 câu hỏi vào bài thi \"tets import lần 7\"', 'Info', 1, '2025-11-20 21:46:40', 95, 'Exam'),
(265, 7, 'Bài thi \"test import lần 8\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-20 21:54:57', 96, 'Exam'),
(266, 7, 'Đã copy 20 câu hỏi từ \"kiến trúc máy tính - kiến thức cơ bản về pc\" vào \"test import lần 8\"', 'Info', 1, '2025-11-20 21:54:57', 96, 'Exam'),
(267, 7, 'Bài thi \"21/11\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-21 16:20:11', 97, 'Exam'),
(268, 7, 'Đã nhập 20 câu hỏi vào bài thi \"21/11\"', 'Info', 1, '2025-11-21 16:20:23', 97, 'Exam'),
(269, 7, 'Bài thi \"21/11\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-21 16:27:13', 98, 'Exam'),
(270, 7, 'Đã nhập 20 câu hỏi vào bài thi \"21/11\"', 'Info', 1, '2025-11-21 16:27:23', 98, 'Exam'),
(271, 7, 'Bài thi \"21/11\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-21 16:28:35', 99, 'Exam'),
(272, 7, 'Đã nhập 20 câu hỏi vào bài thi \"21/11\"', 'Info', 1, '2025-11-21 16:28:45', 99, 'Exam'),
(273, 7, 'Bài thi \"điện toán đám mây - ec2\" đã được thêm vào lớp 26th02', 'Info', 1, '2025-11-25 14:12:06', 100, 'Exam'),
(274, 7, 'Đã thêm câu hỏi mới: \"Amazon EC2 stands for what?...\"', 'Info', 1, '2025-11-25 14:12:06', 670, 'Question'),
(275, 7, 'Đã thêm câu hỏi mới: \"What is the fundamental computing unit provided by...\"', 'Info', 1, '2025-11-25 14:12:06', 671, 'Question'),
(276, 7, 'Đã thêm câu hỏi mới: \"Which protocol is typically used to securely conne...\"', 'Info', 1, '2025-11-25 14:12:06', 672, 'Question'),
(277, 7, 'Đã thêm câu hỏi mới: \"What is an Amazon Machine Image (AMI) primarily us...\"', 'Info', 1, '2025-11-25 14:12:06', 673, 'Question'),
(278, 7, 'Đã thêm câu hỏi mới: \"What is the main purpose of an EC2 Security Group?...\"', 'Info', 1, '2025-11-25 14:12:06', 674, 'Question'),
(279, 7, 'Đã thêm câu hỏi mới: \"Which of these is an example of an EC2 instance ty...\"', 'Info', 1, '2025-11-25 14:12:07', 675, 'Question'),
(280, 7, 'Đã thêm câu hỏi mới: \"You need to run a stateless web application with f...\"', 'Info', 1, '2025-11-25 14:12:07', 676, 'Question'),
(281, 7, 'Đã thêm câu hỏi mới: \"An application requires high-performance, transact...\"', 'Info', 1, '2025-11-25 14:12:07', 677, 'Question'),
(282, 7, 'Đã thêm câu hỏi mới: \"What happens to data stored on an EC2 instance sto...\"', 'Info', 1, '2025-11-25 14:12:07', 678, 'Question'),
(283, 7, 'Đã thêm câu hỏi mới: \"What is an Elastic IP address in AWS EC2?...\"', 'Info', 1, '2025-11-25 14:12:07', 679, 'Question'),
(284, 7, 'Đã thêm câu hỏi mới: \"Which action would result in the loss of the publi...\"', 'Info', 1, '2025-11-25 14:12:07', 680, 'Question'),
(285, 7, 'Đã thêm câu hỏi mới: \"You have an EC2 instance running a critical databa...\"', 'Info', 1, '2025-11-25 14:12:07', 681, 'Question'),
(286, 7, 'Đã thêm câu hỏi mới: \"You are configuring a Security Group for a web ser...\"', 'Info', 1, '2025-11-25 14:12:07', 682, 'Question'),
(287, 7, 'Đã thêm câu hỏi mới: \"You want to configure an EC2 instance to automatic...\"', 'Info', 1, '2025-11-25 14:12:07', 683, 'Question'),
(288, 7, 'Đã thêm câu hỏi mới: \"Which of the following statements about sharing Am...\"', 'Info', 1, '2025-11-25 14:12:07', 684, 'Question'),
(289, 7, 'Đã thêm câu hỏi mới: \"You need to migrate an application to AWS EC2 that...\"', 'Info', 1, '2025-11-25 14:12:07', 685, 'Question'),
(290, 7, 'Đã thêm câu hỏi mới: \"A legacy application has strict licensing requirem...\"', 'Info', 1, '2025-11-25 14:12:07', 686, 'Question'),
(291, 7, 'Đã thêm câu hỏi mới: \"You have an EC2 instance that runs a batch process...\"', 'Info', 1, '2025-11-25 14:12:07', 687, 'Question'),
(292, 7, 'Đã thêm câu hỏi mới: \"A developer accidentally left an outbound rule in ...\"', 'Info', 1, '2025-11-25 14:12:07', 688, 'Question'),
(293, 7, 'Đã thêm câu hỏi mới: \"You are designing a highly available, fault-tolera...\"', 'Info', 1, '2025-11-25 14:12:07', 689, 'Question'),
(294, 7, 'Bài thi \"tets thôi nha\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-26 22:29:09', 101, 'Exam'),
(295, 7, 'Đã nhập 20 câu hỏi vào bài thi \"tets thôi nha\"', 'Info', 1, '2025-11-26 22:29:22', 101, 'Exam'),
(296, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:30:10', 101, 'Exam'),
(297, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:35:37', 101, 'Exam'),
(298, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:36:00', 101, 'Exam'),
(299, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:37:24', 101, 'Exam'),
(300, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:41:55', 101, 'Exam'),
(301, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:44:55', 101, 'Exam'),
(302, 7, 'Bài thi \"tets thôi nha\" đã được chỉnh sửa', 'Info', 1, '2025-11-26 22:51:17', 101, 'Exam'),
(303, 4, 'tests noti \n\ntest noti', 'Info', 0, '2025-11-27 17:14:35', NULL, NULL),
(304, 8, 'tests noti \n\ntest noti', 'Info', 0, '2025-11-27 17:14:35', NULL, NULL),
(305, 7, 'Bài thi \"tets cloud\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-27 21:05:31', 102, 'Exam'),
(306, 7, 'Đã nhập 20 câu hỏi vào bài thi \"tets cloud\"', 'Info', 1, '2025-11-27 21:05:49', 102, 'Exam'),
(307, 7, 'Học sinh duyvsh1234 đã tham gia lớp 26th03', 'Info', 1, '2025-11-28 13:01:58', 6, 'Class'),
(308, 4, 'duyyy\n\nduyyy', 'Info', 0, '2025-11-28 13:02:34', NULL, NULL),
(309, 8, 'duyyy\n\nduyyy', 'Info', 0, '2025-11-28 13:02:34', NULL, NULL),
(310, 16, 'duyyy\n\nduyyy', 'Info', 0, '2025-11-28 13:02:34', NULL, NULL),
(311, 7, 'Bài thi \"lập trình hướng đối tương - ngôn ngữ C#\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-28 13:05:11', 103, 'Exam'),
(312, 7, 'Đã thêm câu hỏi mới: \"Trong lập trình C#, khi sử dụng ràng buộc generic ...\"', 'Info', 1, '2025-11-28 13:05:11', 730, 'Question'),
(313, 7, 'Đã thêm câu hỏi mới: \"Cho một `MulticastDelegate` được tạo với ba phương...\"', 'Info', 1, '2025-11-28 13:05:11', 731, 'Question'),
(314, 7, 'Đã thêm câu hỏi mới: \"Trong một kịch bản mà đối tượng phát sự kiện (publ...\"', 'Info', 1, '2025-11-28 13:05:11', 732, 'Question'),
(315, 7, 'Đã thêm câu hỏi mới: \"C# 8.0 đã giới thiệu các phương thức giao diện mặc...\"', 'Info', 1, '2025-11-28 13:05:12', 733, 'Question'),
(316, 7, 'Đã thêm câu hỏi mới: \"Trong các kịch bản sau, kịch bản nào thể hiện đúng...\"', 'Info', 1, '2025-11-28 13:05:12', 734, 'Question'),
(317, 7, 'Đã thêm câu hỏi mới: \"Xét `struct Point { public int X, Y; }` và `class ...\"', 'Info', 1, '2025-11-28 13:05:12', 735, 'Question'),
(318, 7, 'Đã thêm câu hỏi mới: \"Sử dụng Reflection để gọi các phương thức có thể c...\"', 'Info', 1, '2025-11-28 13:05:13', 736, 'Question'),
(319, 7, 'Đã thêm câu hỏi mới: \"Trong ứng dụng WPF, việc gọi một phương thức `asyn...\"', 'Info', 1, '2025-11-28 13:05:13', 737, 'Question'),
(320, 7, 'Đã thêm câu hỏi mới: \"Xem xét câu lệnh LINQ sau: `var query = collection...\"', 'Info', 1, '2025-11-28 13:05:13', 738, 'Question'),
(321, 7, 'Đã thêm câu hỏi mới: \"Bạn có một ứng dụng yêu cầu các thuật toán tính th...\"', 'Info', 1, '2025-11-28 13:05:13', 739, 'Question'),
(322, 7, 'Đã thêm câu hỏi mới: \"Cho lớp cơ sở `Base` có `public virtual void Metho...\"', 'Info', 1, '2025-11-28 13:05:14', 740, 'Question'),
(323, 7, 'Đã thêm câu hỏi mới: \"Khi triển khai `IDisposable` cho một lớp quản lý t...\"', 'Info', 1, '2025-11-28 13:05:14', 741, 'Question'),
(324, 7, 'Đã thêm câu hỏi mới: \"Đối với một kiểu `class` tùy chỉnh, nếu bạn ghi đè...\"', 'Info', 1, '2025-11-28 13:05:14', 742, 'Question'),
(325, 7, 'Đã thêm câu hỏi mới: \"Bạn cần tuần tự hóa một đối tượng có chứa thông ti...\"', 'Info', 1, '2025-11-28 13:05:15', 743, 'Question'),
(326, 7, 'Đã thêm câu hỏi mới: \"Trong một phương thức generic `T GetDefault<T>()`,...\"', 'Info', 1, '2025-11-28 13:05:15', 744, 'Question'),
(327, 7, 'Đã thêm câu hỏi mới: \"Xét `public class Outer { protected internal class...\"', 'Info', 1, '2025-11-28 13:05:15', 745, 'Question'),
(328, 7, 'Đã thêm câu hỏi mới: \"Một module phần mềm được thiết kế sao cho việc thê...\"', 'Info', 1, '2025-11-28 13:05:16', 746, 'Question'),
(329, 7, 'Đã thêm câu hỏi mới: \"Cho `int? x = null; int y = x ?? 10;`. Giá trị của...\"', 'Info', 1, '2025-11-28 13:05:16', 747, 'Question'),
(330, 7, 'Đã thêm câu hỏi mới: \"Phát biểu nào sau đây về các phương thức mở rộng (...\"', 'Info', 1, '2025-11-28 13:05:16', 748, 'Question'),
(331, 7, 'Đã thêm câu hỏi mới: \"Bạn đang triển khai một cơ chế caching, nơi các đố...\"', 'Info', 1, '2025-11-28 13:05:17', 749, 'Question'),
(332, 7, 'Bài thi \"duy\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-28 13:09:26', 104, 'Exam'),
(333, 7, 'Đã nhập 20 câu hỏi vào bài thi \"duy\"', 'Info', 1, '2025-11-28 13:09:41', 104, 'Exam'),
(334, 7, 'Đã nhập 20 câu hỏi vào bài thi \"duy\"', 'Info', 1, '2025-11-28 13:09:42', 104, 'Exam'),
(335, 7, 'Học sinh duyvsh1234 đã gửi khiếu nại về bài thi \"duy\" (Lớp 26th03)', 'Warning', 1, '2025-11-28 13:38:38', 5, 'Comp'),
(336, 7, 'Bài thi \"duy\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-28 14:04:53', 105, 'Exam'),
(337, 7, 'Đã nhập 20 câu hỏi vào bài thi \"duy\"', 'Info', 1, '2025-11-28 14:05:11', 105, 'Exam'),
(338, 7, 'Bài thi \"điện toán đám mây - ec2\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-28 15:13:44', 106, 'Exam'),
(339, 7, 'Đã thêm câu hỏi mới: \"Dịch vụ AWS nào sau đây cung cấp khả năng điện toá...\"', 'Info', 1, '2025-11-28 15:13:45', 810, 'Question'),
(340, 7, 'Đã thêm câu hỏi mới: \"EC2 là viết tắt của từ gì trong AWS?...\"', 'Info', 1, '2025-11-28 15:13:45', 811, 'Question'),
(341, 7, 'Đã thêm câu hỏi mới: \"Một \'instance\' trong Amazon EC2 đại diện cho điều ...\"', 'Info', 1, '2025-11-28 15:13:45', 812, 'Question'),
(342, 7, 'Đã thêm câu hỏi mới: \"Thành phần nào sau đây được sử dụng làm khuôn mẫu ...\"', 'Info', 1, '2025-11-28 15:13:46', 813, 'Question'),
(343, 7, 'Đã thêm câu hỏi mới: \"Để kết nối an toàn với một EC2 instance Linux bằng...\"', 'Info', 1, '2025-11-28 15:13:46', 814, 'Question'),
(344, 7, 'Đã thêm câu hỏi mới: \"Thành phần nào của EC2 hoạt động như một bức tường...\"', 'Info', 1, '2025-11-28 15:13:46', 815, 'Question'),
(345, 7, 'Đã thêm câu hỏi mới: \"Loại lưu trữ nào cung cấp khả năng lưu trữ khối (b...\"', 'Info', 1, '2025-11-28 15:13:46', 816, 'Question'),
(346, 7, 'Đã thêm câu hỏi mới: \"Mô hình giá EC2 nào cho phép bạn đặt giá cho dung ...\"', 'Info', 1, '2025-11-28 15:13:47', 817, 'Question'),
(347, 7, 'Đã thêm câu hỏi mới: \"Để có chi phí thấp nhất cho các khối lượng công vi...\"', 'Info', 1, '2025-11-28 15:13:47', 818, 'Question'),
(348, 7, 'Đã thêm câu hỏi mới: \"Một \'Region\' trong AWS được định nghĩa là gì?...\"', 'Info', 1, '2025-11-28 15:13:47', 819, 'Question'),
(349, 7, 'Đã thêm câu hỏi mới: \"Một \'Availability Zone\' trong AWS được định nghĩa ...\"', 'Info', 1, '2025-11-28 15:13:47', 820, 'Question'),
(350, 7, 'Đã thêm câu hỏi mới: \"Loại instance nào được bao gồm trong AWS Free Tier...\"', 'Info', 1, '2025-11-28 15:13:48', 821, 'Question'),
(351, 7, 'Đã thêm câu hỏi mới: \"Khi bạn dừng và khởi động lại một EC2 instance (kh...\"', 'Info', 1, '2025-11-28 15:13:48', 822, 'Question'),
(352, 7, 'Đã thêm câu hỏi mới: \"Dịch vụ AWS nào thường được sử dụng cùng với EC2 đ...\"', 'Info', 1, '2025-11-28 15:13:48', 823, 'Question'),
(353, 7, 'Đã thêm câu hỏi mới: \"Bạn sử dụng loại địa chỉ IP nào để cung cấp một đị...\"', 'Info', 1, '2025-11-28 15:13:48', 824, 'Question'),
(354, 7, 'Đã thêm câu hỏi mới: \"EC2 instance type \'t2.micro\' thuộc về nhóm instanc...\"', 'Info', 1, '2025-11-28 15:13:49', 825, 'Question'),
(355, 7, 'Đã thêm câu hỏi mới: \"Bạn có thể chỉ định một tập hợp các lệnh để chạy t...\"', 'Info', 1, '2025-11-28 15:13:49', 826, 'Question'),
(356, 7, 'Đã thêm câu hỏi mới: \"Để quản lý quyền truy cập của EC2 instance vào các...\"', 'Info', 1, '2025-11-28 15:13:49', 827, 'Question'),
(357, 7, 'Đã thêm câu hỏi mới: \"Loại instance store nào cung cấp bộ lưu trữ khối h...\"', 'Info', 1, '2025-11-28 15:13:50', 828, 'Question'),
(358, 7, 'Đã thêm câu hỏi mới: \"Một trong những lợi ích chính của việc sử dụng Ama...\"', 'Info', 1, '2025-11-28 15:13:50', 829, 'Question'),
(359, 7, 'Bài thi \"test7\" đã được chỉnh sửa', 'Info', 1, '2025-11-28 20:23:46', 54, 'Exam'),
(360, 7, 'Bài thi \"test 8\" đã được chỉnh sửa', 'Info', 1, '2025-11-28 20:25:25', 54, 'Exam'),
(361, 7, 'Bài thi \"test 9\" đã được chỉnh sửa', 'Info', 1, '2025-11-28 20:28:18', 54, 'Exam'),
(362, 7, 'Bài thi \"test 10\" đã được chỉnh sửa', 'Info', 1, '2025-11-28 20:31:14', 54, 'Exam'),
(363, 7, 'Bài thi \"test 11\" đã được chỉnh sửa', 'Info', 1, '2025-11-28 21:06:44', 54, 'Exam'),
(364, 7, 'Bài thi \"Lập trình C#.NET - Kiểm Tra\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-28 22:16:36', 107, 'Exam'),
(365, 7, 'Đã thêm câu hỏi mới: \"C# là ngôn ngữ lập trình được phát triển bởi công ...\"', 'Info', 1, '2025-11-28 22:16:37', 830, 'Question'),
(366, 7, 'Đã thêm câu hỏi mới: \"Để in một dòng chữ ra màn hình console trong C#, c...\"', 'Info', 1, '2025-11-28 22:16:37', 831, 'Question'),
(367, 7, 'Đã thêm câu hỏi mới: \"Từ khóa nào được sử dụng để khai báo một biến số n...\"', 'Info', 1, '2025-11-28 22:16:37', 832, 'Question'),
(368, 7, 'Đã thêm câu hỏi mới: \"Mỗi câu lệnh trong C# phải kết thúc bằng ký tự nào...\"', 'Info', 1, '2025-11-28 22:16:38', 833, 'Question'),
(369, 7, 'Đã thêm câu hỏi mới: \"Khối mã lệnh trong C# được định nghĩa bằng cách sử...\"', 'Info', 1, '2025-11-28 22:16:38', 834, 'Question'),
(370, 7, 'Đã thêm câu hỏi mới: \"Từ khóa nào được sử dụng để bắt đầu khai báo một l...\"', 'Info', 1, '2025-11-28 22:16:38', 835, 'Question'),
(371, 7, 'Đã thêm câu hỏi mới: \"Toán tử nào sau đây dùng để gán giá trị cho một bi...\"', 'Info', 1, '2025-11-28 22:16:39', 836, 'Question'),
(372, 7, 'Đã thêm câu hỏi mới: \"Kiểu dữ liệu nào dùng để lưu trữ các giá trị đúng/...\"', 'Info', 1, '2025-11-28 22:16:39', 837, 'Question'),
(373, 7, 'Đã thêm câu hỏi mới: \"Đoạn code nào sau đây là một comment (chú thích) m...\"', 'Info', 1, '2025-11-28 22:16:39', 838, 'Question'),
(374, 7, 'Đã thêm câu hỏi mới: \"Để khai báo một hằng số (constant) trong C#, từ kh...\"', 'Info', 1, '2025-11-28 22:16:39', 839, 'Question'),
(375, 7, 'Đã thêm câu hỏi mới: \"Phương thức `Main` trong một ứng dụng C# console c...\"', 'Info', 1, '2025-11-28 22:16:40', 840, 'Question'),
(376, 7, 'Đã thêm câu hỏi mới: \"Toán tử nào dùng để kiểm tra sự bằng nhau về giá t...\"', 'Info', 1, '2025-11-28 22:16:40', 841, 'Question'),
(377, 7, 'Đã thêm câu hỏi mới: \"Cú pháp đúng để khai báo và khởi tạo một mảng số n...\"', 'Info', 1, '2025-11-28 22:16:40', 842, 'Question'),
(378, 7, 'Đã thêm câu hỏi mới: \"Để bao gồm một namespace vào chương trình C#, từ k...\"', 'Info', 1, '2025-11-28 22:16:41', 843, 'Question'),
(379, 7, 'Đã thêm câu hỏi mới: \"Câu lệnh `if-else` trong C# được sử dụng để làm gì...\"', 'Info', 1, '2025-11-28 22:16:41', 844, 'Question'),
(380, 7, 'Đã thêm câu hỏi mới: \"Vòng lặp `for` thường được sử dụng khi nào?...\"', 'Info', 1, '2025-11-28 22:16:41', 845, 'Question'),
(381, 7, 'Đã thêm câu hỏi mới: \"Điều gì mô tả đúng nhất một \'đối tượng\' (object) t...\"', 'Info', 1, '2025-11-28 22:16:42', 846, 'Question'),
(382, 7, 'Đã thêm câu hỏi mới: \"Kiểu dữ liệu nào được sử dụng để lưu trữ chuỗi ký ...\"', 'Info', 1, '2025-11-28 22:16:42', 847, 'Question'),
(383, 7, 'Đã thêm câu hỏi mới: \"Giá trị mặc định của một biến kiểu `int` nếu không...\"', 'Info', 1, '2025-11-28 22:16:42', 848, 'Question'),
(384, 7, 'Đã thêm câu hỏi mới: \"Để khai báo một phương thức không trả về giá trị n...\"', 'Info', 1, '2025-11-28 22:16:43', 849, 'Question'),
(385, 7, 'Bài thi \"mạng máy tinh - kiểm tra giữa kỳ\" đã được thêm vào lớp 26th03', 'Info', 1, '2025-11-28 23:51:44', 108, 'Exam'),
(386, 7, 'Đã thêm câu hỏi mới: \"Địa chỉ IP lớp C mặc định có subnet mask là gì?...\"', 'Info', 1, '2025-11-28 23:51:44', 850, 'Question'),
(387, 7, 'Đã thêm câu hỏi mới: \"Trong ký hiệu CIDR, /24 đại diện cho điều gì?...\"', 'Info', 1, '2025-11-28 23:51:44', 851, 'Question'),
(388, 7, 'Đã thêm câu hỏi mới: \"Mục đích chính của việc chia mạng con (subnetting)...\"', 'Info', 1, '2025-11-28 23:51:44', 852, 'Question'),
(389, 7, 'Đã thêm câu hỏi mới: \"Nếu bạn mượn 3 bit từ phần host để chia mạng con, ...\"', 'Info', 1, '2025-11-28 23:51:44', 853, 'Question'),
(390, 7, 'Đã thêm câu hỏi mới: \"Cho địa chỉ IP 192.168.1.50/24, địa chỉ mạng (netw...\"', 'Info', 1, '2025-11-28 23:51:44', 854, 'Question'),
(391, 7, 'Đã thêm câu hỏi mới: \"Cho địa chỉ IP 192.168.1.50/24, địa chỉ quảng bá (...\"', 'Info', 1, '2025-11-28 23:51:44', 855, 'Question'),
(392, 7, 'Đã thêm câu hỏi mới: \"Với subnet mask 255.255.255.0, có bao nhiêu bit đư...\"', 'Info', 1, '2025-11-28 23:51:44', 856, 'Question'),
(393, 7, 'Đã thêm câu hỏi mới: \"Địa chỉ IP nào sau đây thuộc mạng Class A?...\"', 'Info', 1, '2025-11-28 23:51:44', 857, 'Question'),
(394, 7, 'Đã thêm câu hỏi mới: \"Đối với mạng 172.16.0.0/20, có bao nhiêu bit được ...\"', 'Info', 1, '2025-11-28 23:51:44', 858, 'Question'),
(395, 7, 'Đã thêm câu hỏi mới: \"Có bao nhiêu địa chỉ host khả dụng trong một mạng ...\"', 'Info', 1, '2025-11-28 23:51:44', 859, 'Question'),
(396, 7, 'Đã thêm câu hỏi mới: \"Subnet mask cho CIDR /26 là gì?...\"', 'Info', 1, '2025-11-28 23:51:44', 860, 'Question'),
(397, 7, 'Đã thêm câu hỏi mới: \"Dải địa chỉ IP nào sau đây được dành riêng cho sử ...\"', 'Info', 1, '2025-11-28 23:51:44', 861, 'Question'),
(398, 7, 'Đã thêm câu hỏi mới: \"Số lượng host tối đa trong một mạng Class B khi sử...\"', 'Info', 1, '2025-11-28 23:51:44', 862, 'Question'),
(399, 7, 'Đã thêm câu hỏi mới: \"Với mạng 192.168.10.0/28, kích thước khối (block s...\"', 'Info', 1, '2025-11-28 23:51:44', 863, 'Question'),
(400, 7, 'Đã thêm câu hỏi mới: \"Cho mạng con 192.168.10.32/28, địa chỉ IP host khả...\"', 'Info', 1, '2025-11-28 23:51:44', 864, 'Question'),
(401, 7, 'Đã thêm câu hỏi mới: \"Cho mạng con 192.168.10.32/28, địa chỉ IP host khả...\"', 'Info', 1, '2025-11-28 23:51:44', 865, 'Question'),
(402, 7, 'Đã thêm câu hỏi mới: \"Điều gì xảy ra với số lượng địa chỉ host khả dụng ...\"', 'Info', 1, '2025-11-28 23:51:44', 866, 'Question'),
(403, 7, 'Đã thêm câu hỏi mới: \"Dải địa chỉ IP nào sau đây KHÔNG phải là dải IP ri...\"', 'Info', 1, '2025-11-28 23:51:44', 867, 'Question'),
(404, 7, 'Đã thêm câu hỏi mới: \"Thuật ngữ nào dùng để chỉ việc chia một mạng lớn t...\"', 'Info', 1, '2025-11-28 23:51:44', 868, 'Question'),
(405, 7, 'Đã thêm câu hỏi mới: \"Nếu một mạng sử dụng subnet mask 255.255.255.240, ...\"', 'Info', 1, '2025-11-28 23:51:44', 869, 'Question'),
(406, 7, 'Học sinh Bùi Đức Thuần đã gửi khiếu nại về bài thi \"Lập trình C#.NET - Kiểm Tra\" (Lớp 26th03)', 'Warning', 1, '2025-11-29 09:19:23', 6, 'Comp');
INSERT INTO `notifications` (`notification_id`, `user_id`, `content`, `type`, `is_read`, `created_at`, `related_id`, `related_type`) VALUES
(407, 4, 'Bài thi \"Lập trình C#.NET - Kiểm Tra\" của bạn đã được chấm điểm. Điểm số: 1.5 điểm', 'Info', 0, '2025-11-29 09:20:57', 107, 'Exam'),
(408, 7, 'Lớp học mới \"26th01\" đã được tạo', 'Info', 1, '2025-11-30 08:37:21', 8, 'Class'),
(409, 7, 'Lớp học \"26th01\" đã được xóa', 'Info', 1, '2025-11-30 08:43:29', 8, 'Class');

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

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `practice_exams`
--

CREATE TABLE `practice_exams` (
  `practice_exam_id` int NOT NULL,
  `student_id` bigint NOT NULL,
  `source_type` enum('teacher_material','uploaded_file','question_bank') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_id` int DEFAULT NULL COMMENT 'material_id hoặc file_id',
  `exam_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_questions` int DEFAULT '0',
  `ai_provider` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'groq hoặc gemini',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('draft','active','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `practice_exams`
--

INSERT INTO `practice_exams` (`practice_exam_id`, `student_id`, `source_type`, `source_id`, `exam_name`, `total_questions`, `ai_provider`, `created_at`, `status`) VALUES
(1, 4, 'teacher_material', 2, 'Luyện tập: c# và net', 19, 'groq', '2025-11-28 23:59:01', 'active'),
(2, 4, 'teacher_material', 2, 'Luyện tập: c# và net', 17, 'groq', '2025-11-30 08:53:56', 'active');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `practice_exam_attempts`
--

CREATE TABLE `practice_exam_attempts` (
  `attempt_id` int NOT NULL,
  `practice_exam_id` int NOT NULL,
  `student_id` bigint NOT NULL,
  `score` decimal(10,2) DEFAULT '0.00',
  `total_points` decimal(10,2) DEFAULT '0.00',
  `start_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_time` datetime DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'InProgress'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `practice_exam_attempts`
--

INSERT INTO `practice_exam_attempts` (`attempt_id`, `practice_exam_id`, `student_id`, `score`, `total_points`, `start_time`, `end_time`, `status`) VALUES
(1, 1, 4, 8.00, 9.50, '2025-11-29 00:03:28', '2025-11-29 00:04:00', 'Submitted'),
(2, 1, 4, 4.50, 9.50, '2025-11-29 00:04:22', '2025-11-29 00:04:38', 'Submitted'),
(3, 1, 4, 0.00, 9.50, '2025-11-29 00:10:16', '2025-11-29 00:12:24', 'Submitted'),
(4, 1, 4, 2.00, 9.50, '2025-11-29 00:15:36', '2025-11-29 00:15:45', 'Submitted'),
(5, 2, 4, 3.00, 17.00, '2025-11-30 08:54:28', '2025-11-30 08:55:10', 'Submitted');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `practice_exam_attempt_answers`
--

CREATE TABLE `practice_exam_attempt_answers` (
  `id` int NOT NULL,
  `attempt_id` int NOT NULL,
  `question_id` int NOT NULL COMMENT 'FK từ practice_exam_questions.id',
  `option_id` int DEFAULT NULL COMMENT 'FK từ practice_exam_options.id (cho trắc nghiệm)',
  `answer_text` text COLLATE utf8mb4_unicode_ci COMMENT 'Đáp án text (cho FillInBlank/Essay)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `practice_exam_attempt_answers`
--

INSERT INTO `practice_exam_attempt_answers` (`id`, `attempt_id`, `question_id`, `option_id`, `answer_text`, `created_at`) VALUES
(1, 4, 1, 1, NULL, '2025-11-29 00:15:45'),
(2, 4, 2, 5, NULL, '2025-11-29 00:15:45'),
(3, 4, 3, 9, NULL, '2025-11-29 00:15:45'),
(4, 4, 4, 13, NULL, '2025-11-29 00:15:45'),
(5, 4, 5, 17, NULL, '2025-11-29 00:15:45'),
(6, 5, 20, 80, NULL, '2025-11-30 08:55:10'),
(7, 5, 21, 84, NULL, '2025-11-30 08:55:10'),
(8, 5, 22, 88, NULL, '2025-11-30 08:55:10'),
(9, 5, 23, 91, NULL, '2025-11-30 08:55:10'),
(10, 5, 24, 96, NULL, '2025-11-30 08:55:10'),
(11, 5, 25, 99, NULL, '2025-11-30 08:55:10'),
(12, 5, 26, 103, NULL, '2025-11-30 08:55:10'),
(13, 5, 27, 106, NULL, '2025-11-30 08:55:10'),
(14, 5, 28, 109, NULL, '2025-11-30 08:55:10'),
(15, 5, 29, 113, NULL, '2025-11-30 08:55:10'),
(16, 5, 30, 117, NULL, '2025-11-30 08:55:10'),
(17, 5, 31, 121, NULL, '2025-11-30 08:55:10'),
(18, 5, 32, 125, NULL, '2025-11-30 08:55:10'),
(19, 5, 33, 129, NULL, '2025-11-30 08:55:10'),
(20, 5, 34, 133, NULL, '2025-11-30 08:55:10'),
(21, 5, 35, 137, NULL, '2025-11-30 08:55:10'),
(22, 5, 36, 141, NULL, '2025-11-30 08:55:10');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `practice_exam_options`
--

CREATE TABLE `practice_exam_options` (
  `id` int NOT NULL,
  `practice_exam_id` int NOT NULL,
  `question_order` int NOT NULL COMMENT 'Tham chiếu practice_exam_questions.question_order',
  `option_content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) DEFAULT '0',
  `option_order` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `practice_exam_options`
--

INSERT INTO `practice_exam_options` (`id`, `practice_exam_id`, `question_order`, `option_content`, `is_correct`, `option_order`) VALUES
(1, 1, 1, 'int', 1, 0),
(2, 1, 1, 'float', 0, 1),
(3, 1, 1, 'double', 0, 2),
(4, 1, 1, 'decimal', 0, 3),
(5, 1, 2, 'let', 0, 0),
(6, 1, 2, 'var', 1, 1),
(7, 1, 2, 'declare', 0, 2),
(8, 1, 2, 'int', 0, 3),
(9, 1, 3, 'string', 1, 0),
(10, 1, 3, 'char', 0, 1),
(11, 1, 3, 'byte', 0, 2),
(12, 1, 3, 'short', 0, 3),
(13, 1, 4, 'Trước các biến khác', 1, 0),
(14, 1, 4, 'Sau các biến khác', 0, 1),
(15, 1, 4, 'Ở đầu phương thức', 0, 2),
(16, 1, 4, 'Ở cuối phương thức', 0, 3),
(17, 1, 5, 'int[]', 1, 0),
(18, 1, 5, 'float[]', 0, 1),
(19, 1, 5, 'double[]', 0, 2),
(20, 1, 5, 'decimal[]', 0, 3),
(21, 1, 6, 'Kiểu dữ liệu khác', 1, 0),
(22, 1, 6, 'Biến khác', 0, 1),
(23, 1, 6, 'Phương thức khác', 0, 2),
(24, 1, 6, 'lớp khác', 0, 3),
(25, 1, 7, 'bool', 1, 0),
(26, 1, 7, 'byte', 0, 1),
(27, 1, 7, 'char', 0, 2),
(28, 1, 7, 'short', 0, 3),
(29, 1, 8, 'Trên toàn bộ chương trình', 1, 0),
(30, 1, 8, 'Trên toàn bộ lớp', 0, 1),
(31, 1, 8, 'Trên toàn bộ phương thức', 0, 2),
(32, 1, 8, 'Không có', 0, 3),
(33, 1, 9, 'DateTime', 1, 0),
(34, 1, 9, 'TimeSpan', 0, 1),
(35, 1, 9, 'Guid', 0, 2),
(36, 1, 9, 'decimal', 0, 3),
(37, 1, 10, 'Có thể', 1, 0),
(38, 1, 10, 'Không thể', 0, 1),
(39, 1, 10, 'Tùy thuộc vào ngữ cảnh', 0, 2),
(40, 1, 10, 'Tùy thuộc vào kiểu dữ liệu', 0, 3),
(41, 1, 11, 'enum', 1, 0),
(42, 1, 11, 'int', 0, 1),
(43, 1, 11, 'float', 0, 2),
(44, 1, 11, 'double', 0, 3),
(45, 1, 12, 'Trên toàn bộ chương trình', 0, 0),
(46, 1, 12, 'Trên toàn bộ lớp', 1, 1),
(47, 1, 12, 'Trên toàn bộ phương thức', 0, 2),
(48, 1, 12, 'Không có', 0, 3),
(49, 1, 13, 'Guid', 1, 0),
(50, 1, 13, 'byte', 0, 1),
(51, 1, 13, 'char', 0, 2),
(52, 1, 13, 'short', 0, 3),
(53, 1, 14, 'Có thể', 1, 0),
(54, 1, 14, 'Không thể', 0, 1),
(55, 1, 14, 'Tùy thuộc vào ngữ cảnh', 0, 2),
(56, 1, 14, 'Tùy thuộc vào kiểu dữ liệu', 0, 3),
(57, 1, 15, 'TimeSpan', 1, 0),
(58, 1, 15, 'DateTime', 0, 1),
(59, 1, 15, 'Guid', 0, 2),
(60, 1, 15, 'decimal', 0, 3),
(61, 1, 16, 'Trên toàn bộ chương trình', 0, 0),
(62, 1, 16, 'Trên toàn bộ lớp', 0, 1),
(63, 1, 16, 'Trên toàn bộ phương thức', 1, 2),
(64, 1, 16, 'Không có', 0, 3),
(65, 1, 17, 'Kiểu dữ liệu khác', 1, 0),
(66, 1, 17, 'Biến khác', 0, 1),
(67, 1, 17, 'Phương thức khác', 0, 2),
(68, 1, 17, 'lớp khác', 0, 3),
(69, 1, 18, 'Có thể', 1, 0),
(70, 1, 18, 'Không thể', 0, 1),
(71, 1, 18, 'Tùy thuộc vào ngữ cảnh', 0, 2),
(72, 1, 18, 'Tùy thuộc vào kiểu dữ liệu', 0, 3),
(73, 1, 19, 'Kiểu dữ liệu khác', 1, 0),
(74, 1, 19, 'Biến khác', 0, 1),
(75, 1, 19, 'Phương thức khác', 0, 2),
(76, 1, 19, 'lớp khác', 0, 3),
(77, 2, 1, 'Số tự nhiên là các số nguyên âm, số nguyên dương và số nol', 1, 0),
(78, 2, 1, 'Số tự nhiên chỉ là số nguyên dương', 0, 1),
(79, 2, 1, 'Số tự nhiên chỉ là số nguyên âm', 0, 2),
(80, 2, 1, 'Số tự nhiên chỉ là số nguyên và số thập phân', 0, 3),
(81, 2, 2, '10', 0, 0),
(82, 2, 2, '20', 0, 1),
(83, 2, 2, '99', 0, 2),
(84, 2, 2, 'Tất cả', 1, 3),
(85, 2, 3, '5', 0, 0),
(86, 2, 3, '7', 0, 1),
(87, 2, 3, '9', 1, 2),
(88, 2, 3, '10', 0, 3),
(89, 2, 4, 'Số nguyên là các số tự nhiên và các số tự nhiên âm', 1, 0),
(90, 2, 4, 'Số nguyên chỉ là số tự nhiên', 0, 1),
(91, 2, 4, 'Số nguyên chỉ là số tự nhiên âm', 0, 2),
(92, 2, 4, 'Số nguyên chỉ là số thập phân', 0, 3),
(93, 2, 5, '0', 0, 0),
(94, 2, 5, '1', 0, 1),
(95, 2, 5, '-1', 1, 2),
(96, 2, 5, '-10', 0, 3),
(97, 2, 6, 'Số nguyên âm là các số tự nhiên âm', 1, 0),
(98, 2, 6, 'Số nguyên âm chỉ là số thập phân âm', 0, 1),
(99, 2, 6, 'Số nguyên âm chỉ là số tự nhiên dương', 0, 2),
(100, 2, 6, 'Số nguyên âm là các số tự nhiên âm và số thập phân âm', 0, 3),
(101, 2, 7, '-1', 0, 0),
(102, 2, 7, '-2', 0, 1),
(103, 2, 7, '-10', 1, 2),
(104, 2, 7, '-100', 0, 3),
(105, 2, 8, 'Số nguyên dương là các số tự nhiên dương', 1, 0),
(106, 2, 8, 'Số nguyên dương chỉ là số thập phân dương', 0, 1),
(107, 2, 8, 'Số nguyên dương chỉ là số tự nhiên âm', 0, 2),
(108, 2, 8, 'Số nguyên dương là các số tự nhiên dương và số thập phân dương', 0, 3),
(109, 2, 9, '0', 0, 0),
(110, 2, 9, '1', 1, 1),
(111, 2, 9, '10', 0, 2),
(112, 2, 9, '100', 0, 3),
(113, 2, 10, 'Số thập phân là các số tự nhiên', 0, 0),
(114, 2, 10, 'Số thập phân chỉ là số thập phân', 1, 1),
(115, 2, 10, 'Số thập phân chỉ là số tự nhiên dương', 0, 2),
(116, 2, 10, 'Số thập phân là các số thập phân và số tự nhiên', 0, 3),
(117, 2, 11, '0,1', 0, 0),
(118, 2, 11, '0,5', 0, 1),
(119, 2, 11, '0,9', 0, 2),
(120, 2, 11, '1,0', 1, 3),
(121, 2, 12, 'Số thập phân âm là các số tự nhiên âm', 0, 0),
(122, 2, 12, 'Số thập phân âm chỉ là số thập phân âm', 1, 1),
(123, 2, 12, 'Số thập phân âm chỉ là số tự nhiên dương', 0, 2),
(124, 2, 12, 'Số thập phân âm là các số thập phân âm và số tự nhiên âm', 0, 3),
(125, 2, 13, '-0,1', 0, 0),
(126, 2, 13, '-0,5', 0, 1),
(127, 2, 13, '-0,9', 1, 2),
(128, 2, 13, '-1,0', 0, 3),
(129, 2, 14, 'Số tự nhiên lẻ là các số tự nhiên chẵn', 0, 0),
(130, 2, 14, 'Số tự nhiên lẻ chỉ là số tự nhiên lẻ', 1, 1),
(131, 2, 14, 'Số tự nhiên lẻ chỉ là số tự nhiên chẵn', 0, 2),
(132, 2, 14, 'Số tự nhiên lẻ là các số tự nhiên lẻ và số tự nhiên chẵn', 0, 3),
(133, 2, 15, '1', 0, 0),
(134, 2, 15, '3', 0, 1),
(135, 2, 15, '5', 0, 2),
(136, 2, 15, '7', 1, 3),
(137, 2, 16, 'Số tự nhiên chẵn là các số tự nhiên lẻ', 0, 0),
(138, 2, 16, 'Số tự nhiên chẵn chỉ là số tự nhiên chẵn', 1, 1),
(139, 2, 16, 'Số tự nhiên chẵn chỉ là số tự nhiên lẻ', 0, 2),
(140, 2, 16, 'Số tự nhiên chẵn là các số tự nhiên chẵn và số tự nhiên lẻ', 0, 3),
(141, 2, 17, '0', 1, 0),
(142, 2, 17, '2', 0, 1),
(143, 2, 17, '4', 0, 2),
(144, 2, 17, '6', 0, 3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `practice_exam_questions`
--

CREATE TABLE `practice_exam_questions` (
  `id` int NOT NULL,
  `practice_exam_id` int NOT NULL,
  `question_id` bigint DEFAULT NULL COMMENT 'FK từ question_bank nếu có',
  `question_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `difficulty` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Medium',
  `points` decimal(5,2) DEFAULT '1.00',
  `question_order` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `practice_exam_questions`
--

INSERT INTO `practice_exam_questions` (`id`, `practice_exam_id`, `question_id`, `question_content`, `question_type`, `difficulty`, `points`, `question_order`) VALUES
(1, 1, NULL, 'Kiểu dữ liệu số nguyên trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 1),
(2, 1, NULL, 'Biến trong C# được định nghĩa bằng từ khóa?', 'SingleChoice', 'Easy', 0.50, 2),
(3, 1, NULL, 'Kiểu dữ liệu chuỗi trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 3),
(4, 1, NULL, 'Biến có thể được khai báo ở đâu trong một phương thức?', 'SingleChoice', 'Easy', 0.50, 4),
(5, 1, NULL, 'Kiểu dữ liệu mảng trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 5),
(6, 1, NULL, 'Biến có thể được sử dụng để lưu trữ giá trị của:', 'SingleChoice', 'Easy', 0.50, 6),
(7, 1, NULL, 'Kiểu dữ liệu bool trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 7),
(8, 1, NULL, 'Biến có thể được khai báo như một biến toàn cục?', 'SingleChoice', 'Easy', 0.50, 8),
(9, 1, NULL, 'Kiểu dữ liệu datetime trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 9),
(10, 1, NULL, 'Biến có thể được sử dụng để lưu trữ giá trị của một phương thức?', 'SingleChoice', 'Easy', 0.50, 10),
(11, 1, NULL, 'Kiểu dữ liệu enum trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 11),
(12, 1, NULL, 'Biến có thể được khai báo như một biến tĩnh?', 'SingleChoice', 'Easy', 0.50, 12),
(13, 1, NULL, 'Kiểu dữ liệu guid trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 13),
(14, 1, NULL, 'Biến có thể được sử dụng để lưu trữ giá trị của một lớp?', 'SingleChoice', 'Easy', 0.50, 14),
(15, 1, NULL, 'Kiểu dữ liệu thời gian trong C# được định nghĩa bởi?', 'SingleChoice', 'Easy', 0.50, 15),
(16, 1, NULL, 'Biến có thể được khai báo như một biến cục bộ?', 'SingleChoice', 'Easy', 0.50, 16),
(17, 1, NULL, 'Kiểu dữ liệu chuỗi trong C# có thể được sử dụng để lưu trữ giá trị của?', 'SingleChoice', 'Easy', 0.50, 17),
(18, 1, NULL, 'Biến có thể được sử dụng để lưu trữ giá trị của một giá trị Boolean?', 'SingleChoice', 'Easy', 0.50, 18),
(19, 1, NULL, 'Kiểu dữ liệu số nguyên trong C# có thể được sử dụng để lưu trữ giá trị của?', 'SingleChoice', 'Easy', 0.50, 19),
(20, 2, NULL, 'Thế nào là một số tự nhiên?', 'SingleChoice', 'Easy', 1.00, 1),
(21, 2, NULL, 'Số tự nhiên nào có hai chữ số?', 'SingleChoice', 'Easy', 1.00, 2),
(22, 2, NULL, 'Số tự nhiên nào lớn nhất trong các số 5, 7 và 9?', 'SingleChoice', 'Easy', 1.00, 3),
(23, 2, NULL, 'Thế nào là một số nguyên?', 'SingleChoice', 'Easy', 1.00, 4),
(24, 2, NULL, 'Số nguyên nào nhỏ nhất?', 'SingleChoice', 'Easy', 1.00, 5),
(25, 2, NULL, 'Thế nào là một số nguyên âm?', 'SingleChoice', 'Easy', 1.00, 6),
(26, 2, NULL, 'Số nguyên âm nào lớn nhất?', 'SingleChoice', 'Easy', 1.00, 7),
(27, 2, NULL, 'Thế nào là một số nguyên dương?', 'SingleChoice', 'Easy', 1.00, 8),
(28, 2, NULL, 'Số nguyên dương nào nhỏ nhất?', 'SingleChoice', 'Easy', 1.00, 9),
(29, 2, NULL, 'Thế nào là một số thập phân?', 'SingleChoice', 'Easy', 1.00, 10),
(30, 2, NULL, 'Số thập phân nào lớn nhất?', 'SingleChoice', 'Easy', 1.00, 11),
(31, 2, NULL, 'Thế nào là một số thập phân âm?', 'SingleChoice', 'Easy', 1.00, 12),
(32, 2, NULL, 'Số thập phân âm nào nhỏ nhất?', 'SingleChoice', 'Easy', 1.00, 13),
(33, 2, NULL, 'Thế nào là một số tự nhiên lẻ?', 'SingleChoice', 'Easy', 1.00, 14),
(34, 2, NULL, 'Số tự nhiên lẻ nào lớn nhất?', 'SingleChoice', 'Easy', 1.00, 15),
(35, 2, NULL, 'Thế nào là một số tự nhiên chẵn?', 'SingleChoice', 'Easy', 1.00, 16),
(36, 2, NULL, 'Số tự nhiên chẵn nào nhỏ nhất?', 'SingleChoice', 'Easy', 1.00, 17);

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
(320, NULL, 7, 'trong mysql việc sử dụng tiếng việt có dấu thì dùng kiểu dữ liệu nào', 'FillInBlank', 'Easy', 'nvarchar', NULL, '2025-10-31 18:13:54', '2025-10-31 18:13:54'),
(321, NULL, 7, 'kiểu dữ liệu số trong js là gì', 'FillInBlank', 'Easy', 'number', NULL, '2025-11-01 08:02:47', '2025-11-01 08:02:47'),
(322, NULL, 7, 'ngôn ngữ nào lập trình hướng đối tượng', 'FillInBlank', 'Easy', 'C#.C++', NULL, '2025-11-01 08:11:59', '2025-11-01 08:11:59'),
(323, NULL, 7, 'test 1', 'FillInBlank', 'Easy', '...', NULL, '2025-11-01 08:18:56', '2025-11-01 08:18:56'),
(324, NULL, 7, 'qqqq', 'FillInBlank', 'Easy', 'qqq', NULL, '2025-11-01 08:43:51', '2025-11-01 08:43:51'),
(326, NULL, 7, '1111', 'FillInBlank', 'Easy', '111', NULL, '2025-11-01 09:06:30', '2025-11-01 09:06:30'),
(327, NULL, 7, 'hello', 'FillInBlank', 'Easy', '.', NULL, '2025-11-06 12:47:26', '2025-11-06 12:47:26'),
(328, NULL, 7, 'heloo', 'FillInBlank', 'Easy', '.', NULL, '2025-11-06 12:49:11', '2025-11-06 12:49:11'),
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
(431, NULL, 7, 'Trong AWS VPC, thành phần nào chịu trách nhiệm chính trong việc định nghĩa dải địa chỉ IP cho toàn bộ mạng ảo của bạn?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(432, NULL, 7, 'Một EC2 instance được triển khai trong một private subnet cần truy cập Internet để tải xuống các bản cập nhật. Thành phần VPC nào là *thiết yếu* để cho phép kết nối Internet ra bên ngoài mà không cần địa chỉ IP công cộng cho EC2 instance đó?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(433, NULL, 7, 'Điểm khác biệt quan trọng nào sau đây là *chính xác* khi so sánh Nhóm bảo mật (Security Group) và Danh sách kiểm soát truy cập mạng (Network ACL - NACL) trong AWS VPC?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(434, NULL, 7, 'Để một EC2 instance trong public subnet có thể nhận được lưu lượng truy cập từ Internet (ví dụ: SSH hoặc HTTP), ngoài việc có một địa chỉ IP công cộng hoặc Elastic IP, thành phần VPC nào phải được cấu hình *chính xác* để hướng lưu lượng từ Internet Gateway đến subnet chứa instance đó?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(435, NULL, 7, 'Một EC2 instance có cả địa chỉ IP riêng (private IP) và địa chỉ IP công cộng (public IP) được cấp bởi AWS. Khi instance này khởi tạo một kết nối ra ngoài Internet, địa chỉ IP nào sẽ được nhìn thấy làm nguồn (source) của lưu lượng truy cập từ góc nhìn bên ngoài Internet?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 09:51:38', '2025-11-15 09:51:38'),
(437, NULL, 7, 'Một ứng dụng yêu cầu tính sẵn sàng cao cho cơ sở dữ liệu của nó và phải tự động chuyển đổi sang phiên bản dự phòng (standby instance) trong trường hợp có sự cố. Tính năng Amazon RDS nào sau đây đáp ứng tốt nhất yêu cầu này?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(438, NULL, 7, 'So với việc tự quản lý một cơ sở dữ liệu quan hệ trên một phiên bản EC2, lợi ích chính của việc sử dụng Amazon RDS là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(439, NULL, 7, 'Một ứng dụng web đang gặp phải tình trạng nghẽn cổ chai về hiệu suất do số lượng truy vấn đọc (read queries) cao trên cơ sở dữ liệu Amazon RDS của nó. Để giảm tải và cải thiện thông lượng đọc, tính năng RDS nào nên được triển khai?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(440, NULL, 7, 'Để kiểm soát quyền truy cập mạng vào một phiên bản Amazon RDS, đảm bảo rằng chỉ các máy chủ ứng dụng cụ thể mới có thể kết nối được, dịch vụ hoặc tính năng AWS nào nên được cấu hình?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(441, NULL, 7, 'Loại lưu trữ Amazon RDS nào thường được khuyến nghị cho các cơ sở dữ liệu sản xuất yêu cầu hiệu suất cao và hoạt động I/O nhất quán, phù hợp với các khối lượng công việc giao dịch (transactional workloads)?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-15 10:34:49', '2025-11-15 10:34:49'),
(442, NULL, 7, 'tets', 'Essay', 'Easy', '.', NULL, '2025-11-16 09:03:28', '2025-11-16 09:03:28'),
(443, NULL, 7, 'test', 'Essay', 'Easy', '.', NULL, '2025-11-16 09:20:53', '2025-11-16 09:20:53'),
(445, NULL, 7, '.', 'Essay', 'Easy', '.', NULL, '2025-11-17 12:25:55', '2025-11-17 12:25:55'),
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
(468, NULL, 7, 'Giả sử một cây CART đã được huấn luyện. Để đưa ra dự đoán cho một mẫu dữ liệu mới, quy trình nào sẽ được thực hiện?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-18 07:56:30', '2025-11-18 07:56:30'),
(469, NULL, 7, 'alo alo', 'Essay', 'Easy', '.', NULL, '2025-11-20 19:40:23', '2025-11-20 19:40:23'),
(470, NULL, 7, 'Bộ phận nào sau đây được coi là \'bộ não\' của máy tính?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:52', '2025-11-20 19:45:52'),
(471, NULL, 7, 'RAM (Random Access Memory) có chức năng chính là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:52', '2025-11-20 19:45:52'),
(472, NULL, 7, 'Thiết bị nào sau đây là một thiết bị đầu vào (input device) của máy tính?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:52', '2025-11-20 19:45:52'),
(473, NULL, 7, 'Ổ đĩa cứng (Hard Disk Drive - HDD) được sử dụng chủ yếu để làm gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(474, NULL, 7, 'Thành phần nào trên bo mạch chủ (mainboard) chịu trách nhiệm kết nối tất cả các linh kiện khác?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(475, NULL, 7, 'GPU (Graphics Processing Unit) có vai trò chính là gì trong máy tính?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(476, NULL, 7, 'Thiết bị nào sau đây là một thiết bị đầu ra (output device) của máy tính?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(477, NULL, 7, 'Hệ điều hành (Operating System - OS) là gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(478, NULL, 7, 'Cổng USB (Universal Serial Bus) được sử dụng để làm gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(479, NULL, 7, 'Thành phần nào có nhiệm vụ chuyển đổi dòng điện xoay chiều (AC) từ ổ cắm thành dòng điện một chiều (DC) mà các linh kiện máy tính sử dụng?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(480, NULL, 7, 'ROM (Read-Only Memory) có đặc điểm nổi bật nào?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(481, NULL, 7, 'Một màn hình máy tính được phân loại là loại thiết bị gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(482, NULL, 7, 'Để kết nối máy tính với mạng Internet có dây, chúng ta thường sử dụng cổng nào?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(483, NULL, 7, 'Phần mềm (Software) là gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(484, NULL, 7, 'Đơn vị đo tốc độ xử lý của CPU thường là gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(485, NULL, 7, 'SSD (Solid State Drive) có ưu điểm chính nào so với HDD?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(486, NULL, 7, 'Bộ phận nào giúp tản nhiệt cho CPU để tránh quá nóng?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(487, NULL, 7, 'BIOS (Basic Input/Output System) được lưu trữ ở đâu và có vai trò gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(488, NULL, 7, 'Phím tắt thông dụng nào dùng để sao chép (copy) văn bản hoặc tệp tin?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(489, NULL, 7, 'Bo mạch chủ (Motherboard) có vai trò chính là gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 19:45:53', '2025-11-20 19:45:53'),
(490, NULL, 7, 'Mạng máy tính là gì?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-20 20:42:18', '2025-11-20 20:42:18'),
(491, NULL, 7, 'Viết tắt LAN trong mạng máy tính có nghĩa là gì?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-20 20:42:18', '2025-11-20 20:42:18'),
(492, NULL, 7, 'Thiết bị mạng nào hoạt động ở tầng vật lý (Physical Layer) của mô hình OSI và chỉ đơn thuần nhận tín hiệu, khuếch đại rồi truyền tới tất cả các cổng khác, không có khả năng lọc địa chỉ?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(493, NULL, 7, 'Địa chỉ IP (Internet Protocol) có chức năng chính là gì trong mạng máy tính?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(494, NULL, 7, 'Giao thức nào được sử dụng để phân giải tên miền (ví dụ: www.google.com) thành địa chỉ IP tương ứng?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(495, NULL, 7, 'Trong mô hình OSI, tầng nào chịu trách nhiệm cho việc nén và mã hóa/giải mã dữ liệu để chuẩn bị cho tầng Ứng dụng?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(496, NULL, 7, 'Trong mô hình TCP/IP, tầng nào tương đương với sự kết hợp của tầng Liên kết dữ liệu (Data Link Layer) và tầng Vật lý (Physical Layer) trong mô hình OSI?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(497, NULL, 7, 'Sự khác biệt cơ bản nhất giữa giao thức TCP (Transmission Control Protocol) và UDP (User Datagram Protocol) là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(498, NULL, 7, 'Thiết bị mạng nào chịu trách nhiệm chính trong việc kết nối các mạng con (subnet) khác nhau và đưa ra quyết định định tuyến các gói tin giữa chúng dựa trên địa chỉ IP?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(499, NULL, 7, 'Khi bạn truy cập một trang web bảo mật (ví dụ: ngân hàng trực tuyến), giao thức nào được sử dụng để mã hóa thông tin giữa trình duyệt của bạn và máy chủ?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(500, NULL, 7, 'Địa chỉ MAC (Media Access Control) là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(501, NULL, 7, 'Giao thức DHCP (Dynamic Host Configuration Protocol) có vai trò gì trong mạng máy tính?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(502, NULL, 7, 'Cổng (port) dịch vụ nào thường được sử dụng cho giao thức FTP (File Transfer Protocol) để điều khiển phiên làm việc (control connection)?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(503, NULL, 7, 'Lớp nào của địa chỉ IPv4 (Class A, B, C) thường được sử dụng cho các mạng cục bộ (LAN) có kích thước trung bình và nhỏ, với dải địa chỉ khởi đầu từ 192.0.0.0 đến 223.255.255.255?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(504, NULL, 7, 'Loại cáp mạng nào là phổ biến nhất hiện nay cho các mạng LAN có dây, cung cấp tốc độ cao và chi phí hợp lý?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(505, NULL, 7, 'Khi một máy tính trong mạng LAN gửi một gói tin tới một máy tính khác nằm trong một mạng LAN khác (thông qua router), thông tin địa chỉ nào *thay đổi* tại mỗi hop (chặng) và thông tin địa chỉ nào *giữ nguyên* từ đầu đến cuối của gói tin IP?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(506, NULL, 7, 'Một quản trị viên mạng cần chia một mạng con có địa chỉ 192.168.10.0/24 thành các mạng con nhỏ hơn, mỗi mạng con phải hỗ trợ tối thiểu 25 máy chủ. Subnet mask nào là phù hợp nhất để đạt được yêu cầu này, đồng thời tối ưu hóa việc sử dụng địa chỉ?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(507, NULL, 7, 'Sự khác biệt cốt lõi giữa IPv4 và IPv6, ngoài kích thước địa chỉ, còn nằm ở khía cạnh nào liên quan đến cách thức xử lý gói tin và tính năng bảo mật tích hợp?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(508, NULL, 7, 'Tường lửa (Firewall) hoạt động chủ yếu ở những tầng nào trong mô hình OSI và chức năng lọc gói tin cơ bản của nó dựa trên những thông tin nào?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(509, NULL, 7, 'Trong mô hình Client-Server, vai trò chính của Server là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 20:42:19', '2025-11-20 20:42:19'),
(530, 2, 7, 'Thành phần nào là entry point của một ứng dụng Android?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(531, 2, 7, 'File cấu hình chính của Android project là gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(532, 2, 7, 'Ngôn ngữ lập trình chính dùng để phát triển Android hiện nay?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(533, 2, 7, 'Layout nào sắp xếp các view theo chiều dọc hoặc ngang?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02');
INSERT INTO `question_bank` (`question_id`, `subject_id`, `teacher_id`, `question_content`, `question_type`, `difficulty`, `correct_answer_text`, `import_id`, `created_at`, `updated_at`) VALUES
(534, 2, 7, 'Hệ thống build chính của Android Studio là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(535, 2, 7, 'Loại file dùng để lưu trữ tài nguyên chuỗi?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(536, 2, 7, 'Để hiển thị danh sách lớn tối ưu, nên dùng view nào?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(537, 2, 7, 'Phương thức để chuyển giữa các Activity?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(538, 2, 7, 'Thư mục chứa layout trong Android?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(539, 2, 7, 'Để hiển thị thông báo ngắn, dùng gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(540, 2, 7, 'API để thao tác bất đồng bộ?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(541, 2, 7, 'Tập tin .apk là gì?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(542, 2, 7, 'Permission truy cập Internet nằm ở đâu?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(543, 2, 7, 'ViewGroup nào mạnh nhất để tạo UI phức tạp?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(544, 2, 7, 'Để lưu dữ liệu key-value nhỏ, dùng?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(545, 2, 7, 'Android sử dụng ngôn ngữ markup nào cho layout?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(546, 2, 7, 'Service dùng để làm gì?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(547, 2, 7, 'Cơ sở dữ liệu tích hợp trong Android?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(548, 2, 7, 'Fragment thuộc vòng đời của?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(549, 2, 7, 'Để chuyển dữ liệu giữa activity dùng?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-20 21:26:02', '2025-11-20 21:26:02'),
(670, NULL, 7, 'Amazon EC2 stands for what?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-25 14:12:06', '2025-11-25 14:12:06'),
(671, NULL, 7, 'What is the fundamental computing unit provided by Amazon EC2?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-25 14:12:06', '2025-11-25 14:12:06'),
(672, NULL, 7, 'Which protocol is typically used to securely connect to a Linux EC2 instance?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-25 14:12:06', '2025-11-25 14:12:06'),
(673, NULL, 7, 'What is an Amazon Machine Image (AMI) primarily used for?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-25 14:12:06', '2025-11-25 14:12:06'),
(674, NULL, 7, 'What is the main purpose of an EC2 Security Group?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-25 14:12:06', '2025-11-25 14:12:06'),
(675, NULL, 7, 'Which of these is an example of an EC2 instance type family generally recommended for balanced workloads, offering a balance of compute, memory, and networking resources?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(676, NULL, 7, 'You need to run a stateless web application with fluctuating traffic that can tolerate occasional interruptions to save costs. Which EC2 purchasing option would be most cost-effective?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(677, NULL, 7, 'An application requires high-performance, transactional workloads with frequent read/write operations and consistent low latency. Which EBS volume type would be most suitable?', 'SingleChoice', 'Medium', 'D', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(678, NULL, 7, 'What happens to data stored on an EC2 instance store (ephemeral storage) when the instance is stopped?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(679, NULL, 7, 'What is an Elastic IP address in AWS EC2?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(680, NULL, 7, 'Which action would result in the loss of the public IP address assigned to an On-Demand EC2 instance (assuming no Elastic IP is attached)?', 'SingleChoice', 'Medium', 'A', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(681, NULL, 7, 'You have an EC2 instance running a critical database. You need to create a consistent backup of its EBS root volume while the instance is running. What is the recommended method?', 'SingleChoice', 'Medium', 'C', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(682, NULL, 7, 'You are configuring a Security Group for a web server. Which rule should you add to allow inbound HTTP traffic from anywhere on the internet?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(683, NULL, 7, 'You want to configure an EC2 instance to automatically restart on a different underlying host if it encounters an unrecoverable system error (e.g., hardware failure). Which AWS feature directly supports this behavior for a single instance?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(684, NULL, 7, 'Which of the following statements about sharing Amazon Machine Images (AMIs) is TRUE?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(685, NULL, 7, 'You need to migrate an application to AWS EC2 that requires very low network latency between instances and high network throughput within a single Availability Zone. Which Placement Group strategy would you recommend?', 'SingleChoice', 'Medium', 'B', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(686, NULL, 7, 'A legacy application has strict licensing requirements tied to physical server characteristics (e.g., number of cores, sockets). Which EC2 purchasing option allows you to bring your own software licenses and provides visibility into the underlying physical server?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(687, NULL, 7, 'You have an EC2 instance that runs a batch processing job. If the job fails halfway through, you want to resume it from the last saved state (including RAM content) rather than starting over, to save computation time. Which EC2 feature would be most beneficial for this scenario?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(688, NULL, 7, 'A developer accidentally left an outbound rule in a Security Group allowing all traffic (0.0.0.0/0) on all ports. There is also a Network Access Control List (NACL) associated with the subnet, which explicitly denies outbound traffic on port 22 with a low rule number (higher precedence). Which statement is true regarding SSH access from the EC2 instance to an external host on port 22?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(689, NULL, 7, 'You are designing a highly available, fault-tolerant application across multiple Availability Zones. Your Auto Scaling Group is configured to launch instances in a Spread Placement Group. What is the primary benefit of using a Spread Placement Group in this context?', 'SingleChoice', 'Hard', 'A', NULL, '2025-11-25 14:12:07', '2025-11-25 14:12:07'),
(730, NULL, 7, 'Trong lập trình C#, khi sử dụng ràng buộc generic `where T : new()`, điều gì xảy ra nếu `T` là một `struct`?', 'SingleChoice', 'Hard', 'A', NULL, '2025-11-28 13:05:11', '2025-11-28 13:05:11'),
(731, NULL, 7, 'Cho một `MulticastDelegate` được tạo với ba phương thức `A`, `B`, `C` theo thứ tự đó. Nếu phương thức `B` ném ra một ngoại lệ không được xử lý, điều gì sẽ xảy ra với phương thức `C`?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:11', '2025-11-28 13:05:11'),
(732, NULL, 7, 'Trong một kịch bản mà đối tượng phát sự kiện (publisher) có vòng đời dài và các đối tượng đăng ký (subscriber) có vòng đời ngắn, cách tốt nhất để ngăn chặn rò rỉ bộ nhớ mà không cần hủy đăng ký thủ công là gì?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-28 13:05:11', '2025-11-28 13:05:11'),
(733, NULL, 7, 'C# 8.0 đã giới thiệu các phương thức giao diện mặc định (Default Interface Methods - DIMs). Nếu một lớp triển khai một giao diện có DIM, và lớp đó cũng cung cấp triển khai riêng cho phương thức đó, thì triển khai nào sẽ được gọi khi truy cập thông qua kiểu giao diện?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:12', '2025-11-28 13:05:12'),
(734, NULL, 7, 'Trong các kịch bản sau, kịch bản nào thể hiện đúng nghịch biến (contravariance)?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:12', '2025-11-28 13:05:12'),
(735, NULL, 7, 'Xét `struct Point { public int X, Y; }` và `class Location { public int X, Y; }`. Nếu một `Point` được truyền cho một phương thức nhận `object` và sau đó được unbox, sự khác biệt chính so với một thể hiện `Location` được truyền tương tự là gì?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:12', '2025-11-28 13:05:12'),
(736, NULL, 7, 'Sử dụng Reflection để gọi các phương thức có thể chậm hơn đáng kể so với các lệnh gọi trực tiếp. Đối với một kịch bản cực kỳ quan trọng về hiệu suất yêu cầu gọi phương thức động dựa trên tên chuỗi, cách tiếp cận nào cung cấp sự cân bằng tốt hơn giữa tính linh hoạt và hiệu suất so với gọi `MethodInfo.Invoke` trực tiếp?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:13', '2025-11-28 13:05:13'),
(737, NULL, 7, 'Trong ứng dụng WPF, việc gọi một phương thức `async` mà không `await` nó, và sau đó chặn ngay lập tức luồng UI (ví dụ: `Task.Wait()`), có thể dẫn đến bế tắc (deadlock). Phát biểu nào sau đây mô tả đúng nhất nguyên nhân cơ bản?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-28 13:05:13', '2025-11-28 13:05:13'),
(738, NULL, 7, 'Xem xét câu lệnh LINQ sau: `var query = collection.Where(item => { Console.WriteLine(item); return item > 5; });`. `Console.WriteLine(item)` sẽ được thực thi khi nào?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:13', '2025-11-28 13:05:13'),
(739, NULL, 7, 'Bạn có một ứng dụng yêu cầu các thuật toán tính thuế khác nhau (ví dụ: VAT, Thuế bán hàng, Thuế thu nhập) có thể hoán đổi trong thời gian chạy mà không thay đổi mã client. Mẫu thiết kế nào phù hợp nhất cho kịch bản này?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-28 13:05:13', '2025-11-28 13:05:13'),
(740, NULL, 7, 'Cho lớp cơ sở `Base` có `public virtual void Method()` và lớp dẫn xuất `Derived` có `public new void Method()`. Nếu bạn có `Base b = new Derived(); b.Method();`, thì triển khai `Method` nào sẽ được gọi?', 'SingleChoice', 'Hard', 'A', NULL, '2025-11-28 13:05:14', '2025-11-28 13:05:14'),
(741, NULL, 7, 'Khi triển khai `IDisposable` cho một lớp quản lý tài nguyên không được quản lý (unmanaged resources), lý do chính để cũng triển khai một finalizer là gì?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:14', '2025-11-28 13:05:14'),
(742, NULL, 7, 'Đối với một kiểu `class` tùy chỉnh, nếu bạn ghi đè `Equals(object obj)` nhưng không ghi đè `GetHashCode()`, hậu quả tiềm ẩn là gì?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-28 13:05:14', '2025-11-28 13:05:14'),
(743, NULL, 7, 'Bạn cần tuần tự hóa một đối tượng có chứa thông tin nhạy cảm và chỉ dữ liệu cụ thể, đã được biến đổi mới là một phần của đầu ra tuần tự hóa, không phải các trường thô. Giao diện nào cung cấp quyền kiểm soát cao nhất đối với quá trình tuần tự hóa tùy chỉnh này?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-28 13:05:15', '2025-11-28 13:05:15'),
(744, NULL, 7, 'Trong một phương thức generic `T GetDefault<T>()`, giá trị được trả về bởi `return default(T);` là gì nếu `T` là một kiểu `enum`?', 'SingleChoice', 'Hard', 'C', NULL, '2025-11-28 13:05:15', '2025-11-28 13:05:15'),
(745, NULL, 7, 'Xét `public class Outer { protected internal class Inner { } }`. Từ vị trí nào `Inner` có thể được truy cập?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:15', '2025-11-28 13:05:15'),
(746, NULL, 7, 'Một module phần mềm được thiết kế sao cho việc thêm chức năng mới yêu cầu sửa đổi mã nguồn hiện có của nó, thay vì mở rộng nó. Thiết kế này vi phạm nguyên tắc SOLID nào?', 'SingleChoice', 'Hard', 'D', NULL, '2025-11-28 13:05:16', '2025-11-28 13:05:16'),
(747, NULL, 7, 'Cho `int? x = null; int y = x ?? 10;`. Giá trị của `y` là gì? Và kiểu kết quả của `x + 5` là gì?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:16', '2025-11-28 13:05:16'),
(748, NULL, 7, 'Phát biểu nào sau đây về các phương thức mở rộng (extension methods) trong C# là SAI?', 'SingleChoice', 'Hard', 'A', NULL, '2025-11-28 13:05:16', '2025-11-28 13:05:16'),
(749, NULL, 7, 'Bạn đang triển khai một cơ chế caching, nơi các đối tượng được cache sẽ tự động bị xóa khỏi cache bởi trình thu gom rác nếu chúng không còn được tham chiếu mạnh ở bất kỳ đâu khác trong ứng dụng. Cấu trúc C# nào phù hợp nhất để giữ các tham chiếu đến các mục cache này?', 'SingleChoice', 'Hard', 'B', NULL, '2025-11-28 13:05:16', '2025-11-28 13:05:16'),
(810, NULL, 7, 'Dịch vụ AWS nào sau đây cung cấp khả năng điện toán có thể thay đổi kích thước trên đám mây dưới dạng máy chủ ảo?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:45', '2025-11-28 15:13:45'),
(811, NULL, 7, 'EC2 là viết tắt của từ gì trong AWS?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:45', '2025-11-28 15:13:45'),
(812, NULL, 7, 'Một \'instance\' trong Amazon EC2 đại diện cho điều gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:45', '2025-11-28 15:13:45'),
(813, NULL, 7, 'Thành phần nào sau đây được sử dụng làm khuôn mẫu (template) để khởi chạy các EC2 instances?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:45', '2025-11-28 15:13:45'),
(814, NULL, 7, 'Để kết nối an toàn với một EC2 instance Linux bằng SSH, bạn cần sử dụng thành phần nào?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:46', '2025-11-28 15:13:46'),
(815, NULL, 7, 'Thành phần nào của EC2 hoạt động như một bức tường lửa ảo, kiểm soát lưu lượng truy cập vào và ra của instance?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:46', '2025-11-28 15:13:46'),
(816, NULL, 7, 'Loại lưu trữ nào cung cấp khả năng lưu trữ khối (block storage) liên tục có thể được gắn vào EC2 instances?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:46', '2025-11-28 15:13:46'),
(817, NULL, 7, 'Mô hình giá EC2 nào cho phép bạn đặt giá cho dung lượng EC2 dự phòng (unused capacity)?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:47', '2025-11-28 15:13:47'),
(818, NULL, 7, 'Để có chi phí thấp nhất cho các khối lượng công việc liên tục, có thể dự đoán được trong thời gian dài (1 hoặc 3 năm), mô hình giá EC2 nào là phù hợp nhất?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:47', '2025-11-28 15:13:47'),
(819, NULL, 7, 'Một \'Region\' trong AWS được định nghĩa là gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:47', '2025-11-28 15:13:47'),
(820, NULL, 7, 'Một \'Availability Zone\' trong AWS được định nghĩa là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:47', '2025-11-28 15:13:47'),
(821, NULL, 7, 'Loại instance nào được bao gồm trong AWS Free Tier cho phép sử dụng miễn phí 750 giờ mỗi tháng?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:48', '2025-11-28 15:13:48'),
(822, NULL, 7, 'Khi bạn dừng và khởi động lại một EC2 instance (không có Elastic IP), điều gì sẽ xảy ra với địa chỉ IP công cộng của nó?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 15:13:48', '2025-11-28 15:13:48'),
(823, NULL, 7, 'Dịch vụ AWS nào thường được sử dụng cùng với EC2 để tự động điều chỉnh số lượng instances dựa trên nhu cầu tải?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:48', '2025-11-28 15:13:48'),
(824, NULL, 7, 'Bạn sử dụng loại địa chỉ IP nào để cung cấp một địa chỉ IP công cộng tĩnh cho EC2 instance của mình, ngay cả khi nó bị dừng hoặc khởi động lại?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:48', '2025-11-28 15:13:48'),
(825, NULL, 7, 'EC2 instance type \'t2.micro\' thuộc về nhóm instance nào, được tối ưu hóa cho hiệu suất bật/tắt (burstable performance)?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:49', '2025-11-28 15:13:49'),
(826, NULL, 7, 'Bạn có thể chỉ định một tập hợp các lệnh để chạy tự động khi một EC2 instance được khởi chạy lần đầu tiên bằng cách sử dụng tính năng nào?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:49', '2025-11-28 15:13:49'),
(827, NULL, 7, 'Để quản lý quyền truy cập của EC2 instance vào các dịch vụ AWS khác (ví dụ: S3, DynamoDB), bạn nên sử dụng gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:49', '2025-11-28 15:13:49'),
(828, NULL, 7, 'Loại instance store nào cung cấp bộ lưu trữ khối hiệu suất cao, tạm thời, được gắn cục bộ với instance?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:50', '2025-11-28 15:13:50'),
(829, NULL, 7, 'Một trong những lợi ích chính của việc sử dụng Amazon EC2 là khả năng tăng hoặc giảm tài nguyên điện toán một cách nhanh chóng. Điều này được gọi là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 15:13:50', '2025-11-28 15:13:50'),
(830, NULL, 7, 'C# là ngôn ngữ lập trình được phát triển bởi công ty nào?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 22:16:37', '2025-11-28 22:16:37'),
(831, NULL, 7, 'Để in một dòng chữ ra màn hình console trong C#, cú pháp nào sau đây là đúng?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-28 22:16:37', '2025-11-28 22:16:37'),
(832, NULL, 7, 'Từ khóa nào được sử dụng để khai báo một biến số nguyên trong C#?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:37', '2025-11-28 22:16:37'),
(833, NULL, 7, 'Mỗi câu lệnh trong C# phải kết thúc bằng ký tự nào?', 'SingleChoice', 'Easy', 'D', NULL, '2025-11-28 22:16:38', '2025-11-28 22:16:38'),
(834, NULL, 7, 'Khối mã lệnh trong C# được định nghĩa bằng cách sử dụng cặp ký tự nào?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:38', '2025-11-28 22:16:38'),
(835, NULL, 7, 'Từ khóa nào được sử dụng để bắt đầu khai báo một lớp (class) mới trong C#?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:38', '2025-11-28 22:16:38'),
(836, NULL, 7, 'Toán tử nào sau đây dùng để gán giá trị cho một biến?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:39', '2025-11-28 22:16:39'),
(837, NULL, 7, 'Kiểu dữ liệu nào dùng để lưu trữ các giá trị đúng/sai (true/false)?', 'SingleChoice', 'Easy', 'D', NULL, '2025-11-28 22:16:39', '2025-11-28 22:16:39'),
(838, NULL, 7, 'Đoạn code nào sau đây là một comment (chú thích) một dòng trong C#?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 22:16:39', '2025-11-28 22:16:39'),
(839, NULL, 7, 'Để khai báo một hằng số (constant) trong C#, từ khóa nào được sử dụng?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:39', '2025-11-28 22:16:39'),
(840, NULL, 7, 'Phương thức `Main` trong một ứng dụng C# console có vai trò gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:40', '2025-11-28 22:16:40'),
(841, NULL, 7, 'Toán tử nào dùng để kiểm tra sự bằng nhau về giá trị của hai biến?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 22:16:40', '2025-11-28 22:16:40'),
(842, NULL, 7, 'Cú pháp đúng để khai báo và khởi tạo một mảng số nguyên có 5 phần tử là gì?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-28 22:16:40', '2025-11-28 22:16:40'),
(843, NULL, 7, 'Để bao gồm một namespace vào chương trình C#, từ khóa nào được sử dụng?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:41', '2025-11-28 22:16:41'),
(844, NULL, 7, 'Câu lệnh `if-else` trong C# được sử dụng để làm gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:41', '2025-11-28 22:16:41'),
(845, NULL, 7, 'Vòng lặp `for` thường được sử dụng khi nào?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 22:16:41', '2025-11-28 22:16:41'),
(846, NULL, 7, 'Điều gì mô tả đúng nhất một \'đối tượng\' (object) trong lập trình hướng đối tượng C#?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:42', '2025-11-28 22:16:42'),
(847, NULL, 7, 'Kiểu dữ liệu nào được sử dụng để lưu trữ chuỗi ký tự (text)?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:42', '2025-11-28 22:16:42'),
(848, NULL, 7, 'Giá trị mặc định của một biến kiểu `int` nếu không được khởi tạo tường minh là bao nhiêu?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 22:16:42', '2025-11-28 22:16:42'),
(849, NULL, 7, 'Để khai báo một phương thức không trả về giá trị nào, từ khóa nào được sử dụng?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 22:16:43', '2025-11-28 22:16:43'),
(850, NULL, 7, 'Địa chỉ IP lớp C mặc định có subnet mask là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(851, NULL, 7, 'Trong ký hiệu CIDR, /24 đại diện cho điều gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(852, NULL, 7, 'Mục đích chính của việc chia mạng con (subnetting) là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(853, NULL, 7, 'Nếu bạn mượn 3 bit từ phần host để chia mạng con, bạn có thể tạo ra bao nhiêu mạng con?', 'SingleChoice', 'Easy', 'D', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(854, NULL, 7, 'Cho địa chỉ IP 192.168.1.50/24, địa chỉ mạng (network address) là gì?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(855, NULL, 7, 'Cho địa chỉ IP 192.168.1.50/24, địa chỉ quảng bá (broadcast address) là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(856, NULL, 7, 'Với subnet mask 255.255.255.0, có bao nhiêu bit được sử dụng cho phần mạng?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(857, NULL, 7, 'Địa chỉ IP nào sau đây thuộc mạng Class A?', 'SingleChoice', 'Easy', 'A', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(858, NULL, 7, 'Đối với mạng 172.16.0.0/20, có bao nhiêu bit được mượn cho phần mạng con?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(859, NULL, 7, 'Có bao nhiêu địa chỉ host khả dụng trong một mạng con /27?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(860, NULL, 7, 'Subnet mask cho CIDR /26 là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(861, NULL, 7, 'Dải địa chỉ IP nào sau đây được dành riêng cho sử dụng riêng tư (private) trong Class B?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(862, NULL, 7, 'Số lượng host tối đa trong một mạng Class B khi sử dụng subnet mask mặc định của nó là bao nhiêu?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(863, NULL, 7, 'Với mạng 192.168.10.0/28, kích thước khối (block size) của các mạng con là bao nhiêu?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(864, NULL, 7, 'Cho mạng con 192.168.10.32/28, địa chỉ IP host khả dụng đầu tiên là gì?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(865, NULL, 7, 'Cho mạng con 192.168.10.32/28, địa chỉ IP host khả dụng cuối cùng là gì?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(866, NULL, 7, 'Điều gì xảy ra với số lượng địa chỉ host khả dụng khi bạn mượn thêm bit để chia mạng con?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(867, NULL, 7, 'Dải địa chỉ IP nào sau đây KHÔNG phải là dải IP riêng tư hợp lệ?', 'SingleChoice', 'Easy', 'D', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(868, NULL, 7, 'Thuật ngữ nào dùng để chỉ việc chia một mạng lớn thành các mạng con nhỏ hơn, dễ quản lý hơn?', 'SingleChoice', 'Easy', 'C', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44'),
(869, NULL, 7, 'Nếu một mạng sử dụng subnet mask 255.255.255.240, có bao nhiêu bit được sử dụng cho phần host?', 'SingleChoice', 'Easy', 'B', NULL, '2025-11-28 23:51:44', '2025-11-28 23:51:44');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `question_materials`
--

CREATE TABLE `question_materials` (
  `id` int NOT NULL,
  `question_id` bigint NOT NULL,
  `material_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `question_materials`
--

INSERT INTO `question_materials` (`id`, `question_id`, `material_id`, `created_at`) VALUES
(1, 830, 2, '2025-11-28 22:30:42'),
(2, 831, 2, '2025-11-28 22:30:42'),
(3, 832, 2, '2025-11-28 22:30:42'),
(4, 833, 2, '2025-11-28 22:30:43'),
(5, 834, 2, '2025-11-28 22:30:43'),
(6, 835, 2, '2025-11-28 22:30:43'),
(7, 836, 2, '2025-11-28 22:30:43'),
(8, 837, 2, '2025-11-28 22:30:43'),
(9, 838, 2, '2025-11-28 22:30:43'),
(10, 839, 2, '2025-11-28 22:30:43'),
(11, 840, 2, '2025-11-28 22:30:44'),
(12, 841, 2, '2025-11-28 22:30:44'),
(13, 842, 2, '2025-11-28 22:30:44'),
(14, 843, 2, '2025-11-28 22:30:44'),
(15, 844, 2, '2025-11-28 22:30:44'),
(16, 846, 2, '2025-11-28 22:30:44'),
(17, 847, 2, '2025-11-28 22:30:44'),
(18, 848, 2, '2025-11-28 22:30:44'),
(19, 849, 2, '2025-11-28 22:30:45');

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
(1224, 468, 'Thuật toán tạo lại cây từ đầu với mẫu dữ liệu mới.', 0),
(1225, 470, 'RAM', 0),
(1226, 470, 'CPU', 1),
(1227, 470, 'Ổ cứng (HDD)', 0),
(1228, 470, 'Card đồ họa (GPU)', 0),
(1229, 471, 'Lưu trữ dữ liệu lâu dài khi tắt máy', 0),
(1230, 471, 'Xử lý các tác vụ đồ họa', 0),
(1231, 471, 'Lưu trữ dữ liệu tạm thời cho CPU xử lý', 1),
(1232, 471, 'Cung cấp năng lượng cho máy tính', 0),
(1233, 472, 'Màn hình', 0),
(1234, 472, 'Máy in', 0),
(1235, 472, 'Bàn phím', 1),
(1236, 472, 'Loa', 0),
(1237, 473, 'Xử lý dữ liệu tức thì', 0),
(1238, 473, 'Hiển thị hình ảnh lên màn hình', 0),
(1239, 473, 'Lưu trữ dữ liệu và hệ điều hành vĩnh viễn', 1),
(1240, 473, 'Cung cấp nguồn điện cho các linh kiện', 0),
(1241, 474, 'CPU', 0),
(1242, 474, 'RAM', 0),
(1243, 474, 'Chipset', 1),
(1244, 474, 'Nguồn điện (PSU)', 0),
(1245, 475, 'Kiểm soát các thiết bị ngoại vi', 0),
(1246, 475, 'Xử lý các tác vụ liên quan đến đồ họa và hình ảnh', 1),
(1247, 475, 'Quản lý việc truyền dữ liệu giữa RAM và CPU', 0),
(1248, 475, 'Lưu trữ các chương trình khởi động hệ thống', 0),
(1249, 476, 'Chuột', 0),
(1250, 476, 'Webcam', 0),
(1251, 476, 'Máy in', 1),
(1252, 476, 'Máy quét', 0),
(1253, 477, 'Một phần cứng để lưu trữ dữ liệu', 0),
(1254, 477, 'Một chương trình phần mềm quản lý tài nguyên máy tính và cung cấp giao diện cho người dùng', 1),
(1255, 477, 'Một loại cáp kết nối các linh kiện', 0),
(1256, 477, 'Thiết bị hiển thị hình ảnh', 0),
(1257, 478, 'Chỉ để kết nối màn hình', 0),
(1258, 478, 'Kết nối các thiết bị ngoại vi như chuột, bàn phím, USB flash drive, v.v.', 1),
(1259, 478, 'Cung cấp nguồn điện chính cho toàn bộ máy tính', 0),
(1260, 478, 'Kết nối máy tính với mạng internet qua cáp quang', 0),
(1261, 479, 'Bo mạch chủ (Mainboard)', 0),
(1262, 479, 'CPU', 0),
(1263, 479, 'Bộ nguồn (PSU)', 1),
(1264, 479, 'Card đồ họa (GPU)', 0),
(1265, 480, 'Có thể ghi và xóa dữ liệu liên tục trong quá trình hoạt động', 0),
(1266, 480, 'Dữ liệu được lưu trữ trên ROM không bị mất khi tắt nguồn', 1),
(1267, 480, 'Tốc độ truy cập rất chậm so với ổ cứng', 0),
(1268, 480, 'Chỉ được sử dụng để lưu trữ các tệp tin cá nhân', 0),
(1269, 481, 'Thiết bị đầu vào', 0),
(1270, 481, 'Thiết bị đầu ra', 1),
(1271, 481, 'Thiết bị lưu trữ', 0),
(1272, 481, 'Thiết bị xử lý', 0),
(1273, 482, 'Cổng USB', 0),
(1274, 482, 'Cổng HDMI', 0),
(1275, 482, 'Cổng Ethernet (RJ45)', 1),
(1276, 482, 'Cổng Audio Jack', 0),
(1277, 483, 'Các linh kiện vật lý bên trong máy tính', 0),
(1278, 483, 'Tập hợp các chương trình, dữ liệu và hướng dẫn cho máy tính thực hiện các tác vụ', 1),
(1279, 483, 'Thiết bị kết nối internet', 0),
(1280, 483, 'Vật liệu làm vỏ máy tính', 0),
(1281, 484, 'Byte', 0),
(1282, 484, 'Gigahertz (GHz)', 1),
(1283, 484, 'Volt', 0),
(1284, 484, 'Watt', 0),
(1285, 485, 'Dung lượng lưu trữ luôn lớn hơn HDD', 0),
(1286, 485, 'Chi phí sản xuất thấp hơn nhiều', 0),
(1287, 485, 'Tốc độ truy cập và ghi đọc dữ liệu nhanh hơn, ít ồn và bền hơn', 1),
(1288, 485, 'Cần nguồn điện mạnh hơn để hoạt động', 0),
(1289, 486, 'Bộ nguồn (PSU)', 0),
(1290, 486, 'Quạt và tản nhiệt CPU', 1),
(1291, 486, 'RAM', 0),
(1292, 486, 'Ổ cứng', 0),
(1293, 487, 'Trong RAM, để lưu trữ dữ liệu tạm thời', 0),
(1294, 487, 'Trong CPU, để thực hiện các phép tính phức tạp', 0),
(1295, 487, 'Trong chip ROM trên bo mạch chủ, để khởi động hệ thống và kiểm tra phần cứng ban đầu', 1),
(1296, 487, 'Trong ổ cứng, để lưu trữ hệ điều hành', 0),
(1297, 488, 'Ctrl + X', 0),
(1298, 488, 'Ctrl + V', 0),
(1299, 488, 'Ctrl + C', 1),
(1300, 488, 'Ctrl + Z', 0),
(1301, 489, 'Chỉ để cấp nguồn điện cho máy tính', 0),
(1302, 489, 'Là bảng mạch chính kết nối và cho phép các linh kiện khác giao tiếp với nhau', 1),
(1303, 489, 'Chỉ để lưu trữ dữ liệu vĩnh viễn', 0),
(1304, 489, 'Xử lý các tác vụ đồ họa chuyên sâu', 0),
(1305, 490, 'Một tập hợp các máy tính được kết nối với nhau để chia sẻ tài nguyên và thông tin.', 1),
(1306, 490, 'Một hệ thống phần mềm dùng để quản lý dữ liệu trên một máy tính duy nhất.', 0),
(1307, 490, 'Một thiết bị duy nhất có khả năng xử lý nhiều tác vụ cùng lúc.', 0),
(1308, 490, 'Một phương pháp lưu trữ dữ liệu trên thiết bị di động.', 0),
(1309, 491, 'Local Area Network', 1),
(1310, 491, 'Large Access Node', 0),
(1311, 491, 'Link Access Network', 0),
(1312, 491, 'Local Asynchronous Network', 0),
(1313, 492, 'Router', 0),
(1314, 492, 'Switch', 0),
(1315, 492, 'Hub', 1),
(1316, 492, 'Firewall', 0),
(1317, 493, 'Nhận diện duy nhất một thiết bị trên một phân đoạn mạng cục bộ (LAN).', 0),
(1318, 493, 'Xác định địa chỉ vật lý của một card mạng.', 0),
(1319, 493, 'Định danh duy nhất một thiết bị trong mạng Internet và cho phép định tuyến dữ liệu giữa các mạng.', 1),
(1320, 493, 'Mã hóa dữ liệu trước khi truyền qua mạng.', 0),
(1321, 494, 'HTTP', 0),
(1322, 494, 'FTP', 0),
(1323, 494, 'DNS', 1),
(1324, 494, 'SMTP', 0),
(1325, 495, 'Tầng Phiên (Session Layer)', 0),
(1326, 495, 'Tầng Trình bày (Presentation Layer)', 1),
(1327, 495, 'Tầng Ứng dụng (Application Layer)', 0),
(1328, 495, 'Tầng Giao vận (Transport Layer)', 0),
(1329, 496, 'Tầng Ứng dụng (Application Layer)', 0),
(1330, 496, 'Tầng Internet (Internet Layer)', 0),
(1331, 496, 'Tầng Truy cập mạng (Network Access Layer)', 1),
(1332, 496, 'Tầng Giao vận (Transport Layer)', 0),
(1333, 497, 'TCP nhanh hơn UDP vì không có kiểm soát lỗi.', 0),
(1334, 497, 'UDP cung cấp độ tin cậy và kiểm soát luồng dữ liệu, trong khi TCP không.', 0),
(1335, 497, 'TCP là giao thức hướng kết nối và đáng tin cậy, trong khi UDP là không hướng kết nối và không đảm bảo tin cậy.', 1),
(1336, 497, 'TCP chỉ dùng cho truyền dữ liệu văn bản, còn UDP dùng cho truyền giọng nói và video.', 0),
(1337, 498, 'Switch', 0),
(1338, 498, 'Hub', 0),
(1339, 498, 'Repeater', 0),
(1340, 498, 'Router', 1),
(1341, 499, 'HTTP', 0),
(1342, 499, 'FTP', 0),
(1343, 499, 'HTTPS', 1),
(1344, 499, 'SMTP', 0),
(1345, 500, 'Một địa chỉ logic được gán cho thiết bị bởi router khi tham gia mạng.', 0),
(1346, 500, 'Một địa chỉ vật lý duy nhất được nhà sản xuất gán cho mỗi card mạng (NIC) và không đổi.', 1),
(1347, 500, 'Một tên miền được sử dụng để truy cập Internet.', 0),
(1348, 500, 'Một địa chỉ tạm thời được DHCP cấp phát cho thiết bị.', 0),
(1349, 501, 'Mã hóa dữ liệu truyền qua mạng để tăng cường bảo mật.', 0),
(1350, 501, 'Tự động cấp phát địa chỉ IP và các thông số cấu hình mạng khác (subnet mask, gateway, DNS) cho thiết bị.', 1),
(1351, 501, 'Chuyển đổi tên miền thành địa chỉ IP.', 0),
(1352, 501, 'Quản lý việc truyền tệp giữa máy chủ và máy khách.', 0),
(1353, 502, '21', 1),
(1354, 502, '23', 0),
(1355, 502, '25', 0),
(1356, 502, '80', 0),
(1357, 503, 'Class A', 0),
(1358, 503, 'Class B', 0),
(1359, 503, 'Class C', 1),
(1360, 503, 'Class D', 0),
(1361, 504, 'Cáp đồng trục (Coaxial Cable)', 0),
(1362, 504, 'Cáp sợi quang (Fiber Optic Cable)', 0),
(1363, 504, 'Cáp xoắn đôi (Twisted Pair Cable)', 1),
(1364, 504, 'Cáp điện thoại (Telephone Cable)', 0),
(1365, 505, 'Địa chỉ IP nguồn và đích thay đổi, Địa chỉ MAC nguồn và đích giữ nguyên.', 0),
(1366, 505, 'Địa chỉ IP nguồn và đích giữ nguyên, Địa chỉ MAC nguồn và đích thay đổi.', 1),
(1367, 505, 'Cả Địa chỉ IP và Địa chỉ MAC nguồn/đích đều thay đổi tại mỗi hop.', 0),
(1368, 505, 'Cả Địa chỉ IP và Địa chỉ MAC nguồn/đích đều giữ nguyên từ đầu đến cuối.', 0),
(1369, 506, '255.255.255.192 (/26)', 0),
(1370, 506, '255.255.255.224 (/27)', 1),
(1371, 506, '255.255.255.240 (/28)', 0),
(1372, 506, '255.255.255.128 (/25)', 0),
(1373, 507, 'IPv4 sử dụng ARP để phân giải địa chỉ, IPv6 sử dụng DNS để phân giải địa chỉ MAC.', 0),
(1374, 507, 'IPv6 có cơ chế tự động cấu hình địa chỉ (stateless autoconfiguration) và IPsec được tích hợp sẵn, IPv4 thì cần cấu hình thủ công và IPsec là tùy chọn.', 1),
(1375, 507, 'IPv4 hỗ trợ tốt hơn cho các thiết bị di động, trong khi IPv6 không hỗ trợ.', 0),
(1376, 507, 'IPv4 có header đơn giản hơn, IPv6 có header phức tạp hơn nhiều và không linh hoạt.', 0),
(1377, 508, 'Tầng Vật lý (Physical) và Tầng Liên kết dữ liệu (Data Link); dựa trên địa chỉ MAC.', 0),
(1378, 508, 'Tầng Mạng (Network) và Tầng Giao vận (Transport); dựa trên địa chỉ IP nguồn/đích, số cổng (port) và giao thức.', 1),
(1379, 508, 'Tầng Phiên (Session) và Tầng Trình bày (Presentation); dựa trên nội dung mã hóa của dữ liệu.', 0),
(1380, 508, 'Tầng Ứng dụng (Application); dựa trên giao diện người dùng và nội dung ứng dụng.', 0),
(1381, 509, 'Gửi yêu cầu dịch vụ và nhận kết quả từ các Client.', 0),
(1382, 509, 'Cung cấp tài nguyên, dịch vụ và xử lý các yêu cầu từ Client.', 1),
(1383, 509, 'Chỉ kết nối các thiết bị trong cùng một mạng LAN.', 0),
(1384, 509, 'Đảm bảo bảo mật vật lý cho các thiết bị mạng.', 0),
(1465, 530, 'Activity', 1),
(1466, 530, 'Fragment', 0),
(1467, 530, 'Service', 0),
(1468, 530, 'Broadcast', 0),
(1469, 530, 'A', 0),
(1470, 530, 'A', 0),
(1471, 531, 'build.gradle', 0),
(1472, 531, 'AndroidManifest.xml', 1),
(1473, 531, 'MainActivity.java', 0),
(1474, 531, 'gradle.properties', 0),
(1475, 531, 'B', 0),
(1476, 531, 'B', 0),
(1477, 532, 'Python', 0),
(1478, 532, 'Kotlin', 1),
(1479, 532, 'Swift', 0),
(1480, 532, 'Ruby', 0),
(1481, 532, 'B', 0),
(1482, 532, 'B', 0),
(1483, 533, 'FrameLayout', 0),
(1484, 533, 'LinearLayout', 1),
(1485, 533, 'RelativeLayout', 0),
(1486, 533, 'ConstraintLayout', 0),
(1487, 533, 'B', 0),
(1488, 533, 'B', 0),
(1489, 534, 'Maven', 0),
(1490, 534, 'Ant', 0),
(1491, 534, 'Gradle', 1),
(1492, 534, 'CMake', 0),
(1493, 534, 'C', 0),
(1494, 534, 'C', 0),
(1495, 535, 'strings.xml', 1),
(1496, 535, 'style.xml', 0),
(1497, 535, 'color.xml', 0),
(1498, 535, 'layout.xml', 0),
(1499, 535, 'A', 0),
(1500, 535, 'A', 0),
(1501, 536, 'ListView', 0),
(1502, 536, 'ScrollView', 0),
(1503, 536, 'RecyclerView', 1),
(1504, 536, 'TableView', 0),
(1505, 536, 'C', 0),
(1506, 536, 'C', 0),
(1507, 537, 'Intent', 1),
(1508, 537, 'Bundle', 0),
(1509, 537, 'Toast', 0),
(1510, 537, 'AlertDialog', 0),
(1511, 537, 'A', 0),
(1512, 537, 'A', 0),
(1513, 538, 'res/layout', 1),
(1514, 538, 'src/layout', 0),
(1515, 538, 'app/layout', 0),
(1516, 538, 'main/layout', 0),
(1517, 538, 'A', 0),
(1518, 538, 'A', 0),
(1519, 539, 'Snackbar', 0),
(1520, 539, 'Dialog', 0),
(1521, 539, 'Toast', 1),
(1522, 539, 'Popup', 0),
(1523, 539, 'C', 0),
(1524, 539, 'C', 0),
(1525, 540, 'Thread', 0),
(1526, 540, 'AsyncTask', 0),
(1527, 540, 'Coroutine', 1),
(1528, 540, 'ExecutorService', 0),
(1529, 540, 'C', 0),
(1530, 540, 'C', 0),
(1531, 541, 'File cấu hình', 0),
(1532, 541, 'File nén chứa source code', 0),
(1533, 541, 'File cài đặt ứng dụng', 1),
(1534, 541, 'File thư viện', 0),
(1535, 541, 'C', 0),
(1536, 541, 'C', 0),
(1537, 542, 'build.gradle', 0),
(1538, 542, 'AndroidManifest.xml', 1),
(1539, 542, 'config.json', 0),
(1540, 542, 'settings.gradle', 0),
(1541, 542, 'B', 0),
(1542, 542, 'B', 0),
(1543, 543, 'LinearLayout', 0),
(1544, 543, 'FrameLayout', 0),
(1545, 543, 'RelativeLayout', 0),
(1546, 543, 'ConstraintLayout', 1),
(1547, 543, 'D', 0),
(1548, 543, 'D', 0),
(1549, 544, 'SQLite', 0),
(1550, 544, 'SharedPreferences', 1),
(1551, 544, 'Room', 0),
(1552, 544, 'File', 0),
(1553, 544, 'B', 0),
(1554, 544, 'B', 0),
(1555, 545, 'HTML', 0),
(1556, 545, 'XML', 1),
(1557, 545, 'JSON', 0),
(1558, 545, 'YAML', 0),
(1559, 545, 'B', 0),
(1560, 545, 'B', 0),
(1561, 546, 'Hiển thị giao diện', 0),
(1562, 546, 'Xử lý nền', 1),
(1563, 546, 'Lưu dữ liệu', 0),
(1564, 546, 'Chạy animation', 0),
(1565, 546, 'B', 0),
(1566, 546, 'B', 0),
(1567, 547, 'PostgreSQL', 0),
(1568, 547, 'MySQL', 0),
(1569, 547, 'SQLite', 1),
(1570, 547, 'Oracle', 0),
(1571, 547, 'C', 0),
(1572, 547, 'C', 0),
(1573, 548, 'Service', 0),
(1574, 548, 'Activity', 1),
(1575, 548, 'Broadcast', 0),
(1576, 548, 'Application', 0),
(1577, 548, 'B', 0),
(1578, 548, 'B', 0),
(1579, 549, 'Intent + putExtra()', 1),
(1580, 549, 'Bundle + Toast()', 0),
(1581, 549, 'Dialog + Data()', 0),
(1582, 549, 'Layout + XML()', 0),
(1583, 549, 'A', 0),
(1584, 549, 'A', 0),
(2105, 670, 'Elastic Compute Cloud', 1),
(2106, 670, 'Enhanced Cloud Computing', 0),
(2107, 670, 'Enterprise Computing Services', 0),
(2108, 670, 'Event-Driven Cloud', 0),
(2109, 671, 'Virtual Private Cloud', 0),
(2110, 671, 'Amazon Machine Image', 0),
(2111, 671, 'Instance', 1),
(2112, 671, 'Elastic Block Store', 0),
(2113, 672, 'RDP (Remote Desktop Protocol)', 0),
(2114, 672, 'SSH (Secure Shell)', 1),
(2115, 672, 'HTTP (Hypertext Transfer Protocol)', 0),
(2116, 672, 'Telnet', 0),
(2117, 673, 'Storing user data for databases', 0),
(2118, 673, 'A template containing a software configuration to launch an instance', 1),
(2119, 673, 'Backing up EC2 instance data automatically', 0),
(2120, 673, 'Providing a static IP address to an EC2 instance', 0),
(2121, 674, 'To encrypt data on EBS volumes.', 0),
(2122, 674, 'To control inbound and outbound traffic to EC2 instances.', 1),
(2123, 674, 'To manage user permissions for accessing EC2 instances.', 0),
(2124, 674, 'To automatically scale EC2 instances based on demand.', 0),
(2125, 675, 'C series (Compute Optimized)', 0),
(2126, 675, 'M series (General Purpose)', 1),
(2127, 675, 'G series (Accelerated Computing)', 0),
(2128, 675, 'P series (Accelerated Computing)', 0),
(2129, 676, 'On-Demand Instances', 0),
(2130, 676, 'Reserved Instances', 0),
(2131, 676, 'Spot Instances', 1),
(2132, 676, 'Dedicated Hosts', 0),
(2133, 677, 'Cold HDD (sc1)', 0),
(2134, 677, 'Throughput Optimized HDD (st1)', 0),
(2135, 677, 'General Purpose SSD (gp3)', 0),
(2136, 677, 'Provisioned IOPS SSD (io2)', 1),
(2137, 678, 'Data persists and is available when the instance restarts.', 0),
(2138, 678, 'Data is moved to an S3 bucket for backup.', 0),
(2139, 678, 'Data is lost.', 1),
(2140, 678, 'Data is automatically encrypted and then restored upon restart.', 0),
(2141, 679, 'A dynamic public IP address assigned to an instance at launch.', 0),
(2142, 679, 'A private IP address that remains constant across instance stops and starts.', 0),
(2143, 679, 'A static public IP address that can be associated with any running instance in your account.', 1),
(2144, 679, 'A dedicated IP address for internal communication within a VPC.', 0),
(2145, 680, 'Stopping the instance.', 1),
(2146, 680, 'Rebooting the instance.', 0),
(2147, 680, 'Detaching an EBS volume from the instance.', 0),
(2148, 680, 'Modifying the instance\'s security group.', 0),
(2149, 681, 'Directly copy files from the EBS volume to S3 using \'aws s3 cp\'.', 0),
(2150, 681, 'Detach the EBS volume, then create a snapshot.', 0),
(2151, 681, 'Create an EBS snapshot of the volume while the instance is running.', 1),
(2152, 681, 'Terminate the instance, then create an AMI from it.', 0),
(2153, 682, 'Type: SSH, Protocol: TCP, Port Range: 80, Source: 0.0.0.0/0', 0),
(2154, 682, 'Type: HTTP, Protocol: TCP, Port Range: 80, Source: 0.0.0.0/0', 1),
(2155, 682, 'Type: Custom TCP, Protocol: TCP, Port Range: 22, Source: 0.0.0.0/0', 0),
(2156, 682, 'Type: HTTPS, Protocol: TCP, Port Range: 443, Source: My IP', 0),
(2157, 683, 'Auto Scaling Group with health checks.', 0),
(2158, 683, 'EC2 Instance Recovery provided by CloudWatch Alarms.', 1),
(2159, 683, 'Elastic Load Balancer target group health checks.', 0),
(2160, 683, 'AWS Systems Manager Run Command.', 0),
(2161, 684, 'Shared AMIs are always public and accessible by anyone.', 0),
(2162, 684, 'You can share your custom AMIs with specific AWS accounts.', 1),
(2163, 684, 'Shared AMIs automatically include all your security group configurations.', 0),
(2164, 684, 'You cannot launch instances from shared AMIs without first copying them to your own account.', 0),
(2165, 685, 'Spread Placement Group', 0),
(2166, 685, 'Cluster Placement Group', 1),
(2167, 685, 'Partition Placement Group', 0),
(2168, 685, 'Dedicated Host', 0),
(2169, 686, 'Reserved Instances', 0),
(2170, 686, 'Dedicated Instances', 0),
(2171, 686, 'Dedicated Hosts', 1),
(2172, 686, 'Spot Instances', 0),
(2173, 687, 'EBS Snapshots', 0),
(2174, 687, 'EC2 Hibernation', 1),
(2175, 687, 'Instance Store Backups', 0),
(2176, 687, 'AWS Systems Manager Automation', 0),
(2177, 688, 'SSH access will be allowed because Security Groups are stateful.', 0),
(2178, 688, 'SSH access will be allowed because Security Groups take precedence over NACLs.', 0),
(2179, 688, 'SSH access will be denied because NACLs are stateless and process rules in order, and the deny rule will take effect.', 1),
(2180, 688, 'SSH access will be denied because Security Groups explicitly deny the traffic.', 0),
(2181, 689, 'Ensures instances are launched on distinct underlying hardware to minimize correlated failures.', 1),
(2182, 689, 'Provides the lowest possible network latency between instances.', 0),
(2183, 689, 'Distributes instances evenly across multiple subnets within a single Availability Zone.', 0),
(2184, 689, 'Guarantees that all instances remain in the same Availability Zone for consistent performance.', 0),
(2345, 730, 'Ràng buộc `new()` được ngầm hiểu đối với các kiểu `struct`.', 1),
(2346, 730, 'Ràng buộc `new()` yêu cầu rõ ràng một constructor không tham số cho `struct`.', 0),
(2347, 730, 'Ràng buộc `new()` không thể áp dụng cho các kiểu `struct`.', 0),
(2348, 730, '`struct` không thể được sử dụng với ràng buộc `new()`.', 0),
(2349, 731, '`C` sẽ được gọi ngay sau `A`.', 0),
(2350, 731, '`C` sẽ không được gọi.', 1),
(2351, 731, '`C` chỉ được gọi nếu `A` cũng ném ra một ngoại lệ.', 0),
(2352, 731, '`C` sẽ được gọi và ngoại lệ từ `B` bị triệt tiêu.', 0),
(2353, 732, 'Sử dụng delegate `EventHandler<T>`.', 0),
(2354, 732, 'Triển khai giao diện `IDisposable` trên đối tượng đăng ký.', 0),
(2355, 732, 'Áp dụng mô hình sự kiện yếu (weak event pattern).', 1),
(2356, 732, 'Đánh dấu sự kiện bằng từ khóa `static`.', 0),
(2357, 733, 'DIM của giao diện được gọi.', 0),
(2358, 733, 'Triển khai của lớp được gọi.', 1),
(2359, 733, 'Nó gây ra lỗi biên dịch.', 0),
(2360, 733, 'Nó gây ra lỗi thời gian chạy.', 0),
(2361, 734, '`IEnumerable<string>` gán cho `IEnumerable<object>`', 0),
(2362, 734, '`Action<object>` gán cho `Action<string>`', 1),
(2363, 734, '`Func<string, object>` gán cho `Func<object, string>`', 0),
(2364, 734, '`IList<string>` gán cho `IList<object>`', 0),
(2365, 735, '`Point` sẽ luôn được truyền bằng tham chiếu.', 0),
(2366, 735, 'Boxing `Point` tạo một đối tượng mới trên heap, trong khi `Location` đã là một tham chiếu.', 1),
(2367, 735, 'Unboxing `Point` cho phép sửa đổi trực tiếp struct gốc.', 0),
(2368, 735, 'Cả `Point` và `Location` đều trải qua quá trình boxing và unboxing.', 0),
(2369, 736, 'Lưu trữ các đối tượng `MethodInfo` vào bộ nhớ đệm.', 0),
(2370, 736, 'Sử dụng `DynamicMethod` hoặc Expression Trees để biên dịch.', 1),
(2371, 736, 'Thay thế Reflection bằng các câu lệnh `switch`.', 0),
(2372, 736, 'Triển khai mô hình Factory với các delegate được định nghĩa trước.', 0),
(2373, 737, 'Phương thức `async` tự động sử dụng một luồng mới từ thread pool.', 0),
(2374, 737, '`Task.Wait()` ngăn luồng UI bắt giữ ngữ cảnh đồng bộ hóa (synchronization context).', 0),
(2375, 737, '`SynchronizationContext` cố gắng tiếp tục phương thức `async` trên luồng UI đang bị chặn.', 1),
(2376, 737, 'Trình thu gom rác (garbage collector) không thể thu hồi đối tượng `Task`.', 0),
(2377, 738, 'Ngay lập tức khi `query` được định nghĩa.', 0),
(2378, 738, 'Khi `query` được lặp qua (ví dụ: trong vòng lặp `foreach`).', 1),
(2379, 738, 'Khi `collection` lần đầu tiên được điền dữ liệu.', 0),
(2380, 738, 'Chỉ khi một lệnh gọi `ToList()` được thực hiện trên `query`.', 0),
(2381, 739, 'Mẫu Observer (Observer Pattern).', 0),
(2382, 739, 'Mẫu Factory Method (Factory Method Pattern).', 0),
(2383, 739, 'Mẫu Strategy (Strategy Pattern).', 1),
(2384, 739, 'Mẫu Singleton (Singleton Pattern).', 0),
(2385, 740, '`Base.Method()`.', 1),
(2386, 740, '`Derived.Method()`.', 0),
(2387, 740, 'Lỗi biên dịch.', 0),
(2388, 740, 'Lỗi thời gian chạy.', 0),
(2389, 741, 'Để đảm bảo dọn dẹp ngay lập tức các tài nguyên được quản lý.', 0),
(2390, 741, 'Để ngăn chặn rò rỉ tài nguyên nếu `Dispose()` không được gọi rõ ràng.', 1),
(2391, 741, 'Để cho phép trình thu gom rác xác định thời điểm giải phóng tài nguyên không được quản lý.', 0),
(2392, 741, 'Để kích hoạt chức năng của câu lệnh `using`.', 0),
(2393, 742, '`Equals` sẽ luôn trả về `false`.', 0),
(2394, 742, 'Lớp không thể được sử dụng làm khóa trong `Dictionary<TKey, TValue>`.', 0),
(2395, 742, 'Các collection dựa vào hash code (ví dụ: `HashSet<T>`) có thể hoạt động không chính xác.', 1),
(2396, 742, 'Nó sẽ dẫn đến lỗi biên dịch.', 0),
(2397, 743, '`ICloneable`.', 0),
(2398, 743, '`IDisposable`.', 0),
(2399, 743, '`ISerializable`.', 1),
(2400, 743, '`IComparable`.', 0),
(2401, 744, 'Một lỗi biên dịch.', 0),
(2402, 744, 'Giá trị của phần tử enum đầu tiên được định nghĩa.', 0),
(2403, 744, 'Giá trị số nguyên cơ bản `0` cho kiểu enum.', 1),
(2404, 744, '`null`.', 0),
(2405, 745, 'Chỉ từ bên trong `Outer`.', 0),
(2406, 745, 'Từ bất kỳ mã nào trong cùng assembly, hoặc từ các lớp dẫn xuất (ngay cả khi trong các assembly khác).', 1),
(2407, 745, 'Chỉ từ các lớp dẫn xuất trong cùng assembly.', 0),
(2408, 745, 'Chỉ từ bên trong `Outer` hoặc các lớp dẫn xuất.', 0),
(2409, 746, 'Nguyên tắc Trách nhiệm Đơn nhất (Single Responsibility Principle).', 0),
(2410, 746, 'Nguyên tắc Thay thế Liskov (Liskov Substitution Principle).', 0),
(2411, 746, 'Nguyên tắc Phân tách Giao diện (Interface Segregation Principle).', 0),
(2412, 746, 'Nguyên tắc Đóng/Mở (Open/Closed Principle).', 1),
(2413, 747, '`y` là 0; `x + 5` là `int`.', 0),
(2414, 747, '`y` là 10; `x + 5` là `int?`.', 1),
(2415, 747, '`y` là null; `x + 5` là `int?`.', 0),
(2416, 747, '`y` là 10; `x + 5` là `int`.', 0),
(2417, 748, 'Chúng có thể mở rộng các lớp `static`.', 1),
(2418, 748, 'Chúng không thể ghi đè các phương thức thể hiện (instance methods) hiện có.', 0),
(2419, 748, 'Chúng là cú pháp đường (syntactic sugar) và được phân giải tại thời điểm biên dịch.', 0),
(2420, 748, 'Chúng phải được định nghĩa trong một lớp `static`.', 0),
(2421, 749, '`StrongReference`.', 0),
(2422, 749, '`WeakReference`.', 1),
(2423, 749, '`Lazy<T>`.', 0),
(2424, 749, '`ConcurrentDictionary<TKey, TValue>`.', 0),
(2665, 810, 'Amazon S3', 0),
(2666, 810, 'Amazon EC2', 1),
(2667, 810, 'Amazon RDS', 0),
(2668, 810, 'Amazon VPC', 0),
(2669, 811, 'Elastic Compute Cache', 0),
(2670, 811, 'Essential Cloud Computing', 0),
(2671, 811, 'Elastic Compute Cloud', 1),
(2672, 811, 'Extended Cloud Capacity', 0),
(2673, 812, 'Một cơ sở dữ liệu vật lý', 0),
(2674, 812, 'Một máy chủ ảo (virtual server)', 1),
(2675, 812, 'Một bộ lưu trữ đám mây', 0),
(2676, 812, 'Một mạng riêng ảo', 0),
(2677, 813, 'Elastic Block Store (EBS)', 0),
(2678, 813, 'Amazon Machine Image (AMI)', 1),
(2679, 813, 'Security Group', 0),
(2680, 813, 'Key Pair', 0),
(2681, 814, 'Security Group', 0),
(2682, 814, 'Elastic IP', 0),
(2683, 814, 'Key Pair', 1),
(2684, 814, 'Instance Type', 0),
(2685, 815, 'Network ACL', 0),
(2686, 815, 'Route Table', 0),
(2687, 815, 'Security Group', 1),
(2688, 815, 'Internet Gateway', 0),
(2689, 816, 'Amazon S3', 0),
(2690, 816, 'Amazon EBS', 1),
(2691, 816, 'Amazon Glacier', 0),
(2692, 816, 'Instance Store', 0),
(2693, 817, 'On-Demand Instances', 0),
(2694, 817, 'Reserved Instances', 0),
(2695, 817, 'Spot Instances', 1),
(2696, 817, 'Dedicated Hosts', 0),
(2697, 818, 'On-Demand Instances', 0),
(2698, 818, 'Reserved Instances', 1),
(2699, 818, 'Spot Instances', 0),
(2700, 818, 'Free Tier', 0),
(2701, 819, 'Một trung tâm dữ liệu đơn lẻ', 0),
(2702, 819, 'Một vị trí địa lý được cô lập và độc lập', 1),
(2703, 819, 'Một nhóm các Availability Zones trong một trung tâm dữ liệu', 0),
(2704, 819, 'Một bộ sưu tập các máy chủ ảo', 0),
(2705, 820, 'Một khu vực địa lý lớn', 0),
(2706, 820, 'Một tập hợp các Regions', 0),
(2707, 820, 'Một hoặc nhiều trung tâm dữ liệu riêng biệt, cách biệt trong một Region', 1),
(2708, 820, 'Một địa chỉ IP công cộng tĩnh', 0),
(2709, 821, 'c5.large', 0),
(2710, 821, 'm4.xlarge', 0),
(2711, 821, 't2.micro hoặc t3.micro', 1),
(2712, 821, 'r5.2xlarge', 0),
(2713, 822, 'Nó vẫn giữ nguyên', 0),
(2714, 822, 'Nó thay đổi', 1),
(2715, 822, 'Nó bị xóa vĩnh viễn', 0),
(2716, 822, 'Nó trở thành địa chỉ IP riêng', 0),
(2717, 823, 'Amazon S3', 0),
(2718, 823, 'Amazon RDS', 0),
(2719, 823, 'Auto Scaling Group', 1),
(2720, 823, 'Elastic Load Balancing', 0),
(2721, 824, 'Private IP', 0),
(2722, 824, 'Dynamic IP', 0),
(2723, 824, 'Elastic IP', 1),
(2724, 824, 'Reserved IP', 0),
(2725, 825, 'Compute Optimized', 0),
(2726, 825, 'Memory Optimized', 0),
(2727, 825, 'General Purpose', 1),
(2728, 825, 'Storage Optimized', 0),
(2729, 826, 'Security Group rules', 0),
(2730, 826, 'Key Pair configuration', 0),
(2731, 826, 'User Data scripts', 1),
(2732, 826, 'EBS snapshot', 0),
(2733, 827, 'EC2 Key Pair', 0),
(2734, 827, 'Security Group', 0),
(2735, 827, 'IAM Role', 1),
(2736, 827, 'Elastic IP', 0),
(2737, 828, 'Amazon S3', 0),
(2738, 828, 'Amazon EBS', 0),
(2739, 828, 'Instance Store', 1),
(2740, 828, 'Amazon EFS', 0),
(2741, 829, 'Tối ưu hóa chi phí', 0),
(2742, 829, 'Độ tin cậy', 0),
(2743, 829, 'Tính linh hoạt (Elasticity)', 1),
(2744, 829, 'Bảo mật mạng', 0),
(2745, 830, 'Google', 0),
(2746, 830, 'Microsoft', 1),
(2747, 830, 'Apple', 0),
(2748, 830, 'IBM', 0),
(2749, 831, 'Console.WriteLine(\"Hello World!\");', 1),
(2750, 831, 'System.Out.Println(\"Hello World!\");', 0),
(2751, 831, 'print(\"Hello World!\");', 0),
(2752, 831, 'cout << \"Hello World!\";', 0),
(2753, 832, 'string', 0),
(2754, 832, 'double', 0),
(2755, 832, 'int', 1),
(2756, 832, 'bool', 0),
(2757, 833, 'Dấu phẩy (,)', 0),
(2758, 833, 'Dấu chấm (.)', 0),
(2759, 833, 'Dấu hai chấm (:)', 0),
(2760, 833, 'Dấu chấm phẩy (;)', 1),
(2761, 834, '() (dấu ngoặc tròn)', 0),
(2762, 834, '[] (dấu ngoặc vuông)', 0),
(2763, 834, '{} (dấu ngoặc nhọn)', 1),
(2764, 834, '\"\" (dấu ngoặc kép)', 0),
(2765, 835, 'method', 0),
(2766, 835, 'function', 0),
(2767, 835, 'class', 1),
(2768, 835, 'struct', 0),
(2769, 836, '==', 0),
(2770, 836, '!=', 0),
(2771, 836, '=', 1),
(2772, 836, '+', 0),
(2773, 837, 'int', 0),
(2774, 837, 'string', 0),
(2775, 837, 'double', 0),
(2776, 837, 'bool', 1),
(2777, 838, '/* Đây là comment */', 0),
(2778, 838, '// Đây là comment', 1),
(2779, 838, '# Đây là comment', 0),
(2780, 838, '-- Đây là comment', 0),
(2781, 839, 'var', 0),
(2782, 839, 'static', 0),
(2783, 839, 'const', 1),
(2784, 839, 'readonly', 0),
(2785, 840, 'Khai báo các biến toàn cục', 0),
(2786, 840, 'Định nghĩa các lớp chính', 0),
(2787, 840, 'Điểm bắt đầu thực thi của chương trình', 1),
(2788, 840, 'Xử lý các ngoại lệ', 0),
(2789, 841, '=', 0),
(2790, 841, '==', 1),
(2791, 841, '===', 0),
(2792, 841, '!=', 0),
(2793, 842, 'int[] myArray = new int[5];', 1),
(2794, 842, 'int myArray[5];', 0),
(2795, 842, 'int[] myArray = {5};', 0),
(2796, 842, 'array<int> myArray(5);', 0),
(2797, 843, 'import', 0),
(2798, 843, 'include', 0),
(2799, 843, 'using', 1),
(2800, 843, 'require', 0),
(2801, 844, 'Lặp lại một khối mã', 0),
(2802, 844, 'Định nghĩa một hàm', 0),
(2803, 844, 'Thực hiện mã dựa trên một điều kiện', 1),
(2804, 844, 'Khai báo một biến', 0),
(2805, 845, 'Khi không biết số lần lặp', 0),
(2806, 845, 'Để lặp lại một khối mã một số lần xác định', 1),
(2807, 845, 'Để xử lý các sự kiện', 0),
(2808, 845, 'Để định nghĩa một đối tượng', 0),
(2809, 846, 'Một bản thiết kế cho một thực thể', 0),
(2810, 846, 'Một kiểu dữ liệu nguyên thủy', 0),
(2811, 846, 'Một thể hiện (instance) của một lớp', 1),
(2812, 846, 'Một từ khóa trong C#', 0),
(2813, 847, 'char', 0),
(2814, 847, 'int', 0),
(2815, 847, 'string', 1),
(2816, 847, 'byte', 0),
(2817, 848, 'null', 0),
(2818, 848, '-1', 0),
(2819, 848, '0', 1),
(2820, 848, 'Báo lỗi biên dịch', 0),
(2821, 849, 'return', 0),
(2822, 849, 'void', 1),
(2823, 849, 'null', 0),
(2824, 849, 'static', 0),
(2825, 850, '255.0.0.0', 0),
(2826, 850, '255.255.0.0', 0),
(2827, 850, '255.255.255.0', 1),
(2828, 850, '255.255.255.255', 0),
(2829, 851, '24 bit cho phần host', 0),
(2830, 851, '24 bit cho phần network', 1),
(2831, 851, '8 bit cho phần network', 0),
(2832, 851, '8 bit cho phần host', 0),
(2833, 852, 'Tăng tốc độ mạng', 0),
(2834, 852, 'Giảm số lượng địa chỉ IP khả dụng', 0),
(2835, 852, 'Chia một mạng lớn thành các mạng con nhỏ hơn, dễ quản lý hơn', 1),
(2836, 852, 'Bảo mật dữ liệu trên toàn bộ mạng', 0),
(2837, 853, '2', 0),
(2838, 853, '4', 0),
(2839, 853, '6', 0),
(2840, 853, '8', 1),
(2841, 854, '192.168.1.0', 1),
(2842, 854, '192.168.1.1', 0),
(2843, 854, '192.168.1.255', 0),
(2844, 854, '192.168.1.50', 0),
(2845, 855, '192.168.1.0', 0),
(2846, 855, '192.168.1.1', 0),
(2847, 855, '192.168.1.255', 1),
(2848, 855, '192.168.1.50', 0),
(2849, 856, '8', 0),
(2850, 856, '16', 0),
(2851, 856, '24', 1),
(2852, 856, '32', 0),
(2853, 857, '10.0.0.1', 1),
(2854, 857, '172.16.0.1', 0),
(2855, 857, '192.168.1.1', 0),
(2856, 857, '224.0.0.1', 0),
(2857, 858, '2 bit', 0),
(2858, 858, '4 bit', 1),
(2859, 858, '6 bit', 0),
(2860, 858, '8 bit', 0),
(2861, 859, '14', 0),
(2862, 859, '30', 1),
(2863, 859, '62', 0),
(2864, 859, '126', 0),
(2865, 860, '255.255.255.0', 0),
(2866, 860, '255.255.255.128', 0),
(2867, 860, '255.255.255.192', 1),
(2868, 860, '255.255.255.224', 0),
(2869, 861, '10.0.0.0 - 10.255.255.255', 0),
(2870, 861, '172.16.0.0 - 172.31.255.255', 1),
(2871, 861, '192.168.0.0 - 192.168.255.255', 0),
(2872, 861, '169.254.0.0 - 169.254.255.255', 0),
(2873, 862, '254', 0),
(2874, 862, '65534', 1),
(2875, 862, '16777214', 0),
(2876, 862, '2046', 0),
(2877, 863, '8', 0),
(2878, 863, '16', 1),
(2879, 863, '32', 0),
(2880, 863, '64', 0),
(2881, 864, '192.168.10.32', 0),
(2882, 864, '192.168.10.33', 1),
(2883, 864, '192.168.10.46', 0),
(2884, 864, '192.168.10.47', 0),
(2885, 865, '192.168.10.32', 0),
(2886, 865, '192.168.10.33', 0),
(2887, 865, '192.168.10.46', 1),
(2888, 865, '192.168.10.47', 0),
(2889, 866, 'Tăng lên', 0),
(2890, 866, 'Giảm xuống', 1),
(2891, 866, 'Không thay đổi', 0),
(2892, 866, 'Tăng gấp đôi', 0),
(2893, 867, '10.0.0.0 - 10.255.255.255', 0),
(2894, 867, '172.16.0.0 - 172.31.255.255', 0),
(2895, 867, '192.168.0.0 - 192.168.255.255', 0),
(2896, 867, '192.1.1.0 - 192.1.1.255', 1),
(2897, 868, 'Routing (Định tuyến)', 0),
(2898, 868, 'Bridging (Cầu nối)', 0),
(2899, 868, 'Subnetting (Chia mạng con)', 1),
(2900, 868, 'Switching (Chuyển mạch)', 0),
(2901, 869, '2 bit', 0),
(2902, 869, '4 bit', 1),
(2903, 869, '6 bit', 0),
(2904, 869, '8 bit', 0);

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
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Lý do chỉnh sửa điểm (bắt buộc)',
  `edited_by` bigint NOT NULL COMMENT 'ID giáo viên chỉnh sửa',
  `edited_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `score_audit_logs`
--

INSERT INTO `score_audit_logs` (`log_id`, `attempt_id`, `question_id`, `old_score`, `new_score`, `old_total_score`, `new_total_score`, `reason`, `edited_by`, `edited_at`) VALUES
(10, 42, NULL, 0.00, 10.00, NULL, NULL, '.', 7, '2025-11-17 05:29:54'),
(13, 42, NULL, 10.00, 9.00, NULL, NULL, '.', 7, '2025-11-17 05:41:00'),
(14, 42, NULL, NULL, NULL, 10.00, 9.00, '.', 7, '2025-11-17 05:41:00'),
(15, 42, NULL, 9.00, 10.00, NULL, NULL, 'sửa điểm', 7, '2025-11-17 05:43:35'),
(16, 42, NULL, NULL, NULL, 9.00, 10.00, 'sửa điểm', 7, '2025-11-17 05:43:35'),
(17, 44, 469, 0.00, 10.00, NULL, NULL, '.', 7, '2025-11-20 12:42:42'),
(18, 44, NULL, NULL, NULL, 0.00, 10.00, '.', 7, '2025-11-20 12:42:42'),
(19, 65, 832, 0.00, 0.50, NULL, NULL, 'tets sửa điểm của giáo viên to học sinh', 7, '2025-11-29 02:20:57'),
(20, 65, 838, 0.00, 0.50, NULL, NULL, 'tets sửa điểm của giáo viên to học sinh', 7, '2025-11-29 02:20:57'),
(21, 65, 840, 0.00, 0.50, NULL, NULL, 'tets sửa điểm của giáo viên to học sinh', 7, '2025-11-29 02:20:57'),
(22, 65, NULL, NULL, NULL, 0.50, 1.50, 'tets sửa điểm của giáo viên to học sinh', 7, '2025-11-29 02:20:57');

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
(3, 'xây dựng httt', 'Môn học: xây dựng httt', 7, '2025-10-15 08:57:13'),
(4, 'khai thác dữ liệu', 'Môn học: khai thác dữ liệu', 7, '2025-11-30 08:37:21');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
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
(10, 'maipanh35', '$2b$10$SmpmY3Tym7alCELVDCUDqe73MPp9Tm.nBT7vdjtZhZUGe7zc1tss.', '117451791166846615134', 'maipanh35@gmail.com', 'Phương Anh', 'Teacher', '2025-11-18 16:22:55', '2025-11-28 14:49:13', NULL, NULL, NULL, NULL),
(12, '23050061', NULL, '112574508133594405488', '23050061@student.bdu.edu.vn', 'Thuần Bùi Đức', 'Student', '2025-11-21 15:24:58', '2025-11-21 15:24:58', NULL, NULL, NULL, NULL),
(14, 'duy', '$2b$10$2jQ.dmZrS2Y3Rd7G108rMuWJM9YPS2wmi0qVDMHRpFzVzz6HGKS2u', NULL, 'duy@gmail.com', 'duy', 'Student', '2025-11-26 22:15:54', '2025-11-26 22:15:54', NULL, NULL, NULL, NULL),
(16, 'duyvsh1234', '$2b$10$vM.vbB.mp5B7zTjdB/4Dg.qdrugYlFfebGGq2HRTn7wdyXBRvj0g6', NULL, 'duyvsh1234@gmail.com', 'duyvsh1234', 'Student', '2025-11-28 13:00:51', '2025-11-28 13:00:51', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_ai_preferences`
--

CREATE TABLE `user_ai_preferences` (
  `user_id` bigint NOT NULL,
  `preferred_model` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'groq hoặc gemini',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
-- Chỉ mục cho bảng `ai_system_quota`
--
ALTER TABLE `ai_system_quota`
  ADD PRIMARY KEY (`quota_id`),
  ADD UNIQUE KEY `unique_provider_date` (`provider`,`date`),
  ADD KEY `idx_date` (`date`);

--
-- Chỉ mục cho bảng `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_user_date` (`user_id`,`created_date`),
  ADD KEY `idx_user_week` (`user_id`,`created_week`),
  ADD KEY `idx_provider_date` (`provider`,`created_date`);

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
-- Chỉ mục cho bảng `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`material_id`),
  ADD KEY `idx_class_id` (`class_id`),
  ADD KEY `idx_teacher_id` (`teacher_id`);

--
-- Chỉ mục cho bảng `material_cache`
--
ALTER TABLE `material_cache`
  ADD PRIMARY KEY (`material_id`);

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
-- Chỉ mục cho bảng `practice_exams`
--
ALTER TABLE `practice_exams`
  ADD PRIMARY KEY (`practice_exam_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_source` (`source_type`,`source_id`);

--
-- Chỉ mục cho bảng `practice_exam_attempts`
--
ALTER TABLE `practice_exam_attempts`
  ADD PRIMARY KEY (`attempt_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_practice_exam` (`practice_exam_id`);

--
-- Chỉ mục cho bảng `practice_exam_attempt_answers`
--
ALTER TABLE `practice_exam_attempt_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attempt` (`attempt_id`),
  ADD KEY `idx_question` (`question_id`),
  ADD KEY `fk_practice_attempt_answers_option` (`option_id`);

--
-- Chỉ mục cho bảng `practice_exam_options`
--
ALTER TABLE `practice_exam_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_practice_question` (`practice_exam_id`,`question_order`);

--
-- Chỉ mục cho bảng `practice_exam_questions`
--
ALTER TABLE `practice_exam_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`),
  ADD KEY `idx_practice_exam` (`practice_exam_id`),
  ADD KEY `idx_question_order` (`practice_exam_id`,`question_order`);

--
-- Chỉ mục cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  ADD PRIMARY KEY (`question_id`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `import_id` (`import_id`),
  ADD KEY `idx_subject_difficulty` (`subject_id`,`difficulty`);

--
-- Chỉ mục cho bảng `question_materials`
--
ALTER TABLE `question_materials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_question_material` (`question_id`,`material_id`),
  ADD KEY `idx_question_id` (`question_id`),
  ADD KEY `idx_material_id` (`material_id`);

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
-- Chỉ mục cho bảng `user_ai_preferences`
--
ALTER TABLE `user_ai_preferences`
  ADD PRIMARY KEY (`user_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `admin_logs`
--
ALTER TABLE `admin_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `ai_system_quota`
--
ALTER TABLE `ai_system_quota`
  MODIFY `quota_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `anti_cheating_logs`
--
ALTER TABLE `anti_cheating_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT cho bảng `backup_history`
--
ALTER TABLE `backup_history`
  MODIFY `backup_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `classes`
--
ALTER TABLE `classes`
  MODIFY `class_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `complaints`
--
ALTER TABLE `complaints`
  MODIFY `complaint_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `exams`
--
ALTER TABLE `exams`
  MODIFY `exam_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=109;

--
-- AUTO_INCREMENT cho bảng `exam_attempts`
--
ALTER TABLE `exam_attempts`
  MODIFY `attempt_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT cho bảng `import_logs`
--
ALTER TABLE `import_logs`
  MODIFY `import_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `materials`
--
ALTER TABLE `materials`
  MODIFY `material_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=410;

--
-- AUTO_INCREMENT cho bảng `practice_exams`
--
ALTER TABLE `practice_exams`
  MODIFY `practice_exam_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `practice_exam_attempts`
--
ALTER TABLE `practice_exam_attempts`
  MODIFY `attempt_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `practice_exam_attempt_answers`
--
ALTER TABLE `practice_exam_attempt_answers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT cho bảng `practice_exam_options`
--
ALTER TABLE `practice_exam_options`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- AUTO_INCREMENT cho bảng `practice_exam_questions`
--
ALTER TABLE `practice_exam_questions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  MODIFY `question_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=870;

--
-- AUTO_INCREMENT cho bảng `question_materials`
--
ALTER TABLE `question_materials`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `question_options`
--
ALTER TABLE `question_options`
  MODIFY `option_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2905;

--
-- AUTO_INCREMENT cho bảng `score_audit_logs`
--
ALTER TABLE `score_audit_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT cho bảng `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `teacher_actions`
--
ALTER TABLE `teacher_actions`
  MODIFY `action_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `user_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `ai_usage_logs`
--
ALTER TABLE `ai_usage_logs`
  ADD CONSTRAINT `ai_usage_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

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
-- Các ràng buộc cho bảng `material_cache`
--
ALTER TABLE `material_cache`
  ADD CONSTRAINT `material_cache_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Các ràng buộc cho bảng `practice_exams`
--
ALTER TABLE `practice_exams`
  ADD CONSTRAINT `practice_exams_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `practice_exam_attempts`
--
ALTER TABLE `practice_exam_attempts`
  ADD CONSTRAINT `practice_exam_attempts_ibfk_1` FOREIGN KEY (`practice_exam_id`) REFERENCES `practice_exams` (`practice_exam_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practice_exam_attempts_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `practice_exam_attempt_answers`
--
ALTER TABLE `practice_exam_attempt_answers`
  ADD CONSTRAINT `fk_practice_attempt_answers_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `practice_exam_attempts` (`attempt_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_practice_attempt_answers_option` FOREIGN KEY (`option_id`) REFERENCES `practice_exam_options` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_practice_attempt_answers_question` FOREIGN KEY (`question_id`) REFERENCES `practice_exam_questions` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `practice_exam_options`
--
ALTER TABLE `practice_exam_options`
  ADD CONSTRAINT `practice_exam_options_ibfk_1` FOREIGN KEY (`practice_exam_id`) REFERENCES `practice_exams` (`practice_exam_id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `practice_exam_questions`
--
ALTER TABLE `practice_exam_questions`
  ADD CONSTRAINT `practice_exam_questions_ibfk_1` FOREIGN KEY (`practice_exam_id`) REFERENCES `practice_exams` (`practice_exam_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practice_exam_questions_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `question_bank`
--
ALTER TABLE `question_bank`
  ADD CONSTRAINT `question_bank_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`),
  ADD CONSTRAINT `question_bank_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `question_bank_ibfk_3` FOREIGN KEY (`import_id`) REFERENCES `import_logs` (`import_id`);

--
-- Các ràng buộc cho bảng `question_materials`
--
ALTER TABLE `question_materials`
  ADD CONSTRAINT `question_materials_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `question_bank` (`question_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `question_materials_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`material_id`) ON DELETE CASCADE;

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

--
-- Các ràng buộc cho bảng `user_ai_preferences`
--
ALTER TABLE `user_ai_preferences`
  ADD CONSTRAINT `user_ai_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
