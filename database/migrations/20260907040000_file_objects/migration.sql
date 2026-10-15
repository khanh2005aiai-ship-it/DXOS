CREATE TABLE `file_objects` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `uploaded_by_user_id` CHAR(36) NOT NULL,
  `original_filename` VARCHAR(200) NOT NULL,
  `content_type` VARCHAR(100) NOT NULL,
  `size` INTEGER UNSIGNED NULL,
  `checksum` CHAR(64) NULL,
  `storage_provider` VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
  `storage_key` CHAR(36) NOT NULL,
  `status` ENUM('UPLOADING', 'AVAILABLE', 'FAILED', 'DELETED') NOT NULL DEFAULT 'UPLOADING',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` DATETIME(6) NOT NULL,
  UNIQUE INDEX `file_objects_storage_key_key` (`storage_key`),
  INDEX `file_objects_uploader_membership_idx` (`organization_id`, `uploaded_by_user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `file_objects` ADD CONSTRAINT `file_objects_uploader_membership_fkey`
FOREIGN KEY (`organization_id`, `uploaded_by_user_id`) REFERENCES `organization_memberships` (`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
