// ============================================================
// authController.js
// Contrôleur Express : authentification, 2FA et OAuth.
//
// Rôle :
//   Gère toutes les routes liées à l'identité : inscription, connexion,
//   double authentification TOTP et connexion via OAuth (Google, Facebook…).
//   Délègue 100% de la logique métier à AuthService.
//
// Architecture Express :
//   req (Request)  : objet entrant — body JSON, query params, user agent
//   res (Response) : objet sortant — envoie le statut HTTP et les données JSON
//
// req.body : données JSON envoyées par le client dans la requête POST
//   → Champs selon la route (username, email, password, code, token…)
//
// req.query : paramètres de l'URL (GET) → utilisés par oauthRedirect
//   → req.query.legalAccepted  : consentements legaux passés à OAuth
//   → req.query.termsVersion   : version des CGU acceptées
//   → req.query.privacyVersion : version de la politique de confidentialité acceptée
//
// req.user : injecté par le middleware protect() sur les routes protégées
//   → req.user.id : id de l'utilisateur connecté (requis pour 2FA et me())
//
// req.file : objet Multer (optionnel pour signup avec upload d'avatar)
//   → Présent si le middleware d'upload multipart est activé sur la route
//
// JWT (JSON Web Token) :
//   → token          : jeton d'authentification envoyé au client (Bearer token)
//   → temporaryToken : jeton court-terme pendant la vérification 2FA
//
// Codes HTTP :
//   200 OK          : signin, 2FA verify, me — opération réussie
//   201 Created     : signup — compte créé
//   400 Bad Request : données invalides, code 2FA incorrect, champ manquant
//   401 Unauthorized: identifiants incorrects, code 2FA invalide (login)
//   403 Forbidden   : compte désactivé
//   409 Conflict    : email ou username déjà utilisé
//   500 Server Err  : erreur interne inattendue
//   503 Unavailable : provider OAuth non configuré
//
// Exports : disableTwoFactor, signup, signin, oauthCallback, oauthRedirect,
//           setupTwoFactor, verifyTwoFactorLogin, verifyTwoFactorSetup, me
// ============================================================

// AuthService : service contenant toute la logique d'authentification
// → signup, signin, setupTwoFactor, verifyTwoFactorLogin, handleOAuthCallback…
const authService = require("../services/AuthService");

// models : accès aux managers BDD (ici : models.blogMembers pour me())
const models = require("../models");

// getPermissionsForBlogRole : utilitaire qui retourne les permissions d'un rôle de blog
// → Ex: getPermissionsForBlogRole("editor") → { canPost: true, canComment: true, ... }
const { getPermissionsForBlogRole } = require("../utils/permissions");

/* ----------------------------------------------------------------
 * getRequestMeta(req) — Fonction utilitaire locale
 * Extrait les métadonnées de la requête HTTP utiles pour l'audit de sécurité.
 *
 * req.ip         : adresse IP du client (peut être "::1" en local, "x.x.x.x" en prod)
 * req.get(header): méthode Express pour lire un header HTTP (ici : "user-agent")
 *   → User-Agent : identifiant du navigateur ou client HTTP (ex: "Chrome/130")
 *
 * Retourne : { ip, userAgent }
 * Utilisé par AuthService pour enregistrer la provenance des connexions
 * ---------------------------------------------------------------- */
function getRequestMeta(req) {
  return {
    ip: req.ip,                    // Adresse IP du client connecté
    userAgent: req.get("user-agent"), // Navigateur/client HTTP du requérant
  };
}

// Liste des préfixes de messages d'erreur issus des validations métier AuthService
// → Utilisée pour distinguer une erreur 400 (client) d'une erreur 500 (serveur)
const authValidationMessages = [
  "Le pseudo",       // Erreur sur le pseudonyme
  "L'e-mail",        // Erreur sur l'adresse email
  "Le mot de passe", // Erreur sur le mot de passe
  "La confirmation"  // Erreur sur la confirmation du mot de passe
];

/* ----------------------------------------------------------------
 * isAuthValidationError(error) — Fonction utilitaire locale
 * Détermine si une erreur provient d'une validation métier (→ HTTP 400)
 * plutôt que d'un bug serveur (→ HTTP 500).
 *
 * Comparaison avec authValidationMessages : si le message d'erreur
 * commence par l'un des préfixes listés, c'est une erreur de saisie.
 * ---------------------------------------------------------------- */
function isAuthValidationError(error) {
  // .some() retourne true si au moins un préfixe correspond au début du message
  return authValidationMessages.some((message) => error.message?.startsWith(message));
}

/* ----------------------------------------------------------------
 * signup(req, res)
 * Route : POST /api/auth/signup
 * Inscrit un nouvel utilisateur avec un mot de passe haché.
 *
 * req.body : données du formulaire d'inscription
 *   → username                : pseudonyme (obligatoire, unique en BDD)
 *   → email                   : adresse email (obligatoire, unique en BDD)
 *   → password                : mot de passe en clair (obligatoire, sera haché)
 *   → full_name               : nom complet (optionnel)
 *   → confirmPassword         : confirmation du mot de passe (optionnel)
 *   → accepted_terms          : booléen consentement aux CGU (obligatoire légalement)
 *   → accepted_terms_version  : version des CGU acceptées (horodatage)
 *   → accepted_privacy        : booléen consentement politique de confidentialité
 *   → accepted_privacy_version: version de la politique acceptée
 *   → marketing_consent       : booléen consentement marketing (optionnel)
 *   → cookies_consent         : booléen consentement cookies (optionnel)
 *
 * req.file : fichier avatar optionnel (si Multer est configuré sur la route)
 *
 * Codes d'erreur spécifiques :
 *   EMAIL_ALREADY_EXISTS    → HTTP 409 (email déjà utilisé)
 *   USERNAME_ALREADY_EXISTS → HTTP 409 (username déjà utilisé)
 *   LEGAL_CONSENT_REQUIRED  → HTTP 400 (CGU non acceptées)
 *   isAuthValidationError() → HTTP 400 (champs invalides)
 *
 * HTTP 201 Created : compte créé avec les données de l'utilisateur
 * ---------------------------------------------------------------- */
const signup = async (req, res) => {
  // Destructuration du body : extraction de tous les champs attendus
  const {
    username,               // Pseudonyme unique
    email,                  // Email unique
    password,               // Mot de passe en clair (sera haché par AuthService)
    full_name,              // Nom complet (optionnel)
    accepted_terms,         // Consentement aux Conditions Générales d'Utilisation
    accepted_terms_version, // Version des CGU acceptées (pour audit légal)
    accepted_privacy,       // Consentement à la politique de confidentialité
    accepted_privacy_version, // Version de la politique (pour audit légal)
    marketing_consent,      // Consentement emails marketing (optionnel)
    cookies_consent         // Consentement cookies non essentiels (optionnel)
  } = req.body;

  // Validation des champs obligatoires avant d'appeler le service
  if (!username || !email || !password) {
    // HTTP 400 Bad Request : champs minimaux manquants
    return res.status(400).json({
      status: "fail",
      message: "username, email et password sont obligatoires"
    });
  }

  try {
    // Délégation à AuthService : validation, hachage, INSERT, envoi d'email…
    const user = await authService.signup({
      username,
      email,
      password,
      // Accepte confirmPassword (camelCase) ou confirm_password (snake_case) ou password (fallback)
      confirmPassword: req.body.confirmPassword || req.body.confirm_password || password,
      full_name,
      role: "user",           // Rôle par défaut lors de l'inscription publique
      accepted_terms,
      accepted_terms_version,
      accepted_privacy,
      accepted_privacy_version,
      marketing_consent,
      cookies_consent
    }, req.file, getRequestMeta(req)); // req.file = avatar optionnel ; getRequestMeta = IP + UA

    // HTTP 201 Created : inscription réussie, retourne les données publiques de l'utilisateur
    return res.status(201).json({
      status: "success",
      message: "Compte créé sur BlogYoo",
      data: { user } // Données de l'utilisateur créé (sans password_hash)
    });
  } catch (err) {
    console.error(err);          // Log complet côté serveur
    console.error("Erreur signup:", err); // Log supplémentaire avec contexte

    // Gestion des erreurs métier spécifiques retournées par AuthService
    if (err.message === "EMAIL_ALREADY_EXISTS") {
      // L'email est déjà enregistré en base → contrainte UNIQUE violée
      return res.status(409).json({
        status: "fail",
        message: "Cet email est déjà utilisé."
      });
    }
    if (err.message === "USERNAME_ALREADY_EXISTS") {
      // Le pseudonyme est déjà pris → contrainte UNIQUE violée
      return res.status(409).json({
        status: "fail",
        message: "Ce nom d'utilisateur est déjà utilisé."
      });
    }
    if (err.message === "LEGAL_CONSENT_REQUIRED") {
      // L'utilisateur n'a pas coché les cases CGU/politique de confidentialité
      return res.status(400).json({
        status: "fail",
        message: "Vous devez accepter les conditions d'utilisation et la politique de confidentialite avant de creer un compte."
      });
    }
    if (isAuthValidationError(err)) {
      // Erreur de validation métier (ex: "Le mot de passe doit contenir…")
      return res.status(400).json({
        status: "fail",
        message: err.message // Message du service (déjà formaté pour l'utilisateur)
      });
    }
    // Erreur inattendue côté serveur (SQL, argon2…)
    return res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur lors de la création du compte."
    });
  }
};

/* ----------------------------------------------------------------
 * signin(req, res)
 * Route : POST /api/auth/signin
 * Authentifie un utilisateur et retourne un JWT ou un token 2FA temporaire.
 *
 * req.body : données de connexion
 *   → login (ou identifier) : email ou username (accepte les deux champs)
 *   → password              : mot de passe en clair
 *
 * Flux de réponse :
 *   Cas 1 — 2FA activée : retourne { requiresTwoFactor: true, temporaryToken, user }
 *     → Le client doit ensuite appeler verifyTwoFactorLogin avec le temporaryToken
 *   Cas 2 — Pas de 2FA  : retourne { token, user, currentBlog, redirectTo }
 *     → token : JWT utilisé comme Bearer token dans les requêtes suivantes
 *
 * Codes d'erreur :
 *   INVALID_CREDENTIALS → HTTP 401 (email/mdp incorrect)
 *   ACCOUNT_DISABLED    → HTTP 403 (compte désactivé par un admin)
 * ---------------------------------------------------------------- */
const signin = async (req, res) => {
  // On accepte "login" (convention frontend) ou "identifier" (autre convention)
  const login = req.body.login || req.body.identifier;
  const { password } = req.body; // Mot de passe en clair à vérifier contre le hash

  // Validation : les deux champs sont obligatoires pour s'authentifier
  if (!login || !password) {
    return res.status(400).json({
      status: "fail",
      message: "login et password sont obligatoires" // HTTP 400
    });
  }

  try {
    // AuthService vérifie les identifiants et retourne soit un 2FA-flow soit un JWT
    const result = await authService.signin(login, password, getRequestMeta(req));

    if (result.requiresTwoFactor) {
      // Cas 1 : l'utilisateur a activé la 2FA → on ne retourne PAS le JWT définitif
      // Le client doit valider le code TOTP via verifyTwoFactorLogin()
      return res.status(200).json({
        status: "success",
        requiresTwoFactor: true,        // Signal pour le frontend : code 2FA requis
        temporaryToken: result.temporaryToken, // Token court-terme (expire vite)
        user: result.user               // Informations basiques de l'utilisateur
      });
    }

    // Cas 2 : connexion directe sans 2FA → on retourne le JWT définitif
    const { token, user, currentBlog, redirectTo } = result;
    return res.status(200).json({
      status: "success",
      token,        // JWT à stocker côté client (Authorization: Bearer <token>)
      user,         // Objet utilisateur complet (sans password_hash)
      currentBlog,  // Blog principal de l'utilisateur (pour la redirection)
      data: { user, currentBlog }, // Redondance pour compatibilité avec des clients anciens
      redirectTo    // URL de redirection suggérée par le service
    });
  } catch (err) {
    console.error(err); // Log de l'erreur côté serveur
    if (err.message === "INVALID_CREDENTIALS") {
      // Email/username ou mot de passe incorrect → HTTP 401 Unauthorized
      return res.status(401).json({
        status: "fail",
        message: "Identifiants incorrects" // Message volontairement vague (sécurité)
      });
    }
    if (err.message === "ACCOUNT_DISABLED") {
      // Compte suspendu par un administrateur → HTTP 403 Forbidden
      return res.status(403).json({
        status: "fail",
        message: "Ce compte est désactivé"
      });
    }
    if (isAuthValidationError(err)) {
      // Erreur de validation métier → HTTP 400
      return res.status(400).json({
        status: "fail",
        message: err.message
      });
    }
    // Erreur serveur inattendue
    return res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur lors de l'authentification."
    });
  }
};

/* ----------------------------------------------------------------
 * verifyTwoFactorLogin(req, res)
 * Route : POST /api/auth/2fa/verify-login
 * Vérifie le code TOTP lors d'une connexion avec 2FA activée.
 *
 * Flux :
 *   1. L'utilisateur s'est connecté → signin() a retourné temporaryToken
 *   2. L'utilisateur saisit son code TOTP depuis son application authenticator
 *   3. Ce contrôleur valide le code et retourne le JWT définitif si correct
 *
 * req.body.temporaryToken : token JWT court-terme reçu lors de signin()
 * req.body.code           : code TOTP à 6 chiffres de l'application authenticator
 *
 * HTTP 200 : code valide → retourne { token, user, currentBlog, redirectTo }
 * HTTP 401 : code invalide ou expiré → HTTP 401 Unauthorized
 * ---------------------------------------------------------------- */
const verifyTwoFactorLogin = async (req, res) => {
  try {
    // Le service vérifie le code TOTP contre le secret stocké en BDD
    // Si valide → retourne le JWT définitif + données utilisateur
    const { token, user, currentBlog, redirectTo } = await authService.verifyTwoFactorLogin(
      req.body.temporaryToken, // Token court-terme issu de signin()
      req.body.code,           // Code TOTP saisi par l'utilisateur
      getRequestMeta(req)      // IP + User-Agent pour l'audit
    );

    // HTTP 200 OK : 2FA validée → retourne le JWT définitif
    return res.status(200).json({
      status: "success",
      token,        // JWT définitif (remplace le temporaryToken)
      user,         // Données complètes de l'utilisateur
      currentBlog,  // Blog principal
      data: { user, currentBlog }, // Redondance pour compatibilité
      redirectTo    // URL de redirection suggérée
    });
  } catch (error) {
    // Code invalide, expiré ou temporaryToken invalide → HTTP 401 Unauthorized
    return res.status(401).json({
      status: "fail",
      message: "Code 2FA invalide ou expire."
    });
  }
};

/* ----------------------------------------------------------------
 * setupTwoFactor(req, res)
 * Route : POST /api/auth/2fa/setup
 * Initialise la procédure d'activation 2FA pour l'utilisateur connecté.
 *
 * req.user.id : id de l'utilisateur connecté (injecté par protect())
 *
 * Retourne : { otpAuthUrl, secret, qrCodeDataUrl }
 *   → otpAuthUrl    : URL otpauth:// à scanner ou copier dans l'app authenticator
 *   → secret        : clé secrète TOTP (à stocker temporairement côté client)
 *   → qrCodeDataUrl : image QR code base64 à afficher pour l'utilisateur
 *
 * Cette étape ne valide pas encore la 2FA : l'utilisateur doit confirmer
 * via verifyTwoFactorSetup() avec un code valide avant d'activer la 2FA.
 * ---------------------------------------------------------------- */
const setupTwoFactor = async (req, res) => {
  try {
    // Le service génère un secret TOTP et retourne le QR code
    const data = await authService.setupTwoFactor(req.user.id);
    return res.status(200).json({ status: "success", data }); // HTTP 200 OK
  } catch (error) {
    // Erreur système lors de la génération du secret TOTP
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

/* ----------------------------------------------------------------
 * verifyTwoFactorSetup(req, res)
 * Route : POST /api/auth/2fa/verify-setup
 * Confirme l'activation 2FA avec un code valide de l'application authenticator.
 *
 * req.user.id  : id de l'utilisateur connecté
 * req.body.code: code TOTP à 6 chiffres pour confirmer que l'app est configurée
 *
 * HTTP 200 : code valide → 2FA activée en BDD (totp_enabled = true)
 * HTTP 400 : code TOTP invalide ou secret non trouvé
 * ---------------------------------------------------------------- */
const verifyTwoFactorSetup = async (req, res) => {
  try {
    // Le service vérifie le code TOTP et active définitivement la 2FA si correct
    const data = await authService.verifyTwoFactorSetup(req.user.id, req.body.code, getRequestMeta(req));
    return res.status(200).json({
      status: "success",
      message: "Double authentification activee.", // Message de confirmation
      data // Données retournées par le service (ex: recovery codes)
    }); // HTTP 200 OK
  } catch (error) {
    // Code TOTP invalide → HTTP 400 Bad Request
    return res.status(400).json({ status: "fail", message: "Code 2FA invalide." });
  }
};

/* ----------------------------------------------------------------
 * disableTwoFactor(req, res)
 * Route : POST /api/auth/2fa/disable
 * Désactive la 2FA pour l'utilisateur connecté.
 *
 * req.user.id : id de l'utilisateur connecté
 * req.body    : peut contenir une confirmation (code, password…) selon le service
 *
 * HTTP 200 : 2FA désactivée (totp_enabled = false, totp_secret = null)
 * HTTP 400 : confirmation invalide (mot de passe incorrect ou code invalide)
 * ---------------------------------------------------------------- */
const disableTwoFactor = async (req, res) => {
  try {
    // Le service désactive la 2FA et efface le secret TOTP en BDD
    await authService.disableTwoFactor(req.user.id, req.body, getRequestMeta(req));
    return res.status(200).json({
      status: "success",
      message: "Double authentification desactivee." // HTTP 200 OK
    });
  } catch (error) {
    // Confirmation invalide ou erreur de désactivation → HTTP 400
    return res.status(400).json({
      status: "fail",
      message: "Impossible de desactiver la double authentification."
    });
  }
};

/* ----------------------------------------------------------------
 * oauthRedirect(provider) — Currying : retourne une fonction Express
 * Route : GET /api/auth/:provider/redirect (ex: /auth/google/redirect)
 * Génère l'URL de redirection vers le provider OAuth et redirige le client.
 *
 * provider : identifiant du fournisseur OAuth ('google', 'facebook', 'apple')
 * Currying : oauthRedirect('google') → retourne (req, res) => {...}
 *   → Cela permet de réutiliser la même logique pour n'importe quel provider
 *   → En passant provider comme closure variable
 *
 * req.query : paramètres GET transmis à l'URL OAuth pour conserver le consentement légal
 *   → legalAccepted  : a-t-on accepté les CGU avant la redirection OAuth ?
 *   → termsVersion   : version des CGU acceptées
 *   → privacyVersion : version de la politique de confidentialité
 *
 * res.redirect(url) : redirige le navigateur vers l'URL du provider OAuth
 * HTTP 503 : provider non configuré (variables d'env manquantes)
 * ---------------------------------------------------------------- */
const oauthRedirect = (provider) => (req, res) => {
  // Fonction retournée par le currying — reçoit (req, res) normalement
  try {
    // Le service construit l'URL OAuth avec client_id, redirect_uri, scopes…
    const url = authService.getOAuthRedirectUrl(provider, {
      legalAccepted: req.query.legalAccepted,   // Consentement CGU passé en query
      termsVersion: req.query.termsVersion,     // Version CGU passée en query
      privacyVersion: req.query.privacyVersion  // Version politique de confidentialité
    });
    return res.redirect(url); // Redirection HTTP 302 vers le provider OAuth
  } catch (error) {
    // Le provider n'est pas configuré (variables d'env OAUTH_CLIENT_ID absentes)
    return res.status(503).json({
      status: "fail",
      message: "Provider OAuth non configure." // HTTP 503 Service Unavailable
    });
  }
};

/* ----------------------------------------------------------------
 * oauthCallback(provider) — Currying : retourne une fonction Express async
 * Route : GET/POST /api/auth/:provider/callback (ex: /auth/google/callback)
 * Gère le retour du provider OAuth (échange de code → token JWT).
 *
 * Flux OAuth Authorization Code :
 *   1. L'utilisateur est redirigé vers le provider (via oauthRedirect)
 *   2. L'utilisateur accepte → le provider redirige vers ce callback
 *   3. Ce callback échange le code contre un token d'accès OAuth
 *   4. Le service crée ou récupère l'utilisateur et génère un JWT
 *   5. On redirige le frontend vers /oauth/callback?token=<jwt>
 *
 * req.body.code ou req.query.code : code temporaire envoyé par le provider OAuth
 *   → Peut être dans le body (POST) ou dans l'URL (GET) selon le provider
 * req.body.state ou req.query.state : paramètre de sécurité anti-CSRF
 *
 * process.env.FRONTEND_URL : URL du frontend (ex: "https://blogyoo.com")
 * new URL("/oauth/callback", frontendUrl) : construit l'URL complète de redirection
 * redirectUrl.searchParams.set() : ajoute des paramètres query à l'URL
 *
 * En cas de succès : redirect vers /oauth/callback?token=...&redirectTo=...
 * En cas d'erreur  : redirect vers /signin?error=...
 * ---------------------------------------------------------------- */
const oauthCallback = (provider) => async (req, res) => {
  // Fonction retournée par le currying — reçoit (req, res) normalement
  try {
    // Le service échange le code OAuth contre un token d'accès, puis génère un JWT
    const { token, redirectTo } = await authService.handleOAuthCallback(
      provider,
      {
        // On accepte le code dans le body (POST) ou dans l'URL (GET)
        code: req.body.code || req.query.code,
        // State OAuth : paramètre de sécurité pour prévenir les attaques CSRF
        state: req.body.state || req.query.state
      },
      getRequestMeta(req) // IP + User-Agent pour l'audit de sécurité
    );

    // Construction de l'URL de redirection vers le frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // URL frontend
    const redirectUrl = new URL("/oauth/callback", frontendUrl); // Page de callback frontend
    redirectUrl.searchParams.set("token", token);           // JWT passé en paramètre
    redirectUrl.searchParams.set("redirectTo", redirectTo); // Destination finale suggérée
    return res.redirect(redirectUrl.toString()); // Redirection HTTP 302 vers le frontend
  } catch (error) {
    // OAuth a échoué (code expiré, provider non configuré, compte suspendu…)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"; // URL frontend
    const redirectUrl = new URL("/signin", frontendUrl); // Redirection vers la page de connexion
    redirectUrl.searchParams.set("error", error.message); // Message d'erreur dans l'URL
    return res.redirect(redirectUrl.toString()); // Redirection HTTP 302 vers /signin?error=...
  }
};

/* ----------------------------------------------------------------
 * me(req, res)
 * Route : GET /api/auth/me
 * Retourne les informations de l'utilisateur actuellement connecté.
 *
 * req.user : objet injecté par le middleware protect()
 *   → Contient : id, username, email, role, globalRole, avatar_url…
 *
 * blogMemberships : liste des blogs auxquels l'utilisateur appartient
 *   → Requête sur models.blogMembers.findByUser(userId)
 *   → Chaque entrée est enrichie avec les permissions calculées
 *
 * getPermissionsForBlogRole(role) : calcule les permissions à partir du rôle
 *   → Ex: "editor" → { canPost: true, canComment: true, canModerate: false }
 *
 * currentBlog : blog "principal" de l'utilisateur
 *   → En priorité le blog dont il est "owner", sinon le premier de la liste
 *   → null si l'utilisateur n'est membre d'aucun blog
 *
 * HTTP 200 : retourne { user: { ...req.user, blogMemberships }, currentBlog }
 * HTTP 500 : erreur SQL inattendue
 * ---------------------------------------------------------------- */
const me = async (req, res) => {
  try {
    // Récupération de tous les memberships actifs de l'utilisateur connecté
    // findByUser() → SELECT blog_id, blog_name, blog_slug, role FROM blog_members WHERE user_id = ?
    const [memberships] = await models.blogMembers.findByUser(req.user.id);

    // Transformation : on enrichit chaque membership avec les permissions calculées
    const blogMemberships = memberships.map((membership) => ({
      blogId: membership.blog_id,     // Id du blog
      blogName: membership.blog_name, // Nom du blog
      blogSlug: membership.blog_slug, // Slug URL du blog
      role: membership.role,          // Rôle de l'utilisateur dans ce blog
      // Calcul des permissions à partir du rôle (ex: "editor" → { canPost: true })
      permissions: getPermissionsForBlogRole(membership.role)
    }));

    // HTTP 200 OK : retourne l'utilisateur connecté enrichi de ses memberships
    return res.status(200).json({
      status: "success",
      user: {
        ...req.user,       // Toutes les données de req.user (injectées par protect())
        blogMemberships    // Enrichissement avec les blogs de l'utilisateur
      },
      // Blog "principal" : préférence pour le blog dont il est owner
      // Si pas d'owner : premier blog de la liste ; si aucun blog : null
      currentBlog: blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0] || null
    });
  } catch (error) {
    console.error(error); // Log de l'erreur SQL
    return res.status(500).json({ status: "error", message: "Erreur serveur." }); // HTTP 500
  }
};

// Exportation des fonctions pour le router (backend/src/routes/auth.js)
module.exports = {
  disableTwoFactor,    // POST /auth/2fa/disable          → désactive la 2FA
  signup,              // POST /auth/signup                → inscription
  signin,              // POST /auth/signin                → connexion
  oauthCallback,       // GET  /auth/:provider/callback   → callback OAuth (curried)
  oauthRedirect,       // GET  /auth/:provider/redirect   → redirection OAuth (curried)
  setupTwoFactor,      // POST /auth/2fa/setup            → initialisation 2FA
  verifyTwoFactorLogin,  // POST /auth/2fa/verify-login   → vérification code 2FA (login)
  verifyTwoFactorSetup,  // POST /auth/2fa/verify-setup   → confirmation activation 2FA
  me                   // GET  /auth/me                   → informations utilisateur connecté
};
