const AbstractManager = require("./AbstractManager");

// ThemesManager.js
// Manager pour la table `themes`. Transforme `config_json` en chaîne JSON
// et fournit insert/update pour les thèmes réutilisables dans les blogs.

class ThemesManager extends AbstractManager {
  constructor() {
    super({ table: "themes" });
  }

  // insert(themes): insère un thème. `config_json` peut être un objet JS.
  insert(themes) {
    // On transforme l'objet JavaScript config_json en vraie chaîne JSON pour MySQL
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    return this.database.query(
      `INSERT INTO ${this.table} (name, type, description, config_json, preview_url) VALUES (?, ?, ?, ?, ?)`,
      [themes.name, themes.type, themes.description, configJsonValue, themes.preview_url]
    );
  }

  // update(themes): met à jour un thème existant
  update(themes) {
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    return this.database.query(
      `UPDATE ${this.table} SET name = ?, type = ?, description = ?, config_json = ?, preview_url = ? WHERE id = ?`,
      [themes.name, themes.type, themes.description, configJsonValue, themes.preview_url, themes.id]
    );
  }
}

module.exports = ThemesManager;