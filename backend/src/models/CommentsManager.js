const AbstractManager = require("./AbstractManager");

// CommentsManager.js
// Manager pour la table `comments`. Gère insertion, mise à jour et requêtes
// spécifiques (par article, en attente, ou avec contexte post/blog).

class CommentsManager extends AbstractManager {
    constructor() {
        super({ table: "comments" });
    }

    // insert(comment): ajoute un commentaire (parent_id facultatif)
    insert(comment) {
        return this.database.query(
            `INSERT INTO ${this.table} (post_id, parent_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [comment.post_id, comment.parent_id || null, comment.author_name, comment.author_email, comment.content, comment.status || "pending"]
        );
    }

    // update(comment): modifie le contenu ou le statut d'un commentaire
    update(comment) {
        return this.database.query(`UPDATE ${this.table} SET content = ?, status = ? WHERE id = ?`, [comment.content, comment.status, comment.id]);
    }

    // findByPost(postId): récupère les commentaires approuvés pour un post
    findByPost(postId) {
        return this.database.query(`SELECT * FROM ${this.table} WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC`, [postId]);
    }

    // findPending(): liste les commentaires en attente de modération
    findPending() {
        return this.database.query(`SELECT * FROM ${this.table} WHERE status = 'pending' ORDER BY created_at DESC`);
    }

    // findWithPostAndBlog(id): récupère un commentaire avec les infos du post et du blog
    findWithPostAndBlog(id) {
        return this.database.query(
            `SELECT c.*, p.blog_id, b.owner_id AS blog_owner_id FROM ${this.table} c JOIN posts p ON p.id = c.post_id JOIN blogs b ON b.id = p.blog_id WHERE c.id = ?`,
            [id]
        );
    }
}

module.exports = CommentsManager;



  



