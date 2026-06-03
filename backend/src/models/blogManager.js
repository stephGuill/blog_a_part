// BlogManager.js
// Manager pour la table `blogs`.
// Responsabilité : créer, mettre à jour et interroger les blogs de la plateforme.
// Les opérations génériques `find(id)`, `findAll()` et `delete(id)` sont héritées
// d'AbstractManager et ne sont donc pas redéfinies ici.

// Importation de la classe de base pour l'héritage.
const AbstractManager = require("./AbstractManager");

// Définition de la classe BlogManager héritant d'AbstractManager.
class BlogManager extends AbstractManager {
    // Constructeur : déclare la table `blogs` au parent.
    constructor() {
        // Appel du constructeur parent avec le nom de la table SQL cible.
        super({ table: "blogs" });
    }

    // insert(blog) : crée un nouveau blog dans la base de données.
    //
    // Paramètre `blog` : objet JS avec les propriétés suivantes :
    //   - owner_id    : id de l'utilisateur propriétaire du blog
    //   - theme_id    : id du thème visuel associé
    //   - name        : nom affiché du blog
    //   - slug        : identifiant unique URL-friendly (ex: "mon-blog")
    //   - description : texte de présentation du blog
    //   - is_public   : booléen indiquant si le blog est visible publiquement
    //   - status      : statut du blog ('active' par défaut si non fourni)
    //
    // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
    insert(blog) {
        // Requête INSERT paramétrée pour insérer un nouveau blog.
        // Le `status` utilise la valeur fournie ou 'active' si absente.
        return this.database.query(
            `INSERT INTO ${this.table} (owner_id, theme_id, name, slug, description, is_public, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                // owner_id : référence à l'utilisateur propriétaire
                blog.owner_id,
                // theme_id : référence au thème visuel choisi
                blog.theme_id,
                // name : nom lisible du blog
                blog.name,
                // slug : identifiant unique dans l'URL (ex: /blogs/mon-blog)
                blog.slug,
                // description : présentation textuelle du blog
                blog.description,
                // is_public : true = visible sans connexion, false = accès restreint
                blog.is_public,
                // status : 'active' par défaut si le champ n'est pas fourni
                blog.status || "active",
            ]
        );
    }

    // update(blog) : met à jour les métadonnées d'un blog existant.
    //
    // Paramètre `blog` : objet JS avec les mêmes champs qu'à l'insertion
    //   plus le champ `id` pour identifier l'enregistrement à modifier.
    //
    // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
    update(blog) {
        // Requête UPDATE ciblant le blog par son identifiant primaire.
        return this.database.query(
            `UPDATE ${this.table} SET theme_id = ?, name = ?, slug = ?, description = ?, is_public = ?, status = ? WHERE id = ?`, [
                // theme_id : nouveau thème à associer
                blog.theme_id,
                // name : nouveau nom du blog
                blog.name,
                // slug : nouveau slug URL
                blog.slug,
                // description : nouvelle description
                blog.description,
                // is_public : nouvelle visibilité
                blog.is_public,
                // status : nouveau statut ('active', 'inactive', etc.)
                blog.status,
                // id : identifiant du blog à mettre à jour (clause WHERE)
                blog.id,
            ]
        );
    }

    // findByOwner(ownerId) : récupère tous les blogs appartenant à un utilisateur donné.
    //
    // Paramètre :
    //   - ownerId : id de l'utilisateur propriétaire
    //
    // Retour : promesse résolue avec les blogs triés du plus récemment modifié au plus ancien.
    findByOwner(ownerId) {
        // ORDER BY updated_at DESC : affiche d'abord les blogs les plus récemment modifiés.
        return this.database.query(`SELECT * FROM ${this.table} WHERE owner_id = ? ORDER BY updated_at DESC`, [ownerId]);
    }

    // findPublic() : récupère tous les blogs publics et actifs de la plateforme.
    //
    // Aucun paramètre requis.
    // Retour : promesse avec la liste des blogs visibles par tous, triée par date de modification.
    findPublic() {
        // is_public = TRUE : seuls les blogs marqués comme publics.
        // status = 'active' : exclut les blogs suspendus ou archivés.
        return this.database.query(`SELECT * FROM ${this.table} WHERE is_public = TRUE AND status = 'active' ORDER BY updated_at DESC`);
    }

    // findAccessibleByUser(userId) : récupère les blogs auxquels un utilisateur a accès
    // en tant que membre actif (via la table de jointure `blog_members`).
    //
    // Paramètre :
    //   - userId : id de l'utilisateur dont on veut lister les blogs accessibles
    //
    // Retour : promesse résolue avec les blogs et le rôle du membre dans chaque blog.
    findAccessibleByUser(userId) {
        // JOIN blog_members bm : jointure avec la table des membres pour vérifier l'appartenance.
        // bm.status = 'active' : seuls les membres dont l'adhésion est active sont pris en compte.
        // DISTINCT : évite les doublons si plusieurs entrées existent pour un même blog.
        // bm.role AS member_role : expose le rôle de l'utilisateur dans chaque blog.
        return this.database.query(
            `SELECT DISTINCT b.*, bm.role AS member_role
                         FROM ${this.table} b
                         JOIN blog_members bm ON bm.blog_id = b.id
                         WHERE bm.user_id = ? AND bm.status = 'active'
                         ORDER BY b.updated_at DESC`,
            // Paramètre sécurisé : l'id utilisateur remplace le placeholder ?
            [userId]
        );
    }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = BlogManager;
