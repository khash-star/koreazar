-- Zarkorea MySQL schema (utf8mb4)
-- Run in phpMyAdmin → SQL tab (database: zarkorea_zarkorea selected)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firebase_uid` VARCHAR(128) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `display_name` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(32) NOT NULL DEFAULT 'user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_firebase_uid_unique` (`firebase_uid`),
  KEY `users_email_index` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `listings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `firebase_uid` VARCHAR(128) NOT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(64) NOT NULL,
  `subcategory` VARCHAR(64) DEFAULT NULL,
  `title` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(15,2) DEFAULT NULL,
  `is_negotiable` TINYINT(1) NOT NULL DEFAULT 0,
  `condition` VARCHAR(32) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `listing_type` VARCHAR(32) DEFAULT NULL,
  `listing_type_expires` DATETIME DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `kakao_id` VARCHAR(128) DEFAULT NULL,
  `wechat_id` VARCHAR(128) DEFAULT NULL,
  `whatsapp` VARCHAR(128) DEFAULT NULL,
  `facebook` VARCHAR(512) DEFAULT NULL,
  `views` INT UNSIGNED NOT NULL DEFAULT 0,
  `images` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `listings_category_index` (`category`),
  KEY `listings_subcategory_index` (`subcategory`),
  KEY `listings_status_index` (`status`),
  KEY `listings_created_at_index` (`created_at`),
  KEY `listings_firebase_uid_index` (`firebase_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `listing_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `listing_id` BIGINT UNSIGNED NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `storage_url` VARCHAR(2048) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `listing_images_listing_id_index` (`listing_id`),
  CONSTRAINT `listing_images_listing_id_foreign` FOREIGN KEY (`listing_id`) REFERENCES `listings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
