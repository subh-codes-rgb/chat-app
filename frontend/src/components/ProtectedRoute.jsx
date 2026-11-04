import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, authError } = useAuth();

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

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
