import request from "./apiClient";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  return query.toString();
};

// FR: Récupère la liste des utilisateurs.
// EN: Retrieve the list of users.
export const fetchUsers = async (params = {}) => {
  const query = buildQuery(params);
  return request(`/admin/users${query ? `?${query}` : ""}`);
};

export const getUsers = fetchUsers;

// FR: Récupère un utilisateur précis par ID.
// EN: Retrieve a specific user by ID.
export const fetchUserById = async (id) => {
  return request(`/users/${id}`);
};

export const getUserById = fetchUserById;

export const getAdminUserFilterOptions = () => request("/admin/users/filter-options");

export const updateAdminUserRole = (id, role, reason = "") =>
  request(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role, reason }),
  });

export const updateAdminUserStatus = (id, status, reason = "") =>
  request(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });

export const bulkUpdateAdminUsers = (payload) =>
  request("/admin/users/bulk-update", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// FR: Crée un nouvel utilisateur.
// EN: Create a new user.
export const createUser = async (userData) => {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

// FR: Met à jour un utilisateur existant.
// EN: Update an existing user.
export const updateUser = async (id, userData) => {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
};

export const uploadUserAvatar = (id, file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return request(`/users/${id}/avatar`, {
    method: "PATCH",
    body: formData,
  });
};

export const setUserActive = async (id, isActive) => {
  return request(`/users/${id}/active`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
};

// FR: Supprime un utilisateur.
// EN: Delete a user.
export const deleteUser = async (id) => {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
};
