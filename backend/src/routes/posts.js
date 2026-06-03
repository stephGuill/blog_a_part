// Routeur Express pour la gestion des articles (posts) de blog
// - La liste est publique (aucune authentification requise)
// - La lecture, création, modification et suppression requièrent authentification + permission
// Opérations : GET liste, GET détail, POST création, PUT mise à jour, DELETE suppression
const express = require("express");

// Contrôleur contenant la logique CRUD pour les articles
const postsController = require("../controllers/postsController");

// protect : middleware d'authentification (vérifie le JWT, attache req.user)
const { protect } = require("../middlewares/auth");

// requireBlogPermission : factory de middleware vérifiant une permission sur le blog associé
const requireBlogPermission = require("../middlewares/requireBlogPermission");

// PERMISSIONS : constantes d'énumération de toutes les permissions de l'application
const { PERMISSIONS } = require("../utils/permissions");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /posts/
// Retourne la liste publique des articles (paginée, filtrée selon les query params)
// Route publique : aucune authentification requise (les posts publiés sont visibles par tous)
router.get("/", postsController.browse);

// GET /posts/:id
// Retourne le détail complet d'un article identifié par :id
// - protect                             : requiert une connexion
// - requireBlogPermission(POST_READ)    : vérifie que l'utilisateur a le droit de lire ce post
// Paramètre URL :id -> identifiant unique de l'article
router.get("/:id", protect, requireBlogPermission(PERMISSIONS.POST_READ), postsController.read);

// PUT /posts/:id
// Met à jour le contenu ou le statut d'un article existant
// - protect                              : requiert une connexion
// - requireBlogPermission(POST_UPDATE)   : vérifie le droit de modification
// Paramètre URL :id -> identifiant de l'article à modifier
// Corps attendu : les champs à mettre à jour (titre, contenu, statut, etc.)
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.POST_UPDATE), postsController.edit);

// POST /posts/
// Crée un nouvel article dans un blog
// - protect                              : requiert une connexion (l'auteur est req.user)
// - requireBlogPermission(POST_CREATE)   : vérifie que l'utilisateur peut créer des posts
// Corps attendu : { blogId, title, content, status, ... }
router.post("/", protect, requireBlogPermission(PERMISSIONS.POST_CREATE), postsController.add);

// DELETE /posts/:id
// Supprime définitivement un article identifié par :id
// - protect                              : requiert une connexion
// - requireBlogPermission(POST_DELETE)   : vérifie le droit de suppression
// Paramètre URL :id -> identifiant de l'article à supprimer
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.POST_DELETE), postsController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
