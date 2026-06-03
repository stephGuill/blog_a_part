// AbstractManager.js
// Classe de base (classe abstraite) pour tous les managers du projet.
// Un "manager" est un objet d'accès aux données (DAO) qui encapsule
// les requêtes SQL pour une table donnée.
//
// Pattern utilisé :
// - Héritage ES6 : chaque manager spécialisé étend cette classe avec `extends`.
// - Injection de dépendance : `setDatabase(database)` reçoit le pool MySQL.
// - `database.query(sql, params)` : méthode du pool mysql2/promise qui exécute
//   une requête préparée (paramétrée) et retourne une promesse.
//
// Conventions attendues :
// - `setDatabase(database)` attend un objet exposant `query(sql, params)`.
// - `database.query(...)` retourne une promesse (mysql2/promise).
//   La valeur résolue peut être `[rows, fields]` selon l'adaptateur.

class AbstractManager {
  // Constructeur : reçoit un objet d'options avec le nom de la table SQL.
  // `options.table` : nom de la table SQL manipulée par le manager.
  constructor({ table }) {
    // Stocker le nom de la table comme propriété d'instance.
    // Utilisé dans toutes les méthodes pour construire des requêtes dynamiques.
    this.table = table;
  }

  // find(id) : récupère une seule ligne par sa clé primaire.
  // Paramètre :
  //   - id : valeur numérique ou chaîne de la colonne `id`.
  // Retour : promesse résolue avec le tableau de lignes correspondantes.
  find(id) {
    // Utiliser un placeholder (?) pour sécuriser la valeur `id` contre l'injection SQL.
    // Le tableau `[id]` contient les valeurs à substituer aux placeholders.
    return this.database.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findAll() : récupère toutes les lignes de la table sans filtre ni tri.
  // Attention : peut être volumineux sur de grandes tables.
  // Retour : promesse résolue avec toutes les lignes.
  findAll() {
    // Aucun paramètre nécessaire pour un SELECT * sans condition.
    return this.database.query(`SELECT * FROM ${this.table}`);
  }

  // delete(id) : supprime physiquement une ligne identifiée par sa clé primaire.
  // Paramètre :
  //   - id : identifiant primaire de la ligne à supprimer.
  // Retour : promesse résolue avec le résultat DELETE (affectedRows).
  delete(id) {
    // Requête paramétrée pour supprimer de manière sûre en évitant l'injection SQL.
    return this.database.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  // setDatabase(database) : injecte le pool ou la connexion MySQL utilisé pour les requêtes.
  // Paramètre :
  //   - database : objet exposant une méthode `.query(sql, params)` retournant une promesse.
  // Note : on stocke uniquement la référence ; la gestion de la connexion réelle
  // est déléguée à l'objet `database` (généralement un pool mysql2/promise).
  setDatabase(database) {
    // Stocker la référence du pool/connexion pour l'utiliser dans toutes les méthodes.
    this.database = database;
  }
}

// Exporter la classe pour qu'elle soit disponible via require() dans les autres managers.
module.exports = AbstractManager;
