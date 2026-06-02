// Router: Comments endpoints
// - Public creation endpoint and protected endpoints for moderation/read
// - Uses `requireBlogPermission` to apply comment-specific permissions
const express = require("express");

const commentsController = require("../controllers/commentsController");
// Middleware de protection (JWT/session)
const { protect } = require("../middlewares/auth");
// Vérification des permissions spécifiques au blog (lecture/modération)
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router();

// GET /comments/ -> liste des commentaires (requiert auth pour lister)
router.get("/", protect, commentsController.browse);

// GET /comments/:id -> lecture d'un commentaire (permission COMMENT_READ requise)
router.get("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_READ), commentsController.read);

// POST /comments/ -> création d'un commentaire public (pas besoin d'auth par défaut)
router.post("/", commentsController.add);

// PUT /comments/:id -> mise à jour (modération) (COMMENT_MODERATE requise)
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_MODERATE), commentsController.edit);
router.put("/:id/moderate", protect, requireBlogPermission(PERMISSIONS.COMMENT_MODERATE), commentsController.edit);

// DELETE /comments/:id -> suppression (COMMENT_DELETE requise)
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.COMMENT_DELETE), commentsController.destroy);

module.exports = router;
