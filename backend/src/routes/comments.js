// Routeur Express pour la gestion des commentaires
// - La création d'un commentaire est publique (pas d'authentification requise)
// - La lecture, modération et suppression nécessitent authentification + permission sur le blog
// Opérations disponibles : liste, lecture, création, mise à jour/modération, suppression
const express = require("express");

// Contrôleur contenant la logique CRUD et de modération des commentaires
const commentsController = require("../controllers/commentsController");

// protect : middleware qui vérifie le JWT et attache req.user à la requête
const { protect } = require("../middlewares/auth");

// requireBlogPermission : factory de middleware vérifiant une permission spécifique au blog
const requireBlogPermission = require("../middlewares/requireBlogPermission");

// PERMISSIONS : constantes d'énumération des permissions de l'application
const { PERMISSIONS } = require("../utils/permissions");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /comments/
// Retourne la liste des commentaires (filtrée selon le contexte de la requête)
// - protect : requiert une authentification pour accéder à la liste
router.get("/", protect, commentsController.browse);

// GET /comments/:id
// Retourne le détail d'un commentaire spécifique identifié par :id
// - protect                              : requiert une connexion
// - requireBlogPermission(COMMENT_READ)  : vérifie que l'utilisateur a le droit de lire les commentaires du blog
// Paramètre URL :id -> identifiant unique du commentaire
router.get("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_READ), commentsController.read);

// POST /comments/
// Crée un nouveau commentaire sur un post/blog
// Route publique : ne requiert pas d'authentification (commentaires anonymes possibles selon config)
// Corps attendu : { postId: ..., content: '...', authorName: '...', ... }
router.post("/", commentsController.add);

// PUT /comments/:id
// Met à jour le contenu d'un commentaire (utilisé pour la modération : approbation, rejet, édition)
// - protect                                 : requiert une connexion
// - requireBlogPermission(COMMENT_MODERATE) : seuls les modérateurs/admins du blog peuvent modifier
// Paramètre URL :id -> identifiant du commentaire à modifier
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_MODERATE), commentsController.edit);

// PUT /comments/:id/moderate
// Alias explicite de la route de modération ci-dessus
// Permet d'appeler /comments/:id/moderate pour clarifier l'intention de modération
// - protect                                 : requiert une connexion
// - requireBlogPermission(COMMENT_MODERATE) : vérifie les droits de modération
router.put("/:id/moderate", protect, requireBlogPermission(PERMISSIONS.COMMENT_MODERATE), commentsController.edit);

// DELETE /comments/:id
// Supprime définitivement un commentaire identifié par :id
// - protect                                : requiert une connexion
// - requireBlogPermission(COMMENT_DELETE)  : vérifie que l'utilisateur peut supprimer des commentaires
// Paramètre URL :id -> identifiant du commentaire à supprimer
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_DELETE), commentsController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
