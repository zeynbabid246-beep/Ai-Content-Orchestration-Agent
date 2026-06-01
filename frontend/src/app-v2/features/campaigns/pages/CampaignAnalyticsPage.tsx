import { Box, Paper, Stack, Typography } from "@mui/material";
import { BarChart3 } from "lucide-react";

export function CampaignAnalyticsPage() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Campaign analytics
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          PERFORMANCE OF POSTS INSIDE THIS CAMPAIGN
        </Typography>
      </Box>

      <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
        <BarChart3 size={26} style={{ opacity: 0.55 }} />
        <Typography variant="h6" sx={{ mt: 1.5 }}>
          Performance snapshot — coming soon
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 480, mx: "auto" }}>
          Aggregated metrics from PostPublications will appear here once analytics are wired up. This view
          intentionally lives in the editorial workspace; the source of truth remains the publishing layer.
        </Typography>
      </Paper>
    </Stack>
  );
}
