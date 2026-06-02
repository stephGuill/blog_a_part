const AbstractManager = require("./AbstractManager");
// Importer la lib `argon2` pour le hachage sécurisé des mots de passe
const argon2 = require("argon2");

// Remarques importantes sur le hachage :
// - La méthode `insert` suppose que la valeur `users.password_hash` est
//   déjà fournie sous forme de hash (ex: workflow d'inscription qui a
//   pré-haché le mot de passe). En revanche, `update` appelle
//   `argon2.hash(...)` sur `users.password_hash` — donc `update` re-hachera
//   la valeur fournie. Assurez-vous que les appels de l'application
//   sont cohérents (envoyer le mot de passe en clair à `update` n'est
//   habituel que si vous voulez forcer le changement de mot de passe).

// UsersManager.js
// Manager responsable des opérations CRUD et utilitaires sur la table `users`.
// Ici nous ajoutons des commentaires ligne-par-ligne pour expliquer chaque
// opération, les paramètres passés et la forme des requêtes SQL.

class UsersManager extends AbstractManager {
  // Constructeur : on indique la table SQL manipulée par ce manager
  constructor() {
    // Appel du constructeur parent (AbstractManager) avec le nom de la table
    super({ table: "users" });
  }

  // insert(users): insère un nouvel utilisateur.
  // - `users` est un objet JavaScript contenant les champs attendus.
  // - La requête utilise des paramètres (?) pour éviter les injections SQL.
  insert(users) {
    // Exécution d'une requête parametrée : le premier argument est la requête
    // SQL (avec placeholders), le second argument est le tableau des valeurs.
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
        // username : chaîne affichée (unique en logique applicative)
        users.username,
        // email : adresse e-mail de l'utilisateur
        users.email,
        // password_hash : le hash du mot de passe (déjà fourni ici)
        users.password_hash,
        // full_name : nom complet (optionnel)
        users.full_name,
        // avatar_url : URL de l'avatar ou null
        users.avatar_url || null,
        // role : rôle applicatif (par défaut 'user')
        users.role || "user",
        // platform_role : rôle sur la plateforme (par défaut basé sur role)
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        // status : statut utilisateur (ex: 'active')
        users.status || "active",
        // is_active : booléen coïncidant avec le statut
        users.status ? users.status === "active" : true,
        // accepted_terms : bool
        Boolean(users.accepted_terms),
        // accepted_terms_at : date d'acceptation ou null
        users.accepted_terms ? new Date() : null,
        // accepted_terms_version : version des TOS acceptées
        users.accepted_terms_version || null,
        // accepted_privacy : bool
        Boolean(users.accepted_privacy),
        // accepted_privacy_at : date d'acceptation ou null
        users.accepted_privacy ? new Date() : null,
        // accepted_privacy_version : version de la politique de confidentialité
        users.accepted_privacy_version || null,
        // marketing_consent : bool
        Boolean(users.marketing_consent),
        // cookies_consent : stocké comme JSON optionnel
        users.cookies_consent ? JSON.stringify(users.cookies_consent) : null,
        // auth_provider : 'local' ou fournisseur OAuth
        users.auth_provider || "local",
        // provider_id : id du compte fournisseur si applicable
        users.provider_id || null,
        // email_verified : bool
        Boolean(users.email_verified),
        // two_factor_enabled : bool
        Boolean(users.two_factor_enabled),
      ]
    );
  }

  // update(users): met à jour un utilisateur existant.
  // On hache le mot de passe reçu via argon2 pour sécurité avant stockage.
  async update(users) {
    // Hacher le mot de passe en utilisant argon2 (coûteux mais sûr)
    const password_hash = await argon2.hash(users.password_hash);
    // Exécuter la requête UPDATE avec les valeurs mises à jour
    return this.database.query(
      `
      UPDATE ${this.table}
      SET username = ?, email = ?, password_hash = ?, full_name = ?, avatar_url = ?, role = ?, platform_role = ?, status = ?, is_active = ?
      WHERE id = ?
      `,
      [
        // ordre des paramètres correspondant aux placeholders dans la requête
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

  // delete(id) : suppression d'un utilisateur par identifiant
  delete(id) {
    // suppression physique avec paramètre pour éviter injection
    return this.database.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findByEmail(email) : récupère l'utilisateur correspondant à une adresse email
  findByEmail(email) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE email = ?`, [email]);
  }

  // findByUsername(username) : récupère l'utilisateur par username
  findByUsername(username) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE username = ?`, [username]);
  }

  // findByLogin(login) : recherche par email OU username (utile au login)
  findByLogin(login) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE email = ? OR username = ?`, [login, login]);
  }

  // findAuthById(id) : récupère toutes les colonnes pour usage authentification
  findAuthById(id) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findByProvider(provider, providerId) : retrouver un utilisateur via OAuth
  findByProvider(provider, providerId) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE auth_provider = ? AND provider_id = ?`, [provider, providerId]);
  }

  // updateAdmin(users) : mise à jour depuis l'interface admin (sans re-hachage)
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

  // findAdminById(id) : vue limitée pour l'admin (retire les champs sensibles)
  findAdminById(id) {
    return this.database.query(
      `SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at FROM ${this.table} WHERE id = ?`,
      [id]
    );
  }

  // countActivePlatformAdmins(excludedUserId) : compte les admins actifs
  countActivePlatformAdmins(excludedUserId = null) {
    const params = []; // paramètres additionnels pour la requête
    let where = "platform_role = 'admin' AND status = 'active' AND is_active = TRUE";

    // si un id est fourni, on l'exclut du comptage
    if (excludedUserId) {
      where += " AND id <> ?";
      params.push(excludedUserId);
    }

    // exécuter la requête COUNT
    return this.database.query(`SELECT COUNT(*) AS count FROM ${this.table} WHERE ${where}`, params);
  }

  // findAdminUsers : recherche paginée/filtrée pour l'interface admin
  findAdminUsers({ filters, pagination, sorting }) {
    const conditions = [];
    const params = [];
    const search = filters.search ? `%${filters.search.toLowerCase()}%` : "";

    // construire dynamiquement les conditions SQL selon les filtres
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
      // recherche sur plusieurs colonnes
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

    // assembler la clause WHERE si nécessaire
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    // calculer l'offset pour la pagination
    const offset = (pagination.page - 1) * pagination.limit;
    // requête principale pour récupérer les lignes demandées
    const baseSelect = `SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at FROM ${this.table} ${whereClause} ORDER BY ${sorting.sortBy} ${sorting.sortOrder} LIMIT ? OFFSET ?`;
    // requête pour obtenir le total (sans limite)
    const countSelect = `SELECT COUNT(*) AS total FROM ${this.table} ${whereClause}`;

    // lancer les deux requêtes en parallèle et retourner une promesse combinée
    return Promise.all([
      this.database.query(baseSelect, [...params, pagination.limit, offset]),
      this.database.query(countSelect, params),
    ]);
  }

  // updateRole : met à jour le rôle et la colonne platform_role
  updateRole(id, role) {
    return this.database.query(`UPDATE ${this.table} SET role = ?, platform_role = ? WHERE id = ?`, [role, role === "admin" ? "admin" : "user", id]);
  }

  // updateStatus : met à jour le statut et is_active
  updateStatus(id, status) {
    return this.database.query(`UPDATE ${this.table} SET status = ?, is_active = ? WHERE id = ?`, [status, status === "active", id]);
  }

  // updateProfile : mise à jour du profil (champs non sensibles)
  updateProfile(users) {
    return this.database.query(`UPDATE ${this.table} SET username = ?, email = ?, full_name = ?, avatar_url = ? WHERE id = ?`, [users.username, users.email, users.full_name, users.avatar_url || null, users.id]);
  }

  // updateAvatar : met à jour l'URL d'avatar
  updateAvatar(id, avatarUrl) {
    return this.database.query(`UPDATE ${this.table} SET avatar_url = ? WHERE id = ?`, [avatarUrl, id]);
  }

  // updatePasswordHash : remplace le hash du mot de passe
  updatePasswordHash(id, passwordHash) {
    return this.database.query(`UPDATE ${this.table} SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
  }

  // findSafeById : version non sensible des données utilisateur
  findSafeById(id) {
    return this.database.query(`SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findAllSafe : liste des utilisateurs (champs non sensibles)
  findAllSafe() {
    return this.database.query(`SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at FROM ${this.table} ORDER BY created_at DESC`);
  }

  // updateLastLogin : met à jour la date de dernière connexion
  updateLastLogin(id) {
    return this.database.query(`UPDATE ${this.table} SET last_login_at = NOW() WHERE id = ?`, [id]);
  }

  // updateTwoFactorPendingSecret : stocke temporairement le secret 2FA
  updateTwoFactorPendingSecret(id, secret) {
    return this.database.query(`UPDATE ${this.table} SET two_factor_pending_secret = ? WHERE id = ?`, [secret, id]);
  }

  // enableTwoFactor : active la 2FA et enregistre le secret + codes
  enableTwoFactor(id, secret, recoveryCodes) {
    return this.database.query(`UPDATE ${this.table} SET two_factor_enabled = TRUE, two_factor_secret = ?, two_factor_pending_secret = NULL, two_factor_recovery_codes = ? WHERE id = ?`, [secret, JSON.stringify(recoveryCodes), id]);
  }

  // disableTwoFactor : désactive la 2FA pour l'utilisateur
  disableTwoFactor(id) {
    return this.database.query(`UPDATE ${this.table} SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_pending_secret = NULL, two_factor_recovery_codes = NULL WHERE id = ?`, [id]);
  }

  // updateActive : active ou désactive un compte
  updateActive(id, isActive) {
    return this.database.query(`UPDATE ${this.table} SET is_active = ?, status = ? WHERE id = ?`, [isActive, isActive ? "active" : "suspended", id]);
  }
}

module.exports = UsersManager;
