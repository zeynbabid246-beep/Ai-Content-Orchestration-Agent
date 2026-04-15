import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { AppShell } from "../shared/ui/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { BrandStudioPage } from "../features/brand-studio/BrandStudioPage";
import { SchedulerPage } from "../features/scheduler/SchedulerPage";
import { GeneratePage } from "../features/generate/GeneratePage";
import { SocialMediaPage } from "../features/social-media/SocialMediaPage";
import { InviteUserPage } from "../features/team/InviteUserPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { ContentTypePage } from "../features/content-type/ContentTypePage";
import { ContentFeedPage } from "../features/content-feed/ContentFeedPage";
import { ROUTES } from "../shared/lib/routes";

export default function AppV2Router() {
  return (
    <Routes>
      {/* Router protection temporarily disabled. */}
      {/* <Route element={<PublicOnly />}> */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* </Route> */}

      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/brand-studio" element={<BrandStudioPage />} />
        <Route path="/scheduler" element={<SchedulerPage />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/social-media" element={<SocialMediaPage />} />
        <Route path="/invite-user" element={<InviteUserPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/content-type" element={<ContentTypePage />} />
        <Route path="/content-feed" element={<ContentFeedPage />} />
      </Route>
      {/* </Route> */}

      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  );
}
