CREATE TABLE `approval_requests` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `requester_id` CHAR(36) NOT NULL,
  `type` ENUM('LEAVE', 'ATTENDANCE_ADJUSTMENT') NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `title` VARCHAR(255) NOT NULL,
  `reason` VARCHAR(1000) NOT NULL,
  `payload` JSON NOT NULL,
  `reviewer_id` CHAR(36) NULL,
  `reviewer_note` VARCHAR(1000) NULL,
  `reviewed_at` DATETIME(3) NULL,
  `reference_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `approval_requests_org_id_unique` (`organization_id`, `id`),
  INDEX `approval_requests_org_status_created_idx` (`organization_id`, `status`, `created_at`),
  INDEX `approval_requests_org_requester_status_idx` (`organization_id`, `requester_id`, `status`),
  INDEX `approval_requests_org_type_status_idx` (`organization_id`, `type`, `status`),
  INDEX `approval_requests_org_ref_idx` (`organization_id`, `reference_id`),
  INDEX `approval_requests_org_type_ref_idx` (`organization_id`, `type`, `reference_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_requester_fkey`
  FOREIGN KEY (`organization_id`, `requester_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_reviewer_fkey`
  FOREIGN KEY (`reviewer_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
