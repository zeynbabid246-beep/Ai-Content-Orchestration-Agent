import { BarChart3, CalendarRange, FileText, LayoutDashboard, Settings } from "lucide-react";
import { WorkspaceTabs } from "../../../shared/ui/WorkspaceTabs";
import { campaignPaths } from "../../../shared/lib/routes";

interface CampaignTabsProps {
  channelId: number;
  campaignId: number;
}

export function CampaignTabs({ channelId, campaignId }: CampaignTabsProps) {
  return (
    <WorkspaceTabs
      items={[
        {
          label: "Overview",
          to: campaignPaths.overview(channelId, campaignId),
          icon: <LayoutDashboard size={14} />,
        },
        {
          label: "Posts",
          to: campaignPaths.posts(channelId, campaignId),
          icon: <FileText size={14} />,
          matchPrefix: true,
        },
        {
          label: "Timeline",
          to: campaignPaths.timeline(channelId, campaignId),
          icon: <CalendarRange size={14} />,
        },
        {
          label: "Analytics",
          to: campaignPaths.analytics(channelId, campaignId),
          icon: <BarChart3 size={14} />,
        },
        {
          label: "Settings",
          to: campaignPaths.settings(channelId, campaignId),
          icon: <Settings size={14} />,
        },
      ]}
    />
  );
}
