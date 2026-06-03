// utils/permissions.js
// ============================================================
// Définition complète du système de permissions de l'application.
// Ce fichier centralise :
//   1. Les constantes de permissions (chaînes lisibles par la machine)
//   2. Le mapping rôle de blog → liste de permissions associées
//   3. L'ensemble des permissions admin (toutes les permissions)
//   4. Des fonctions helper pour interroger les permissions
//
// Convention de nommage des permissions : "domaine:action"
//   ex: "post:create", "blog:delete", "admin:manage_users"
// ============================================================

// Import des constantes de rôles depuis le module dédié
// pour éviter de dupliquer les chaînes littérales
const { BLOG_ROLES, GLOBAL_ROLES } = require("./roles");

// ---------------------------------------------------------------
// Objet PERMISSIONS : dictionnaire de toutes les permissions de l'application.
// Utiliser ces constantes partout plutôt que des chaînes brutes
// pour bénéficier de l'autocomplétion et éviter les fautes de frappe.
// ---------------------------------------------------------------
const PERMISSIONS = {
  // --- Permissions d'administration globale ---
  ADMIN_ACCESS: "admin:access",               // Accès à l'interface d'administration
  ADMIN_MANAGE_BLOGS: "admin:manage_blogs",   // Gestion (suspension, suppression) de tous les blogs
  ADMIN_MANAGE_REPORTS: "admin:manage_reports", // Traitement des signalements de toute la plateforme
  ADMIN_MANAGE_USERS: "admin:manage_users",   // Gestion des comptes utilisateurs

  // --- Permissions sur les blogs ---
  BLOG_CREATE: "blog:create",                           // Créer un nouveau blog
  BLOG_DELETE: "blog:delete",                           // Supprimer un blog existant
  BLOG_MANAGE_MEMBERS: "blog:manage_members",           // Inviter/exclure des membres
  BLOG_MANAGE_SETTINGS: "blog:manage_settings",         // Modifier les paramètres du blog
  BLOG_READ: "blog:read",                               // Lire/accéder au blog
  BLOG_TRANSFER_OWNERSHIP: "blog:transfer_ownership",   // Transférer la propriété du blog
  BLOG_UPDATE: "blog:update",                           // Modifier les informations du blog

  // --- Permissions sur le builder (éditeur visuel de pages) ---
  BUILDER_CREATE: "builder:create",             // Créer une nouvelle page/section
  BUILDER_DELETE: "builder:delete",             // Supprimer une page/section
  BUILDER_PUBLISH: "builder:publish",           // Publier une page créée avec le builder
  BUILDER_READ: "builder:read",                 // Consulter les pages du builder
  BUILDER_UPDATE: "builder:update",             // Modifier une page existante
  BUILDER_UPLOAD_MEDIA: "builder:upload_media", // Uploader des médias (images, etc.)

  // --- Permissions sur les commentaires ---
  COMMENT_DELETE: "comment:delete",     // Supprimer un commentaire
  COMMENT_MODERATE: "comment:moderate", // Masquer/restaurer un commentaire
  COMMENT_READ: "comment:read",         // Lire les commentaires

  // --- Permissions sur les articles (posts) ---
  POST_CREATE: "post:create",       // Créer un nouvel article
  POST_DELETE: "post:delete",       // Supprimer un article
  POST_PUBLISH: "post:publish",     // Publier un article (le rendre visible)
  POST_READ: "post:read",           // Lire les articles du blog
  POST_UNPUBLISH: "post:unpublish", // Dépublier un article (repasser en brouillon)
  POST_UPDATE: "post:update",       // Modifier un article existant

  // --- Permissions sur les signalements (reports) ---
  REPORT_CREATE: "report:create", // Soumettre un signalement
  REPORT_MANAGE: "report:manage", // Traiter/archiver un signalement
  REPORT_READ: "report:read",     // Consulter la liste des signalements
};

// ---------------------------------------------------------------
// BLOG_ROLE_PERMISSIONS : mapping rôle de blog → tableau de permissions.
// Utilise la notation calculée ([BLOG_ROLES.OWNER]) pour que la clé
// soit la valeur de la constante (ex: "owner") et non le nom "OWNER".
// ---------------------------------------------------------------
const BLOG_ROLE_PERMISSIONS = {
  // Le propriétaire (owner) a accès à TOUTES les fonctionnalités du blog,
  // y compris la suppression du blog et le transfert de propriété.
  [BLOG_ROLES.OWNER]: [
    PERMISSIONS.BLOG_DELETE,
    PERMISSIONS.BLOG_MANAGE_MEMBERS,
    PERMISSIONS.BLOG_MANAGE_SETTINGS,
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BLOG_TRANSFER_OWNERSHIP,
    PERMISSIONS.BLOG_UPDATE,
    PERMISSIONS.BUILDER_CREATE,
    PERMISSIONS.BUILDER_DELETE,
    PERMISSIONS.BUILDER_PUBLISH,
    PERMISSIONS.BUILDER_READ,
    PERMISSIONS.BUILDER_UPDATE,
    PERMISSIONS.BUILDER_UPLOAD_MEDIA,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.POST_CREATE,
    PERMISSIONS.POST_DELETE,
    PERMISSIONS.POST_PUBLISH,
    PERMISSIONS.POST_READ,
    PERMISSIONS.POST_UNPUBLISH,
    PERMISSIONS.POST_UPDATE,
    PERMISSIONS.REPORT_MANAGE,
    PERMISSIONS.REPORT_READ,
  ],

  // L'éditeur (editor) peut créer et modifier du contenu mais n'a pas
  // de droits sur la gestion du blog en lui-même (membres, paramètres, suppression).
  [BLOG_ROLES.EDITOR]: [
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.BUILDER_CREATE,
    PERMISSIONS.BUILDER_READ,
    PERMISSIONS.BUILDER_UPDATE,
    PERMISSIONS.BUILDER_UPLOAD_MEDIA,
    PERMISSIONS.POST_CREATE,
    PERMISSIONS.POST_READ,
    PERMISSIONS.POST_UPDATE,
  ],

  // Le modérateur (moderator) se concentre sur la gestion communautaire :
  // lecture, modération des commentaires et traitement des signalements.
  [BLOG_ROLES.MODERATOR]: [
    PERMISSIONS.BLOG_READ,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_MODERATE,
    PERMISSIONS.COMMENT_READ,
    PERMISSIONS.POST_READ,
    PERMISSIONS.REPORT_MANAGE,
    PERMISSIONS.REPORT_READ,
  ],

  // Le membre (member) a un accès limité : lecture et possibilité de signaler.
  [BLOG_ROLES.MEMBER]: [PERMISSIONS.BLOG_READ, PERMISSIONS.POST_READ, PERMISSIONS.REPORT_CREATE],

  // Le visiteur (viewer) a les mêmes droits minimaux que le membre.
  // Cette distinction peut être utile pour des fonctionnalités futures.
  [BLOG_ROLES.VIEWER]: [PERMISSIONS.BLOG_READ, PERMISSIONS.POST_READ, PERMISSIONS.REPORT_CREATE],
};

// L'administrateur global a accès à TOUTES les permissions de la plateforme.
// Object.values(PERMISSIONS) extrait toutes les valeurs du dictionnaire
// pour former un tableau complet.
const ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

// ---------------------------------------------------------------
// Fonctions helper
// ---------------------------------------------------------------

// Retourne le tableau de permissions associées à un rôle de blog.
// Si le rôle est inconnu/invalide, retourne un tableau vide (sécurité par défaut).
const getPermissionsForBlogRole = (role) => BLOG_ROLE_PERMISSIONS[role] || [];

// Vérifie si un utilisateur possède les droits d'administrateur global.
// Supporte plusieurs noms de propriété selon la source de l'objet user
// (token JWT décodé, objet BDD, etc.) :
//   - user.globalRole    : propriété normalisée dans le token
//   - user.platform_role : nom de colonne BDD brut
//   - user.role          : alternative générique
const hasGlobalAdminAccess = (user) =>
  user?.globalRole === GLOBAL_ROLES.ADMIN || user?.platform_role === GLOBAL_ROLES.ADMIN || user?.role === GLOBAL_ROLES.ADMIN;

// Export de toutes les constantes et helpers pour utilisation dans :
//   - middlewares/permissions.js (vérification des accès)
//   - controllers (logique conditionnelle selon les droits)
//   - tests unitaires (vérification du mapping des permissions)
module.exports = {
  ADMIN_PERMISSIONS,          // Toutes les permissions (pour les admins)
  BLOG_ROLE_PERMISSIONS,      // Mapping rôle de blog → permissions
  PERMISSIONS,                // Dictionnaire de toutes les permissions
  getPermissionsForBlogRole,  // Helper : permissions d'un rôle donné
  hasGlobalAdminAccess,       // Helper : vérifie si l'user est admin global
};
