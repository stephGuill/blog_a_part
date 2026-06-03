// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// ThemesManager.js
// Manager pour la table `themes`.
// Responsabilité : créer et mettre à jour les thèmes visuels disponibles sur la plateforme.
// La colonne `config_json` stocke la configuration du thème sous forme d'objet JSON sérialisé.
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

class ThemesManager extends AbstractManager {
  // Constructeur : déclare la table `themes` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "themes" });
  }

  // insert(themes) : insère un nouveau thème dans la table.
  //
  // Paramètre `themes` : objet JS avec les propriétés suivantes :
  //   - name        : nom affiché du thème (ex: "Dark Modern")
  //   - type        : catégorie du thème (ex: 'blog', 'portfolio', 'landing')
  //   - description : description textuelle du thème
  //   - config_json : objet JS contenant les paramètres visuels du thème (couleurs, polices, etc.)
  //                   Sera sérialisé en chaîne JSON avant insertion.
  //   - preview_url : URL d'une image d'aperçu du thème
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(themes) {
    // Si config_json est un objet JS, le convertir en chaîne JSON avant de le stocker.
    // Si config_json est null ou undefined, stocker null en base.
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    // Requête INSERT paramétrée avec 5 colonnes et leurs valeurs correspondantes.
    return this.database.query(`INSERT INTO ${this.table} (name, type, description, config_json, preview_url) VALUES (?, ?, ?, ?, ?)`, [themes.name, themes.type, themes.description, configJsonValue, themes.preview_url]);
  }

  // update(themes) : met à jour un thème existant dans la table.
  //
  // Paramètre `themes` : même structure que pour insert, plus le champ :
  //   - id : identifiant du thème à modifier (clause WHERE)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  update(themes) {
    // Sérialiser config_json si c'est un objet JS, sinon null.
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    // SET : mise à jour de tous les champs modifiables du thème.
    // WHERE id = ? : cible précisément le thème à mettre à jour.
    return this.database.query(`UPDATE ${this.table} SET name = ?, type = ?, description = ?, config_json = ?, preview_url = ? WHERE id = ?`, [themes.name, themes.type, themes.description, configJsonValue, themes.preview_url, themes.id]);
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = ThemesManager;