// FR: Constantes centralisees pour la gestion admin des utilisateurs.
// EN: Centralized constants for admin user management.

const ADMIN_ALLOWED_ROLES = Object.freeze([
  "admin",
  "owner",
  "editor",
  "moderator",
  "user",
]);

const ADMIN_ALLOWED_STATUSES = Object.freeze([
  "active",
  "inactive",
  "suspended",
  "banned",
  "pending",
]);

const ADMIN_USER_FILTER_FIELDS = Object.freeze([
  "all",
  "username",
  "email",
  "role",
  "status",
]);

const ADMIN_USER_SORT_FIELDS = Object.freeze([
  "id",
  "username",
  "email",
  "role",
  "status",
  "created_at",
  "updated_at",
]);

const BLOCKING_STATUSES = Object.freeze(["inactive", "suspended", "banned", "pending"]);

module.exports = {
  ADMIN_ALLOWED_ROLES,
  ADMIN_ALLOWED_STATUSES,
  ADMIN_USER_FILTER_FIELDS,
  ADMIN_USER_SORT_FIELDS,
  BLOCKING_STATUSES,
};
