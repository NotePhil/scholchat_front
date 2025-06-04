import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your custom loading component
  }

  return isAuthenticated() ? (
    <Outlet />
  ) : (
    <Navigate to="/schoolchat/login" replace />
  );
};

export default ProtectedRoute;
