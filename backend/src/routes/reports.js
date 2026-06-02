const express = require("express");

const reportsController = require("../controllers/reportsController");
const { protect } = require("../middlewares/auth");
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router();

router.post("/", protect, reportsController.add);
router.get("/blog/:blogId", protect, requireBlogPermission(PERMISSIONS.REPORT_READ), reportsController.browse);
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.REPORT_MANAGE), reportsController.moderate);

module.exports = router;
