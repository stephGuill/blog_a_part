const AbstractManager = require("./AbstractManager");

// UserOAuthAccountsManager.js
// Manager pour la table `user_oauth_accounts` liant un utilisateur à un compte OAuth.

class UserOAuthAccountsManager extends AbstractManager {
  constructor() {
    // Indiquer la table au parent
    super({ table: "user_oauth_accounts" });
  }

  // findByProviderAccount(provider, providerUserId) : retrouver un account OAuth
  findByProviderAccount(provider, providerUserId) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE provider = ? AND provider_user_id = ?`, [provider, providerUserId]);
  }

  // findByUserAndProvider(userId, provider) : obtenir les comptes OAuth d'un user
  findByUserAndProvider(userId, provider) {
    return this.database.query(`SELECT * FROM ${this.table} WHERE user_id = ? AND provider = ?`, [userId, provider]);
  }

  // insert(account) : lie un compte OAuth à un utilisateur (INSERT paramétré)
  insert(account) {
    return this.database.query(
      `INSERT INTO ${this.table} (user_id, provider, provider_user_id, provider_email, provider_email_verified, provider_avatar_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [account.user_id, account.provider, account.provider_user_id, account.provider_email || null, Boolean(account.provider_email_verified), account.provider_avatar_url || null]
    );
  }
}

module.exports = UserOAuthAccountsManager;
