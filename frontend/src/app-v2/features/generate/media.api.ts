import { env } from "../../shared/lib/env";
import { authStorage } from "../../shared/lib/storage";

interface UploadImageResponse {
  url: string;
  relativePath: string;
  contentType: string;
  sizeBytes: number;
}

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) {
    throw new Error("No team found. Please log in again.");
  }
  return teamId;
}

export async function uploadGenerateImage(file: File): Promise<UploadImageResponse> {
  const teamId = getTeamId();
  const token = authStorage.getAccessToken();
  if (!token) {
    throw new Error("You are not authenticated.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${env.apiBaseUrl}/teams/${teamId}/media/images`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? "Image upload failed.");
  }

  return response.json() as Promise<UploadImageResponse>;
}
