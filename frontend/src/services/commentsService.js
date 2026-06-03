// Import de la fonction apiRequest (export par défaut) pour effectuer des appels HTTP vers l'API
import request from "./apiClient";

// Récupère la liste complète de tous les commentaires
export const fetchComments = () => request("/comments");

// Récupère un commentaire spécifique par son identifiant
export const fetchCommentById = (id) => request(`/comments/${id}`);

// Crée un nouveau commentaire avec les données fournies (requête POST avec corps JSON)
export const createComment = (data) =>
  request("/comments", { method: "POST", body: JSON.stringify(data) });

// Alias de fetchComments pour la compatibilité (certains composants utilisent getComments)
export const getComments = fetchComments;

// Met à jour le statut de modération d'un commentaire (ex : "approved", "rejected", "spam")
// Utilisé par les modérateurs pour approuver ou rejeter les commentaires en attente
export const moderateComment = (id, status) =>
  request(`/comments/${id}`, { method: "PUT", body: JSON.stringify({ status }) });

// Supprime définitivement un commentaire identifié par son id (requête DELETE)
export const deleteComment = (id) => request(`/comments/${id}`, { method: "DELETE" });
