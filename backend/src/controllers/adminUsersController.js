// ============================================================
// adminUsersController.js
// Contrôleur Express : gestion administrative des utilisateurs (super-admin).
//
// Rôle du contrôleur dans l'architecture Express :
//   - Reçoit la requête HTTP (req) envoyée par le client (navigateur, Postman…)
//   - Appelle le service métier (AdminUsersService) qui contient la vraie logique
//   - Renvoie la réponse HTTP (res) formatée en JSON
//
// Objets Express passés à chaque fonction :
//   req  (Request)  : objet entrant — contient l'URL, les headers, le body, l'utilisateur connecté…
//   res  (Response) : objet sortant — permet d'envoyer le statut HTTP + le JSON de réponse
//
// Ce contrôleur ne contient PAS de logique métier : il délègue tout à AdminUsersService.
// Exports : browse, bulkUpdate, filterOptions, updateRole, updateStatus
// ============================================================

// On importe le service admin : c'est lui qui contient toutes les requêtes SQL
// et les validations métier (vérification des droits, format des données, etc.)
const adminUsersService = require("../services/AdminUsersService");

/* ----------------------------------------------------------------
 * sendError(res, error)
 * Fonction utilitaire locale : transforme une erreur en réponse HTTP formatée.
 * Centralisée ici pour éviter de répéter le même bloc dans chaque fonction.
 *
 * Codes HTTP utilisés :
 *   400 Bad Request     : données invalides envoyées par le client
 *   403 Forbidden       : action non autorisée pour cet utilisateur
 *   404 Not Found       : ressource introuvable en base de données
 *   500 Internal Error  : erreur serveur non anticipée (bug, BDD down…)
 * ---------------------------------------------------------------- */
function sendError(res, error) {
  // res.status(code) : définit le code HTTP de la réponse (ex: 400, 404, 500)
  // error.status || 500 : si le service a précisé un code, on l'utilise ; sinon 500 par défaut
  return res.status(error.status || 500).json({
    success: false, // Convention de l'API : false = la requête a échoué
    // Si le service a fourni un message lisible (ex: "Rôle invalide"), on le retransmet
    // Sinon, on affiche un message générique pour ne pas exposer les détails internes
    message: error.status ? error.message : "Erreur serveur.",
  });
}

/* ----------------------------------------------------------------
 * browse(req, res)
 * Route : GET /api/admin/users?page=1&limit=20&search=jean&role=admin
 * Retourne la liste paginée et filtrée des utilisateurs pour l'admin.
 *
 * req.query : objet JS contenant tous les paramètres GET de l'URL
 *   → Ex: { page: "1", limit: "20", search: "jean", role: "admin" }
 * async/await : on attend que la requête BDD (asynchrone) soit terminée
 * try/catch   : si une erreur survient (SQL, réseau…), on envoie une réponse d'erreur
 * res.json()  : envoie la réponse au format JSON avec statut 200 (OK) implicite
 * ---------------------------------------------------------------- */
const browse = async (req, res) => {
  try {
    // On passe req.query au service qui construit et exécute la requête SQL filtrée
    // Le service retourne un objet { data: [...], pagination: { total, page, limit } }
    const result = await adminUsersService.list(req.query);
    return res.json(result); // HTTP 200 OK : données + métadonnées de pagination
  } catch (error) {
    // Capture toute erreur asynchrone (SQL, service…) et envoie une réponse JSON d'erreur
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * filterOptions(req, res)
 * Route : GET /api/admin/users/filter-options
 * Retourne les valeurs autorisées pour alimenter les listes déroulantes du frontend.
 * Exemple de réponse : { roles: ["admin","user","moderator"], statuses: ["active","banned"] }
 *
 * Cette fonction est synchrone (pas de BDD) car les options sont des constantes statiques.
 * ---------------------------------------------------------------- */
const filterOptions = (req, res) => {
  // getFilterOptions() retourne un objet statique défini dans le service (pas de BDD)
  return res.json({
    success: true,                              // Convention : true = requête réussie
    data: adminUsersService.getFilterOptions(), // Objet { roles: [...], statuses: [...] }
  }); // HTTP 200 OK implicite
};

/* ----------------------------------------------------------------
 * updateRole(req, res)
 * Route : PATCH /api/admin/users/:userId/role
 * Met à jour le rôle d'un utilisateur spécifique.
 *
 * req.params.userId : segment dynamique de l'URL — ex: /users/42/role → userId = "42"
 *   → req.params contient les variables définies avec : dans la route Express
 * req.body.role     : nouveau rôle envoyé dans le corps de la requête JSON
 *   → Ex: { "role": "moderator" }
 * req.body.reason   : raison optionnelle pour la piste d'audit (audit log)
 * req               : objet complet passé au service pour récupérer req.user (acteur)
 * ---------------------------------------------------------------- */
const updateRole = async (req, res) => {
  try {
    // Le service valide le rôle, exécute l'UPDATE SQL, et enregistre l'audit log
    // req.params.userId → cible de la modification (id en string, le service convertit)
    // req.body.role     → valeur attendue parmi les rôles autorisés
    // req.body.reason   → texte libre pour justifier l'action (optionnel)
    const result = await adminUsersService.updateRole(req, req.params.userId, req.body.role, req.body.reason);
    return res.json(result); // HTTP 200 OK : { success: true, message: "...", data: {...} }
  } catch (error) {
    // Ex: 400 si rôle invalide, 403 si action non autorisée, 404 si utilisateur introuvable
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * updateStatus(req, res)
 * Route : PATCH /api/admin/users/:userId/status
 * Met à jour le statut d'un utilisateur (actif, banni, suspendu…).
 *
 * req.params.userId : id de l'utilisateur ciblé dans le segment d'URL
 * req.body.status   : nouveau statut — valeurs possibles : "active", "banned", "suspended"…
 * req.body.reason   : raison textuelle pour l'audit log (optionnelle)
 * ---------------------------------------------------------------- */
const updateStatus = async (req, res) => {
  try {
    // Le service valide le statut, applique l'UPDATE SQL et journalise l'action
    const result = await adminUsersService.updateStatus(req, req.params.userId, req.body.status, req.body.reason);
    return res.json(result); // HTTP 200 OK
  } catch (error) {
    // Ex: 400 si statut invalide, 404 si utilisateur introuvable
    return sendError(res, error);
  }
};

/* ----------------------------------------------------------------
 * bulkUpdate(req, res)
 * Route : PATCH /api/admin/users/bulk
 * Applique une modification à plusieurs utilisateurs en une seule requête.
 *
 * req.body : objet JSON contenant :
 *   ids     : tableau des ids à modifier — ex: [12, 45, 78]
 *   updates : objet des champs à modifier — ex: { status: "banned" }
 * Exemple de body : { "ids": [1, 2, 3], "updates": { "status": "banned" } }
 * ---------------------------------------------------------------- */
const bulkUpdate = async (req, res) => {
  try {
    // req.body est passé entier : le service extrait ids et updates
    // Le service itère, applique les changements et crée un audit log pour chaque action
    const result = await adminUsersService.bulkUpdate(req, req.body);
    return res.json(result); // HTTP 200 OK : résumé des modifications appliquées
  } catch (error) {
    // Ex: 400 si ids invalides ou updates vides, 403 si non autorisé
    return sendError(res, error);
  }
};

// Exportation des fonctions pour le router (backend/src/routes/adminUsers.js)
// Chaque fonction correspond à une action sur la ressource "admin/users"
module.exports = {
  browse,        // GET    /admin/users                → liste filtrée et paginée
  bulkUpdate,    // PATCH  /admin/users/bulk           → mise à jour en masse
  filterOptions, // GET    /admin/users/filter-options → options des listes déroulantes
  updateRole,    // PATCH  /admin/users/:userId/role   → modification du rôle
  updateStatus   // PATCH  /admin/users/:userId/status → modification du statut
};
