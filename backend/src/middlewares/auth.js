// Importation du module jsonwebtoken pour vérifier et décoder les tokens JWT
const jwt = require("jsonwebtoken");
// Importation du secret JWT depuis la configuration centralisée
const { jwtSecret } = require("../config/jwtConfig");
// Importation de l'index des modèles pour accéder à la base de données
const models = require("../models");

// Middleware "protect" : vérifie que l'utilisateur est authentifié via un token JWT valide
// Ce middleware est placé sur toutes les routes qui nécessitent une connexion
const protect = async (req, res, next) => {
  // Lecture de l'en-tête Authorization envoyé par le client HTTP
  const authHeader = req.headers.authorization;

  // Si l'en-tête est absent ou ne commence pas par "Bearer ", on refuse l'accès (401 Unauthorized)
  // Le schéma "Bearer" est la convention standard pour les tokens JWT dans les API REST
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentification requise.",
    });
  }

  // Extraction du token : on supprime le préfixe "Bearer " (7 caractères) pour ne garder que la valeur JWT
  const token = authHeader.split(" ")[1];

  try {
    // Vérification cryptographique du token avec le secret JWT
    // jwt.verify lève une erreur si le token est invalide, falsifié ou expiré
    const decoded = jwt.verify(token, jwtSecret);
    // Recherche en base de données de l'utilisateur dont l'id est contenu dans le payload JWT
    // findSafeById retourne uniquement les champs non-sensibles (pas le mot de passe)
    const [rows] = await models.users.findSafeById(decoded.id);
    // Récupération du premier (et unique) résultat de la requête SQL
    const user = rows[0];

    // Si l'utilisateur n'existe pas, est désactivé (is_active=false) ou n'a pas le statut "active"
    // on retourne un 401 pour éviter les accès avec des comptes supprimés/bannis
    if (!user || !user.is_active || user.status !== "active") {
      return res.status(401).json({
        status: "error",
        message: "Authentification requise.",
      });
    }

    // Attachement de l'objet utilisateur (épuré, sans mot de passe ni données sensibles) à req.user
    // req.user est ensuite accessible dans tous les middlewares et contrôleurs suivants de la chaîne
    req.user = {
      id: user.id,                       // Identifiant unique de l'utilisateur en base de données
      email: user.email,                 // Adresse e-mail (utile pour les notifications)
      username: user.username,           // Pseudonyme public de l'utilisateur
      full_name: user.full_name,         // Nom complet (prénom + nom)
      avatar_url: user.avatar_url,       // URL de l'image de profil
      role: user.role,                   // Rôle dans le contexte du blog actuel (owner, editor, viewer…)
      status: user.status,               // Statut du compte (active, banned, suspended…)
      // Rôle global sur la plateforme : on utilise platform_role s'il est défini en base,
      // sinon on déduit "admin" si le rôle applicatif est "admin", sinon on assigne "user" par défaut
      globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
    };

    // Passage au middleware ou contrôleur suivant dans la chaîne Express
    return next();
  } catch (err) {
    // Journalisation de l'erreur côté serveur pour faciliter le débogage
    console.error(err);
    // Réponse 401 générique : on ne précise pas la nature de l'erreur pour ne pas aider un attaquant
    return res.status(401).json({
      status: "error",
      message: "Token invalide ou expiré.",
    });
  }
};

// Middleware "optionalProtect" : tente de reconnaître l'utilisateur sans bloquer les non-authentifiés
// Utile pour les routes publiques qui affichent un contenu enrichi pour les membres connectés
const optionalProtect = async (req, res, next) => {
  // Lecture de l'en-tête Authorization
  const authHeader = req.headers.authorization;

  // Si aucun token n'est présent, on continue simplement la chaîne sans attacher d'utilisateur
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    // Extraction du token JWT depuis l'en-tête
    const token = authHeader.split(" ")[1];
    // Vérification du token ; si invalide, le bloc catch ci-dessous absorbe l'erreur silencieusement
    const decoded = jwt.verify(token, jwtSecret);
    // Récupération de l'utilisateur en base de données
    const [rows] = await models.users.findSafeById(decoded.id);
    const user = rows[0];

    // Si l'utilisateur existe et est actif, on l'attache à req.user comme dans le middleware "protect"
    if (user && user.is_active && user.status === "active") {
      // FR: Auth facultative pour exposer les contenus publics tout en reconnaissant un membre connecté.
      // EN: Optional auth exposes public content while still recognizing a signed-in member.
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        status: user.status,
        globalRole: user.platform_role || (user.role === "admin" ? "admin" : "user"),
      };
    }

    // Dans tous les cas (token valide ou utilisateur non trouvé), on passe au middleware suivant
    return next();
  } catch (err) {
    // En cas d'erreur JWT (token expiré, signature invalide, etc.),
    // on ignore silencieusement et on continue sans attacher d'utilisateur à la requête
    return next();
  }
};

// Fonction génératrice de middleware RBAC (Role-Based Access Control)
// Prend une liste de rôles autorisés (syntaxe rest "...") et retourne un middleware de vérification
// Exemple d'utilisation : router.get('/admin', protect, restrictTo('admin'), handler)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Lecture du rôle global (plateforme) et du rôle applicatif (blog) de l'utilisateur courant
    const globalRole = req.user?.globalRole;  // Rôle sur l'ensemble de la plateforme
    const assignedRole = req.user?.role;       // Rôle dans le contexte d'un blog spécifique

    // Si l'utilisateur n'est pas authentifié (req.user absent),
    // ou si aucun de ses rôles n'est présent dans la liste des rôles autorisés, accès refusé
    if (!req.user || (!roles.includes(globalRole) && !roles.includes(assignedRole))) {
      return res.status(403).json({
        status: "error",
        message: "Accès interdit : rôle insuffisant.",
      });
    }

    // L'utilisateur possède au moins un rôle autorisé : on passe au middleware suivant
    return next();
  };
};

// Export des trois middlewares pour utilisation dans les fichiers de routes
module.exports = {
  optionalProtect,  // Auth facultative pour routes publiques
  protect,          // Auth obligatoire pour routes privées
  restrictTo,       // Contrôle d'accès par rôle (RBAC)
};
