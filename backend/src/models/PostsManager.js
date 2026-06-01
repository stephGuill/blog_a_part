const AbstractManager = require("./AbstractManager");

class postsManager extends AbstractManager {
  constructor() {
    super({ table: "posts" });
  }

  insert(posts) {
    return this.database.query(`INSERT INTO ${this.table} (blog_id, author_id, title, slug, excerpt, content, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      posts.blog_id,
      posts.author_id,
      posts.title,
      posts.slug,
      posts.excerpt,
      posts.content,
      posts.status,
      posts.published_at
    ]);
  }

  update(posts) {
    return this.database.query(
      `UPDATE ${this.table} SET blog_id = ?, author_id = ?, title = ?, slug = ?, excerpt = ?, content = ?, status = ?, published_at = ? WHERE id = ?`,
      [
        posts.blog_id,
        posts.author_id,
        posts.title,
        posts.slug,
        posts.excerpt,
        posts.content,
        posts.status,
        posts.published_at,
        posts.id
      ]
    );
  }

  findWithBlog(id) {
    return this.database.query(
      `SELECT p.*, b.owner_id AS blog_owner_id
       FROM ${this.table} p
       JOIN blogs b ON b.id = p.blog_id
       WHERE p.id = ?`,
      [id]
    );
  }

  findByAuthor(authorId) {
    return this.database.query(
      `SELECT * FROM ${this.table} WHERE author_id = ? ORDER BY updated_at DESC`,
      [authorId]
    );
  }

  findByBlogOwner(ownerId) {
    return this.database.query(
      `SELECT p.*
       FROM ${this.table} p
       JOIN blogs b ON b.id = p.blog_id
       WHERE b.owner_id = ?
       ORDER BY p.updated_at DESC`,
      [ownerId]
    );
  }

  findAccessibleByUser(userId) {
    return this.database.query(
      `SELECT DISTINCT p.*
       FROM ${this.table} p
       JOIN blog_members bm ON bm.blog_id = p.blog_id
       WHERE bm.user_id = ? AND bm.status = 'active'
       ORDER BY p.updated_at DESC`,
      [userId]
    );
  }

  findPublishedPublic() {
    return this.database.query(
      `SELECT p.*
       FROM ${this.table} p
       JOIN blogs b ON b.id = p.blog_id
       WHERE p.status = 'published'
         AND b.is_public = TRUE
         AND b.status = 'active'
       ORDER BY p.published_at DESC, p.updated_at DESC`
    );
  }
}

module.exports = postsManager;
