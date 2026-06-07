import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
  Profile,
  UpdateProfilePayload,
} from "./profil.api";
import { authStorage } from "../../shared/lib/storage";

export const profileKeys = {
  all: ["profile"] as const,
};

export const useProfile = () => {
  return useQuery<Profile>({
    queryKey: profileKeys.all,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<Profile>(profileKeys.all, updated);
      const userId = authStorage.getUserId();
      if (userId) {
        authStorage.setUser(userId, updated.username, updated.email);
      }
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (data) => {
      const prev = queryClient.getQueryData<Profile>(profileKeys.all);
      if (prev) {
        queryClient.setQueryData<Profile>(profileKeys.all, {
          ...prev,
          avatarUrl: data.url,
        });
      }
    },
  });
};

export const useRemoveAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      const prev = queryClient.getQueryData<Profile>(profileKeys.all);
      if (prev) {
        queryClient.setQueryData<Profile>(profileKeys.all, {
          ...prev,
          avatarUrl: null,
        });
      }
    },
  });
};
