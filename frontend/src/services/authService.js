// Import du client API (objet avec méthodes get/post/put/delete) et de la fonction getToken
import { apiClient, getToken } from "./apiClient";
// Import de la fonction utilitaire qui retourne la route de redirection selon le rôle utilisateur
import { getRedirectPathByRole } from "@utils/roleRedirect";

// Clé utilisée pour stocker le token JWT dans le localStorage
const TOKEN_KEY = "blogyoo_token";
// Clé utilisée pour stocker les données de l'utilisateur connecté dans le localStorage
const USER_KEY = "blogyoo_user";

// Sauvegarde le token JWT dans le localStorage sous la clé définie
export const saveToken = (token) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

// Ré-export de getToken depuis apiClient pour centraliser son usage depuis authService
export { getToken };

// Sauvegarde les données de l'utilisateur (sérialisées en JSON) dans le localStorage
export const saveUser = (user) => {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Lit et retourne l'utilisateur stocké en localStorage (désérialisé depuis JSON)
// Retourne null si aucun utilisateur n'est stocké
export const getStoredUser = () => {
  const user = window.localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

// Supprime le token et les données utilisateur du localStorage (utilisé lors de la déconnexion)
export const clearAuthStorage = () => {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

// Inscription d'un nouvel utilisateur : envoie le formulaire d'inscription à l'API
export const signup = (payload) => apiClient.post("/auth/register", payload);

// Connexion d'un utilisateur existant avec ses identifiants (email + mot de passe)
export const signin = async (credentials) => {
  // Appel API de connexion avec les identifiants fournis
  const response = await apiClient.post("/auth/signin", credentials);

  // Si le backend demande une vérification 2FA, on retourne la réponse brute sans stocker de token
  if (response.requiresTwoFactor) {
    return response;
  }

  // Extraction de l'objet utilisateur depuis la réponse (deux structures de réponse possibles)
  const user = response.user || response.data?.user;

  // Persistence du token JWT dans le localStorage si le backend en renvoie un
  if (response.token) {
    saveToken(response.token);
  }

  // Persistence des données utilisateur dans le localStorage si disponibles
  if (user) {
    saveUser(user);
  }

  // Retourne la réponse enrichie avec l'utilisateur et la route de redirection post-connexion
  return {
    ...response,
    user,
    // Utilise la route de redirection fournie par le backend ou la calcule depuis le rôle utilisateur
    redirectTo: response.redirectTo || getRedirectPathByRole(user?.role),
  };
};

// Vérification du code 2FA lors de la connexion (authentification à deux facteurs)
export const verifyTwoFactorLogin = async (payload) => {
  // Envoi du code OTP/2FA à l'API pour validation
  const response = await apiClient.post("/auth/2fa/verify-login", payload);
  // Extraction de l'objet utilisateur depuis la réponse
  const user = response.user || response.data?.user;

  // Persistence du token JWT si le backend en renvoie un après validation du code 2FA
  if (response.token) {
    saveToken(response.token);
  }

  // Persistence des données utilisateur dans le localStorage
  if (user) {
    saveUser(user);
  }

  // Retourne la réponse enrichie avec l'utilisateur et la route de redirection
  return {
    ...response,
    user,
    redirectTo: response.redirectTo || getRedirectPathByRole(user?.role),
  };
};

// Déconnexion : supprime uniquement les données locales (pas d'appel API de révocation de token)
export const logout = () => clearAuthStorage();

// Récupère le profil de l'utilisateur actuellement connecté depuis l'API (route protégée par JWT)
export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");
  // Extraction de l'utilisateur depuis la réponse (deux structures possibles)
  const user = response.user || response.data?.user;

  // Met à jour les données utilisateur en localStorage pour les garder synchronisées
  if (user) {
    saveUser(user);
  }

  return user;
};

// Alias de signin pour la compatibilité avec d'anciens appels dans la codebase
export const loginAndStoreToken = signin;
