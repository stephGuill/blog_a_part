const express = require("express");
const usersController = require("../controllers/usersController");
const { protect, restrictTo } = require("../middlewares/auth");
const { isSelfOrAdmin } = require("../middlewares/permissions");
const { uploadImage } = require("../middlewares/upload");

const router = express.Router();

router.get("/", protect, restrictTo("admin"), usersController.browse);
router.get("/:id", protect, isSelfOrAdmin, usersController.read);
router.put("/:id", protect, isSelfOrAdmin, usersController.edit);
router.patch("/:id/avatar", protect, isSelfOrAdmin, uploadImage.single("avatar"), usersController.uploadAvatar);
router.patch("/:id/active", protect, restrictTo("admin"), usersController.toggleActive);
router.post("/", protect, restrictTo("admin"), usersController.add);
router.delete("/:id", protect, restrictTo("admin"), usersController.destroy);

module.exports = router;
