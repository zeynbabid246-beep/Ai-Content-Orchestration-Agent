import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BrandStudioEmptyState } from "../components/BrandStudioEmptyState";
import { ImportStatus } from "../components/ImportStatus";
import { useBrandImportJob, useBrandStudio, useStartBrandImport } from "../hooks/useBrandStudio";
import { updateBrandStudio } from "../services/brandStudio.service";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import type {
  BrandEnrichedProfile,
  BrandParsedProfile,
  TeamBrandStudio,
} from "../types/brandStudio.types";
import {
  emptyEnrichedProfile,
  emptyParsedProfile,
} from "../types/brandStudio.types";

function toCsv(values: string[] | null | undefined): string {
  return (values ?? []).join(", ");
}

function fromCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function latestJobId(brandStudio: TeamBrandStudio | null | undefined) {
  const job = brandStudio?.latestImportJob;
  return job && (job.status === "queued" || job.status === "processing") ? job.id : null;
}

function ArrayField({
  label,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <TextField
      label={label}
      helperText="Comma-separated values"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
      multiline
      minRows={2}
      InputProps={{ readOnly }}
    />
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography variant="overline" color="primary.main" sx={{ display: "block" }}>
      {children}
    </Typography>
  );
}

export function BrandStudioPage() {
  const theme = useTheme();
  const { canImportBrand } = useTeamPermissions();
  const [activeJobId, setActiveJobId] = useState<number | null>(null);
  const [reimportUrl, setReimportUrl] = useState("");
  const [parsedProfile, setParsedProfile] = useState<BrandParsedProfile>(emptyParsedProfile());
  const [enrichedProfile, setEnrichedProfile] = useState<BrandEnrichedProfile>(emptyEnrichedProfile());
  const [saving, setSaving] = useState(false);
  const brandStudioQuery = useBrandStudio();
  const importMutation = useStartBrandImport();
  const jobQuery = useBrandImportJob(activeJobId);
  const refetchBrandStudio = brandStudioQuery.refetch;

  const brandStudio = brandStudioQuery.data?.brandStudio ?? null;
  const displayedJob =
    jobQuery.data ??
    (brandStudio?.latestImportJob?.status === "completed" ? brandStudio.latestImportJob : null);
  const isImportActive = displayedJob?.status === "queued" || displayedJob?.status === "processing";

  useEffect(() => {
    const runningJobId = latestJobId(brandStudio);
    if (runningJobId) setActiveJobId(runningJobId);
  }, [brandStudio]);

  useEffect(() => {
    if (jobQuery.data?.status === "completed" || jobQuery.data?.status === "failed") {
      refetchBrandStudio();
    }
  }, [jobQuery.data?.status, refetchBrandStudio]);

  useEffect(() => {
    if (brandStudio) {
      setReimportUrl(brandStudio.parsedProfile.websiteUrl ?? "");
      setParsedProfile(brandStudio.parsedProfile);
      setEnrichedProfile(brandStudio.enrichedProfile);
    }
  }, [brandStudio]);

  const canAccept = useMemo(() => {
    return canImportBrand && !saving && (parsedProfile.websiteUrl?.trim().length ?? 0) > 0;
  }, [canImportBrand, saving, parsedProfile.websiteUrl]);

  const handleImport = (websiteUrl: string) => {
    if (!websiteUrl) return;

    importMutation.mutate(
      { websiteUrl },
      {
        onSuccess: (data) => setActiveJobId(data.job.id),
      }
    );
  };

  const updateParsed = <K extends keyof BrandParsedProfile>(key: K, value: BrandParsedProfile[K]) => {
    setParsedProfile((prev) => ({ ...prev, [key]: value }));
  };

  const updateEnriched = <K extends keyof BrandEnrichedProfile>(
    key: K,
    value: BrandEnrichedProfile[K]
  ) => {
    setEnrichedProfile((prev) => ({ ...prev, [key]: value }));
  };

  if (brandStudioQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <Skeleton height={56} width="42%" />
        <Skeleton height={260} />
        <Skeleton height={160} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Brand Studio
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Import a website and review the brand profile extracted by your local AI backend.
        </Typography>
      </Box>

      {brandStudioQuery.isError ? (
        <Alert severity="error">Unable to load Brand Studio. Please try again.</Alert>
      ) : null}

      {importMutation.isError ? (
        <Alert severity="error">{importMutation.error.message}</Alert>
      ) : null}

      {!brandStudio ? (
        <Stack spacing={3}>
          <BrandStudioEmptyState isSubmitting={importMutation.isPending} onImport={handleImport} />
          <ImportStatus job={displayedJob} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderColor: alpha(theme.palette.primary.main, 0.22) }}>
            <Stack spacing={3}>
              <SectionTitle>Step 1 — Website URL</SectionTitle>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  type="url"
                  label="Company website URL"
                  placeholder="https://yourcompany.com"
                  value={reimportUrl}
                  onChange={(event) => setReimportUrl(event.target.value)}
                  InputProps={{ readOnly: !canImportBrand || isImportActive }}
                />
                {canImportBrand ? (
                  <Button
                    variant="outlined"
                    disabled={importMutation.isPending || isImportActive || !reimportUrl.trim()}
                    onClick={() => handleImport(reimportUrl.trim())}
                    sx={{ minWidth: 140 }}
                  >
                    {importMutation.isPending || isImportActive ? "Importing..." : "Import"}
                  </Button>
                ) : null}
              </Stack>

              <Divider />

              <SectionTitle>Step 2 — Parsed profile</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Brand name"
                    value={parsedProfile.brandName ?? ""}
                    onChange={(e) => updateParsed("brandName", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Website URL"
                    value={parsedProfile.websiteUrl ?? ""}
                    onChange={(e) => updateParsed("websiteUrl", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Brand summary"
                    value={parsedProfile.brandSummary ?? ""}
                    onChange={(e) => updateParsed("brandSummary", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Slogan"
                    value={parsedProfile.slogan ?? ""}
                    onChange={(e) => updateParsed("slogan", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Email"
                    value={parsedProfile.email ?? ""}
                    onChange={(e) => updateParsed("email", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Business info"
                    value={parsedProfile.businessInfo ?? ""}
                    onChange={(e) => updateParsed("businessInfo", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Value proposition"
                    value={toCsv(parsedProfile.valueProposition)}
                    onChange={(value) => updateParsed("valueProposition", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Tone of voice"
                    value={toCsv(parsedProfile.toneOfVoice)}
                    onChange={(value) => updateParsed("toneOfVoice", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Audience signals"
                    value={toCsv(parsedProfile.audienceSignals)}
                    onChange={(value) => updateParsed("audienceSignals", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Content pillars"
                    value={toCsv(parsedProfile.contentPillars)}
                    onChange={(value) => updateParsed("contentPillars", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <ArrayField
                    label="Key messages"
                    value={toCsv(parsedProfile.keyMessages)}
                    onChange={(value) => updateParsed("keyMessages", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
              </Grid>

              <SectionTitle>Visual identity</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Logo URL"
                    value={parsedProfile.visualIdentity.logoUrl ?? ""}
                    onChange={(e) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, logoUrl: e.target.value },
                      }))
                    }
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Favicon URL"
                    value={parsedProfile.visualIdentity.faviconUrl ?? ""}
                    onChange={(e) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, faviconUrl: e.target.value },
                      }))
                    }
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Visual style"
                    value={parsedProfile.visualIdentity.visualStyle ?? ""}
                    onChange={(e) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, visualStyle: e.target.value },
                      }))
                    }
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Hero text"
                    value={parsedProfile.visualIdentity.heroText ?? ""}
                    onChange={(e) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, heroText: e.target.value },
                      }))
                    }
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ height: "100%" }}>
                    {parsedProfile.visualIdentity.hasLogo ? <Chip size="small" label="Has logo" /> : null}
                    {parsedProfile.visualIdentity.hasImages ? (
                      <Chip size="small" label="Has images" />
                    ) : null}
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Primary colors"
                    value={toCsv(parsedProfile.visualIdentity.primaryColors)}
                    onChange={(value) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, primaryColors: fromCsv(value) },
                      }))
                    }
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Secondary colors"
                    value={toCsv(parsedProfile.visualIdentity.secondaryColors)}
                    onChange={(value) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, secondaryColors: fromCsv(value) },
                      }))
                    }
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Font families"
                    value={toCsv(parsedProfile.visualIdentity.fontFamilies)}
                    onChange={(value) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, fontFamilies: fromCsv(value) },
                      }))
                    }
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="CTA texts"
                    value={toCsv(parsedProfile.visualIdentity.ctaTexts)}
                    onChange={(value) =>
                      setParsedProfile((prev) => ({
                        ...prev,
                        visualIdentity: { ...prev.visualIdentity, ctaTexts: fromCsv(value) },
                      }))
                    }
                    readOnly={!canImportBrand}
                  />
                </Grid>
              </Grid>

              <Divider />

              <SectionTitle>Enriched profile</SectionTitle>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Brand archetype"
                    value={enrichedProfile.brandArchetype ?? ""}
                    onChange={(e) => updateEnriched("brandArchetype", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Positioning statement"
                    value={enrichedProfile.positioningStatement ?? ""}
                    onChange={(e) => updateEnriched("positioningStatement", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Brand personality"
                    value={toCsv(enrichedProfile.brandPersonality)}
                    onChange={(value) => updateEnriched("brandPersonality", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Messaging priorities"
                    value={toCsv(enrichedProfile.messagingPriorities)}
                    onChange={(value) => updateEnriched("messagingPriorities", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Voice guidelines — do"
                    value={toCsv(enrichedProfile.voiceGuidelines.do)}
                    onChange={(value) =>
                      setEnrichedProfile((prev) => ({
                        ...prev,
                        voiceGuidelines: { ...prev.voiceGuidelines, do: fromCsv(value) },
                      }))
                    }
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="Voice guidelines — don't"
                    value={toCsv(enrichedProfile.voiceGuidelines.dont)}
                    onChange={(value) =>
                      setEnrichedProfile((prev) => ({
                        ...prev,
                        voiceGuidelines: { ...prev.voiceGuidelines, dont: fromCsv(value) },
                      }))
                    }
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Visual direction notes"
                    value={enrichedProfile.visualDirectionNotes ?? ""}
                    onChange={(e) => updateEnriched("visualDirectionNotes", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="LinkedIn voice"
                    value={enrichedProfile.linkedInVoice ?? ""}
                    onChange={(e) => updateEnriched("linkedInVoice", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Ad copy style"
                    value={enrichedProfile.adCopyStyle ?? ""}
                    onChange={(e) => updateEnriched("adCopyStyle", e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
              </Grid>

              {canImportBrand ? (
                <Button
                  variant="contained"
                  disabled={!canAccept}
                  onClick={() => {
                    void (async () => {
                      setSaving(true);
                      try {
                        await updateBrandStudio({
                          parsedProfile,
                          enrichedProfile,
                        });
                        await refetchBrandStudio();
                      } finally {
                        setSaving(false);
                      }
                    })();
                  }}
                >
                  {saving ? "Saving..." : "Accept & Save"}
                </Button>
              ) : null}
            </Stack>
          </Paper>

          <ImportStatus job={displayedJob} />
        </Stack>
      )}
    </Stack>
  );
}
