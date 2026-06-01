const AbstractManager = require("./AbstractManager");
const argon2 = require("argon2");


class UsersManager extends AbstractManager {
  constructor() {
    super({ table: "users" });
  }

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
        Boolean(users.two_factor_enabled)
      ]
    );
  }

  async update(users) {
    const password_hash = await argon2.hash(users.password_hash)
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
        users.id
      ]
    );
  }

  delete(id) {
    return this.database.query(
      `
      DELETE FROM ${this.table} 
      WHERE id = ?
      `, 
      [id]

    );
  }

  findByEmail(email) {
    return this.database.query(
      `
      SELECT * FROM ${this.table} 
      WHERE email = ?
      `, 
      [email]
    );
  }

  findByUsername(username) {
    return this.database.query(
      `
      SELECT * FROM ${this.table} 
      WHERE username = ?
      `, 
      [username]
    );
  }

  findByLogin(login) {
    return this.database.query(
      `
      SELECT * FROM ${this.table} 
      WHERE email = ? OR username = ?
      `,
      [login, login]
    );
  }

  findAuthById(id) {
    return this.database.query(
      `
      SELECT *
      FROM ${this.table}
      WHERE id = ?
      `,
      [id]
    );
  }

  findByProvider(provider, providerId) {
    return this.database.query(
      `
      SELECT *
      FROM ${this.table}
      WHERE auth_provider = ? AND provider_id = ?
      `,
      [provider, providerId]
    );
  }

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

  countActivePlatformAdmins(excludedUserId = null) {
    const params = [];
    let where = "platform_role = 'admin' AND status = 'active' AND is_active = TRUE";

    if (excludedUserId) {
      where += " AND id <> ?";
      params.push(excludedUserId);
    }

    return this.database.query(
      `SELECT COUNT(*) AS count FROM ${this.table} WHERE ${where}`,
      params
    );
  }

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

  updateRole(id, role) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET role = ?, platform_role = ?
      WHERE id = ?
      `,
      [role, role === "admin" ? "admin" : "user", id]
    );
  }

  updateStatus(id, status) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET status = ?, is_active = ?
      WHERE id = ?
      `,
      [status, status === "active", id]
    );
  }

  updateProfile(users) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET username = ?, email = ?, full_name = ?, avatar_url = ?
      WHERE id = ?
      `,
      [users.username, users.email, users.full_name, users.avatar_url || null, users.id]
    );
  }

  updateAvatar(id, avatarUrl) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET avatar_url = ?
      WHERE id = ?
      `,
      [avatarUrl, id]
    );
  }

  updatePasswordHash(id, passwordHash) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET password_hash = ?
      WHERE id = ?
      `,
      [passwordHash, id]
    );
  }

  findSafeById(id) {
    return this.database.query(
      `
      SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at
      FROM ${this.table}
      WHERE id = ?
      `,
      [id]
    );
  }

  findAllSafe() {
    return this.database.query(
      `
      SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active,
        auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at
      FROM ${this.table}
      ORDER BY created_at DESC
      `
    );
  }

  updateLastLogin(id) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET last_login_at = NOW()
      WHERE id = ?
      `,
      [id]
    );
  }

  updateTwoFactorPendingSecret(id, secret) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET two_factor_pending_secret = ?
      WHERE id = ?
      `,
      [secret, id]
    );
  }

  enableTwoFactor(id, secret, recoveryCodes) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET two_factor_enabled = TRUE,
        two_factor_secret = ?,
        two_factor_pending_secret = NULL,
        two_factor_recovery_codes = ?
      WHERE id = ?
      `,
      [secret, JSON.stringify(recoveryCodes), id]
    );
  }

  disableTwoFactor(id) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET two_factor_enabled = FALSE,
        two_factor_secret = NULL,
        two_factor_pending_secret = NULL,
        two_factor_recovery_codes = NULL
      WHERE id = ?
      `,
      [id]
    );
  }

  updateActive(id, isActive) {
    return this.database.query(
      `UPDATE ${this.table} SET is_active = ?, status = ? WHERE id = ?`,
      [isActive, isActive ? "active" : "suspended", id]
    );
  }
}

module.exports = UsersManager;
