import { FormEvent, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface BrandStudioEmptyStateProps {
  isSubmitting: boolean;
  onImport: (websiteUrl: string) => void;
}

export function BrandStudioEmptyState({ isSubmitting, onImport }: BrandStudioEmptyStateProps) {
  const theme = useTheme();
  const [websiteUrl, setWebsiteUrl] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onImport(websiteUrl.trim());
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: { xs: 3, md: 4 },
        borderColor: alpha(theme.palette.primary.main, 0.28),
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="primary.main">
            Team-level brand context
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, mb: 1 }}>
            Build your Brand Studio
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
            Import your company website to create a reusable organizational profile for future AI workflows.
            This is global team context and does not replace channel-specific branding.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            required
            type="url"
            label="Company website URL"
            placeholder="https://yourcompany.com"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || !websiteUrl.trim()}
            sx={{ minWidth: 180 }}
          >
            {isSubmitting ? "Starting..." : "Import Brand"}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          After import, review extracted fields, edit anything incorrect, then accept and save.
        </Typography>
      </Stack>
    </Paper>
  );
}
