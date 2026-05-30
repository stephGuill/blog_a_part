ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'google', 'facebook', 'apple') NOT NULL DEFAULT 'local' AFTER cookies_consent,
  ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255) DEFAULT NULL AFTER auth_provider,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER provider_id,
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER email_verified,
  ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_enabled,
  ADD COLUMN IF NOT EXISTS two_factor_pending_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_secret,
  ADD COLUMN IF NOT EXISTS two_factor_recovery_codes JSON DEFAULT NULL AFTER two_factor_pending_secret,
  ADD COLUMN IF NOT EXISTS last_login_at DATETIME DEFAULT NULL AFTER two_factor_recovery_codes;

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider ENUM('google', 'facebook', 'apple') NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255) DEFAULT NULL,
  provider_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  provider_avatar_url VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_provider_account (provider, provider_user_id),
  INDEX idx_oauth_user_id (user_id),
  CONSTRAINT fk_oauth_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
