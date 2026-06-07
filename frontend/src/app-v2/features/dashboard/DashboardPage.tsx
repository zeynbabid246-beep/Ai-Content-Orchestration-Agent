import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Grid,
  Alert,
} from "@mui/material";
import { authStorage } from "../../shared/lib/storage";
import { ROUTES } from "../../shared/lib/routes";
import {
  useDashboardPostsQuery,
  useDashboardStatsQuery,
  useDashboardAnalyticsQuery,
} from "./dashboard.queries";
import { usePublishContentPost } from "../content-posts/content-posts.queries";
import { useSocialAccounts } from "../social-media/social-accounts.queries";
import { MembersHistoryPage } from "../team/membreHistory";
import { AnalyticsSummaryView } from "../analytics/components/AnalyticsSummaryView";
import type { PostStatus } from "./dashboard.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<PostStatus, "success" | "info" | "default" | "secondary" | "warning"> = {
  Scheduled: "info",
  Draft: "default",
  Published: "success",
  Deleted: "warning",
};

const PLATFORM_ICONS: Record<string, string> = {
  LinkedIn: "in",
  Instagram: "ig",
  Facebook: "fb",
  Blog: "bl",
};

const PLATFORM_COLOR: Record<string, string> = {
  LinkedIn: "#0A66C2",
  Instagram: "#E1306C",
  Facebook: "#1877F2",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Safely resolves the display username.
 * authStorage.getUsername() may return undefined or the literal string
 * "undefined" when no user is stored — guard both cases.
 */
function resolveUsername(): string {
  try {
    const raw = authStorage.getUsername?.();
    if (raw && raw !== "undefined" && raw.trim() !== "") return raw.trim();
  } catch {
    // authStorage not ready
  }
  return "there";
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: analytics, isLoading, isError } = useDashboardAnalyticsQuery();

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Loading analytics...
        </Typography>
      </Paper>
    );
  }

  if (isError || !analytics) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Analytics unavailable</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Post performance metrics will appear after content is published and synced.
        </Typography>
      </Paper>
    );
  }

  return (
    <AnalyticsSummaryView
      summary={analytics}
      subtitle="POST PERFORMANCE ACROSS YOUR TEAM (LAST 30 DAYS)"
    />
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const navigate = useNavigate();
  const { data: posts = [] } = useDashboardPostsQuery();
  const { data: stats = [] } = useDashboardStatsQuery();
  const { data: socialAccounts = [] } = useSocialAccounts();
  const publishMutation = usePublishContentPost();

  const handlePublish = (id: number) => {
    const activeAccount = socialAccounts.find((account) => account.status === "Active");
    if (!activeAccount) {
      return;
    }

    publishMutation.mutate({
      id,
      data: {
        socialAccountId: activeAccount.id,
        postVariantId: null,
        idempotencyKey: `publish-${id}-${Date.now()}`,
      },
    });
  };

  return (
    <Stack spacing={3}>
      {publishMutation.isSuccess && (
        <Alert severity="success" onClose={() => publishMutation.reset()}>
          Post published successfully!
        </Alert>
      )}
      {publishMutation.isError && (
        <Alert severity="error" onClose={() => publishMutation.reset()}>
          Failed to publish post. Make sure you have an active social account and the post is publishable.
        </Alert>
      )}
      <Grid container spacing={2}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Paper sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h4" color="primary.main">
                  {stat.value}
                </Typography>
                {stat.trend ? (
                  <Chip
                    size="small"
                    color={stat.direction === "up" ? "success" : "error"}
                    label={`${stat.direction === "up" ? "↑" : "↓"} ${stat.trend}`}
                    sx={{ borderRadius: 1 }}
                  />
                ) : null}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
                {stat.label.toUpperCase()}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Recent Content</Typography>
        <Button onClick={() => navigate(ROUTES.contentFeed)}>View all</Button>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Platform</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={`${post.title}-${post.date}`} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {post.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {post.subtitle}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: PLATFORM_COLOR[post.platform] ?? "#6b7280",
                      }}
                    />
                    <Typography variant="body2">{post.platform}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={STATUS_COLOR[post.status]}
                    label={post.status}
                    sx={{ borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{post.date}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton aria-label="Edit post" size="small">✎</IconButton>
                  <IconButton
                    aria-label="Publish post"
                    size="small"
                    onClick={() => handlePublish(post.id)}
                    disabled={post.status !== "Scheduled" || publishMutation.isPending || !socialAccounts.some((account) => account.status === "Active")}
                    title={post.status === "Scheduled" ? "Publish now" : "Only scheduled posts can be published"}
                  >
                    ➤
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Ready to create new content?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use AI to generate, schedule and publish across all platforms in seconds.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => navigate(ROUTES.generate)}>
            Generate Content
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  const username = resolveUsername();

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {getGreeting()}, {username}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          HERE&apos;S WHAT&apos;S HAPPENING WITH YOUR CONTENT TODAY
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, value: string) => setActiveTab(value)}
        textColor="primary"
        indicatorColor="primary"
      >
        {["Overview", "Analytics", "Activity"].map((tab) => (
          <Tab key={tab} label={tab} value={tab} />
        ))}
      </Tabs>

      {activeTab === "Overview" && <OverviewTab />}
      {activeTab === "Analytics" && <AnalyticsTab />}
      {activeTab === "Activity" && <MembersHistoryPage />}
    </Stack>
  );
}