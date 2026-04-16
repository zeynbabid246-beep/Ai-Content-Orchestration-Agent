import type { DashboardPost, DashboardStat, AnalyticsData } from "./dashboard.types";

export async function getDashboardPosts(): Promise<DashboardPost[]> {
  return [
    {
      title: "5 AI Trends Reshaping Marketing",
      subtitle: "Long-form thought leadership",
      platform: "LinkedIn",
      status: "Ready",
      date: "Apr 16, 2026",
    },
    {
      title: "Behind the scenes at our HQ",
      subtitle: "Story-style photo carousel",
      platform: "Instagram",
      status: "Scheduled",
      date: "Apr 17, 2026",
    },
    {
      title: "Q2 Product Update",
      subtitle: "Feature announcement post",
      platform: "Facebook",
      status: "Draft",
      date: "Apr 18, 2026",
    },
    {
      title: "How We Cut Costs by 40%",
      subtitle: "Case study article",
      platform: "Blog",
      status: "Published",
      date: "Apr 14, 2026",
    },
    {
      title: "Team Spotlight: Engineering",
      subtitle: "Culture & hiring post",
      platform: "LinkedIn",
      status: "Scheduled",
      date: "Apr 19, 2026",
    },
  ];
}

export async function getDashboardStats(): Promise<DashboardStat[]> {
  return [
    { value: "24", label: "Posts This Month", trend: "12%", direction: "up" },
    { value: "18.4K", label: "Total Reach", trend: "8.2%", direction: "up" },
    { value: "3.7%", label: "Avg. Engagement", trend: "0.4%", direction: "down" },
    { value: "6", label: "Scheduled Posts", trend: null, direction: null },
  ];
}

export async function getDashboardAnalytics(): Promise<AnalyticsData> {
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