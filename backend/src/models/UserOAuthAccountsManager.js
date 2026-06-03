// Importation de la classe de base pour l'héritage des méthodes communes.
const AbstractManager = require("./AbstractManager");

// UserOAuthAccountsManager.js
// Manager pour la table `user_oauth_accounts`.
// Responsabilité : gérer les liens entre les comptes utilisateurs de la plateforme
// et leurs comptes OAuth (ex: Google, GitHub, Facebook).
//
// La table `user_oauth_accounts` contient :
//   - user_id                   : référence vers la table `users`
//   - provider                  : nom du fournisseur OAuth (ex: 'google', 'github')
//   - provider_user_id          : id unique de l'utilisateur chez le fournisseur
//   - provider_email            : adresse e-mail associée au compte fournisseur
//   - provider_email_verified   : booléen indiquant si l'e-mail est vérifié chez le fournisseur
//   - provider_avatar_url       : URL de l'avatar fourni par le compte OAuth
//
// Les méthodes `find(id)`, `findAll()` et `delete(id)` sont héritées d'AbstractManager.

class UserOAuthAccountsManager extends AbstractManager {
  // Constructeur : déclare la table `user_oauth_accounts` au parent AbstractManager.
  constructor() {
    // Appel du constructeur parent avec le nom de la table SQL.
    super({ table: "user_oauth_accounts" });
  }

  // findByProviderAccount(provider, providerUserId) : recherche un compte OAuth
  // à partir du nom du fournisseur et de l'id unique de l'utilisateur chez ce fournisseur.
  //
  // Paramètres :
  //   - provider       : nom du fournisseur (ex: 'google', 'github')
  //   - providerUserId : identifiant unique de l'utilisateur dans le système du fournisseur
  //
  // Retour : promesse résolue avec 0 ou 1 ligne.
  //          Utile lors du login OAuth pour savoir si ce compte est déjà lié à un utilisateur.
  findByProviderAccount(provider, providerUserId) {
    // WHERE provider = ? AND provider_user_id = ? : double condition pour identifier
    // de façon unique un compte OAuth (un utilisateur peut avoir des comptes sur plusieurs fournisseurs).
    return this.database.query(`SELECT * FROM ${this.table} WHERE provider = ? AND provider_user_id = ?`, [provider, providerUserId]);
  }

  // findByUserAndProvider(userId, provider) : récupère le ou les comptes OAuth
  // d'un utilisateur pour un fournisseur donné.
  //
  // Paramètres :
  //   - userId   : id de l'utilisateur dans la table `users`
  //   - provider : nom du fournisseur OAuth concerné
  //
  // Retour : promesse résolue avec la liste des comptes OAuth de cet utilisateur pour ce fournisseur.
  findByUserAndProvider(userId, provider) {
    // WHERE user_id = ? AND provider = ? : filtre par utilisateur ET par fournisseur.
    return this.database.query(`SELECT * FROM ${this.table} WHERE user_id = ? AND provider = ?`, [userId, provider]);
  }

  // insert(account) : lie un compte OAuth à un utilisateur existant de la plateforme.
  //
  // Paramètre `account` : objet JS avec les propriétés suivantes :
  //   - user_id                 : id de l'utilisateur local à lier
  //   - provider                : nom du fournisseur OAuth
  //   - provider_user_id        : id unique de l'utilisateur chez le fournisseur
  //   - provider_email          : e-mail du compte OAuth (peut être null)
  //   - provider_email_verified : booléen indiquant si l'e-mail est vérifié chez le fournisseur
  //   - provider_avatar_url     : URL de l'avatar OAuth (peut être null)
  //
  // Retour : promesse résolue avec le résultat INSERT (ex: insertId).
  insert(account) {
    // Requête INSERT paramétrée pour créer le lien OAuth.
    return this.database.query(
      `INSERT INTO ${this.table} (user_id, provider, provider_user_id, provider_email, provider_email_verified, provider_avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        // user_id : référence vers l'utilisateur local (clé étrangère vers users.id)
        account.user_id,
        // provider : nom du fournisseur OAuth (ex: 'google', 'github', 'facebook')
        account.provider,
        // provider_user_id : id unique fourni par le service OAuth
        account.provider_user_id,
        // provider_email : e-mail du compte OAuth ; null si non fourni par le fournisseur
        account.provider_email || null,
        // Boolean() : conversion explicite en booléen pour garantir le bon type SQL
        Boolean(account.provider_email_verified),
        // provider_avatar_url : URL de l'avatar OAuth ; null si non fourni
        account.provider_avatar_url || null,
      ]
    );
  }
}

// Exporter la classe pour utilisation via require() dans les services d'authentification.
module.exports = UserOAuthAccountsManager;
