// Routeur Express dédié à la gestion administrative des utilisateurs
// Toutes les routes de ce fichier sont réservées aux super-administrateurs
// Opérations disponibles : liste, options de filtre, mise à jour en masse, rôle, statut
const express = require("express");

// Importation du contrôleur qui contient toute la logique métier d'administration des utilisateurs
const adminUsersController = require("../controllers/adminUsersController");

// protect : middleware d'authentification qui vérifie et décode le JWT, attache req.user à la requête
const { protect } = require("../middlewares/auth");

// requireSuperAdmin : middleware de restriction qui bloque l'accès si l'utilisateur n'est pas super-admin
const requireSuperAdmin = require("../middlewares/requireSuperAdmin");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

/*
 * Application globale des middlewares sur toutes les routes du routeur.
 * - protect          : vérifie que l'utilisateur est authentifié (token JWT valide)
 * - requireSuperAdmin : vérifie que l'utilisateur possède le rôle super-admin
 * Ces deux middlewares s'exécutent AVANT le handler de chaque route déclarée ci-dessous.
 */
router.use(protect, requireSuperAdmin);

// GET /admin/users/
// Retourne la liste paginée et filtrée de tous les utilisateurs pour le panneau admin
// Handler : adminUsersController.browse(req, res)
router.get("/", adminUsersController.browse);

// GET /admin/users/filter-options
// Retourne les valeurs disponibles pour les filtres (rôles, statuts, etc.)
// Utilisé par l'interface admin pour pré-remplir les listes déroulantes de filtres
router.get("/filter-options", adminUsersController.filterOptions);

// PATCH /admin/users/bulk-update
// Applique des modifications en masse sur un ensemble d'utilisateurs sélectionnés
// Corps de la requête attendu : { ids: [userId1, userId2, ...], updates: { ... } }
router.patch("/bulk-update", adminUsersController.bulkUpdate);

// PATCH /admin/users/:userId/role
// Met à jour le rôle global d'un utilisateur spécifique
// Paramètre URL  : :userId  -> identifiant de l'utilisateur cible
// Corps attendu  : { role: 'admin' | 'editor' | 'user' | ... }
router.patch("/:userId/role", adminUsersController.updateRole);

// PATCH /admin/users/:userId/status
// Met à jour le statut d'un compte utilisateur (actif, suspendu, banni, etc.)
// Paramètre URL  : :userId  -> identifiant de l'utilisateur cible
// Corps attendu  : { status: 'active' | 'suspended' | 'banned' | ... }
router.patch("/:userId/status", adminUsersController.updateStatus);

// Export du routeur pour enregistrement dans le routeur principal (router.js)
module.exports = router;
