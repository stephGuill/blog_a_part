const express = require("express");
const themesController = require("../controllers/themesController");
const { protect, restrictTo } = require("../middlewares/auth");

const router = express.Router();

router.get("/", themesController.browse);
router.get("/:id", themesController.read);
router.put("/:id", protect, restrictTo("admin"), themesController.edit);
router.post("/", protect, restrictTo("admin"), themesController.add);
router.delete("/:id", protect, restrictTo("admin"), themesController.destroy);

module.exports = router;
