// Navigate : composant React Router pour effectuer une redirection déclarative dans le JSX
// useLocation : hook React Router pour lire l'URL courante (pathname, search, state...)
import { Navigate, useLocation } from "react-router-dom";

// Composant spinner d'attente affiché pendant le chargement
import Spinner from "@components/ui/Spinner/Spinner";

// Hook personnalisé qui consomme le AuthContext via useContext(AuthContext)
import { useAuth } from "@hooks/useAuth";

// Composant de garde de route : bloque l'accès aux pages nécessitant une authentification
function ProtectedRoute({ children }) {
  // Extraction de l'état d'authentification et du chargement depuis le contexte
  // isAuthenticated : true si l'utilisateur est connecté avec un token valide
  // isLoading : true pendant la vérification initiale du token avec l'API
  const { isAuthenticated, isLoading } = useAuth();

  // useLocation retourne l'objet location courant (URL actuelle)
  // Utilisé pour mémoriser la page demandée et y rediriger après connexion
  const location = useLocation();

  // Rendu conditionnel : si la vérification est en cours, on affiche un spinner
  // Évite un flash de redirection vers /signin avant de savoir si le token est valide
  if (isLoading) {
    return <Spinner />;
  }

  // Rendu conditionnel : si l'utilisateur n'est pas authentifié, redirection vers /signin
  // replace : remplace l'entrée dans l'historique (pas de retour arrière vers la page protégée)
  // state={{ from: location }} : mémorise l'URL demandée pour y rediriger après connexion
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Si l'utilisateur est authentifié, on rend les composants enfants (la page protégée)
  return children;
}

export default ProtectedRoute;
