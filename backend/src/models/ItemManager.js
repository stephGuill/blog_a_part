const AbstractManager = require("./AbstractManager");

// ItemManager.js
// Manager minimal pour la table `item`. Exemple de pattern Insert/Update simple.
// Utilisé comme référence ou placeholder pour des entités légères.

class ItemManager extends AbstractManager {
  constructor() {
    super({ table: "item" });
  }

  // insert(item): insère un enregistrement avec un `title`
  insert(item) {
    return this.database.query(`INSERT INTO ${this.table} (title) VALUES (?)`, [item.title]);
  }

  // update(item): met à jour le `title` d'un enregistrement existant
  update(item) {
    return this.database.query(`UPDATE ${this.table} SET title = ? WHERE id = ?`, [item.title, item.id]);
  }
}

module.exports = ItemManager;
