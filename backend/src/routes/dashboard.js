const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const { protect, restrictTo } = require("../middlewares/auth");

const router = express.Router();

router.get("/admin", protect, restrictTo("admin"), dashboardController.adminStats);
router.get("/owner", protect, restrictTo("admin", "owner"), dashboardController.ownerStats);
router.get("/editor", protect, restrictTo("admin", "editor"), dashboardController.editorStats);
router.get("/moderator", protect, restrictTo("admin", "moderator"), dashboardController.moderatorStats);
router.get("/user", protect, dashboardController.userStats);

module.exports = router;
