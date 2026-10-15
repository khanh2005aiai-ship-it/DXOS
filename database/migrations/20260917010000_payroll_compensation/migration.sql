ALTER TABLE `approval_requests` MODIFY COLUMN `type` ENUM('LEAVE', 'ATTENDANCE_ADJUSTMENT', 'PAYROLL') NOT NULL;

CREATE TABLE `compensation_profiles` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `base_salary` DECIMAL(15, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',
  `effective_from` DATE NOT NULL,
  `effective_to` DATE NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `notes` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `compensation_profiles_org_id_unique` (`organization_id`, `id`),
  INDEX `compensation_profiles_org_emp_active_idx` (`organization_id`, `employee_id`, `is_active`),
  INDEX `compensation_profiles_org_effective_idx` (`organization_id`, `effective_from`, `effective_to`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `compensation_profiles` ADD CONSTRAINT `compensation_profiles_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `compensation_profiles` ADD CONSTRAINT `compensation_profiles_org_employee_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

CREATE TABLE `payroll_periods` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `status` ENUM('DRAFT', 'PROCESSING', 'CALCULATED', 'PENDING_APPROVAL', 'APPROVED', 'FINALIZED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `total_gross` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total_net` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `employee_count` INT NOT NULL DEFAULT 0,
  `calculated_at` DATETIME(3) NULL,
  `approved_at` DATETIME(3) NULL,
  `approved_by_id` CHAR(36) NULL,
  `finalized_at` DATETIME(3) NULL,
  `finalized_by_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `payroll_periods_org_name_unique` (`organization_id`, `name`),
  UNIQUE INDEX `payroll_periods_org_id_unique` (`organization_id`, `id`),
  INDEX `payroll_periods_org_status_idx` (`organization_id`, `status`),
  INDEX `payroll_periods_org_period_idx` (`organization_id`, `period_start`, `period_end`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payroll_periods` ADD CONSTRAINT `payroll_periods_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `payroll_periods` ADD CONSTRAINT `payroll_periods_approved_by_fkey`
  FOREIGN KEY (`approved_by_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

ALTER TABLE `payroll_periods` ADD CONSTRAINT `payroll_periods_finalized_by_fkey`
  FOREIGN KEY (`finalized_by_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

CREATE TABLE `payroll_records` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `payroll_period_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `compensation_profile_id` CHAR(36) NULL,
  `base_salary` DECIMAL(15, 2) NOT NULL,
  `working_days` DECIMAL(5, 2) NOT NULL,
  `worked_days` DECIMAL(5, 2) NOT NULL,
  `absent_days` DECIMAL(5, 2) NOT NULL,
  `paid_leave_days` DECIMAL(5, 2) NOT NULL,
  `unpaid_leave_days` DECIMAL(5, 2) NOT NULL,
  `overtime_minutes` INT NOT NULL DEFAULT 0,
  `overtime_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `allowance_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `deduction_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `gross_amount` DECIMAL(15, 2) NOT NULL,
  `net_amount` DECIMAL(15, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'VND',
  `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `payroll_records_period_employee_unique` (`payroll_period_id`, `employee_id`),
  UNIQUE INDEX `payroll_records_org_id_unique` (`organization_id`, `id`),
  INDEX `payroll_records_org_employee_idx` (`organization_id`, `employee_id`),
  INDEX `payroll_records_org_period_idx` (`organization_id`, `payroll_period_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_period_fkey`
  FOREIGN KEY (`payroll_period_id`) REFERENCES `payroll_periods` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_employee_fkey`
  FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `payroll_records` ADD CONSTRAINT `payroll_records_compensation_profile_fkey`
  FOREIGN KEY (`compensation_profile_id`) REFERENCES `compensation_profiles` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

CREATE TABLE `payroll_items` (
  `id` CHAR(36) NOT NULL,
  `payroll_record_id` CHAR(36) NOT NULL,
  `type` ENUM('EARNING', 'ALLOWANCE', 'OVERTIME', 'DEDUCTION', 'BONUS', 'OTHER') NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `quantity` DECIMAL(10, 2) NULL,
  `unit` VARCHAR(50) NULL,
  `notes` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `payroll_items_record_idx` (`payroll_record_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payroll_items` ADD CONSTRAINT `payroll_items_payroll_record_id_fkey`
  FOREIGN KEY (`payroll_record_id`) REFERENCES `payroll_records` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
