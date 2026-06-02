// AbstractManager.js
// Classe de base pour les managers (Data Access Objects).
// Fournit des méthodes utilitaires communes (`find`, `findAll`, `delete`) et
// une méthode `setDatabase` pour injecter le pool/connexion MySQL.
//
// Conventions attendues :
// - `setDatabase(database)` attend un objet exposant `query(sql, params)`;
// - `database.query(...)` retourne une promesse (par ex. mysql2/promise)
//   qui résout le résultat de la requête. Selon l'adaptateur, la forme
//   résolue peut être `[rows, fields]` ou `rows` — les callers gèrent cela.

class AbstractManager {
  // `options.table` : nom de la table SQL manipulée par le manager
  constructor({ table }) {
    // stocker le nom de la table pour construire des requêtes dynamiques
    this.table = table;
  }

  // find(id) : récupère une ligne par identifiant primaire
  // - id : valeur de la colonne id
  // Retour : promesse renvoyée par `this.database.query(...)` contenant les lignes
  find(id) {
    // Utiliser un placeholder (?) pour sécuriser la valeur `id` contre l'injection SQL
    return this.database.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findAll() : récupère toutes les lignes de la table (sans filtre)
  // Retour : promesse avec toutes les lignes (potentiellement volumineux)
  findAll() {
    // Pas de paramètres pour cette requête
    return this.database.query(`SELECT * FROM ${this.table}`);
  }

  // delete(id) : suppression d'une ligne par id
  // - id : identifiant primaire de la ligne à supprimer
  delete(id) {
    // Requête paramétrée pour supprimer de manière sûre
    return this.database.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  // setDatabase(database) : injecte le pool/connexion utilisé pour les queries
  // - database doit exposer une méthode `.query(sql, params)`
  // Note : on stocke seulement la référence ; la connexion réelle est gérée
  // par l'objet `database` (souvent un pool mysql2/promise).
  setDatabase(database) {
    // On stocke la référence pour les appels ultérieurs
    this.database = database;
  }
}

module.exports = AbstractManager;
