// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Récupère la liste complète de toutes les catégories disponibles
export const fetchCategories = () => request("/categories");

// Récupère une catégorie spécifique par son identifiant
export const fetchCategoryById = (id) => request(`/categories/${id}`);

// Crée une nouvelle catégorie avec les données fournies (requête POST avec corps JSON)
export const createCategory = (data) =>
  request("/categories", { method: "POST", body: JSON.stringify(data) });

// Alias de fetchCategories pour la compatibilité (certains composants utilisent getCategories)
export const getCategories = fetchCategories;

// Met à jour une catégorie existante identifiée par son id (requête PUT avec corps JSON)
export const updateCategory = (id, data) =>
  request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Supprime définitivement une catégorie identifiée par son id (requête DELETE)
export const deleteCategory = (id) => request(`/categories/${id}`, { method: "DELETE" });
