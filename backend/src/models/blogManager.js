// BlogManager.js
// Ce fichier gère les requêtes SQL pour l'entité blogs en mode orienté objet

const AbstractManager = require("./AbstractManager");

class BlogManager extends AbstractManager {
    constructor() {
        // On précise le nom de la table SQL à utiliser
        super({ table: "blogs" });
    }

    // Crée un nouveau blog
    // Chaque paramètre correspond à une colonne de la table blogs
    insert(blog) {
        // owner_id : id du propriétaire, theme_id : id du thème, name : nom du blog, slug : identifiant unique, description, is_public, status
        return this.database.query(
            `INSERT INTO ${this.table} (owner_id, theme_id, name, slug, description, is_public, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                blog.owner_id,
                blog.theme_id,
                blog.name,
                blog.slug,
                blog.description,
                blog.is_public,
                blog.status || "active"
            ]
        );
    }

    // Met à jour un blog existant
    update(blog) {
        return this.database.query(
            `UPDATE ${this.table} SET theme_id = ?, name = ?, slug = ?, description = ?, is_public = ?, status = ? WHERE id = ?`, [
                blog.theme_id,
                blog.name,
                blog.slug,
                blog.description,
                blog.is_public,
                blog.status,
                blog.id
            ]
        );
    }

    // Les méthodes find, findAll, delete sont héritées d'AbstractManager
    findByOwner(ownerId) {
        return this.database.query(
            `SELECT * FROM ${this.table} WHERE owner_id = ? ORDER BY updated_at DESC`,
            [ownerId]
        );
    }

    findPublic() {
        return this.database.query(
            `SELECT * FROM ${this.table} WHERE is_public = TRUE AND status = 'active' ORDER BY updated_at DESC`
        );
    }

    findAccessibleByUser(userId) {
        return this.database.query(
            `SELECT DISTINCT b.*, bm.role AS member_role
             FROM ${this.table} b
             JOIN blog_members bm ON bm.blog_id = b.id
             WHERE bm.user_id = ? AND bm.status = 'active'
             ORDER BY b.updated_at DESC`,
            [userId]
        );
    }
}

module.exports = BlogManager;
