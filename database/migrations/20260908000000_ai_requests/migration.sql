CREATE TABLE `ai_requests` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `model` VARCHAR(100) NOT NULL,
  `status` ENUM('STARTED', 'SUCCEEDED', 'FAILED') NOT NULL DEFAULT 'STARTED',
  `request_id` VARCHAR(128) NOT NULL,
  `input_tokens` INTEGER UNSIGNED NULL,
  `output_tokens` INTEGER UNSIGNED NULL,
  `latency_ms` INTEGER UNSIGNED NULL,
  `error_category` VARCHAR(40) NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `completed_at` DATETIME(6) NULL,
  INDEX `ai_requests_membership_idx` (`organization_id`, `user_id`),
  INDEX `ai_requests_status_idx` (`organization_id`, `status`, `created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `ai_requests` ADD CONSTRAINT `ai_requests_membership_fkey`
FOREIGN KEY (`organization_id`, `user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
