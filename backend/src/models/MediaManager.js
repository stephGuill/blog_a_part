// MediaManager.js
// Manager pour la table `media`.
// Chaque méthode transforme éventuellement des objets JS en JSON et exécute
// une requête paramétrée via `this.database.query`.

const AbstractManager = require("./AbstractManager");

class MediaManager extends AbstractManager {
    constructor() {
        // Indique la table 'media' au constructeur parent
        super({ table: "media" });
    }

    // insert(media) : insère un nouveau média
    insert(media) {
        // Paramétrage des valeurs : éviter l'injection SQL
        return this.database.query(
            `INSERT INTO ${this.table} (blog_id, uploader_id, file_path, file_name, mime_type, size_bytes, alt_text, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [media.blog_id, media.uploader_id, media.file_path, media.file_name, media.mime_type, media.size_bytes, media.alt_text, media.metadata_json]
        );
    }

    // update(media) : met à jour un média existant (par id)
    update(media) {
        return this.database.query(
            `UPDATE ${this.table} SET file_path = ?, file_name = ?, mime_type = ?, size_bytes = ?, alt_text = ?, metadata_json = ? WHERE id = ?`,
            [media.file_path, media.file_name, media.mime_type, media.size_bytes, media.alt_text, media.metadata_json, media.id]
        );
    }

    // Les méthodes find, findAll, delete sont héritées d'AbstractManager
}

module.exports = MediaManager;