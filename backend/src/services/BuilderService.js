const fs = require("node:fs/promises");
const path = require("node:path");

const slugify = require("slugify");

const models = require("../models");
const { sanitizeStyleJson } = require("../utils/allowedStyles");
const {
  BUILDER_BLOCK_TYPES,
  BUILDER_HEADING_LEVELS,
  BUILDER_MEDIA_USAGE_TYPES,
  BUILDER_PAGE_STATUSES,
  BUILDER_PAGE_TYPES,
  BUILDER_SECTION_TYPES,
  isAllowed,
} = require("../utils/builderTypes");

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toJsonValue(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function assertSafeJson(value, fieldName) {
  const jsonValue = toJsonValue(value, value || {});
  const serialized = JSON.stringify(jsonValue || {});

  if (/<script|javascript:|onerror\s*=|onload\s*=/i.test(serialized)) {
    throw createHttpError(400, `${fieldName} contient du contenu potentiellement dangereux.`);
  }

  return jsonValue || {};
}

function normalizeSlug(value, fallback) {
  return slugify(value || fallback || "", { lower: true, strict: true });
}

function normalizePage(row) {
  if (!row) return null;

  return {
    ...row,
    layout_json: toJsonValue(row.layout_json, {}),
  };
}

function normalizeSection(row) {
  if (!row) return null;

  return {
    ...row,
    grid_config: toJsonValue(row.grid_config, {}),
    style_json: toJsonValue(row.style_json, {}),
    settings_json: toJsonValue(row.settings_json, {}),
    is_visible: Boolean(row.is_visible),
  };
}

function normalizeBlock(row) {
  if (!row) return null;

  return {
    ...row,
    content_json: toJsonValue(row.content_json, {}),
    style_json: toJsonValue(row.style_json, {}),
    settings_json: toJsonValue(row.settings_json, {}),
    is_visible: Boolean(row.is_visible),
  };
}

class BuilderService {
  async logAction({ actorUserId, targetType, targetId, action, metadata }) {
    await models.auditLogs.insert({
      actor_user_id: actorUserId,
      target_type: targetType,
      target_id: targetId,
      action,
      metadata_json: metadata || {},
    });
  }

  async listPages(blogId) {
    const [rows] = await models.builder.findPagesByBlogId(Number(blogId));
    return rows.map(normalizePage);
  }

  async getPage(blogId, pageId) {
    const [pageRows] = await models.builder.findPageById(Number(blogId), Number(pageId));
    const page = normalizePage(pageRows[0]);

    if (!page) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    const [sectionRows] = await models.builder.findSectionsByPageId(page.id);
    const [blockRows] = await models.builder.findBlocksByPageId(page.id);
    const blocksBySection = blockRows.map(normalizeBlock).reduce((map, block) => {
      map.set(block.section_id, [...(map.get(block.section_id) || []), block]);
      return map;
    }, new Map());

    return {
      ...page,
      sections: sectionRows.map(normalizeSection).map((section) => ({
        ...section,
        blocks: blocksBySection.get(section.id) || [],
      })),
    };
  }

  async createPage(blogId, userId, payload) {
    const title = payload.title?.trim();

    if (!title) {
      throw createHttpError(400, "Le titre de la page est obligatoire.");
    }

    const type = payload.type || "page";
    const status = payload.status || "draft";

    if (!isAllowed(type, BUILDER_PAGE_TYPES)) {
      throw createHttpError(400, "Type de page builder invalide.");
    }

    if (!isAllowed(status, BUILDER_PAGE_STATUSES)) {
      throw createHttpError(400, "Statut de page builder invalide.");
    }

    const page = {
      blog_id: Number(blogId),
      owner_id: userId,
      title,
      slug: normalizeSlug(payload.slug, title),
      type,
      status,
      seo_title: payload.seo_title,
      seo_description: payload.seo_description,
      layout_json: assertSafeJson(payload.layout_json, "layout_json"),
    };

    if (!page.slug) {
      throw createHttpError(400, "Le slug de la page est invalide.");
    }

    const [result] = await models.builder.createPage(page);
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: result.insertId,
      action: "builder.page_created",
      metadata: { blogId: Number(blogId), slug: page.slug },
    });

    return this.getPage(blogId, result.insertId);
  }

  async updatePage(blogId, pageId, userId, payload) {
    const [rows] = await models.builder.findPageById(Number(blogId), Number(pageId));
    const current = normalizePage(rows[0]);

    if (!current) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    const nextStatus = payload.status || current.status;
    const nextType = payload.type || current.type;

    if (!isAllowed(nextType, BUILDER_PAGE_TYPES)) {
      throw createHttpError(400, "Type de page builder invalide.");
    }

    if (!isAllowed(nextStatus, BUILDER_PAGE_STATUSES)) {
      throw createHttpError(400, "Statut de page builder invalide.");
    }

    const nextPage = {
      ...current,
      title: payload.title?.trim() || current.title,
      slug: normalizeSlug(payload.slug || current.slug, current.title),
      type: nextType,
      status: nextStatus,
      seo_title: payload.seo_title ?? current.seo_title,
      seo_description: payload.seo_description ?? current.seo_description,
      layout_json: payload.layout_json ? assertSafeJson(payload.layout_json, "layout_json") : current.layout_json,
    };

    if (!nextPage.slug) {
      throw createHttpError(400, "Le slug de la page est invalide.");
    }

    await models.builder.updatePage(nextPage);
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_updated",
      metadata: { blogId: Number(blogId) },
    });

    return this.getPage(blogId, pageId);
  }

  async archivePage(blogId, pageId, userId) {
    const [result] = await models.builder.archivePage(Number(blogId), Number(pageId));

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_deleted",
      metadata: { blogId: Number(blogId), mode: "archived" },
    });
  }

  validateSectionPayload(payload, current = {}) {
    const sectionType = payload.section_type || payload.sectionType || current.section_type || "content";

    if (!isAllowed(sectionType, BUILDER_SECTION_TYPES)) {
      throw createHttpError(400, "Type de section invalide.");
    }

    return {
      parent_section_id: payload.parent_section_id ?? current.parent_section_id ?? null,
      section_type: sectionType,
      name: payload.name ?? current.name ?? null,
      sort_order: Number(payload.sort_order ?? current.sort_order ?? 0),
      grid_config: assertSafeJson(payload.grid_config ?? current.grid_config ?? {}, "grid_config"),
      style_json: sanitizeStyleJson(assertSafeJson(payload.style_json ?? current.style_json ?? {}, "style_json")),
      settings_json: assertSafeJson(payload.settings_json ?? current.settings_json ?? {}, "settings_json"),
      is_visible: payload.is_visible ?? current.is_visible ?? true,
    };
  }

  async createSection(blogId, pageId, userId, payload) {
    await this.getPage(blogId, pageId);
    const section = this.validateSectionPayload(payload);
    const [result] = await models.builder.createSection({ ...section, page_id: Number(pageId) });

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: result.insertId,
      action: "builder.section_created",
      metadata: { blogId: Number(blogId), pageId: Number(pageId) },
    });

    const [rows] = await models.builder.findSectionById(Number(blogId), Number(pageId), result.insertId);
    return normalizeSection(rows[0]);
  }

  async updateSection(blogId, pageId, sectionId, userId, payload) {
    const [rows] = await models.builder.findSectionById(Number(blogId), Number(pageId), Number(sectionId));
    const current = normalizeSection(rows[0]);

    if (!current) {
      throw createHttpError(404, "Section builder introuvable.");
    }

    const section = this.validateSectionPayload(payload, current);
    await models.builder.updateSection({ ...section, id: Number(sectionId) });

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: Number(sectionId),
      action: "builder.section_updated",
      metadata: { blogId: Number(blogId), pageId: Number(pageId) },
    });

    const [updatedRows] = await models.builder.findSectionById(Number(blogId), Number(pageId), Number(sectionId));
    return normalizeSection(updatedRows[0]);
  }

  async deleteSection(blogId, pageId, sectionId, userId) {
    const [rows] = await models.builder.findSectionById(Number(blogId), Number(pageId), Number(sectionId));
    if (!rows[0]) {
      throw createHttpError(404, "Section builder introuvable.");
    }

    await models.builder.deleteSection(Number(sectionId));
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: Number(sectionId),
      action: "builder.section_deleted",
      metadata: { blogId: Number(blogId), pageId: Number(pageId) },
    });
  }

  validateBlockPayload(payload, current = {}) {
    const blockType = payload.block_type || payload.blockType || current.block_type || "paragraph";

    if (!isAllowed(blockType, BUILDER_BLOCK_TYPES)) {
      throw createHttpError(400, "Type de bloc invalide.");
    }

    const contentJson = assertSafeJson(payload.content_json ?? current.content_json ?? {}, "content_json");

    if (blockType === "heading" && contentJson.level && !isAllowed(contentJson.level, BUILDER_HEADING_LEVELS)) {
      throw createHttpError(400, "Niveau de titre invalide.");
    }

    return {
      parent_block_id: payload.parent_block_id ?? current.parent_block_id ?? null,
      block_type: blockType,
      name: payload.name ?? current.name ?? null,
      content_json: contentJson,
      style_json: sanitizeStyleJson(assertSafeJson(payload.style_json ?? current.style_json ?? {}, "style_json")),
      settings_json: assertSafeJson(payload.settings_json ?? current.settings_json ?? {}, "settings_json"),
      sort_order: Number(payload.sort_order ?? current.sort_order ?? 0),
      is_visible: payload.is_visible ?? current.is_visible ?? true,
    };
  }

  async createBlock(blogId, sectionId, userId, payload) {
    const [sectionRows] = await models.builder.findSectionByBlog(Number(sectionId), Number(blogId));
    if (!sectionRows[0]) {
      throw createHttpError(404, "Section builder introuvable pour ce blog.");
    }

    const block = this.validateBlockPayload(payload);
    const [result] = await models.builder.createBlock({ ...block, section_id: Number(sectionId) });

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_block",
      targetId: result.insertId,
      action: "builder.block_created",
      metadata: { blogId: Number(blogId), sectionId: Number(sectionId) },
    });

    const [rows] = await models.builder.findBlockById(Number(blogId), result.insertId);
    return normalizeBlock(rows[0]);
  }

  async updateBlock(blogId, blockId, userId, payload) {
    const [rows] = await models.builder.findBlockById(Number(blogId), Number(blockId));
    const current = normalizeBlock(rows[0]);

    if (!current) {
      throw createHttpError(404, "Bloc builder introuvable.");
    }

    const block = this.validateBlockPayload(payload, current);
    await models.builder.updateBlock({ ...block, id: Number(blockId) });

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_block",
      targetId: Number(blockId),
      action: "builder.block_updated",
      metadata: { blogId: Number(blogId) },
    });

    const [updatedRows] = await models.builder.findBlockById(Number(blogId), Number(blockId));
    return normalizeBlock(updatedRows[0]);
  }

  async deleteBlock(blogId, blockId, userId) {
    const [rows] = await models.builder.findBlockById(Number(blogId), Number(blockId));
    if (!rows[0]) {
      throw createHttpError(404, "Bloc builder introuvable.");
    }

    await models.builder.deleteBlock(Number(blockId));
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_block",
      targetId: Number(blockId),
      action: "builder.block_deleted",
      metadata: { blogId: Number(blogId) },
    });
  }

  async reorderSections(blogId, pageId, userId, items = []) {
    await this.getPage(blogId, pageId);

    if (!Array.isArray(items)) {
      throw createHttpError(400, "La liste de réordonnancement des sections est invalide.");
    }

    await models.builder.reorderSections(items.map((item) => ({ id: Number(item.id), sort_order: Number(item.sort_order) })));
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.sections_reordered",
      metadata: { blogId: Number(blogId), count: items.length },
    });

    return this.getPage(blogId, pageId);
  }

  async reorderBlocks(blogId, sectionId, userId, items = []) {
    const [sectionRows] = await models.builder.findSectionByBlog(Number(sectionId), Number(blogId));
    if (!sectionRows[0]) {
      throw createHttpError(404, "Section builder introuvable pour ce blog.");
    }

    if (!Array.isArray(items)) {
      throw createHttpError(400, "La liste de réordonnancement des blocs est invalide.");
    }

    await models.builder.reorderBlocks(items.map((item) => ({ id: Number(item.id), sort_order: Number(item.sort_order) })));
    await this.logAction({
      actorUserId: userId,
      targetType: "builder_section",
      targetId: Number(sectionId),
      action: "builder.blocks_reordered",
      metadata: { blogId: Number(blogId), count: items.length },
    });

    const [blocks] = await models.builder.findBlocksBySectionId(Number(sectionId));
    return blocks.map(normalizeBlock);
  }

  async saveLayout(blogId, pageId, userId, layoutJson) {
    const safeLayout = assertSafeJson(layoutJson, "layout_json");
    const [result] = await models.builder.saveLayout(Number(blogId), Number(pageId), safeLayout);

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.layout_saved",
      metadata: { blogId: Number(blogId) },
    });

    return this.getPage(blogId, pageId);
  }

  async publishPage(blogId, pageId, userId) {
    const [result] = await models.builder.updatePageStatus(Number(blogId), Number(pageId), "published", new Date());

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_published",
      metadata: { blogId: Number(blogId) },
    });

    return this.getPage(blogId, pageId);
  }

  async unpublishPage(blogId, pageId, userId) {
    const [result] = await models.builder.updatePageStatus(Number(blogId), Number(pageId), "draft");

    if (result.affectedRows === 0) {
      throw createHttpError(404, "Page builder introuvable.");
    }

    await this.logAction({
      actorUserId: userId,
      targetType: "builder_page",
      targetId: Number(pageId),
      action: "builder.page_unpublished",
      metadata: { blogId: Number(blogId) },
    });

    return this.getPage(blogId, pageId);
  }

  async uploadMedia(blogId, userId, file, payload) {
    if (!file) {
      throw createHttpError(400, "Le fichier image est obligatoire.");
    }

    const usageType = payload.usageType || payload.usage_type || "content";
    if (!isAllowed(usageType, BUILDER_MEDIA_USAGE_TYPES)) {
      throw createHttpError(400, "Usage média invalide.");
    }

    if (file.mimetype === "image/svg+xml") {
      const absolutePath = file.path;
      const svg = await fs.readFile(absolutePath, "utf8");
      if (/<script|javascript:|onload\s*=|onerror\s*=/i.test(svg)) {
        await fs.unlink(absolutePath).catch(() => {});
        throw createHttpError(400, "SVG refusé : contenu potentiellement dangereux.");
      }
    }

    const relativeUrl = `/uploads/blogs/${Number(blogId)}/builder/${path.basename(file.filename)}`;
    const media = {
      blog_id: Number(blogId),
      uploader_id: userId,
      file_path: relativeUrl,
      file_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      alt_text: payload.altText || payload.alt_text || "",
      metadata_json: JSON.stringify({
        source: "builder",
        usage_type: usageType,
      }),
    };

    const [result] = await models.media.insert(media);
    await this.logAction({
      actorUserId: userId,
      targetType: "media",
      targetId: result.insertId,
      action: "builder.media_uploaded",
      metadata: { blogId: Number(blogId), usageType, fileName: file.originalname },
    });

    return {
      id: result.insertId,
      url: relativeUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      usageType,
      altText: media.alt_text,
    };
  }
}

module.exports = new BuilderService();
