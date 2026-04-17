// src/app-v2/shared/ui/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { authStorage } from "../lib/storage";

export function ProtectedRoute() {
  const token = authStorage.getAccessToken();
  if (!token) return <Navigate to="/app/login" replace />;
  return <Outlet />;
}