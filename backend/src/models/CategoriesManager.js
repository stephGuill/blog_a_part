const AbstractManager = require("./AbstractManager");

// CategoriesManager.js
// Manager pour la table `categories`.
// Les commentaires suivants décrivent chaque ligne clé pour faciliter la lecture.

// Définition de la classe qui hérite des utilitaires d'AbstractManager
class CategoriesManager extends AbstractManager {
  // Constructeur : indique la table SQL utilisée
  constructor() {
    // Appel du constructeur parent avec l'option { table: 'categories' }
    super({ table: "categories" });
  }

  // insert(categories) : insère une nouvelle catégorie dans la table
  insert(categories) {
    // Requête paramétrée : éviter l'injection SQL et fournir la valeur de title
    // Retour : promesse qui résout le résultat de l'insert (ex: insertId)
    return this.database.query(`INSERT INTO ${this.table} (title) VALUES (?)`, [categories.title]);
  }

  // update(categories) : met à jour le titre d'une catégorie existante
  update(categories) {
    // WHERE id = ? pour cibler l'enregistrement à mettre à jour
    // Retour : promesse du résultat UPDATE (affectedRows)
    return this.database.query(`UPDATE ${this.table} SET title = ? WHERE id = ?`, [categories.title, categories.id]);
  }
}

module.exports = CategoriesManager;
