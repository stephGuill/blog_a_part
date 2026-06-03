// Routeur Express pour la gestion des blogs
// Opérations disponibles : liste, lecture, création, modification, suppression
// Certaines routes acceptent les utilisateurs non connectés (optionalProtect)
const express = require('express');

// Contrôleur contenant la logique CRUD pour les blogs
const blogsController = require('../controllers/blogsController');

// optionalProtect : attache req.user si un JWT est présent, sans bloquer si absent
// protect         : exige un JWT valide, bloque avec 401 si absent
const { optionalProtect, protect } = require("../middlewares/auth");

// requireBlogPermission : factory de middleware vérifiant une permission sur le blog ciblé
const requireBlogPermission = require("../middlewares/requireBlogPermission");

// PERMISSIONS : constantes d'énumération de toutes les permissions de l'application
const { PERMISSIONS } = require("../utils/permissions");

// Création du routeur Express standard (sans mergeParams)
const router = express.Router();

// GET /blogs/
// Retourne la liste paginée des blogs accessibles
// - optionalProtect : si un JWT est présent, req.user est peup lé (utile pour les blogs privés)
// - blogsController.browse : handler qui applique les filtres et retourne la liste
router.get("/", optionalProtect, blogsController.browse); // GET /blogs

// GET /blogs/:id
// Retourne les détails d'un blog spécifique identifié par :id
// - optionalProtect : l'utilisateur connecté peut voir des contenus supplémentaires (brouillons, etc.)
// - blogsController.read : récupère et retourne le blog par son identifiant
router.get("/:id", optionalProtect, blogsController.read); // GET /blogs/:id

// PUT /blogs/:id
// Met à jour les informations d'un blog existant (nom, description, thème, etc.)
// - protect                               : exige une connexion
// - requireBlogPermission(BLOG_UPDATE)    : vérifie que l'utilisateur a le droit de modifier ce blog
// - blogsController.edit                  : applique la mise à jour en base de données
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.BLOG_UPDATE), blogsController.edit); // PUT /blogs/:id

// POST /blogs/
// Crée un nouveau blog pour l'utilisateur authentifié
// - protect          : exige une connexion (le créateur devient owner du blog)
// - blogsController.add : insère le nouveau blog en base de données
router.post("/", protect, blogsController.add); // POST /blogs

// DELETE /blogs/:id
// Supprime un blog et toutes ses données associées (posts, membres, pages builder, etc.)
// - protect                               : exige une connexion
// - requireBlogPermission(BLOG_DELETE)    : vérifie que l'utilisateur est propriétaire ou admin
// - blogsController.destroy              : effectue la suppression en cascade
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.BLOG_DELETE), blogsController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;

