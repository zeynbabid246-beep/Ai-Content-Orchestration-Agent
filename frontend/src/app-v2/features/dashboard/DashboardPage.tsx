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
  LinearProgress,
  Divider,
  Avatar,
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
import type { PostStatus, PlatformAnalytics } from "./dashboard.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<PostStatus, "success" | "info" | "default" | "secondary" | "warning"> = {
  Approved: "success",
  Review: "info",
  Scheduled: "info",
  Draft: "default",
  Published: "secondary",
  Archived: "warning",
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

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${h} ${polyline} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <polygon points={area} fill={color} fillOpacity={0.15} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 36;
  const cx = 44;
  const cy = 44;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={12}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={28} fill="#ffffff" />
    </svg>
  );
}

// ─── Platform Card ────────────────────────────────────────────────────────────

function PlatformCard({
  platform,
  weekDays,
  selected,
  onClick,
}: {
  platform: PlatformAnalytics;
  weekDays: string[];
  selected: boolean;
  onClick: () => void;
}) {
  const audienceColors = ["#2563eb", "#f59e0b"];
  const donutSegments = platform.topAudience.map((a, i) => ({
    label: a.type,
    value: a.percentage,
    color: audienceColors[i],
  }));

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 3,
        cursor: "pointer",
        border: selected ? `2px solid ${platform.color}` : "2px solid transparent",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: platform.color },
        opacity: selected ? 1 : 0.75,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.65rem",
              fontWeight: 700,
              bgcolor: platform.color,
              color: "#fff",
            }}
          >
            {PLATFORM_ICONS[platform.name]}
          </Avatar>
          <Typography variant="subtitle1" fontWeight={600}>
            {platform.name}
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={`${platform.engagement}% eng.`}
          sx={{
            bgcolor: `${platform.color}22`,
            color: platform.color,
            fontWeight: 600,
            fontSize: "0.7rem",
            borderRadius: 1,
          }}
        />
      </Stack>

      <Grid container spacing={1} mb={2}>
        {[
          { label: "Followers", value: platform.followers.toLocaleString() },
          { label: "Reach", value: platform.reach.toLocaleString() },
          { label: "Likes", value: platform.likes.toLocaleString() },
          { label: "Comments", value: platform.comments.toLocaleString() },
        ].map((m) => (
          <Grid size={{ xs: 6 }} key={m.label}>
            <Box sx={{ bgcolor: "background.default", borderRadius: 1, p: 1 }}>
              <Typography variant="h6" fontWeight={700} fontSize="1rem">
                {m.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {m.label}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box mb={1.5}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
          WEEKLY ACTIVITY
        </Typography>
        <Box mt={0.5}>
          <Sparkline data={platform.weeklyActivity} color={platform.color} />
          <Stack direction="row" justifyContent="space-between" mt={0.5}>
            {weekDays.map((d) => (
              <Typography key={d} variant="caption" color="text.disabled" fontSize="0.6rem">
                {d}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" spacing={2} alignItems="center">
        <DonutChart segments={donutSegments} />
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
            AUDIENCE TYPE
          </Typography>
          {platform.topAudience.map((a, i) => (
            <Stack key={a.type} direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: audienceColors[i] }} />
              <Typography variant="body2">
                <strong>{a.percentage}%</strong>{" "}
                <span style={{ color: "rgba(255,255,255,0.5)" }}>{a.type}</span>
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

// ─── Active Clients Panel ─────────────────────────────────────────────────────

function ActiveClientsPanel({ platform }: { platform: PlatformAnalytics }) {
  const max = platform.activeClients[0]?.interactions ?? 1;
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
        <Avatar sx={{ width: 28, height: 28, fontSize: "0.6rem", bgcolor: platform.color }}>
          {PLATFORM_ICONS[platform.name]}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Most Active on {platform.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Clients & individuals by interaction count
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        {platform.activeClients.map((client, i) => (
          <Box key={client.name}>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={0.75}>
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  bgcolor:
                    client.type === "Company"
                      ? `${platform.color}33`
                      : "rgba(167,139,250,0.2)",
                  color: client.type === "Company" ? platform.color : "#a78bfa",
                  border: `1px solid ${client.type === "Company" ? platform.color : "#a78bfa"
                    }44`,
                }}
              >
                {client.avatar}
              </Avatar>
              <Box flex={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={500}>
                    {client.name}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {client.interactions}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip
                    size="small"
                    label={client.type}
                    sx={{
                      height: 16,
                      fontSize: "0.6rem",
                      bgcolor:
                        client.type === "Company"
                          ? `${platform.color}22`
                          : "rgba(167,139,250,0.15)",
                      color: client.type === "Company" ? platform.color : "#a78bfa",
                      borderRadius: 0.5,
                    }}
                  />
                  <Typography variant="caption" color="text.disabled">
                    interactions
                  </Typography>
                </Stack>
              </Box>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(client.interactions / max) * 100}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.06)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 2,
                  bgcolor: platform.color,
                },
              }}
            />
            {i < platform.activeClients.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: analytics } = useDashboardAnalyticsQuery();
  const [selectedPlatform, setSelectedPlatform] = useState(0);

  if (!analytics) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Analytics coming soon</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Real engagement metrics will appear here once platform analytics sync is enabled.
        </Typography>
      </Paper>
    );
  }

  const platform = analytics.platforms[selectedPlatform];
  const maxFollowers = Math.max(...analytics.platforms.map((p) => p.followers));

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
          Platform Comparison
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
          FOLLOWERS · REACH · ENGAGEMENT ACROSS ALL CHANNELS
        </Typography>
        <Stack spacing={2} mt={2.5}>
          {analytics.platforms.map((p) => (
            <Box key={p.name}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: p.color }} />
                  <Typography variant="body2" fontWeight={500}>
                    {p.name}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    {p.followers.toLocaleString()} followers
                  </Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: p.color }}>
                    {p.engagement}% eng.
                  </Typography>
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(p.followers / maxFollowers) * 100}
                sx={{
                  height: 8,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)",
                  "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: p.color },
                }}
              />
            </Box>
          ))}
        </Stack>
      </Paper>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
          Deep Dive by Platform
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
          SELECT A PLATFORM TO SEE ITS MOST ACTIVE AUDIENCE
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {analytics.platforms.map((p, i) => (
          <Grid size={{ xs: 12, md: 4 }} key={p.name}>
            <PlatformCard
              platform={p}
              weekDays={analytics.weekDays}
              selected={selectedPlatform === i}
              onClick={() => setSelectedPlatform(i)}
            />
          </Grid>
        ))}
      </Grid>

      <Box>
        <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
          Who&apos;s Engaging Most
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
          TOP CLIENTS & INDIVIDUALS ACTIVE ON{" "}
          <span style={{ color: platform.color }}>{platform.name.toUpperCase()}</span>
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ActiveClientsPanel platform={platform} />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
              Audience Breakdown
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
              COMPANIES VS INDIVIDUALS
            </Typography>
            <Stack alignItems="center" justifyContent="center" spacing={3} mt={3}>
              <DonutChart
                segments={platform.topAudience.map((a, i) => ({
                  label: a.type,
                  value: a.percentage,
                  color: i === 0 ? platform.color : "#a78bfa",
                }))}
              />
              <Stack spacing={1.5} width="100%">
                {platform.topAudience.map((a, i) => (
                  <Stack key={a.type} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: i === 0 ? platform.color : "#a78bfa" }} />
                      <Typography variant="body2">{a.type}</Typography>
                    </Stack>
                    <Typography variant="body2" fontWeight={700}>
                      {a.percentage}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Box sx={{ bgcolor: "background.default", borderRadius: 2, p: 2, width: "100%", textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  DOMINANT SEGMENT
                </Typography>
                <Typography variant="h6" fontWeight={700} mt={0.5}>
                  {[...platform.topAudience].sort((a, b) => b.percentage - a.percentage)[0].type}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  makes up the majority of your {platform.name} audience
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
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