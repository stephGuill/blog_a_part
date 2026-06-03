// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// ItemManager.js
// Manager minimal pour la table `item`.
// Responsabilité : gérer les opérations CRUD de base pour des entités légères
// ne possédant qu'un champ `title`.
//
// Ce manager sert de référence ou de placeholder pour des entités simples.
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

class ItemManager extends AbstractManager {
  // Constructeur : déclare la table `item` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "item" });
  }

  // insert(item) : insère un nouvel enregistrement avec un champ `title`.
  //
  // Paramètre `item` : objet JS avec la propriété suivante :
  //   - title : libellé de l'item à insérer
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(item) {
    // Requête paramétrée : le placeholder (?) est remplacé par item.title.
    return this.database.query(`INSERT INTO ${this.table} (title) VALUES (?)`, [item.title]);
  }

  // update(item) : met à jour le champ `title` d'un enregistrement existant.
  //
  // Paramètre `item` : objet JS avec les propriétés suivantes :
  //   - title : nouveau libellé de l'item
  //   - id    : identifiant de l'item à modifier (clause WHERE)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  update(item) {
    // SET title = ? : seul le titre est modifié.
    // WHERE id = ? : cible l'enregistrement à mettre à jour sans affecter les autres.
    return this.database.query(`UPDATE ${this.table} SET title = ? WHERE id = ?`, [item.title, item.id]);
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = ItemManager;
