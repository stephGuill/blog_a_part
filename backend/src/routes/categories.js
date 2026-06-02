const express = require("express");

const categoriesController = require("../controllers/categoriesController");

const router = express.Router();

router.get("/", categoriesController.browse);
router.get("/:id", categoriesController.read);
router.post("/", categoriesController.add);
router.put("/:id", categoriesController.edit);
router.delete("/:id", categoriesController.destroy);

module.exports = router;
