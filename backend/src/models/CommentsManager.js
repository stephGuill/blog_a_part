const AbstractManager = require("./AbstractManager"); 

class commentsManager extends AbstractManager{
    constructor(){
        super({table: "comments"});
    }

    insert(comment) {
        return this.database.query(
        `INSERT INTO ${this.table} (post_id, parent_id, author_name, author_email, content, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [comment.post_id,comment.parent_id || null, comment.author_name, comment.author_email, comment.content, comment.status || "pending",]
    );
  }

    update(comment) {
        return this.database.query(
            `UPDATE ${this.table} SET content = ?, status = ? WHERE id = ?`,
            [comment.content, comment.status, comment.id]
        );
    }

    findByPost(postId) {
        return this.database.query(
            `SELECT * FROM ${this.table} WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC`,
        [postId]
    );
    }
    findPending() {
        return this.database.query(
            `SELECT * FROM ${this.table} WHERE status = 'pending' ORDER BY created_at DESC`
    );
  }

    findWithPostAndBlog(id) {
        return this.database.query(
            `SELECT c.*, p.blog_id, b.owner_id AS blog_owner_id
             FROM ${this.table} c
             JOIN posts p ON p.id = c.post_id
             JOIN blogs b ON b.id = p.blog_id
             WHERE c.id = ?`,
            [id]
        );
    }
}


module.exports = commentsManager;



  



