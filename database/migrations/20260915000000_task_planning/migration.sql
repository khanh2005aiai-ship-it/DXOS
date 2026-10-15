CREATE TABLE `task_checklist_items` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `task_id` CHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `is_completed` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `task_checklist_chronology_idx` (`organization_id`, `task_id`, `created_at`, `id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `task_reviewers` (
  `task_id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `task_reviewers_organization_id_task_id_key` (`organization_id`, `task_id`),
  INDEX `task_reviewers_organization_id_employee_id_idx` (`organization_id`, `employee_id`),
  PRIMARY KEY (`task_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `task_checklist_items` ADD CONSTRAINT `task_checklist_items_organization_id_task_id_fkey`
  FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `task_reviewers` ADD CONSTRAINT `task_reviewers_organization_id_task_id_fkey`
  FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `task_reviewers` ADD CONSTRAINT `task_reviewers_organization_id_employee_id_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
