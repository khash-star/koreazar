-- Zarusa region — Washington DC / DMV MVP (multi-region-ready schema).
-- DO NOT run on production until approved. Staging/dev only.
-- Safe to re-run: checks information_schema before ALTER/CREATE.

SET NAMES utf8mb4;

-- listings.region_code (US community lock; separate from state_code metadata)
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND COLUMN_NAME = 'region_code'
);
SET @sql = IF(@col_exists = 0,
  "ALTER TABLE `listings` ADD COLUMN `region_code` VARCHAR(32) NULL COMMENT 'US community e.g. washington-dc' AFTER `state_code`",
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Composite index country + region on listings
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'listings' AND INDEX_NAME = 'listings_country_region_index'
);
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX `listings_country_region_index` ON `listings` (`country_code`, `region_code`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
