// BlogManager.js
// Manager pour la table `blogs` : création, mise à jour et requêtes publiques/accès.
// Les opérations communes `find`, `findAll`, `delete` sont héritées d'AbstractManager.

const AbstractManager = require("./AbstractManager");

class BlogManager extends AbstractManager {
    constructor() {
        // Indiquer la table 'blogs' au constructeur parent
        super({ table: "blogs" });
    }

    // insert(blog) : crée un nouveau blog. Certains champs sont optionnels.
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
                blog.status || "active",
            ]
        );
    }

    // update(blog) : met à jour les métadonnées d'un blog existant
    update(blog) {
        return this.database.query(
            `UPDATE ${this.table} SET theme_id = ?, name = ?, slug = ?, description = ?, is_public = ?, status = ? WHERE id = ?`, [
                blog.theme_id,
                blog.name,
                blog.slug,
                blog.description,
                blog.is_public,
                blog.status,
                blog.id,
            ]
        );
    }

    // findByOwner(ownerId) : récupère les blogs d'un propriétaire
    findByOwner(ownerId) {
        return this.database.query(`SELECT * FROM ${this.table} WHERE owner_id = ? ORDER BY updated_at DESC`, [ownerId]);
    }

    // findPublic() : blogs publics et actifs
    findPublic() {
        return this.database.query(`SELECT * FROM ${this.table} WHERE is_public = TRUE AND status = 'active' ORDER BY updated_at DESC`);
    }

    // findAccessibleByUser(userId) : blogs où l'utilisateur est membre actif
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
