-- Preserve existing tenant keys, department codes and hierarchy data.
ALTER TABLE `departments`
  ADD COLUMN `description` VARCHAR(1000) NULL,
  ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';
