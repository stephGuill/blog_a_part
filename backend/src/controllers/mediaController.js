// mediaController.js
// Contrôleur : gestion de la médiathèque (médias uploadés)
// - Endpoints CRUD pour `media` et upload de fichiers (multipart).
// - Les méthodes valident la présence d'un fichier, construisent les métadonnées
//   attendues par `models.media` et renvoient des codes HTTP standard.
// Contrôleur pour l'entité media
// Chaque méthode correspond à une opération CRUD

const models = require("../models"); // On importe tous les modèles

// Récupère tous les médias
const browse = (req, res) => {
    // Appelle la méthode findAll() du MediaManager
    models.media
        .findAll()
        .then(([rows]) => {
            // Renvoie la liste des médias
            res.send(rows);
        })
        .catch((err) => {
            // En cas d'erreur serveur
            console.error(err);
            res.sendStatus(500);
        });
};

// Récupère un média par son id
const read = (req, res) => {
    models.media
        .find(req.params.id)
        .then(([rows]) => {
            if (rows[0] == null) {
                // Si aucun média trouvé, renvoie 404
                res.sendStatus(404);
            } else {
                // Sinon, renvoie le média trouvé
                res.send(rows[0]);
            }
        })
        .catch((err) => {
            // En cas d'erreur serveur
            console.error(err);
            res.sendStatus(500);
        });
};

// Modifie un média existant
const edit = (req, res) => {
    const media = req.body; // Récupère les données envoyées
    media.id = parseInt(req.params.id, 10); // Ajoute l'id à l'objet media

    // Appelle la méthode update() du MediaManager
    models.media
        .update(media)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                // Si aucun média modifié (id inexistant), renvoie 404
                res.sendStatus(404);
            } else {
                // Sinon, modification réussie
                res.sendStatus(204);
            }
        })
        .catch((err) => {
            // En cas d'erreur serveur
            console.error(err);
            res.sendStatus(500);
        });
};

// Ajoute un nouveau média
const add = (req, res) => {
    const media = req.body; // Récupère les données envoyées

    if (req.file) {
        // FR: Le fichier vient du champ multipart "file" et ne depasse pas 2 Mo.
        // EN: The file comes from the multipart "file" field and is capped at 2 MB.
        media.file_path = `/uploads/${req.file.filename}`;
        media.file_name = req.file.originalname;
        media.mime_type = req.file.mimetype;
        media.size_bytes = req.file.size;
    }

    media.uploader_id = req.user?.id || media.uploader_id;
    media.metadata_json = media.metadata_json
        ? JSON.stringify(media.metadata_json)
        : JSON.stringify({ source: req.file ? "upload" : "manual" });

    if (!media.blog_id || !media.file_path) {
        return res.status(400).json({
            status: "fail",
            message: "blog_id et fichier sont requis."
        });
    }

    // Appelle la méthode insert() du MediaManager
    models.media
        .insert(media)
        .then(([result]) => {
            // Renvoie l'URL du nouveau média créé
            res.location(`/media/${result.insertId}`).sendStatus(201);
        })
        .catch((err) => {
            // En cas d'erreur serveur
            console.error(err);
            res.sendStatus(500);
        });
};

// Supprime un média par son id
const destroy = (req, res) => {
    models.media
        .delete(req.params.id)
        .then(([result]) => {
            if (result.affectedRows === 0) {
                // Si aucun média supprimé (id inexistant), renvoie 404
                res.sendStatus(404);
            } else {
                // Sinon, suppression réussie
                res.sendStatus(204);
            }
        })
        .catch((err) => {
            // En cas d'erreur serveur
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
