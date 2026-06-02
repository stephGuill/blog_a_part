import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import {
  getCurrentUser,
  getStoredUser,
  getToken,
  logout as logoutService,
  signin as signinService,
  signup as signupService,
  verifyTwoFactorLogin as verifyTwoFactorLoginService,
} from "@services/authService";

export const AuthContext = createContext({
  canAccess: () => false,
  hasRole: () => false,
  isAuthenticated: false,
  isLoading: true,
  logout: () => {},
  signin: () => {},
  signup: () => {},
  token: null,
  user: null,
  verifyTwoFactorLogin: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getToken());
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        logoutService();
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const signin = useCallback(async (credentials) => {
    const response = await signinService(credentials);

    if (!response.requiresTwoFactor) {
      setUser(response.user);
      setToken(response.token);
    }

    return response;
  }, []);

  const verifyTwoFactorLogin = useCallback(async (payload) => {
    const response = await verifyTwoFactorLoginService(payload);
    setUser(response.user);
    setToken(response.token);
    return response;
  }, []);

  const signup = useCallback((payload) => signupService(payload), []);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
    setToken(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;

      const membershipRoles = (user.blogMemberships || []).map((membership) => membership.role);
      return [user.role, user.globalRole, ...membershipRoles].some((role) => roles.includes(role));
    },
    [user]
  );

  const canAccess = useCallback(
    (allowedRoles = []) => {
      if (!user) return false;
      if (allowedRoles.length === 0) return true;

      const membershipRoles = (user.blogMemberships || []).map((membership) => membership.role);
      return [user.role, user.globalRole, ...membershipRoles].some((role) => allowedRoles.includes(role));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      canAccess,
      hasRole,
      isAuthenticated: Boolean(user && token),
      isLoading,
      logout,
      signin,
      signup,
      token,
      user,
      verifyTwoFactorLogin,
    }),
    [canAccess, hasRole, isLoading, logout, signin, signup, token, user, verifyTwoFactorLogin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
