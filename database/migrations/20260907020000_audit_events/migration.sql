CREATE TABLE `audit_events` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NULL,
  `actor_user_id` CHAR(36) NULL,
  `event` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(40) NOT NULL,
  `resource_id` CHAR(36) NULL,
  `outcome` ENUM('SUCCESS', 'FAILURE', 'DENIED') NOT NULL,
  `source` ENUM('HTTP', 'SYSTEM') NOT NULL,
  `request_id` VARCHAR(128) NULL,
  `metadata` JSON NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX `audit_events_organization_id_created_at_id_idx` (`organization_id`, `created_at`, `id`),
  INDEX `audit_events_organization_id_event_created_at_id_idx` (`organization_id`, `event`, `created_at`, `id`),
  INDEX `audit_events_actor_user_id_idx` (`actor_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_organization_id_fkey`
FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_actor_user_id_fkey`
FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
