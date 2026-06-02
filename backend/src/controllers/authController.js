// authController.js
// Contrôleur : routes d'authentification et gestion 2FA / OAuth
// - Fournit l'inscription (`signup`), la connexion (`signin`), la gestion
//   de la double authentification (setup/verify/disable) et les callbacks OAuth.
// - Délègue la logique métier à `AuthService` et formate les réponses HTTP.
// Exports: signup, signin, verifyTwoFactorLogin, setupTwoFactor, verifyTwoFactorSetup,
//          disableTwoFactor, oauthRedirect, oauthCallback, me
const authService = require("../services/AuthService");
const models = require("../models");
const { getPermissionsForBlogRole } = require("../utils/permissions");

// Récupère des métadonnées utiles pour les logs / sécurité (IP, user-agent)
// - Utilisé par AuthService pour enregistrer la provenance des connexions
function getRequestMeta(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  };
}

const authValidationMessages = [
  "Le pseudo",
  "L'e-mail",
  "Le mot de passe",
  "La confirmation"
];

// isAuthValidationError(error): détecte si l'erreur provient d'une validation
// métier (par ex. champs manquants) afin de renvoyer un 400 plutôt qu'un 500.
function isAuthValidationError(error) {
  return authValidationMessages.some((message) => error.message?.startsWith(message));
}

// POST /api/auth/signup
// FR: Inscrit un nouvel utilisateur dans la base avec un mot de passe haché.
// EN: Registers a new user in the database with a hashed password.
// Body attendu: { username, email, password, confirmPassword?, full_name?, ... }
// - Accepte un fichier `req.file` optionnel (avatar) si upload middleware présent
const signup = async (req, res) => {
  // const { username, email, password, full_name } = req.body;
  const {
    username,
    email,
    password,
    full_name,
    accepted_terms,
    accepted_terms_version,
    accepted_privacy,
    accepted_privacy_version,
    marketing_consent,
    cookies_consent
  } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      status: "fail",
      message: "username, email et password sont obligatoires"
    });
  }

  try {
    const user = await authService.signup({
      username,
      email,
      password,
      confirmPassword: req.body.confirmPassword || req.body.confirm_password || password,
      full_name,
      role: "user",
      accepted_terms,
      accepted_terms_version,
      accepted_privacy,
      accepted_privacy_version,
      marketing_consent,
      cookies_consent
    }, req.file, getRequestMeta(req));

    return res.status(201).json({
      status: "success",
      message: "Compte créé sur BlogYoo",
      data: { user }
    });
  } catch (err) {
    console.error(err);
    console.error("Erreur signup:", err);

    if (err.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        status: "fail",
        message: "Cet email est déjà utilisé."
      });
    }
    if (err.message === "USERNAME_ALREADY_EXISTS") {
      return res.status(409).json({
        status: "fail",
        message: "Ce nom d'utilisateur est déjà utilisé."
      });
    }
    if (err.message === "LEGAL_CONSENT_REQUIRED") {
      return res.status(400).json({
        status: "fail",
        message: "Vous devez accepter les conditions d'utilisation et la politique de confidentialite avant de creer un compte."
      });
    }
    if (isAuthValidationError(err)) {
      return res.status(400).json({
        status: "fail",
        message: err.message
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur lors de la création du compte."
    });
  }
};

// POST /api/auth/signin
// FR: Authentifie l'utilisateur et renvoie un token JWT contenant son rôle.
// EN: Authenticates the user and returns a JWT containing their role.
// Body attendu: { login: string (email|username), password: string }
const signin = async (req, res) => {
  const login = req.body.login || req.body.identifier;
  const { password } = req.body;
  // const {, password } = req.body;

  if (!login || !password) {
    return res.status(400).json({
      status: "fail",
      message: "login et password sont obligatoires"
    });
  }

  try {
    const result = await authService.signin(login, password, getRequestMeta(req));

    if (result.requiresTwoFactor) {
      return res.status(200).json({
        status: "success",
        requiresTwoFactor: true,
        temporaryToken: result.temporaryToken,
        user: result.user
      });
    }

    const { token, user, currentBlog, redirectTo } = result;
    return res.status(200).json({
      status: "success",
      token,
      user,
      currentBlog,
      data: { user, currentBlog },
      redirectTo
    });
  } catch (err) {
    console.error(err);
    if (err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        status: "fail",
        message: "Identifiants incorrects"
      });
    }
    if (err.message === "ACCOUNT_DISABLED") {
      return res.status(403).json({
        status: "fail",
        message: "Ce compte est désactivé"
      });
    }
    if (isAuthValidationError(err)) {
      return res.status(400).json({
        status: "fail",
        message: err.message
      });
    }
    return res.status(500).json({
      status: "error",
      message: "Erreur interne du serveur lors de l'authentification."
    });
  }
};

// verifyTwoFactorLogin(req, res): vérifie le code 2FA lors du login
// - Body attendu: { temporaryToken: string, code: string }
const verifyTwoFactorLogin = async (req, res) => {
  try {
    const { token, user, currentBlog, redirectTo } = await authService.verifyTwoFactorLogin(
      req.body.temporaryToken,
      req.body.code,
      getRequestMeta(req)
    );

    return res.status(200).json({
      status: "success",
      token,
      user,
      currentBlog,
      data: { user, currentBlog },
      redirectTo
    });
  } catch (error) {
    return res.status(401).json({
      status: "fail",
      message: "Code 2FA invalide ou expire."
    });
  }
};

// setupTwoFactor(req, res): commence la procédure d'activation 2FA
// - Requiert que `req.user` soit présent (utilisateur connecté)
const setupTwoFactor = async (req, res) => {
  try {
    const data = await authService.setupTwoFactor(req.user.id);
    return res.status(200).json({ status: "success", data });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

// verifyTwoFactorSetup(req, res): vérifie le code fourni durant l'activation 2FA
// - Body attendu: { code: string }
// - Requiert `req.user` connecté
const verifyTwoFactorSetup = async (req, res) => {
  try {
    const data = await authService.verifyTwoFactorSetup(req.user.id, req.body.code, getRequestMeta(req));
    return res.status(200).json({
      status: "success",
      message: "Double authentification activee.",
      data
    });
  } catch (error) {
    return res.status(400).json({ status: "fail", message: "Code 2FA invalide." });
  }
};

// disableTwoFactor(req, res): désactive la 2FA pour l'utilisateur connecté
// - Body peut contenir une raison/confirmation selon implémentation du service
const disableTwoFactor = async (req, res) => {
  try {
    await authService.disableTwoFactor(req.user.id, req.body, getRequestMeta(req));
    return res.status(200).json({
      status: "success",
      message: "Double authentification desactivee."
    });
  } catch (error) {
    return res.status(400).json({
      status: "fail",
      message: "Impossible de desactiver la double authentification."
    });
  }
};

// oauthRedirect(provider): renvoie l'URL de redirection OAuth pour le provider
// - provider: 'google' | 'facebook' | 'apple'
const oauthRedirect = (provider) => (req, res) => {
  try {
    const url = authService.getOAuthRedirectUrl(provider, {
      legalAccepted: req.query.legalAccepted,
      termsVersion: req.query.termsVersion,
      privacyVersion: req.query.privacyVersion
    });
    return res.redirect(url);
  } catch (error) {
    return res.status(503).json({
      status: "fail",
      message: "Provider OAuth non configure."
    });
  }
};

// oauthCallback(provider): callback HTTP appelé par le provider OAuth
// - Gère l'échange de code pour token et redirige vers le front en ajoutant `token` en query
const oauthCallback = (provider) => async (req, res) => {
  try {
    const { token, redirectTo } = await authService.handleOAuthCallback(
      provider,
      { code: req.body.code || req.query.code, state: req.body.state || req.query.state },
      getRequestMeta(req)
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = new URL("/oauth/callback", frontendUrl);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("redirectTo", redirectTo);
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectUrl = new URL("/signin", frontendUrl);
    redirectUrl.searchParams.set("error", error.message);
    return res.redirect(redirectUrl.toString());
  }
};

// me(req, res): retourne les informations de l'utilisateur courant + memberships
// - Requiert `req.user` injecté par `protect` middleware
const me = async (req, res) => {
  try {
    const [memberships] = await models.blogMembers.findByUser(req.user.id);
    const blogMemberships = memberships.map((membership) => ({
      blogId: membership.blog_id,
      blogName: membership.blog_name,
      blogSlug: membership.blog_slug,
      role: membership.role,
      permissions: getPermissionsForBlogRole(membership.role)
    }));

    return res.status(200).json({
      status: "success",
      user: {
        ...req.user,
        blogMemberships
      },
      currentBlog: blogMemberships.find((membership) => membership.role === "owner") || blogMemberships[0] || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Erreur serveur." });
  }
};

module.exports = {
  disableTwoFactor,
  signup,
  signin,
  oauthCallback,
  oauthRedirect,
  setupTwoFactor,
  verifyTwoFactorLogin,
  verifyTwoFactorSetup,
  me
};
