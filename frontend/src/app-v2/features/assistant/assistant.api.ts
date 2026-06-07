import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";
import type { AssistantChatRequest, AssistantChatResponse } from "./assistant.types";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function sendAssistantMessage(
  payload: AssistantChatRequest
): Promise<AssistantChatResponse> {
  const teamId = getTeamId();
  return apiRequest<AssistantChatResponse>(`/teams/${teamId}/ai/assistant/chat`, {
    method: "POST",
    requiresAuth: true,
    body: JSON.stringify(payload),
  });
}

export function formatAssistantError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("503") || msg.includes("localbackend")) {
      return error.message;
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return `${error.message} The assistant may take up to a minute for complex questions.`;
    }
    if (msg.includes("local ai") || msg.includes("connection") || msg.includes("circuit")) {
      return `${error.message} — ensure the AI backend is running (see backend/AI_BACKEND_SETUP.md).`;
    }
    return error.message;
  }
  return "Assistant request failed.";
}
