// Routeur Express dédié à l'authentification des utilisateurs
// Gère : inscription, connexion, profil, double authentification (2FA) et OAuth (Google, Facebook, Apple)
// Les endpoints publics sont protégés contre les abus via le middleware authLimiter (rate-limiting)
const express = require("express");

// Contrôleur qui contient toute la logique d'authentification (signup, signin, 2FA, OAuth)
const authController = require("../controllers/authController");

// protect : middleware qui vérifie le JWT et attache req.user à la requête
const { protect } = require("../middlewares/auth");

// authLimiter : middleware de rate-limiting appliqué aux routes sensibles (login, signup)
// Empêche les attaques par force brute et les abus d'inscription répétés
const { authLimiter } = require("../middlewares/rateLimit");

// uploadAvatarImage : wrapper Multer configuré pour l'upload d'images d'avatar
// Valide le type MIME, la taille maximale et stocke le fichier temporairement
const { uploadAvatarImage } = require("../middlewares/upload");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

/*
 * Middleware intermédiaire pour l'upload d'avatar lors de l'inscription.
 * Exécute uploadAvatarImage.single("avatar") et intercepte toute erreur Multer.
 * - En cas d'erreur (type de fichier invalide, taille trop grande...) : répond HTTP 400
 * - En cas de succès : expose req.file et appelle next() pour passer au handler suivant
 */
function uploadAvatar(req, res, next) {
  // Traitement du champ "avatar" en upload de fichier unique via Multer
  uploadAvatarImage.single("avatar")(req, res, (error) => {
    // Si Multer lève une erreur, on renvoie immédiatement une réponse d'échec
    if (error) {
      return res.status(400).json({
        status: "fail",       // Indique un échec de validation
        message: error.message, // Message d'erreur issu de Multer
      });
    }
    // Aucune erreur : on passe au middleware/handler suivant dans la chaîne
    return next();
  });
}

// === Routes d'inscription ===
// POST /auth/signup  : inscription avec possibilité d'uploader un avatar
// - authLimiter      : limite le nombre de requêtes depuis une même IP
// - uploadAvatar     : traite le fichier avatar multipart/form-data
// - authController.signup : crée le compte en base de données
router.post("/signup", authLimiter, uploadAvatar, authController.signup);

// POST /auth/register : alias de /signup pour rétrocompatibilité avec d'anciens clients
router.post("/register", authLimiter, uploadAvatar, authController.signup);

// === Routes de connexion ===
// POST /auth/signin : connexion par email/mot de passe, retourne un JWT en cas de succès
// - authLimiter : protège contre les tentatives répétées (attaques par force brute)
router.post("/signin", authLimiter, authController.signin);

// POST /auth/login : alias de /signin pour rétrocompatibilité
router.post("/login", authLimiter, authController.signin);

// === Route du profil courant ===
// GET /auth/me : retourne les informations de l'utilisateur authentifié
// - protect : requiert un JWT valide dans les headers (Authorization: Bearer <token>)
router.get("/me", protect, authController.me);

// === Routes 2FA (Double Authentification) ===
// POST /auth/2fa/setup : initialise la configuration 2FA (génère un QR code/secret TOTP)
// - protect : l'utilisateur doit être connecté pour activer le 2FA
router.post("/2fa/setup", protect, authController.setupTwoFactor);

// POST /auth/2fa/verify-setup : valide le code TOTP lors de la mise en place initiale du 2FA
// - protect : requiert une connexion active
router.post("/2fa/verify-setup", protect, authController.verifyTwoFactorSetup);

// POST /auth/2fa/verify-login : vérifie le code TOTP lors d'une connexion avec 2FA activé
// - authLimiter : protège cet endpoint contre les tentatives par force brute
router.post("/2fa/verify-login", authLimiter, authController.verifyTwoFactorLogin);

// POST /auth/2fa/disable : désactive la double authentification pour l'utilisateur connecté
// - protect : l'utilisateur doit être connecté pour désactiver son 2FA
router.post("/2fa/disable", protect, authController.disableTwoFactor);

// === Routes OAuth (authentification via fournisseurs tiers) ===
// GET /auth/google : redirige l'utilisateur vers la page de consentement Google OAuth
router.get("/google", authController.oauthRedirect("google"));

// GET /auth/google/callback : reçoit le code d'autorisation de Google après consentement
router.get("/google/callback", authController.oauthCallback("google"));

// GET /auth/facebook : redirige vers la page de consentement Facebook OAuth
router.get("/facebook", authController.oauthRedirect("facebook"));

// GET /auth/facebook/callback : reçoit le code d'autorisation de Facebook
router.get("/facebook/callback", authController.oauthCallback("facebook"));

// GET /auth/apple : redirige vers la page de consentement Apple Sign In
router.get("/apple", authController.oauthRedirect("apple"));

// POST /auth/apple/callback : Apple envoie les données en POST (formulaire) après consentement
router.post("/apple/callback", authController.oauthCallback("apple"));

// GET /auth/apple/callback : variante GET du callback Apple (certains flows front-end l'utilisent)
router.get("/apple/callback", authController.oauthCallback("apple"));

// Export du routeur pour enregistrement dans le routeur principal
module.exports = router;
