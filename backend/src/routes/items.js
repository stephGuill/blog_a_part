const express = require("express");
const itemsController = require("../controllers/itemsController");

const router = express.Router();

router.get("/", itemsController.browse);
router.get("/:id", itemsController.read);
router.put("/:id", itemsController.edit);
router.post("/", itemsController.add);
router.delete("/:id", itemsController.destroy);

module.exports = router;
