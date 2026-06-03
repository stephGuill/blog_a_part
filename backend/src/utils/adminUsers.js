// utils/adminUsers.js
// ============================================================
// Constantes centralisées pour la gestion administrative des utilisateurs.
// Ce fichier regroupe toutes les valeurs autorisées dans les opérations
// d'administration des comptes (filtrage, tri, modification de statut/rôle).
//
// Centraliser ces valeurs ici permet de :
//   - Éviter les "magic strings" dans les controllers et services
//   - Faciliter la validation des entrées utilisateur (liste blanche)
//   - Modifier les valeurs en un seul endroit si besoin
// ============================================================

// Rôles qu'un administrateur peut attribuer à un utilisateur.
// Object.freeze() rend le tableau immuable pour éviter les modifications accidentelles.
// Ces valeurs correspondent aux colonnes de rôle dans la base de données.
const ADMIN_ALLOWED_ROLES = Object.freeze([
  "admin",     // Super-administrateur avec accès complet à la plateforme
  "owner",     // Propriétaire d'un ou plusieurs blogs
  "editor",    // Éditeur de contenu sur un ou plusieurs blogs
  "moderator", // Modérateur de commentaires/signalements
  "user",      // Utilisateur standard sans privilèges spéciaux
]);

// Statuts de compte qu'un administrateur peut assigner à un utilisateur.
// Ces statuts contrôlent l'accès de l'utilisateur à la plateforme.
const ADMIN_ALLOWED_STATUSES = Object.freeze([
  "active",    // Compte actif : l'utilisateur peut se connecter normalement
  "inactive",  // Compte inactif : désactivé temporairement (ex: email non vérifié)
  "suspended", // Compte suspendu : accès bloqué après une violation des règles
  "banned",    // Compte banni : exclusion définitive de la plateforme
  "pending",   // Compte en attente : inscription non finalisée ou en cours de vérification
]);

// Champs sur lesquels un administrateur peut filtrer la liste des utilisateurs.
// Ces valeurs sont utilisées pour construire les requêtes SQL de filtrage.
//   - "all"      : recherche dans tous les champs texte (username, email)
//   - "username" : filtre uniquement sur le nom d'utilisateur
//   - "email"    : filtre uniquement sur l'adresse email
//   - "role"     : filtre par rôle global
//   - "status"   : filtre par statut de compte
const ADMIN_USER_FILTER_FIELDS = Object.freeze([
  "all",
  "username",
  "email",
  "role",
  "status",
]);

// Colonnes sur lesquelles un administrateur peut trier la liste des utilisateurs.
// Ces valeurs sont utilisées pour construire la clause ORDER BY des requêtes SQL.
// Valider ces valeurs empêche les injections SQL via le paramètre de tri.
const ADMIN_USER_SORT_FIELDS = Object.freeze([
  "id",         // Tri par identifiant unique (par défaut : ordre d'inscription)
  "username",   // Tri alphabétique par pseudo
  "email",      // Tri alphabétique par email
  "role",       // Tri par rôle
  "status",     // Tri par statut
  "created_at", // Tri par date d'inscription
  "updated_at", // Tri par date de dernière modification
]);

// Statuts qui bloquent l'accès d'un utilisateur à la plateforme.
// Utilisé par le middleware d'authentification pour refuser la connexion
// si le statut de l'utilisateur figure dans cette liste.
// Note : "active" n'est PAS dans cette liste → seul les comptes actifs peuvent se connecter.
const BLOCKING_STATUSES = Object.freeze(["inactive", "suspended", "banned", "pending"]);

// Export de toutes les constantes pour utilisation dans :
//   - controllers/adminUsersController.js (validation des paramètres de requête)
//   - services/AdminUsersService.js (logique métier d'administration)
//   - middlewares/auth.js (vérification du statut bloquant)
module.exports = {
  ADMIN_ALLOWED_ROLES,       // Rôles assignables par un admin
  ADMIN_ALLOWED_STATUSES,    // Statuts de compte assignables par un admin
  ADMIN_USER_FILTER_FIELDS,  // Champs de filtrage autorisés
  ADMIN_USER_SORT_FIELDS,    // Champs de tri autorisés
  BLOCKING_STATUSES,         // Statuts qui interdisent la connexion
};
