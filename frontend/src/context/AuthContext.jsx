// Importation des hooks React nécessaires pour créer le contexte et gérer l'état
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

// Importation des fonctions du service d'authentification
import {
  getCurrentUser,                                               // Récupère l'utilisateur courant depuis l'API (vérification du token)
  getStoredUser,                                                // Lit l'utilisateur sauvegardé dans localStorage
  getToken,                                                     // Lit le JWT sauvegardé dans localStorage
  logout as logoutService,                                      // Fonction de déconnexion (supprime le token du localStorage)
  signin as signinService,                                      // Fonction de connexion (appel API + sauvegarde token)
  signup as signupService,                                      // Fonction d'inscription (appel API)
  verifyTwoFactorLogin as verifyTwoFactorLoginService,          // Vérification du code 2FA
} from "@services/authService";

// Création du contexte d'authentification avec des valeurs par défaut
// createContext crée un objet Context que les composants enfants peuvent consommer via useContext
export const AuthContext = createContext({
  canAccess: () => false,         // Valeur par défaut : aucun accès autorisé
  hasRole: () => false,           // Valeur par défaut : aucun rôle
  isAuthenticated: false,         // Par défaut l'utilisateur n'est pas connecté
  isLoading: true,                // Par défaut on suppose qu'une vérification est en cours
  logout: () => {},               // Fonction vide par défaut
  signin: () => {},               // Fonction vide par défaut
  signup: () => {},               // Fonction vide par défaut
  token: null,                    // Aucun token par défaut
  user: null,                     // Aucun utilisateur par défaut
  verifyTwoFactorLogin: () => {}, // Fonction vide par défaut
});

// Composant fournisseur (Provider) qui encapsule l'application et expose le contexte d'auth
export function AuthProvider({ children }) {
  // useState avec une fonction d'initialisation lazy : lit l'utilisateur du localStorage au premier rendu
  const [user, setUser] = useState(() => getStoredUser());

  // useState avec initialisation lazy : lit le token JWT depuis localStorage au premier rendu
  const [token, setToken] = useState(() => getToken());

  // isLoading est true uniquement si un token existe (il faut vérifier sa validité avec l'API)
  const [isLoading, setIsLoading] = useState(Boolean(getToken()));

  // useEffect : s'exécute après le premier rendu et à chaque changement de `token`
  // Vérifie la validité de la session en interrogeant l'API
  useEffect(() => {
    // Drapeau pour éviter les mises à jour d'état sur un composant démonté (memory leak)
    let isMounted = true;

    // Fonction asynchrone interne pour vérifier la session
    async function verifySession() {
      // Si aucun token n'est présent, on arrête immédiatement le chargement
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Appel API pour récupérer l'utilisateur correspondant au token stocké
        const currentUser = await getCurrentUser();
        // Met à jour l'utilisateur seulement si le composant est encore monté
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        // Si le token est invalide ou expiré, on déconnecte proprement
        logoutService(); // Supprime le token du localStorage
        if (isMounted) {
          setUser(null);  // Réinitialise l'utilisateur
          setToken(null); // Réinitialise le token
        }
      } finally {
        // Dans tous les cas, on signale la fin du chargement
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifySession(); // Lancement de la vérification

    // Fonction de nettoyage : marque le composant comme démonté pour éviter les fuites mémoire
    return () => {
      isMounted = false;
    };
  }, [token]); // Dépendance : relance l'effet si le token change

  // useCallback mémoïse la fonction signin pour éviter de la recréer à chaque rendu
  const signin = useCallback(async (credentials) => {
    // Appel au service de connexion avec les identifiants (email/pseudo + mot de passe)
    const response = await signinService(credentials);

    // Si la connexion ne nécessite pas de 2FA, on stocke directement l'utilisateur et le token
    if (!response.requiresTwoFactor) {
      setUser(response.user);   // Met à jour l'utilisateur dans le contexte
      setToken(response.token); // Met à jour le token dans le contexte
    }

    // Retourne la réponse (peut contenir requiresTwoFactor et temporaryToken)
    return response;
  }, []); // Tableau vide : la fonction ne change jamais

  // useCallback mémoïse la vérification du code de double authentification
  const verifyTwoFactorLogin = useCallback(async (payload) => {
    // payload contient { temporaryToken, code } — le code saisi par l'utilisateur
    const response = await verifyTwoFactorLoginService(payload);
    setUser(response.user);   // Après validation 2FA, on enregistre l'utilisateur
    setToken(response.token); // On enregistre le token définitif
    return response;
  }, []); // Tableau vide : la fonction ne change jamais

  // useCallback mémoïse la fonction d'inscription — délègue directement au service
  const signup = useCallback((payload) => signupService(payload), []);

  // useCallback mémoïse la déconnexion
  const logout = useCallback(() => {
    logoutService(); // Supprime le token du localStorage via le service
    setUser(null);   // Efface l'utilisateur dans le contexte
    setToken(null);  // Efface le token dans le contexte
  }, []); // Tableau vide : la fonction ne change jamais

  // useCallback mémoïse la vérification des rôles — dépend de `user`
  const hasRole = useCallback(
    (...roles) => {
      // Si aucun utilisateur n'est connecté, retourne false immédiatement
      if (!user) return false;

      // Collecte tous les rôles des memberships blog de l'utilisateur
      const membershipRoles = (user.blogMemberships || []).map((membership) => membership.role);

      // Vérifie si l'utilisateur possède au moins un des rôles demandés
      // user.role : rôle principal, user.globalRole : rôle global, membershipRoles : rôles blog
      return [user.role, user.globalRole, ...membershipRoles].some((role) => roles.includes(role));
    },
    [user] // Se recalcule uniquement si `user` change
  );

  // useCallback mémoïse la vérification d'accès — dépend de `user`
  const canAccess = useCallback(
    (allowedRoles = []) => {
      // Si aucun utilisateur, accès refusé
      if (!user) return false;
      // Si la liste de rôles autorisés est vide, tout utilisateur connecté peut accéder
      if (allowedRoles.length === 0) return true;

      // Collecte tous les rôles des memberships blog
      const membershipRoles = (user.blogMemberships || []).map((membership) => membership.role);

      // Vérifie si l'un des rôles de l'utilisateur figure dans la liste autorisée
      return [user.role, user.globalRole, ...membershipRoles].some((role) => allowedRoles.includes(role));
    },
    [user] // Se recalcule uniquement si `user` change
  );

  // useMemo construit l'objet de valeur du contexte — ne se recalcule que si une dépendance change
  // Cela évite de re-rendre inutilement tous les consommateurs du contexte
  const value = useMemo(
    () => ({
      canAccess,              // Fonction pour vérifier l'accès par liste de rôles
      hasRole,                // Fonction pour vérifier la présence d'un rôle spécifique
      isAuthenticated: Boolean(user && token), // true uniquement si l'utilisateur ET le token sont présents
      isLoading,              // true pendant la vérification initiale de session
      logout,                 // Fonction de déconnexion
      signin,                 // Fonction de connexion
      signup,                 // Fonction d'inscription
      token,                  // Le JWT courant
      user,                   // L'objet utilisateur courant
      verifyTwoFactorLogin,   // Fonction de validation du code 2FA
    }),
    // Le tableau de dépendances : recalcul uniquement si l'une de ces valeurs change
    [canAccess, hasRole, isLoading, logout, signin, signup, token, user, verifyTwoFactorLogin]
  );

  // Le Provider injecte la valeur du contexte dans l'arbre de composants enfants
  // Tous les composants utilisant useContext(AuthContext) recevront ces valeurs
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
