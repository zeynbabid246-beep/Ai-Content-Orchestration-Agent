import { FileText, LayoutDashboard, Settings } from "lucide-react";
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
          label: "Settings",
          to: campaignPaths.settings(channelId, campaignId),
          icon: <Settings size={14} />,
        },
      ]}
    />
  );
}
