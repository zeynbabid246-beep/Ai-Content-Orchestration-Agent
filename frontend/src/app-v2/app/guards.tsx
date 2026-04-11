import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "../shared/lib/storage";
import { ROUTES } from "../shared/lib/routes";

export function RequireAuth() {
  const token = authStorage.getAccessToken();
  return token ? <Outlet /> : <Navigate to={ROUTES.login} replace />;
}

export function PublicOnly() {
  const token = authStorage.getAccessToken();
  return token ? <Navigate to={ROUTES.dashboard} replace /> : <Outlet />;
}
