const AbstractManager = require("./AbstractManager");

// ItemManager.js
// Manager générique pour une table `item` (exemple minimal).
// Fournit insert et update pour la colonne `title`.

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
