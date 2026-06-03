// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Récupère la liste complète de tous les blogs publics de la plateforme
export const fetchBlogs = () => request("/blogs");

// Récupère uniquement les blogs appartenant à l'utilisateur connecté (scope=mine filtré côté API)
export const fetchOwnerBlogs = () => request("/blogs?scope=mine");

// Récupère un blog spécifique par son identifiant numérique
export const fetchBlogById = (id) => request(`/blogs/${id}`);

// Alias de fetchBlogs pour la compatibilité (certains composants utilisent getBlogs)
export const getBlogs = fetchBlogs;
// Alias de fetchBlogById pour la compatibilité (certains composants utilisent getBlogById)
export const getBlogById = fetchBlogById;

// Crée un nouveau blog avec les données fournies (requête POST avec corps JSON)
export const createBlog = (data) =>
  request("/blogs", { method: "POST", body: JSON.stringify(data) });

// Met à jour un blog existant identifié par son id (requête PUT avec corps JSON)
export const updateBlog = (id, data) =>
  request(`/blogs/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Supprime définitivement un blog identifié par son id (requête DELETE)
export const deleteBlog = (id) => request(`/blogs/${id}`, { method: "DELETE" });
