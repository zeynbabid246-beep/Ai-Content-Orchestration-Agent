import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";

export type PublicationStatus =
  | "Scheduled"
  | "Queued"
  | "Publishing"
  | "Published"
  | "Failed"
  | "Retrying"
  | "Cancelled";

export interface Publication {
  id: number;
  teamId: string;
  contentPostId: number;
  postVariantId: number | null;
  socialAccountId: number;
  status: PublicationStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalPostId: string | null;
  externalPostUrl: string | null;
  errorMessage: string | null;
  idempotencyKey: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublishPublicationRequest {
  socialAccountId: number;
  postVariantId?: number | null;
  idempotencyKey?: string;
}

export interface SchedulePublicationRequest extends PublishPublicationRequest {
  scheduledAt: string;
}

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function publishPublication(
  contentPostId: number,
  payload: PublishPublicationRequest
): Promise<Publication> {
  const teamId = getTeamId();
  return apiRequest<Publication>(`/teams/${teamId}/content-posts/${contentPostId}/publications`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export async function schedulePublication(
  contentPostId: number,
  payload: SchedulePublicationRequest
): Promise<Publication> {
  const teamId = getTeamId();
  return apiRequest<Publication>(
    `/teams/${teamId}/content-posts/${contentPostId}/publications/scheduled`,
    {
      method: "POST",
      requiresAuth: true,
      body: JSON.stringify(payload),
    }
  );
}

export async function getPublication(publicationId: number): Promise<Publication> {
  const teamId = getTeamId();
  return apiRequest<Publication>(`/teams/${teamId}/publications/${publicationId}`, {
    requiresAuth: true,
  });
}

const TERMINAL_STATUSES = new Set<PublicationStatus>(["Published", "Failed", "Cancelled"]);

export async function waitForPublication(
  publicationId: number,
  options?: { timeoutMs?: number; intervalMs?: number }
): Promise<Publication> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const intervalMs = options?.intervalMs ?? 2_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const publication = await getPublication(publicationId);
    if (TERMINAL_STATUSES.has(publication.status)) {
      return publication;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Publishing is taking longer than expected. Check your content library for status.");
}

export function formatPublicationError(message: string | null | undefined): string {
  if (!message) return "Publishing failed.";
  if (message.includes("localhost") || message.includes("imageUrl")) {
    return "The image URL is not publicly accessible. Configure App__PublicMediaBaseUrl in the backend .env (e.g. using ngrok) so social platforms can download the image.";
  }
  if (message.includes("Instagram") && message.includes("image")) {
    return message;
  }
  return message.length > 280 ? `${message.slice(0, 277)}...` : message;
}
