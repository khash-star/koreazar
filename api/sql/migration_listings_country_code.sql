-- Multi-country listings: country_code + state_code (US states).
-- Run once on production MySQL (zarkorea_zarkorea) before deploying API changes.
--
-- NOTE: MySQL (unlike MariaDB) does not support `ADD COLUMN IF NOT EXISTS` or
-- `CREATE INDEX IF NOT EXISTS`. This script uses INFORMATION_SCHEMA checks +
-- prepared statements so it is safe to run more than once (idempotent) on
-- real MySQL. See docs/MULTI_COUNTRY_DB_MIGRATION_PLAN.md for the full
-- runbook (backup, rollback, verification).

SET NAMES utf8mb4;

-- 1) Add `country_code` if missing.
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'country_code'
);
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `listings` ADD COLUMN `country_code` CHAR(2) NOT NULL DEFAULT 'KR' COMMENT 'KR, US, JP'",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Add `state_code` if missing.
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'state_code'
);
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `listings` ADD COLUMN `state_code` CHAR(2) DEFAULT NULL COMMENT 'US state code e.g. CA, NY'",
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Backfill: existing listings (created before this migration) are Korea market.
UPDATE `listings`
SET `country_code` = 'KR'
WHERE `country_code` IS NULL OR TRIM(`country_code`) = '';

-- 4) Add index on `country_code` if missing.
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND INDEX_NAME = 'listings_country_code_index'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `listings_country_code_index` ON `listings` (`country_code`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) Add index on `state_code` if missing.
SET @idx_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND INDEX_NAME = 'listings_state_code_index'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `listings_state_code_index` ON `listings` (`state_code`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
