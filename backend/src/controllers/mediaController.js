// ============================================================
// mediaController.js
// Contrôleur Express : gestion de la médiathèque (fichiers uploadés).
//
// Rôle :
//   Gère les opérations CRUD sur les médias (images, fichiers) uploadés via
//   l'interface du blog. Supporte l'upload multipart (via le middleware Multer).
//
// Architecture Express :
//   req (Request)  : objet entrant — params URL, body JSON, req.file (upload Multer), req.user
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.file : objet injecté par le middleware Multer (upload.js) quand un fichier est uploadé
//   → req.file.filename     : nom du fichier sur le disque (généré par Multer)
//   → req.file.originalname : nom original du fichier envoyé par le client
//   → req.file.mimetype     : type MIME du fichier (ex: "image/jpeg")
//   → req.file.size         : taille en octets du fichier uploadé
//
// req.user : injecté par le middleware d'authentification (protect())
//   → req.user.id : id de l'utilisateur qui uploade le fichier
//
// Codes HTTP :
//   200 OK          : lecture réussie (implicite via res.send())
//   201 Created     : média créé avec succès
//   204 No Content  : modification/suppression réussie (pas de corps)
//   400 Bad Request : données manquantes (blog_id ou fichier absent)
//   404 Not Found   : média introuvable
//   500 Server Err  : erreur SQL ou système inattendue
//
// Exports : browse, read, edit, add, destroy
// ============================================================

// Importation de l'objet models (centralise tous les managers BDD)
// models.media expose : findAll(), find(id), update(), insert(), delete()
const models = require("../models"); // On importe tous les modèles

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/media
 * Retourne la liste complète de tous les médias enregistrés.
 * Utilisé par l'interface de gestion de la médiathèque.
 *
 * findAll() → SELECT * FROM media
 * ([rows])  : destructuration du résultat MySQL [[rows], fields]
 * res.send(rows) : envoie le tableau JSON avec HTTP 200 implicite
 * ---------------------------------------------------------------- */
const browse = (req, res) => {
    // findAll() retourne une Promise avec tous les médias de la table
    models.media
        .findAll()
        .then(([rows]) => {
            // rows = tableau de médias [{id, file_path, file_name, mime_type, ...}, ...]
            res.send(rows); // HTTP 200 OK avec la liste complète
        })
        .catch((err) => {
            console.error(err); // Log de l'erreur SQL côté serveur
            res.sendStatus(500); // HTTP 500 Internal Server Error
        });
};

/* ----------------------------------------------------------------
 * read(req, res)
 * Route : GET /api/media/:id
 * Retourne un média unique identifié par son id.
 *
 * req.params.id : valeur du segment :id dans l'URL
 *   → Ex: GET /media/5 → req.params.id = "5"
 * rows[0] == null : aucun média trouvé pour cet id → HTTP 404 Not Found
 * ---------------------------------------------------------------- */
const read = (req, res) => {
    // find(id) → SELECT * FROM media WHERE id = ? LIMIT 1
    models.media
        .find(req.params.id) // Passe l'id de l'URL comme paramètre SQL sécurisé
        .then(([rows]) => {
            if (rows[0] == null) {
                // Aucune ligne retournée → le média n'existe pas → HTTP 404
                res.sendStatus(404);
            } else {
                // Média trouvé → on retourne l'objet complet
                res.send(rows[0]); // HTTP 200 OK avec l'objet média
            }
        })
        .catch((err) => {
            console.error(err); // Log de l'erreur SQL
            res.sendStatus(500); // Erreur serveur imprévue
        });
};

/* ----------------------------------------------------------------
 * edit(req, res)
 * Route : PUT /api/media/:id
 * Met à jour les métadonnées d'un média existant (pas le fichier physique).
 *
 * req.body      : corps JSON avec les champs à modifier
 *   → Ex: { alt_text: "Logo de l'entreprise", metadata_json: {...} }
 * req.params.id : id du média à modifier (extrait du segment :id de l'URL)
 * parseInt()    : conversion de la string de l'URL en entier (base 10)
 * result.affectedRows === 0 : aucune ligne modifiée → l'id n'existe pas → HTTP 404
 * ---------------------------------------------------------------- */
const edit = (req, res) => {
    // On copie les champs à modifier depuis le corps de la requête
    const media = req.body;
    // On injecte l'id numérique depuis l'URL dans l'objet avant la mise à jour
    media.id = parseInt(req.params.id, 10);

    // update() → UPDATE media SET alt_text=?, metadata_json=? WHERE id=?
    models.media
        .update(media)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                // Aucune ligne mise à jour → l'id est inexistant → HTTP 404
                res.sendStatus(404);
            } else {
                // Mise à jour réussie → HTTP 204 No Content
                res.sendStatus(204);
            }
        })
        .catch((err) => {
            console.error(err); // Log de l'erreur SQL
            res.sendStatus(500); // Erreur SQL imprévue
        });
};

/* ----------------------------------------------------------------
 * add(req, res)
 * Route : POST /api/media
 * Enregistre un nouveau média (fichier uploadé ou référence manuelle).
 *
 * req.file : objet Multer injecté si un fichier multipart a été uploadé
 *   → Présent : on extrait les métadonnées automatiquement depuis req.file
 *   → Absent  : le client fournit les métadonnées directement dans req.body
 *
 * req.body.blog_id : id du blog auquel le média appartient (OBLIGATOIRE)
 * req.body.file_path : chemin du fichier (si upload manuel sans req.file)
 * req.user?.id     : id de l'uploader (opérateur optionnel si pas connecté)
 *
 * JSON.stringify() : sérialise l'objet metadata_json en chaîne pour stockage SQL
 *
 * Validation : blog_id ET file_path sont obligatoires → HTTP 400 si absents
 * result.insertId : id MySQL auto-incrémenté pour le nouveau média
 * ---------------------------------------------------------------- */
const add = (req, res) => {
    // On récupère les données du body (peuvent inclure blog_id, uploader_id, etc.)
    const media = req.body;

    // Si req.file existe, c'est un upload multipart via Multer
    if (req.file) {
        // On extrait les métadonnées du fichier uploadé par Multer
        media.file_path = `/uploads/${req.file.filename}`;   // Chemin de stockage sur le disque
        media.file_name = req.file.originalname;              // Nom original du fichier
        media.mime_type = req.file.mimetype;                  // Type MIME (ex: "image/jpeg")
        media.size_bytes = req.file.size;                     // Taille du fichier en octets
    }

    // Si req.user est présent (utilisateur connecté), on l'utilise comme uploader
    // L'opérateur ?. (optional chaining) évite une erreur si req.user est undefined
    media.uploader_id = req.user?.id || media.uploader_id;

    // On sérialise metadata_json en string JSON pour le stockage en base
    // Si metadata_json est déjà fourni dans le body, on le sérialise
    // Sinon, on crée un objet par défaut indiquant la source de l'upload
    media.metadata_json = media.metadata_json ? JSON.stringify(media.metadata_json) : JSON.stringify({ source: req.file ? "upload" : "manual" });

    // Validation des champs obligatoires avant d'insérer en base
    if (!media.blog_id || !media.file_path) {
        // HTTP 400 Bad Request : données insuffisantes pour créer le média
        return res.status(400).json({
            status: "fail",
            message: "blog_id et fichier sont requis.",
        });
    }

    // insert() → INSERT INTO media (blog_id, file_path, file_name, ...) VALUES (...)
    models.media
        .insert(media)
        .then(([result]) => {
            // result.insertId : id de la nouvelle ligne créée par MySQL
            // Header Location : URL de la ressource créée
            // HTTP 201 Created : nouvelle ressource média enregistrée
            res.location(`/media/${result.insertId}`).sendStatus(201);
        })
        .catch((err) => {
            console.error(err); // Log de l'erreur SQL (ex: contrainte FK)
            res.sendStatus(500);
        });
};

/* ----------------------------------------------------------------
 * destroy(req, res)
 * Route : DELETE /api/media/:id
 * Supprime un enregistrement média de la base de données.
 * Note : ne supprime PAS le fichier physique sur le disque (à gérer séparément).
 *
 * req.params.id : id du média à supprimer (extrait du segment :id de l'URL)
 * result.affectedRows === 0 : aucune ligne supprimée → l'id n'existe pas → HTTP 404
 * HTTP 204 No Content : suppression réussie sans corps de réponse
 * ---------------------------------------------------------------- */
const destroy = (req, res) => {
    // delete() → DELETE FROM media WHERE id = ?
    models.media
        .delete(req.params.id) // Paramètre SQL sécurisé contre l'injection SQL
        .then(([result]) => {
            if (result.affectedRows === 0) {
                // Aucune ligne supprimée → le média n'existe pas → HTTP 404 Not Found
                res.sendStatus(404);
            } else {
                // Suppression de l'enregistrement réussie → HTTP 204 No Content
                res.sendStatus(204);
            }
        })
        .catch((err) => {
            console.error(err); // Log de l'erreur SQL
            res.sendStatus(500); // Erreur serveur imprévue
        });
};

// Exportation des fonctions pour le router (backend/src/routes/media.js)
module.exports = {
    browse,  // GET    /media      → liste tous les médias
    read,    // GET    /media/:id  → retourne un média par id
    edit,    // PUT    /media/:id  → modifie les métadonnées d'un média
    add,     // POST   /media      → crée/enregistre un nouveau média
    destroy  // DELETE /media/:id  → supprime un média de la base
};
