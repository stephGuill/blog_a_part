const AbstractManager = require("./AbstractManager");

// BuilderManager.js
// Manager pour les entités du constructeur de pages (builder): pages, sections, blocks.
// Fournit des opérations CRUD et utilitaires pour les pages construites dynamiquement.

class BuilderManager extends AbstractManager {
  // table principale : builder_pages
  constructor() {
    super({ table: "builder_pages" });
  }

  // findPagesByBlogId(blogId): retourne toutes les pages d'un blog triées par date de mise à jour
  findPagesByBlogId(blogId) {
    return this.database.query(
      `SELECT *
       FROM builder_pages
       WHERE blog_id = ?
       ORDER BY updated_at DESC`,
      [blogId]
    );
  }

  findPageById(blogId, pageId) {
    return this.database.query(
      `SELECT *
       FROM builder_pages
       WHERE blog_id = ? AND id = ?`,
      [blogId, pageId]
    );
  }

  createPage(page) {
    return this.database.query(
      `INSERT INTO builder_pages
        (blog_id, owner_id, title, slug, type, status, seo_title, seo_description, layout_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        page.blog_id,
        page.owner_id,
        page.title,
        page.slug,
        page.type,
        page.status,
        page.seo_title || null,
        page.seo_description || null,
        page.layout_json ? JSON.stringify(page.layout_json) : null,
      ]
    );
  }

  updatePage(page) {
    return this.database.query(
      `UPDATE builder_pages
       SET title = ?, slug = ?, type = ?, status = ?, seo_title = ?, seo_description = ?, layout_json = ?
       WHERE blog_id = ? AND id = ?`,
      [
        page.title,
        page.slug,
        page.type,
        page.status,
        page.seo_title || null,
        page.seo_description || null,
        page.layout_json ? JSON.stringify(page.layout_json) : null,
        page.blog_id,
        page.id,
      ]
    );
  }

  saveLayout(blogId, pageId, layoutJson) {
    return this.database.query(
      `UPDATE builder_pages
       SET layout_json = ?
       WHERE blog_id = ? AND id = ?`,
      [layoutJson ? JSON.stringify(layoutJson) : null, blogId, pageId]
    );
  }

  updatePageStatus(blogId, pageId, status, publishedAt = null) {
    return this.database.query(
      `UPDATE builder_pages
       SET status = ?, published_at = ?
       WHERE blog_id = ? AND id = ?`,
      [status, publishedAt, blogId, pageId]
    );
  }

  archivePage(blogId, pageId) {
    return this.updatePageStatus(blogId, pageId, "archived");
  }

  findSectionsByPageId(pageId) {
    return this.database.query(
      `SELECT *
       FROM builder_sections
       WHERE page_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [pageId]
    );
  }

  findSectionById(blogId, pageId, sectionId) {
    return this.database.query(
      `SELECT s.*
       FROM builder_sections s
       JOIN builder_pages p ON p.id = s.page_id
       WHERE p.blog_id = ? AND p.id = ? AND s.id = ?`,
      [blogId, pageId, sectionId]
    );
  }

  findSectionByBlog(sectionId, blogId) {
    return this.database.query(
      `SELECT s.*, p.blog_id, p.id AS page_id
       FROM builder_sections s
       JOIN builder_pages p ON p.id = s.page_id
       WHERE s.id = ? AND p.blog_id = ?`,
      [sectionId, blogId]
    );
  }

  createSection(section) {
    return this.database.query(
      `INSERT INTO builder_sections
        (page_id, parent_section_id, section_type, name, sort_order, grid_config, style_json, settings_json, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        section.page_id,
        section.parent_section_id || null,
        section.section_type,
        section.name || null,
        section.sort_order || 0,
        section.grid_config ? JSON.stringify(section.grid_config) : null,
        section.style_json ? JSON.stringify(section.style_json) : null,
        section.settings_json ? JSON.stringify(section.settings_json) : null,
        section.is_visible !== false,
      ]
    );
  }

  updateSection(section) {
    return this.database.query(
      `UPDATE builder_sections
       SET parent_section_id = ?, section_type = ?, name = ?, sort_order = ?, grid_config = ?, style_json = ?, settings_json = ?, is_visible = ?
       WHERE id = ?`,
      [
        section.parent_section_id || null,
        section.section_type,
        section.name || null,
        section.sort_order || 0,
        section.grid_config ? JSON.stringify(section.grid_config) : null,
        section.style_json ? JSON.stringify(section.style_json) : null,
        section.settings_json ? JSON.stringify(section.settings_json) : null,
        section.is_visible !== false,
        section.id,
      ]
    );
  }

  deleteSection(sectionId) {
    return this.database.query("DELETE FROM builder_sections WHERE id = ?", [sectionId]);
  }

  findBlocksByPageId(pageId) {
    return this.database.query(
      `SELECT b.*
       FROM builder_blocks b
       JOIN builder_sections s ON s.id = b.section_id
       WHERE s.page_id = ?
       ORDER BY b.sort_order ASC, b.id ASC`,
      [pageId]
    );
  }

  findBlocksBySectionId(sectionId) {
    return this.database.query(
      `SELECT *
       FROM builder_blocks
       WHERE section_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [sectionId]
    );
  }

  findBlockById(blogId, blockId) {
    return this.database.query(
      `SELECT b.*, s.page_id, p.blog_id
       FROM builder_blocks b
       JOIN builder_sections s ON s.id = b.section_id
       JOIN builder_pages p ON p.id = s.page_id
       WHERE p.blog_id = ? AND b.id = ?`,
      [blogId, blockId]
    );
  }

  createBlock(block) {
    return this.database.query(
      `INSERT INTO builder_blocks
        (section_id, parent_block_id, block_type, name, content_json, style_json, settings_json, sort_order, is_visible)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        block.section_id,
        block.parent_block_id || null,
        block.block_type,
        block.name || null,
        block.content_json ? JSON.stringify(block.content_json) : null,
        block.style_json ? JSON.stringify(block.style_json) : null,
        block.settings_json ? JSON.stringify(block.settings_json) : null,
        block.sort_order || 0,
        block.is_visible !== false,
      ]
    );
  }

  updateBlock(block) {
    return this.database.query(
      `UPDATE builder_blocks
       SET parent_block_id = ?, block_type = ?, name = ?, content_json = ?, style_json = ?, settings_json = ?, sort_order = ?, is_visible = ?
       WHERE id = ?`,
      [
        block.parent_block_id || null,
        block.block_type,
        block.name || null,
        block.content_json ? JSON.stringify(block.content_json) : null,
        block.style_json ? JSON.stringify(block.style_json) : null,
        block.settings_json ? JSON.stringify(block.settings_json) : null,
        block.sort_order || 0,
        block.is_visible !== false,
        block.id,
      ]
    );
  }

  deleteBlock(blockId) {
    return this.database.query("DELETE FROM builder_blocks WHERE id = ?", [blockId]);
  }

  async reorderSections(items) {
    const updates = items.map((item) =>
      this.database.query("UPDATE builder_sections SET sort_order = ? WHERE id = ?", [item.sort_order, item.id])
    );
    return Promise.all(updates);
  }

  async reorderBlocks(items) {
    const updates = items.map((item) =>
      this.database.query("UPDATE builder_blocks SET sort_order = ? WHERE id = ?", [item.sort_order, item.id])
    );
    return Promise.all(updates);
  }
}

module.exports = BuilderManager;
