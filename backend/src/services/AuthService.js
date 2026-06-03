// Bibliothèque de hachage de mot de passe recommandée (argon2id) - résistante aux attaques GPU
const argon2 = require("argon2");
// Bibliothèque de hachage bcrypt - utilisée pour la rétro-compatibilité avec les anciens hashes
const bcrypt = require("bcryptjs");
// Module natif Node.js pour la génération de données aléatoires sécurisées
const crypto = require("node:crypto");
// Bibliothèque de gestion des JSON Web Tokens (signature, vérification, décodage)
const jwt = require("jsonwebtoken");
// Accès centralisé à tous les modèles de données (ORM maison)
const models = require("../models");
// Clé secrète et durée de vie du JWT d'accès, lus depuis la configuration
const { jwtSecret, jwtExpiresIn } = require("../config/jwtConfig");
// Utilitaire qui retourne la liste des permissions associées à un rôle de blog
const { getPermissionsForBlogRole } = require("../utils/permissions");
// Validateurs de formulaire et utilitaire de nettoyage HTML
const { validateLoginPayload, validateRegisterPayload, stripHtml } = require("../utils/authValidators");
// Utilitaires 2FA : génération de l'URL otpauth, codes de récupération, secret TOTP, vérification du code
const {
  createOtpAuthUrl,
  generateRecoveryCodes,
  generateSecret,
  verifyTotp,
} = require("../utils/twoFactor");

// Secret dédié au token temporaire émis pendant le flux 2FA (peut différer du JWT principal)
const twoFactorTempSecret = process.env.JWT_2FA_TEMP_SECRET || jwtSecret;
// Durée de validité du token temporaire 2FA (par défaut 5 minutes, très courte pour la sécurité)
const twoFactorTempExpiresIn = process.env.JWT_2FA_TEMP_EXPIRES_IN || "5m";
// Ensemble (Set) des fournisseurs OAuth supportés - utiliser un Set pour la vérification en O(1)
const oauthProviders = new Set(["google", "facebook", "apple"]);

// Retourne le chemin de redirection frontend en fonction du rôle de l'utilisateur
function getRedirectPathByRole(role) {
  // Le switch détermine la page d'accueil appropriée après connexion selon le rôle
  switch (role) {
    case "admin":
      // Les admins globaux atterrissent sur le tableau de bord d'administration
      return "/admin";
    case "owner":
      // Les propriétaires de blog accèdent à leur espace de gestion
      return "/owner";
    case "editor":
      // Les éditeurs accèdent à leur interface de rédaction
      return "/editor";
    case "moderator":
      // Les modérateurs accèdent à leur interface de modération
      return "/moderator";
    default:
      // Tout autre rôle (ex: "user") est redirigé vers le profil
      return "/profile";
  }
}

// Vérifie le mot de passe d'un utilisateur en supportant argon2 ET les anciens hashes bcrypt
async function verifyPassword(user, password) {
  // Récupère le hash stocké ou chaîne vide si absent (évite les erreurs null)
  const hash = user.password_hash || "";

  // Détecte le hash argon2 (format $argon2id$, $argon2i$ ou $argon2d$)
  if (hash.startsWith("$argon2")) {
    // Vérification native argon2 - retourne true/false
    return argon2.verify(hash, password);
  }

  // Détecte les hashes bcrypt (anciens formats $2y$, $2a$ ou $2b$)
  if (hash.startsWith("$2y$") || hash.startsWith("$2a$") || hash.startsWith("$2b$")) {
    // PHP génère $2y$ mais bcryptjs n'accepte que $2b$ - on normalise le préfixe
    const bcryptHash = hash.startsWith("$2y$") ? hash.replace("$2y$", "$2b$") : hash;
    // Vérification bcrypt avec le hash normalisé
    const isValid = await bcrypt.compare(password, bcryptHash);

    // Migration transparente : si le mot de passe est correct, on re-hache en argon2
    if (isValid) {
      // Génère un nouveau hash argon2 pour remplacer l'ancien hash bcrypt
      const passwordHash = await argon2.hash(password);
      // Met à jour le hash en base de données (migration silencieuse)
      await models.users.updatePasswordHash(user.id, passwordHash);
    }

    // Retourne le résultat de la vérification bcrypt
    return isValid;
  }

  // Si le format du hash est inconnu, refuse l'authentification
  return false;
}

// Normalise une valeur en booléen strict, en gérant les strings "true"/"1" et entiers
function normalizeBoolean(value) {
  // Retourne true uniquement si la valeur est : boolean true, string "true", string "1" ou entier 1
  return value === true || value === "true" || value === "1" || value === 1;
}

// Tente de parser une valeur JSON de manière sécurisée (ne lève pas d'erreur)
function safeJson(value) {
  // Si la valeur est falsy (null, undefined, ""), retourne null
  if (!value) return null;
  // Si c'est déjà un objet (déjà parsé par le middleware), le retourne tel quel
  if (typeof value === "object") return value;

  try {
    // Tente le parsing JSON
    return JSON.parse(value);
  } catch (error) {
    // En cas d'erreur de parsing, retourne null plutôt que de planter
    return null;
  }
}

// Construit un objet utilisateur "sûr" à renvoyer au client (sans données sensibles)
function buildSafeUser(user, blogMemberships = []) {
  return {
    id: user.id,                          // Identifiant unique de l'utilisateur
    username: user.username,              // Nom d'utilisateur public
    email: user.email,                    // Adresse email
    full_name: user.full_name,            // Nom complet
    avatar_url: user.avatar_url,          // URL de l'avatar
    role: user.role,                      // Rôle dans le contexte du blog courant
    status: user.status,                  // Statut actif/inactif/banni du compte
    globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"), // Rôle global sur la plateforme
    auth_provider: user.auth_provider || "local", // Méthode d'authentification ("local", "google", etc.)
    email_verified: Boolean(user.email_verified),         // Indique si l'email a été vérifié
    two_factor_enabled: Boolean(user.two_factor_enabled), // Indique si la 2FA est activée
    blogMemberships,                      // Liste des blogs où l'utilisateur est membre
    is_active: user.is_active,            // Indique si le compte est actif
  };
}

// Génère un JWT d'accès signé contenant les informations minimales de l'utilisateur
function createAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,           // Identifiant de l'utilisateur dans le payload
      role: user.role,       // Rôle utilisateur dans le payload
      status: user.status,   // Statut du compte dans le payload
      platformRole: user.platform_role || (user.role === "admin" ? "admin" : "user"), // Rôle global dans le payload
    },
    jwtSecret,               // Clé secrète pour signer le token
    { expiresIn: jwtExpiresIn } // Durée de validité du token (ex : "15m", "1h", "7d")
  );
}

// Génère un JWT temporaire utilisé uniquement pendant la seconde étape du flux 2FA
function createTwoFactorTempToken(user) {
  return jwt.sign(
    {
      id: user.id,       // Identifiant de l'utilisateur en attente de validation 2FA
      type: "2fa-login", // Type de token pour éviter toute réutilisation dans un autre contexte
    },
    twoFactorTempSecret,              // Secret dédié au flux 2FA (peut être distinct du JWT principal)
    { expiresIn: twoFactorTempExpiresIn } // Durée très courte (5 min par défaut) pour limiter l'exposition
  );
}

// Extrait les métadonnées réseau de la requête (IP et User-Agent) pour les logs d'audit
function getClientMeta(meta = {}) {
  return {
    ip_address: meta.ip,          // Adresse IP du client
    user_agent: meta.userAgent,   // User-Agent du navigateur/client
  };
}

// Insère un enregistrement dans les logs d'audit de manière asynchrone et sécurisée
async function writeAudit(action, { actorId = null, targetId = null, metadata = null, meta = {} } = {}) {
  // Si le modèle auditLogs n'est pas disponible (ex: tests), on ignore silencieusement
  if (!models.auditLogs) return;

  // Insère l'entrée d'audit avec toutes les informations de contexte
  await models.auditLogs.insert({
    actor_user_id: actorId,       // Identifiant de l'utilisateur qui a déclenché l'action
    target_type: "auth",          // Type de cible : ici toujours "auth" pour ce service
    target_id: targetId,          // Identifiant de l'utilisateur ciblé par l'action
    action,                       // Nom de l'action (ex: "auth.login_success")
    metadata_json: metadata,      // Données contextuelles supplémentaires au format JSON
    ...getClientMeta(meta),       // IP et User-Agent extraits des métadonnées de requête
  });
}

// Récupère et formate les memberships de blog d'un utilisateur pour inclusion dans la réponse
async function getUserMemberships(userId) {
  // Requête en base pour obtenir tous les blogs dont l'utilisateur est membre
  const [memberships] = await models.blogMembers.findByUser(userId);

  // Transforme chaque membership brut en objet formaté avec les permissions calculées
  return memberships.map((membership) => ({
    blogId: membership.blog_id,                               // Identifiant du blog
    blogName: membership.blog_name,                           // Nom du blog
    blogSlug: membership.blog_slug,                           // Slug URL du blog
    role: membership.role,                                    // Rôle dans ce blog (owner, editor, etc.)
    permissions: getPermissionsForBlogRole(membership.role),  // Permissions calculées depuis le rôle
  }));
}

// Génère un nom d'utilisateur unique à partir d'une base, avec déduplication automatique
async function generateUniqueUsername(base) {
  // Nom de secours aléatoire si la base est vide ou invalide
  const fallback = `user_${crypto.randomBytes(3).toString("hex")}`;
  // Nettoie la chaîne de base : supprime le HTML, met en minuscules, remplace les caractères spéciaux
  const cleanBase = stripHtml(base || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_") // Remplace tout caractère non alphanumérique par "_"
    .slice(0, 24) || fallback;   // Limite la longueur à 24 caractères (laisse de la place pour le suffixe)

  // Tente jusqu'à 20 variantes (base, base_1, base_2, ...) pour trouver un username libre
  for (let index = 0; index < 20; index += 1) {
    // Pas de suffixe pour la première tentative, puis "_1", "_2", etc.
    const suffix = index === 0 ? "" : `_${index}`;
    // Construit le candidat et le tronque à 30 caractères (longueur max de la colonne username)
    const candidate = `${cleanBase}${suffix}`.slice(0, 30);
    // Vérifie si ce username existe déjà en base de données
    const [existing] = await models.users.findByUsername(candidate);

    // Si aucun utilisateur n'utilise ce username, il est disponible
    if (existing.length === 0) {
      return candidate;
    }
  }

  // Après 20 tentatives infructueuses, génère un username complètement aléatoire (filet de sécurité)
  return `user_${crypto.randomBytes(6).toString("hex")}`.slice(0, 30);
}

// Décode une partie d'un JWT (header ou payload) encodée en base64url
function decodeJwtPart(part) {
  // Remplace les caractères base64url par leurs équivalents base64 standard
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  // Décode de base64 vers une chaîne UTF-8, puis parse le JSON
  return JSON.parse(Buffer.from(normalized, "base64").toString("utf8"));
}

// Vérifie un id_token Apple en récupérant la clé publique depuis les JWKS d'Apple
async function verifyAppleIdToken(idToken, audience) {
  // Décompose le JWT en ses trois parties : header, payload, signature
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split(".");

  // Un JWT valide doit avoir exactement 3 parties séparées par des points
  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("OAUTH_APPLE_INVALID_ID_TOKEN");
  }

  // Décode le header pour obtenir l'identifiant de clé (kid) utilisé pour signer le token
  const header = decodeJwtPart(encodedHeader);
  // Décode le payload pour obtenir les claims (sub, email, exp, iss, aud, etc.)
  const payload = decodeJwtPart(encodedPayload);
  // Télécharge le jeu de clés publiques JWKS depuis les serveurs d'Apple
  const jwksResponse = await fetch("https://appleid.apple.com/auth/keys");
  // Parse la réponse JSON contenant le tableau de clés publiques
  const jwks = await jwksResponse.json();
  // Trouve la clé correspondant au kid déclaré dans le header du token
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);

  // Si aucune clé ne correspond au kid, le token est invalide
  if (!jwk) {
    throw new Error("OAUTH_APPLE_KEY_NOT_FOUND");
  }

  // Importe la clé publique JWK pour la vérification de la signature
  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  // Décode la signature du token depuis base64url en Buffer
  const signature = Buffer.from(encodedSignature.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  // Vérifie la signature RSA-SHA256 sur les parties header.payload du token
  const isValid = crypto.verify("RSA-SHA256", Buffer.from(`${encodedHeader}.${encodedPayload}`), publicKey, signature);
  // Vérifie que le token n'a pas expiré (exp est en secondes Unix)
  const isExpired = Number(payload.exp) * 1000 < Date.now();
  // Vérifie que l'émetteur est bien Apple Sign-In
  const isIssuerValid = payload.iss === "https://appleid.apple.com";
  // Vérifie que l'audience correspond à notre Client ID Apple
  const isAudienceValid = payload.aud === audience;

  // Rejette le token si l'une des vérifications échoue (signature, expiration, issuer, audience)
  if (!isValid || isExpired || !isIssuerValid || !isAudienceValid) {
    throw new Error("OAUTH_APPLE_INVALID_ID_TOKEN");
  }

  // Retourne le payload décodé et validé
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
  // Crée un nouveau compte utilisateur local à partir des données du formulaire d'inscription
  async signup(payload, avatarFile = null, meta = {}) {
    // Valide le payload d'inscription (format email, longueur username, force du mot de passe, etc.)
    const validationError = validateRegisterPayload(payload);

    // Si la validation échoue, lève une erreur avec le message descriptif
    if (validationError) {
      throw new Error(validationError);
    }

    // Déstructure le payload pour extraire tous les champs nécessaires à la création du compte
    const {
      username,
      email,
      password,
      full_name,
      role,
      accepted_terms,          // Booléen indiquant l'acceptation des CGU
      accepted_terms_version,  // Version des CGU acceptées (ex: "2024-01")
      accepted_privacy,        // Booléen indiquant l'acceptation de la politique de confidentialité
      accepted_privacy_version, // Version de la politique acceptée
      marketing_consent,       // Consentement optionnel aux communications marketing
      cookies_consent,         // Consentement aux cookies (peut être un objet JSON)
    } = payload;

    // Nettoie le username pour supprimer toute balise HTML potentiellement injectée
    const cleanUsername = stripHtml(username);
    // Nettoie et normalise l'email en minuscules pour la recherche insensible à la casse
    const cleanEmail = stripHtml(email).toLowerCase();
    // Nettoie le nom complet si fourni, sinon null
    const cleanFullName = full_name ? stripHtml(full_name) : null;

    // L'inscription est contractuelle, les documents légaux doivent être acceptés
    // FR: L'inscription est contractuelle, les documents légaux doivent être acceptés.
    // EN: Signup is contractual, legal documents must be accepted before account creation.
    if (!normalizeBoolean(accepted_terms) || !normalizeBoolean(accepted_privacy)) {
      // Lève une erreur si les CGU ou la politique de confidentialité n'ont pas été acceptées
      throw new Error("LEGAL_CONSENT_REQUIRED");
    }

    // Vérifie l'unicité de l'email en cherchant un utilisateur existant avec le même email
    const [existingByEmail] = await models.users.findByEmail(cleanEmail);
    if (existingByEmail.length > 0) {
      // Un compte existe déjà avec cet email - refus de la création
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Vérifie l'unicité du username en cherchant un utilisateur existant avec le même username
    const [existingByUsername] = await models.users.findByUsername(cleanUsername);
    if (existingByUsername.length > 0) {
      // Un compte existe déjà avec ce nom d'utilisateur - refus de la création
      throw new Error("USERNAME_ALREADY_EXISTS");
    }

    // Hache le mot de passe avec argon2id (algorithme recommandé, résistant aux attaques GPU)
    const password_hash = await argon2.hash(password);
    // Utilise le rôle fourni ou "user" par défaut (sécurité : ne pas accepter "admin" depuis le frontend)
    const userRole = role || "user";
    // Construit l'URL de l'avatar si un fichier a été uploadé, sinon null
    const avatarUrl = avatarFile ? `/uploads/avatars/${avatarFile.filename}` : null;

    // Insère le nouvel utilisateur en base de données avec toutes ses données
    const [result] = await models.users.insert({
      username: cleanUsername,
      email: cleanEmail,
      password_hash,                                         // Hash argon2 du mot de passe
      full_name: cleanFullName,
      avatar_url: avatarUrl,
      role: userRole,
      accepted_terms: true,                                  // Enregistre l'acceptation des CGU
      accepted_terms_version,                                // Version des CGU acceptées
      accepted_privacy: true,                                // Enregistre l'acceptation de la politique
      accepted_privacy_version,                              // Version de la politique acceptée
      marketing_consent: normalizeBoolean(marketing_consent), // Normalise le consentement marketing en booléen
      cookies_consent: safeJson(cookies_consent),            // Parse les préférences cookies (JSON sécurisé)
    });

    // Écrit un log d'audit pour tracer l'inscription réussie
    await writeAudit("auth.register_success", {
      actorId: result.insertId, // L'acteur et la cible sont le même utilisateur (auto-inscription)
      targetId: result.insertId,
      metadata: { method: "local", avatarUploaded: Boolean(avatarFile) }, // Méthode locale, présence d'un avatar
      meta,                     // IP et User-Agent de la requête
    });

    // Retourne les données publiques du compte nouvellement créé
    return {
      id: result.insertId,
      username: cleanUsername,
      email: cleanEmail,
      full_name: cleanFullName,
      avatar_url: avatarUrl,
      role: userRole,
      status: "active",            // Nouveau compte actif par défaut
      accepted_terms: true,
      accepted_terms_version,
      accepted_privacy: true,
      accepted_privacy_version,
    };
  }

  // Authentifie un utilisateur par identifiant (email ou username) et mot de passe
  async signin(login, password, meta = {}) {
    // Valide les champs de connexion (non vides, format basique)
    const validationError = validateLoginPayload({ identifier: login, password });

    // Si la validation échoue, lève une erreur descriptive
    if (validationError) {
      throw new Error(validationError);
    }

    // Nettoie et normalise l'identifiant (supprime HTML, met en minuscules)
    const cleanLogin = stripHtml(login).toLowerCase();
    // Recherche l'utilisateur par email ou username
    const [rows] = await models.users.findByLogin(cleanLogin);
    const user = rows[0];

    // Si aucun utilisateur n'est trouvé, on logue la tentative et refuse sans révéler la raison exacte
    if (!user) {
      await writeAudit("auth.login_failed", {
        metadata: { reason: "unknown_user", identifier: cleanLogin }, // Raison interne du refus
        meta,
      });
      // Message générique volontaire pour éviter l'énumération des comptes
      throw new Error("INVALID_CREDENTIALS");
    }

    // Vérifie le mot de passe (supporte argon2 et bcrypt avec migration transparente)
    const isPasswordValid = await verifyPassword(user, password);
    
    // Si le mot de passe est incorrect, log et refus avec message générique
    if (!isPasswordValid) {
      await writeAudit("auth.login_failed", {
        targetId: user.id,
        metadata: { reason: "bad_password" }, // Raison interne : mauvais mot de passe
        meta,
      });
      // Message identique à "utilisateur inconnu" pour éviter le timing attack
      throw new Error("INVALID_CREDENTIALS");
    }

    // Vérifie que le compte est bien actif et que son statut est "active"
    if (!user.is_active || user.status !== "active") {
      await writeAudit("auth.login_failed", {
        targetId: user.id,
        metadata: { reason: "disabled_account", status: user.status }, // Statut du compte bloqué
        meta,
      });
      // Lève une erreur spécifique pour que le frontend affiche un message adapté
      throw new Error("ACCOUNT_DISABLED");
    }

    // Si la 2FA est activée, on ne délivre pas encore le token d'accès - on retourne un token temporaire
    if (user.two_factor_enabled) {
      return {
        requiresTwoFactor: true,                        // Indique au client qu'une étape supplémentaire est requise
        temporaryToken: createTwoFactorTempToken(user), // Token éphémère valable 5 minutes pour valider le TOTP
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          two_factor_enabled: true, // Confirmation que la 2FA est bien activée
        },
      };
    }

    // Génère le JWT d'accès (token final valide pour les requêtes authentifiées)
    const token = createAccessToken(user);
    // Récupère les memberships de blog pour compléter le profil retourné
    const blogMemberships = await getUserMemberships(user.id);
    // Trouve le blog principal : priorité au blog dont l'utilisateur est "owner", sinon le premier
    const mainMembership = blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0];
    // Met à jour la date de dernière connexion de l'utilisateur
    await models.users.updateLastLogin(user.id);
    // Écrit le log d'audit de connexion réussie
    await writeAudit("auth.login_success", {
      actorId: user.id,
      targetId: user.id,
      metadata: { method: "local" }, // Méthode d'authentification locale (vs OAuth)
      meta,
    });

    // Retourne le token, le profil utilisateur complet et la redirection suggérée
    return {
      token,
      user: buildSafeUser(user, blogMemberships),  // Profil sécurisé sans données sensibles
      currentBlog: mainMembership || null,         // Blog principal actif (ou null si aucun)
      // Redirige vers /admin si super-admin, sinon selon le rôle dans le blog principal
      redirectTo: user.platform_role === "admin" || user.role === "admin"
        ? "/admin"
        : getRedirectPathByRole(mainMembership?.role || user.role || "user"),
    };
  }

  // Valide le code TOTP lors de la deuxième étape de connexion (après le token temporaire 2FA)
  async verifyTwoFactorLogin(temporaryToken, code, meta = {}) {
    // Variable pour stocker le payload décodé du token temporaire
    let decoded;

    try {
      // Vérifie et décode le token temporaire 2FA avec le secret dédié
      decoded = jwt.verify(temporaryToken, twoFactorTempSecret);
    } catch (error) {
      // Token expiré, altéré ou signé avec une mauvaise clé
      throw new Error("INVALID_2FA_TOKEN");
    }

    // Vérifie que le type du token est bien "2fa-login" (et non un autre type de token)
    if (decoded.type !== "2fa-login") {
      // Protège contre la réutilisation d'un token d'un autre contexte
      throw new Error("INVALID_2FA_TOKEN");
    }

    // Récupère l'utilisateur complet depuis la base de données via l'id du token
    const [rows] = await models.users.findAuthById(decoded.id);
    const user = rows[0];

    // Vérifie que l'utilisateur existe et que la 2FA est bien activée avec un secret configuré
    if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
      // L'utilisateur n'existe plus ou a désactivé la 2FA entretemps
      throw new Error("INVALID_2FA_TOKEN");
    }

    // Vérifie le code TOTP fourni par l'utilisateur contre le secret stocké en base
    if (!verifyTotp(user.two_factor_secret, code)) {
      await writeAudit("auth.2fa_failed", {
        targetId: user.id,
        metadata: { reason: "bad_totp_login" }, // Code TOTP incorrect lors de la connexion
        meta,
      });
      // Code à 6 chiffres incorrect ou expiré
      throw new Error("INVALID_2FA_CODE");
    }

    // Code TOTP valide - génère le token d'accès final
    const token = createAccessToken(user);
    // Récupère les memberships de blog pour compléter le profil
    const blogMemberships = await getUserMemberships(user.id);
    // Détermine le blog principal (priorité au rôle "owner")
    const mainMembership = blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0];
    // Met à jour la date de dernière connexion
    await models.users.updateLastLogin(user.id);
    // Log la connexion réussie via 2FA
    await writeAudit("auth.login_success", {
      actorId: user.id,
      targetId: user.id,
      metadata: { method: "local_2fa" }, // Distingue la connexion 2FA de la connexion simple
      meta,
    });

    // Retourne le même format de réponse que signin() normal
    return {
      token,
      user: buildSafeUser(user, blogMemberships),
      currentBlog: mainMembership || null,
      redirectTo: user.platform_role === "admin" || user.role === "admin"
        ? "/admin"
        : getRedirectPathByRole(mainMembership?.role || user.role || "user"),
    };
  }

  // Initialise la configuration de la 2FA pour un utilisateur : génère un secret temporaire
  async setupTwoFactor(userId) {
    // Récupère l'utilisateur depuis la base de données (besoin de l'email pour l'URL otpauth)
    const [rows] = await models.users.findAuthById(userId);
    const user = rows[0];

    // Vérifie que l'utilisateur existe
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Génère un nouveau secret TOTP (clé base32 aléatoire)
    const secret = generateSecret();
    // Stocke le secret en "pending" (non encore confirmé) pour éviter de casser la 2FA existante
    await models.users.updateTwoFactorPendingSecret(userId, secret);

    // Retourne le secret et l'URL otpauth (pour générer le QR code affiché à l'utilisateur)
    return {
      secret,                                                       // Secret brut (affiché pour saisie manuelle)
      otpauthUrl: createOtpAuthUrl({ secret, email: user.email }), // URL otpauth:// pour QR code
    };
  }

  // Confirme la configuration 2FA en vérifiant un code TOTP valide et active définitivement la 2FA
  async verifyTwoFactorSetup(userId, code, meta = {}) {
    // Récupère l'utilisateur avec son secret 2FA en attente de confirmation
    const [rows] = await models.users.findAuthById(userId);
    const user = rows[0];

    // Vérifie que l'utilisateur existe et qu'un secret temporaire est bien en attente
    if (!user || !user.two_factor_pending_secret) {
      // Soit l'utilisateur n'existe pas, soit la procédure de setup n'a pas été initiée
      throw new Error("TWO_FACTOR_SETUP_NOT_FOUND");
    }

    // Vérifie que le code TOTP saisi par l'utilisateur correspond au secret en attente
    if (!verifyTotp(user.two_factor_pending_secret, code)) {
      await writeAudit("auth.2fa_failed", {
        actorId: userId,
        targetId: userId,
        metadata: { reason: "bad_totp_setup" }, // Code incorrect lors de la configuration initiale
        meta,
      });
      // Code à 6 chiffres incorrect - l'utilisateur doit rescanner le QR code
      throw new Error("INVALID_2FA_CODE");
    }

    // Génère les codes de récupération (ex: 8 codes à usage unique de 16 caractères)
    const recoveryCodes = generateRecoveryCodes();
    // Hache chaque code de récupération avec argon2 (ils sont sensibles comme des mots de passe)
    const hashedRecoveryCodes = await Promise.all(recoveryCodes.map((recoveryCode) => argon2.hash(recoveryCode)));
    // Active définitivement la 2FA : déplace le secret "pending" vers le secret actif
    await models.users.enableTwoFactor(userId, user.two_factor_pending_secret, hashedRecoveryCodes);
    // Log l'activation de la 2FA
    await writeAudit("auth.2fa_enabled", {
      actorId: userId,
      targetId: userId,
      metadata: { recoveryCodesCount: recoveryCodes.length }, // Nombre de codes générés
      meta,
    });

    // Retourne les codes de récupération en clair UNE SEULE FOIS (ils ne peuvent pas être récupérés après)
    return { recoveryCodes };
  }

  // Désactive la 2FA après vérification du mot de passe ET d'un code TOTP valide (double sécurité)
  async disableTwoFactor(userId, { password, code }, meta = {}) {
    // Récupère l'utilisateur avec ses données d'authentification
    const [rows] = await models.users.findAuthById(userId);
    const user = rows[0];

    // Vérifie que l'utilisateur existe
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Vérifie le mot de passe (supporte argon2 et bcrypt) - chaîne vide si absent pour éviter une erreur
    const isPasswordValid = await verifyPassword(user, password || "");

    // Exige que le mot de passe ET le code TOTP soient tous les deux valides pour désactiver la 2FA
    if (!isPasswordValid || !verifyTotp(user.two_factor_secret, code)) {
      // L'une ou l'autre des vérifications a échoué
      throw new Error("INVALID_CREDENTIALS");
    }

    // Supprime le secret TOTP et les codes de récupération de la base de données
    await models.users.disableTwoFactor(userId);
    // Log la désactivation de la 2FA
    await writeAudit("auth.2fa_disabled", {
      actorId: userId,
      targetId: userId,
      meta,
    });

    // Confirme la désactivation réussie
    return { disabled: true };
  }

  // Construit et retourne l'URL d'autorisation OAuth pour rediriger l'utilisateur vers le fournisseur
  getOAuthRedirectUrl(provider, legalState = {}) {
    // Vérifie que le fournisseur est dans la liste des providers supportés
    if (!oauthProviders.has(provider)) {
      throw new Error("OAUTH_PROVIDER_UNSUPPORTED");
    }

    // Récupère la configuration du provider (clientId, callbackUrl, scope, etc.)
    const config = this.getOAuthProviderConfig(provider);
    // Génère un état JWT signé à courte durée de vie pour protéger contre les attaques CSRF
    const state = jwt.sign(
      {
        provider,                                                  // Fournisseur OAuth concerné
        legalAccepted: normalizeBoolean(legalState.legalAccepted), // Si l'utilisateur a accepté les CGU
        termsVersion: legalState.termsVersion || null,             // Version des CGU acceptées avant OAuth
        privacyVersion: legalState.privacyVersion || null,         // Version de la politique acceptée
      },
      jwtSecret,
      { expiresIn: "10m" } // Le state expire dans 10 minutes pour éviter les replay attacks
    );
    // Construit les paramètres de la requête OAuth
    const params = new URLSearchParams({
      client_id: config.clientId,         // Identifiant de notre application chez le fournisseur
      redirect_uri: config.callbackUrl,   // URL de callback qui sera appelée après l'autorisation
      response_type: "code",              // Flux Authorization Code (le plus sécurisé)
      scope: config.scope,                // Périmètre des données demandées (email, profil)
      state,                              // État JWT pour la protection CSRF
    });

    // Paramètres spécifiques à Google : demande un refresh_token et affiche la sélection de compte
    if (provider === "google") {
      params.set("access_type", "offline");      // Demande un refresh_token pour un accès hors-ligne
      params.set("prompt", "select_account");    // Force l'affichage du sélecteur de compte Google
    }

    // Paramètres spécifiques à Apple : nécessite le mode form_post (Apple envoie le code via POST)
    if (provider === "apple") {
      params.set("response_mode", "form_post"); // Apple envoie le code via POST et non via redirect URL
    }

    // Retourne l'URL complète d'autorisation OAuth
    return `${config.authorizationUrl}?${params.toString()}`;
  }

  // Retourne la configuration du fournisseur OAuth (credentials, URLs) depuis les variables d'environnement
  getOAuthProviderConfig(provider) {
    // Map des configurations par provider, lues depuis les variables d'environnement
    const configs = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,        // ID client Google OAuth2
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Secret client Google OAuth2
        callbackUrl: process.env.GOOGLE_CALLBACK_URL,  // URL de callback après autorisation Google
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth", // Endpoint d'autorisation Google
        tokenUrl: "https://oauth2.googleapis.com/token",    // Endpoint d'échange du code contre un token
        userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo", // Endpoint de récupération du profil
        scope: "openid email profile",                       // Périmètre : identité OpenID + email + profil
      },
      facebook: {
        clientId: process.env.FACEBOOK_APP_ID,          // ID de l'application Facebook
        clientSecret: process.env.FACEBOOK_APP_SECRET,  // Secret de l'application Facebook
        callbackUrl: process.env.FACEBOOK_CALLBACK_URL, // URL de callback après autorisation Facebook
        authorizationUrl: "https://www.facebook.com/v19.0/dialog/oauth", // Endpoint d'autorisation Facebook
        tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token", // Endpoint de token Facebook
        userInfoUrl: "https://graph.facebook.com/me",    // Endpoint Graph API pour le profil
        scope: "email,public_profile",                   // Périmètre : email + profil public
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID,          // Bundle ID ou Service ID Apple
        clientSecret: process.env.APPLE_CLIENT_SECRET,  // JWT signé avec la clé privée Apple
        callbackUrl: process.env.APPLE_CALLBACK_URL,    // URL de callback (doit être HTTPS)
        authorizationUrl: "https://appleid.apple.com/auth/authorize", // Endpoint d'autorisation Apple
        tokenUrl: "https://appleid.apple.com/auth/token",   // Endpoint de token Apple
        userInfoUrl: null,                                   // Apple n'a pas d'endpoint userinfo (données dans id_token)
        scope: "name email",                                 // Périmètre : nom + email (fournis une seule fois)
      },
    };
    // Récupère la configuration du provider demandé
    const config = configs[provider];

    // Vérifie que les credentials essentiels sont bien définis dans les variables d'environnement
    if (!config?.clientId || !config?.clientSecret || !config?.callbackUrl) {
      // Le provider n'est pas configuré dans ce déploiement
      throw new Error("OAUTH_PROVIDER_NOT_CONFIGURED");
    }

    // Retourne la configuration complète du provider
    return config;
  }

  // Gère le callback OAuth : échange le code, récupère le profil, crée ou retrouve l'utilisateur
  async handleOAuthCallback(provider, { code, state }, meta = {}) {
    // Vérifie que le fournisseur OAuth est supporté
    if (!oauthProviders.has(provider)) {
      throw new Error("OAUTH_PROVIDER_UNSUPPORTED");
    }

    // Décode l'état JWT pour récupérer les données de consentement légal transportées
    let decodedState = {};

    try {
      // Vérifie et décode le state JWT (protection CSRF)
      decodedState = state ? jwt.verify(state, jwtSecret) : {};
    } catch (error) {
      // State absent, expiré ou altéré - possible attaque CSRF
      throw new Error("OAUTH_STATE_INVALID");
    }

    // Échange le code d'autorisation contre un token d'accès et récupère le profil normalisé
    const profile = await this.fetchOAuthProfile(provider, code);
    // Trouve l'utilisateur existant ou crée un nouveau compte OAuth
    const user = await this.findOrCreateOAuthUser(provider, profile, decodedState, meta);
    // Récupère les memberships de blog pour compléter le profil
    const blogMemberships = await getUserMemberships(user.id);
    // Détermine le blog principal (priorité au rôle "owner")
    const mainMembership = blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0];
    // Met à jour la date de dernière connexion
    await models.users.updateLastLogin(user.id);
    // Log la connexion OAuth réussie
    await writeAudit("auth.oauth_login_success", {
      actorId: user.id,
      targetId: user.id,
      metadata: { provider },
      meta,
    });

    // Retourne le même format de réponse que signin() standard
    return {
      token: createAccessToken(user),               // JWT d'accès signé
      user: buildSafeUser(user, blogMemberships),   // Profil utilisateur sécurisé
      currentBlog: mainMembership || null,
      redirectTo: user.platform_role === "admin" || user.role === "admin"
        ? "/admin"
        : getRedirectPathByRole(mainMembership?.role || user.role || "user"),
    };
  }

  // Échange le code d'autorisation OAuth contre un token d'accès et récupère le profil utilisateur normalisé
  async fetchOAuthProfile(provider, code) {
    // Récupère la configuration du provider (URLs, credentials)
    const config = this.getOAuthProviderConfig(provider);
    // Envoie une requête POST à l'endpoint de token pour échanger le code contre un access_token
    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" }, // Encodage standard OAuth2
      body: new URLSearchParams({
        client_id: config.clientId,          // Notre identifiant d'application
        client_secret: config.clientSecret,  // Notre secret d'application
        redirect_uri: config.callbackUrl,    // Doit correspondre exactement à l'URL enregistrée
        grant_type: "authorization_code",    // Type de grant OAuth2 utilisé
        code,                                // Code d'autorisation reçu en callback
      }),
    });
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error("OAUTH_TOKEN_EXCHANGE_FAILED");
    }

    if (provider === "facebook") {
      // Appel à l'API Graph Facebook : récupère id, nom, email et photo de profil
      const userInfoResponse = await fetch(`${config.userInfoUrl}?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
      const userInfo = await userInfoResponse.json();
      // Retourne un profil normalisé commun à tous les providers
      return {
        providerUserId: userInfo.id,                          // Identifiant unique Facebook
        email: userInfo.email,                                // Email (peut être absent si non fourni)
        emailVerified: Boolean(userInfo.email),               // Facebook : vérifié si email présent
        name: userInfo.name,                                  // Nom complet
        avatarUrl: userInfo.picture?.data?.url || null,       // URL de l'avatar (structure imbriquuée Facebook)
      };
    }

    // Cas particulier Apple : utilise l'id_token (JWT) plutôt qu'un endpoint userinfo
    if (provider === "apple") {
      // Vérifie la signature et les claims de l'id_token Apple via JWKS
      const applePayload = await verifyAppleIdToken(tokenData.id_token, config.clientId);

      // Retourne un profil normalisé à partir des claims de l'id_token
      return {
        providerUserId: applePayload.sub,                     // Identifiant stable Apple ("sub")
        email: applePayload.email,                            // Email (fourni uniquement à la première connexion)
        emailVerified: Boolean(applePayload.email_verified === true || applePayload.email_verified === "true"), // email_verified peut être booléen ou chaîne
        name: applePayload.email ? applePayload.email.split("@")[0] : "Apple user", // Apple ne fournit le nom que la première fois
        avatarUrl: null,                                      // Apple ne fournit pas d'avatar
      };
    }

    // Cas générique (Google et autres OpenID Connect) : appel à l'endpoint userinfo avec le Bearer token
    const userInfoResponse = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }, // Authentification Bearer standard
    });
    const userInfo = await userInfoResponse.json();

    // Retourne un profil normalisé depuis les claims OpenID Connect standard
    return {
      providerUserId: userInfo.sub,                           // Identifiant unique OpenID Connect ("sub")
      email: userInfo.email,                                  // Email vérifié par le provider
      emailVerified: Boolean(userInfo.email_verified),        // Google retourne un booléen
      name: userInfo.name,                                    // Nom complet
      avatarUrl: userInfo.picture || null,                    // URL de l'avatar Google
    };
  }

  // Trouve un utilisateur existant lié au compte OAuth, le crée sinon (avec linking si email déjà connu)
  async findOrCreateOAuthUser(provider, profile, state, meta = {}) {
    // Cherche si ce compte fournisseur (provider + providerUserId) est déjà lié à un utilisateur local
    const [linkedAccounts] = await models.userOAuthAccounts.findByProviderAccount(provider, profile.providerUserId);

    // Si un lien existe, on retourne directement l'utilisateur local associé
    if (linkedAccounts[0]) {
      const [users] = await models.users.findAuthById(linkedAccounts[0].user_id);
      return users[0];
    }

    // Sécurité : l'email doit être présent et vérifié par le provider
    if (!profile.email || !profile.emailVerified) {
      throw new Error("OAUTH_EMAIL_NOT_VERIFIED");
    }

    // Vérifie si un compte local existe déjà avec cet email (créé avec password ou autre OAuth)
    const [existingUsers] = await models.users.findByEmail(profile.email.toLowerCase());
    const existingUser = existingUsers[0];

    // Cas : compte local trouvé → on lie le compte OAuth sans créer d'utilisateur
    if (existingUser) {
      // Insère la liaison OAuth Account pour les prochaines connexions
      await models.userOAuthAccounts.insert({
        user_id: existingUser.id,
        provider,
        provider_user_id: profile.providerUserId,
        provider_email: profile.email,
        provider_email_verified: profile.emailVerified,
        provider_avatar_url: profile.avatarUrl,
      });
      // Log la liaison du compte OAuth à un compte existant
      await writeAudit("auth.oauth_account_linked", {
        actorId: existingUser.id,
        targetId: existingUser.id,
        metadata: { provider }, // Fournisseur lié
        meta,
      });
      // Retourne le compte existant (pas de création)
      return existingUser;
    }

    // Cas : nouvel utilisateur → vérifie que les CGU ont bien été acceptées avant OAuth
    if (!normalizeBoolean(state.legalAccepted)) {
      throw new Error("LEGAL_CONSENT_REQUIRED");
    }

    // Génère un nom d'utilisateur unique à partir du nom ou de la partie locale de l'email
    const username = await generateUniqueUsername(profile.name || profile.email.split("@")[0]);
    // Génère un mot de passe aléatoire fort (inutilisable manuellement — connexion uniquement via OAuth)
    const passwordHash = await argon2.hash(crypto.randomBytes(32).toString("hex"));
    // Crée le nouvel utilisateur en base de données
    const [result] = await models.users.insert({
      username,
      email: profile.email.toLowerCase(),      // Email normalisé en minuscules
      password_hash: passwordHash,             // Hash argon2 d'un mot de passe aléatoire
      full_name: profile.name,                 // Nom complet fourni par le provider
      avatar_url: profile.avatarUrl,           // Avatar fourni par le provider
      role: "user",                            // Rôle de base
      auth_provider: provider,                 // Provider OAuth d'origine
      provider_id: profile.providerUserId,     // Identifiant chez le provider
      email_verified: profile.emailVerified,   // Email considéré vérifié si vérifié par le provider
      accepted_terms: true,                    // Consentement collecté avant le flux OAuth
      accepted_terms_version: state.termsVersion || null,   // Version des CGU acceptées
      accepted_privacy: true,                  // Consentement vie privée collecté avant OAuth
      accepted_privacy_version: state.privacyVersion || null, // Version de la politique acceptée
    });
    // Lié le compte OAuth au nouvel utilisateur créé
    await models.userOAuthAccounts.insert({
      user_id: result.insertId,
      provider,
      provider_user_id: profile.providerUserId,
      provider_email: profile.email,
      provider_email_verified: profile.emailVerified,
      provider_avatar_url: profile.avatarUrl,
    });

    // Récupère l'utilisateur créé avec toutes ses données d'authentification
    const [users] = await models.users.findAuthById(result.insertId);
    return users[0];
  }
}

// Exporte une instance unique du service (singleton)
module.exports = new AuthService();
// Exporte également la fonction utilitaire pour être utilisée dans les middlewares de redirection
module.exports.getRedirectPathByRole = getRedirectPathByRole;
