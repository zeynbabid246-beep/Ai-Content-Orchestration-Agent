import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { AppShell } from "../shared/ui/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { SchedulerPage } from "../features/scheduler/SchedulerPage";
import { GeneratePage } from "../features/generate/GeneratePage";
import { InviteUserPage } from "../features/team/InviteUserPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ContentFeedPage } from "../features/content-feed/ContentFeedPage";
import { BrandStudioPage } from "../features/brand-studio/pages/BrandStudioPage";
import { ChannelsListPage } from "../features/channels/pages/ChannelsListPage";
import { ChannelWorkspaceLayout } from "../features/channels/layouts/ChannelWorkspaceLayout";
import { ChannelOverviewPage } from "../features/channels/pages/ChannelOverviewPage";
import { ChannelCampaignsPage } from "../features/channels/pages/ChannelCampaignsPage";
import { ChannelContentPage } from "../features/channels/pages/ChannelContentPage";
import { ChannelPublishingPage } from "../features/channels/pages/ChannelPublishingPage";
import { ChannelAnalyticsPage } from "../features/channels/pages/ChannelAnalyticsPage";
import { ChannelSettingsPage } from "../features/channels/pages/ChannelSettingsPage";
import { CampaignsListPage } from "../features/campaigns/pages/CampaignsListPage";
import { CampaignWorkspaceLayout } from "../features/campaigns/layouts/CampaignWorkspaceLayout";
import { CampaignOverviewPage } from "../features/campaigns/pages/CampaignOverviewPage";
import { CampaignPostsPage } from "../features/campaigns/pages/CampaignPostsPage";
import { CampaignTimelinePage } from "../features/campaigns/pages/CampaignTimelinePage";
import { CampaignAnalyticsPage } from "../features/campaigns/pages/CampaignAnalyticsPage";
import { CampaignSettingsPage } from "../features/campaigns/pages/CampaignSettingsPage";
import { PostEditorPage } from "../features/posts/pages/PostEditorPage";
import { ProtectedRoute } from "../shared/ui/protectedRoute";
import { PublicOnlyRoute } from "../shared/ui/publiconlyroute";
import { ROUTES } from "../shared/lib/routes";

export default function AppV2Router() {
  return (
    <Routes>
      {/* Public only routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={ROUTES.dashboard} replace />} />

          {/* Workspace */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/content-feed" element={<ContentFeedPage />} />
          <Route path="/scheduler" element={<SchedulerPage />} />

          {/* Operations: Channels (list + nested workspace) */}
          <Route path="/channels" element={<ChannelsListPage />} />
          <Route path="/channels/:channelId" element={<ChannelWorkspaceLayout />}>
            <Route path="overview" element={<ChannelOverviewPage />} />
            <Route path="campaigns" element={<ChannelCampaignsPage />} />
            <Route path="content" element={<ChannelContentPage />} />
            <Route path="publishing" element={<ChannelPublishingPage />} />
            <Route path="analytics" element={<ChannelAnalyticsPage />} />
            <Route path="settings" element={<ChannelSettingsPage />} />
          </Route>

          {/* Nested campaign workspace */}
          <Route
            path="/channels/:channelId/campaigns/:campaignId"
            element={<CampaignWorkspaceLayout />}
          >
            <Route path="overview" element={<CampaignOverviewPage />} />
            <Route path="posts" element={<CampaignPostsPage />} />
            <Route path="posts/new" element={<PostEditorPage />} />
            <Route path="posts/:postId" element={<PostEditorPage />} />
            <Route path="timeline" element={<CampaignTimelinePage />} />
            <Route path="analytics" element={<CampaignAnalyticsPage />} />
            <Route path="settings" element={<CampaignSettingsPage />} />
          </Route>

          {/* Cross-channel campaigns view */}
          <Route path="/campaigns" element={<CampaignsListPage />} />

          {/* Team */}
          <Route path="/brand-studio" element={<BrandStudioPage />} />
          <Route path="/invite-user" element={<InviteUserPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
