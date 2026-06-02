// Router: Admin users (super-admin only)
// - All routes require authentication and a global super-admin role.
// - Delegates behaviour to `adminUsersController` which calls AdminUsersService.
// Exposed routes: GET /, GET /filter-options, PATCH /bulk-update, PATCH /:userId/role, PATCH /:userId/status
const express = require("express");

// Controller qui contient la logique métier pour les opérations administratives
const adminUsersController = require("../controllers/adminUsersController");
// Middleware d'authentification qui vérifie la présence d'un JWT/session valide
const { protect } = require("../middlewares/auth");
// Middleware qui restreint l'accès aux administrateurs globaux (super admin)
const requireSuperAdmin = require("../middlewares/requireSuperAdmin");

// Crée un routeur dédié aux routes d'administration utilisateurs
const router = express.Router();

// Attention : toutes les routes définies dans ce routeur nécessitent
// 1) d'être authentifié (`protect`) et
// 2) d'avoir le rôle global de super-admin (`requireSuperAdmin`).
// On applique ces middlewares au routeur entier pour éviter la répétition.
router.use(protect, requireSuperAdmin);

// GET /admin/users/ -> liste paginée des utilisateurs pour l'interface admin
// Délègue la logique à `adminUsersController.browse(req, res)`.
router.get("/", adminUsersController.browse);

// GET /admin/users/filter-options -> retourne les options de filtrage (roles, statuts, etc.)
router.get("/filter-options", adminUsersController.filterOptions);

// PATCH /admin/users/bulk-update -> mise à jour en masse (ex: activation, rôle)
// Corps attendu : { ids: [...], updates: { status/role/... } }
router.patch("/bulk-update", adminUsersController.bulkUpdate);

// PATCH /admin/users/:userId/role -> met à jour le rôle d'un utilisateur
// Paramètre URL : userId
// Corps attendu : { role: 'admin' | 'user' | ... }
router.patch("/:userId/role", adminUsersController.updateRole);

// PATCH /admin/users/:userId/status -> met à jour le statut (active/suspended/...)
// Paramètre URL : userId
// Corps attendu : { status: 'active' | 'suspended' | ... }
router.patch("/:userId/status", adminUsersController.updateStatus);

module.exports = router;
