CREATE TABLE `employees` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `department_id` CHAR(36) NULL,
  `employee_code` VARCHAR(64) NOT NULL,
  `display_name` VARCHAR(200) NOT NULL,
  `job_title` VARCHAR(200) NULL,
  `phone` VARCHAR(16) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL,
  UNIQUE INDEX `employees_organization_id_user_id_key` (`organization_id`, `user_id`),
  UNIQUE INDEX `employees_organization_id_employee_code_key` (`organization_id`, `employee_code`),
  UNIQUE INDEX `employees_organization_id_id_key` (`organization_id`, `id`),
  INDEX `employees_user_id_idx` (`user_id`),
  INDEX `employees_organization_id_department_id_idx` (`organization_id`, `department_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `employees` ADD CONSTRAINT `employees_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `employees` ADD CONSTRAINT `employees_organization_id_user_id_fkey` FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `employees` ADD CONSTRAINT `employees_organization_id_department_id_fkey` FOREIGN KEY (`organization_id`, `department_id`) REFERENCES `departments` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
