CREATE TABLE `oidc_identities` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `issuer` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
  `subject` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE INDEX `oidc_identities_issuer_subject_key` (`issuer`, `subject`),
  INDEX `oidc_identities_user_id_idx` (`user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `oidc_login_attempts` (
  `state_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME(6) NOT NULL,
  INDEX `oidc_login_attempts_expires_at_idx` (`expires_at`),
  PRIMARY KEY (`state_hash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `oidc_identities` ADD CONSTRAINT `oidc_identities_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
