import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
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
import { ROUTES } from "../../shared/lib/routes";
import { useSocialAccounts } from "../social-media/social-accounts.queries";
import type { SocialAccount } from "../social-media/social-accounts.types";
import { getSocialAuthLoginUrl } from "../social-media/social-auth.api";
import { SocialPlatform } from "../content-posts/content-posts.types";
import {
  createContentPost,
  markContentPostReady,
} from "../content-posts/content-posts.api";
import {
  formatPublicationError,
  publishPublication,
  schedulePublication,
  waitForPublication,
} from "./publications.api";
import {
  PublishDestinationsPanel,
  type PlatformPublishState,
} from "./components/PublishDestinationsPanel";
import { PostVariantPreview } from "./components/PostVariantPreview";
import { WorkflowStepHeader } from "./components/WorkflowStepHeader";
import {
  createInitialVariants,
  mapQuickGeneratePostType,
  postTypeNeedsVisuals,
  QUICK_VARIANT_DEFINITIONS,
  type ComposeMode,
  type ImagePostType,
  type QuickPostMode,
  type QuickVariantDraft,
  type QuickVariantKey,
} from "./generate.types";
import { uploadGenerateImage } from "./media.api";
import { dedupeAccountsByPlatform } from "./utils/dedupeAccountsByPlatform";
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
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [includeCta, setIncludeCta] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(false);
  const [postMode, setPostMode] = useState<QuickPostMode>("textOnly");
  const [imagePostType, setImagePostType] = useState<ImagePostType>("staticImage");
  const [generateVisuals, setGenerateVisuals] = useState(true);
  const [variants, setVariants] = useState<QuickVariantDraft[]>(() => createInitialVariants());
  const [activeVariantKey, setActiveVariantKey] = useState<QuickVariantKey>("linkedin-post");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [selectedByPlatform, setSelectedByPlatform] = useState<Partial<Record<SocialPlatform, number>>>({});
  const [scheduledAt, setScheduledAt] = useState("");
  const [platformPublishState, setPlatformPublishState] = useState<
    Partial<Record<SocialPlatform, PlatformPublishState>>
  >({});
  const [platformPublishErrors, setPlatformPublishErrors] = useState<Partial<Record<SocialPlatform, string>>>(
    {}
  );

  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiProgressMessage, setAiProgressMessage] = useState("");
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

  const dedupedAccounts = useMemo(
    () => dedupeAccountsByPlatform(activeSocialAccounts),
    [activeSocialAccounts]
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

  const carouselPostTypeSelected = postMode === "withImage" && imagePostType === "carousel";

  useEffect(() => {
    if (carouselPostTypeSelected) {
      setVariants((current) =>
        current.map((variant) =>
          variant.key === "instagram-carousel" ? { ...variant, enabled: true } : variant
        )
      );
    }
  }, [carouselPostTypeSelected]);

  const enabledVariants = useMemo(() => {
    const enabled = variants.filter((variant) => variant.enabled);
    if (carouselPostTypeSelected) return enabled;
    return enabled.filter((variant) => variant.key !== "instagram-carousel");
  }, [variants, carouselPostTypeSelected]);

  const activeVariant = variants.find((variant) => variant.key === activeVariantKey) ?? variants[0];
  const activeDefinition = getVariantDefinition(activeVariant.key);

  const enabledPlatforms = useMemo(() => {
    const platforms = new Set<SocialPlatform>();
    for (const variant of enabledVariants) {
      platforms.add(getVariantDefinition(variant.key).platform);
    }
    return [...platforms];
  }, [enabledVariants]);

  const requiresInstagramImage = enabledPlatforms.includes(SocialPlatform.Instagram);
  const hasGeneratedMedia = enabledVariants.some(
    (variant) => Boolean(variant.posterUrl) || (variant.carouselAssets?.length ?? 0) > 0
  );
  const hasImage = Boolean(imageFile || uploadedImageUrl || hasGeneratedMedia);

  useEffect(() => {
    setSelectedByPlatform((current) => {
      const next = { ...current };
      for (const platform of Object.keys(next) as SocialPlatform[]) {
        if (!enabledPlatforms.includes(platform)) {
          delete next[platform];
        }
      }
      return next;
    });
  }, [enabledPlatforms]);

  useEffect(() => {
    if (!enabledVariants.some((variant) => variant.key === activeVariantKey) && enabledVariants[0]) {
      setActiveVariantKey(enabledVariants[0].key);
    }
  }, [enabledVariants, activeVariantKey]);

  const updateVariant = (key: QuickVariantKey, patch: Partial<QuickVariantDraft>) => {
    setVariants((current) => current.map((variant) => (variant.key === key ? { ...variant, ...patch } : variant)));
  };

  const toggleVariant = (key: QuickVariantKey) => {
    if (key === "instagram-carousel" && !carouselPostTypeSelected) return;
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
      setAiProgressMessage("Generating captions…");

      try {
        const { generatePost } = await import("../ai/ai.api");
        const { generateCreativePreview, formatCreativeError } = await import("../ai/creative.api");
        const postType = mapQuickGeneratePostType(postMode, imagePostType);
        const shouldGenerateVisuals = generateVisuals && postTypeNeedsVisuals(postType);

        const nextVariants = [...variants];
        const step = Math.floor(90 / enabledVariants.length);

        for (let index = 0; index < enabledVariants.length; index += 1) {
          const variant = enabledVariants[index];
          const definition = getVariantDefinition(variant.key);
          setAiProgressMessage(`Generating caption for ${definition.label}…`);

          const result = await generatePost({
            prompt: brief.trim(),
            useBrandContext,
            platform: definition.platform,
            format: definition.format,
            includeHashtags,
            includeCta,
            includeEmojis,
            postType,
            language,
            generateVisuals: shouldGenerateVisuals,
          });

          let contentJson = result.contentJson;
          let posterUrl: string | null = null;
          let carouselAssets: string[] = [];
          let creativeError: string | null = null;

          if (shouldGenerateVisuals) {
            setAiProgressMessage(`Generating visual for ${definition.label}…`);
            try {
              const creative = await generateCreativePreview({
                contentJson,
                platform: definition.platform,
                language,
              });
              contentJson = creative.contentJson;
              posterUrl = creative.posterUrl ?? null;
              carouselAssets = creative.carouselAssets ?? [];
              creativeError = creative.creativeError ?? null;
            } catch (creativeErr) {
              creativeError = formatCreativeError(creativeErr);
            }
          }

          const parsed = parseAiContent(contentJson, definition.format);
          const targetIndex = nextVariants.findIndex((item) => item.key === variant.key);
          if (targetIndex >= 0) {
            nextVariants[targetIndex] = {
              ...nextVariants[targetIndex],
              title: nextVariants[targetIndex].title || brief.trim().slice(0, 80),
              body: parsed.text,
              slides: parsed.format === "carousel" ? parsed.slides : nextVariants[targetIndex].slides,
              contentJson,
              posterUrl,
              carouselAssets,
              creativeError,
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
        const { formatAiError } = await import("../ai/ai.api");
        setError(formatAiError(err));
      } finally {
        setAiBusy(false);
        setAiProgressMessage("");
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

  const getSelectedAccounts = (): SocialAccount[] => {
    return enabledPlatforms
      .map((platform) => {
        const accountId = selectedByPlatform[platform];
        if (accountId == null) return null;
        return activeSocialAccounts.find((account) => account.id === accountId) ?? null;
      })
      .filter((account): account is SocialAccount => account != null);
  };

  const validatePublishSelection = (): SocialAccount[] | null => {
    if (!validateContent()) return null;

    const selected = getSelectedAccounts();
    if (selected.length === 0) {
      setActionMessage({
        severity: "error",
        text: "Select one destination per platform you want to publish to.",
      });
      return null;
    }

    if (requiresInstagramImage && !hasImage) {
      setActionMessage({
        severity: "error",
        text: "Instagram requires an image. Add shared media in step 2.",
      });
      return null;
    }

    const missingVariant = selected.find((account) => {
      const variant = findVariantForPlatform(enabledVariants, account.platform);
      return !variant || !variantHasContent(variant);
    });
    if (missingVariant) {
      setActionMessage({
        severity: "error",
        text: `No content for ${missingVariant.platform}. Fill that platform variant in step 2.`,
      });
      return null;
    }

    return selected;
  };

  const createPostPayload = async (imageUrl: string | null, selected: SocialAccount[]) => {
    const primaryVariant = enabledVariants[0];
    const primaryDefinition = getVariantDefinition(primaryVariant.key);
    const resolvedImageUrl =
      imageUrl ?? primaryVariant.posterUrl ?? primaryVariant.carouselAssets?.[0] ?? null;
    const primaryContentJson =
      primaryVariant.contentJson ??
      JSON.stringify({
        text: primaryVariant.body,
        brief,
        language,
        useBrandContext,
        imageUrl: resolvedImageUrl ?? undefined,
      });

    if (selected.length === 0 && dedupedAccounts.length === 0) {
      throw new Error("Connect a social account first.");
    }

    return createContentPost({
      channelId: null,
      campaignId: null,
      title: primaryVariant.title.trim() || brief.trim() || "Quick post",
      contentType: defaultContentType(primaryDefinition.platform),
      contentJson: primaryContentJson,
      imageUrl: resolvedImageUrl,
      prompt: brief.trim() || undefined,
      aiModel: composeMode === "ai" ? "local-ai-backend" : "manual",
      postVariants: toContentPostVariants(enabledVariants, resolvedImageUrl),
    });
  };

  const saveDraft = () => {
    void (async () => {
      if (!validateContent()) return;

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        const fallbackSelected =
          getSelectedAccounts().length > 0 ? getSelectedAccounts() : dedupedAccounts.slice(0, 1);
        if (fallbackSelected.length === 0) {
          throw new Error("Connect a social account to save a draft.");
        }
        await createPostPayload(imageUrl, fallbackSelected);
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
        setPlatformPublishState({});
        setPlatformPublishErrors({});

        const imageUrl = await resolveImageUrl();
        const created = await createPostPayload(imageUrl, selected);

        await markContentPostReady(created.id);

        const states: Partial<Record<SocialPlatform, PlatformPublishState>> = {};
        const errors: Partial<Record<SocialPlatform, string>> = {};

        for (const account of selected) {
          states[account.platform] = "queued";
          setPlatformPublishState({ ...states });

          try {
            const publication = await publishPublication(created.id, {
              socialAccountId: account.id,
              postVariantId: null,
              idempotencyKey: `generate-publish-${created.id}-${account.id}-${Date.now()}`,
            });

            states[account.platform] = "publishing";
            setPlatformPublishState({ ...states });

            const final = await waitForPublication(publication.id);

            if (final.status === "Published") {
              states[account.platform] = "published";
            } else {
              states[account.platform] = "failed";
              errors[account.platform] = formatPublicationError(final.errorMessage);
            }
          } catch (publishError) {
            states[account.platform] = "failed";
            errors[account.platform] =
              publishError instanceof Error ? publishError.message : "Publish failed";
          }

          setPlatformPublishState({ ...states });
          setPlatformPublishErrors({ ...errors });
        }

        const published = selected.filter((a) => states[a.platform] === "published").length;
        const failed = selected.filter((a) => states[a.platform] === "failed");

        if (failed.length === 0) {
          setActionMessage({
            severity: "success",
            text: `Published to ${published} platform${published > 1 ? "s" : ""}.`,
          });
        } else if (published > 0) {
          setActionMessage({
            severity: "warning",
            text: `Published to ${published} platform(s). Failed: ${failed.map((f) => f.platform).join(", ")}.`,
          });
        } else {
          setActionMessage({
            severity: "error",
            text: errors[failed[0].platform] ?? "Publishing failed for all selected platforms.",
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
        const created = await createPostPayload(imageUrl, selected);

        await markContentPostReady(created.id);

        let scheduled = 0;
        const failures: string[] = [];

        for (const account of selected) {
          try {
            await schedulePublication(created.id, {
              socialAccountId: account.id,
              postVariantId: null,
              scheduledAt: scheduledUtc.toISOString(),
              idempotencyKey: `generate-schedule-${created.id}-${account.id}-${scheduledUtc.getTime()}`,
            });
            scheduled += 1;
          } catch (scheduleError) {
            failures.push(
              scheduleError instanceof Error ? scheduleError.message : account.platform
            );
          }
        }

        setActionMessage({
          severity: scheduled > 0 ? "success" : "error",
          text:
            scheduled > 0
              ? `Scheduled for ${scheduled} platform${scheduled > 1 ? "s" : ""} at ${scheduledUtc.toLocaleString()}.`
              : failures[0] ?? "Scheduling failed for all selected platforms.",
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

  const startSocialAuth = (platform: "linkedin" | "facebook" | "instagram" | "threads") => {
    void getSocialAuthLoginUrl(platform, { redirectPath: ROUTES.generate })
      .then((url) => {
        window.location.href = url;
      })
      .catch((connectError) => {
        setActionMessage({
          severity: "error",
          text: connectError instanceof Error ? connectError.message : `Failed to start ${platform} auth.`,
        });
      });
  };

  const canContinueToPublish =
    enabledVariants.length > 0 && (!requiresInstagramImage || hasImage);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" sx={{ mb: 0.5 }}>
          Quick Generate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose platforms, create content, then pick one account per platform to publish. Nothing is
          posted until you confirm destinations in step 3.
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

            {composeMode === "ai" ? (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  Post type
                </Typography>
                <Stack spacing={1.5}>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={postMode}
                    onChange={(_, value: QuickPostMode | null) => value && setPostMode(value)}
                  >
                    <ToggleButton value="textOnly">Text only</ToggleButton>
                    <ToggleButton value="withImage">Post with image</ToggleButton>
                  </ToggleButtonGroup>

                  {postMode === "withImage" ? (
                    <TextField
                      select
                      size="small"
                      label="Image post type"
                      value={imagePostType}
                      onChange={(event) => setImagePostType(event.target.value as ImagePostType)}
                      sx={{ maxWidth: 280 }}
                    >
                      <MenuItem value="staticImage">Static Image</MenuItem>
                      <MenuItem value="infographic">Infographic</MenuItem>
                      <MenuItem value="carousel">Carousel</MenuItem>
                    </TextField>
                  ) : null}

                  {postMode === "withImage" ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={generateVisuals}
                          onChange={(event) => setGenerateVisuals(event.target.checked)}
                        />
                      }
                      label="Generate visuals"
                    />
                  ) : null}
                </Stack>
              </Paper>
            ) : null}

            {composeMode === "ai" ? (
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                  Options
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeHashtags}
                        onChange={(event) => setIncludeHashtags(event.target.checked)}
                      />
                    }
                    label="Hashtags"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox checked={includeCta} onChange={(event) => setIncludeCta(event.target.checked)} />
                    }
                    label="Call to Action"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeEmojis}
                        onChange={(event) => setIncludeEmojis(event.target.checked)}
                      />
                    }
                    label="Emojis"
                  />
                </FormGroup>
              </Paper>
            ) : null}

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

            {aiBusy ? (
              <Stack spacing={0.5}>
                <LinearProgress variant="determinate" value={aiProgress} />
                {aiProgressMessage ? (
                  <Typography variant="caption" color="text.secondary">
                    {aiProgressMessage}
                  </Typography>
                ) : null}
              </Stack>
            ) : null}

            <Typography variant="subtitle2" fontWeight={600} sx={{ pt: 1 }}>
              Which platforms do you need content for?
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {QUICK_VARIANT_DEFINITIONS.map((definition) => {
                const enabled = variants.find((variant) => variant.key === definition.key)?.enabled ?? false;
                const isCarousel = definition.key === "instagram-carousel";
                const carouselDisabled = isCarousel && !carouselPostTypeSelected;
                return (
                  <Chip
                    key={definition.key}
                    label={carouselDisabled ? `${definition.label} (carousel type only)` : definition.label}
                    color={enabled ? "primary" : "default"}
                    variant={enabled ? "filled" : "outlined"}
                    disabled={carouselDisabled}
                    onClick={() => toggleVariant(definition.key)}
                  />
                );
              })}
            </Stack>

            <Stack direction="row" justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                disabled={enabledVariants.length === 0}
              >
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
                    {activeVariant.creativeError ? ` · Visual: ${activeVariant.creativeError}` : ""}
                  </Typography>

                  <Divider />

                  <Typography variant="subtitle2" fontWeight={600}>
                    Shared media
                    {requiresInstagramImage ? (
                      <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                        Required for Instagram
                      </Typography>
                    ) : null}
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
                    posterUrl={activeVariant.posterUrl}
                    carouselAssets={activeVariant.carouselAssets}
                    brandName={brandStudio?.parsedProfile.brandName}
                  />
                </Box>
              </Box>
            )}

            <Stack direction="row" justifyContent="space-between">
              <Button onClick={() => setActiveStep(0)}>Back</Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!canContinueToPublish}
              >
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
              description="Choose one account per platform. Only selected destinations will receive this post."
            />

            <PublishDestinationsPanel
              allAccounts={activeSocialAccounts}
              enabledPlatforms={enabledPlatforms}
              enabledVariants={enabledVariants}
              selectedByPlatform={selectedByPlatform}
              onSelectedByPlatformChange={setSelectedByPlatform}
              platformPublishState={platformPublishState}
              platformPublishErrors={platformPublishErrors}
              requiresImage={requiresInstagramImage}
              hasImage={hasImage}
              scheduledAt={scheduledAt}
              onScheduledAtChange={setScheduledAt}
              onConnectLinkedIn={() => startSocialAuth("linkedin")}
              onConnectFacebook={() => startSocialAuth("facebook")}
              onConnectInstagram={() => startSocialAuth("instagram")}
              onConnectThreads={() => startSocialAuth("threads")}
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
