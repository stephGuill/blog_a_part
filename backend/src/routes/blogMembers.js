// Routeur Express pour la gestion des membres d'un blog
// Utilise mergeParams: true pour accéder au paramètre :blogId défini dans le routeur parent
// Toutes les routes nécessitent : authentification + permission BLOG_MANAGE_MEMBERS
const express = require("express");

// Contrôleur gérant les opérations CRUD sur les membres d'un blog
const blogMembersController = require("../controllers/blogMembersController");

// protect : middleware qui vérifie le JWT et attache req.user à la requête
const { protect } = require("../middlewares/auth");

// requireBlogPermission : factory de middleware vérifiant une permission spécifique sur le blog
// Cherche le blog via req.params.blogId, vérifie que req.user a la permission demandée
const requireBlogPermission = require("../middlewares/requireBlogPermission");

// PERMISSIONS : constantes d'énumération des permissions disponibles dans l'application
const { PERMISSIONS } = require("../utils/permissions");

/*
 * mergeParams: true permet à ce routeur d'accéder aux paramètres de route du routeur parent.
 * Exemple : si monté sur /blogs/:blogId/members, req.params.blogId sera disponible ici.
 */
const router = express.Router({ mergeParams: true });

// GET /blogs/:blogId/members/
// Retourne la liste de tous les membres du blog spécifié par :blogId
// Middlewares en chaîne :
//   1. protect              -> vérifie que l'utilisateur est connecté (JWT valide)
//   2. requireBlogPermission -> vérifie que l'utilisateur a BLOG_MANAGE_MEMBERS sur ce blog
//   3. blogMembersController.browseByBlog -> handler qui récupère et retourne les membres
router.get("/", protect, requireBlogPermission(PERMISSIONS.BLOG_MANAGE_MEMBERS), blogMembersController.browseByBlog);

// POST /blogs/:blogId/members/
// Invite un nouvel utilisateur ou met à jour (upsert) un membre existant du blog
// Corps attendu : { userId: ..., role: 'editor' | 'moderator' | ... }
// Middlewares en chaîne :
//   1. protect              -> vérifie l'authentification
//   2. requireBlogPermission -> vérifie BLOG_MANAGE_MEMBERS
//   3. blogMembersController.inviteOrUpsert -> crée ou met à jour le membre
router.post("/", protect, requireBlogPermission(PERMISSIONS.BLOG_MANAGE_MEMBERS), blogMembersController.inviteOrUpsert);

// DELETE /blogs/:blogId/members/:userId
// Supprime un membre du blog identifié par :userId
// Paramètre URL :userId -> identifiant de l'utilisateur à retirer du blog
// Middlewares en chaîne :
//   1. protect              -> vérifie l'authentification
//   2. requireBlogPermission -> vérifie BLOG_MANAGE_MEMBERS
//   3. blogMembersController.remove -> supprime l'entrée membre en base de données
router.delete("/:userId", protect, requireBlogPermission(PERMISSIONS.BLOG_MANAGE_MEMBERS), blogMembersController.remove);

// Export du routeur pour montage dans le routeur principal (ex: /blogs/:blogId/members)
module.exports = router;
