-- CreateTable performance_review_cycles
CREATE TABLE `performance_review_cycles` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('DRAFT', 'OPEN', 'IN_REVIEW', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `description` VARCHAR(1000) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `perf_cycles_org_name_unique` (`organization_id`, `name`),
  UNIQUE INDEX `perf_cycles_org_id_unique` (`organization_id`, `id`),
  INDEX `perf_cycles_org_status_idx` (`organization_id`, `status`),
  INDEX `perf_cycles_org_dates_idx` (`organization_id`, `start_date`, `end_date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `performance_review_cycles` ADD CONSTRAINT `perf_cycles_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable performance_goals
CREATE TABLE `performance_goals` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `cycle_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` VARCHAR(1000) NULL,
  `weight` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `progress` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'NOT_STARTED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `perf_goals_org_id_unique` (`organization_id`, `id`),
  INDEX `perf_goals_org_cycle_emp_idx` (`organization_id`, `cycle_id`, `employee_id`),
  INDEX `perf_goals_org_emp_idx` (`organization_id`, `employee_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `performance_goals` ADD CONSTRAINT `perf_goals_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_goals` ADD CONSTRAINT `perf_goals_cycle_fkey`
  FOREIGN KEY (`cycle_id`) REFERENCES `performance_review_cycles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_goals` ADD CONSTRAINT `perf_goals_org_emp_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable performance_kpis
CREATE TABLE `performance_kpis` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `cycle_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `target_value` DECIMAL(15, 2) NOT NULL,
  `actual_value` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `unit` VARCHAR(50) NOT NULL,
  `score` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `perf_kpis_org_id_unique` (`organization_id`, `id`),
  INDEX `perf_kpis_org_cycle_emp_idx` (`organization_id`, `cycle_id`, `employee_id`),
  INDEX `perf_kpis_org_emp_idx` (`organization_id`, `employee_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `performance_kpis` ADD CONSTRAINT `perf_kpis_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_kpis` ADD CONSTRAINT `perf_kpis_cycle_fkey`
  FOREIGN KEY (`cycle_id`) REFERENCES `performance_review_cycles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_kpis` ADD CONSTRAINT `perf_kpis_org_emp_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable performance_reviews
CREATE TABLE `performance_reviews` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `cycle_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `reviewer_id` CHAR(36) NOT NULL,
  `status` ENUM('DRAFT', 'SELF_ASSESSMENT', 'MANAGER_REVIEW', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `self_assessment` TEXT NULL,
  `self_rating` INT NULL,
  `self_submitted_at` DATETIME(3) NULL,
  `manager_review` TEXT NULL,
  `manager_rating` INT NULL,
  `manager_submitted_at` DATETIME(3) NULL,
  `final_rating` INT NULL,
  `summary_feedback` TEXT NULL,
  `completed_at` DATETIME(3) NULL,
  `snapshot_data` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `perf_reviews_cycle_emp_unique` (`cycle_id`, `employee_id`),
  UNIQUE INDEX `perf_reviews_org_id_unique` (`organization_id`, `id`),
  INDEX `perf_reviews_org_emp_status_idx` (`organization_id`, `employee_id`, `status`),
  INDEX `perf_reviews_org_rev_status_idx` (`organization_id`, `reviewer_id`, `status`),
  INDEX `perf_reviews_org_cycle_status_idx` (`organization_id`, `cycle_id`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `perf_reviews_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `perf_reviews_cycle_fkey`
  FOREIGN KEY (`cycle_id`) REFERENCES `performance_review_cycles` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `perf_reviews_org_emp_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `perf_reviews_reviewer_fkey`
  FOREIGN KEY (`reviewer_id`) REFERENCES `employees` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
