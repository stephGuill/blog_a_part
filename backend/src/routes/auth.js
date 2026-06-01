const express = require("express");
const authController = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const { authLimiter } = require("../middlewares/rateLimit");
const { uploadAvatarImage } = require("../middlewares/upload");

const router = express.Router();

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

// FR: Routes d'authentification.
// EN: Authentication routes.
router.post("/signup", authLimiter, uploadAvatar, authController.signup);
router.post("/register", authLimiter, uploadAvatar, authController.signup);
router.post("/signin", authLimiter, authController.signin);
router.post("/login", authLimiter, authController.signin);
router.get("/me", protect, authController.me);
router.post("/2fa/setup", protect, authController.setupTwoFactor);
router.post("/2fa/verify-setup", protect, authController.verifyTwoFactorSetup);
router.post("/2fa/verify-login", authLimiter, authController.verifyTwoFactorLogin);
router.post("/2fa/disable", protect, authController.disableTwoFactor);
router.get("/google", authController.oauthRedirect("google"));
router.get("/google/callback", authController.oauthCallback("google"));
router.get("/facebook", authController.oauthRedirect("facebook"));
router.get("/facebook/callback", authController.oauthCallback("facebook"));
router.get("/apple", authController.oauthRedirect("apple"));
router.post("/apple/callback", authController.oauthCallback("apple"));
router.get("/apple/callback", authController.oauthCallback("apple"));

module.exports = router; 
