// MediaManager.js
// Manager pour la table `media`.
// Responsabilité : gérer les fichiers médias uploadés par les utilisateurs
// (images, documents, etc.) associés à un blog.
// Chaque méthode exécute une requête paramétrée via `this.database.query`.
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// Définition de la classe MediaManager héritant d'AbstractManager.
class MediaManager extends AbstractManager {
    // Constructeur : déclare la table `media` au parent AbstractManager.
    constructor() {
        // Appel du constructeur parent avec le nom de la table SQL cible.
        super({ table: "media" });
    }

    // insert(media) : insère un nouveau fichier média dans la table.
    //
    // Paramètre `media` : objet JS avec les propriétés suivantes :
    //   - blog_id       : id du blog auquel le média appartient
    //   - uploader_id   : id de l'utilisateur qui a uploadé le fichier
    //   - file_path     : chemin relatif ou absolu du fichier sur le serveur
    //   - file_name     : nom original du fichier (tel que fourni par l'utilisateur)
    //   - mime_type     : type MIME du fichier (ex: 'image/jpeg', 'application/pdf')
    //   - size_bytes    : taille du fichier en octets
    //   - alt_text      : texte alternatif pour l'accessibilité (utile pour les images)
    //   - metadata_json : données supplémentaires sous forme JSON (dimensions, exif, etc.)
    //
    // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
    insert(media) {
        // Requête INSERT paramétrée pour éviter l'injection SQL.
        // Toutes les valeurs sont passées via le tableau de paramètres.
        return this.database.query(
            `INSERT INTO ${this.table} (blog_id, uploader_id, file_path, file_name, mime_type, size_bytes, alt_text, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            // Ordre des valeurs correspondant aux placeholders de la requête SQL.
            [media.blog_id, media.uploader_id, media.file_path, media.file_name, media.mime_type, media.size_bytes, media.alt_text, media.metadata_json]
        );
    }

    // update(media) : met à jour les informations d'un fichier média existant.
    //
    // Paramètre `media` : objet JS avec les mêmes propriétés que pour insert,
    //   plus le champ `id` pour identifier l'enregistrement à modifier.
    //
    // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
    update(media) {
        // SET : met à jour tous les champs modifiables du média sauf blog_id et uploader_id.
        // WHERE id = ? : cible précisément le média à modifier.
        return this.database.query(
            `UPDATE ${this.table} SET file_path = ?, file_name = ?, mime_type = ?, size_bytes = ?, alt_text = ?, metadata_json = ? WHERE id = ?`,
            // Ordre des valeurs : d'abord les champs SET, puis la valeur du WHERE.
            [media.file_path, media.file_name, media.mime_type, media.size_bytes, media.alt_text, media.metadata_json, media.id]
        );
    }

    // Les méthodes find(id), findAll() et delete(id) sont héritées d'AbstractManager
    // et permettent respectivement : récupérer par id, lister tous, supprimer par id.
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = MediaManager;