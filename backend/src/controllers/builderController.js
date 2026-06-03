// ============================================================
// builderController.js
// Contrôleur Express : Page Builder — gestion des pages, sections et blocs.
//
// Rôle :
//   Ce contrôleur gère toutes les opérations du page builder : pages statiques
//   personnalisées, sections et blocs de contenu. Il délègue 100% de la logique
//   métier à BuilderService.
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.user, req.file
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.params : segments dynamiques de l'URL
//   → req.params.blogId    : id du blog dans /:blogId/pages
//   → req.params.pageId    : id de la page dans /:blogId/pages/:pageId
//   → req.params.sectionId : id de la section dans /:blogId/sections/:sectionId
//   → req.params.blockId   : id du bloc dans /:blogId/blocks/:blockId
//
// req.user : utilisateur connecté (injecté par le middleware protect())
//   → req.user.id : id de l'utilisateur (utilisé pour l'audit/ownership)
//
// req.file : fichier uploadé via Multer (pour uploadMedia)
//   → Présent uniquement sur la route POST /media avec enctype multipart
//
// req.body : données JSON du corps de la requête
//   → Pour reorderSections/Blocks : peut être un tableau direct ou { items: [...] }
//   → Pour saveLayout : peut être { layout_json: {...} } ou { layout: {...} } ou directement {}
//
// Codes HTTP :
//   200 OK          : opération réussie (lecture, update, delete, reorder)
//   201 Created     : ressource créée (page, section, bloc, média)
//   400 Bad Request : données invalides envoyées par le client
//   404 Not Found   : ressource introuvable
//   409 Conflict    : slug déjà existant (ER_DUP_ENTRY)
//   500 Server Err  : erreur inattendue côté serveur
//
// Exports : createBlock, createPage, createSection, deleteBlock, deletePage,
//           deleteSection, getPage, listPages, publishPage, reorderBlocks,
//           reorderSections, saveLayout, unpublishPage, updateBlock,
//           updatePage, updateSection, uploadMedia
// ============================================================

// Importation du service builder : contient toute la logique métier (SQL, validations)
const builderService = require("../services/BuilderService");

/* ----------------------------------------------------------------
 * sendError(res, error)
 * Fonction utilitaire locale : transforme une erreur service en réponse HTTP.
 *
 * Gère deux cas particuliers :
 *   1. ER_DUP_ENTRY (MySQL) : slug déjà existant → HTTP 409 Conflict
 *   2. error.statusCode     : code fourni par le service → utilisé directement
 *      → < 500 : erreur client (ex: 400 données invalides, 404 introuvable)
 *      → >= 500 : erreur serveur → message générique
 * ---------------------------------------------------------------- */
function sendError(res, error) {
  // Cas 1 : erreur MySQL de contrainte UNIQUE (slug déjà pris)
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      status: "fail",
      message: "Ce slug existe déjà pour ce blog."
    });
  }

  // Cas 2 : erreur avec code HTTP spécifié par le service
  const statusCode = error.statusCode || 500; // 500 par défaut si pas de code
  return res.status(statusCode).json({
    // Si >= 500 : "error" (problème serveur) ; sinon : "fail" (problème client)
    status: statusCode >= 500 ? "error" : "fail",
    // Si >= 500 : message générique (ne pas exposer les détails internes)
    // Si < 500  : message du service (ex: "Page introuvable")
    message: statusCode >= 500 ? "Erreur serveur builder." : error.message
  });
}

/* ----------------------------------------------------------------
 * listPages(req, res)
 * Route : GET /api/builder/:blogId/pages
 * Retourne la liste de toutes les pages builder d'un blog.
 *
 * req.params.blogId : id du blog dont on liste les pages
 * ---------------------------------------------------------------- */
const listPages = async (req, res) => {
  try {
    // Le service récupère toutes les pages du blog (avec sections et blocs si besoin)
    const pages = await builderService.listPages(req.params.blogId);
    return res.status(200).json({ success: true, data: pages }); // HTTP 200 OK
  } catch (error) {
    console.error(error); // Log de l'erreur côté serveur
    return sendError(res, error); // Réponse d'erreur formatée
  }
};

/* ----------------------------------------------------------------
 * createPage(req, res)
 * Route : POST /api/builder/:blogId/pages
 * Crée une nouvelle page builder pour un blog.
 *
 * req.params.blogId : id du blog parent
 * req.user.id       : id du créateur (pour l'audit et l'ownership)
 * req.body          : données de la page (titre, slug, type, layout_json…)
 * HTTP 201 Created  : nouvelle page créée
 * ---------------------------------------------------------------- */
const createPage = async (req, res) => {
  try {
    // Le service valide les données, génère le slug si absent et insère la page
    const page = await builderService.createPage(req.params.blogId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: page }); // HTTP 201 Created
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * getPage(req, res)
 * Route : GET /api/builder/:blogId/pages/:pageId
 * Retourne une page builder spécifique avec ses sections et blocs.
 *
 * req.params.blogId : id du blog
 * req.params.pageId : id de la page à récupérer
 * ---------------------------------------------------------------- */
const getPage = async (req, res) => {
  try {
    // Le service charge la page avec toutes ses sections et blocs imbriqués
    const page = await builderService.getPage(req.params.blogId, req.params.pageId);
    return res.status(200).json({ success: true, data: page }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * updatePage(req, res)
 * Route : PUT /api/builder/:blogId/pages/:pageId
 * Met à jour les métadonnées d'une page builder.
 *
 * req.params.blogId : id du blog
 * req.params.pageId : id de la page à modifier
 * req.user.id       : id de l'utilisateur qui effectue la modification
 * req.body          : champs à modifier (titre, slug, méta…)
 * ---------------------------------------------------------------- */
const updatePage = async (req, res) => {
  try {
    // Le service valide et applique la mise à jour, retourne la page mise à jour
    const page = await builderService.updatePage(req.params.blogId, req.params.pageId, req.user.id, req.body);
    return res.status(200).json({ success: true, data: page }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * deletePage(req, res)
 * Route : DELETE /api/builder/:blogId/pages/:pageId
 * Archive une page builder (suppression logique, pas physique).
 *
 * "Archive" = marque la page comme archivée (status = "archived")
 * sans la supprimer physiquement de la BDD (conservation des données).
 * ---------------------------------------------------------------- */
const deletePage = async (req, res) => {
  try {
    // archivePage() : UPDATE builder_pages SET status='archived' WHERE id=?
    await builderService.archivePage(req.params.blogId, req.params.pageId, req.user.id);
    return res.status(200).json({ success: true, message: "Page builder archivée." }); // HTTP 200
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * createSection(req, res)
 * Route : POST /api/builder/:blogId/pages/:pageId/sections
 * Crée une nouvelle section dans une page builder.
 *
 * req.params.blogId : id du blog
 * req.params.pageId : id de la page parente
 * req.user.id       : id du créateur
 * req.body          : données de la section (type, position, config_json…)
 * HTTP 201 Created  : nouvelle section créée
 * ---------------------------------------------------------------- */
const createSection = async (req, res) => {
  try {
    // Le service insère la section et gère la position/ordre
    const section = await builderService.createSection(req.params.blogId, req.params.pageId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: section }); // HTTP 201 Created
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * updateSection(req, res)
 * Route : PUT /api/builder/:blogId/pages/:pageId/sections/:sectionId
 * Met à jour une section existante d'une page builder.
 *
 * req.params.sectionId : id de la section à modifier
 * req.body             : champs à modifier (type, config_json, position…)
 * ---------------------------------------------------------------- */
const updateSection = async (req, res) => {
  try {
    // Le service valide et applique la mise à jour de la section
    const section = await builderService.updateSection(
      req.params.blogId,    // Id du blog parent
      req.params.pageId,    // Id de la page parente
      req.params.sectionId, // Id de la section à modifier
      req.user.id,          // Id de l'utilisateur qui modifie
      req.body              // Données à mettre à jour
    );
    return res.status(200).json({ success: true, data: section }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * deleteSection(req, res)
 * Route : DELETE /api/builder/:blogId/pages/:pageId/sections/:sectionId
 * Supprime une section (et ses blocs enfants) d'une page builder.
 * ---------------------------------------------------------------- */
const deleteSection = async (req, res) => {
  try {
    // Le service supprime la section et ses blocs enfants en cascade
    await builderService.deleteSection(req.params.blogId, req.params.pageId, req.params.sectionId, req.user.id);
    return res.status(200).json({ success: true, message: "Section builder supprimée." }); // HTTP 200
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * reorderSections(req, res)
 * Route : PUT /api/builder/:blogId/pages/:pageId/sections/reorder
 * Réordonne les sections d'une page (drag & drop dans l'interface).
 *
 * req.body : peut être un tableau direct [...] ou un objet { items: [...] }
 *   → items : tableau d'objets avec { id: sectionId, position: newPosition }
 * ---------------------------------------------------------------- */
const reorderSections = async (req, res) => {
  try {
    // On accepte deux formats de body : tableau direct ou objet { items: [...] }
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    // Le service met à jour l'ordre des sections et retourne la page mise à jour
    const page = await builderService.reorderSections(req.params.blogId, req.params.pageId, req.user.id, items);
    return res.status(200).json({ success: true, data: page }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * createBlock(req, res)
 * Route : POST /api/builder/:blogId/sections/:sectionId/blocks
 * Crée un nouveau bloc de contenu dans une section.
 *
 * req.params.sectionId : id de la section parente
 * req.body             : données du bloc (type, content_json, position…)
 * HTTP 201 Created     : nouveau bloc créé
 * ---------------------------------------------------------------- */
const createBlock = async (req, res) => {
  try {
    // Le service insère le bloc dans la section et gère la position
    const block = await builderService.createBlock(req.params.blogId, req.params.sectionId, req.user.id, req.body);
    return res.status(201).json({ success: true, data: block }); // HTTP 201 Created
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * updateBlock(req, res)
 * Route : PUT /api/builder/:blogId/blocks/:blockId
 * Met à jour un bloc de contenu existant.
 *
 * req.params.blockId : id du bloc à modifier
 * req.body           : nouvelles données du bloc (content_json, type…)
 * ---------------------------------------------------------------- */
const updateBlock = async (req, res) => {
  try {
    // Le service valide et applique la mise à jour du bloc
    const block = await builderService.updateBlock(req.params.blogId, req.params.blockId, req.user.id, req.body);
    return res.status(200).json({ success: true, data: block }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * deleteBlock(req, res)
 * Route : DELETE /api/builder/:blogId/blocks/:blockId
 * Supprime un bloc de contenu d'une section.
 * ---------------------------------------------------------------- */
const deleteBlock = async (req, res) => {
  try {
    // Le service supprime le bloc et réajuste les positions si nécessaire
    await builderService.deleteBlock(req.params.blogId, req.params.blockId, req.user.id);
    return res.status(200).json({ success: true, message: "Bloc builder supprimé." }); // HTTP 200
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * reorderBlocks(req, res)
 * Route : PUT /api/builder/:blogId/sections/:sectionId/blocks/reorder
 * Réordonne les blocs d'une section (drag & drop).
 *
 * req.body : tableau direct [...] ou objet { items: [...] }
 *   → items : [{ id: blockId, position: newPosition }, ...]
 * ---------------------------------------------------------------- */
const reorderBlocks = async (req, res) => {
  try {
    // On accepte deux formats de body : tableau direct ou { items: [...] }
    const items = Array.isArray(req.body) ? req.body : req.body.items;
    // Le service met à jour l'ordre des blocs dans la section
    const blocks = await builderService.reorderBlocks(req.params.blogId, req.params.sectionId, req.user.id, items);
    return res.status(200).json({ success: true, data: blocks }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * saveLayout(req, res)
 * Route : PUT /api/builder/:blogId/pages/:pageId/layout
 * Sauvegarde la configuration de layout JSON d'une page.
 *
 * req.body : la structure du layout (accepte plusieurs formats)
 *   → { layout_json: {...} } ou { layout: {...} } ou directement {}
 * ---------------------------------------------------------------- */
const saveLayout = async (req, res) => {
  try {
    // Extraction flexible du layout depuis le body (3 formats supportés)
    const layout = req.body.layout_json || req.body.layout || req.body;
    // Le service met à jour le champ layout_json de la page
    const page = await builderService.saveLayout(req.params.blogId, req.params.pageId, req.user.id, layout);
    return res.status(200).json({ success: true, data: page }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * publishPage(req, res)
 * Route : POST /api/builder/:blogId/pages/:pageId/publish
 * Publie une page builder (la rend visible pour les visiteurs).
 *
 * Le service met à jour le statut de la page : "draft" → "published"
 * et définit published_at à la date actuelle.
 * ---------------------------------------------------------------- */
const publishPage = async (req, res) => {
  try {
    // Le service change le statut à "published" et définit published_at
    const page = await builderService.publishPage(req.params.blogId, req.params.pageId, req.user.id);
    return res.status(200).json({ success: true, data: page }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * unpublishPage(req, res)
 * Route : POST /api/builder/:blogId/pages/:pageId/unpublish
 * Dépublie une page builder (la masque aux visiteurs sans la supprimer).
 *
 * Le service remet le statut à "draft" et efface published_at.
 * ---------------------------------------------------------------- */
const unpublishPage = async (req, res) => {
  try {
    // Le service change le statut à "draft" et met published_at à null
    const page = await builderService.unpublishPage(req.params.blogId, req.params.pageId, req.user.id);
    return res.status(200).json({ success: true, data: page }); // HTTP 200 OK
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * uploadMedia(req, res)
 * Route : POST /api/builder/:blogId/media
 * Upload un fichier média associé au blog (image, document…).
 *
 * req.file : objet Multer contenant les métadonnées du fichier uploadé
 *   → req.file.filename     : nom généré sur le disque
 *   → req.file.originalname : nom original du fichier
 *   → req.file.mimetype     : type MIME (ex: "image/png")
 *   → req.file.size         : taille en octets
 * req.body : métadonnées supplémentaires (alt_text, description…)
 * HTTP 201 Created : média enregistré avec succès
 * ---------------------------------------------------------------- */
const uploadMedia = async (req, res) => {
  try {
    // Le service enregistre le fichier, crée l'entrée en BDD et retourne le média créé
    const media = await builderService.uploadMedia(req.params.blogId, req.user.id, req.file, req.body);
    return res.status(201).json({
      success: true,
      message: "Fichier uploadé avec succès.", // Message de confirmation
      data: media // Objet média créé (avec id, file_path, etc.)
    }); // HTTP 201 Created
  } catch (error) {
    console.error(error);
    return sendError(res, error);
  }
};

// Exportation de toutes les fonctions pour le router (backend/src/routes/ownerBuilder.js)
module.exports = {
  createBlock,      // POST   /builder/:blogId/sections/:sectionId/blocks        → crée un bloc
  createPage,       // POST   /builder/:blogId/pages                              → crée une page
  createSection,    // POST   /builder/:blogId/pages/:pageId/sections             → crée une section
  deleteBlock,      // DELETE /builder/:blogId/blocks/:blockId                    → supprime un bloc
  deletePage,       // DELETE /builder/:blogId/pages/:pageId                      → archive une page
  deleteSection,    // DELETE /builder/:blogId/pages/:pageId/sections/:sectionId  → supprime une section
  getPage,          // GET    /builder/:blogId/pages/:pageId                      → lit une page
  listPages,        // GET    /builder/:blogId/pages                              → liste les pages
  publishPage,      // POST   /builder/:blogId/pages/:pageId/publish              → publie une page
  reorderBlocks,    // PUT    /builder/:blogId/sections/:sectionId/blocks/reorder → réordonne les blocs
  reorderSections,  // PUT    /builder/:blogId/pages/:pageId/sections/reorder     → réordonne les sections
  saveLayout,       // PUT    /builder/:blogId/pages/:pageId/layout               → sauvegarde le layout
  unpublishPage,    // POST   /builder/:blogId/pages/:pageId/unpublish            → dépublie une page
  updateBlock,      // PUT    /builder/:blogId/blocks/:blockId                    → met à jour un bloc
  updatePage,       // PUT    /builder/:blogId/pages/:pageId                      → met à jour une page
  updateSection,    // PUT    /builder/:blogId/pages/:pageId/sections/:sectionId  → met à jour une section
  uploadMedia       // POST   /builder/:blogId/media                              → upload un fichier
};
