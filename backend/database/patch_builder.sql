CREATE TABLE IF NOT EXISTS builder_pages (
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

CREATE TABLE IF NOT EXISTS builder_sections (
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

CREATE TABLE IF NOT EXISTS builder_blocks (
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
