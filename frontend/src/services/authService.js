import { apiClient, getToken } from "./apiClient";
import { getRedirectPathByRole } from "@utils/roleRedirect";

const TOKEN_KEY = "blogyoo_token";
const USER_KEY = "blogyoo_user";

export const saveToken = (token) => {
  window.localStorage.setItem(TOKEN_KEY, token);
};

export { getToken };

export const saveUser = (user) => {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = () => {
  const user = window.localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const clearAuthStorage = () => {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

export const signup = (payload) => apiClient.post("/auth/register", payload);

export const signin = async (credentials) => {
  const response = await apiClient.post("/auth/signin", credentials);

  if (response.requiresTwoFactor) {
    return response;
  }

  const user = response.user || response.data?.user;

  if (response.token) {
    saveToken(response.token);
  }

  if (user) {
    saveUser(user);
  }

  return {
    ...response,
    user,
    redirectTo: response.redirectTo || getRedirectPathByRole(user?.role),
  };
};

export const verifyTwoFactorLogin = async (payload) => {
  const response = await apiClient.post("/auth/2fa/verify-login", payload);
  const user = response.user || response.data?.user;

  if (response.token) {
    saveToken(response.token);
  }

  if (user) {
    saveUser(user);
  }

  return {
    ...response,
    user,
    redirectTo: response.redirectTo || getRedirectPathByRole(user?.role),
  };
};

export const logout = () => clearAuthStorage();

export const getCurrentUser = async () => {
  const response = await apiClient.get("/auth/me");
  const user = response.user || response.data?.user;

  if (user) {
    saveUser(user);
  }

  return user;
};

export const loginAndStoreToken = signin;
