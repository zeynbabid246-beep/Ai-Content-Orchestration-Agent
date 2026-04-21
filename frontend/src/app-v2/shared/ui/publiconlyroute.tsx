
import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "../lib/storage";

export function PublicOnlyRoute() {
  const token = authStorage.getAccessToken();
  if (token) return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}