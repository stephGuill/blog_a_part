// Routeur Express pour la gestion des utilisateurs (profils, avatars, administration)
// - Les routes de liste et suppression sont réservées aux administrateurs
// - Les routes de lecture/modification du profil sont accessibles à l'utilisateur lui-même ou à un admin
// - L'upload d'avatar utilise Multer via uploadImage
const express = require("express");

// Contrôleur contenant la logique CRUD pour les utilisateurs
const usersController = require("../controllers/usersController");

// protect    : middleware d'authentification JWT (vérifie et décode le token, attache req.user)
// restrictTo : factory de middleware restreignant l'accès à des rôles spécifiques
const { protect, restrictTo } = require("../middlewares/auth");

// isSelfOrAdmin : middleware qui autorise l'accès si req.user.id === :id OU si req.user est admin
const { isSelfOrAdmin } = require("../middlewares/permissions");

// uploadImage : wrapper Multer pour l'upload d'images (validation type MIME + taille)
const { uploadImage } = require("../middlewares/upload");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

// GET /users/
// Retourne la liste complète des utilisateurs
// - protect             : requiert une authentification
// - restrictTo("admin") : réservé exclusivement aux administrateurs
router.get("/", protect, restrictTo("admin"), usersController.browse);

// GET /users/:id
// Retourne le profil d'un utilisateur spécifique identifié par :id
// - protect         : requiert une authentification
// - isSelfOrAdmin   : autorise l'accès uniquement si req.user.id === :id ou si req.user est admin
// Paramètre URL :id -> identifiant de l'utilisateur cible
router.get("/:id", protect, isSelfOrAdmin, usersController.read);

// PUT /users/:id
// Met à jour le profil complet d'un utilisateur (nom, email, bio, etc.)
// - protect         : requiert une authentification
// - isSelfOrAdmin   : autorise uniquement l'utilisateur lui-même ou un admin
// Paramètre URL :id -> identifiant de l'utilisateur à modifier
// Corps attendu : { username, email, bio, ... }
router.put("/:id", protect, isSelfOrAdmin, usersController.edit);

// PATCH /users/:id/avatar
// Upload et mise à jour de l'avatar d'un utilisateur
// - protect                      : requiert une authentification
// - isSelfOrAdmin                : autorise uniquement l'utilisateur lui-même ou un admin
// - uploadImage.single("avatar") : traite le fichier dans le champ "avatar" (multipart/form-data)
//                                  expose req.file au controller si l'upload réussit
// Paramètre URL :id -> identifiant de l'utilisateur dont on met à jour l'avatar
router.patch("/:id/avatar", protect, isSelfOrAdmin, uploadImage.single("avatar"), usersController.uploadAvatar);

// PATCH /users/:id/active
// Active ou désactive un compte utilisateur (toggle)
// - protect             : requiert une authentification
// - restrictTo("admin") : réservé exclusivement aux administrateurs
// Paramètre URL :id -> identifiant de l'utilisateur dont on modifie le statut actif
router.patch("/:id/active", protect, restrictTo("admin"), usersController.toggleActive);

// POST /users/
// Crée un nouvel utilisateur (création administrative depuis le panneau admin)
// - protect             : requiert une authentification
// - restrictTo("admin") : réservé exclusivement aux administrateurs
// Corps attendu : { username, email, password, role, ... }
router.post("/", protect, restrictTo("admin"), usersController.add);

// DELETE /users/:id
// Supprime définitivement un compte utilisateur et toutes ses données associées
// - protect             : requiert une authentification
// - restrictTo("admin") : réservé exclusivement aux administrateurs
// Paramètre URL :id -> identifiant de l'utilisateur à supprimer
router.delete("/:id", protect, restrictTo("admin"), usersController.destroy);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
