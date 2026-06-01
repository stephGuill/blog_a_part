const express = require("express");

const blogMembersController = require("../controllers/blogMembersController");
const { protect } = require("../middlewares/auth");
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router({ mergeParams: true });

router.get("/", protect, requireBlogPermission(PERMISSIONS.BLOG_MANAGE_MEMBERS), blogMembersController.browseByBlog);
router.post("/", protect, requireBlogPermission(PERMISSIONS.BLOG_MANAGE_MEMBERS), blogMembersController.inviteOrUpsert);
router.delete("/:userId", protect, requireBlogPermission(PERMISSIONS.BLOG_MANAGE_MEMBERS), blogMembersController.remove);

module.exports = router;
