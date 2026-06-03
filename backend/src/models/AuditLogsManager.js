// Importer la classe de base AbstractManager pour l'héritage.
const AbstractManager = require("./AbstractManager");

// AuditLogsManager.js
// Manager pour la table `audit_logs`.
// Responsabilité : enregistrer chaque événement d'audit (action réalisée,
// par qui, sur quoi, avec quelles valeurs avant/après).
//
// Les colonnes `old_values`, `new_values` et `metadata_json` stockent des
// objets JSON sérialisés afin de conserver l'historique complet des changements.
// La sérialisation est faite ici avec `JSON.stringify()` avant l'insertion.

class AuditLogsManager extends AbstractManager {
  // Constructeur : déclare la table `audit_logs` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table.
    super({ table: "audit_logs" });
  }

  // insert(log) : insère une nouvelle entrée d'audit dans la table.
  //
  // Paramètre `log` : objet contenant les champs suivants :
  //   - actor_user_id    : id de l'utilisateur qui a effectué l'action (peut être null pour une action système)
  //   - target_type      : type de la ressource ciblée (ex: 'user', 'post', 'blog')
  //   - target_id        : id de la ressource ciblée (peut être null)
  //   - action           : nom de l'action effectuée (ex: 'create', 'delete', 'update')
  //   - old_values       : objet JS représentant l'état AVANT la modification (sérialisé en JSON)
  //   - new_values       : objet JS représentant l'état APRÈS la modification (sérialisé en JSON)
  //   - metadata_json    : données contextuelles supplémentaires (sérialisées en JSON)
  //   - ip_address       : adresse IP de l'acteur (peut être null)
  //   - user_agent       : user-agent HTTP de l'acteur (peut être null)
  //   - bulk_action_id   : identifiant de groupe pour les actions en lot (peut être null)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(log) {
    // Exécution de la requête INSERT avec des placeholders (?) pour éviter l'injection SQL.
    return this.database.query(
      // La requête insère toutes les colonnes d'audit en une seule opération.
      `INSERT INTO ${this.table} (actor_user_id, target_type, target_id, action, old_values, new_values, metadata_json, ip_address, user_agent, bulk_action_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        // actor_user_id peut être null lorsque l'action est déclenchée par le système (cron, migration, etc.)
        log.actor_user_id || null,
        // target_type : identifie la nature de la ressource affectée
        log.target_type,
        // target_id : null si l'action ne cible pas un enregistrement précis
        log.target_id || null,
        // action : libellé court décrivant ce qui s'est passé
        log.action,
        // old_values : état avant la modification ; sérialisé en JSON si présent, sinon null
        log.old_values ? JSON.stringify(log.old_values) : null,
        // new_values : état après la modification ; sérialisé en JSON si présent, sinon null
        log.new_values ? JSON.stringify(log.new_values) : null,
        // metadata_json : informations complémentaires (ex: rôle utilisateur, contexte) ; sérialisées en JSON
        log.metadata_json ? JSON.stringify(log.metadata_json) : null,
        // ip_address : adresse IP pour traçabilité ; null si non disponible
        log.ip_address || null,
        // user_agent : chaîne d'identification du navigateur/client HTTP ; null si non disponible
        log.user_agent || null,
        // bulk_action_id : permet de regrouper plusieurs entrées d'audit liées à une même action en lot
        log.bulk_action_id || null,
      ]
    );
  }
}

// Exporter la classe pour utilisation via require() dans le reste de l'application.
module.exports = AuditLogsManager;
