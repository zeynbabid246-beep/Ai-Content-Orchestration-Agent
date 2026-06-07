export type AssistantLanguage = "fr" | "en" | "ar";

export type AssistantConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantContext = Record<string, unknown>;

export type AssistantChatRequest = {
  message: string;
  language?: AssistantLanguage;
  context?: AssistantContext;
};

export type AssistantScreenshot = {
  title: string;
  url: string;
  description?: string | null;
};

export type AssistantChatResponse = {
  answer: string;
  intent: string;
  brandId?: string | null;
  targetAgent?: string | null;
  needsBrandSelection: boolean;
  suggestedActions: string[];
  language?: string | null;
  screenshots: AssistantScreenshot[];
  metadata: Record<string, unknown>;
  correlationId?: string | null;
};

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  screenshots?: AssistantScreenshot[];
  suggestedActions?: string[];
};
