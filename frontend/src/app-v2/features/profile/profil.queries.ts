import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProfile,
  updateProfile,
  Profile,
  UpdateProfilePayload,
} from "./profil.api";

// ─── keys ─────────────────────────────────────────────────────────────────────

export const profileKeys = {
  all: ["profile"] as const,
};

// ─── hooks ────────────────────────────────────────────────────────────────────

/**
 * Reads profile from authStorage + localStorage.
 * Synchronous — never makes a network request.
 */
export const useProfile = () => {
  return useQuery<Profile>({
    queryKey: profileKeys.all,
    queryFn: () => getProfile(),   // synchronous, wrapped in a Promise by React Query
    staleTime: Infinity,           // data is local — never re-fetch automatically
  });
};

/**
 * Updates name (→ authStorage) and bio (→ localStorage).
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      Promise.resolve(updateProfile(payload)),

    onSuccess: (updated) => {
      queryClient.setQueryData<Profile>(profileKeys.all, updated);
    },
  });
};

/**
 * Avatar upload.
 * Currently creates a local object URL for preview.
 * To connect to your backend: replace the mutationFn body with your real API call.
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      // 🔧 Replace this line with your real upload call when the endpoint is ready:
      // return apiRequest<{ url: string }>("/profile/avatar", { method: "POST", body: formData, requiresAuth: true });
      const objectUrl = URL.createObjectURL(file);
      return Promise.resolve({ url: objectUrl });
    },

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

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (_payload: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => Promise.reject(new Error("Password update not yet implemented.")),
  });
};