ALTER TABLE users
  ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active,
  ADD COLUMN IF NOT EXISTS accepted_terms_at DATETIME DEFAULT NULL AFTER accepted_terms,
  ADD COLUMN IF NOT EXISTS accepted_terms_version VARCHAR(50) DEFAULT NULL AFTER accepted_terms_at,
  ADD COLUMN IF NOT EXISTS accepted_privacy BOOLEAN NOT NULL DEFAULT FALSE AFTER accepted_terms_version,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at DATETIME DEFAULT NULL AFTER accepted_privacy,
  ADD COLUMN IF NOT EXISTS accepted_privacy_version VARCHAR(50) DEFAULT NULL AFTER accepted_privacy_at,
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT FALSE AFTER accepted_privacy_version,
  ADD COLUMN IF NOT EXISTS cookies_consent JSON DEFAULT NULL AFTER marketing_consent;
