const AbstractManager = require("./AbstractManager");

// BlogMembersManager.js
// Manager pour la table `blog_members` gérant les rôles des utilisateurs
// au sein d'un blog (insertion, mise à jour, requêtes utilitaires).

class BlogMembersManager extends AbstractManager {
  constructor() {
    super({ table: "blog_members" });
  }

  // insert(member): ajoute un membre au blog
  insert(member) {
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, user_id, role, status) VALUES (?, ?, ?, ?)`,
      [member.blog_id, member.user_id, member.role, member.status || "active"]
    );
  }

  // upsert(member): insère ou met à jour le rôle si la paire (blog_id,user_id) existe
  upsert(member) {
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, user_id, role, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE role = VALUES(role), status = VALUES(status)`,
      [member.blog_id, member.user_id, member.role, member.status || "active"]
    );
  }

  // findActiveByUserAndBlog: vérifie si l'utilisateur est membre actif d'un blog
  findActiveByUserAndBlog(userId, blogId) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE user_id = ? AND blog_id = ? AND status = 'active'`, [userId, blogId]);
  }

  // findByBlog: liste les membres d'un blog avec infos utilisateur
  findByBlog(blogId) {
    return this.database.query(
      `SELECT bm.*, u.username, u.email, u.full_name FROM ${this.table} bm JOIN users u ON u.id = bm.user_id WHERE bm.blog_id = ? ORDER BY bm.role, u.username`,
      [blogId]
    );
  }

  // findByUser: liste les blogs accessibles par un utilisateur
  findByUser(userId) {
    return this.database.query(
      `SELECT bm.*, b.name AS blog_name, b.slug AS blog_slug FROM ${this.table} bm JOIN blogs b ON b.id = bm.blog_id WHERE bm.user_id = ? AND bm.status = 'active' ORDER BY b.updated_at DESC`,
      [userId]
    );
  }

  // updateRole: change le rôle d'un membre et remet le statut à 'active'
  updateRole(blogId, userId, role) {
    return this.database.query(`UPDATE ${this.table} SET role = ?, status = 'active' WHERE blog_id = ? AND user_id = ?`, [role, blogId, userId]);
  }

  // removeMember: marque le membre comme supprimé (soft-delete)
  removeMember(blogId, userId) {
    return this.database.query(`UPDATE ${this.table} SET status = 'removed' WHERE blog_id = ? AND user_id = ?`, [blogId, userId]);
  }
}

module.exports = BlogMembersManager;
