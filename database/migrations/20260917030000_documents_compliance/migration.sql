-- CreateTable employee_documents
CREATE TABLE `employee_documents` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `employee_id` CHAR(36) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `document_number` VARCHAR(100) NULL,
  `category` ENUM('LABOR_CONTRACT', 'IDENTIFICATION', 'CERTIFICATE', 'TRAINING', 'INSURANCE', 'DECISION', 'HR_RECORD', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `sensitivity` ENUM('NORMAL', 'SENSITIVE') NOT NULL DEFAULT 'NORMAL',
  `status` ENUM('ACTIVE', 'ARCHIVED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `issue_date` DATE NULL,
  `expiry_date` DATE NULL,
  `notes` VARCHAR(2000) NULL,
  `deleted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `emp_docs_org_id_unique` (`organization_id`, `id`),
  INDEX `emp_docs_org_emp_idx` (`organization_id`, `employee_id`),
  INDEX `emp_docs_org_cat_idx` (`organization_id`, `category`),
  INDEX `emp_docs_org_status_idx` (`organization_id`, `status`),
  INDEX `emp_docs_org_expiry_idx` (`organization_id`, `expiry_date`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee_documents` ADD CONSTRAINT `emp_docs_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `employee_documents` ADD CONSTRAINT `emp_docs_org_emp_fkey`
  FOREIGN KEY (`organization_id`, `employee_id`) REFERENCES `employees` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- CreateTable document_versions
CREATE TABLE `document_versions` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `document_id` CHAR(36) NOT NULL,
  `version_number` INT UNSIGNED NOT NULL,
  `file_id` CHAR(36) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL,
  `content_type` VARCHAR(100) NOT NULL,
  `checksum` CHAR(64) NULL,
  `change_summary` VARCHAR(1000) NULL,
  `uploaded_by_user_id` CHAR(36) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `doc_versions_org_id_unique` (`organization_id`, `id`),
  UNIQUE INDEX `doc_versions_doc_version_unique` (`document_id`, `version_number`),
  INDEX `doc_versions_org_doc_idx` (`organization_id`, `document_id`),
  INDEX `doc_versions_org_file_idx` (`organization_id`, `file_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `doc_versions_org_doc_fkey`
  FOREIGN KEY (`organization_id`, `document_id`) REFERENCES `employee_documents` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `document_versions` ADD CONSTRAINT `doc_versions_org_file_fkey`
  FOREIGN KEY (`organization_id`, `file_id`) REFERENCES `file_objects` (`organization_id`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- CreateTable document_requirements
CREATE TABLE `document_requirements` (
  `id` CHAR(36) NOT NULL,
  `organization_id` CHAR(36) NOT NULL,
  `category` ENUM('LABOR_CONTRACT', 'IDENTIFICATION', 'CERTIFICATE', 'TRAINING', 'INSURANCE', 'DECISION', 'HR_RECORD', 'OTHER') NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` VARCHAR(1000) NULL,
  `is_required` BOOLEAN NOT NULL DEFAULT true,
  `applicable_department_id` CHAR(36) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  UNIQUE INDEX `doc_reqs_org_id_unique` (`organization_id`, `id`),
  INDEX `doc_reqs_org_cat_idx` (`organization_id`, `category`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_requirements` ADD CONSTRAINT `doc_reqs_org_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `document_requirements` ADD CONSTRAINT `doc_reqs_org_dept_fkey`
  FOREIGN KEY (`organization_id`, `applicable_department_id`) REFERENCES `departments` (`organization_id`, `id`) ON DELETE CASCADE ON UPDATE RESTRICT;
