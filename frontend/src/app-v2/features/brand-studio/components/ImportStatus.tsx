import { Box, Chip, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { importStatusCopy } from "../store/brandStudio.store";
import type { BrandImportJob, BrandImportStatus } from "../types/brandStudio.types";

const statusColor: Record<BrandImportStatus, "default" | "info" | "success" | "error"> = {
  queued: "default",
  processing: "info",
  completed: "success",
  failed: "error",
};

interface ImportStatusProps {
  job: BrandImportJob | null;
}

export function ImportStatus({ job }: ImportStatusProps) {
  const theme = useTheme();

  if (!job) return null;

  const copy = importStatusCopy[job.status];
  const active = job.status === "queued" || job.status === "processing";

  return (
    <Paper sx={{ p: 2.5, borderColor: alpha(theme.palette.primary.main, 0.26) }}>
      <Stack spacing={1.5}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="subtitle2">Import status</Typography>
            <Typography variant="body2" color="text.secondary">
              {copy.description}
            </Typography>
          </Box>

          <Chip size="small" color={statusColor[job.status]} label={copy.label} sx={{ alignSelf: "flex-start" }} />
        </Stack>

        {active ? <LinearProgress /> : null}

        {job.error ? (
          <Typography variant="body2" color="error.main">
            {job.error}
          </Typography>
        ) : null}

        <Typography variant="caption" color="text.secondary">
          Source: {job.websiteUrl}
        </Typography>
      </Stack>
    </Paper>
  );
}
