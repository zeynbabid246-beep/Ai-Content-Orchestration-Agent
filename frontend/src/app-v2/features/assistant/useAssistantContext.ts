import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useBrandStudio } from "../brand-studio/hooks/useBrandStudio";
import { useCampaignParam } from "../campaigns/hooks/useCampaignParam";
import { useChannelParam } from "../channels/hooks/useChannelParam";
import { ROUTES } from "../../shared/lib/routes";
import type { AssistantContext } from "./assistant.types";

const PAGE_MEMORY_KEY = "contentflow_assistant_page_memory";

type PageMemory = Record<string, AssistantContext>;

function loadPageMemory(): PageMemory {
  try {
    const raw = sessionStorage.getItem(PAGE_MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PageMemory;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePageMemory(page: string, context: AssistantContext): void {
  try {
    const all = loadPageMemory();
    all[page] = { ...(all[page] ?? {}), ...context };
    sessionStorage.setItem(PAGE_MEMORY_KEY, JSON.stringify(all));
  } catch {
    // sessionStorage may be unavailable
  }
}

function resolvePage(pathname: string): string {
  if (pathname.startsWith(ROUTES.dashboard)) return "dashboard";
  if (pathname.startsWith(ROUTES.brandStudio)) return "brand";
  if (pathname.startsWith(ROUTES.generate)) return "generate";
  if (pathname.startsWith(ROUTES.calendar) || pathname.startsWith("/app/scheduler")) return "calendar";
  if (pathname.startsWith(ROUTES.contentFeed)) return "content_feed";
  if (pathname.includes("/campaigns/")) return "campaign_content";
  if (pathname.startsWith(ROUTES.channels)) return "channels";
  if (pathname.startsWith(ROUTES.campaigns)) return "campaigns";
  return "global";
}

export function useAssistantContext(): AssistantContext {
  const location = useLocation();
  const channelId = useChannelParam();
  const campaignId = useCampaignParam();
  const brandStudioQuery = useBrandStudio();
  const orgId = brandStudioQuery.data?.brandStudio?.parsedProfile?.orgId ?? null;

  return useMemo(() => {
    const page = resolvePage(location.pathname);
    const context: AssistantContext = {
      page,
      platform: "assistant_widget",
    };

    if (orgId) {
      context.brand_id = orgId;
      context.orgId = orgId;
    }

    if (channelId) context.channel_id = channelId;
    if (campaignId) context.campaign_id = campaignId;

    const stored = loadPageMemory()[page];
    if (stored) {
      Object.assign(context, stored);
    }

    if (channelId) context.channel_id = channelId;
    if (campaignId) context.campaign_id = campaignId;
    if (orgId) {
      context.brand_id = orgId;
      context.orgId = orgId;
    }
    context.page = page;

    savePageMemory(page, {
      ...(channelId ? { channel_id: channelId } : {}),
      ...(campaignId ? { campaign_id: campaignId } : {}),
      ...(orgId ? { brand_id: orgId, orgId } : {}),
    });

    return context;
  }, [location.pathname, channelId, campaignId, orgId]);
}

export function getConversationMemoryKey(page: string): string {
  return `contentflow_assistant_memory_${page}`;
}

export function loadConversationMemory(page: string): { role: "user" | "assistant"; content: string }[] {
  try {
    const raw = localStorage.getItem(getConversationMemoryKey(page));
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.slice(-12) : [];
  } catch {
    return [];
  }
}

export function saveConversationMemory(
  page: string,
  history: { role: "user" | "assistant"; content: string }[]
): void {
  try {
    localStorage.setItem(getConversationMemoryKey(page), JSON.stringify(history.slice(-12)));
  } catch {
    // localStorage may be unavailable
  }
}
