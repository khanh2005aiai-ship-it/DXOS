CREATE TABLE `notifications` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `recipient_user_id` CHAR(36) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `body` VARCHAR(1000) NOT NULL,
  `metadata` JSON NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `read_at` DATETIME(6) NULL,
  PRIMARY KEY (`id`),
  INDEX `notifications_recipient_chronology_idx` (`organization_id`, `recipient_user_id`, `created_at`, `id`),
  INDEX `notifications_recipient_read_chronology_idx` (`organization_id`, `recipient_user_id`, `read_at`, `created_at`, `id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipient_membership_fkey`
FOREIGN KEY (`organization_id`, `recipient_user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
