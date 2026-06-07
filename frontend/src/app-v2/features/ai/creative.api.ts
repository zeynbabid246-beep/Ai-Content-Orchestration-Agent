import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { SocialPlatform } from "../content-posts/content-posts.types";

/** Must exceed backend LocalAI:CreativeTimeoutSeconds (default 180s). */
const CREATIVE_CLIENT_TIMEOUT_MS = 4 * 60 * 1000;

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export type GeneratePostCreativeRequest = {
  contentPostId: number;
  platform?: SocialPlatform;
  language?: string;
  visualDirection?: string;
  persistToPost?: boolean;
};

export type GeneratePostCreativeResponse = {
  contentPostId: number;
  creativeMode: "poster" | "carousel" | string;
  posterUrl?: string | null;
  carouselAssets: string[];
  creativeError?: string | null;
  contentJson: string;
  correlationId: string;
};

export async function generatePostCreative(
  payload: GeneratePostCreativeRequest
): Promise<GeneratePostCreativeResponse> {
  const teamId = getTeamId();
  return apiRequest<GeneratePostCreativeResponse>(`/teams/${teamId}/ai/creative/generate`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
    timeoutMs: CREATIVE_CLIENT_TIMEOUT_MS,
  });
}

export function formatCreativeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return `${error.message} Visual generation can take a few minutes — wait and retry, or raise LocalAI:CreativeTimeoutSeconds in the .NET API config.`;
    }
    if (msg.includes("local ai") || msg.includes("connection") || msg.includes("circuit")) {
      return `${error.message} — ensure the AI backend is running (see backend/AI_BACKEND_SETUP.md).`;
    }
    return error.message;
  }
  return "Creative generation failed.";
}
