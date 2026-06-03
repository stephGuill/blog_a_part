// Récupération de l'URL du backend depuis les variables d'environnement Vite
// Valeur par défaut : http://localhost:5000 si VITE_BACKEND_URL n'est pas définie
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Construction de l'URL de base de l'API en retirant le slash final de backendUrl puis en ajoutant /api
// VITE_API_URL permet de surcharger complètement cette URL (ex : proxy Nginx en production)
const apiBaseUrl = import.meta.env.VITE_API_URL || `${backendUrl.replace(/\/$/, "")}/api`;

// Fonction utilitaire pour lire le token JWT depuis le localStorage
// La clé "blogyoo_token" est cohérente avec celle utilisée dans authService.js
export const getToken = () => window.localStorage.getItem("blogyoo_token");

// Construit l'URL HTTP complète à appeler à partir d'un endpoint relatif ou absolu
const buildUrl = (endpoint) => {
  // Si l'endpoint commence déjà par http:// ou https://, on le retourne tel quel (URL absolue)
  if (/^https?:\/\//.test(endpoint)) {
    return endpoint;
  }

  // Normalise l'endpoint pour s'assurer qu'il commence par un slash (ex : "users" → "/users")
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  // Concatène l'URL de base de l'API avec l'endpoint normalisé
  return `${apiBaseUrl}${normalizedEndpoint}`;
};

// Fonction principale d'appel API : wrapper autour de fetch() avec gestion du token et des erreurs
export async function apiRequest(endpoint, options = {}) {
  // Récupération du token JWT depuis le localStorage pour l'inclure dans les headers
  const token = getToken();
  // Détecte si le corps de la requête est un FormData (upload de fichier)
  // Si oui, on ne définit pas Content-Type (le navigateur le gère avec le boundary multipart)
  const isFormData = options.body instanceof FormData;

  // Construction des headers HTTP de la requête
  const headers = {
    // Si ce n'est pas un FormData, définit le Content-Type en JSON
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    // Injection du token JWT dans le header Authorization si un token est présent
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Fusion avec les headers personnalisés passés en option (peuvent écraser les précédents)
    ...options.headers,
  };

  // Exécution de la requête HTTP avec fetch()
  const response = await fetch(buildUrl(endpoint), {
    ...options,  // Spread de toutes les options passées (method, body, signal, credentials...)
    headers,     // Remplacement des headers par ceux construits ci-dessus
  });

  // Tentative de parsing du corps de la réponse en JSON
  // En cas d'échec (réponse vide ou non-JSON), retourne null sans lever d'erreur
  const data = await response.json().catch(() => null);

  // Si le code HTTP indique une erreur (4xx ou 5xx), on lève une erreur enrichie
  if (!response.ok) {
    // Création d'une erreur standard avec le message renvoyé par l'API ou un message générique
    const error = new Error(data?.message || "Erreur API.");
    // Ajout du code de statut HTTP sur l'objet erreur (ex : 401, 403, 404, 500)
    error.status = response.status;
    // Ajout des données complètes de la réponse sur l'objet erreur (pour le debug ou l'affichage)
    error.data = data;
    throw error;
  }

  // Retourne les données parsées si la requête a réussi (codes 2xx)
  return data;
}

// Objet client API exposant les méthodes HTTP courantes sous forme de fonctions nommées
export const apiClient = {
  // Méthode DELETE : supprime une ressource identifiée par l'endpoint
  delete: (endpoint) => apiRequest(endpoint, { method: "DELETE" }),

  // Méthode GET : récupère une ressource (lecture seule, sans corps de requête)
  get: (endpoint) => apiRequest(endpoint),

  // Méthode POST : crée une nouvelle ressource
  // Supporte à la fois JSON (sérialisé) et FormData (upload de fichier, passé tel quel)
  post: (endpoint, body) =>
    apiRequest(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  // Méthode PUT : remplace entièrement une ressource existante
  // Supporte à la fois JSON (sérialisé) et FormData (upload de fichier, passé tel quel)
  put: (endpoint, body) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
};

// Export par défaut de la fonction apiRequest pour les services utilisant l'import direct
export default apiRequest;
