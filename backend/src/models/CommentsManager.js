const AbstractManager = require("./AbstractManager");

// CommentsManager.js
// Manager pour la table `comments`.
// Ajout de commentaires ligne-par-ligne pour expliquer les requêtes.

class CommentsManager extends AbstractManager {
    constructor() {
        // Indiquer la table 'comments' au constructeur parent
        super({ table: "comments" });
    }

    // insert(comment) : ajoute un commentaire
    insert(comment) {
        // Utilise parent_id si fourni, sinon NULL
        // Le champ `status` est utile pour le workflow de modération (ex: 'pending', 'approved', 'spam')
        // Retour : promesse contenant l'insert (insertId possible)
        return this.database.query(
            `INSERT INTO ${this.table} (post_id, parent_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [comment.post_id, comment.parent_id || null, comment.author_name, comment.author_email, comment.content, comment.status || "pending"]
        );
    }

    // update(comment) : met à jour le contenu et/ou le statut
    update(comment) {
        return this.database.query(`UPDATE ${this.table} SET content = ?, status = ? WHERE id = ?`, [comment.content, comment.status, comment.id]);
    }

    // findByPost(postId) : récupère uniquement les commentaires approuvés pour affichage
    findByPost(postId) {
        // Trie par date de création pour afficher les commentaires dans l'ordre chronologique
        return this.database.query(`SELECT * FROM ${this.table} WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC`, [postId]);
    }

    // findPending() : liste de modération des commentaires en attente
    findPending() {
        return this.database.query(`SELECT * FROM ${this.table} WHERE status = 'pending' ORDER BY created_at DESC`);
    }

    // findWithPostAndBlog(id) : récupère un commentaire enrichi du contexte post/blog
    findWithPostAndBlog(id) {
        return this.database.query(
            `SELECT c.*, p.blog_id, b.owner_id AS blog_owner_id FROM ${this.table} c JOIN posts p ON p.id = c.post_id JOIN blogs b ON b.id = p.blog_id WHERE c.id = ?`,
            [id]
        );
    }
}

module.exports = CommentsManager;



  



