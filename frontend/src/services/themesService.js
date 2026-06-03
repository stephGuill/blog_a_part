// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Récupère la liste complète de tous les thèmes disponibles sur la plateforme
export const fetchThemes = () => request("/themes");

// Récupère un thème spécifique par son identifiant
export const fetchThemeById = (id) => request(`/themes/${id}`);

// Crée un nouveau thème avec les données fournies (requête POST avec corps JSON)
export const createTheme = (data) =>
  request("/themes", { method: "POST", body: JSON.stringify(data) });

// Alias de fetchThemes pour la compatibilité (certains composants utilisent getThemes)
export const getThemes = fetchThemes;

// Met à jour un thème existant identifié par son id (requête PUT avec corps JSON)
export const updateTheme = (id, data) =>
  request(`/themes/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Supprime définitivement un thème identifié par son id (requête DELETE)
export const deleteTheme = (id) => request(`/themes/${id}`, { method: "DELETE" });
