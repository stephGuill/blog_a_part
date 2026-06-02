// adminUsersController.js
// Contrôleur : opérations administratives sur les utilisateurs
// - Permet au super-admin de lister, filtrer et modifier rôles/statuts.
// - Utilise `AdminUsersService` pour la logique métier; ce fichier se contente
//   d'appeler les services et de formater les réponses HTTP.
// Exports: browse, bulkUpdate, filterOptions, updateRole, updateStatus
const adminUsersService = require("../services/AdminUsersService");

// Helper local : renvoie une réponse d'erreur formatée selon l'erreur fournie
// - `error` peut être un objet service contenant `status` et `message`
function sendError(res, error) {
  return res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : "Erreur serveur.",
  });
}

// browse(req, res) : liste paginée/filtrée pour l'interface super-admin
// - Query parameters : page, limit, search, filters... (délégués au service)
const browse = async (req, res) => {
  try {
    const result = await adminUsersService.list(req.query);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

// filterOptions(req, res) : retourne les valeurs autorisées pour les filtres UI
// - Utile pour alimenter les selects coté frontend (roles, statuts, etc.)
const filterOptions = (req, res) => {
  return res.json({
    success: true,
    data: adminUsersService.getFilterOptions(),
  });
};

// updateRole(req, res) : met à jour le rôle d'un utilisateur (super-admin uniquement)
// - Body attendu : { role: string, reason?: string }
const updateRole = async (req, res) => {
  try {
    const result = await adminUsersService.updateRole(req, req.params.userId, req.body.role, req.body.reason);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

// updateStatus(req, res) : met à jour le statut d'un utilisateur (ex: 'active')
// - Body attendu : { status: string, reason?: string }
const updateStatus = async (req, res) => {
  try {
    const result = await adminUsersService.updateStatus(req, req.params.userId, req.body.status, req.body.reason);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

// bulkUpdate(req, res) : opérations en masse sur des utilisateurs
// - Body attendu : { ids: [..], updates: { status/role/... } }
const bulkUpdate = async (req, res) => {
  try {
    const result = await adminUsersService.bulkUpdate(req, req.body);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

module.exports = {
  browse,
  bulkUpdate,
  filterOptions,
  updateRole,
  updateStatus
};
