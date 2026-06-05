import { Navigate, Outlet } from "react-router-dom";
import { useTeamPermissions } from "../hooks/useTeamPermissions";
import { ROUTES } from "../lib/routes";

export function AdminRoute() {
  const { canManageTeam } = useTeamPermissions();

  if (!canManageTeam) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
