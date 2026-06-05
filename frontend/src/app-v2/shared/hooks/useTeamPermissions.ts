import { useMemo } from "react";
import { authStorage } from "../lib/storage";
import type { TeamRole } from "../../features/team/teams.type";

export type TeamPermissions = {
  role: TeamRole | null;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canMutateContent: boolean;
  canManageChannels: boolean;
  canManageTeam: boolean;
  canImportBrand: boolean;
  canViewActivity: boolean;
  canSuperviseTeam: boolean;
};

export function useTeamPermissions(): TeamPermissions {
  const role = (authStorage.getTeamRole() as TeamRole | null) ?? null;

  return useMemo(() => {
    const isAdmin = role === "Admin";
    const isEditor = role === "Editor";
    const isViewer = role === "Viewer";
    const canMutateContent = isAdmin || isEditor;

    return {
      role,
      isAdmin,
      isEditor,
      isViewer,
      canMutateContent,
      canManageChannels: canMutateContent,
      canManageTeam: isAdmin,
      canImportBrand: isAdmin,
      canViewActivity: isAdmin,
      canSuperviseTeam: isAdmin,
    };
  }, [role]);
}
