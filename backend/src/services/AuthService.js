const argon2 = require("argon2");
const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const models = require("../models");
const { jwtSecret, jwtExpiresIn } = require("../config/jwtConfig");
const { getPermissionsForBlogRole } = require("../utils/permissions");
const { validateLoginPayload, validateRegisterPayload, stripHtml } = require("../utils/authValidators");
const {
  createOtpAuthUrl,
  generateRecoveryCodes,
  generateSecret,
  verifyTotp,
} = require("../utils/twoFactor");

const twoFactorTempSecret = process.env.JWT_2FA_TEMP_SECRET || jwtSecret;
const twoFactorTempExpiresIn = process.env.JWT_2FA_TEMP_EXPIRES_IN || "5m";
const oauthProviders = new Set(["google", "facebook", "apple"]);

function getRedirectPathByRole(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
      return "/owner";
    case "editor":
      return "/editor";
    case "moderator":
      return "/moderator";
    default:
      return "/profile";
  }
}

async function verifyPassword(user, password) {
  const hash = user.password_hash || "";

  if (hash.startsWith("$argon2")) {
    return argon2.verify(hash, password);
  }

  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    const bcryptHash = hash.startsWith("$2y$") ? hash.replace("$2y$", "$2b$") : hash;
    const isValid = await bcrypt.compare(password, bcryptHash);

    if (isValid) {
      const passwordHash = await argon2.hash(password);
      await models.users.updatePasswordHash(user.id, passwordHash);
    }

    return isValid;
  }

  return false;
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function safeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function buildSafeUser(user, blogMemberships = []) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    role: user.role,
    status: user.status,
    globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
    auth_provider: user.auth_provider || "local",
    email_verified: Boolean(user.email_verified),
    two_factor_enabled: Boolean(user.two_factor_enabled),
    blogMemberships,
    is_active: user.is_active,
  };
}

function createAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      status: user.status,
      platformRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

function createTwoFactorTempToken(user) {
  return jwt.sign(
    {
      id: user.id,
      type: "2fa-login",
    },
    twoFactorTempSecret,
    { expiresIn: twoFactorTempExpiresIn }
  );
}

function getClientMeta(meta = {}) {
  return {
    ip_address: meta.ip,
    user_agent: meta.userAgent,
  };
}

async function writeAudit(action, { actorId = null, targetId = null, metadata = null, meta = {} } = {}) {
  if (!models.auditLogs) return;

  await models.auditLogs.insert({
    actor_user_id: actorId,
    target_type: "auth",
    target_id: targetId,
    action,
    metadata_json: metadata,
    ...getClientMeta(meta),
  });
}

async function getUserMemberships(userId) {
  const [memberships] = await models.blogMembers.findByUser(userId);

  return memberships.map((membership) => ({
    blogId: membership.blog_id,
    blogName: membership.blog_name,
    blogSlug: membership.blog_slug,
    role: membership.role,
    permissions: getPermissionsForBlogRole(membership.role),
  }));
}

async function generateUniqueUsername(base) {
  const fallback = `user_${crypto.randomBytes(3).toString("hex")}`;
  const cleanBase = stripHtml(base || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 24) || fallback;

  for (let index = 0; index < 20; index += 1) {
    const suffix = index === 0 ? "" : `_${index}`;
    const candidate = `${cleanBase}${suffix}`.slice(0, 30);
    const [existing] = await models.users.findByUsername(candidate);

    if (existing.length === 0) {
      return candidate;
    }
  }

  return `user_${crypto.randomBytes(6).toString("hex")}`.slice(0, 30);
}

function decodeJwtPart(part) {
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

async function verifyAppleIdToken(idToken, audience) {
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("OAUTH_APPLE_INVALID_ID_TOKEN");
  }

  const header = decodeJwtPart(encodedHeader);
  const payload = decodeJwtPart(encodedPayload);
  const jwksResponse = await fetch("https://appleid.apple.com/auth/keys");
  const jwks = await jwksResponse.json();
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);

  if (!jwk) {
    throw new Error("OAUTH_APPLE_KEY_NOT_FOUND");
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const signature = Buffer.from(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const isValid = crypto.verify("RSA-SHA256", Buffer.from(`${encodedHeader}.${encodedPayload}`), publicKey, signature);
  const isExpired = Number(payload.exp) * 1000 < Date.now();
  const isIssuerValid = payload.iss === "https://appleid.apple.com";
  const isAudienceValid = payload.aud === audience;

  if (!isValid || isExpired || !isIssuerValid || !isAudienceValid) {
    throw new Error("OAUTH_APPLE_INVALID_ID_TOKEN");
  }

  return payload;
}

// FR: Service métier pour l'authentification.
// EN: Business service for authentication.
// Méthodes principales (résumé):
// - signup(payload, avatarFile, meta): créer un utilisateur local (vérifie les consentements légaux).
// - signin(identifier, password, meta): authentifier un utilisateur et retourner token ou token temporaire 2FA.
// - verifyTwoFactorLogin(temporaryToken, code, meta): valider code TOTP et retourner access token.
// - setupTwoFactor(userId): générer secret temporaire pour configuration 2FA (otpauth URL).
// - verifyTwoFactorSetup(userId, code, meta): confirmer la configuration 2FA et générer recovery codes.
// - disableTwoFactor(userId, {password, code}, meta): désactiver 2FA après vérification.
// - getOAuthRedirectUrl(provider, legalState): construire l'URL d'autorisation OAuth pour le provider.
// - handleOAuthCallback(provider, {code, state}, meta): finaliser le flux OAuth et créer/utiliser l'utilisateur.
// - fetchOAuthProfile(provider, code): échange du token et normalisation du profil fournisseur.
// Notes:
// - Ce service utilise `models` pour la persistence et écrit des audit logs via `writeAudit()`.
// - Les helpers en haut de fichier (verifyPassword, createAccessToken...) encapsulent la logique sécurité.
class AuthService {
  async signup(payload, avatarFile = null, meta = {}) {
    const validationError = validateRegisterPayload(payload);

    if (validationError) {
      throw new Error(validationError);
    }

    const {
      username,
      email,
      password,
      full_name,
      role,
      accepted_terms,
      accepted_terms_version,
      accepted_privacy,
      accepted_privacy_version,
      marketing_consent,
      cookies_consent,
    } = payload;

    const cleanUsername = stripHtml(username);
    const cleanEmail = stripHtml(email).toLowerCase();
    const cleanFullName = full_name ? stripHtml(full_name) : null;

    // FR: L'inscription est contractuelle, les documents légaux doivent être acceptés.
    // EN: Signup is contractual, legal documents must be accepted before account creation.
    if (!normalizeBoolean(accepted_terms) || !normalizeBoolean(accepted_privacy)) {
      throw new Error("LEGAL_CONSENT_REQUIRED");
    }

    const [existingByEmail] = await models.users.findByEmail(cleanEmail);
    if (existingByEmail.length > 0) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const [existingByUsername] = await models.users.findByUsername(cleanUsername);
    if (existingByUsername.length > 0) {
      throw new Error("USERNAME_ALREADY_EXISTS");
    }

    const password_hash = await argon2.hash(password);
    const userRole = role || "user";
    const avatarUrl = avatarFile ? `/uploads/avatars/${avatarFile.filename}` : null;

    const [result] = await models.users.insert({
      username: cleanUsername,
      email: cleanEmail,
      password_hash,
      full_name: cleanFullName,
      avatar_url: avatarUrl,
      role: userRole,
      accepted_terms: true,
      accepted_terms_version,
      accepted_privacy: true,
      accepted_privacy_version,
      marketing_consent: normalizeBoolean(marketing_consent),
      cookies_consent: safeJson(cookies_consent),
    });

    await writeAudit("auth.register_success", {
      actorId: result.insertId,
      targetId: result.insertId,
      metadata: { method: "local", avatarUploaded: Boolean(avatarFile) },
      meta,
    });

    return {
      id: result.insertId,
      username: cleanUsername,
      email: cleanEmail,
      full_name: cleanFullName,
      avatar_url: avatarUrl,
      role: userRole,
      status: "active",
      accepted_terms: true,
      accepted_terms_version,
      accepted_privacy: true,
      accepted_privacy_version,
    };
  }

  async signin(login, password, meta = {}) {
    const validationError = validateLoginPayload({ identifier: login, password });

    if (validationError) {
      throw new Error(validationError);
    }

    const cleanLogin = stripHtml(login).toLowerCase();
    const [rows] = await models.users.findByLogin(cleanLogin);
    const user = rows[0];

    if (!user) {
      await writeAudit("auth.login_failed", {
        metadata: { reason: "unknown_user", identifier: cleanLogin },
        meta,
      });
      throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await verifyPassword(user, password);
    
    if (!isPasswordValid) {
      await writeAudit("auth.login_failed", {
        targetId: user.id,
        metadata: { reason: "bad_password" },
        meta,
      });
      throw new Error("INVALID_CREDENTIALS");
    }

    if (!user.is_active || user.status !== "active") {
      await writeAudit("auth.login_failed", {
        targetId: user.id,
        metadata: { reason: "disabled_account", status: user.status },
        meta,
      });
      throw new Error("ACCOUNT_DISABLED");
    }

    if (user.two_factor_enabled) {
      return {
        requiresTwoFactor: true,
        temporaryToken: createTwoFactorTempToken(user),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          two_factor_enabled: true,
        },
      };
    }

    const token = createAccessToken(user);
    const blogMemberships = await getUserMemberships(user.id);
    const mainMembership = blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0];
    await models.users.updateLastLogin(user.id);
    await writeAudit("auth.login_success", {
      actorId: user.id,
      targetId: user.id,
      metadata: { method: "local" },
      meta,
    });

    return {
      token,
      user: buildSafeUser(user, blogMemberships),
      currentBlog: mainMembership || null,
      redirectTo: user.platform_role === "admin" || user.role === "admin"
        ? "/admin"
        : getRedirectPathByRole(mainMembership?.role || user.role || "user"),
    };
  }

  async verifyTwoFactorLogin(temporaryToken, code, meta = {}) {
    let decoded;

    try {
      decoded = jwt.verify(temporaryToken, twoFactorTempSecret);
    } catch (error) {
      throw new Error("INVALID_2FA_TOKEN");
    }

    if (decoded.type !== "2fa-login") {
      throw new Error("INVALID_2FA_TOKEN");
    }

    const [rows] = await models.users.findAuthById(decoded.id);
    const user = rows[0];

    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      throw new Error("INVALID_2FA_TOKEN");
    }

    if (!verifyTotp(user.two_factor_secret, code)) {
      await writeAudit("auth.2fa_failed", {
        targetId: user.id,
        metadata: { reason: "bad_totp_login" },
        meta,
      });
      throw new Error("INVALID_2FA_CODE");
    }

    const token = createAccessToken(user);
    const blogMemberships = await getUserMemberships(user.id);
    const mainMembership = blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0];
    await models.users.updateLastLogin(user.id);
    await writeAudit("auth.login_success", {
      actorId: user.id,
      targetId: user.id,
      metadata: { method: "local_2fa" },
      meta,
    });

    return {
      token,
      user: buildSafeUser(user, blogMemberships),
      currentBlog: mainMembership || null,
      redirectTo: user.platform_role === "admin" || user.role === "admin"
        ? "/admin"
        : getRedirectPathByRole(mainMembership?.role || user.role || "user"),
    };
  }

  async setupTwoFactor(userId) {
    const [rows] = await models.users.findAuthById(userId);
    const user = rows[0];

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const secret = generateSecret();
    await models.users.updateTwoFactorPendingSecret(userId, secret);

    return {
      secret,
      otpauthUrl: createOtpAuthUrl({ secret, email: user.email }),
    };
  }

  async verifyTwoFactorSetup(userId, code, meta = {}) {
    const [rows] = await models.users.findAuthById(userId);
    const user = rows[0];

    if (!user || !user.two_factor_pending_secret) {
      throw new Error("TWO_FACTOR_SETUP_NOT_FOUND");
    }

    if (!verifyTotp(user.two_factor_pending_secret, code)) {
      await writeAudit("auth.2fa_failed", {
        actorId: userId,
        targetId: userId,
        metadata: { reason: "bad_totp_setup" },
        meta,
      });
      throw new Error("INVALID_2FA_CODE");
    }

    const recoveryCodes = generateRecoveryCodes();
    const hashedRecoveryCodes = await Promise.all(recoveryCodes.map((recoveryCode) => argon2.hash(recoveryCode)));
    await models.users.enableTwoFactor(userId, user.two_factor_pending_secret, hashedRecoveryCodes);
    await writeAudit("auth.2fa_enabled", {
      actorId: userId,
      targetId: userId,
      metadata: { recoveryCodesCount: recoveryCodes.length },
      meta,
    });

    return { recoveryCodes };
  }

  async disableTwoFactor(userId, { password, code }, meta = {}) {
    const [rows] = await models.users.findAuthById(userId);
    const user = rows[0];

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const isPasswordValid = await verifyPassword(user, password || "");

    if (!isPasswordValid || !verifyTotp(user.two_factor_secret, code)) {
      throw new Error("INVALID_CREDENTIALS");
    }

    await models.users.disableTwoFactor(userId);
    await writeAudit("auth.2fa_disabled", {
      actorId: userId,
      targetId: userId,
      meta,
    });

    return { disabled: true };
  }

  getOAuthRedirectUrl(provider, legalState = {}) {
    if (!oauthProviders.has(provider)) {
      throw new Error("OAUTH_PROVIDER_UNSUPPORTED");
    }

    const config = this.getOAuthProviderConfig(provider);
    const state = jwt.sign(
      {
        provider,
        legalAccepted: normalizeBoolean(legalState.legalAccepted),
        termsVersion: legalState.termsVersion || null,
        privacyVersion: legalState.privacyVersion || null,
      },
      jwtSecret,
      { expiresIn: "10m" }
    );
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      scope: config.scope,
      state,
    });

    if (provider === "google") {
      params.set("access_type", "offline");
      params.set("prompt", "select_account");
    }

    if (provider === "apple") {
      params.set("response_mode", "form_post");
    }

    return `${config.authorizationUrl}?${params.toString()}`;
  }

  getOAuthProviderConfig(provider) {
    const configs = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
        scope: "openid email profile",
      },
      facebook: {
        clientId: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
        authorizationUrl: "https://www.facebook.com/v19.0/dialog/oauth",
        tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
        userInfoUrl: "https://graph.facebook.com/me",
        scope: "email,public_profile",
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
        callbackUrl: process.env.APPLE_CALLBACK_URL,
        authorizationUrl: "https://appleid.apple.com/auth/authorize",
        tokenUrl: "https://appleid.apple.com/auth/token",
        userInfoUrl: null,
        scope: "name email",
      },
    };
    const config = configs[provider];

    if (!config?.clientId || !config?.clientSecret || !config?.callbackUrl) {
      throw new Error("OAUTH_PROVIDER_NOT_CONFIGURED");
    }

    return config;
  }

  async handleOAuthCallback(provider, { code, state }, meta = {}) {
    if (!oauthProviders.has(provider)) {
      throw new Error("OAUTH_PROVIDER_UNSUPPORTED");
    }

    let decodedState = {};

    try {
      decodedState = state ? jwt.verify(state, jwtSecret) : {};
    } catch (error) {
      throw new Error("OAUTH_STATE_INVALID");
    }

    const profile = await this.fetchOAuthProfile(provider, code);
    const user = await this.findOrCreateOAuthUser(provider, profile, decodedState, meta);
    const blogMemberships = await getUserMemberships(user.id);
    const mainMembership = blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0];
    await models.users.updateLastLogin(user.id);
    await writeAudit("auth.oauth_login_success", {
      actorId: user.id,
      targetId: user.id,
      metadata: { provider },
      meta,
    });

    return {
      token: createAccessToken(user),
      user: buildSafeUser(user, blogMemberships),
      currentBlog: mainMembership || null,
      redirectTo: user.platform_role === "admin" || user.role === "admin"
        ? "/admin"
        : getRedirectPathByRole(mainMembership?.role || user.role || "user"),
    };
  }

  async fetchOAuthProfile(provider, code) {
    const config = this.getOAuthProviderConfig(provider);
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.callbackUrl,
        grant_type: "authorization_code",
        code,
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error("OAUTH_TOKEN_EXCHANGE_FAILED");
    }

    if (provider === "facebook") {
      const userInfoResponse = await fetch(`${config.userInfoUrl}?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
      const userInfo = await userInfoResponse.json();
      return {
        providerUserId: userInfo.id,
        email: userInfo.email,
        emailVerified: Boolean(userInfo.email),
        name: userInfo.name,
        avatarUrl: userInfo.picture?.data?.url || null,
      };
    }

    if (provider === "apple") {
      const applePayload = await verifyAppleIdToken(tokenData.id_token, config.clientId);

      return {
        providerUserId: applePayload.sub,
        email: applePayload.email,
        emailVerified: Boolean(applePayload.email_verified === true || applePayload.email_verified === "true"),
        name: applePayload.email ? applePayload.email.split("@")[0] : "Apple user",
        avatarUrl: null,
      };
    }

    const userInfoResponse = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userInfo = await userInfoResponse.json();

    return {
      providerUserId: userInfo.sub,
      email: userInfo.email,
      emailVerified: Boolean(userInfo.email_verified),
      name: userInfo.name,
      avatarUrl: userInfo.picture || null,
    };
  }

  async findOrCreateOAuthUser(provider, profile, state, meta = {}) {
    const [linkedAccounts] = await models.userOAuthAccounts.findByProviderAccount(provider, profile.providerUserId);

    if (linkedAccounts[0]) {
      const [users] = await models.users.findAuthById(linkedAccounts[0].user_id);
      return users[0];
    }

    if (!profile.email || !profile.emailVerified) {
      throw new Error("OAUTH_EMAIL_NOT_VERIFIED");
    }

    const [existingUsers] = await models.users.findByEmail(profile.email.toLowerCase());
    const existingUser = existingUsers[0];

    if (existingUser) {
      await models.userOAuthAccounts.insert({
        user_id: existingUser.id,
        provider,
        provider_user_id: profile.providerUserId,
        provider_email: profile.email,
        provider_email_verified: profile.emailVerified,
        provider_avatar_url: profile.avatarUrl,
      });
      await writeAudit("auth.oauth_account_linked", {
        actorId: existingUser.id,
        targetId: existingUser.id,
        metadata: { provider },
        meta,
      });
      return existingUser;
    }

    if (!normalizeBoolean(state.legalAccepted)) {
      throw new Error("LEGAL_CONSENT_REQUIRED");
    }

    const username = await generateUniqueUsername(profile.name || profile.email.split("@")[0]);
    const passwordHash = await argon2.hash(crypto.randomBytes(32).toString("hex"));
    const [result] = await models.users.insert({
      username,
      email: profile.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: profile.name,
      avatar_url: profile.avatarUrl,
      role: "user",
      auth_provider: provider,
      provider_id: profile.providerUserId,
      email_verified: profile.emailVerified,
      accepted_terms: true,
      accepted_terms_version: state.termsVersion || null,
      accepted_privacy: true,
      accepted_privacy_version: state.privacyVersion || null,
    });
    await models.userOAuthAccounts.insert({
      user_id: result.insertId,
      provider,
      provider_user_id: profile.providerUserId,
      provider_email: profile.email,
      provider_email_verified: profile.emailVerified,
      provider_avatar_url: profile.avatarUrl,
    });

    const [users] = await models.users.findAuthById(result.insertId);
    return users[0];
  }
}

module.exports = new AuthService();
module.exports.getRedirectPathByRole = getRedirectPathByRole;
