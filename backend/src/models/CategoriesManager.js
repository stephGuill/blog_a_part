// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// CategoriesManager.js
// Manager pour la table `categories`.
// Responsabilité : créer et mettre à jour des catégories de contenu.
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

// Définition de la classe qui hérite des utilitaires d'AbstractManager.
class CategoriesManager extends AbstractManager {
  // Constructeur : indique la table SQL utilisée par ce manager.
  constructor() {
    // Appel du constructeur parent avec l'option { table: 'categories' }.
    // Cela initialise `this.table = 'categories'` utilisé dans les requêtes dynamiques.
    super({ table: "categories" });
  }

  // insert(categories) : insère une nouvelle catégorie dans la table.
  //
  // Paramètre `categories` : objet JS avec la propriété suivante :
  //   - title : libellé de la catégorie (ex: 'Technologie', 'Sport')
  //
  // Retour : promesse résolue avec le résultat INSERT.
  //          La propriété `insertId` du résultat contient l'id généré automatiquement.
  insert(categories) {
    // Requête paramétrée : insère les champs obligatoires blog_id, name, slug et la description optionnelle.
    return this.database.query(
      `INSERT INTO ${this.table} (blog_id, name, slug, description) VALUES (?, ?, ?, ?)`,
      [categories.blog_id, categories.name, categories.slug, categories.description || null]
    );
  }

  // update(categories) : met à jour le titre d'une catégorie existante.
  //
  // Paramètre `categories` : objet JS avec les propriétés suivantes :
  //   - title : nouveau libellé de la catégorie
  //   - id    : identifiant de la catégorie à modifier (clause WHERE)
  //
  // Retour : promesse résolue avec le résultat UPDATE.
  //          La propriété `affectedRows` indique combien de lignes ont été modifiées.
  update(categories) {
    // Met à jour le nom, slug et description d'une catégorie existante.
    return this.database.query(
      `UPDATE ${this.table} SET name = ?, slug = ?, description = ? WHERE id = ?`,
      [categories.name, categories.slug, categories.description || null, categories.id]
    );
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = CategoriesManager;
