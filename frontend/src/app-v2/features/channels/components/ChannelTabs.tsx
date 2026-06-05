import { FileText, LayoutDashboard, Megaphone, Radio, Settings } from "lucide-react";
import { WorkspaceTabs } from "../../../shared/ui/WorkspaceTabs";
import { channelPaths } from "../../../shared/lib/routes";

interface ChannelTabsProps {
  channelId: number;
}

export function ChannelTabs({ channelId }: ChannelTabsProps) {
  return (
    <WorkspaceTabs
      items={[
        {
          label: "Overview",
          to: channelPaths.overview(channelId),
          icon: <LayoutDashboard size={14} />,
        },
        {
          label: "Campaigns",
          to: channelPaths.campaigns(channelId),
          icon: <Megaphone size={14} />,
          matchPrefix: true,
        },
        {
          label: "Content",
          to: channelPaths.content(channelId),
          icon: <FileText size={14} />,
        },
        {
          label: "Publishing",
          to: channelPaths.publishing(channelId),
          icon: <Radio size={14} />,
        },
        {
          label: "Settings",
          to: channelPaths.settings(channelId),
          icon: <Settings size={14} />,
        },
      ]}
    />
  );
}
