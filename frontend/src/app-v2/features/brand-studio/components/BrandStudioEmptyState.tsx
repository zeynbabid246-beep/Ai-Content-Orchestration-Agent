import { FormEvent, useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { BrandParsedProfile } from "../types/brandStudio.types";
import { emptyParsedProfile } from "../types/brandStudio.types";

type EntryMode = "import" | "manual";

interface BrandStudioEmptyStateProps {
  isSubmitting: boolean;
  onImport: (websiteUrl: string) => void;
  onCreateManual: (parsedProfile: BrandParsedProfile) => void;
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function BrandStudioEmptyState({
  isSubmitting,
  onImport,
  onCreateManual,
}: BrandStudioEmptyStateProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<EntryMode>("import");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [manualProfile, setManualProfile] = useState<BrandParsedProfile>(emptyParsedProfile());

  const canCreateManual = useMemo(() => {
    return (
      (manualProfile.brandName?.trim().length ?? 0) > 0 ||
      (manualProfile.brandSummary?.trim().length ?? 0) > 0
    );
  }, [manualProfile.brandName, manualProfile.brandSummary]);

  const handleImportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onImport(websiteUrl.trim());
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateManual) return;
    onCreateManual(manualProfile);
  };

  return (
    <Paper
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
            Import your company website or create a brand profile manually. This context feeds AI
            campaigns and Quick Generate when enabled.
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, value: EntryMode | null) => value && setMode(value)}
        >
          <ToggleButton value="import">Import from website</ToggleButton>
          <ToggleButton value="manual">Create manually</ToggleButton>
        </ToggleButtonGroup>

        {mode === "import" ? (
          <Box component="form" onSubmit={handleImportSubmit}>
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
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
              After import, review extracted fields, edit anything incorrect, then accept and save.
            </Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleManualSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Brand name"
                value={manualProfile.brandName ?? ""}
                onChange={(event) =>
                  setManualProfile((prev) => ({ ...prev, brandName: event.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Brand summary"
                value={manualProfile.brandSummary ?? ""}
                onChange={(event) =>
                  setManualProfile((prev) => ({ ...prev, brandSummary: event.target.value }))
                }
                fullWidth
                multiline
                minRows={3}
                helperText="Required if brand name is empty."
              />
              <TextField
                label="Tone of voice"
                placeholder="professional, educational"
                value={manualProfile.toneOfVoice.join(", ")}
                onChange={(event) =>
                  setManualProfile((prev) => ({ ...prev, toneOfVoice: fromCsv(event.target.value) }))
                }
                fullWidth
              />
              <TextField
                label="Target audience"
                placeholder="SMB founders, marketing leaders"
                value={manualProfile.audienceSignals.join(", ")}
                onChange={(event) =>
                  setManualProfile((prev) => ({
                    ...prev,
                    audienceSignals: fromCsv(event.target.value),
                  }))
                }
                fullWidth
              />
              <TextField
                label="Content pillars"
                placeholder="innovation, cloud, consulting"
                value={manualProfile.contentPillars.join(", ")}
                onChange={(event) =>
                  setManualProfile((prev) => ({
                    ...prev,
                    contentPillars: fromCsv(event.target.value),
                  }))
                }
                fullWidth
              />
              <TextField
                label="Website (optional)"
                type="url"
                value={manualProfile.websiteUrl ?? ""}
                onChange={(event) =>
                  setManualProfile((prev) => ({ ...prev, websiteUrl: event.target.value }))
                }
                fullWidth
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting || !canCreateManual}
                sx={{ alignSelf: "flex-start", minWidth: 180 }}
              >
                {isSubmitting ? "Creating..." : "Create brand"}
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
