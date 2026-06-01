const AbstractManager = require("./AbstractManager");

// CategoriesManager.js
// Manager pour la table `categories`.
// Fournit des opérations simples d'insertion et de mise à jour.

class CategoriesManager extends AbstractManager {
  // Initialise le manager en précisant la table SQL
  constructor() {
    super({ table: "categories" });
  }

  // insert(categories): insère une catégorie
  // Param: categories { title }
  insert(categories) {
    return this.database.query(`INSERT INTO ${this.table} (title) VALUES (?)`, [categories.title]);
  }

  // update(categories): met à jour le titre d'une catégorie existante
  // Param: categories { id, title }
  update(categories) {
    return this.database.query(`UPDATE ${this.table} SET title = ? WHERE id = ?`, [categories.title, categories.id]);
  }
}

module.exports = CategoriesManager;
