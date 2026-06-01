const express = require("express");

const adminUsersController = require("../controllers/adminUsersController");
const { protect } = require("../middlewares/auth");
const requireSuperAdmin = require("../middlewares/requireSuperAdmin");

const router = express.Router();

// FR: Toutes les routes admin users exigent une session valide et un role global admin.
// EN: All admin users routes require a valid session and a global admin role.
router.use(protect, requireSuperAdmin);

router.get("/", adminUsersController.browse);
router.get("/filter-options", adminUsersController.filterOptions);
router.patch("/bulk-update", adminUsersController.bulkUpdate);
router.patch("/:userId/role", adminUsersController.updateRole);
router.patch("/:userId/status", adminUsersController.updateStatus);

module.exports = router;
