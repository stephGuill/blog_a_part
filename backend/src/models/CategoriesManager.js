const AbstractManager = require("./AbstractManager");

class categoriesManager extends AbstractManager {
  constructor() {
    super({ table: "categories" });
  }

  insert(categories) {
    return this.database.query(`INSERT INTO ${this.table} (title) VALUES (?)`, [
      categories.title,
    ]);
  }

  update(categories) {
    return this.database.query(
      `UPDATE ${this.table} SET title = ? WHERE id = ?`,
      [categories.title, categories.id]
    );
  }
}

module.exports = categoriesManager;
