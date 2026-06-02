// mediaController.js
// Contrôleur : gestion de la médiathèque (médias uploadés)
// - Endpoints CRUD pour `media` et upload de fichiers (multipart).
// - Les méthodes valident la présence d'un fichier, construisent les métadonnées
//   attendues par `models.media` et renvoient des codes HTTP standard.
// Contrôleur pour l'entité media
// Chaque méthode correspond à une opération CRUD

const models = require("../models"); // On importe tous les modèles

// browse(req, res) : récupère tous les médias
// - Retourne la liste complète; filtrage/pagination non gérés ici
// Exports: browse, read, edit, add, destroy
const browse = (req, res) => {
    models.media
        .findAll()
        .then(([rows]) => {
            res.send(rows);
        })
        .catch((err) => {
            console.error(err);
            res.sendStatus(500);
        });
};

// read(req, res) : récupère un média par son id (404 si absent)
const read = (req, res) => {
    models.media
        .find(req.params.id)
        .then(([rows]) => {
            if (rows[0] == null) {
                res.sendStatus(404);
            } else {
                res.send(rows[0]);
            }
        })
        .catch((err) => {
            console.error(err);
            res.sendStatus(500);
        });
};

// edit(req, res) : met à jour les métadonnées d'un média existant
// - Body : champs modifiables (alt_text, metadata_json, etc.)
const edit = (req, res) => {
    const media = req.body;
    media.id = parseInt(req.params.id, 10);

    models.media
        .update(media)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(204);
            }
        })
        .catch((err) => {
            console.error(err);
            res.sendStatus(500);
        });
};

// add(req, res) : ajoute un nouveau média depuis un upload multipart ou manuel
// - Si `req.file` est présent, on extrait les métadonnées du fichier
// - Body attendu : { blog_id, uploader_id?, metadata_json? }
const add = (req, res) => {
    const media = req.body;

    if (req.file) {
        // Le fichier provient du champ multipart "file"
        media.file_path = `/uploads/${req.file.filename}`;
        media.file_name = req.file.originalname;
        media.mime_type = req.file.mimetype;
        media.size_bytes = req.file.size;
    }

    media.uploader_id = req.user?.id || media.uploader_id;
    media.metadata_json = media.metadata_json ? JSON.stringify(media.metadata_json) : JSON.stringify({ source: req.file ? "upload" : "manual" });

    if (!media.blog_id || !media.file_path) {
        return res.status(400).json({
            status: "fail",
            message: "blog_id et fichier sont requis.",
        });
    }

    models.media
        .insert(media)
        .then(([result]) => {
            res.location(`/media/${result.insertId}`).sendStatus(201);
        })
        .catch((err) => {
            console.error(err);
            res.sendStatus(500);
        });
};

// destroy(req, res) : supprime un média par son id
const destroy = (req, res) => {
    models.media
        .delete(req.params.id)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                res.sendStatus(404);
            } else {
                res.sendStatus(204);
            }
        })
        .catch((err) => {
            console.error(err);
            res.sendStatus(500);
        });
};

// On exporte toutes les fonctions du contrôleur
module.exports = {
    browse, // GET /media
    read, // GET /media/:id
    edit, // PUT /media/:id
    add, // POST /media
    destroy // DELETE /media/:id
};
