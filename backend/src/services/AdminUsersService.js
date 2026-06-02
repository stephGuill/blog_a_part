const crypto = require("node:crypto");

const models = require("../models");
const {
  ADMIN_ALLOWED_ROLES,
  ADMIN_ALLOWED_STATUSES,
  ADMIN_USER_FILTER_FIELDS,
  ADMIN_USER_SORT_FIELDS,
  BLOCKING_STATUSES,
} = require("../utils/adminUsers");

// Service d'administration des utilisateurs
// - Fournit l'ensemble des opérations métiers utilisées par l'interface admin
// - Méthodes clés :
//   * getFilterOptions(), validateListQuery(), list(query)
//   * getTargetUser(userId)
//   * ensureCanChangeRole(actor, target, nextRole)
//   * ensureCanChangeStatus(actor, target, nextStatus)
//   * log(req, target, action, oldValues, newValues, reason)
//   * updateRole(), updateStatus(), bulkUpdate()
// - Les erreurs métiers sont levées via `makeError(message, status)`.
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_BULK_USERS = 100;

function makeError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    role: user.role,
    platform_role: user.platform_role,
    status: user.status || (user.is_active ? "active" : "inactive"),
    is_active: Boolean(user.is_active),
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function requestMeta(req, reason, bulkActionId = null) {
  return {
    reason: reason || null,
    ip: req.ip,
    userAgent: req.get("user-agent") || null,
    bulkActionId,
  };
}

class AdminUsersService {
  getFilterOptions() {
    return {
      roles: ADMIN_ALLOWED_ROLES,
      statuses: ADMIN_ALLOWED_STATUSES,
      filterBy: ADMIN_USER_FILTER_FIELDS,
      sortBy: ADMIN_USER_SORT_FIELDS,
    };
  }

  validateListQuery(query) {
    const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1);
    const rawLimit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
    const limit = Math.min(Math.max(rawLimit, 1), 100);
    const filterBy = query.filterBy || "all";
    const sortBy = query.sortBy || "created_at";
    const sortOrder = String(query.sortOrder || "desc").toLowerCase();

    if (!ADMIN_USER_FILTER_FIELDS.includes(filterBy)) {
      throw makeError("Champ de recherche invalide.", 400);
    }

    if (query.role && !ADMIN_ALLOWED_ROLES.includes(query.role)) {
      throw makeError("Role invalide.", 400);
    }

    if (query.status && !ADMIN_ALLOWED_STATUSES.includes(query.status)) {
      throw makeError("Statut invalide.", 400);
    }

    if (!ADMIN_USER_SORT_FIELDS.includes(sortBy)) {
      throw makeError("Champ de tri invalide.", 400);
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      throw makeError("Ordre de tri invalide.", 400);
    }

    return {
      filters: {
        search: query.search ? String(query.search).trim() : "",
        filterBy,
        role: query.role || "",
        status: query.status || "",
      },
      pagination: { page, limit },
      sorting: { sortBy, sortOrder: sortOrder.toUpperCase() },
    };
  }

  async list(query) {
    const criteria = this.validateListQuery(query);
    const [[users], [countRows]] = await models.users.findAdminUsers(criteria);
    const total = countRows[0]?.total || 0;

    return {
      success: true,
      data: users.map(normalizeUser),
      pagination: {
        page: criteria.pagination.page,
        limit: criteria.pagination.limit,
        total,
        totalPages: Math.max(Math.ceil(total / criteria.pagination.limit), 1),
      },
      filters: criteria.filters,
    };
  }

  async getTargetUser(userId) {
    const id = Number(userId);

    if (!Number.isInteger(id) || id <= 0) {
      throw makeError("Identifiant utilisateur invalide.", 400);
    }

    const [rows] = await models.users.findAdminById(id);
    const user = rows[0];

    if (!user) {
      throw makeError("Utilisateur introuvable.", 404);
    }

    return user;
  }

  async ensureCanChangeRole(actor, target, nextRole) {
    if (!ADMIN_ALLOWED_ROLES.includes(nextRole)) {
      throw makeError("Role invalide.", 400);
    }

    if (Number(actor.id) === Number(target.id) && target.platform_role === "admin" && nextRole !== "admin") {
      throw makeError("Vous ne pouvez pas retirer vos propres droits admin.", 409);
    }

    if (target.platform_role === "admin" && nextRole !== "admin") {
      const [rows] = await models.users.countActivePlatformAdmins(target.id);
      if (Number(rows[0]?.count || 0) === 0) {
        throw makeError("Impossible de retrograder le dernier admin actif.", 409);
      }
    }
  }

  async ensureCanChangeStatus(actor, target, nextStatus) {
    if (!ADMIN_ALLOWED_STATUSES.includes(nextStatus)) {
      throw makeError("Statut invalide.", 400);
    }

    if (Number(actor.id) === Number(target.id) && BLOCKING_STATUSES.includes(nextStatus)) {
      throw makeError("Vous ne pouvez pas bloquer votre propre compte admin.", 409);
    }

    if (target.platform_role === "admin" && BLOCKING_STATUSES.includes(nextStatus)) {
      const [rows] = await models.users.countActivePlatformAdmins(target.id);
      if (Number(rows[0]?.count || 0) === 0) {
        throw makeError("Impossible de bloquer le dernier admin actif.", 409);
      }
    }
  }

  async log(req, target, action, oldValues, newValues, reason, bulkActionId = null) {
    await models.auditLogs.insert({
      actor_user_id: req.user.id,
      target_type: "user",
      target_id: target.id,
      action,
      old_values: oldValues,
      new_values: newValues,
      metadata_json: requestMeta(req, reason, bulkActionId),
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
      bulk_action_id: bulkActionId,
    });
  }

  async updateRole(req, userId, role, reason, bulkActionId = null) {
    const target = await this.getTargetUser(userId);
    const oldRole = target.role;

    await this.ensureCanChangeRole(req.user, target, role);

    if (oldRole === role) {
      return {
        success: true,
        message: "Role deja applique.",
        data: { ...normalizeUser(target), oldRole, newRole: role },
      };
    }

    await models.users.updateRole(target.id, role);
    await this.log(req, target, bulkActionId ? "admin.users.bulk_role_updated" : "admin.user.role_updated", { role: oldRole }, { role }, reason, bulkActionId);

    return {
      success: true,
      message: "Role utilisateur mis a jour avec succes.",
      data: {
        id: target.id,
        username: target.username,
        email: target.email,
        oldRole,
        newRole: role,
        status: target.status,
      },
    };
  }

  async updateStatus(req, userId, status, reason, bulkActionId = null) {
    const target = await this.getTargetUser(userId);
    const oldStatus = target.status || (target.is_active ? "active" : "inactive");

    await this.ensureCanChangeStatus(req.user, target, status);

    if (oldStatus === status) {
      return {
        success: true,
        message: "Statut deja applique.",
        data: { ...normalizeUser(target), oldStatus, newStatus: status },
      };
    }

    await models.users.updateStatus(target.id, status);
    await this.log(req, target, bulkActionId ? "admin.users.bulk_status_updated" : "admin.user.status_updated", { status: oldStatus }, { status }, reason, bulkActionId);

    return {
      success: true,
      message: "Statut utilisateur mis a jour avec succes.",
      data: {
        id: target.id,
        username: target.username,
        email: target.email,
        role: target.role,
        oldStatus,
        newStatus: status,
      },
    };
  }

  async bulkUpdate(req, payload) {
    const uniqueIds = [...new Set((payload.userIds || []).map(Number))].filter((id) => Number.isInteger(id) && id > 0);
    const action = payload.action;
    const bulkActionId = `bulk_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const updatedUsers = [];
    const skippedUsers = [];

    if (uniqueIds.length === 0) {
      throw makeError("La selection est vide.", 400);
    }

    if (uniqueIds.length > MAX_BULK_USERS) {
      throw makeError(`Maximum ${MAX_BULK_USERS} utilisateurs par action en masse.`, 400);
    }

    if (!["change_status", "change_role"].includes(action)) {
      throw makeError("Action en masse invalide.", 400);
    }

    for (const id of uniqueIds) {
      try {
        if (action === "change_role") {
          const result = await this.updateRole(req, id, payload.role, payload.reason, bulkActionId);
          updatedUsers.push(result.data);
        } else {
          const result = await this.updateStatus(req, id, payload.status, payload.reason, bulkActionId);
          updatedUsers.push(result.data);
        }
      } catch (error) {
        skippedUsers.push({ id, reason: error.message || "Action refusee." });
      }
    }

    return {
      success: true,
      message: "Action en masse terminee.",
      bulkActionId,
      summary: {
        requested: uniqueIds.length,
        updated: updatedUsers.length,
        skipped: skippedUsers.length,
      },
      updatedUsers,
      skippedUsers,
    };
  }
}

module.exports = new AdminUsersService();
