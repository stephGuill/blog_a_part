const express = require("express");

const builderController = require("../controllers/builderController");
const { protect } = require("../middlewares/auth");
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { uploadBuilderImage } = require("../middlewares/upload");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router();

const uploadBuilderSingle = (req, res, next) => {
  uploadBuilderImage.single("file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    return res.status(400).json({
      status: "fail",
      message: error.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux : 2 Mo maximum." : error.message,
    });
  });
};

router.use(protect);

router.get("/:blogId/pages", requireBlogPermission(PERMISSIONS.BUILDER_READ), builderController.listPages);
router.post("/:blogId/pages", requireBlogPermission(PERMISSIONS.BUILDER_CREATE), builderController.createPage);
router.get("/:blogId/pages/:pageId", requireBlogPermission(PERMISSIONS.BUILDER_READ), builderController.getPage);
router.patch("/:blogId/pages/:pageId", requireBlogPermission(PERMISSIONS.BUILDER_UPDATE), builderController.updatePage);
router.delete("/:blogId/pages/:pageId", requireBlogPermission(PERMISSIONS.BUILDER_DELETE), builderController.deletePage);

router.post(
  "/:blogId/pages/:pageId/sections",
  requireBlogPermission(PERMISSIONS.BUILDER_CREATE),
  builderController.createSection
);
router.patch(
  "/:blogId/pages/:pageId/sections/reorder",
  requireBlogPermission(PERMISSIONS.BUILDER_UPDATE),
  builderController.reorderSections
);
router.patch(
  "/:blogId/pages/:pageId/sections/:sectionId",
  requireBlogPermission(PERMISSIONS.BUILDER_UPDATE),
  builderController.updateSection
);
router.delete(
  "/:blogId/pages/:pageId/sections/:sectionId",
  requireBlogPermission(PERMISSIONS.BUILDER_DELETE),
  builderController.deleteSection
);

router.post(
  "/:blogId/sections/:sectionId/blocks",
  requireBlogPermission(PERMISSIONS.BUILDER_CREATE),
  builderController.createBlock
);
router.patch(
  "/:blogId/sections/:sectionId/blocks/reorder",
  requireBlogPermission(PERMISSIONS.BUILDER_UPDATE),
  builderController.reorderBlocks
);
router.patch("/:blogId/blocks/:blockId", requireBlogPermission(PERMISSIONS.BUILDER_UPDATE), builderController.updateBlock);
router.delete("/:blogId/blocks/:blockId", requireBlogPermission(PERMISSIONS.BUILDER_DELETE), builderController.deleteBlock);

router.put("/:blogId/pages/:pageId/layout", requireBlogPermission(PERMISSIONS.BUILDER_UPDATE), builderController.saveLayout);
router.patch("/:blogId/pages/:pageId/publish", requireBlogPermission(PERMISSIONS.BUILDER_PUBLISH), builderController.publishPage);
router.patch("/:blogId/pages/:pageId/unpublish", requireBlogPermission(PERMISSIONS.BUILDER_PUBLISH), builderController.unpublishPage);

router.post(
  "/:blogId/media",
  requireBlogPermission(PERMISSIONS.BUILDER_UPLOAD_MEDIA),
  uploadBuilderSingle,
  builderController.uploadMedia
);

module.exports = router;
