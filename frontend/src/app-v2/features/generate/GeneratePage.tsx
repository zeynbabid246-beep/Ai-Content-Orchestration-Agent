import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { FileEdit, Sparkles } from "lucide-react";
import { useBrandStudio } from "../brand-studio/hooks/useBrandStudio";
import { useSocialAccounts } from "../social-media/social-accounts.queries";
import { getSocialAuthLoginUrl } from "../social-media/social-auth.api";
import { ContentStatus, SocialPlatform } from "../content-posts/content-posts.types";
import type { SocialAccount } from "../social-media/social-accounts.types";
import {
  createContentPost,
  publishContentPost,
  scheduleContentPost,
  transitionContentPostStatus,
} from "../content-posts/content-posts.api";
import { PostVariantPreview } from "./components/PostVariantPreview";
import { PublishDestinationsPanel } from "./components/PublishDestinationsPanel";
import { WorkflowStepHeader } from "./components/WorkflowStepHeader";
import {
  createInitialVariants,
  QUICK_VARIANT_DEFINITIONS,
  type ComposeMode,
  type QuickVariantDraft,
  type QuickVariantKey,
} from "./generate.types";
import { uploadGenerateImage } from "./media.api";
import {
  csvToSlides,
  defaultContentType,
  findVariantForPlatform,
  getVariantDefinition,
  parseAiContent,
  slidesToCsv,
  toContentPostVariants,
  variantHasContent,
} from "./utils/variantHelpers";

const LANGUAGES = ["English", "French", "Arabic"];
const WORKFLOW_STEPS = ["Brief", "Content", "Publish"];

export function GeneratePage() {
  const theme = useTheme();
  const { data: brandStudioSnapshot } = useBrandStudio();
  const { data: socialAccounts = [], refetch: refetchSocialAccounts } = useSocialAccounts();

  const brandStudio = brandStudioSnapshot?.brandStudio ?? null;
  const hasBrand = Boolean(brandStudio?.parsedProfile.brandName || brandStudio?.parsedProfile.brandSummary);

  const [activeStep, setActiveStep] = useState(0);
  const [composeMode, setComposeMode] = useState<ComposeMode>("ai");
  const [useBrandContext, setUseBrandContext] = useState(true);
  const [brief, setBrief] = useState("");
  const [language, setLanguage] = useState("English");
  const [variants, setVariants] = useState<QuickVariantDraft[]>(() => createInitialVariants());
  const [activeVariantKey, setActiveVariantKey] = useState<QuickVariantKey>("linkedin-post");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");

  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState<{
    severity: "success" | "error" | "info" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const activeSocialAccounts = useMemo(
    () => socialAccounts.filter((account) => account.status === "Active"),
    [socialAccounts]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("socialAuthStatus");
    if (!status) return;

    const platform = params.get("platform") ?? "Social account";
    const authError = params.get("socialAuthError");
    if (status === "success") {
      setActionMessage({ severity: "success", text: `${platform} connected successfully.` });
      void refetchSocialAccounts();
      setActiveStep(2);
    } else {
      setActionMessage({ severity: "error", text: authError ?? "Failed to connect social account." });
    }

    params.delete("socialAuthStatus");
    params.delete("platform");
    params.delete("socialAuthError");
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [refetchSocialAccounts]);

  const enabledVariants = useMemo(() => variants.filter((variant) => variant.enabled), [variants]);
  const activeVariant = variants.find((variant) => variant.key === activeVariantKey) ?? variants[0];
  const activeDefinition = getVariantDefinition(activeVariant.key);

  const enabledPlatforms = useMemo(
    () => new Set(enabledVariants.map((variant) => getVariantDefinition(variant.key).platform)),
    [enabledVariants]
  );

  useEffect(() => {
    if (activeSocialAccounts.length === 0) return;
    setSelectedAccountIds((current) => {
      const next = new Set(current);
      for (const account of activeSocialAccounts) {
        if (enabledPlatforms.has(account.platform)) {
          next.add(account.id);
        }
      }
      return Array.from(next);
    });
  }, [enabledPlatforms, activeSocialAccounts]);

  useEffect(() => {
    if (!enabledVariants.some((variant) => variant.key === activeVariantKey) && enabledVariants[0]) {
      setActiveVariantKey(enabledVariants[0].key);
    }
  }, [enabledVariants, activeVariantKey]);

  const updateVariant = (key: QuickVariantKey, patch: Partial<QuickVariantDraft>) => {
    setVariants((current) => current.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)));
  };

  const toggleVariant = (key: QuickVariantKey) => {
    setVariants((current) =>
      current.map((variant) => (variant.key === key ? { ...variant, enabled: !variant.enabled } : variant))
    );
  };

  const generateWithAi = () => {
    void (async () => {
      if (!brief.trim()) {
        setError("Add a brief so the AI knows what to create.");
        return;
      }
      if (enabledVariants.length === 0) {
        setError("Enable at least one platform variant.");
        return;
      }

      setError("");
      setActionMessage(null);
      setAiBusy(true);
      setAiProgress(5);

      try {
        const { generatePost } = await import("../ai/ai.api");
        const prompt = [brief.trim(), language ? `Language: ${language}` : ""].filter(Boolean).join("\n");

        const nextVariants = [...variants];
        const step = Math.floor(90 / enabledVariants.length);

        for (let index = 0; index < enabledVariants.length; index += 1) {
          const variant = enabledVariants[index];
          const definition = getVariantDefinition(variant.key);
          const result = await generatePost({
            prompt,
            useBrandContext,
            platform: definition.platform,
            format: definition.format,
          });
          const parsed = parseAiContent(result.contentJson, definition.format);
          const targetIndex = nextVariants.findIndex((item) => item.key === variant.key);
          if (targetIndex >= 0) {
            nextVariants[targetIndex] = {
              ...nextVariants[targetIndex],
              title: nextVariants[targetIndex].title || brief.trim().slice(0, 80),
              body: parsed.text,
              slides: parsed.format === "carousel" ? parsed.slides : nextVariants[targetIndex].slides,
            };
          }
          setAiProgress(5 + step * (index + 1));
        }

        setVariants(nextVariants);
        setAiProgress(100);
        setActiveStep(1);
        setActionMessage({
          severity: "success",
          text: `Generated ${enabledVariants.length} variant${enabledVariants.length > 1 ? "s" : ""}. Review and edit before publishing.`,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI generation failed.");
      } finally {
        setAiBusy(false);
      }
    })();
  };

  const resolveImageUrl = async () => {
    if (uploadedImageUrl) return uploadedImageUrl;
    if (!imageFile) return null;
    const upload = await uploadGenerateImage(imageFile);
    setUploadedImageUrl(upload.url);
    return upload.url;
  };

  const validateContent = (): boolean => {
    if (enabledVariants.length === 0) {
      setActionMessage({ severity: "error", text: "Enable at least one platform variant." });
      return false;
    }
    const hasContent = enabledVariants.some(variantHasContent);
    if (!hasContent) {
      setActionMessage({
        severity: "error",
        text:
          composeMode === "manual"
            ? "Write content for at least one enabled platform."
            : "Generate or write content before publishing.",
      });
      return false;
    }
    return true;
  };

  const validatePublishSelection = (): SocialAccount[] | null => {
    if (!validateContent()) return null;
    if (selectedAccountIds.length === 0) {
      setActionMessage({ severity: "error", text: "Select at least one destination account to publish." });
      return null;
    }

    const selected = activeSocialAccounts.filter((account) => selectedAccountIds.includes(account.id));
    if (selected.length === 0) {
      setActionMessage({ severity: "error", text: "Selected accounts are no longer available." });
      return null;
    }

    const missingVariant = selected.find(
      (account) => !findVariantForPlatform(enabledVariants, account.platform) || !variantHasContent(findVariantForPlatform(enabledVariants, account.platform)!)
    );
    if (missingVariant) {
      setActionMessage({
        severity: "error",
        text: `No content variant for ${missingVariant.platform}. Enable and fill that platform in step 2.`,
      });
      return null;
    }

    return selected;
  };

  const createPostPayload = async (imageUrl: string | null) => {
    const primaryVariant = enabledVariants[0];
    const primaryDefinition = getVariantDefinition(primaryVariant.key);
    const channelId =
      activeSocialAccounts.find((account) => selectedAccountIds.includes(account.id))?.channelId ??
      activeSocialAccounts[0]?.channelId;

    if (!channelId) {
      throw new Error("Connect a social account first.");
    }

    return createContentPost({
      channelId,
      campaignId: null,
      title: primaryVariant.title.trim() || brief.trim() || "Quick post",
      contentType: defaultContentType(primaryDefinition.platform),
      contentJson: JSON.stringify({
        text: primaryVariant.body,
        brief,
        language,
        useBrandContext,
        imageUrl: imageUrl ?? undefined,
      }),
      imageUrl,
      prompt: brief.trim() || undefined,
      aiModel: composeMode === "ai" ? "local-ai-backend" : "manual",
      postVariants: toContentPostVariants(enabledVariants, imageUrl),
    });
  };

  const saveDraft = () => {
    void (async () => {
      if (!validateContent()) return;

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        await createPostPayload(imageUrl);
        setActionMessage({ severity: "success", text: "Draft saved to your content library." });
      } catch (saveError) {
        setActionMessage({
          severity: "error",
          text: saveError instanceof Error ? saveError.message : "Failed to save draft.",
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const publishToSelected = () => {
    void (async () => {
      const selected = validatePublishSelection();
      if (!selected) return;

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        const created = await createPostPayload(imageUrl);

        await transitionContentPostStatus(created.id, { status: ContentStatus.Review });
        await transitionContentPostStatus(created.id, { status: ContentStatus.Approved });

        const results: { account: SocialAccount; ok: boolean; error?: string }[] = [];

        for (const account of selected) {
          try {
            await publishContentPost(created.id, {
              socialAccountId: account.id,
              postVariantId: null,
              idempotencyKey: `generate-publish-${created.id}-${account.id}-${Date.now()}`,
            });
            results.push({ account, ok: true });
          } catch (publishError) {
            results.push({
              account,
              ok: false,
              error: publishError instanceof Error ? publishError.message : "Publish failed",
            });
          }
        }

        const succeeded = results.filter((result) => result.ok).length;
        const failed = results.filter((result) => !result.ok);

        if (failed.length === 0) {
          setActionMessage({
            severity: "success",
            text: `Published to ${succeeded} platform${succeeded > 1 ? "s" : ""} successfully.`,
          });
        } else if (succeeded > 0) {
          setActionMessage({
            severity: "warning",
            text: `Published to ${succeeded} platform(s). Failed: ${failed.map((f) => f.account.platform).join(", ")}.`,
          });
        } else {
          setActionMessage({
            severity: "error",
            text: failed[0]?.error ?? "Publishing failed for all selected platforms.",
          });
        }
      } catch (publishError) {
        setActionMessage({
          severity: "error",
          text: publishError instanceof Error ? publishError.message : "Failed to publish content.",
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const scheduleToSelected = () => {
    void (async () => {
      const selected = validatePublishSelection();
      if (!selected) return;

      const scheduledUtc = new Date(scheduledAt);
      if (Number.isNaN(scheduledUtc.getTime()) || scheduledUtc <= new Date()) {
        setActionMessage({ severity: "error", text: "Scheduled time must be in the future." });
        return;
      }

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        const created = await createPostPayload(imageUrl);

        await transitionContentPostStatus(created.id, { status: ContentStatus.Review });
        await transitionContentPostStatus(created.id, { status: ContentStatus.Approved });

        let scheduled = 0;
        for (const account of selected) {
          try {
            await scheduleContentPost(created.id, {
              socialAccountId: account.id,
              postVariantId: null,
              scheduledAt: scheduledUtc.toISOString(),
              idempotencyKey: `generate-schedule-${created.id}-${account.id}-${scheduledUtc.getTime()}`,
            });
            scheduled += 1;
          } catch {
            // continue with other accounts
          }
        }

        setActionMessage({
          severity: scheduled > 0 ? "success" : "error",
          text:
            scheduled > 0
              ? `Scheduled for ${scheduled} platform${scheduled > 1 ? "s" : ""}.`
              : "Scheduling failed for all selected platforms.",
        });
      } catch (scheduleError) {
        setActionMessage({
          severity: "error",
          text: scheduleError instanceof Error ? scheduleError.message : "Failed to schedule content.",
        });
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  const connectLinkedIn = () => {
    void getSocialAuthLoginUrl("linkedin")
      .then((url) => {
        window.location.href = url;
      })
      .catch((connectError) => {
        setActionMessage({
          severity: "error",
          text: connectError instanceof Error ? connectError.message : "Failed to start LinkedIn auth.",
        });
      });
  };

  const connectMeta = () => {
    void getSocialAuthLoginUrl("facebook")
      .then((url) => {
        window.location.href = url;
      })
      .catch((connectError) => {
        setActionMessage({
          severity: "error",
          text: connectError instanceof Error ? connectError.message : "Failed to start Meta auth.",
        });
      });
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Quick Generate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create a post in three steps: brief, platform content, then publish to one or more connected accounts.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionMessage ? <Alert severity={actionMessage.severity}>{actionMessage.text}</Alert> : null}

      <Paper sx={{ p: { xs: 2, md: 3 }, overflow: "hidden" }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {WORKFLOW_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  cursor: "pointer",
                  "& .MuiStepLabel-label": { fontWeight: activeStep === WORKFLOW_STEPS.indexOf(label) ? 700 : 400 },
                }}
                onClick={() => setActiveStep(WORKFLOW_STEPS.indexOf(label))}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Divider sx={{ mb: 3 }} />

        {activeStep === 0 ? (
          <Stack spacing={2.5}>
            <WorkflowStepHeader
              step={1}
              title="Brief & generation"
              description="Choose how to start, optionally use Brand Studio context, then generate or skip to write manually."
            />

            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={composeMode}
                onChange={(_, value: ComposeMode | null) => value && setComposeMode(value)}
              >
                <ToggleButton value="manual">
                  <FileEdit size={14} style={{ marginRight: 6 }} />
                  Write manually
                </ToggleButton>
                <ToggleButton value="ai">
                  <Sparkles size={14} style={{ marginRight: 6 }} />
                  AI-assisted
                </ToggleButton>
              </ToggleButtonGroup>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Brand Studio
                </Typography>
                <Chip
                  size="small"
                  label={useBrandContext && hasBrand ? "On" : "Off"}
                  color={useBrandContext && hasBrand ? "primary" : "default"}
                  variant={useBrandContext && hasBrand ? "filled" : "outlined"}
                  onClick={() => hasBrand && setUseBrandContext((value) => !value)}
                  disabled={!hasBrand}
                />
                {!hasBrand ? (
                  <Typography variant="caption" color="text.secondary">
                    Import a brand first
                  </Typography>
                ) : null}
              </Stack>
            </Stack>

            <TextField
              multiline
              minRows={4}
              label={composeMode === "ai" ? "What should this post be about?" : "Topic notes (optional)"}
              placeholder={
                composeMode === "ai"
                  ? "Product launch, promotion, thought leadership angle, CTA..."
                  : "Optional notes for your manual draft..."
              }
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-end" }}>
              <TextField
                select
                label="Language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                sx={{ minWidth: 160 }}
              >
                {LANGUAGES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>

              {composeMode === "ai" ? (
                <Button
                  variant="contained"
                  startIcon={<Sparkles size={16} />}
                  onClick={generateWithAi}
                  disabled={aiBusy || !brief.trim() || enabledVariants.length === 0}
                >
                  {aiBusy ? "Generating..." : "Generate content"}
                </Button>
              ) : null}
            </Stack>

            {aiBusy ? <LinearProgress variant="determinate" value={aiProgress} /> : null}

            <Typography variant="subtitle2" fontWeight={600} sx={{ pt: 1 }}>
              Which platforms do you need content for?
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {QUICK_VARIANT_DEFINITIONS.map((definition) => {
                const enabled = variants.find((variant) => variant.key === definition.key)?.enabled ?? false;
                return (
                  <Chip
                    key={definition.key}
                    label={definition.label}
                    color={enabled ? "primary" : "default"}
                    variant={enabled ? "filled" : "outlined"}
                    onClick={() => toggleVariant(definition.key)}
                  />
                );
              })}
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" onClick={() => setActiveStep(1)}>
                Continue to content
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {activeStep === 1 ? (
          <Stack spacing={2}>
            <WorkflowStepHeader
              step={2}
              title="Content & preview"
              description="Edit each platform variant. Add optional media shared across destinations."
            />

            {enabledVariants.length === 0 ? (
              <Alert severity="info">Go back to step 1 and enable at least one platform.</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2.5,
                  gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) minmax(280px, 360px)" },
                  alignItems: "start",
                }}
              >
                <Stack spacing={2}>
                  <Tabs
                    value={activeVariantKey}
                    onChange={(_, value: QuickVariantKey) => setActiveVariantKey(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    {enabledVariants.map((variant) => (
                      <Tab
                        key={variant.key}
                        value={variant.key}
                        label={getVariantDefinition(variant.key).label}
                      />
                    ))}
                  </Tabs>

                  <TextField
                    label="Title"
                    value={activeVariant.title}
                    onChange={(event) => updateVariant(activeVariant.key, { title: event.target.value })}
                    size="small"
                  />

                  <TextField
                    multiline
                    minRows={activeDefinition.format === "carousel" ? 5 : 10}
                    label={activeDefinition.format === "carousel" ? "Carousel caption" : "Post body"}
                    value={activeVariant.body}
                    onChange={(event) => updateVariant(activeVariant.key, { body: event.target.value })}
                  />

                  {activeDefinition.format === "carousel" ? (
                    <TextField
                      multiline
                      minRows={5}
                      label="Slides"
                      helperText="Separate slides with a line containing only ---"
                      value={slidesToCsv(activeVariant.slides)}
                      onChange={(event) =>
                        updateVariant(activeVariant.key, { slides: csvToSlides(event.target.value) })
                      }
                    />
                  ) : null}

                  <Typography variant="caption" color="text.secondary">
                    {activeVariant.body.length} characters
                    {composeMode === "ai" && !activeVariant.body.trim() ? " · run Generate in step 1" : ""}
                  </Typography>

                  <Divider />

                  <Typography variant="subtitle2" fontWeight={600}>
                    Shared media
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button component="label" variant="outlined" size="small">
                      {imageFile ? "Change image" : "Add image"}
                      <input
                        hidden
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(event) => {
                          setImageFile(event.target.files?.[0] ?? null);
                          setUploadedImageUrl(null);
                        }}
                      />
                    </Button>
                    {imageFile ? (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setImageFile(null);
                          setUploadedImageUrl(null);
                        }}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Stack>
                  {imagePreviewUrl ? (
                    <Box
                      component="img"
                      src={imagePreviewUrl}
                      alt="Preview"
                      sx={{
                        width: "100%",
                        maxHeight: 200,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  ) : null}
                </Stack>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.15),
                    position: { lg: "sticky" },
                    top: 16,
                  }}
                >
                  <Typography variant="overline" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Live preview
                  </Typography>
                  <PostVariantPreview
                    definition={activeDefinition}
                    title={activeVariant.title}
                    body={activeVariant.body}
                    slides={activeVariant.slides}
                    imageUrl={imagePreviewUrl}
                    brandName={brandStudio?.parsedProfile.brandName}
                  />
                </Box>
              </Box>
            )}

            <Stack direction="row" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button variant="contained" onClick={() => setActiveStep(2)} disabled={enabledVariants.length === 0}>
                Continue to publish
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {activeStep === 2 ? (
          <Stack spacing={2}>
            <WorkflowStepHeader
              step={3}
              title="Publish destinations"
              description="Select every connected account you want to post to. Each uses its platform variant from step 2."
            />

            <PublishDestinationsPanel
              accounts={activeSocialAccounts}
              selectedAccountIds={selectedAccountIds}
              onSelectedAccountIdsChange={setSelectedAccountIds}
              enabledVariants={enabledVariants}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
              onConnectLinkedIn={connectLinkedIn}
              onConnectMeta={connectMeta}
              isSubmitting={isSubmitting}
              onSaveDraft={saveDraft}
              onPublish={publishToSelected}
              onSchedule={scheduleToSelected}
            />

            <Button onClick={() => setActiveStep(1)} sx={{ alignSelf: "flex-start" }}>
              Back to content
            </Button>
          </Stack>
        ) : null}
      </Paper>
    </Stack>
  );
}
