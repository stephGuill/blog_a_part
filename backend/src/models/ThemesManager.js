const AbstractManager = require("./AbstractManager");

class ThemesManager extends AbstractManager {
  constructor() {
    super({ table: "themes" });
  }

  insert(themes) {
       // On transforme l'objet JavaScript config_json en vraie chaîne JSON pour MySQL
    const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    return this.database.query(`INSERT INTO ${this.table} (name, type, description, config_json, preview_url) VALUES (?, ?, ?, ?, ?)`, [
      themes.name,
      themes.type,
      themes.description,
      configJsonValue,
      themes.preview_url,
    ]);
  }

  update(themes) {
     const configJsonValue = themes.config_json ? JSON.stringify(themes.config_json) : null;
    return this.database.query(
      `UPDATE ${this.table} SET name = ?, type = ?, description = ?, config_json = ?, preview_url = ? WHERE id = ?`,
      [
        themes.name,
        themes.type,
        themes.description,
        configJsonValue,
        themes.preview_url,
        themes.id
      ]
    );
  }
}

module.exports = ThemesManager;