CREATE TABLE `calendar_events` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `created_by_user_id` CHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` VARCHAR(4000) NULL,
  `kind` ENUM('EVENT','MEETING') NOT NULL,
  `starts_at` DATETIME(3) NOT NULL,
  `ends_at` DATETIME(3) NOT NULL,
  `location` VARCHAR(200) NULL,
  `status` ENUM('SCHEDULED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `calendar_events_organization_id_id_key` (`organization_id`, `id`),
  INDEX `calendar_events_organization_id_created_by_user_id_idx` (`organization_id`, `created_by_user_id`),
  INDEX `calendar_org_start_idx` (`organization_id`, `starts_at`, `id`),
  INDEX `calendar_org_end_idx` (`organization_id`, `ends_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `calendar_events` ADD CONSTRAINT `calendar_creator_membership_fk`
  FOREIGN KEY (`organization_id`, `created_by_user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
