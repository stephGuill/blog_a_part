import { Navigate, useLocation } from "react-router-dom";

import Spinner from "@components/ui/Spinner/Spinner";
import { useAuth } from "@hooks/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
