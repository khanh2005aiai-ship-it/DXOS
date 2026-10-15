CREATE TABLE `tasks` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `creator_employee_id` CHAR(36) NOT NULL,
  `assignee_employee_id` CHAR(36) NULL,
  `department_id` CHAR(36) NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` VARCHAR(10000) NULL,
  `status` ENUM('TODO','IN_PROGRESS','DONE','CANCELLED') NOT NULL DEFAULT 'TODO',
  `priority` ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  `due_at` DATETIME(6) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL,
  UNIQUE INDEX `tasks_organization_id_id_key` (`organization_id`, `id`),
  INDEX `tasks_organization_id_creator_employee_id_idx` (`organization_id`, `creator_employee_id`),
  INDEX `tasks_organization_id_assignee_employee_id_id_idx` (`organization_id`, `assignee_employee_id`, `id`),
  INDEX `tasks_organization_id_department_id_id_idx` (`organization_id`, `department_id`, `id`),
  INDEX `tasks_organization_id_status_id_idx` (`organization_id`, `status`, `id`),
  INDEX `tasks_organization_id_priority_id_idx` (`organization_id`, `priority`, `id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_organization_id_creator_employee_id_fkey` FOREIGN KEY (`organization_id`, `creator_employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_organization_id_assignee_employee_id_fkey` FOREIGN KEY (`organization_id`, `assignee_employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_organization_id_department_id_fkey` FOREIGN KEY (`organization_id`, `department_id`) REFERENCES `departments` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
