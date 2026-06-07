import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { ForgotPasswordPage } from "../features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../features/auth/ResetPasswordPage";
import { AcceptInvitePage } from "../features/auth/AcceptInvitePage";
import { AppShell } from "../shared/ui/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { CalendarPage } from "../features/calendar/CalendarPage";
import { GeneratePage } from "../features/generate/GeneratePage";
import { TeamPage } from "../features/team/TeamPage";
import { AdminRoute } from "../shared/ui/AdminRoute";
import { EditorRoute } from "../shared/ui/EditorRoute";
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
import { CampaignAiPlanPage } from "../features/campaigns/pages/CampaignAiPlanPage";
import { SocialAccountsPage } from "../features/integrations/pages/SocialAccountsPage";
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Protected app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={ROUTES.dashboard} replace />} />

          {/* Workspace */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<EditorRoute />}>
            <Route path="/generate" element={<GeneratePage />} />
          </Route>
          <Route path="/content-feed" element={<ContentFeedPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/scheduler" element={<Navigate to={ROUTES.calendar} replace />} />

          {/* Operations: Channels (list + nested workspace) */}
          <Route path="/channels" element={<ChannelsListPage />} />
          <Route path="/channels/:channelId" element={<ChannelWorkspaceLayout />}>
            <Route path="overview" element={<ChannelOverviewPage />} />
            <Route path="campaigns" element={<ChannelCampaignsPage />} />
            <Route path="content" element={<ChannelContentPage />} />
            <Route path="posts/new" element={<PostEditorPage />} />
            <Route path="posts/:postId" element={<PostEditorPage />} />
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
          <Route
            path="/channels/:channelId/campaigns/:campaignId/ai-plan"
            element={<CampaignAiPlanPage />}
          />

          {/* Cross-channel campaigns view */}
          <Route path="/campaigns" element={<CampaignsListPage />} />

          {/* Integrations */}
          <Route path="/integrations/social-accounts" element={<SocialAccountsPage />} />

          {/* Team */}
          <Route path="/brand-studio" element={<BrandStudioPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/invite-user" element={<TeamPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
