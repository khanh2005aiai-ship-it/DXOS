CREATE TABLE `attendance_records` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `work_date` DATE NOT NULL,
  `check_in_at` DATETIME(3) NOT NULL,
  `check_out_at` DATETIME(3) NULL,
  `status` ENUM('PRESENT','LATE','ABSENT','ON_LEAVE','INCOMPLETE') NOT NULL DEFAULT 'PRESENT',
  `late_minutes` INT NOT NULL DEFAULT 0,
  `early_leave_minutes` INT NOT NULL DEFAULT 0,
  `worked_minutes` INT NULL,
  `note` VARCHAR(500) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `attendance_records_org_emp_date_unique` (`organization_id`, `employee_id`, `work_date`),
  UNIQUE INDEX `attendance_records_org_id_unique` (`organization_id`, `id`),
  INDEX `attendance_records_org_date_idx` (`organization_id`, `work_date`),
  INDEX `attendance_records_org_status_idx` (`organization_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_org_employee_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
