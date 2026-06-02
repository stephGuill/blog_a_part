const AbstractManager = require("./AbstractManager");

// ThemesManager.js
// Manager pour la table `themes`.
// Gère la sérialisation de `config_json` et les opérations insert/update.

class ThemesManager extends AbstractManager {
  constructor() {
    // Indiquer la table 'themes' au constructeur parent
    super({ table: "themes" });
  }

  // insert(themes) : insère un nouveau thème
  insert(themes) {
    // Si config_json est un objet JS, le convertir en chaîne JSON
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    return this.database.query(`INSERT INTO ${this.table} (name, type, description, config_json, preview_url) VALUES (?, ?, ?, ?, ?)`, [themes.name, themes.type, themes.description, configJsonValue, themes.preview_url]);
  }

  // update(themes) : met à jour un thème existant
  update(themes) {
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    return this.database.query(`UPDATE ${this.table} SET name = ?, type = ?, description = ?, config_json = ?, preview_url = ? WHERE id = ?`, [themes.name, themes.type, themes.description, configJsonValue, themes.preview_url, themes.id]);
  }
}

module.exports = ThemesManager;