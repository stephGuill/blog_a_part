// AbstractManager.js
// Classe de base pour les managers (Data Access Objects).
// Fournit des méthodes utilitaires communes (find, findAll, delete) et une
// méthode `setDatabase` pour injecter le pool/connexion MySQL.

class AbstractManager {
  // `options.table` : nom de la table SQL manipulée par le manager
  constructor({ table }) {
    this.table = table; // stocker le nom de la table pour construire des requêtes
  }

  // find : récupère une ligne par id
  // retourne une promesse résolue par `this.database.query(...)`
  find(id) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findAll : récupère toutes les lignes de la table
  findAll() {
    return this.database.query(`SELECT * FROM ${this.table}`);
  }

  // delete : supprime une ligne par id
  delete(id) {
    return this.database.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  // setDatabase : injecte le pool/connexion pour que les méthodes puissent
  // exécuter des requêtes (this.database doit exposer `.query`)
  setDatabase(database) {
    this.database = database;
  }
}

module.exports = AbstractManager;
