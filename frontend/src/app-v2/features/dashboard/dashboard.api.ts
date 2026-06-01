import type { DashboardPost, DashboardStat, AnalyticsData } from "./dashboard.types";

import { apiRequest } from "../../shared/lib/http";
import { authStorage } from "../../shared/lib/storage";

function getTeamId(): string {
  const teamId = authStorage.getTeamId();
  if (!teamId) throw new Error("No team found. Please log in again.");
  return teamId;
}

export async function getDashboardPosts(): Promise<DashboardPost[]> {
  const teamId = getTeamId();
  const posts = await apiRequest<any[]>(`/teams/${teamId}/content-posts`, {
    requiresAuth: true,
  });

  return posts.slice(0, 5).map(p => {
    let platformName = "Unknown";
    if (p.contentType === "TwitterThread") platformName = "X";
    else if (p.contentType === "LinkedInPost") platformName = "LinkedIn";
    else if (p.contentType === "InstagramPost") platformName = "Instagram";
    else if (p.contentType === "FacebookPost") platformName = "Facebook";
    else if (p.contentType === "BlogPost") platformName = "Blog";

    let statusName = "Draft";
    if (p.status === "Review") statusName = "Review";
    if (p.status === "Approved") statusName = "Approved";
    if (p.status === "Scheduled") statusName = "Scheduled";
    if (p.status === "Published") statusName = "Published";
    if (p.status === "Archived") statusName = "Archived";

    return {
      id: p.id,
      title: p.title || "Untitled",
      subtitle: p.prompt?.substring(0, 30) || "Generated via AI",
      platform: platformName as any,
      status: statusName as any,
      date: new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
  });
}

export async function getDashboardStats(): Promise<DashboardStat[]> {
  const teamId = getTeamId();
  const posts = await apiRequest<any[]>(`/teams/${teamId}/content-posts`, {
    requiresAuth: true,
  });

  const scheduledCount = posts.filter(p => p.status === "Scheduled").length;
  const publishedCount = posts.filter(p => p.status === "Published").length;

  return [
    { value: posts.length.toString(), label: "Total Posts", trend: null, direction: null },
    { value: publishedCount.toString(), label: "Published Posts", trend: null, direction: null },
    { value: scheduledCount.toString(), label: "Scheduled Posts", trend: null, direction: null },
    { value: "0", label: "Avg. Engagement", trend: null, direction: null },
  ];
}

export async function getDashboardAnalytics(): Promise<AnalyticsData | null> {
  // Real platform analytics sync is not available yet.
  return null;
}

export async function getDashboardAnalyticsLegacyMock(): Promise<AnalyticsData> {
  return {
    platforms: [
      {
        name: "LinkedIn",
        color: "#0A66C2",
        followers: 12400,
        reach: 8900,
        engagement: 4.2,
        comments: 312,
        likes: 1840,
        shares: 290,
        topAudience: [
          { type: "Company", percentage: 54 },
          { type: "Individual", percentage: 46 },
        ],
        weeklyActivity: [42, 58, 61, 74, 80, 55, 48],
        activeClients: [
          { name: "Acme Corp", type: "Company", interactions: 84, avatar: "AC" },
          { name: "Sarah Holt", type: "Individual", interactions: 67, avatar: "SH" },
          { name: "BrightScale", type: "Company", interactions: 55, avatar: "BS" },
          { name: "James Wu", type: "Individual", interactions: 49, avatar: "JW" },
        ],
      },
      {
        name: "Instagram",
        color: "#E1306C",
        followers: 9800,
        reach: 6200,
        engagement: 5.8,
        comments: 524,
        likes: 3210,
        shares: 180,
        topAudience: [
          { type: "Individual", percentage: 78 },
          { type: "Company", percentage: 22 },
        ],
        weeklyActivity: [90, 112, 98, 135, 120, 145, 130],
        activeClients: [
          { name: "Mia Chen", type: "Individual", interactions: 142, avatar: "MC" },
          { name: "Leo Brands", type: "Company", interactions: 98, avatar: "LB" },
          { name: "Priya Nair", type: "Individual", interactions: 87, avatar: "PN" },
          { name: "NovaTech", type: "Company", interactions: 72, avatar: "NT" },
        ],
      },
      {
        name: "Facebook",
        color: "#1877F2",
        followers: 7300,
        reach: 4100,
        engagement: 2.9,
        comments: 198,
        likes: 890,
        shares: 340,
        topAudience: [
          { type: "Individual", percentage: 62 },
          { type: "Company", percentage: 38 },
        ],
        weeklyActivity: [30, 28, 35, 40, 33, 38, 25],
        activeClients: [
          { name: "DeltaGroup", type: "Company", interactions: 76, avatar: "DG" },
          { name: "Tom Rivera", type: "Individual", interactions: 64, avatar: "TR" },
          { name: "Apex Media", type: "Company", interactions: 58, avatar: "AM" },
          { name: "Lena Park", type: "Individual", interactions: 41, avatar: "LP" },
        ],
      },
    ],
    topChannel: "Instagram",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  };
}