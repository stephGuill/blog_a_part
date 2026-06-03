// Import du hook useContext de React pour consommer la valeur courante d'un contexte
import { useContext } from "react";

// Import du contexte d'authentification (AuthContext)
// Il expose : user, token, isAuthenticated, login(), logout(), etc.
import { AuthContext } from "@context/AuthContext";

// Hook personnalisé useAuth : raccourci pour accéder au contexte d'authentification
// Retourne toutes les données et fonctions exposées par AuthContext
// Utilisation dans un composant : const { user, logout } = useAuth();
export const useAuth = () => useContext(AuthContext);
