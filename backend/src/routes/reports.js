// Routeur Express pour la gestion des signalements (reports)
// - La création d'un signalement est accessible à tout utilisateur authentifié
// - La lecture et la modération des signalements nécessitent des permissions spécifiques au blog
// Opérations : POST création, GET liste par blog, PUT modération
const express = require("express");

// Contrôleur contenant la logique de gestion des signalements
const reportsController = require("../controllers/reportsController");

// protect : middleware d'authentification JWT
const { protect } = require("../middlewares/auth");

// requireBlogPermission : factory de middleware vérifiant une permission sur le blog cible
const requireBlogPermission = require("../middlewares/requireBlogPermission");

// PERMISSIONS : constantes d'énumération des permissions de l'application
const { PERMISSIONS } = require("../utils/permissions");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// POST /reports/
// Crée un nouveau signalement (report) sur un contenu (post, commentaire, etc.)
// - protect : requiert une connexion (seuls les utilisateurs authentifiés peuvent signaler)
// Corps attendu : { targetType: 'post'|'comment', targetId: ..., reason: '...', ... }
router.post("/", protect, reportsController.add);

// GET /reports/blog/:blogId
// Retourne la liste des signalements pour un blog spécifique identifié par :blogId
// - protect                              : requiert une connexion
// - requireBlogPermission(REPORT_READ)   : vérifie que l'utilisateur peut lire les signalements du blog
// Paramètre URL :blogId -> identifiant du blog dont on veut voir les signalements
router.get("/blog/:blogId", protect, requireBlogPermission(PERMISSIONS.REPORT_READ), reportsController.browse);

// PUT /reports/:id
// Modère un signalement (accepté, rejeté, traité, etc.)
// - protect                                : requiert une connexion
// - requireBlogPermission(REPORT_MANAGE)   : vérifie le droit de gestion des signalements
// Paramètre URL :id -> identifiant du signalement à modérer
// Corps attendu : { status: 'resolved' | 'dismissed' | ..., note: '...' }
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.REPORT_MANAGE), reportsController.moderate);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
