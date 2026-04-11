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

const POSTS = [
  { title: "App Security Strategy", sub: "LinkedIn · 5 min read", platform: "LinkedIn", status: "Ready", date: "Mar 1" },
  { title: "Deployment Workflow", sub: "Blog · 7 min read", platform: "Blog", status: "Scheduled", date: "Mar 3" },
  { title: "UX Dashboard Redesign", sub: "Instagram · Visual", platform: "Instagram", status: "Draft", date: "Feb 28" },
  { title: "API Performance Deep Dive", sub: "Facebook · 9 min read", platform: "Facebook", status: "Published", date: "Feb 25" },
  { title: "Q2 Product Launch", sub: "LinkedIn · Campaign", platform: "LinkedIn", status: "Scheduled", date: "Apr 2" },
] as const;

const STATS = [
  { val: "142", label: "Content Published", trend: "+12%", dir: "up" },
  { val: "8", label: "Active Campaigns", trend: "+3", dir: "up" },
  { val: "24", label: "Team Members", trend: null, dir: null },
  { val: "91k", label: "AI Tokens Used", trend: "67%", dir: "up" },
] as const;

const STATUS_COLOR = {
  Ready: "success",
  Scheduled: "info",
  Draft: "default",
  Published: "secondary",
} as const;

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");
  const username = authStorage.getUsername() ?? "there";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" sx={{mb: 0.5 }}>
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
        {STATS.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Paper sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography variant="h4" color="primary.main" >
                  {stat.val}
                </Typography>
                {stat.trend ? (
                  <Chip
                    size="small"
                    color={stat.dir === "up" ? "success" : "error"}
                    label={`${stat.dir === "up" ? "↑" : "↓"} ${stat.trend}`}
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
        <Typography variant="h6" >
          Recent Content
        </Typography>
        <Button onClick={() => navigate("/content-feed")}>View all</Button>
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
            {POSTS.map((post) => (
              <TableRow key={`${post.title}-${post.date}`} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{post.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{post.sub}</Typography>
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
            <Typography variant="h6" sx={{mb: 0.5 }}>
              Ready to create new content?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use AI to generate, schedule and publish across all platforms in seconds.
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => navigate("/generate")}>Generate Content</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
