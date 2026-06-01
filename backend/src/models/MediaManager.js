// MediaManager.js
// Ce fichier gère les requêtes SQL pour l'entité media en mode orienté objet

const AbstractManager = require("./AbstractManager");

class MediaManager extends AbstractManager {
    constructor() {
        // On précise le nom de la table SQL à utiliser
        super({ table: "media" });
    }

    // Crée un nouveau média
    insert(media) {
        // blog_id : id du blog, uploader_id : id de l'uploader, file_path, file_name, mime_type, size_bytes, alt_text, metadata_json
        return this.database.query(
            `INSERT INTO ${this.table} (blog_id, uploader_id, file_path, file_name, mime_type, size_bytes, alt_text, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
                media.blog_id,
                media.uploader_id,
                media.file_path,
                media.file_name,
                media.mime_type,
                media.size_bytes,
                media.alt_text,
                media.metadata_json
            ]
        );
    }

    // Met à jour un média existant
    update(media) {
        return this.database.query(
            `UPDATE ${this.table} SET file_path = ?, file_name = ?, mime_type = ?, size_bytes = ?, alt_text = ?, metadata_json = ? WHERE id = ?`, [
                media.file_path,
                media.file_name,
                media.mime_type,
                media.size_bytes,
                media.alt_text,
                media.metadata_json,
                media.id
            ]
        );
    }

    // Les méthodes find, findAll, delete sont héritées d'AbstractManager
}

module.exports = MediaManager;