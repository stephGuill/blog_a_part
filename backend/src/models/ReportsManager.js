const AbstractManager = require("./AbstractManager");

// ReportsManager.js
// Manager pour la table `reports` (signalements).
// Fournit insert, findByBlog et updateStatus avec commentaires ligne-par-ligne.

class ReportsManager extends AbstractManager {
  constructor() {
    // Indiquer la table 'reports'
    super({ table: "reports" });
  }

  // insert(report) : ajoute un signalement dans la table
  insert(report) {
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, reporter_user_id, target_type, target_id, reason, details, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [report.blog_id || null, report.reporter_user_id || null, report.target_type, report.target_id, report.reason, report.details || null, report.status || "pending"]
    );
  }

  // findByBlog(blogId) : récupère les signalements d'un blog triés par date
  findByBlog(blogId) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE blog_id = ? ORDER BY created_at DESC`, [blogId]);
  }

  // updateStatus(id, status, reviewerId) : met à jour le statut et qui a revu
  updateStatus(id, status, reviewerId) {
    return this.database.query(`UPDATE ${this.table} SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`, [status, reviewerId, id]);
  }
}

module.exports = ReportsManager;
