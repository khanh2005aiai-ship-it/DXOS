CREATE TABLE `shifts` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `start_time` VARCHAR(8) NOT NULL,
  `end_time` VARCHAR(8) NOT NULL,
  `break_start` VARCHAR(8) NULL,
  `break_end` VARCHAR(8) NULL,
  `grace_period_minutes` INT NOT NULL DEFAULT 0,
  `is_overnight` BOOLEAN NOT NULL DEFAULT false,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `description` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `shifts_org_code_unique` (`organization_id`, `code`),
  UNIQUE INDEX `shifts_org_id_unique` (`organization_id`, `id`),
  INDEX `shifts_org_active_idx` (`organization_id`, `is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `shifts` ADD CONSTRAINT `shifts_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

CREATE TABLE `work_schedules` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `shift_id` CHAR(36) NULL,
  `work_date` DATE NOT NULL,
  `is_off` BOOLEAN NOT NULL DEFAULT false,
  `notes` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `work_schedules_org_emp_date_unique` (`organization_id`, `employee_id`, `work_date`),
  UNIQUE INDEX `work_schedules_org_id_unique` (`organization_id`, `id`),
  INDEX `work_schedules_org_date_idx` (`organization_id`, `work_date`),
  INDEX `work_schedules_org_shift_idx` (`organization_id`, `shift_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `work_schedules` ADD CONSTRAINT `work_schedules_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `work_schedules` ADD CONSTRAINT `work_schedules_org_employee_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `work_schedules` ADD CONSTRAINT `work_schedules_shift_id_fkey`
  FOREIGN KEY (`organization_id`, `shift_id`) REFERENCES `shifts` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `attendance_records` ADD COLUMN `shift_id` CHAR(36) NULL AFTER `employee_id`;

ALTER TABLE `attendance_records` ADD INDEX `attendance_records_org_shift_idx` (`organization_id`, `shift_id`);

ALTER TABLE `attendance_records` ADD INDEX `attendance_records_shift_idx` (`shift_id`);

ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_shift_id_fkey`
  FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
