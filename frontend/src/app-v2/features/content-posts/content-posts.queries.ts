import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getContentPosts, 
  getContentPostById, 
  createContentPost, 
  updateContentPost, 
  deleteContentPost,
  transitionContentPostStatus,
  scheduleContentPost,
  publishContentPost
} from "./content-posts.api";
import type { 
  CreateContentPostRequest, 
  UpdateContentPostRequest,
  TransitionContentPostStatusRequest,
  ScheduleContentPostRequest,
  PublishContentPostRequest 
} from "./content-posts.types";

export const contentPostsKeys = {
  all: ["contentPosts"] as const,
  lists: () => [...contentPostsKeys.all, "list"] as const,
  list: (filters: string) => [...contentPostsKeys.lists(), { filters }] as const,
  details: () => [...contentPostsKeys.all, "detail"] as const,
  detail: (id: number) => [...contentPostsKeys.details(), id] as const,
};

export function useContentPosts() {
  return useQuery({
    queryKey: contentPostsKeys.lists(),
    queryFn: getContentPosts,
  });
}

export function useContentPost(id: number) {
  return useQuery({
    queryKey: contentPostsKeys.detail(id),
    queryFn: () => getContentPostById(id),
    enabled: !!id,
  });
}

export function useCreateContentPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateContentPostRequest) => createContentPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
    },
  });
}

export function useUpdateContentPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContentPostRequest }) => updateContentPost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteContentPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteContentPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
    },
  });
}

export function useTransitionContentPostStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransitionContentPostStatusRequest }) => transitionContentPostStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(variables.id) });
    },
  });
}

export function useScheduleContentPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ScheduleContentPostRequest }) => scheduleContentPost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(variables.id) });
    },
  });
}

export function usePublishContentPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PublishContentPostRequest }) => publishContentPost(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(variables.id) });
    },
  });
}
