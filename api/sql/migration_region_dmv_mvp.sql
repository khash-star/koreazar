-- Zarusa region lock — Washington DC / DMV MVP (multi-region-ready schema).
-- DO NOT run on production until approved. Staging/dev only.
-- Safe to re-run: checks information_schema before ALTER/CREATE.

SET NAMES utf8mb4;

-- 1) listings.region_code
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'region_code'
);
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `listings` ADD COLUMN `region_code` VARCHAR(32) NULL COMMENT 'US community e.g. washington-dc' AFTER `state_code`",
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) users.home_country_code, users.home_region_code
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'home_country_code'
);
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `users` ADD COLUMN `home_country_code` CHAR(2) NULL COMMENT 'Locked home market' AFTER `role`",
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'home_region_code'
);
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `users` ADD COLUMN `home_region_code` VARCHAR(32) NULL COMMENT 'Locked US region e.g. washington-dc' AFTER `home_country_code`",
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Composite index country + region on listings
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND INDEX_NAME = 'listings_country_region_index'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `listings_country_region_index` ON `listings` (`country_code`, `region_code`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4) invite_codes
CREATE TABLE IF NOT EXISTS `invite_codes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `country_code` CHAR(2) NOT NULL DEFAULT 'US',
  `region_code` VARCHAR(32) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `max_uses` INT UNSIGNED NULL,
  `used_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invite_codes_code_unique` (`code`),
  KEY `invite_codes_region_index` (`country_code`, `region_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Seed DMV MVP invites (idempotent)
INSERT INTO `invite_codes` (`code`, `country_code`, `region_code`, `active`, `max_uses`)
SELECT 'DMV2026', 'US', 'washington-dc', 1, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `invite_codes` WHERE `code` = 'DMV2026' LIMIT 1);

INSERT INTO `invite_codes` (`code`, `country_code`, `region_code`, `active`, `max_uses`)
SELECT 'DMV', 'US', 'washington-dc', 1, NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `invite_codes` WHERE `code` = 'DMV' LIMIT 1);
