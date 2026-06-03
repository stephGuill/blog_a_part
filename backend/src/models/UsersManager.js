// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");
// Importation de la bibliothèque argon2 pour le hachage sécurisé des mots de passe.
// argon2 est recommandé par OWASP pour le stockage des mots de passe
// car il est résistant aux attaques par force brute et aux attaques GPU.
const argon2 = require("argon2");

// UsersManager.js
// Manager responsable des opérations CRUD et utilitaires sur la table `users`.
//
// Note importante sur la gestion des mots de passe :
// - La méthode `insert` suppose que `users.password_hash` est DÉJÀ haché
//   (le hachage est fait en amont dans le service d'authentification).
// - La méthode `update` appelle `argon2.hash(users.password_hash)` donc elle
//   RE-HACHE la valeur fournie. L'appelant doit passer le mot de passe en clair.
// - Les méthodes comme `updatePasswordHash` et `updateProfile` ne touchent pas au mot de passe.

class UsersManager extends AbstractManager {
  // Constructeur : déclare la table `users` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL manipulée.
    super({ table: "users" });
  }

  // insert(users) : insère un nouvel utilisateur dans la base de données.
  //
  // Paramètre `users` : objet JS contenant tous les champs de l'utilisateur.
  // La requête utilise des paramètres (?) pour éviter les injections SQL.
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(users) {
    // Exécution d'une requête paramétrée : le premier argument est la requête SQL
    // (avec placeholders ?), le second argument est le tableau des valeurs dans l'ordre.
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
        // username : identifiant de connexion unique (affiché publiquement)
        users.username,
        // email : adresse e-mail unique de l'utilisateur
        users.email,
        // password_hash : hash argon2 du mot de passe (déjà haché en amont)
        users.password_hash,
        // full_name : nom complet optionnel (prénom + nom)
        users.full_name,
        // avatar_url : URL de l'avatar de profil ; null si non défini
        users.avatar_url || null,
        // role : rôle applicatif de l'utilisateur ('user' par défaut)
        users.role || "user",
        // platform_role : rôle global sur la plateforme ;
        // si role = 'admin', platform_role = 'admin', sinon 'user'
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        // status : statut du compte ('active', 'inactive', 'suspended', etc.)
        users.status || "active",
        // is_active : booléen dérivé du statut ; true si status = 'active'
        users.status ? users.status === "active" : true,
        // accepted_terms : booléen indiquant l'acceptation des CGU
        Boolean(users.accepted_terms),
        // accepted_terms_at : date d'acceptation des CGU ; null si non acceptées
        users.accepted_terms ? new Date() : null,
        // accepted_terms_version : version des CGU acceptées (ex: "v2.1")
        users.accepted_terms_version || null,
        // accepted_privacy : booléen indiquant l'acceptation de la politique de confidentialité
        Boolean(users.accepted_privacy),
        // accepted_privacy_at : date d'acceptation de la politique ; null si non acceptée
        users.accepted_privacy ? new Date() : null,
        // accepted_privacy_version : version de la politique de confidentialité acceptée
        users.accepted_privacy_version || null,
        // marketing_consent : booléen indiquant le consentement aux communications marketing
        Boolean(users.marketing_consent),
        // cookies_consent : objet JS décrivant les préférences de cookies ; sérialisé en JSON
        users.cookies_consent ? JSON.stringify(users.cookies_consent) : null,
        // auth_provider : fournisseur d'authentification ('local' pour inscription directe, ou nom OAuth)
        users.auth_provider || "local",
        // provider_id : id unique fourni par le fournisseur OAuth ; null pour auth locale
        users.provider_id || null,
        // email_verified : booléen indiquant si l'e-mail a été vérifié
        Boolean(users.email_verified),
        // two_factor_enabled : booléen indiquant si l'authentification à deux facteurs est activée
        Boolean(users.two_factor_enabled),
      ]
    );
  }

  // update(users) : met à jour les informations d'un utilisateur existant.
  // ATTENTION : cette méthode re-hache le mot de passe avec argon2.
  // Passer le mot de passe en clair dans `users.password_hash`.
  //
  // Paramètre `users` : objet JS avec les champs à mettre à jour + le champ `id`.
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  async update(users) {
    // Hacher le mot de passe reçu avec argon2 avant de le stocker.
    // argon2.hash() est une opération asynchrone et coûteuse (intentionnellement)
    // pour résister aux attaques par force brute.
    const password_hash = await argon2.hash(users.password_hash);
    // Exécuter la requête UPDATE avec les nouvelles valeurs.
    return this.database.query(
      `
      UPDATE ${this.table}
      SET username = ?, email = ?, password_hash = ?, full_name = ?, avatar_url = ?, role = ?, platform_role = ?, status = ?, is_active = ?
      WHERE id = ?
      `,
      [
        // Ordre des paramètres correspondant aux placeholders dans la requête SQL.
        users.username,
        // email : nouvelle adresse e-mail
        users.email,
        // password_hash : hash argon2 fraîchement calculé
        password_hash,
        // full_name : nouveau nom complet
        users.full_name,
        // avatar_url : nouvelle URL d'avatar ; null si non fourni
        users.avatar_url || null,
        // role : nouveau rôle applicatif
        users.role,
        // platform_role : dérivé du rôle ; 'admin' si role = 'admin', sinon 'user'
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        // status : nouveau statut du compte
        users.status || "active",
        // is_active : booléen correspondant au statut
        users.is_active,
        // id : identifiant de l'utilisateur à mettre à jour (clause WHERE)
        users.id,
      ]
    );
  }

  // delete(id) : supprime physiquement un utilisateur par son identifiant.
  //
  // Paramètre :
  //   - id : identifiant primaire de l'utilisateur à supprimer
  //
  // Retour : promesse résolue avec le résultat DELETE (affectedRows).
  delete(id) {
    // Suppression physique avec paramètre pour éviter l'injection SQL.
    return this.database.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findByEmail(email) : recherche un utilisateur par son adresse e-mail.
  //
  // Paramètre :
  //   - email : adresse e-mail exacte à rechercher
  //
  // Retour : promesse résolue avec 0 ou 1 ligne (e-mail unique en base).
  findByEmail(email) {
    // WHERE email = ? : filtre exact sur l'adresse e-mail.
    return this.database.query(`SELECT * FROM ${this.table} WHERE email = ?`, [email]);
  }

  // findByUsername(username) : recherche un utilisateur par son nom d'utilisateur.
  //
  // Paramètre :
  //   - username : nom d'utilisateur exact à rechercher
  //
  // Retour : promesse résolue avec 0 ou 1 ligne (username unique en base).
  findByUsername(username) {
    // WHERE username = ? : filtre exact sur le nom d'utilisateur.
    return this.database.query(`SELECT * FROM ${this.table} WHERE username = ?`, [username]);
  }

  // findByLogin(login) : recherche un utilisateur par e-mail OU par username.
  // Utile pour permettre à l'utilisateur de se connecter avec l'un ou l'autre.
  //
  // Paramètre :
  //   - login : valeur saisie par l'utilisateur (peut être un e-mail ou un username)
  //
  // Retour : promesse résolue avec 0 ou plusieurs lignes.
  findByLogin(login) {
    // WHERE email = ? OR username = ? : recherche sur les deux colonnes simultanément.
    // Le même paramètre `login` est utilisé pour les deux comparaisons.
    return this.database.query(`SELECT * FROM ${this.table} WHERE email = ? OR username = ?`, [login, login]);
  }

  // findAuthById(id) : récupère toutes les colonnes d'un utilisateur pour usage authentification.
  // Retourne toutes les colonnes (y compris password_hash, two_factor_secret, etc.).
  //
  // Paramètre :
  //   - id : identifiant primaire de l'utilisateur
  //
  // Retour : promesse résolue avec 0 ou 1 ligne complète.
  findAuthById(id) {
    // SELECT * : toutes les colonnes sont nécessaires pour les vérifications d'authentification.
    return this.database.query(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findByProvider(provider, providerId) : recherche un utilisateur par son fournisseur OAuth.
  //
  // Paramètres :
  //   - provider   : nom du fournisseur (ex: 'google', 'github')
  //   - providerId : id unique fourni par le fournisseur OAuth
  //
  // Retour : promesse résolue avec 0 ou 1 ligne.
  findByProvider(provider, providerId) {
    // WHERE auth_provider = ? AND provider_id = ? : double condition pour identifier
    // un utilisateur par son fournisseur et son id fournisseur.
    return this.database.query(`SELECT * FROM ${this.table} WHERE auth_provider = ? AND provider_id = ?`, [provider, providerId]);
  }

  // updateAdmin(users) : met à jour un utilisateur depuis l'interface d'administration.
  // Contrairement à `update`, cette méthode ne touche PAS au mot de passe.
  //
  // Paramètre `users` : objet JS avec les champs admin modifiables + le champ `id`.
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateAdmin(users) {
    return this.database.query(
      `
      UPDATE ${this.table}
      SET username = ?, email = ?, full_name = ?, avatar_url = ?, role = ?, platform_role = ?, status = ?, is_active = ?
      WHERE id = ?
      `,
      [
        // username : nouveau nom d'utilisateur
        users.username,
        // email : nouvelle adresse e-mail
        users.email,
        // full_name : nouveau nom complet
        users.full_name,
        // avatar_url : nouvelle URL d'avatar ; null si non fourni
        users.avatar_url || null,
        // role : nouveau rôle applicatif
        users.role,
        // platform_role : dérivé du rôle
        users.platform_role || (users.role === "admin" ? "admin" : "user"),
        // status : nouveau statut ; dérivé de is_active si non fourni explicitement
        users.status || (users.is_active ? "active" : "inactive"),
        // is_active : booléen d'activation du compte
        users.is_active,
        // id : identifiant de l'utilisateur à mettre à jour (clause WHERE)
        users.id,
      ]
    );
  }

  // findAdminById(id) : récupère les données d'un utilisateur pour l'interface admin.
  // Exclut les champs sensibles (password_hash, secrets 2FA, tokens, etc.).
  //
  // Paramètre :
  //   - id : identifiant de l'utilisateur
  //
  // Retour : promesse résolue avec 0 ou 1 ligne (colonnes non sensibles uniquement).
  findAdminById(id) {
    // SELECT explicite des colonnes : protège contre l'exposition accidentelle de données sensibles.
    return this.database.query(
      `SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at FROM ${this.table} WHERE id = ?`,
      [id]
    );
  }

  // countActivePlatformAdmins(excludedUserId) : compte les administrateurs actifs sur la plateforme.
  // Utile pour empêcher la suppression ou la dégradation du dernier administrateur.
  //
  // Paramètre optionnel :
  //   - excludedUserId : id d'un administrateur à exclure du comptage (ex: l'admin courant)
  //
  // Retour : promesse résolue avec une ligne contenant la colonne `count`.
  countActivePlatformAdmins(excludedUserId = null) {
    // Tableau des paramètres dynamiques qui sera complété selon les conditions.
    const params = [];
    // Condition de base : compter les admins actifs sur la plateforme.
    let where = "platform_role = 'admin' AND status = 'active' AND is_active = TRUE";

    // Si un id est fourni, on l'exclut du comptage pour éviter de compter l'admin lui-même.
    if (excludedUserId) {
      // AND id <> ? : exclut l'utilisateur spécifié du comptage.
      where += " AND id <> ?";
      // Ajouter l'id exclu au tableau de paramètres.
      params.push(excludedUserId);
    }

    // Exécuter la requête COUNT avec la clause WHERE construite dynamiquement.
    return this.database.query(`SELECT COUNT(*) AS count FROM ${this.table} WHERE ${where}`, params);
  }

  // findAdminUsers({ filters, pagination, sorting }) : recherche paginée et filtrée
  // pour l'interface d'administration des utilisateurs.
  //
  // Paramètre : objet avec trois propriétés :
  //   - filters    : { search, filterBy, role, status } — critères de filtrage
  //   - pagination : { page, limit } — numéro de page et nombre d'éléments par page
  //   - sorting    : { sortBy, sortOrder } — colonne et ordre de tri ('ASC' ou 'DESC')
  //
  // Retour : promesse résolue avec un tableau de deux résultats [rows, countResult]
  //          via Promise.all (requête de données + requête de comptage total).
  findAdminUsers({ filters, pagination, sorting }) {
    // Tableau des conditions SQL dynamiques construites selon les filtres actifs.
    const conditions = [];
    // Tableau des paramètres correspondant aux placeholders des conditions.
    const params = [];
    // Préparer le terme de recherche en minuscules avec wildcards pour LIKE.
    const search = filters.search ? `%${filters.search.toLowerCase()}%` : "";

    // Construire dynamiquement les conditions SQL selon les filtres actifs.
    if (search && filters.filterBy === "username") {
      // Recherche insensible à la casse sur le nom d'utilisateur uniquement.
      conditions.push("LOWER(username) LIKE ?");
      params.push(search);
    } else if (search && filters.filterBy === "email") {
      // Recherche insensible à la casse sur l'adresse e-mail uniquement.
      conditions.push("LOWER(email) LIKE ?");
      params.push(search);
    } else if (search && filters.filterBy === "role") {
      // Recherche insensible à la casse sur le rôle uniquement.
      conditions.push("LOWER(role) LIKE ?");
      params.push(search);
    } else if (search && filters.filterBy === "status") {
      // Recherche insensible à la casse sur le statut uniquement.
      conditions.push("LOWER(status) LIKE ?");
      params.push(search);
    } else if (search) {
      // Recherche globale sur plusieurs colonnes simultanément (OR entre les colonnes).
      conditions.push("(LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(role) LIKE ? OR LOWER(status) LIKE ?)");
      // Le même terme de recherche est appliqué à chaque colonne.
      params.push(search, search, search, search);
    }

    // Filtre exact sur le rôle (ex: 'admin', 'user').
    if (filters.role) {
      conditions.push("role = ?");
      params.push(filters.role);
    }

    // Filtre exact sur le statut (ex: 'active', 'suspended').
    if (filters.status) {
      conditions.push("status = ?");
      params.push(filters.status);
    }

    // Assembler la clause WHERE uniquement si des conditions ont été définies.
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    // Calculer l'offset de pagination : (numéro de page - 1) * nombre d'éléments par page.
    const offset = (pagination.page - 1) * pagination.limit;
    // Requête principale : récupère les colonnes non sensibles avec pagination et tri.
    // Note : sorting.sortBy et sorting.sortOrder sont construits côté service/contrôleur
    // et doivent être validés en amont pour éviter l'injection SQL via ORDER BY.
    const baseSelect = `SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at FROM ${this.table} ${whereClause} ORDER BY ${sorting.sortBy} ${sorting.sortOrder} LIMIT ? OFFSET ?`;
    // Requête de comptage : retourne le nombre total d'utilisateurs correspondant aux filtres.
    const countSelect = `SELECT COUNT(*) AS total FROM ${this.table} ${whereClause}`;

    // Exécuter les deux requêtes en parallèle via Promise.all pour optimiser les performances.
    // Le spread operator [...params] crée une copie des paramètres pour ne pas les modifier.
    return Promise.all([
      // Première requête : données paginées (avec limit et offset en plus des filtres).
      this.database.query(baseSelect, [...params, pagination.limit, offset]),
      // Deuxième requête : comptage total (sans limit/offset, avec les mêmes filtres).
      this.database.query(countSelect, params),
    ]);
  }

  // updateRole(id, role) : met à jour le rôle applicatif et la colonne platform_role d'un utilisateur.
  //
  // Paramètres :
  //   - id   : identifiant de l'utilisateur
  //   - role : nouveau rôle ('admin', 'user', etc.)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateRole(id, role) {
    // platform_role est dérivé du rôle : 'admin' si role = 'admin', sinon 'user'.
    return this.database.query(`UPDATE ${this.table} SET role = ?, platform_role = ? WHERE id = ?`, [role, role === "admin" ? "admin" : "user", id]);
  }

  // updateStatus(id, status) : met à jour le statut et le booléen is_active d'un utilisateur.
  //
  // Paramètres :
  //   - id     : identifiant de l'utilisateur
  //   - status : nouveau statut ('active', 'inactive', 'suspended', etc.)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateStatus(id, status) {
    // is_active est dérivé du statut : true uniquement si status = 'active'.
    return this.database.query(`UPDATE ${this.table} SET status = ?, is_active = ? WHERE id = ?`, [status, status === "active", id]);
  }

  // updateProfile(users) : met à jour les informations de profil (champs non sensibles).
  // Ne touche pas au mot de passe, au rôle ni au statut.
  //
  // Paramètre `users` : objet JS avec les champs : username, email, full_name, avatar_url, id.
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateProfile(users) {
    // SET : mise à jour des 4 champs de profil non sensibles.
    // avatar_url || null : null si l'URL n'est pas fournie (suppression de l'avatar).
    return this.database.query(`UPDATE ${this.table} SET username = ?, email = ?, full_name = ?, avatar_url = ? WHERE id = ?`, [users.username, users.email, users.full_name, users.avatar_url || null, users.id]);
  }

  // updateAvatar(id, avatarUrl) : met à jour uniquement l'URL de l'avatar.
  //
  // Paramètres :
  //   - id        : identifiant de l'utilisateur
  //   - avatarUrl : nouvelle URL de l'image d'avatar
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateAvatar(id, avatarUrl) {
    // SET avatar_url = ? : mise à jour ciblée de la seule colonne avatar_url.
    return this.database.query(`UPDATE ${this.table} SET avatar_url = ? WHERE id = ?`, [avatarUrl, id]);
  }

  // updatePasswordHash(id, passwordHash) : remplace le hash du mot de passe stocké.
  // ATTENTION : passwordHash doit être un hash argon2 déjà calculé en amont.
  //
  // Paramètres :
  //   - id           : identifiant de l'utilisateur
  //   - passwordHash : nouveau hash argon2 du mot de passe
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updatePasswordHash(id, passwordHash) {
    // SET password_hash = ? : mise à jour ciblée de la seule colonne de mot de passe.
    return this.database.query(`UPDATE ${this.table} SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
  }

  // findSafeById(id) : récupère un utilisateur par son id en excluant les colonnes sensibles.
  //
  // Paramètre :
  //   - id : identifiant de l'utilisateur
  //
  // Retour : promesse résolue avec 0 ou 1 ligne (sans password_hash, secrets, tokens).
  findSafeById(id) {
    // SELECT explicite : liste blanche des colonnes autorisées pour éviter les fuites de données.
    return this.database.query(`SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, created_at, updated_at FROM ${this.table} WHERE id = ?`, [id]);
  }

  // findAllSafe() : récupère tous les utilisateurs sans les colonnes sensibles.
  //
  // Aucun paramètre requis.
  // Retour : promesse résolue avec la liste de tous les utilisateurs,
  //          triée par date de création décroissante.
  findAllSafe() {
    // SELECT explicite avec davantage de colonnes que findSafeById mais
    // toujours sans password_hash ni secrets de 2FA.
    // ORDER BY created_at DESC : les utilisateurs les plus récents apparaissent en premier.
    return this.database.query(`SELECT id, username, email, full_name, avatar_url, role, platform_role, status, is_active, auth_provider, email_verified, two_factor_enabled, last_login_at, created_at, updated_at FROM ${this.table} ORDER BY created_at DESC`);
  }

  // updateLastLogin(id) : enregistre la date et l'heure de la dernière connexion.
  //
  // Paramètre :
  //   - id : identifiant de l'utilisateur qui vient de se connecter
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateLastLogin(id) {
    // NOW() : fonction SQL qui retourne l'horodatage courant du serveur de base de données.
    return this.database.query(`UPDATE ${this.table} SET last_login_at = NOW() WHERE id = ?`, [id]);
  }

  // updateTwoFactorPendingSecret(id, secret) : stocke temporairement le secret 2FA en attente de validation.
  // Utilisé pendant le processus d'activation de la 2FA avant confirmation par l'utilisateur.
  //
  // Paramètres :
  //   - id     : identifiant de l'utilisateur
  //   - secret : secret TOTP (Time-based One-Time Password) généré temporairement
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateTwoFactorPendingSecret(id, secret) {
    // two_factor_pending_secret : colonne temporaire ; sera effacée après validation.
    return this.database.query(`UPDATE ${this.table} SET two_factor_pending_secret = ? WHERE id = ?`, [secret, id]);
  }

  // enableTwoFactor(id, secret, recoveryCodes) : active la 2FA pour un utilisateur.
  // Finalise le processus d'activation après que l'utilisateur a confirmé le code TOTP.
  //
  // Paramètres :
  //   - id            : identifiant de l'utilisateur
  //   - secret        : secret TOTP définitif à stocker
  //   - recoveryCodes : tableau de codes de récupération d'urgence (sérialisé en JSON)
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  enableTwoFactor(id, secret, recoveryCodes) {
    // two_factor_enabled = TRUE : active le flag de 2FA.
    // two_factor_secret = ?     : stocke le secret TOTP définitif.
    // two_factor_pending_secret = NULL : supprime le secret temporaire.
    // two_factor_recovery_codes = ?   : stocke les codes de récupération sérialisés en JSON.
    return this.database.query(`UPDATE ${this.table} SET two_factor_enabled = TRUE, two_factor_secret = ?, two_factor_pending_secret = NULL, two_factor_recovery_codes = ? WHERE id = ?`, [secret, JSON.stringify(recoveryCodes), id]);
  }

  // disableTwoFactor(id) : désactive la 2FA et efface toutes les données associées.
  //
  // Paramètre :
  //   - id : identifiant de l'utilisateur
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  disableTwoFactor(id) {
    // Remise à zéro complète des colonnes 2FA :
    // two_factor_enabled = FALSE : désactive le flag.
    // two_factor_secret = NULL   : supprime le secret TOTP.
    // two_factor_pending_secret = NULL : supprime le secret temporaire.
    // two_factor_recovery_codes = NULL : supprime les codes de récupération.
    return this.database.query(`UPDATE ${this.table} SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_pending_secret = NULL, two_factor_recovery_codes = NULL WHERE id = ?`, [id]);
  }

  // updateActive(id, isActive) : active ou désactive un compte utilisateur.
  //
  // Paramètres :
  //   - id       : identifiant de l'utilisateur
  //   - isActive : booléen — true pour activer, false pour désactiver
  //
  // Retour : promesse résolue avec le résultat UPDATE (affectedRows).
  updateActive(id, isActive) {
    // is_active = ?  : mise à jour du booléen d'activation.
    // status = ?     : statut dérivé — 'active' si isActive = true, 'suspended' si false.
    return this.database.query(`UPDATE ${this.table} SET is_active = ?, status = ? WHERE id = ?`, [isActive, isActive ? "active" : "suspended", id]);
  }
}

// Exporter la classe pour utilisation via require() dans les contrôleurs et services.
module.exports = UsersManager;
