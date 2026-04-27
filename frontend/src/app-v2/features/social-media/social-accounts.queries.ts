import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getSocialAccounts, 
  getSocialAccountById, 
  createSocialAccount, 
  updateSocialAccount, 
  deleteSocialAccount 
} from "./social-accounts.api";
import type { CreateSocialAccountRequest, UpdateSocialAccountRequest } from "./social-accounts.types";

export const socialAccountsKeys = {
  all: ["socialAccounts"] as const,
  lists: () => [...socialAccountsKeys.all, "list"] as const,
  list: (filters: string) => [...socialAccountsKeys.lists(), { filters }] as const,
  details: () => [...socialAccountsKeys.all, "detail"] as const,
  detail: (id: number) => [...socialAccountsKeys.details(), id] as const,
};

export function useSocialAccounts() {
  return useQuery({
    queryKey: socialAccountsKeys.lists(),
    queryFn: getSocialAccounts,
  });
}

export function useSocialAccount(id: number) {
  return useQuery({
    queryKey: socialAccountsKeys.detail(id),
    queryFn: () => getSocialAccountById(id),
    enabled: !!id,
  });
}

export function useCreateSocialAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSocialAccountRequest) => createSocialAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
    },
  });
}

export function useUpdateSocialAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSocialAccountRequest }) => updateSocialAccount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: socialAccountsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteSocialAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteSocialAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialAccountsKeys.lists() });
    },
  });
}
