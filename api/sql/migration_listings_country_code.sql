-- Multi-country listings: country_code + state_code (US states).
-- Run once on production MySQL (zarkorea_zarkorea) before deploying API changes.

SET NAMES utf8mb4;

ALTER TABLE `listings`
  ADD COLUMN IF NOT EXISTS `country_code` CHAR(2) NOT NULL DEFAULT 'KR' COMMENT 'KR, US, JP',
  ADD COLUMN IF NOT EXISTS `state_code` CHAR(2) DEFAULT NULL COMMENT 'US state code e.g. CA, NY';

-- Backfill: existing listings are Korea market
UPDATE `listings`
SET `country_code` = 'KR'
WHERE `country_code` IS NULL OR TRIM(`country_code`) = '';

CREATE INDEX IF NOT EXISTS `listings_country_code_index` ON `listings` (`country_code`);
CREATE INDEX IF NOT EXISTS `listings_state_code_index` ON `listings` (`state_code`);
