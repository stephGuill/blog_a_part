// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Construit une chaîne de paramètres URL (?key=value&...) à partir d'un objet de paramètres
// Ignore les valeurs undefined, null ou vides pour ne pas polluer la requête
const buildQuery = (params = {}) => {
  // Création d'un objet URLSearchParams pour encoder proprement les paramètres de l'URL
  const query = new URLSearchParams();

  // Itération sur chaque paire clé/valeur de l'objet params
  Object.entries(params).forEach(([key, value]) => {
    // Filtre les valeurs vides pour ne pas envoyer de paramètres inutiles à l'API
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  // Retourne la chaîne encodée (ex : "page=1&role=admin&search=john")
  return query.toString();
};

// FR: Récupère la liste des utilisateurs.
// EN: Retrieve the list of users.
// Supporte des paramètres de filtrage et de pagination via l'objet params
export const fetchUsers = async (params = {}) => {
  // Construction de la chaîne de query string à partir des paramètres fournis
  const query = buildQuery(params);
  // Appel API vers /admin/users avec les paramètres en query string si présents
  return request(`/admin/users${query ? `?${query}` : ""}`);
};

// Alias de fetchUsers pour la compatibilité avec d'anciens appels dans la codebase
export const getUsers = fetchUsers;

// FR: Récupère un utilisateur précis par ID.
// EN: Retrieve a specific user by ID.
export const fetchUserById = async (id) => {
  return request(`/users/${id}`);
};

// Alias de fetchUserById pour la compatibilité
export const getUserById = fetchUserById;

// Récupère les options disponibles pour les filtres de la liste admin des utilisateurs
// (ex : liste des rôles disponibles, liste des statuts possibles pour les menus de filtre)
export const getAdminUserFilterOptions = () => request("/admin/users/filter-options");

// Met à jour le rôle d'un utilisateur (admin uniquement) avec une raison optionnelle
// La raison est enregistrée dans les logs d'audit pour la traçabilité
export const updateAdminUserRole = (id, role, reason = "") =>
  request(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role, reason }),
  });

// Met à jour le statut d'un utilisateur (actif/suspendu/banni) avec une raison optionnelle
// La raison est enregistrée dans les logs d'audit pour la traçabilité
export const updateAdminUserStatus = (id, status, reason = "") =>
  request(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });

// Met à jour en masse plusieurs utilisateurs en une seule requête (actions groupées)
// Le payload contient un tableau d'actions à effectuer sur plusieurs utilisateurs simultanément
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

// Upload d'un avatar pour un utilisateur identifié par son id
// Utilise FormData pour envoyer le fichier image en multipart/form-data
export const uploadUserAvatar = (id, file) => {
  // Création d'un objet FormData pour l'envoi multipart
  const formData = new FormData();
  // Ajout du fichier image sous le champ "avatar" (nom attendu par multer côté backend)
  formData.append("avatar", file);

  return request(`/users/${id}/avatar`, {
    method: "PATCH",  // PATCH : mise à jour partielle (uniquement l'avatar)
    body: formData,   // FormData : Content-Type défini automatiquement par le navigateur
  });
};

// Active ou désactive un compte utilisateur (is_active : true = actif, false = suspendu)
// Utilisé par l'admin pour suspendre ou réactiver un compte
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
