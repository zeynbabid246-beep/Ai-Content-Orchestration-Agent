import { Alert, Box } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import { useTeamPermissions } from "../hooks/useTeamPermissions";
import { ROUTES } from "../lib/routes";

export function EditorRoute() {
  const { canMutateContent } = useTeamPermissions();

  if (!canMutateContent) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
