import { apiRequest } from "../../../shared/lib/http";
import { authStorage } from "../../../shared/lib/storage";
import type {
  BrandStudioDefaultConfig,
  BrandImportJob,
  TeamBrandStudio,
  BrandStudioSnapshot,
  CreateBrandImportRequest,
  CreateBrandImportResponse,
  CreateManualBrandStudioRequest,
  UpdateBrandStudioRequest,
} from "../types/brandStudio.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getBrandStudio(): Promise<BrandStudioSnapshot> {
  const teamId = getTeamId();
  return apiRequest<BrandStudioSnapshot>(`/teams/${teamId}/brand-studio`, {
    requiresAuth: true,
  });
}

export async function createManualBrandStudio(
  payload: CreateManualBrandStudioRequest
): Promise<TeamBrandStudio> {
  const teamId = getTeamId();
  return apiRequest<TeamBrandStudio>(`/teams/${teamId}/brand-studio/manual`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function startBrandImport(
  payload: CreateBrandImportRequest
): Promise<CreateBrandImportResponse> {
  const teamId = getTeamId();
  return apiRequest<CreateBrandImportResponse>(`/teams/${teamId}/brand-studio/import`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function getBrandImportJob(jobId: number): Promise<BrandImportJob> {
  const teamId = getTeamId();
  return apiRequest<BrandImportJob>(`/teams/${teamId}/brand-studio/jobs/${jobId}`, {
    requiresAuth: true,
  });
}

export async function getBrandImportJobs(): Promise<BrandImportJob[]> {
  const teamId = getTeamId();
  return apiRequest<BrandImportJob[]>(`/teams/${teamId}/brand-studio/jobs`, {
    requiresAuth: true,
  });
}

export async function updateBrandStudio(payload: UpdateBrandStudioRequest): Promise<TeamBrandStudio> {
  const teamId = getTeamId();
  return apiRequest<TeamBrandStudio>(`/teams/${teamId}/brand-studio`, {
    method: "PATCH",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export type { BrandStudioDefaultConfig };
