-- Reconcile pre-existing live drift without changing historical migrations.
-- Fresh databases already have these exact constraints, so replay is a no-op.
-- Live dx_os was checked for orphan organization/requester rows before deployment.
SET @dxos_fk_sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'SELECT 1')
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'approval_requests'
    AND CONSTRAINT_NAME = 'approval_requests_organization_id_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
PREPARE dxos_fk_statement FROM @dxos_fk_sql;
EXECUTE dxos_fk_statement;
DEALLOCATE PREPARE dxos_fk_statement;

SET @dxos_fk_sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_requester_fkey` FOREIGN KEY (`organization_id`, `requester_id`) REFERENCES `employees`(`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT',
    'SELECT 1')
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'approval_requests'
    AND CONSTRAINT_NAME = 'approval_requests_requester_fkey' AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
PREPARE dxos_fk_statement FROM @dxos_fk_sql;
EXECUTE dxos_fk_statement;
DEALLOCATE PREPARE dxos_fk_statement;
