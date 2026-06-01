import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { LayoutGrid, Plus } from "lucide-react";

interface ChannelsEmptyStateProps {
  onCreate?: () => void;
}

export function ChannelsEmptyState({ onCreate }: ChannelsEmptyStateProps) {
  const theme = useTheme();

  return (
    <Paper
      sx={{
        p: { xs: 4, md: 6 },
        textAlign: "center",
        borderStyle: "dashed",
        borderColor: alpha(theme.palette.primary.main, 0.3),
      }}
    >
      <Stack spacing={2.5} alignItems="center">
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <LayoutGrid size={26} />
        </Box>
        <Box>
          <Typography variant="h6">No channels yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 460, mx: "auto" }}>
            Channels are operational publishing workspaces. Create one per business area — Product, Recruitment,
            Education — and inside each you'll run campaigns, connect accounts and configure publishing.
          </Typography>
        </Box>
        {onCreate ? (
          <Button variant="contained" startIcon={<Plus size={16} />} onClick={onCreate}>
            Create your first channel
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}
