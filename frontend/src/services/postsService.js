// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Récupère la liste complète de tous les articles disponibles
export const fetchPosts = () => request("/posts");

// Récupère un article spécifique par son identifiant numérique
export const fetchPostById = (id) => request(`/posts/${id}`);

// Alias de fetchPosts pour la compatibilité (certains composants utilisent getPosts)
export const getPosts = fetchPosts;
// Alias de fetchPostById pour la compatibilité (certains composants utilisent getPostById)
export const getPostById = fetchPostById;

// Crée un nouvel article avec les données fournies (requête POST avec corps JSON)
export const createPost = (data) =>
  request("/posts", { method: "POST", body: JSON.stringify(data) });

// Met à jour un article existant identifié par son id (requête PUT avec corps JSON)
export const updatePost = (id, data) =>
  request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Supprime définitivement un article identifié par son id (requête DELETE)
export const deletePost = (id) => request(`/posts/${id}`, { method: "DELETE" });
