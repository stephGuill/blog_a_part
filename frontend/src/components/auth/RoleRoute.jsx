import { Navigate, useLocation } from "react-router-dom";

import Spinner from "@components/ui/Spinner/Spinner";
import { useAuth } from "@hooks/useAuth";

function RoleRoute({ allowedRoles = [], children }) {
  const { canAccess, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (!canAccess(allowedRoles)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default RoleRoute;
