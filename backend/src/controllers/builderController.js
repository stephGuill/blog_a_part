// builderController.js
// Contrôleur : routes pour le page builder (pages, sections, blocs)
// - Délègue à `BuilderService` la logique métier (création, modification,
//   réordonnancement, publication, upload de medias, etc.).
// - Gère la transformation des erreurs SQL/ER_DUP_ENTRY en réponses HTTP.
const builderService = require("../services/BuilderService");

// Helper local : formatte les erreurs retournées par le service
function sendError(res, error) {
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      status: "fail",
      message: "Ce slug existe déjà pour ce blog.",
    });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
    message: statusCode >= 500 ? "Erreur serveur builder." : error.message,
  });
}

const listPages = async (req, res) => {
  try {
    const pages = await builderService.listPages(req.params.blogId);
    return res.status(200).json({ success: true, data: pages });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const createPage = async (req, res) => {
  try {
    const page = await builderService.createPage(req.params.blogId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const getPage = async (req, res) => {
  try {
    const page = await builderService.getPage(req.params.blogId, req.params.pageId);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const updatePage = async (req, res) => {
  try {
    const page = await builderService.updatePage(req.params.blogId, req.params.pageId, req.user.id, req.body);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const deletePage = async (req, res) => {
  try {
    await builderService.archivePage(req.params.blogId, req.params.pageId, req.user.id);
    return res.status(200).json({ success: true, message: "Page builder archivée." });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const createSection = async (req, res) => {
  try {
    const section = await builderService.createSection(req.params.blogId, req.params.pageId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: section });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const updateSection = async (req, res) => {
  try {
    const section = await builderService.updateSection(
      req.params.blogId,
      req.params.pageId,
      req.params.sectionId,
      req.user.id,
      req.body
    );
    return res.status(200).json({ success: true, data: section });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const deleteSection = async (req, res) => {
  try {
    await builderService.deleteSection(req.params.blogId, req.params.pageId, req.params.sectionId, req.user.id);
    return res.status(200).json({ success: true, message: "Section builder supprimée." });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const reorderSections = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    const page = await builderService.reorderSections(req.params.blogId, req.params.pageId, req.user.id, items);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const createBlock = async (req, res) => {
  try {
    const block = await builderService.createBlock(req.params.blogId, req.params.sectionId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: block });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const updateBlock = async (req, res) => {
  try {
    const block = await builderService.updateBlock(req.params.blogId, req.params.blockId, req.user.id, req.body);
    return res.status(200).json({ success: true, data: block });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const deleteBlock = async (req, res) => {
  try {
    await builderService.deleteBlock(req.params.blogId, req.params.blockId, req.user.id);
    return res.status(200).json({ success: true, message: "Bloc builder supprimé." });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const reorderBlocks = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    const blocks = await builderService.reorderBlocks(req.params.blogId, req.params.sectionId, req.user.id, items);
    return res.status(200).json({ success: true, data: blocks });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const saveLayout = async (req, res) => {
  try {
    const layout = req.body.layout_json || req.body.layout || req.body;
    const page = await builderService.saveLayout(req.params.blogId, req.params.pageId, req.user.id, layout);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const publishPage = async (req, res) => {
  try {
    const page = await builderService.publishPage(req.params.blogId, req.params.pageId, req.user.id);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const unpublishPage = async (req, res) => {
  try {
    const page = await builderService.unpublishPage(req.params.blogId, req.params.pageId, req.user.id);
    return res.status(200).json({ success: true, data: page });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

const uploadMedia = async (req, res) => {
  try {
    const media = await builderService.uploadMedia(req.params.blogId, req.user.id, req.file, req.body);
    return res.status(201).json({
      success: true,
      message: "Fichier uploadé avec succès.",
      data: media,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

module.exports = {
  createBlock,
  createPage,
  createSection,
  deleteBlock,
  deletePage,
  deleteSection,
  getPage,
  listPages,
  publishPage,
  reorderBlocks,
  reorderSections,
  saveLayout,
  unpublishPage,
  updateBlock,
  updatePage,
  updateSection,
  uploadMedia,
};
