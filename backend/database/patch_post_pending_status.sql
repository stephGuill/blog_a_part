ALTER TABLE posts
  MODIFY status ENUM('draft', 'pending', 'published', 'archived') NOT NULL DEFAULT 'draft';
