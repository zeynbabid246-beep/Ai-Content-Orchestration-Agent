import { useQuery } from "@tanstack/react-query";
import { getInvitedMembers } from "../../mocks/member.Api";

export const membersKeys = {
  all: ["members"] as const,
};

export function useMembersQuery() {
  return useQuery({
    queryKey: membersKeys.all,
    queryFn: getInvitedMembers,
  });
}