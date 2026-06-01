const adminUsersService = require("../services/AdminUsersService");

function sendError(res, error) {
  return res.status(error.status || 500).json({
    success: false,
    message: error.status ? error.message : "Erreur serveur.",
  });
}

// FR: Liste paginee et filtree des utilisateurs pour le super admin.
// EN: Paginated and filtered user list for the super admin.
const browse = async (req, res) => {
  try {
    const result = await adminUsersService.list(req.query);
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

// FR: Options autorisees pour les selects role/statut/filtres.
// EN: Allowed options for role/status/filter selects.
const filterOptions = (req, res) => {
  return res.json({
    success: true,
    data: adminUsersService.getFilterOptions(),
  });
};

const updateRole = async (req, res) => {
  try {
    const result = await adminUsersService.updateRole(
      req,
      req.params.userId,
      req.body.role,
      req.body.reason
    );
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateStatus = async (req, res) => {
  try {
    const result = await adminUsersService.updateStatus(
      req,
      req.params.userId,
      req.body.status,
      req.body.reason
    );
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
};

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
  updateStatus,
};
