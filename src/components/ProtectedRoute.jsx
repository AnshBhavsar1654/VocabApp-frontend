import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-dvh bg-(--color-bg) grid place-items-center px-4">
        <div className="card text-center max-w-sm w-full">
          <div className="skeleton" style={{ height: 18, width: 120, margin: "0 auto 12px" }} />
          <div className="skeleton" style={{ height: 12, width: "80%", margin: "0 auto" }} />
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
