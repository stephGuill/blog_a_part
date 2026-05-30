ALTER TABLE users
  ADD COLUMN IF NOT EXISTS platform_role ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER role;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended', 'banned', 'pending') NOT NULL DEFAULT 'active' AFTER platform_role;

UPDATE users SET platform_role = 'admin' WHERE role = 'admin';
UPDATE users SET platform_role = 'user' WHERE role <> 'admin';
UPDATE users SET status = IF(is_active = TRUE, 'active', 'inactive') WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
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

CREATE TABLE IF NOT EXISTS blog_members (
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

INSERT IGNORE INTO blog_members (blog_id, user_id, role, status)
SELECT id, owner_id, 'owner', 'active'
FROM blogs;

CREATE TABLE IF NOT EXISTS reports (
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
