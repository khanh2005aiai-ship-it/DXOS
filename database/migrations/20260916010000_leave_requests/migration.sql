CREATE TABLE `leave_requests` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `created_by_user_id` CHAR(36) NOT NULL,
  `leave_type` ENUM('ANNUAL','SICK','PERSONAL','UNPAID','OTHER') NOT NULL,
  `starts_at` DATETIME(3) NOT NULL,
  `ends_at` DATETIME(3) NOT NULL,
  `days_count` DOUBLE NOT NULL,
  `reason` VARCHAR(500) NOT NULL,
  `status` ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `reviewer_user_id` CHAR(36) NULL,
  `reviewer_note` VARCHAR(500) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `calendar_event_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `leave_requests_organization_id_id_key` (`organization_id`, `id`),
  INDEX `leave_requests_org_emp_status_idx` (`organization_id`, `employee_id`, `status`),
  INDEX `leave_requests_org_status_created_idx` (`organization_id`, `status`, `created_at`),
  INDEX `leave_requests_org_time_idx` (`organization_id`, `starts_at`, `ends_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_org_employee_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_creator_membership_fkey`
  FOREIGN KEY (`organization_id`, `created_by_user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_reviewer_membership_fkey`
  FOREIGN KEY (`organization_id`, `reviewer_user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE `leave_requests` ADD CONSTRAINT `leave_requests_calendar_event_fkey`
  FOREIGN KEY (`organization_id`, `calendar_event_id`) REFERENCES `calendar_events` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
