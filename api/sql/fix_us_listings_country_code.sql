-- One-time data fix: US listings mis-tagged as KR (NULL/blank country_code + region_code).
-- Run on production only after backup. Safe to re-run (idempotent).
-- See docs/MULTI_COUNTRY_DB_MIGRATION_PLAN.md for backup steps.

SET NAMES utf8mb4;

UPDATE `listings`
SET `country_code` = 'US'
WHERE `country_code` IN ('KR', '', NULL)
  AND `region_code` IS NOT NULL
  AND TRIM(`region_code`) <> '';
