import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Check, ClipboardCheck, FileEdit, Save } from "lucide-react";
import { ContentStatus } from "../../content-posts/content-posts.types";
import { StatusChip } from "../../../shared/ui/StatusChip";

interface EditorialStatePanelProps {
  status: ContentStatus | null;
  isDirty: boolean;
  busy: boolean;
  onSaveDraft: () => void;
  onSubmitReview: () => void;
  onApprove: () => void;
  canSubmit: boolean;
}

export function EditorialStatePanel({
  status,
  isDirty,
  busy,
  onSaveDraft,
  onSubmitReview,
  onApprove,
  canSubmit,
}: EditorialStatePanelProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: 0.75,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(accent, 0.18),
              color: accent,
            }}
          >
            <FileEdit size={12} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600}>
            Editorial state
          </Typography>
        </Stack>
        {status ? <StatusChip status={status} /> : null}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
        Draft → Review → Approved. Approval is required before publishing.
      </Typography>

      <Stack spacing={1}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          startIcon={<Save size={14} />}
          onClick={onSaveDraft}
          disabled={busy || !canSubmit}
        >
          {status === null ? "Create as draft" : "Save draft"}
          {isDirty ? " *" : ""}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<ClipboardCheck size={14} />}
          onClick={onSubmitReview}
          disabled={busy || status === null || status === ContentStatus.Review || status === ContentStatus.Approved || status === ContentStatus.Published}
        >
          Submit for review
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="success"
          size="small"
          startIcon={<Check size={14} />}
          onClick={onApprove}
          disabled={busy || status !== ContentStatus.Review}
        >
          Approve
        </Button>
      </Stack>
    </Paper>
  );
}
