import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { FileEdit, Sparkles } from "lucide-react";

interface CampaignWelcomeDialogProps {
  open: boolean;
  campaignName: string;
  onManual: () => void;
  onClose: () => void;
}

export function CampaignWelcomeDialog({
  open,
  campaignName,
  onManual,
  onClose,
}: CampaignWelcomeDialogProps) {
  const theme = useTheme();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Campaign created</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>{campaignName}</strong> is ready. How do you want to add content?
        </Typography>

        <Stack spacing={1.5}>
          <Box
            component="button"
            type="button"
            onClick={onManual}
            sx={{
              textAlign: "left",
              width: "100%",
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.4),
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              cursor: "pointer",
              "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: "primary.main",
                }}
              >
                <FileEdit size={20} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Create posts yourself
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Write drafts, adapt per platform, and publish to all linked accounts.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Tooltip title="Coming soon — bulk AI planning for this campaign">
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                opacity: 0.55,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.text.primary, 0.06),
                    color: "text.secondary",
                  }}
                >
                  <Sparkles size={20} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Plan with AI
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Coming soon — generate a full campaign plan and posts in one flow.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Tooltip>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Skip
        </Button>
        <Button variant="contained" onClick={onManual}>
          Create posts yourself
        </Button>
      </DialogActions>
    </Dialog>
  );
}
