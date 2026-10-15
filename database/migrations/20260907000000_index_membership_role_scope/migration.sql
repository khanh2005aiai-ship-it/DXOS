-- Explicitly declare the index supporting the tenant-scoped membership FK.
CREATE INDEX `membership_roles_organization_id_membership_id_idx`
ON `membership_roles`(`organization_id`, `membership_id`);
