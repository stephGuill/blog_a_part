const AbstractManager = require("./AbstractManager");
const argon2 = require("argon2");

// UsersManager.js
// Manager responsable des opérations CRUD et utilitaires sur la table `users`.
// Chaque méthode retourne une promesse depuis `this.database.query(...)`.
// Les commentaires suivants expliquent la responsabilité de chaque méthode
// et le rôle des paramètres passés.

class UsersManager extends AbstractManager {
  // Le constructeur indique la table SQL manipulée ('users')
  constructor() {
    super({ table: "users" });
  }

  // insert(users): insère un nouvel utilisateur.
  // Le paramètre `users` est un objet avec les champs attendus par la table.
  // NOTE: les valeurs par défaut sont gérées côté JS avant l'insertion.
  insert(users) {
    return this.database.query(
      `INSERT INTO ${this.table} 
      (username, email, password_hash, full_name, avatar_url, role, platform_role, status, is_active,
       accepted_terms, accepted_terms_at, accepted_terms_version,
       accepted_privacy, accepted_privacy_at, accepted_privacy_version,
       marketing_consent, cookies_consent,
       auth_provider, provider_id, email_verified, two_factor_enabled) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `,
      [
        users.username,
        users.email,
        users.password_hash,
        users.full_name,
        users.avatar_url || null,
        users.role || "user",
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        users.status || "active",
        users.status ? users.status === "active" : true,
        Boolean(users.accepted_terms),
        users.accepted_terms ? new Date() : null,
        users.accepted_terms_version || null,
        Boolean(users.accepted_privacy),
        users.accepted_privacy ? new Date() : null,
        users.accepted_privacy_version || null,
        Boolean(users.marketing_consent),
        users.cookies_consent ? JSON.stringify(users.cookies_consent) : null,
        users.auth_provider || "local",
        users.provider_id || null,
        Boolean(users.email_verified),
        Boolean(users.two_factor_enabled),
      ]
    );
  }

  // update(users): met à jour un utilisateur existant, en hachant le mot de passe
  // si fourni (ici on hache toujours `users.password_hash` pour simplifier).
  async update(users) {
    const password_hash = await argon2.hash(users.password_hash);
    return this.database.query(
      `
      UPDATE ${this.table}
      SET username = ?, email = ?, password_hash = ?, full_name = ?, avatar_url = ?, role = ?, platform_role = ?, status = ?, is_active = ?
      WHERE id = ?
      `,
      [
        users.username,
        users.email,
        password_hash,
        users.full_name,
        users.avatar_url || null,
        users.role,
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        users.status || "active",
        users.is_active,
        users.id,
      ]
    );
  }

  // delete(id): supprime l'utilisateur par identifiant
  delete(id) {
    return this.database.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findByEmail(email): retourne l'utilisateur correspondant à l'e-mail
  findByEmail(email) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE email = ?`, [email]);
  }

  // findByUsername(username): retourne l'utilisateur correspondant au username
  findByUsername(username) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE username = ?`, [username]);
  }

  // findByLogin(login): recherche par email ou username (utilisé pour la connexion)
  findByLogin(login) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE email = ? OR username = ?`, [login, login]);
  }

  // findAuthById(id): récupère toutes les colonnes pour l'authentification
  findAuthById(id) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findByProvider(provider, providerId): recherche un utilisateur lié à un compte OAuth
  findByProvider(provider, providerId) {
    return this.database.query(
      `SELECT * FROM ${this.table} WHERE auth_provider = ? AND provider_id = ?`,
      [provider, providerId]
    );
  }

  // updateAdmin(users): mise à jour depuis l'interface admin (ne force pas le hash)
  updateAdmin(users) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET username = ?, email = ?, full_name = ?, avatar_url = ?, role = ?, platform_role = ?, status = ?, is_active = ?
      WHERE id = ?
      `,
      [
        users.username,
        users.email,
        users.full_name,
        users.avatar_url || null,
        users.role,
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        users.status || (users.is_active ? "active" : "inactive"),
        users.is_active,
        users.id,
      ]
    );
  }

  // findAdminById(id): retourne uniquement les champs pertinents pour l'admin
  findAdminById(id) {
    return this.database.query(
      `
      SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active,
        auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at
      FROM ${this.table}
      WHERE id = ?
      `,
      [id]
    );
  }

  // countActivePlatformAdmins : compte les administrateurs de la plateforme
  countActivePlatformAdmins(excludedUserId = null) {
    const params = [];
    let where = "platform_role = 'admin' AND status = 'active' AND is_active = TRUE";

    if (excludedUserId) {
      where += " AND id <> ?";
      params.push(excludedUserId);
    }

    return this.database.query(`SELECT COUNT(*) AS count FROM ${this.table} WHERE ${where}`, params);
  }

  // findAdminUsers : recherche paginée / filtrée pour l'interface admin
  findAdminUsers({ filters, pagination, sorting }) {
    const conditions = [];
    const params = [];
    const search = filters.search ? `%${filters.search.toLowerCase()}%` : "";

    if (search && filters.filterBy === "username") {
      conditions.push("LOWER(username) LIKE ?");
      params.push(search);
    } else if (search && filters.filterBy === "email") {
      conditions.push("LOWER(email) LIKE ?");
      params.push(search);
    } else if (search && filters.filterBy === "role") {
      conditions.push("LOWER(role) LIKE ?");
      params.push(search);
    } else if (search && filters.filterBy === "status") {
      conditions.push("LOWER(status) LIKE ?");
      params.push(search);
    } else if (search) {
      conditions.push("(LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(role) LIKE ? OR LOWER(status) LIKE ?)");
      params.push(search, search, search, search);
    }

    if (filters.role) {
      conditions.push("role = ?");
      params.push(filters.role);
    }

    if (filters.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (pagination.page - 1) * pagination.limit;
    const baseSelect = `
      SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at
      FROM ${this.table}
      ${whereClause}
      ORDER BY ${sorting.sortBy} ${sorting.sortOrder}
      LIMIT ? OFFSET ?
    `;
    const countSelect = `SELECT COUNT(*) AS total FROM ${this.table} ${whereClause}`;

    return Promise.all([
      this.database.query(baseSelect, [...params, pagination.limit, offset]),
      this.database.query(countSelect, params),
    ]);
  }

  // updateRole : met à jour le rôle et la colonne platform_role associée
  updateRole(id, role) {
    return this.database.query(
      `UPDATE ${this.table} SET role = ?, platform_role = ? WHERE id = ?`,
      [role, role === "admin" ? "admin" : "user", id]
    );
  }

  // updateStatus : met à jour le statut (active/suspended)
  updateStatus(id, status) {
    return this.database.query(`UPDATE ${this.table} SET status = ?, is_active = ? WHERE id = ?`, [status, status === "active", id]);
  }

  // updateProfile : mise à jour du profil utilisateur (auto-éditable)
  updateProfile(users) {
    return this.database.query(
      `UPDATE ${this.table} SET username = ?, email = ?, full_name = ?, avatar_url = ? WHERE id = ?`,
      [users.username, users.email, users.full_name, users.avatar_url || null, users.id]
    );
  }

  // updateAvatar : met à jour l'URL d'avatar
  updateAvatar(id, avatarUrl) {
    return this.database.query(`UPDATE ${this.table} SET avatar_url = ? WHERE id = ?`, [avatarUrl, id]);
  }

  // updatePasswordHash : remplace le hash du mot de passe (déjà haché)
  updatePasswordHash(id, passwordHash) {
    return this.database.query(`UPDATE ${this.table} SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
  }

  // findSafeById : récupère les informations non sensibles pour affichage
  findSafeById(id) {
    return this.database.query(
      `SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at FROM ${this.table} WHERE id = ?`,
      [id]
    );
  }

  // findAllSafe : liste des utilisateurs avec champs non sensibles
  findAllSafe() {
    return this.database.query(
      `SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at FROM ${this.table} ORDER BY created_at DESC`
    );
  }

  // updateLastLogin : enregistre la dernière date de connexion
  updateLastLogin(id) {
    return this.database.query(`UPDATE ${this.table} SET last_login_at = NOW() WHERE id = ?`, [id]);
  }

  // updateTwoFactorPendingSecret : stocke temporairement le secret 2FA
  updateTwoFactorPendingSecret(id, secret) {
    return this.database.query(`UPDATE ${this.table} SET two_factor_pending_secret = ? WHERE id = ?`, [secret, id]);
  }

  // enableTwoFactor : active la 2FA et stocke le secret + codes de récupération
  enableTwoFactor(id, secret, recoveryCodes) {
    return this.database.query(
      `UPDATE ${this.table} SET two_factor_enabled = TRUE, two_factor_secret = ?, two_factor_pending_secret = NULL, two_factor_recovery_codes = ? WHERE id = ?`,
      [secret, JSON.stringify(recoveryCodes), id]
    );
  }

  // disableTwoFactor : désactive la 2FA pour l'utilisateur
  disableTwoFactor(id) {
    return this.database.query(`UPDATE ${this.table} SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_pending_secret = NULL, two_factor_recovery_codes = NULL WHERE id = ?`, [id]);
  }

  // updateActive : active/désactive un utilisateur et met à jour le statut
  updateActive(id, isActive) {
    return this.database.query(`UPDATE ${this.table} SET is_active = ?, status = ? WHERE id = ?`, [isActive, isActive ? "active" : "suspended", id]);
  }
}

module.exports = UsersManager;
