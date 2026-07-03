import {
  Box,
  Chip,
  CircularProgress,
  Collapse,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { AnalyticsSummary } from "../analytics.types";
import { usePlatformAnalyticsPosts } from "../analytics.queries";
import { PLATFORM_COLORS } from "../../social-media/platformConfig";
import { SocialPlatform } from "../../social-media/social-accounts.types";

const SUPPORTED_PLATFORMS: { platform: SocialPlatform; label: string }[] = [
  { platform: SocialPlatform.LinkedIn, label: "LinkedIn" },
  { platform: SocialPlatform.Instagram, label: "Instagram" },
  { platform: SocialPlatform.Facebook, label: "Facebook" },
  { platform: SocialPlatform.Threads, label: "Threads" },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 160;
  const h = 48;
  const pts = data.map((v, i) => {
    const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `0,${h} ${polyline} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={area} fill={color} fillOpacity={0.15} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function pColor(platform: string): string {
  return PLATFORM_COLORS[platform as SocialPlatform] ?? "#64748b";
}

function PlatformPostsPanel({ platform, color }: { platform: string; color: string }) {
  const { data: posts = [], isLoading } = usePlatformAnalyticsPosts(platform, 30);

  return (
    <Box sx={{ mt: 1.5, mb: 0.5 }}>
      {isLoading ? (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={22} sx={{ color }} />
        </Stack>
      ) : posts.length === 0 ? (
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5, fontStyle: "italic" }}>
          No published posts with analytics on {platform} yet.
        </Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5, fontSize: 11 }}>Post</TableCell>
              <TableCell align="right" sx={{ py: 0.5, fontSize: 11 }}>Impressions</TableCell>
              <TableCell align="right" sx={{ py: 0.5, fontSize: 11 }}>Clicks</TableCell>
              <TableCell align="right" sx={{ py: 0.5, fontSize: 11 }}>Engagement</TableCell>
              <TableCell align="right" sx={{ py: 0.5, fontSize: 11 }}>Published</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.publicationId} hover>
                <TableCell sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title || `Post #${post.contentPostId}`}
                </TableCell>
                <TableCell align="right">{post.impressions.toLocaleString()}</TableCell>
                <TableCell align="right">{post.clicks.toLocaleString()}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={`${post.engagementRate.toFixed(1)}%`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 11,
                      bgcolor: alpha(color, 0.12),
                      color,
                    }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ fontSize: 11, color: "text.secondary" }}>
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

interface AnalyticsSummaryViewProps {
  summary: AnalyticsSummary;
  title?: string;
  subtitle?: string;
}

export function AnalyticsSummaryView({ summary, title, subtitle }: AnalyticsSummaryViewProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const maxImpressions = Math.max(...summary.byPlatform.map((p) => p.impressions), 1);
  const trendValues = summary.dailyTrend.map((d) => d.impressions);
  const hasData =
    summary.totalImpressions > 0 ||
    summary.totalClicks > 0 ||
    summary.totalShares > 0 ||
    summary.topPosts.length > 0;

  const platformRows = SUPPORTED_PLATFORMS.map(({ platform, label }) => {
    const real = summary.byPlatform.find(
      (p) => p.platform.toLowerCase() === platform.toLowerCase()
    );
    return {
      platform,
      label,
      impressions: real?.impressions ?? 0,
      clicks: real?.clicks ?? 0,
      shares: real?.shares ?? 0,
      engagementRate: real?.engagementRate ?? 0,
    };
  });

  const togglePlatform = (platform: string) =>
    setExpandedPlatform((prev) => (prev === platform ? null : platform));

  return (
    <Stack spacing={3}>
      {title ? (
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>{title}</Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      {/* KPI cards */}
      <Grid container spacing={2}>
        {[
          { label: "Impressions", value: summary.totalImpressions.toLocaleString() },
          { label: "Clicks", value: summary.totalClicks.toLocaleString() },
          { label: "Shares", value: summary.totalShares.toLocaleString() },
          { label: "Avg. engagement", value: `${summary.avgEngagementRate.toFixed(1)}%` },
        ].map((kpi) => (
          <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{kpi.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Platform breakdown + sparkline */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>By platform</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
              CLICK A PLATFORM TO SEE ITS POSTS
            </Typography>
            {!hasData && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}>
                No data yet — metrics appear after your first successful publish.
              </Typography>
            )}
            <Stack spacing={0} mt={2}>
              {platformRows.map((p) => {
                const color = pColor(p.platform);
                const isExpanded = expandedPlatform === p.platform;
                const barValue = maxImpressions > 1 ? (p.impressions / maxImpressions) * 100 : 0;
                return (
                  <Box key={p.platform}>
                    <Box
                      onClick={() => togglePlatform(p.platform)}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 1,
                        px: 1,
                        py: 1.25,
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: "action.hover" },
                        bgcolor: isExpanded ? alpha(color, 0.06) : "transparent",
                        border: isExpanded ? `1px solid ${alpha(color, 0.25)}` : "1px solid transparent",
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.75}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
                          <Typography variant="body2" fontWeight={500}>{p.label}</Typography>
                          {p.impressions === 0 && (
                            <Chip label="pending" size="small" sx={{ height: 16, fontSize: 10, opacity: 0.5 }} />
                          )}
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {p.impressions.toLocaleString()} impressions
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color }}>
                            {p.engagementRate.toFixed(1)}% eng.
                          </Typography>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={barValue}
                        sx={{
                          height: 7,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.06)",
                          "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: color },
                        }}
                      />
                    </Box>

                    {/* Per-platform post drill-down */}
                    <Collapse in={isExpanded} unmountOnExit>
                      <Box
                        sx={{
                          ml: 1,
                          mr: 1,
                          mb: 1,
                          borderLeft: `3px solid ${alpha(color, 0.4)}`,
                          pl: 1.5,
                        }}
                      >
                        <PlatformPostsPanel platform={p.platform} color={color} />
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>Daily impressions</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
              {summary.dailyTrend.length > 0 ? `LAST ${summary.dailyTrend.length} DAYS` : "NO DATA YET"}
            </Typography>
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 120, mt: 2 }}>
              {trendValues.length > 0 ? (
                <Sparkline data={trendValues} color="#6366f1" />
              ) : (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Trend data will appear here after publishing.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Top posts overall */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>Top performing posts</Typography>
        {summary.topPosts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No published posts with metrics yet. Publish content and wait for the hourly analytics sync.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Post</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell align="right">Impressions</TableCell>
                <TableCell align="right">Clicks</TableCell>
                <TableCell align="right">Engagement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary.topPosts.map((post) => (
                <TableRow key={post.publicationId} hover>
                  <TableCell>{post.title || `Post #${post.contentPostId}`}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: pColor(post.platform) }} />
                      {post.platform}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{post.impressions.toLocaleString()}</TableCell>
                  <TableCell align="right">{post.clicks.toLocaleString()}</TableCell>
                  <TableCell align="right">{post.engagementRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
