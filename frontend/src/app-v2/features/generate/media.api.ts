import { apiFormUpload } from "../../shared/lib/http-upload";
import { authStorage } from "../../shared/lib/storage";

export interface UploadImageResponse {
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

function normalizeUploadResponse(raw: Record<string, unknown>): UploadImageResponse {
  const url = (raw.url ?? raw.Url) as string | undefined;
  if (!url?.trim()) {
    throw new Error("Upload succeeded but the server did not return an image URL.");
  }
  return {
    url: url.trim(),
    relativePath: String(raw.relativePath ?? raw.RelativePath ?? ""),
    contentType: String(raw.contentType ?? raw.ContentType ?? ""),
    sizeBytes: Number(raw.sizeBytes ?? raw.SizeBytes ?? 0),
  };
}

export async function uploadGenerateImage(file: File): Promise<UploadImageResponse> {
  const teamId = getTeamId();
  const formData = new FormData();
  formData.append("file", file, file.name || "image");

  const data = await apiFormUpload<Record<string, unknown>>(
    `/teams/${teamId}/media/images`,
    formData
  );
  return normalizeUploadResponse(data);
}
