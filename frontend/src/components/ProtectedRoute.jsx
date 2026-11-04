import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, authError } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="app-loading" role="status">
        <span className="loading-indicator" />
        <span>Getting your messages ready…</span>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="app-loading" role="alert">
        <span>{authError}</span>
        <button className="text-button" onClick={() => window.location.reload()} type="button">
          Try again
        </button>
      </div>
    );
  }

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}

export default ProtectedRoute;
