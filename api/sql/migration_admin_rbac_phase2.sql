-- Phase 2 admin RBAC — optional MySQL columns for API scoped admin checks.
-- Run on staging first. Keep Firestore users/{uid} in sync (source of truth for web/mobile UI).

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `admin_country_code` CHAR(2) DEFAULT NULL COMMENT 'country_admin scope: KR, US, JP',
  ADD COLUMN IF NOT EXISTS `admin_region_code` VARCHAR(64) DEFAULT NULL COMMENT 'region_admin scope: washington-dc, chicago, ...';

-- Example: DC region admin (ZAR-USA)
-- UPDATE users SET role = 'region_admin', admin_country_code = 'US', admin_region_code = 'washington-dc'
-- WHERE email = 'us-admin@example.com';

-- Example: US country admin (all active US regions when Chicago etc. are enabled)
-- UPDATE users SET role = 'country_admin', admin_country_code = 'US', admin_region_code = NULL
-- WHERE email = 'us-country-admin@example.com';

-- Super admin (legacy role=admin still works)
-- UPDATE users SET role = 'super_admin', admin_country_code = NULL, admin_region_code = NULL
-- WHERE email = 'khashpay@gmail.com';
