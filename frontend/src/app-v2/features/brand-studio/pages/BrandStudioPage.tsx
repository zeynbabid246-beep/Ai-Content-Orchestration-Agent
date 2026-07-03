import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { CloudUpload, Plus, X } from "lucide-react";
import { BrandStudioEmptyState } from "../components/BrandStudioEmptyState";
import { ImportStatus } from "../components/ImportStatus";
import {
  useBrandImportJob,
  useBrandStudio,
  useCreateManualBrandStudio,
  useStartBrandImport,
} from "../hooks/useBrandStudio";
import { updateBrandStudio } from "../services/brandStudio.service";
import { formatAiError, syncBrandToAi } from "../../ai/ai.api";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { uploadGenerateImage } from "../../generate/media.api";
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

function ColorPaletteField({
  label,
  colors,
  onChange,
  readOnly,
}: {
  label: string;
  colors: string[];
  onChange: (colors: string[]) => void;
  readOnly?: boolean;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (!colors.includes(hex)) onChange([...colors, hex]);
  };

  const handleRemove = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: "block", mb: 1 }}>
        {label}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          minHeight: 58,
          alignItems: "center",
          bgcolor: "background.default",
        }}
      >
        {colors.map((color, i) => (
          <Tooltip key={i} title={color} placement="top">
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  bgcolor: color,
                  border: "2px solid",
                  borderColor: "divider",
                  boxShadow: `0 2px 6px ${alpha(color || "#000", 0.4)}`,
                  flexShrink: 0,
                }}
              />
              {!readOnly && (
                <IconButton
                  size="small"
                  onClick={() => handleRemove(i)}
                  sx={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 16,
                    height: 16,
                    minWidth: 16,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    p: 0,
                    "&:hover": {
                      bgcolor: "error.main",
                      color: "white",
                      borderColor: "error.main",
                    },
                  }}
                >
                  <X size={8} />
                </IconButton>
              )}
            </Box>
          </Tooltip>
        ))}

        {!readOnly && (
          <Tooltip title="Add color">
            <Box
              onClick={() => pickerRef.current?.click()}
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "2px dashed",
                borderColor: alpha(theme.palette.primary.main, 0.4),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "primary.main",
                transition: "all 0.15s",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              <Plus size={16} />
              <input
                ref={pickerRef}
                type="color"
                defaultValue="#2563eb"
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: 0,
                  height: 0,
                  pointerEvents: "none",
                }}
                onChange={handlePickerChange}
              />
            </Box>
          </Tooltip>
        )}

        {colors.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ pl: 0.5 }}>
            {readOnly ? "No colors defined" : "Click + to pick colors"}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function LogoDropZone({
  label,
  hint,
  value,
  onChange,
  readOnly,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string) => void;
  readOnly?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const handleFile = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const result = await uploadGenerateImage(file);
      onChange(result.url);
    } catch {
      setUploadError("Upload failed. Try pasting a URL below.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (readOnly || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>
        {label}
      </Typography>

      {/* Drop zone */}
      <Box
        onClick={() => !readOnly && !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!readOnly) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        sx={{
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : alpha(theme.palette.divider, 0.8),
          borderRadius: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          cursor: readOnly ? "default" : "pointer",
          bgcolor: isDragging
            ? alpha(theme.palette.primary.main, 0.04)
            : "background.default",
          transition: "all 0.15s ease",
          minHeight: 90,
          "&:hover": readOnly
            ? {}
            : {
                borderColor: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
        }}
      >
        {uploading ? (
          <CircularProgress size={24} />
        ) : value ? (
          <Box
            component="img"
            src={value}
            alt={label}
            sx={{
              maxHeight: 56,
              maxWidth: "100%",
              objectFit: "contain",
              borderRadius: 1,
            }}
          />
        ) : (
          <>
            <CloudUpload
              size={28}
              color={isDragging ? theme.palette.primary.main : theme.palette.text.disabled}
            />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Drag and drop file here
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {hint ?? "Limit 10MB · PNG, JPG, JPEG, WEBP"}
            </Typography>
          </>
        )}
      </Box>

      {/* Actions row */}
      <Stack direction="row" spacing={1} alignItems="center">
        {!readOnly && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{ borderRadius: 1.5 }}
          >
            Browse files
          </Button>
        )}
        {value && !readOnly && (
          <Button
            size="small"
            color="error"
            onClick={() => onChange("")}
            disabled={uploading}
            sx={{ borderRadius: 1.5 }}
          >
            Remove
          </Button>
        )}
      </Stack>

      {/* URL fallback */}
      <TextField
        size="small"
        label="Or paste URL"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        fullWidth
        InputProps={{ readOnly }}
        placeholder="https://example.com/logo.png"
      />

      {uploadError && (
        <Typography variant="caption" color="error.main">
          {uploadError}
        </Typography>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </Stack>
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
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const brandStudioQuery = useBrandStudio();
  const importMutation = useStartBrandImport();
  const manualCreateMutation = useCreateManualBrandStudio();
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
    const hasIdentity =
      (parsedProfile.brandName?.trim().length ?? 0) > 0 ||
      (parsedProfile.brandSummary?.trim().length ?? 0) > 0;
    return canImportBrand && !saving && hasIdentity;
  }, [canImportBrand, saving, parsedProfile.brandName, parsedProfile.brandSummary]);

  const handleImport = (websiteUrl: string) => {
    if (!websiteUrl) return;
    importMutation.mutate(
      { websiteUrl },
      { onSuccess: (data) => setActiveJobId(data.job.id) }
    );
  };

  const handleCreateManual = (profile: BrandParsedProfile) => {
    manualCreateMutation.mutate(
      { parsedProfile: profile },
      {
        onSuccess: async (created) => {
          setParsedProfile(created.parsedProfile);
          setEnrichedProfile(created.enrichedProfile);
          try {
            await syncBrandToAi();
            setSyncMessage("Brand profile created and synced to the AI service.");
          } catch (syncErr) {
            setSyncMessage(formatAiError(syncErr));
          }
        },
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

  const updateVisual = <K extends keyof BrandParsedProfile["visualIdentity"]>(
    key: K,
    value: BrandParsedProfile["visualIdentity"][K]
  ) => {
    setParsedProfile((prev) => ({
      ...prev,
      visualIdentity: { ...prev.visualIdentity, [key]: value },
    }));
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
          Brand DNA
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Import a website or create a brand profile manually. AI campaigns and Quick Generate can
          use this context when enabled.
        </Typography>
      </Box>

      {brandStudioQuery.isError ? (
        <Alert severity="error">Unable to load Brand Studio. Please try again.</Alert>
      ) : null}
      {importMutation.isError ? (
        <Alert severity="error">{importMutation.error.message}</Alert>
      ) : null}
      {manualCreateMutation.isError ? (
        <Alert severity="error">{manualCreateMutation.error.message}</Alert>
      ) : null}

      {!brandStudio ? (
        <Stack spacing={3}>
          <BrandStudioEmptyState
            isSubmitting={importMutation.isPending || manualCreateMutation.isPending}
            onImport={handleImport}
            onCreateManual={handleCreateManual}
          />
          <ImportStatus job={displayedJob} />
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderColor: alpha(theme.palette.primary.main, 0.22) }}>
            <Stack spacing={3}>
              {/* ── Step 1: Website URL ── */}
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

              {/* ── Step 2: Parsed profile ── */}
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

              {/* ── Visual Identity ── */}
              <SectionTitle>Visual identity</SectionTitle>
              <Grid container spacing={2}>
                {/* Logo upload zones */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <LogoDropZone
                    label="Primary logo"
                    hint="Limit 10MB · PNG, JPG, JPEG, WEBP"
                    value={parsedProfile.visualIdentity.logoUrl}
                    onChange={(url) => updateVisual("logoUrl", url || null)}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <LogoDropZone
                    label="Favicon / secondary"
                    hint="Limit 10MB · PNG, JPG, ICO, SVG, JPEG"
                    value={parsedProfile.visualIdentity.faviconUrl}
                    onChange={(url) => updateVisual("faviconUrl", url || null)}
                    readOnly={!canImportBrand}
                  />
                </Grid>

                {/* Color palettes */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <ColorPaletteField
                    label="Primary colors"
                    colors={parsedProfile.visualIdentity.primaryColors}
                    onChange={(c) => updateVisual("primaryColors", c)}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ColorPaletteField
                    label="Secondary colors"
                    colors={parsedProfile.visualIdentity.secondaryColors}
                    onChange={(c) => updateVisual("secondaryColors", c)}
                    readOnly={!canImportBrand}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Visual style"
                    value={parsedProfile.visualIdentity.visualStyle ?? ""}
                    onChange={(e) => updateVisual("visualStyle", e.target.value)}
                    fullWidth
                    InputProps={{ readOnly: !canImportBrand }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Hero text"
                    value={parsedProfile.visualIdentity.heroText ?? ""}
                    onChange={(e) => updateVisual("heroText", e.target.value)}
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
                    label="Font families"
                    value={toCsv(parsedProfile.visualIdentity.fontFamilies)}
                    onChange={(value) => updateVisual("fontFamilies", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <ArrayField
                    label="CTA texts"
                    value={toCsv(parsedProfile.visualIdentity.ctaTexts)}
                    onChange={(value) => updateVisual("ctaTexts", fromCsv(value))}
                    readOnly={!canImportBrand}
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* ── Enriched profile ── */}
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

              {syncMessage ? (
                <Alert
                  severity={syncMessage.includes("synced") ? "success" : "warning"}
                  onClose={() => setSyncMessage(null)}
                >
                  {syncMessage}
                </Alert>
              ) : null}

              {canImportBrand ? (
                <Button
                  variant="contained"
                  disabled={!canAccept}
                  onClick={() => {
                    void (async () => {
                      setSaving(true);
                      try {
                        await updateBrandStudio({ parsedProfile, enrichedProfile });
                        await refetchBrandStudio();
                        try {
                          await syncBrandToAi();
                          setSyncMessage("Brand profile saved and synced to the AI service.");
                        } catch (syncErr) {
                          setSyncMessage(formatAiError(syncErr));
                        }
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
