// Navigate : redirection déclarative dans le JSX (pas de hook useNavigate nécessaire)
// useLocation : accès à l'URL courante pour pouvoir y revenir après connexion
import { Navigate, useLocation } from "react-router-dom";

// Spinner affiché pendant la vérification de session
import Spinner from "@components/ui/Spinner/Spinner";

// Hook personnalisé d'accès au contexte d'authentification
import { useAuth } from "@hooks/useAuth";

// Composant de garde de route basé sur les rôles
// allowedRoles : liste des rôles autorisés à accéder à la route (tableau vide = pas de restriction)
// children : le contenu de la route protégée à afficher si l'accès est autorisé
function RoleRoute({ allowedRoles = [], children }) {
  // canAccess : fonction qui vérifie si l'utilisateur possède au moins un rôle autorisé
  // isAuthenticated : booléen indiquant si l'utilisateur est connecté
  // isLoading : booléen indiquant si la vérification de session est en cours
  const { canAccess, isAuthenticated, isLoading } = useAuth();

  // Lecture de la localisation courante pour la mémoriser en cas de redirection
  const location = useLocation();

  // Pendant la vérification du token, affiche un spinner pour éviter un flash de contenu
  if (isLoading) {
    return <Spinner />;
  }

  // Si l'utilisateur n'est pas connecté, redirige vers la page de connexion
  // state={{ from: location }} permet de revenir ici après une connexion réussie
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Si l'utilisateur est connecté mais n'a pas le bon rôle, redirige vers la page 403 (Accès refusé)
  // canAccess(allowedRoles) vérifie si l'un des rôles de l'utilisateur est dans allowedRoles
  if (!canAccess(allowedRoles)) {
    return <Navigate to="/403" replace />;
  }

  // L'utilisateur est connecté ET possède le bon rôle : on rend le contenu protégé
  return children;
}

export default RoleRoute;
