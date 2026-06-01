const AbstractManager = require("./AbstractManager");

// ReportsManager.js
// Manager pour la table `reports` (signalements). Permet d'insérer des rapports,
// de lister les rapports d'un blog et de mettre à jour leur statut.

class ReportsManager extends AbstractManager {
  constructor() {
    super({ table: "reports" });
  }

  // insert(report): ajoute un signalement
  insert(report) {
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, reporter_user_id, target_type, target_id, reason, details, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [report.blog_id || null, report.reporter_user_id || null, report.target_type, report.target_id, report.reason, report.details || null, report.status || "pending"]
    );
  }

  // findByBlog(blogId): récupère les rapports d'un blog
  findByBlog(blogId) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE blog_id = ? ORDER BY created_at DESC`, [blogId]);
  }

  // updateStatus: met à jour le statut du rapport et enregistre le relecteur
  updateStatus(id, status, reviewerId) {
    return this.database.query(`UPDATE ${this.table} SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`, [status, reviewerId, id]);
  }
}

module.exports = ReportsManager;
