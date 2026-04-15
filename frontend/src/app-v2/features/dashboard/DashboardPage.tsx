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
} from "@mui/material";
import { authStorage } from "../../shared/lib/storage";
import { ROUTES } from "../../shared/lib/routes";
import { useDashboardPostsQuery, useDashboardStatsQuery } from "./dashboard.queries";
import type { PostStatus } from "./dashboard.types";

const STATUS_COLOR: Record<PostStatus, "success" | "info" | "default" | "secondary"> = {
  Ready: "success",
  Scheduled: "info",
  Draft: "default",
  Published: "secondary",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const username = authStorage.getUsername() ?? "there";
  const { data: posts = [] } = useDashboardPostsQuery();
  const { data: stats = [] } = useDashboardStatsQuery();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          {greeting()}, {username}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          HERE&apos;S WHAT&apos;S HAPPENING WITH YOUR CONTENT TODAY
        </Typography>
      </Box>

      <Tabs value={activeTab} onChange={(_, value: string) => setActiveTab(value)} textColor="primary" indicatorColor="primary">
        {["Overview", "Analytics", "Activity"].map((tab) => <Tab key={tab} label={tab} value={tab} />)}
      </Tabs>

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
        <Typography variant="h6">
          Recent Content
        </Typography>
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
                  <Typography variant="body2" fontWeight={500}>{post.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{post.subtitle}</Typography>
                </TableCell>
                <TableCell>{post.platform}</TableCell>
                <TableCell>
                  <Chip size="small" color={STATUS_COLOR[post.status]} label={post.status} sx={{ borderRadius: 1 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{post.date}</Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton aria-label="Edit post" size="small">✎</IconButton>
                  <IconButton aria-label="Publish post" size="small">➤</IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: 3, bgcolor: "background.paper" }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Ready to create new content?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use AI to generate, schedule and publish across all platforms in seconds.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => navigate(ROUTES.generate)}>Generate Content</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
