import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "../shared/lib/storage";

export function RequireAuth() {
  const token = authStorage.getAccessToken();
  return token ? <Outlet /> : <Navigate to="/app/login" replace />;
}

export function PublicOnly() {
  const token = authStorage.getAccessToken();
  return token ? <Navigate to="/app/brands" replace /> : <Outlet />;
}
