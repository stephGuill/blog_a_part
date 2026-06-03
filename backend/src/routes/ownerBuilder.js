// Routeur Express pour le builder de pages de blog (éditeur visuel)
// Gère la structure des pages : pages, sections, blocs et leur publication
// Toutes les routes requièrent une authentification (protect appliqué globalement via router.use)
// Les permissions spécifiques au blog sont vérifiées via requireBlogPermission
const express = require("express");

// Contrôleur contenant toute la logique du builder de pages (pages, sections, blocs)
const builderController = require("../controllers/builderController");

// protect : middleware d'authentification JWT (vérifie le token, attache req.user)
const { protect } = require("../middlewares/auth");

// requireBlogPermission : factory de middleware vérifiant une permission BUILDER_* sur le blog :blogId
const requireBlogPermission = require("../middlewares/requireBlogPermission");

// uploadBuilderImage : wrapper Multer configuré pour l'upload d'images dans le builder
const { uploadBuilderImage } = require("../middlewares/upload");

// PERMISSIONS : constantes d'énumération des permissions builder et générales
const { PERMISSIONS } = require("../utils/permissions");

// Création du routeur Express pour ce groupe de routes
const router = express.Router();

/*
 * Middleware d'upload d'image pour le builder.
 * Traite le fichier dans le champ "file" (upload unique via Multer).
 * - En cas de fichier trop volumineux (LIMIT_FILE_SIZE) : répond HTTP 400 avec message spécifique
 * - En cas d'autre erreur Multer : répond HTTP 400 avec le message d'erreur générique
 * - En cas de succès : expose req.file et passe au handler suivant via next()
 */
const uploadBuilderSingle = (req, res, next) => {
  // Traitement du champ "file" en upload de fichier unique
  uploadBuilderImage.single("file")(req, res, (error) => {
    // Si aucune erreur, on passe au middleware/handler suivant
    if (!error) {
      return next();
    }

    // Gestion des erreurs d'upload avec messages adaptés selon le type d'erreur
    return res.status(400).json({
      status: "fail",
      // Message spécifique si le fichier dépasse la limite de taille (2 Mo maximum)
      message: error.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux : 2 Mo maximum." : error.message,
    });
  });
};

/*
 * Application globale du middleware d'authentification sur toutes les routes du routeur.
 * protect vérifie le JWT et attache req.user avant chaque handler de route déclaré ci-dessous.
 */
router.use(protect);

// =============================================
// ROUTES : PAGES DU BUILDER
// =============================================

// GET /builder/:blogId/pages
// Liste toutes les pages du blog identifié par :blogId
// Paramètre URL :blogId -> identifiant du blog
// - requireBlogPermission(BUILDER_READ) : vérifie que l'utilisateur peut lire le builder du blog
router.get("/:blogId/pages", requireBlogPermission(PERMISSIONS.BUILDER_READ), builderController.listPages);

// POST /builder/:blogId/pages
// Crée une nouvelle page pour le blog identifié par :blogId
// Corps attendu : { title, slug, ... }
// - requireBlogPermission(BUILDER_CREATE) : vérifie le droit de création dans le builder
router.post("/:blogId/pages", requireBlogPermission(PERMISSIONS.BUILDER_CREATE), builderController.createPage);

// GET /builder/:blogId/pages/:pageId
// Retourne le contenu détaillé d'une page spécifique identifiée par :pageId
// Paramètre URL :pageId -> identifiant unique de la page
// - requireBlogPermission(BUILDER_READ) : vérifie le droit de lecture du builder
router.get("/:blogId/pages/:pageId", requireBlogPermission(PERMISSIONS.BUILDER_READ), builderController.getPage);

// PATCH /builder/:blogId/pages/:pageId
// Met à jour les métadonnées d'une page (titre, slug, ordre, visibilité, etc.)
// Paramètre URL :pageId -> identifiant de la page à modifier
// - requireBlogPermission(BUILDER_UPDATE) : vérifie le droit de modification dans le builder
router.patch("/:blogId/pages/:pageId", requireBlogPermission(PERMISSIONS.BUILDER_UPDATE), builderController.updatePage);

// DELETE /builder/:blogId/pages/:pageId
// Supprime une page et tout son contenu (sections et blocs inclus)
// Paramètre URL :pageId -> identifiant de la page à supprimer
// - requireBlogPermission(BUILDER_DELETE) : vérifie le droit de suppression dans le builder
router.delete("/:blogId/pages/:pageId", requireBlogPermission(PERMISSIONS.BUILDER_DELETE), builderController.deletePage);

// =============================================
// ROUTES : SECTIONS D'UNE PAGE
// =============================================

// POST /builder/:blogId/pages/:pageId/sections
// Crée une nouvelle section dans la page identifiée par :pageId
// Corps attendu : { type, content, ... }
// - requireBlogPermission(BUILDER_CREATE) : vérifie le droit de création
router.post(
  "/:blogId/pages/:pageId/sections",
  requireBlogPermission(PERMISSIONS.BUILDER_CREATE),
  builderController.createSection
);

// PATCH /builder/:blogId/pages/:pageId/sections/reorder
// Réordonne les sections de la page (utilisé après un drag-and-drop dans l'interface)
// Corps attendu : { order: [sectionId1, sectionId2, ...] }
// - requireBlogPermission(BUILDER_UPDATE) : vérifie le droit de modification
router.patch(
  "/:blogId/pages/:pageId/sections/reorder",
  requireBlogPermission(PERMISSIONS.BUILDER_UPDATE),
  builderController.reorderSections
);

// PATCH /builder/:blogId/pages/:pageId/sections/:sectionId
// Met à jour le contenu ou les paramètres d'une section spécifique
// Paramètre URL :sectionId -> identifiant de la section à modifier
// - requireBlogPermission(BUILDER_UPDATE) : vérifie le droit de modification
router.patch(
  "/:blogId/pages/:pageId/sections/:sectionId",
  requireBlogPermission(PERMISSIONS.BUILDER_UPDATE),
  builderController.updateSection
);

// DELETE /builder/:blogId/pages/:pageId/sections/:sectionId
// Supprime une section et tous ses blocs enfants
// Paramètre URL :sectionId -> identifiant de la section à supprimer
// - requireBlogPermission(BUILDER_DELETE) : vérifie le droit de suppression
router.delete(
  "/:blogId/pages/:pageId/sections/:sectionId",
  requireBlogPermission(PERMISSIONS.BUILDER_DELETE),
  builderController.deleteSection
);

// =============================================
// ROUTES : BLOCS D'UNE SECTION
// =============================================

// POST /builder/:blogId/sections/:sectionId/blocks
// Crée un nouveau bloc dans la section identifiée par :sectionId
// Corps attendu : { type, content, ... }
// - requireBlogPermission(BUILDER_CREATE) : vérifie le droit de création
router.post(
  "/:blogId/sections/:sectionId/blocks",
  requireBlogPermission(PERMISSIONS.BUILDER_CREATE),
  builderController.createBlock
);

// PATCH /builder/:blogId/sections/:sectionId/blocks/reorder
// Réordonne les blocs à l'intérieur d'une section (drag-and-drop)
// Corps attendu : { order: [blockId1, blockId2, ...] }
// - requireBlogPermission(BUILDER_UPDATE) : vérifie le droit de modification
router.patch(
  "/:blogId/sections/:sectionId/blocks/reorder",
  requireBlogPermission(PERMISSIONS.BUILDER_UPDATE),
  builderController.reorderBlocks
);

// PATCH /builder/:blogId/blocks/:blockId
// Met à jour le contenu ou les propriétés d'un bloc spécifique
// Paramètre URL :blockId -> identifiant du bloc à modifier
// - requireBlogPermission(BUILDER_UPDATE) : vérifie le droit de modification
router.patch("/:blogId/blocks/:blockId", requireBlogPermission(PERMISSIONS.BUILDER_UPDATE), builderController.updateBlock);

// DELETE /builder/:blogId/blocks/:blockId
// Supprime un bloc spécifique identifié par :blockId
// Paramètre URL :blockId -> identifiant du bloc à supprimer
// - requireBlogPermission(BUILDER_DELETE) : vérifie le droit de suppression
router.delete("/:blogId/blocks/:blockId", requireBlogPermission(PERMISSIONS.BUILDER_DELETE), builderController.deleteBlock);

// =============================================
// ROUTES : LAYOUT ET PUBLICATION
// =============================================

// PUT /builder/:blogId/pages/:pageId/layout
// Sauvegarde la disposition complète (layout) d'une page (toutes les sections et blocs en une fois)
// Corps attendu : structure JSON complète du layout de la page
// - requireBlogPermission(BUILDER_UPDATE) : vérifie le droit de modification
router.put("/:blogId/pages/:pageId/layout", requireBlogPermission(PERMISSIONS.BUILDER_UPDATE), builderController.saveLayout);

// PATCH /builder/:blogId/pages/:pageId/publish
// Publie une page (la rend visible publiquement sur le blog)
// - requireBlogPermission(BUILDER_PUBLISH) : vérifie le droit de publication
router.patch("/:blogId/pages/:pageId/publish", requireBlogPermission(PERMISSIONS.BUILDER_PUBLISH), builderController.publishPage);

// PATCH /builder/:blogId/pages/:pageId/unpublish
// Dépublie une page (la repasse en brouillon, invisible pour les visiteurs)
// - requireBlogPermission(BUILDER_PUBLISH) : vérifie le droit de publication/dépublication
router.patch("/:blogId/pages/:pageId/unpublish", requireBlogPermission(PERMISSIONS.BUILDER_PUBLISH), builderController.unpublishPage);

// =============================================
// ROUTES : MÉDIAS DU BUILDER
// =============================================

// POST /builder/:blogId/media
// Upload d'une image ou d'un fichier média depuis l'interface du builder
// - requireBlogPermission(BUILDER_UPLOAD_MEDIA) : vérifie le droit d'upload de médias dans le builder
// - uploadBuilderSingle                         : traite le fichier (champ "file"), limite à 2 Mo
// - builderController.uploadMedia               : enregistre le fichier et retourne son URL publique
router.post(
  "/:blogId/media",
  requireBlogPermission(PERMISSIONS.BUILDER_UPLOAD_MEDIA),
  uploadBuilderSingle,
  builderController.uploadMedia
);

// Export du routeur pour montage dans le routeur principal
module.exports = router;
