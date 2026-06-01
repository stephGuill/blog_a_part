const express = require('express')

const mediaController = require("../controllers/mediaController");
const { protect, restrictTo } = require("../middlewares/auth");
const { uploadImage } = require("../middlewares/upload");


const router = express.Router();
// ====================
// ROUTES MEDIA
// ====================
router.get("/", protect, restrictTo("admin", "owner", "editor"), mediaController.browse); // GET /media
router.get("/:id", protect, restrictTo("admin", "owner", "editor"), mediaController.read); // GET /media/:id
router.put("/:id", protect, restrictTo("admin", "owner"), mediaController.edit); // PUT /media/:id
router.post("/", protect, restrictTo("admin", "owner", "editor"), uploadImage.single("file"), mediaController.add); // POST /media
router.delete("/:id", protect, restrictTo("admin", "owner"), mediaController.destroy);


module.exports= router;
