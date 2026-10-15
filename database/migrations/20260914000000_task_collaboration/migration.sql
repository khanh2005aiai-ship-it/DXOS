-- AlterTable
ALTER TABLE `tasks` ADD COLUMN `progress_percent` TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- Existing completed tasks have known completion; other historical percentages are unknown.
UPDATE `tasks` SET `progress_percent` = 100 WHERE `status` = 'DONE';
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_progress_percent_check` CHECK (`progress_percent` <= 100);

-- CreateTable
CREATE TABLE `task_comments` (
    `id` CHAR(36) NOT NULL,
    `organization_id` CHAR(36) NOT NULL,
    `task_id` CHAR(36) NOT NULL,
    `author_user_id` CHAR(36) NOT NULL,
    `body` VARCHAR(4000) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_comments_chronology_idx`(`organization_id`, `task_id`, `created_at`, `id`),
    INDEX `task_comments_author_idx`(`organization_id`, `author_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_attachments` (
    `id` CHAR(36) NOT NULL,
    `organization_id` CHAR(36) NOT NULL,
    `task_id` CHAR(36) NOT NULL,
    `file_id` CHAR(36) NOT NULL,
    `linked_by_user_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_attachments_chronology_idx`(`organization_id`, `task_id`, `created_at`, `id`),
    INDEX `task_attachments_file_idx`(`organization_id`, `file_id`),
    INDEX `task_attachments_linker_idx`(`organization_id`, `linked_by_user_id`),
    UNIQUE INDEX `task_attachments_task_file_key`(`organization_id`, `task_id`, `file_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `file_objects_organization_id_id_key` ON `file_objects`(`organization_id`, `id`);

-- AddForeignKey
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_organization_id_task_id_fkey` FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks`(`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_organization_id_author_user_id_fkey` FOREIGN KEY (`organization_id`, `author_user_id`) REFERENCES `organization_memberships`(`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_organization_id_task_id_fkey` FOREIGN KEY (`organization_id`, `task_id`) REFERENCES `tasks`(`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_organization_id_file_id_fkey` FOREIGN KEY (`organization_id`, `file_id`) REFERENCES `file_objects`(`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_organization_id_linked_by_user_id_fkey` FOREIGN KEY (`organization_id`, `linked_by_user_id`) REFERENCES `organization_memberships`(`organization_id`, `user_id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

