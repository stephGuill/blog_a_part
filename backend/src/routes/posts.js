const express = require("express");
const postsController = require("../controllers/postsController");
const { protect } = require("../middlewares/auth");
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router();

router.get("/", postsController.browse);
router.get("/:id", protect, requireBlogPermission(PERMISSIONS.POST_READ), postsController.read);
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.POST_UPDATE), postsController.edit);
router.post("/", protect, requireBlogPermission(PERMISSIONS.POST_CREATE), postsController.add);
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.POST_DELETE), postsController.destroy);

module.exports = router;
