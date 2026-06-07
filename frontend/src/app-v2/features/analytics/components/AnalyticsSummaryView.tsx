import {
  Box,
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
import type { AnalyticsSummary } from "./analytics.types";
import { PLATFORM_COLORS } from "../../social-media/platformConfig";
import { SocialPlatform } from "../../social-media/social-accounts.types";

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

function platformColor(platform: string): string {
  return PLATFORM_COLORS[platform as SocialPlatform] ?? "#64748b";
}

interface AnalyticsSummaryViewProps {
  summary: AnalyticsSummary;
  title?: string;
  subtitle?: string;
}

export function AnalyticsSummaryView({ summary, title, subtitle }: AnalyticsSummaryViewProps) {
  const maxImpressions = Math.max(...summary.byPlatform.map((p) => p.impressions), 1);
  const trendValues = summary.dailyTrend.map((d) => d.impressions);
  const hasData =
    summary.totalImpressions > 0 ||
    summary.totalClicks > 0 ||
    summary.totalShares > 0 ||
    summary.topPosts.length > 0;

  if (!hasData) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
        <Typography variant="h6">No analytics yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Publish content and wait for the hourly metrics sync to populate post performance data.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {title ? (
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      ) : null}

      <Grid container spacing={2}>
        {[
          { label: "Impressions", value: summary.totalImpressions.toLocaleString() },
          { label: "Clicks", value: summary.totalClicks.toLocaleString() },
          { label: "Shares", value: summary.totalShares.toLocaleString() },
          { label: "Avg. engagement", value: `${summary.avgEngagementRate.toFixed(1)}%` },
        ].map((kpi) => (
          <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="caption" color="text.secondary">
                {kpi.label}
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {kpi.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
              By platform
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
              IMPRESSIONS · CLICKS · ENGAGEMENT
            </Typography>
            <Stack spacing={2} mt={2.5}>
              {summary.byPlatform.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No platform breakdown available.
                </Typography>
              ) : (
                summary.byPlatform.map((platform) => {
                  const color = platformColor(platform.platform);
                  return (
                    <Box key={platform.platform}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }} />
                          <Typography variant="body2" fontWeight={500}>
                            {platform.platform}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={2}>
                          <Typography variant="caption" color="text.secondary">
                            {platform.impressions.toLocaleString()} impressions
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color }}>
                            {platform.engagementRate.toFixed(1)}% eng.
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={(platform.impressions / maxImpressions) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.06)",
                          "& .MuiLinearProgress-bar": { borderRadius: 2, bgcolor: color },
                        }}
                      />
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={600} mb={0.5}>
              Daily impressions
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
              LAST {summary.dailyTrend.length} DAYS
            </Typography>
            <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 120, mt: 2 }}>
              <Sparkline data={trendValues} color="#6366f1" />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Top performing posts
        </Typography>
        {summary.topPosts.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No published posts with metrics in this period.
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
                <TableRow key={post.publicationId}>
                  <TableCell>{post.title || `Post #${post.contentPostId}`}</TableCell>
                  <TableCell>{post.platform}</TableCell>
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
