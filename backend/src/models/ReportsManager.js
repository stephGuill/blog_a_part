// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// ReportsManager.js
// Manager pour la table `reports` (signalements de contenu).
// Responsabilité : enregistrer les signalements soumis par les utilisateurs,
// les lister par blog et mettre à jour leur statut de traitement.
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

class ReportsManager extends AbstractManager {
  // Constructeur : déclare la table `reports` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "reports" });
  }

  // insert(report) : ajoute un nouveau signalement dans la table.
  //
  // Paramètre `report` : objet JS avec les propriétés suivantes :
  //   - blog_id          : id du blog concerné par le signalement (peut être null)
  //   - reporter_user_id : id de l'utilisateur qui signale (peut être null si anonyme)
  //   - target_type      : type de la ressource signalée (ex: 'post', 'comment', 'user')
  //   - target_id        : id de la ressource signalée
  //   - reason           : motif du signalement (ex: 'spam', 'inappropriate', 'harassment')
  //   - details          : description complémentaire fournie par le signalant (peut être null)
  //   - status           : état du traitement ('pending' par défaut si non fourni)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(report) {
    // Requête INSERT paramétrée avec 7 colonnes et 7 placeholders.
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, reporter_user_id, target_type, target_id, reason, details, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      // blog_id et reporter_user_id peuvent être null (signalement sans blog ou anonyme).
      // details peut être null si l'utilisateur n'a pas fourni de précision.
      // status vaut 'pending' par défaut : le signalement attend traitement.
      [report.blog_id || null, report.reporter_user_id || null, report.target_type, report.target_id, report.reason, report.details || null, report.status || "pending"]
    );
  }

  // findByBlog(blogId) : récupère tous les signalements associés à un blog donné.
  //
  // Paramètre :
  //   - blogId : id du blog dont on veut les signalements
  //
  // Retour : promesse résolue avec les signalements triés du plus récent au plus ancien.
  findByBlog(blogId) {
    // ORDER BY created_at DESC : les signalements récents apparaissent en premier
    // pour faciliter leur traitement par priorité temporelle.
    return this.database.query(`SELECT * FROM ${this.table} WHERE blog_id = ? ORDER BY created_at DESC`, [blogId]);
  }

  // updateStatus(id, status, reviewerId) : met à jour le statut de traitement d'un signalement.
  //
  // Paramètres :
  //   - id         : identifiant du signalement à mettre à jour
  //   - status     : nouveau statut (ex: 'reviewed', 'dismissed', 'actioned')
  //   - reviewerId : id de l'administrateur ou modérateur qui a traité le signalement
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateStatus(id, status, reviewerId) {
    // SET status = ?       : nouveau statut de traitement.
    // SET reviewed_by = ?  : enregistre l'id du modérateur responsable.
    // SET reviewed_at = NOW() : horodatage automatique de la révision via la fonction SQL NOW().
    // WHERE id = ?         : cible précisément le signalement à mettre à jour.
    return this.database.query(`UPDATE ${this.table} SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?`, [status, reviewerId, id]);
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = ReportsManager;
