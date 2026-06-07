import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createManualBrandStudio,
  getBrandImportJob,
  getBrandStudio,
  startBrandImport,
} from "../services/brandStudio.service";
import { brandStudioKeys } from "../store/brandStudio.store";
import type { CreateBrandImportRequest, CreateManualBrandStudioRequest } from "../types/brandStudio.types";

export function useBrandStudio() {
  return useQuery({
    queryKey: brandStudioKeys.detail(),
    queryFn: getBrandStudio,
  });
}

export function useBrandImportJob(jobId: number | null) {
  return useQuery({
    queryKey: jobId ? brandStudioKeys.job(jobId) : brandStudioKeys.job(0),
    queryFn: () => getBrandImportJob(jobId ?? 0),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "processing" ? 2000 : false;
    },
  });
}

export function useStartBrandImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBrandImportRequest) => startBrandImport(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(brandStudioKeys.detail(), {
        brandStudio: data.brandStudio,
      });
      queryClient.setQueryData(brandStudioKeys.job(data.job.id), data.job);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: brandStudioKeys.detail() });
    },
  });
}

export function useCreateManualBrandStudio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateManualBrandStudioRequest) => createManualBrandStudio(payload),
    onSuccess: (brandStudio) => {
      queryClient.setQueryData(brandStudioKeys.detail(), { brandStudio });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: brandStudioKeys.detail() });
    },
  });
}
