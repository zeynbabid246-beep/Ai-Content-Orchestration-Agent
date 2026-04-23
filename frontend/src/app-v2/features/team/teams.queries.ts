// src/app-v2/features/team/teams.queries.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTeamMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from "./teams.api";

export const teamKeys = {
  members: ["team", "members"] as const,
};

// Used by both InviteUserPage and MembersHistoryPage
export function useMembersQuery() {
  return useQuery({
    queryKey: teamKeys.members,
    queryFn: getTeamMembers,
  });
}

// Alias so InviteUserPage works too
export function useTeamMembersQuery() {
  return useQuery({
    queryKey: teamKeys.members,
    queryFn: getTeamMembers,
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.members }),
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.members }),
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: teamKeys.members }),
  });
}