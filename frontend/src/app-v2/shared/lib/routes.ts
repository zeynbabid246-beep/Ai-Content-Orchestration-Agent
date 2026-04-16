import { GrOverview } from "react-icons/gr";

/**
 * Centralized route constants.
 * Import ROUTES instead of hardcoding path strings throughout the app.
 */
export const ROUTES = {
  // Auth
  login: "/app/login",
  register: "/app/register",

  // Core
  dashboard: "/app/dashboard",
  brandStudio: "/app/brand-studio",
  analytics: "/app/analytics",
  generate: "/app/generate",
  scheduler: "/app/scheduler",
  GrOverview: "/app/overview",
  activity :"/app/activity",

  // Platforms
  socialMedia: "/app/social-media",
  contentFeed: "/app/content-feed",
  contentType: "/app/content-type",

  // Team
  inviteUser: "/app/invite-user",
  profile: "/app/profile",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
