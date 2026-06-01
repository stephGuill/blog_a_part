const AbstractManager = require("./AbstractManager");

// AuditLogsManager.js
// Manager pour la table `audit_logs`. Permet d'enregistrer des événements
// de type audit (qui a fait quoi, sur quel objet, ancien/nouvelles valeurs, meta).

class AuditLogsManager extends AbstractManager {
  constructor() {
    super({ table: "audit_logs" });
  }

  // insert(log): ajoute une entrée d'audit
  // log: { actor_user_id, target_type, target_id, action, old_values, new_values, metadata_json, ip_address, user_agent, bulk_action_id }
  insert(log) {
    return this.database.query(
      `INSERT INTO ${this.table} (actor_user_id, target_type, target_id, action, old_values, new_values, metadata_json, ip_address, user_agent, bulk_action_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        log.actor_user_id || null,
        log.target_type,
        log.target_id || null,
        log.action,
        log.old_values ? JSON.stringify(log.old_values) : null,
        log.new_values ? JSON.stringify(log.new_values) : null,
        log.metadata_json ? JSON.stringify(log.metadata_json) : null,
        log.ip_address || null,
        log.user_agent || null,
        log.bulk_action_id || null,
      ]
    );
  }
}

module.exports = AuditLogsManager;
