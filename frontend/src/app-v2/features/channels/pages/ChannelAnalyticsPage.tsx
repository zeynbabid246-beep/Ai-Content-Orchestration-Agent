import { Box, Paper, Stack, Typography } from "@mui/material";
import { BarChart3 } from "lucide-react";

export function ChannelAnalyticsPage() {
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Channel analytics
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          PERFORMANCE ACROSS CAMPAIGNS AND CONNECTED ACCOUNTS
        </Typography>
      </Box>

      <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
        <BarChart3 size={26} style={{ opacity: 0.55 }} />
        <Typography variant="h6" sx={{ mt: 1.5 }}>
          Analytics — coming soon
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 480, mx: "auto" }}>
          Channel-level analytics will roll up publication metrics from connected social accounts
          (PostPublications) into operational reports. This view stays empty until publishing data is available.
        </Typography>
      </Paper>
    </Stack>
  );
}
