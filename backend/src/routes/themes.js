// Routeur Express pour la gestion des thèmes visuels de blog
// - La lecture des thèmes est publique (sans authentification)
// - La création, modification et suppression sont réservées aux administrateurs
// Opérations : GET liste, GET détail, POST création, PUT mise à jour, DELETE suppression
const express = require("express");

// Contrôleur contenant la logique CRUD pour les thèmes visuels
const themesController = require("../controllers/themesController");

// protect    : middleware d'authentification JWT (vérifie et décode le token)
// restrictTo : factory de middleware restreignant l'accès à des rôles spécifiques
const { protect, restrictTo } = require("../middlewares/auth");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /themes/
// Retourne la liste de tous les thèmes disponibles
// Route publique : aucune authentification requise (les thèmes sont visibles par tous)
router.get("/", themesController.browse);

// GET /themes/:id
// Retourne les détails d'un thème spécifique identifié par :id
// Route publique : aucune authentification requise
// Paramètre URL :id -> identifiant unique du thème
router.get("/:id", themesController.read);

// PUT /themes/:id
// Met à jour les paramètres d'un thème existant (couleurs, polices, CSS, etc.)
// - protect             : requiert une connexion (JWT valide)
// - restrictTo("admin") : réservé exclusivement au rôle 'admin'
// Paramètre URL :id -> identifiant du thème à modifier
router.put("/:id", protect, restrictTo("admin"), themesController.edit);

// POST /themes/
// Crée un nouveau thème visuel pour les blogs
// - protect             : requiert une connexion
// - restrictTo("admin") : réservé exclusivement au rôle 'admin'
// Corps attendu : { name, description, config: { ... }, ... }
router.post("/", protect, restrictTo("admin"), themesController.add);

// DELETE /themes/:id
// Supprime définitivement un thème identifié par :id
// - protect             : requiert une connexion
// - restrictTo("admin") : réservé exclusivement au rôle 'admin'
// Paramètre URL :id -> identifiant du thème à supprimer
router.delete("/:id", protect, restrictTo("admin"), themesController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
