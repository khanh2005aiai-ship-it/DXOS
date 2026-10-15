ALTER TABLE `organizations`
ADD COLUMN `status` ENUM('ACTIVE', 'SUSPENDED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE `organization_memberships`
MODIFY COLUMN `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE';

CREATE INDEX `organization_memberships_user_id_status_organization_id_idx`
ON `organization_memberships`(`user_id`, `status`, `organization_id`);
