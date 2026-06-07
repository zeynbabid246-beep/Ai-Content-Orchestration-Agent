/**
 * Centralized route constants & builders.
 *
 * Top-level paths are exposed as constants (ROUTES).
 * Nested entity paths use builder functions so callers never construct paths by string concatenation.
 */
export const ROUTES = {
  // Auth
  login: "/app/login",
  register: "/app/register",
  forgotPassword: "/app/forgot-password",
  resetPassword: "/app/reset-password",
  acceptInvite: "/app/accept-invite",

  // Workspace
  dashboard: "/app/dashboard",
  generate: "/app/generate",
  contentFeed: "/app/content-feed",
  calendar: "/app/calendar",

  // Operations
  channels: "/app/channels",
  campaigns: "/app/campaigns",

  // Integrations
  integrationsSocialAccounts: "/app/integrations/social-accounts",

  // Team
  brandStudio: "/app/brand-studio",
  inviteUser: "/app/invite-user",
  profile: "/app/profile",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Channel-scoped path builders.
 * All channel workspace sub-pages live under /app/channels/:channelId/...
 */
export const channelPaths = {
  root: (channelId: number | string) => `${ROUTES.channels}/${channelId}`,
  overview: (channelId: number | string) => `${ROUTES.channels}/${channelId}/overview`,
  campaigns: (channelId: number | string) => `${ROUTES.channels}/${channelId}/campaigns`,
  content: (channelId: number | string) => `${ROUTES.channels}/${channelId}/content`,
  publishing: (channelId: number | string) => `${ROUTES.channels}/${channelId}/publishing`,
  analytics: (channelId: number | string) => `${ROUTES.channels}/${channelId}/analytics`,
  settings: (channelId: number | string) => `${ROUTES.channels}/${channelId}/settings`,
  newPost: (channelId: number | string) => `${ROUTES.channels}/${channelId}/posts/new`,
  post: (channelId: number | string, postId: number | string) =>
    `${ROUTES.channels}/${channelId}/posts/${postId}`,
};

/** Navigate to the post editor (campaign-scoped when campaignId is set). */
export function postEditorPath(
  channelId: number | string,
  postId: number | string,
  campaignId?: number | null
): string {
  if (campaignId) {
    return campaignPaths.post(channelId, campaignId, postId);
  }
  return channelPaths.post(channelId, postId);
}

/**
 * Campaign-scoped path builders.
 * Campaigns ALWAYS live under their parent channel: /app/channels/:channelId/campaigns/:campaignId
 */
export const campaignPaths = {
  root: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}`,
  overview: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/overview`,
  posts: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/posts`,
  newPost: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/posts/new`,
  post: (
    channelId: number | string,
    campaignId: number | string,
    postId: number | string
  ) => `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/posts/${postId}`,
  timeline: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/timeline`,
  analytics: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/analytics`,
  settings: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/settings`,
  aiPlan: (channelId: number | string, campaignId: number | string) =>
    `${ROUTES.channels}/${channelId}/campaigns/${campaignId}/ai-plan`,
};
