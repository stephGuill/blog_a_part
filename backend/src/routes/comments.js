const express = require("express");

const commentsController = require("../controllers/commentsController");
const { protect } = require("../middlewares/auth");
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router();

router.get("/", protect, commentsController.browse);
router.get("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_READ), commentsController.read);
router.post("/", commentsController.add);
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_MODERATE), commentsController.edit);
router.put("/:id/moderate", protect, requireBlogPermission(PERMISSIONS.COMMENT_MODERATE), commentsController.edit);
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_DELETE), commentsController.destroy);

module.exports = router;
