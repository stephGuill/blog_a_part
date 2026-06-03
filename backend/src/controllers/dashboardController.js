// ============================================================
// dashboardController.js
// Contrôleur Express : tableaux de bord par rôle utilisateur.
//
// Rôle :
//   Fournit un endpoint dédié à chaque rôle pour afficher son tableau de bord.
//   Ces fonctions sont simples : elles retournent directement req.user
//   (injecté par le middleware d'authentification) dans la réponse JSON.
//
// req.user : objet injecté par le middleware `protect` (auth.js).
//   → Il contient les données de l'utilisateur connecté (id, username, role…)
//   → Il est disponible sur toutes les routes protégées par le middleware auth
//
// Codes HTTP utilisés :
//   200 OK : réponse implicite de res.json() (pas besoin de .status(200))
// ============================================================

/* adminStats(req, res)
 * Route protégée : GET /api/dashboard/admin
 * Réservée aux utilisateurs ayant le rôle global "admin".
 * Retourne un objet JSON confirmant le dashboard actif et l'utilisateur connecté.
 * req.user : données de l'admin connecté (id, username, globalRole…) */
const adminStats = (req, res) =>
  // res.json() envoie la réponse JSON avec statut 200 OK implicite
  res.json({ status: "success", dashboard: "admin", user: req.user });

/* ownerStats(req, res)
 * Route protégée : GET /api/dashboard/owner
 * Réservée aux propriétaires de blog (role "owner" sur un blog).
 * req.user : données du propriétaire connecté */
const ownerStats = (req, res) =>
  // On retourne le contexte utilisateur pour que le frontend affiche les données pertinentes
  res.json({ status: "success", dashboard: "owner", user: req.user });

/* editorStats(req, res)
 * Route protégée : GET /api/dashboard/editor
 * Réservée aux éditeurs de blog (role "editor" sur un blog).
 * req.user : données de l'éditeur connecté */
const editorStats = (req, res) =>
  res.json({ status: "success", dashboard: "editor", user: req.user });

/* moderatorStats(req, res)
 * Route protégée : GET /api/dashboard/moderator
 * Réservée aux modérateurs (role "moderator" sur un blog).
 * req.user : données du modérateur connecté */
const moderatorStats = (req, res) =>
  res.json({ status: "success", dashboard: "moderator", user: req.user });

/* userStats(req, res)
 * Route protégée : GET /api/dashboard/user
 * Accessible à tout utilisateur authentifié.
 * req.user : données de l'utilisateur connecté (le plus bas niveau de rôle) */
const userStats = (req, res) =>
  res.json({ status: "success", dashboard: "user", user: req.user });

// Exportation de toutes les fonctions pour le router (backend/src/routes/dashboard.js)
module.exports = {
  adminStats,     // GET /dashboard/admin      → tableau de bord super-admin
  editorStats,    // GET /dashboard/editor     → tableau de bord éditeur
  moderatorStats, // GET /dashboard/moderator  → tableau de bord modérateur
  ownerStats,     // GET /dashboard/owner      → tableau de bord propriétaire
  userStats       // GET /dashboard/user       → tableau de bord utilisateur
};
