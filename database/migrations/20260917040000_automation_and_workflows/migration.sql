-- CreateTable automation_rules
CREATE TABLE `automation_rules` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` VARCHAR(1000) NULL,
  `trigger` VARCHAR(100) NOT NULL,
  `conditions` TEXT NOT NULL,
  `actions` TEXT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `last_run_at` DATETIME(3) NULL,
  `created_by` CHAR(36) NOT NULL,
  `updated_by` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `auto_rules_org_id_unique` (`organization_id`, `id`),
  INDEX `auto_rules_org_trigger_idx` (`organization_id`, `trigger`),
  INDEX `auto_rules_org_active_idx` (`organization_id`, `is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `automation_rules` ADD CONSTRAINT `auto_rules_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable automation_executions
CREATE TABLE `automation_executions` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `automation_rule_id` CHAR(36) NOT NULL,
  `event` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` VARCHAR(100) NULL,
  `status` VARCHAR(20) NOT NULL,
  `idempotency_key` VARCHAR(191) NULL,
  `error` TEXT NULL,
  `metadata` TEXT NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `auto_exec_org_id_unique` (`organization_id`, `id`),
  INDEX `auto_exec_org_rule_idx` (`organization_id`, `automation_rule_id`),
  INDEX `auto_exec_org_idemp_idx` (`organization_id`, `idempotency_key`),
  INDEX `auto_exec_org_status_idx` (`organization_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `automation_executions` ADD CONSTRAINT `auto_exec_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `automation_executions` ADD CONSTRAINT `auto_exec_rule_fkey`
  FOREIGN KEY (`automation_rule_id`) REFERENCES `automation_rules` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable workflow_definitions
CREATE TABLE `workflow_definitions` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` VARCHAR(1000) NULL,
  `trigger_type` VARCHAR(100) NOT NULL,
  `steps` TEXT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_by` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `wf_defs_org_id_unique` (`organization_id`, `id`),
  INDEX `wf_defs_org_trigger_idx` (`organization_id`, `trigger_type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workflow_definitions` ADD CONSTRAINT `wf_defs_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable workflow_instances
CREATE TABLE `workflow_instances` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `workflow_definition_id` CHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` VARCHAR(100) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
  `current_step_index` INT NOT NULL DEFAULT 0,
  `data` TEXT NULL,
  `owner_user_id` CHAR(36) NOT NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `wf_inst_org_id_unique` (`organization_id`, `id`),
  INDEX `wf_inst_org_status_idx` (`organization_id`, `status`),
  INDEX `wf_inst_org_def_idx` (`organization_id`, `workflow_definition_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workflow_instances` ADD CONSTRAINT `wf_inst_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `workflow_instances` ADD CONSTRAINT `wf_inst_def_fkey`
  FOREIGN KEY (`workflow_definition_id`) REFERENCES `workflow_definitions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable workflow_step_executions
CREATE TABLE `workflow_step_executions` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `workflow_instance_id` CHAR(36) NOT NULL,
  `step_index` INT NOT NULL,
  `step_name` VARCHAR(200) NOT NULL,
  `step_type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `assigned_to_user_id` CHAR(36) NULL,
  `action_payload` TEXT NULL,
  `result_payload` TEXT NULL,
  `comments` TEXT NULL,
  `executed_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `wf_steps_org_id_unique` (`organization_id`, `id`),
  INDEX `wf_steps_org_inst_idx` (`organization_id`, `workflow_instance_id`),
  INDEX `wf_steps_org_status_idx` (`organization_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `workflow_step_executions` ADD CONSTRAINT `wf_steps_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `workflow_step_executions` ADD CONSTRAINT `wf_steps_inst_fkey`
  FOREIGN KEY (`workflow_instance_id`) REFERENCES `workflow_instances` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
