// Routeur Express pour les statistiques du tableau de bord
// Chaque route correspond à une vue de statistiques adaptée à un rôle d'utilisateur
// protect    : vérifie l'authentification (JWT valide)
// restrictTo : restreint l'accès aux rôles passés en paramètre
const express = require("express");

// Contrôleur contenant la logique de calcul et de récupération des statistiques
const dashboardController = require("../controllers/dashboardController");

// protect    : middleware qui vérifie et décode le JWT, attache req.user
// restrictTo : factory de middleware qui vérifie que req.user.role est dans la liste autorisée
const { protect, restrictTo } = require("../middlewares/auth");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /dashboard/admin
// Retourne les statistiques globales réservées aux administrateurs
// - protect           : l'utilisateur doit être authentifié
// - restrictTo("admin") : accès réservé uniquement au rôle 'admin'
router.get("/admin", protect, restrictTo("admin"), dashboardController.adminStats);

// GET /dashboard/owner
// Retourne les statistiques pour les propriétaires de blog (et les admins)
// - protect                       : l'utilisateur doit être authentifié
// - restrictTo("admin", "owner")  : accès aux rôles 'admin' et 'owner'
router.get("/owner", protect, restrictTo("admin", "owner"), dashboardController.ownerStats);

// GET /dashboard/editor
// Retourne les statistiques pour les éditeurs de contenu (et les admins)
// - protect                        : l'utilisateur doit être authentifié
// - restrictTo("admin", "editor")  : accès aux rôles 'admin' et 'editor'
router.get("/editor", protect, restrictTo("admin", "editor"), dashboardController.editorStats);

// GET /dashboard/moderator
// Retourne les statistiques pour les modérateurs de contenu (et les admins)
// - protect                           : l'utilisateur doit être authentifié
// - restrictTo("admin", "moderator")  : accès aux rôles 'admin' et 'moderator'
router.get("/moderator", protect, restrictTo("admin", "moderator"), dashboardController.moderatorStats);

// GET /dashboard/user
// Retourne les statistiques pour un utilisateur standard
// - protect : seule l'authentification est requise, aucune restriction de rôle supplémentaire
router.get("/user", protect, dashboardController.userStats);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
