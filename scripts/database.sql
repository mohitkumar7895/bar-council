-- =====================================================================
-- BAR ASSOCIATION MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Database: bar-council
-- Target Engine: MySQL 8.0+ / MariaDB 10.4+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `bar-council` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bar-council`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. ROLES TABLE
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PERMISSIONS TABLE
DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(80) NOT NULL UNIQUE,
  `module` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ROLE_PERMISSIONS TABLE
DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USERS TABLE
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `avatar_url` VARCHAR(255),
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. USER_PERMISSIONS OVERRIDES TABLE
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `user_id` INT NOT NULL,
  `permission_id` INT NOT NULL,
  `is_granted` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`user_id`, `permission_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SYSTEM_SETTINGS TABLE
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(80) NOT NULL UNIQUE,
  `setting_value` TEXT,
  `setting_group` VARCHAR(50) DEFAULT 'general',
  `description` VARCHAR(255),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PAYMENT_MODES TABLE
DROP TABLE IF EXISTS `payment_modes`;
CREATE TABLE `payment_modes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(30) NOT NULL UNIQUE,
  `name` VARCHAR(80) NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. EXPENSE_CATEGORIES TABLE
DROP TABLE IF EXISTS `expense_categories`;
CREATE TABLE `expense_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. DONATION_CATEGORIES TABLE
DROP TABLE IF EXISTS `donation_categories`;
CREATE TABLE `donation_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255),
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. CLAIM_CATEGORIES TABLE
DROP TABLE IF EXISTS `claim_categories`;
CREATE TABLE `claim_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `claim_type` ENUM('death_benefit', 'health_claim') NOT NULL,
  `description` VARCHAR(255),
  `max_eligible_amount` DECIMAL(12,2) DEFAULT 0.00,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ADVOCATES TABLE
DROP TABLE IF EXISTS `advocates`;
CREATE TABLE `advocates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `advocate_code` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(150) NOT NULL,
  `photo_url` VARCHAR(255),
  `father_name` VARCHAR(150) NOT NULL,
  `address` TEXT,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150),
  `bar_council_reg_no` VARCHAR(100) NOT NULL UNIQUE,
  `association_membership_no` VARCHAR(100) NOT NULL UNIQUE,
  `kalyan_nidhi_no` VARCHAR(100),
  `apda_kosh_details` VARCHAR(255),
  `membership_start_date` DATE NOT NULL,
  `renewal_date` DATE,
  `membership_status` ENUM('active', 'inactive', 'suspended', 'deceased') DEFAULT 'active',
  `admission_fee` DECIMAL(10,2) DEFAULT 0.00,
  `monthly_chanda` DECIMAL(10,2) DEFAULT 0.00,
  `annual_dues` DECIMAL(10,2) DEFAULT 0.00,
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_adv_status` (`membership_status`),
  INDEX `idx_adv_name` (`full_name`),
  INDEX `idx_adv_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. MEMBERSHIP_PERIODS TABLE
DROP TABLE IF EXISTS `membership_periods`;
CREATE TABLE `membership_periods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `period_name` VARCHAR(50) NOT NULL UNIQUE,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_current` TINYINT(1) DEFAULT 0,
  `annual_dues_rate` DECIMAL(10,2) DEFAULT 1200.00,
  `monthly_chanda_rate` DECIMAL(10,2) DEFAULT 100.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. MEMBERSHIP_DUES TABLE
DROP TABLE IF EXISTS `membership_dues`;
CREATE TABLE `membership_dues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `advocate_id` INT NOT NULL,
  `period_id` INT NOT NULL,
  `due_type` ENUM('monthly_chanda', 'annual_dues', 'admission_fee', 'other') NOT NULL,
  `due_month` TINYINT NULL, -- 1 to 12
  `due_year` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `paid_amount` DECIMAL(10,2) DEFAULT 0.00,
  `status` ENUM('unpaid', 'partial', 'paid', 'waived') DEFAULT 'unpaid',
  `due_date` DATE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`period_id`) REFERENCES `membership_periods`(`id`) ON DELETE RESTRICT,
  INDEX `idx_dues_status` (`status`),
  INDEX `idx_dues_adv_year` (`advocate_id`, `due_year`, `due_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. PAYMENTS TABLE
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `receipt_no` VARCHAR(60) NOT NULL UNIQUE,
  `advocate_id` INT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `reference_number` VARCHAR(100),
  `source_module` ENUM('membership', 'waqalatnama', 'form_sale', 'donation', 'other_income') NOT NULL,
  `source_id` INT NULL,
  `received_by_user_id` INT NULL,
  `payer_name` VARCHAR(150),
  `status` ENUM('completed', 'cancelled') DEFAULT 'completed',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`received_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_pay_date` (`payment_date`),
  INDEX `idx_pay_module` (`source_module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. PAYMENT_ALLOCATIONS TABLE
DROP TABLE IF EXISTS `payment_allocations`;
CREATE TABLE `payment_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `payment_id` INT NOT NULL,
  `due_id` INT NOT NULL,
  `allocated_amount` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`due_id`) REFERENCES `membership_dues`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. WAQALATNAMA_ITEMS TABLE
DROP TABLE IF EXISTS `waqalatnama_items`;
CREATE TABLE `waqalatnama_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_code` VARCHAR(50) NOT NULL UNIQUE,
  `item_name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `unit_rate` DECIMAL(10,2) NOT NULL,
  `current_stock` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT NOT NULL DEFAULT 50,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. WAQALATNAMA_STOCK_MOVEMENTS TABLE
DROP TABLE IF EXISTS `waqalatnama_stock_movements`;
CREATE TABLE `waqalatnama_stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_id` INT NOT NULL,
  `movement_type` ENUM('opening', 'received', 'sale', 'adjustment', 'return') NOT NULL,
  `quantity` INT NOT NULL, -- can be positive or negative
  `unit_price` DECIMAL(10,2) DEFAULT 0.00,
  `balance_after` INT NOT NULL DEFAULT 0,
  `reference_no` VARCHAR(100),
  `notes` VARCHAR(255),
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`item_id`) REFERENCES `waqalatnama_items`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_wsm_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. WAQALATNAMA_SALES TABLE
DROP TABLE IF EXISTS `waqalatnama_sales`;
CREATE TABLE `waqalatnama_sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_no` VARCHAR(60) NOT NULL UNIQUE,
  `sale_date` DATE NOT NULL,
  `advocate_id` INT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `net_amount` DECIMAL(12,2) NOT NULL,
  `amount_received` DECIMAL(12,2) NOT NULL,
  `balance_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `payment_status` ENUM('paid', 'partial', 'pending') NOT NULL DEFAULT 'paid',
  `payment_id` INT NULL,
  `remarks` TEXT,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_wqs_date` (`sale_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. WAQALATNAMA_SALE_ITEMS TABLE
DROP TABLE IF EXISTS `waqalatnama_sale_items`;
CREATE TABLE `waqalatnama_sale_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_rate` DECIMAL(10,2) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (`sale_id`) REFERENCES `waqalatnama_sales`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `waqalatnama_items`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. FORM_TYPES TABLE
DROP TABLE IF EXISTS `form_types`;
CREATE TABLE `form_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_code` VARCHAR(50) NOT NULL UNIQUE,
  `form_name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `sale_price` DECIMAL(10,2) NOT NULL,
  `current_stock` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT NOT NULL DEFAULT 50,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. FORM_STOCK_MOVEMENTS TABLE
DROP TABLE IF EXISTS `form_stock_movements`;
CREATE TABLE `form_stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `form_type_id` INT NOT NULL,
  `movement_type` ENUM('opening', 'received', 'sale', 'adjustment') NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) DEFAULT 0.00,
  `balance_after` INT NOT NULL DEFAULT 0,
  `reference_no` VARCHAR(100),
  `notes` VARCHAR(255),
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`form_type_id`) REFERENCES `form_types`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. FORM_SALES TABLE
DROP TABLE IF EXISTS `form_sales`;
CREATE TABLE `form_sales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sale_no` VARCHAR(60) NOT NULL UNIQUE,
  `sale_date` DATE NOT NULL,
  `advocate_id` INT NULL,
  `buyer_name` VARCHAR(150) NOT NULL,
  `form_type_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `amount_received` DECIMAL(12,2) NOT NULL,
  `balance_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `payment_status` ENUM('paid', 'partial', 'pending') NOT NULL DEFAULT 'paid',
  `payment_id` INT NULL,
  `remarks` TEXT,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`form_type_id`) REFERENCES `form_types`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_fms_date` (`sale_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. DONATIONS TABLE
DROP TABLE IF EXISTS `donations`;
CREATE TABLE `donations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `donation_no` VARCHAR(60) NOT NULL UNIQUE,
  `contributor_name` VARCHAR(150) NOT NULL,
  `advocate_id` INT NULL,
  `phone` VARCHAR(20),
  `email` VARCHAR(150),
  `pan_number` VARCHAR(30),
  `donation_date` DATE NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `category_id` INT NULL,
  `donation_purpose` VARCHAR(255) NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `reference_number` VARCHAR(100),
  `receipt_number` VARCHAR(100),
  `status` ENUM('received', 'pledged', 'pending') DEFAULT 'received',
  `payment_id` INT NULL,
  `notes` TEXT,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`category_id`) REFERENCES `donation_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_don_date` (`donation_date`),
  INDEX `idx_don_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. DEATH_BENEFIT_CLAIMS TABLE
DROP TABLE IF EXISTS `death_benefit_claims`;
CREATE TABLE `death_benefit_claims` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `claim_no` VARCHAR(60) NOT NULL UNIQUE,
  `advocate_id` INT NOT NULL,
  `deceased_advocate_name` VARCHAR(150) NOT NULL,
  `membership_no` VARCHAR(100) NOT NULL,
  `registration_no` VARCHAR(100) NOT NULL,
  `date_of_death` DATE NOT NULL,
  `applicant_name` VARCHAR(150) NOT NULL,
  `relationship` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(150),
  `address` TEXT,
  `requested_amount` DECIMAL(12,2) NOT NULL,
  `application_date` DATE NOT NULL,
  `assigned_reviewer_id` INT NULL,
  `reviewer_remarks` TEXT,
  `claim_status` ENUM('submitted', 'under_review', 'documents_pending', 'approved', 'rejected', 'disbursed') DEFAULT 'submitted',
  `sanctioned_amount` DECIMAL(12,2) DEFAULT 0.00,
  `approval_date` DATE NULL,
  `approved_by_user_id` INT NULL,
  `disbursement_date` DATE NULL,
  `payment_mode` VARCHAR(50),
  `bank_reference_no` VARCHAR(100),
  `disbursement_remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`assigned_reviewer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_dbc_status` (`claim_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. HEALTH_CLAIMS TABLE
DROP TABLE IF EXISTS `health_claims`;
CREATE TABLE `health_claims` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `claim_no` VARCHAR(60) NOT NULL UNIQUE,
  `advocate_id` INT NOT NULL,
  `applicant_name` VARCHAR(150) NOT NULL,
  `relationship` ENUM('self', 'spouse', 'child', 'parent', 'dependent') DEFAULT 'self',
  `category_id` INT NULL,
  `requested_amount` DECIMAL(12,2) NOT NULL,
  `submission_date` DATE NOT NULL,
  `hospital_name` VARCHAR(200),
  `illness_details` TEXT,
  `admission_date` DATE,
  `discharge_date` DATE,
  `bank_name` VARCHAR(150),
  `account_number` VARCHAR(80),
  `ifsc_code` VARCHAR(40),
  `verification_status` ENUM('pending', 'in_progress', 'verified', 'rejected') DEFAULT 'pending',
  `reviewer_remarks` TEXT,
  `claim_status` ENUM('submitted', 'under_review', 'documents_pending', 'approved', 'rejected', 'disbursed') DEFAULT 'submitted',
  `sanctioned_amount` DECIMAL(12,2) DEFAULT 0.00,
  `approval_date` DATE NULL,
  `approved_by_user_id` INT NULL,
  `disbursement_date` DATE NULL,
  `payment_mode` VARCHAR(50),
  `bank_reference_no` VARCHAR(100),
  `disbursement_remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`category_id`) REFERENCES `claim_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_hlc_status` (`claim_status`),
  INDEX `idx_hlc_v_status` (`verification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. CLAIM_DOCUMENTS TABLE
DROP TABLE IF EXISTS `claim_documents`;
CREATE TABLE `claim_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `claim_type` ENUM('death_benefit', 'health_claim') NOT NULL,
  `claim_id` INT NOT NULL,
  `document_type` VARCHAR(80) NOT NULL, -- e.g. death_certificate, medical_bills, id_proof, etc.
  `document_title` VARCHAR(150) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_size` INT DEFAULT 0,
  `mime_type` VARCHAR(100),
  `verification_status` ENUM('not_submitted', 'received', 'verified', 'rejected', 'reupload_required') DEFAULT 'received',
  `remarks` TEXT,
  `verified_by_user_id` INT NULL,
  `verified_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`verified_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_cd_claim` (`claim_type`, `claim_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. GENERAL DOCUMENTS TABLE
DROP TABLE IF EXISTS `documents`;
CREATE TABLE `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entity_type` ENUM('advocate', 'general', 'case', 'committee') NOT NULL DEFAULT 'advocate',
  `entity_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(80) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `file_size` INT DEFAULT 0,
  `mime_type` VARCHAR(100),
  `verification_status` ENUM('received', 'verified', 'rejected') DEFAULT 'received',
  `remarks` TEXT,
  `uploaded_by_user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_doc_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 28. CASES_REGISTER TABLE
DROP TABLE IF EXISTS `cases_register`;
CREATE TABLE `cases_register` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `case_no` VARCHAR(60) NOT NULL UNIQUE,
  `reference_number` VARCHAR(100) NOT NULL,
  `category` ENUM('disciplinary', 'dispute', 'welfare_appeal', 'arbitration', 'general_grievance') NOT NULL,
  `applicant_name` VARCHAR(150) NOT NULL,
  `respondent_name` VARCHAR(150),
  `advocate_id` INT NULL,
  `filing_date` DATE NOT NULL,
  `status` ENUM('pending', 'hearing', 'adjourned', 'resolved', 'dismissed') DEFAULT 'pending',
  `presiding_officer` VARCHAR(150),
  `notes` TEXT,
  `outcome` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`advocate_id`) REFERENCES `advocates`(`id`) ON DELETE SET NULL,
  INDEX `idx_case_status` (`status`),
  INDEX `idx_case_ref` (`reference_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 29. INCOME_ENTRIES TABLE
DROP TABLE IF EXISTS `income_entries`;
CREATE TABLE `income_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `income_no` VARCHAR(60) NOT NULL UNIQUE,
  `date` DATE NOT NULL,
  `category` ENUM('membership_fee', 'monthly_chanda', 'annual_dues', 'waqalatnama_sales', 'form_sales', 'donation', 'other_income') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `reference_no` VARCHAR(100),
  `received_from` VARCHAR(150),
  `is_auto_generated` TINYINT(1) DEFAULT 0,
  `source_module` VARCHAR(50),
  `source_id` INT,
  `payment_status` ENUM('paid', 'pending', 'partial') DEFAULT 'paid',
  `notes` TEXT,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_inc_date` (`date`),
  INDEX `idx_inc_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 30. EXPENSE_ENTRIES TABLE
DROP TABLE IF EXISTS `expense_entries`;
CREATE TABLE `expense_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_no` VARCHAR(60) NOT NULL UNIQUE,
  `date` DATE NOT NULL,
  `category_id` INT NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `payee_vendor` VARCHAR(150) NOT NULL,
  `reference_number` VARCHAR(100),
  `payment_status` ENUM('paid', 'pending', 'partial') DEFAULT 'paid',
  `linked_disbursement_id` INT NULL,
  `notes` TEXT,
  `user_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_exp_date` (`date`),
  INDEX `idx_exp_cat` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 31. FUND_DISBURSEMENTS TABLE
DROP TABLE IF EXISTS `fund_disbursements`;
CREATE TABLE `fund_disbursements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `disbursement_no` VARCHAR(60) NOT NULL UNIQUE,
  `disbursement_type` ENUM('death_benefit', 'health_claim', 'advocate_relief', 'scholarship', 'other') NOT NULL,
  `claim_id` INT NULL,
  `beneficiary_name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `disbursement_date` DATE NOT NULL,
  `payment_mode` VARCHAR(50) NOT NULL DEFAULT 'Bank Transfer',
  `bank_reference_no` VARCHAR(100),
  `approved_by_user_id` INT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`approved_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_fdisb_date` (`disbursement_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 32. ACTIVITY_LOGS TABLE
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `module` VARCHAR(50) NOT NULL,
  `record_id` VARCHAR(50),
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_act_user` (`user_id`),
  INDEX `idx_act_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- SEED INITIAL MASTER DATA
-- =====================================================================

-- Roles
INSERT INTO `roles` (`id`, `slug`, `name`, `description`) VALUES
(1, 'super_admin', 'Super Admin', 'Full system access, configuration, user management, and all privileges'),
(2, 'admin_secretary', 'Administrator / Secretary', 'Manage advocates, membership, claims, sales, and operational reports'),
(3, 'accounts_finance', 'Accounts / Finance', 'Collections, membership dues, income/expenses, disbursements, and financial reports'),
(4, 'data_entry', 'Data Entry / Office Staff', 'Assigned advocate records, sales, forms, and claim applications entry'),
(5, 'readonly_committee', 'Read-only / Committee User', 'View permitted dashboard information, records, and reports without editing rights');

-- Master Permissions
INSERT INTO `permissions` (`code`, `module`, `name`, `description`) VALUES
('dashboard:view', 'dashboard', 'View Dashboard', 'Access main analytics dashboard'),
('advocates:view', 'advocates', 'View Advocates', 'Browse and search advocate directory'),
('advocates:create', 'advocates', 'Create Advocate', 'Register new advocates'),
('advocates:edit', 'advocates', 'Edit Advocate', 'Modify advocate details and status'),
('advocates:delete', 'advocates', 'Delete Advocate', 'Archive or remove advocate records'),
('membership:view', 'membership', 'View Membership', 'View subscription records and dues'),
('membership:collect', 'membership', 'Collect Fees', 'Collect membership fees and chanda'),
('waqalatnama:view', 'waqalatnama', 'View Waqalatnama', 'View stock and sales records'),
('waqalatnama:sell', 'waqalatnama', 'Sell Waqalatnama', 'Create Waqalatnama sale transactions'),
('waqalatnama:stock', 'waqalatnama', 'Manage Waqalatnama Stock', 'Add stock and stock adjustments'),
('form_sales:view', 'form_sales', 'View Form Sales', 'View form types and sales register'),
('form_sales:sell', 'form_sales', 'Sell Forms', 'Record form sale transactions'),
('form_sales:stock', 'form_sales', 'Manage Form Stock', 'Add and update form stock inventory'),
('donations:view', 'donations', 'View Donations', 'View donation records'),
('donations:manage', 'donations', 'Manage Donations', 'Record and edit donations'),
('death_benefit:view', 'death_benefit', 'View Death Claims', 'View death benefit applications'),
('death_benefit:manage', 'death_benefit', 'Manage Death Claims', 'Submit and review applications'),
('death_benefit:approve', 'death_benefit', 'Approve Death Claims', 'Approve/reject claims and sanction amounts'),
('death_benefit:disburse', 'death_benefit', 'Disburse Death Claims', 'Record fund disbursements for claims'),
('health_claims:view', 'health_claims', 'View Health Claims', 'View health claim records'),
('health_claims:manage', 'health_claims', 'Manage Health Claims', 'Submit and review health claims'),
('health_claims:verify', 'health_claims', 'Verify Documents', 'Verify medical and claim documents'),
('health_claims:approve', 'health_claims', 'Approve Health Claims', 'Approve/reject health claims and sanction funds'),
('health_claims:disburse', 'health_claims', 'Disburse Health Claims', 'Record disbursement of health claims'),
('documents:view', 'documents', 'View Documents', 'View and download uploaded documents'),
('documents:manage', 'documents', 'Manage Documents', 'Upload and verify documents'),
('cases:view', 'cases', 'View Cases', 'View case and dispute register'),
('cases:manage', 'cases', 'Manage Cases', 'Add and update case records'),
('finance:view', 'finance', 'View Finance', 'View income, expense, and payments'),
('finance:manage', 'finance', 'Manage Finance', 'Record income, expenses, and vouchers'),
('reports:view', 'reports', 'View Reports', 'Access MIS and operational reports'),
('reports:export', 'reports', 'Export Reports', 'Export reports to Excel, CSV, or PDF'),
('users:manage', 'users', 'Manage Users', 'Create, update, and manage system users'),
('settings:manage', 'settings', 'Manage Settings', 'Update association settings and master data');

-- Grant permissions to Super Admin (All permissions)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 1, `id` FROM `permissions`;

-- Grant permissions to Admin / Secretary
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 2, `id` FROM `permissions`
WHERE `code` NOT IN ('settings:manage', 'users:manage');

-- Grant permissions to Accounts / Finance
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 3, `id` FROM `permissions`
WHERE `module` IN ('dashboard', 'membership', 'waqalatnama', 'form_sales', 'donations', 'finance', 'reports')
   OR `code` IN ('advocates:view', 'death_benefit:disburse', 'health_claims:disburse');

-- Grant permissions to Data Entry / Office Staff
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 4, `id` FROM `permissions`
WHERE `code` IN (
  'dashboard:view', 'advocates:view', 'advocates:create', 'advocates:edit',
  'membership:view', 'membership:collect',
  'waqalatnama:view', 'waqalatnama:sell',
  'form_sales:view', 'form_sales:sell',
  'donations:view', 'donations:manage',
  'death_benefit:view', 'death_benefit:manage',
  'health_claims:view', 'health_claims:manage',
  'documents:view', 'documents:manage',
  'cases:view', 'cases:manage'
);

-- Grant permissions to Read-only / Committee
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT 5, `id` FROM `permissions`
WHERE `code` LIKE '%:view';

-- Payment Modes
INSERT INTO `payment_modes` (`code`, `name`, `is_active`) VALUES
('cash', 'Cash', 1),
('upi', 'UPI / QR', 1),
('bank_transfer', 'Bank Transfer / NEFT / RTGS', 1),
('cheque', 'Cheque', 1),
('dd', 'Demand Draft (DD)', 1);

-- Expense Categories
INSERT INTO `expense_categories` (`name`, `description`, `is_active`) VALUES
('Office Administration', 'Stationery, electricity, telephone, office repairs', 1),
('Staff Salaries & Honorarium', 'Monthly staff remuneration and legal aids', 1),
('Library & Subscriptions', 'Law journals, digital library, books, publications', 1),
('Events & Seminars', 'Legal seminars, Law Day celebrations, Annual meeting', 1),
('Death Benefit Fund Disbursement', 'Direct payments to deceased advocate nominee', 1),
('Health Claim Disbursement', 'Medical aid provided to member advocates', 1),
('Building & Infrastructure', 'Bar room maintenance, furniture, IT equipment', 1),
('Printing & Waqalatnama Production', 'Printing costs of official Waqalatnama and forms', 1);

-- Donation Categories
INSERT INTO `donation_categories` (`name`, `description`, `is_active`) VALUES
('Advocate Welfare Fund', 'General welfare fund for distressed advocates', 1),
('Bar Library Development', 'Books, digital subscriptions and computer systems', 1),
('Infrastructure & Modernization', 'Air conditioning, seating, conference hall setup', 1),
('Legal Aid & Community Outreach', 'Free legal counseling and community events', 1),
('General Corpus', 'Unrestricted association corpus donations', 1);

-- Claim Categories
INSERT INTO `claim_categories` (`name`, `claim_type`, `description`, `max_eligible_amount`, `is_active`) VALUES
('Primary Deceased Member Relief', 'death_benefit', 'Standard association death relief for active members', 500000.00, 1),
('Accidental Death Assistance', 'death_benefit', 'Special assistance for demise caused by accident', 750000.00, 1),
('Critical Illness Hospitalization', 'health_claim', 'Cardiac surgery, oncology, kidney failure, major interventions', 100000.00, 1),
('General Inpatient Care', 'health_claim', 'Medical hospitalization exceeding 3 days', 30000.00, 1),
('Accident & Emergency Care', 'health_claim', 'Immediate emergency medical and surgical expenses', 50000.00, 1);

-- Waqalatnama Items
INSERT INTO `waqalatnama_items` (`item_code`, `item_name`, `description`, `unit_rate`, `current_stock`, `low_stock_threshold`) VALUES
('WQT-HIGH-01', 'High Court Waqalatnama', 'Official High Court Waqalatnama (Green Bond Paper)', 50.00, 450, 100),
('WQT-DIST-01', 'District Court Waqalatnama', 'Official District & Sessions Court Waqalatnama', 30.00, 1200, 200),
('WQT-TRIB-01', 'Tribunal & Revenue Waqalatnama', 'CAT, NCLT, DRT, and Revenue Board Waqalatnama', 40.00, 320, 50),
('WQT-MEMO-01', 'Memo of Appearance', 'Standard Memo of Appearance Pads (50 leaves)', 100.00, 180, 40);

-- Form Types
INSERT INTO `form_types` (`form_code`, `form_name`, `description`, `sale_price`, `current_stock`, `low_stock_threshold`) VALUES
('FRM-APP-01', 'New Membership Application Form', 'Registration form for fresh law graduates/advocates', 200.00, 250, 50),
('FRM-NOC-01', 'NOC / Transfer Certificate Form', 'Bar Council transfer application and NOC form', 150.00, 120, 30),
('FRM-WEL-01', 'Advocate Welfare Fund Enrollment', 'Enrolment form for Kalyan Nidhi and Apda Kosh', 100.00, 300, 50),
('FRM-CL-01', 'Health & Death Benefit Claim Form', 'Comprehensive application form for welfare claims', 50.00, 400, 80),
('FRM-ID-01', 'Bar Identity Card Application', 'Smart Bar Association Photo ID card request form', 100.00, 180, 40);

-- System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_group`, `description`) VALUES
('association_name', 'District Bar Association', 'general', 'Official registered name of the Bar Association'),
('association_registration_no', 'BAR-REG/1984/DELHI-09', 'general', 'Official Bar Council charter registration number'),
('address', 'District & Sessions Court Complex, Bar Association Building, Room 101-105', 'general', 'Physical address of the Bar Association'),
('phone', '+91 11 2345 6789', 'general', 'Official association contact telephone'),
('email', 'contact@districtbar.org.in', 'general', 'Official communication email address'),
('currency_symbol', '₹', 'finance', 'Standard currency symbol for receipts and reports'),
('admission_fee_default', '5000.00', 'finance', 'Default admission fee for new advocate registration'),
('monthly_chanda_default', '100.00', 'finance', 'Monthly subscription fee per advocate'),
('annual_dues_default', '1200.00', 'finance', 'Annual dues rate for advocate members'),
('current_period', '2026-2027', 'membership', 'Currently active financial and membership cycle');

-- Membership Periods
INSERT INTO `membership_periods` (`id`, `period_name`, `start_date`, `end_date`, `is_current`, `annual_dues_rate`, `monthly_chanda_rate`) VALUES
(1, '2025-2026', '2025-04-01', '2026-03-31', 0, 1200.00, 100.00),
(2, '2026-2027', '2026-04-01', '2027-03-31', 1, 1200.00, 100.00);
