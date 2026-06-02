// Router: Authentication endpoints (signup, signin, 2FA, OAuth)
// - Public endpoints are rate-limited via `authLimiter`.
// - Uploads for avatar during signup handled by `uploadAvatar` wrapper.
const express = require("express");
const authController = require("../controllers/authController");
// Middleware pour protéger les routes qui nécessitent un token/connexion
const { protect } = require("../middlewares/auth");
// Limiteur de requêtes pour endpoints sensibles (signup/signin)
const { authLimiter } = require("../middlewares/rateLimit");
// Middleware Multer pour upload d'avatar (utilisé lors de l'inscription)
const { uploadAvatarImage } = require("../middlewares/upload");

const router = express.Router();

// Wrapper pour l'upload d'avatar qui renvoie un 400 en cas d'erreur
// et appelle `next()` si l'upload est OK. Utilisé sur signup/register.
function uploadAvatar(req, res, next) {
  uploadAvatarImage.single("avatar")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        status: "fail",
        message: error.message,
      });
    }

    return next();
  });
}

// === Authentication routes ===
// NOTE: `authLimiter` protège les endpoints exposés publiquement contre l'abus.
// Signup / register : limités et acceptent un avatar en multipart/form-data
router.post("/signup", authLimiter, uploadAvatar, authController.signup);
router.post("/register", authLimiter, uploadAvatar, authController.signup);

// Signin / login : applique le rate limiter
router.post("/signin", authLimiter, authController.signin);
router.post("/login", authLimiter, authController.signin);

// Route protégée renvoyant les informations de l'utilisateur courant
router.get("/me", protect, authController.me);

// 2FA endpoints (setup/verify/disable)
router.post("/2fa/setup", protect, authController.setupTwoFactor);
router.post("/2fa/verify-setup", protect, authController.verifyTwoFactorSetup);
router.post("/2fa/verify-login", authLimiter, authController.verifyTwoFactorLogin);
router.post("/2fa/disable", protect, authController.disableTwoFactor);

// OAuth redirections et callbacks pour providers supportés (Google, Facebook, Apple)
router.get("/google", authController.oauthRedirect("google"));
router.get("/google/callback", authController.oauthCallback("google"));
router.get("/facebook", authController.oauthRedirect("facebook"));
router.get("/facebook/callback", authController.oauthCallback("facebook"));
router.get("/apple", authController.oauthRedirect("apple"));
router.post("/apple/callback", authController.oauthCallback("apple"));
router.get("/apple/callback", authController.oauthCallback("apple"));

module.exports = router;
