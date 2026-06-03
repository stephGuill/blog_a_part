// utils/roles.js
// ============================================================
// Définition des constantes de rôles utilisées dans toute l'application.
// Centraliser les rôles ici évite les "magic strings" dispersées dans le code
// et facilite la maintenance (ex: renommer un rôle en un seul endroit).
//
// Deux niveaux de rôles :
//   - GLOBAL_ROLES : rôles à l'échelle de la plateforme entière
//   - BLOG_ROLES   : rôles au niveau d'un blog spécifique
// ============================================================

// Rôles globaux : définissent les droits d'accès à la plateforme dans son ensemble.
// Chaque utilisateur possède exactement un rôle global (stocké en BDD).
//   - ADMIN : super-administrateur avec accès complet à la console d'administration
//   - USER  : utilisateur standard sans privilèges d'administration globale
const GLOBAL_ROLES = {
  ADMIN: "admin", // Administrateur de la plateforme (accès backoffice complet)
  USER: "user",   // Utilisateur lambda (accès limité à ses propres ressources)
};

// Rôles de blog : définissent les droits d'un membre au sein d'un blog particulier.
// Un même utilisateur peut avoir des rôles différents selon les blogs.
//   - OWNER     : propriétaire du blog (droits maximaux, peut supprimer le blog)
//   - EDITOR    : peut créer et modifier les articles et les pages du builder
//   - MODERATOR : peut modérer les commentaires et gérer les signalements
//   - MEMBER    : membre de la communauté, peut lire et signaler du contenu
//   - VIEWER    : visiteur enregistré, accès en lecture seule
const BLOG_ROLES = {
  OWNER: "owner",         // Propriétaire : tous les droits sur le blog
  EDITOR: "editor",       // Éditeur : création et modification de contenu
  MODERATOR: "moderator", // Modérateur : gestion des commentaires et signalements
  MEMBER: "member",       // Membre : lecture + signalement de contenu
  VIEWER: "viewer",       // Visiteur : lecture seule (accès minimal)
};

// Export des deux objets de rôles pour utilisation dans :
//   - permissions.js (mapping rôle → permissions)
//   - middlewares (vérification du rôle de l'utilisateur)
//   - controllers (logique métier conditionnelle selon le rôle)
module.exports = {
  BLOG_ROLES,   // Rôles contextuels à un blog
  GLOBAL_ROLES, // Rôles globaux de la plateforme
};
