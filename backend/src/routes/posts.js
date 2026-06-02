// Router: Posts endpoints
// - Public listing + resource-protected endpoints for read/create/update/delete
// - Uses `protect` and `requireBlogPermission` to enforce blog-level permissions
// Exposed routes: GET /, GET /:id, PUT /:id, POST /, DELETE /:id
const express = require("express");
const postsController = require("../controllers/postsController");
// Middleware pour protéger la route (requiert JWT/session valide)
const { protect } = require("../middlewares/auth");
// Middleware qui vérifie les permissions spécifiques au blog/ressource
const requireBlogPermission = require("../middlewares/requireBlogPermission");
const { PERMISSIONS } = require("../utils/permissions");

const router = express.Router();

// GET /posts/ -> liste publique (ou filtrée selon l'implémentation du controller)
router.get("/", postsController.browse);

// GET /posts/:id -> lecture d'un post
// Nécessite que l'utilisateur ait la permission `POST_READ` sur le blog
router.get("/:id", protect, requireBlogPermission(PERMISSIONS.POST_READ), postsController.read);

// PUT /posts/:id -> mise à jour d'un post (permission POST_UPDATE requise)
router.put("/:id", protect, requireBlogPermission(PERMISSIONS.POST_UPDATE), postsController.edit);

// POST /posts/ -> création de post (permission POST_CREATE requise)
router.post("/", protect, requireBlogPermission(PERMISSIONS.POST_CREATE), postsController.add);

// DELETE /posts/:id -> suppression (permission POST_DELETE requise)
router.delete("/:id", protect, requireBlogPermission(PERMISSIONS.POST_DELETE), postsController.destroy);

module.exports = router;
