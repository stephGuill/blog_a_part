CREATE DATABASE IF NOT EXISTS blog_a_part
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE blog_a_part;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE COMMENT "Nom d'affichage public et login alternatif",
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) COMMENT 'Nom réel (optionnel ou privé)',
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('admin', 'owner', 'editor', 'moderator', 'user') NOT NULL DEFAULT 'user',
  `platform_role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `status` ENUM('active', 'inactive', 'suspended', 'banned', 'pending') NOT NULL DEFAULT 'active',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `accepted_terms` BOOLEAN NOT NULL DEFAULT FALSE,
  `accepted_terms_at` DATETIME DEFAULT NULL,
  `accepted_terms_version` VARCHAR(50) DEFAULT NULL,
  `accepted_privacy` BOOLEAN NOT NULL DEFAULT FALSE,
  `accepted_privacy_at` DATETIME DEFAULT NULL,
  `accepted_privacy_version` VARCHAR(50) DEFAULT NULL,
  `marketing_consent` BOOLEAN NOT NULL DEFAULT FALSE,
  `cookies_consent` JSON DEFAULT NULL,
  `auth_provider` ENUM('local', 'google', 'facebook', 'apple') NOT NULL DEFAULT 'local',
  `provider_id` VARCHAR(255) DEFAULT NULL,
  `email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `two_factor_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `two_factor_secret` VARCHAR(255) DEFAULT NULL,
  `two_factor_pending_secret` VARCHAR(255) DEFAULT NULL,
  `two_factor_recovery_codes` JSON DEFAULT NULL,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `user_oauth_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `provider` ENUM('google', 'facebook', 'apple') NOT NULL,
  `provider_user_id` VARCHAR(255) NOT NULL,
  `provider_email` VARCHAR(255) DEFAULT NULL,
  `provider_email_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `provider_avatar_url` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider_account (`provider`, `provider_user_id`),
  INDEX idx_oauth_user_id (`user_id`),
  CONSTRAINT fk_oauth_user
    FOREIGN KEY (`user_id`) REFERENCES users (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT DEFAULT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id INT DEFAULT NULL,
  action VARCHAR(120) NOT NULL,
  old_values JSON,
  new_values JSON,
  metadata_json JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  bulk_action_id VARCHAR(100),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_actor (actor_user_id),
  INDEX idx_audit_target (target_type, target_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_bulk_action (bulk_action_id),
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `item` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `themes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `type` ENUM('blog', 'page', 'post') NOT NULL COMMENT 'Type de thème',
  `description` TEXT,
  `config_json` JSON,
  `preview_url` VARCHAR(255),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `blogs` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  theme_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_blogs_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_blogs_theme
    FOREIGN KEY (theme_id) REFERENCES themes (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `blog_members` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('owner', 'editor', 'moderator', 'member', 'viewer') NOT NULL DEFAULT 'member',
  status ENUM('pending', 'active', 'suspended', 'removed') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY blog_members_unique_user_blog (blog_id, user_id),
  INDEX idx_blog_members_blog (blog_id),
  INDEX idx_blog_members_user (user_id),
  INDEX idx_blog_members_role_status (role, status),
  CONSTRAINT fk_blog_members_blog
    FOREIGN KEY (blog_id) REFERENCES blogs (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_blog_members_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `posts` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  excerpt TEXT,
  content TEXT,
  status ENUM('draft', 'pending', 'published', 'archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_posts_blog
    FOREIGN KEY (blog_id) REFERENCES blogs (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_posts_author
    FOREIGN KEY (author_id) REFERENCES users (id)
    ON DELETE CASCADE,
  UNIQUE KEY posts_unique_slug_per_blog (blog_id, slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `categories` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_blog
    FOREIGN KEY (blog_id) REFERENCES blogs (id)
    ON DELETE CASCADE,
  UNIQUE KEY categories_unique_slug_per_blog (blog_id, slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `post_categories` (
  post_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (post_id, category_id),
  CONSTRAINT fk_post_categories_post
    FOREIGN KEY (post_id) REFERENCES posts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_post_categories_category
    FOREIGN KEY (category_id) REFERENCES categories (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `media` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  uploader_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_name VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes INT,
  alt_text VARCHAR(255),
  metadata_json JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_media_blog
    FOREIGN KEY (blog_id) REFERENCES blogs (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_media_uploader
    FOREIGN KEY (uploader_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `post_media` (
  post_id INT NOT NULL,
  media_id INT NOT NULL,
  position INT DEFAULT 0 COMMENT 'Ordre d''affichage',
  usage_type ENUM('cover', 'inline', 'gallery', 'attachment') DEFAULT 'inline',
  PRIMARY KEY (post_id, media_id),
  CONSTRAINT fk_post_media_post
    FOREIGN KEY (post_id) REFERENCES posts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_post_media_media
    FOREIGN KEY (media_id) REFERENCES media (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `comments` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  status ENUM('pending', 'approved', 'spam', 'deleted') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_post
    FOREIGN KEY (post_id) REFERENCES posts (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent
    FOREIGN KEY (parent_id) REFERENCES comments (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `reports` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT DEFAULT NULL,
  reporter_user_id INT DEFAULT NULL,
  target_type ENUM('blog', 'post', 'comment', 'user') NOT NULL,
  target_id INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  details TEXT,
  status ENUM('pending', 'reviewed', 'rejected', 'resolved') NOT NULL DEFAULT 'pending',
  reviewed_by INT DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reports_blog_status (blog_id, status),
  INDEX idx_reports_target (target_type, target_id),
  CONSTRAINT fk_reports_blog
    FOREIGN KEY (blog_id) REFERENCES blogs (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_reports_reporter
    FOREIGN KEY (reporter_user_id) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_reports_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `builder_pages` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blog_id INT NOT NULL,
  owner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(191) NOT NULL,
  type ENUM('page', 'post', 'article', 'landing') NOT NULL DEFAULT 'page',
  status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  seo_title VARCHAR(255) DEFAULT NULL,
  seo_description TEXT,
  layout_json JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME DEFAULT NULL,
  UNIQUE KEY builder_pages_unique_slug_per_blog (blog_id, slug),
  INDEX idx_builder_pages_blog (blog_id),
  INDEX idx_builder_pages_owner (owner_id),
  INDEX idx_builder_pages_status (status),
  CONSTRAINT fk_builder_pages_blog
    FOREIGN KEY (blog_id) REFERENCES blogs (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_builder_pages_owner
    FOREIGN KEY (owner_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `builder_sections` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id INT NOT NULL,
  parent_section_id INT DEFAULT NULL,
  section_type VARCHAR(80) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  grid_config JSON DEFAULT NULL,
  style_json JSON DEFAULT NULL,
  settings_json JSON DEFAULT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_builder_sections_page (page_id),
  INDEX idx_builder_sections_parent (parent_section_id),
  INDEX idx_builder_sections_order (page_id, sort_order),
  CONSTRAINT fk_builder_sections_page
    FOREIGN KEY (page_id) REFERENCES builder_pages (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_builder_sections_parent
    FOREIGN KEY (parent_section_id) REFERENCES builder_sections (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `builder_blocks` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_id INT NOT NULL,
  parent_block_id INT DEFAULT NULL,
  block_type VARCHAR(80) NOT NULL,
  name VARCHAR(255) DEFAULT NULL,
  content_json JSON DEFAULT NULL,
  style_json JSON DEFAULT NULL,
  settings_json JSON DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_builder_blocks_section (section_id),
  INDEX idx_builder_blocks_parent (parent_block_id),
  INDEX idx_builder_blocks_order (section_id, sort_order),
  CONSTRAINT fk_builder_blocks_section
    FOREIGN KEY (section_id) REFERENCES builder_sections (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_builder_blocks_parent
    FOREIGN KEY (parent_block_id) REFERENCES builder_blocks (id)
    ON DELETE SET NULL
) ENGINE=InnoDB;


--  ceci est la base de donnée pas encore finaliser