import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { FileEdit, Sparkles } from "lucide-react";
import { useBrandStudio } from "../brand-studio/hooks/useBrandStudio";
import { useSocialAccounts } from "../social-media/social-accounts.queries";
import { getSocialAuthLoginUrl } from "../social-media/social-auth.api";
import { ContentStatus } from "../content-posts/content-posts.types";
import {
  createContentPost,
  publishContentPost,
  scheduleContentPost,
  transitionContentPostStatus,
} from "../content-posts/content-posts.api";
import { PostVariantPreview } from "./components/PostVariantPreview";
import { QuickGenerateContextPanel } from "./components/QuickGenerateContextPanel";
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
  getVariantDefinition,
  parseAiContent,
  slidesToCsv,
  toContentPostVariants,
} from "./utils/variantHelpers";

const LANGUAGES = ["English", "French", "Arabic"];

export function GeneratePage() {
  const { data: brandStudioSnapshot } = useBrandStudio();
  const { data: socialAccounts = [], refetch: refetchSocialAccounts } = useSocialAccounts();

  const brandStudio = brandStudioSnapshot?.brandStudio ?? null;

  const [composeMode, setComposeMode] = useState<ComposeMode>("ai");
  const [useBrandContext, setUseBrandContext] = useState(true);
  const [brief, setBrief] = useState("");
  const [language, setLanguage] = useState("English");
  const [variants, setVariants] = useState<QuickVariantDraft[]>(() => createInitialVariants());
  const [activeVariantKey, setActiveVariantKey] = useState<QuickVariantKey>("linkedin-post");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState<number | "">("");
  const [scheduledAt, setScheduledAt] = useState("");

  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(
    null
  );

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
    if (!activeSocialAccounts.length) {
      setSelectedSocialAccountId("");
      return;
    }
    setSelectedSocialAccountId((current) => {
      if (current && activeSocialAccounts.some((account) => account.id === current)) {
        return current;
      }
      return activeSocialAccounts[0].id;
    });
  }, [activeSocialAccounts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("socialAuthStatus");
    if (!status) return;

    const platform = params.get("platform") ?? "Social account";
    const authError = params.get("socialAuthError");
    if (status === "success") {
      setActionMessage({ severity: "success", text: `${platform} connected successfully.` });
      void refetchSocialAccounts();
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
      current.map((variant) =>
        variant.key === key ? { ...variant, enabled: !variant.enabled } : variant
      )
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
        const prompt = [
          brief.trim(),
          language ? `Language: ${language}` : "",
        ]
          .filter(Boolean)
          .join("\n");

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
        setActionMessage({
          severity: "success",
          text: `Generated content for ${enabledVariants.length} variant${enabledVariants.length > 1 ? "s" : ""}. You can edit everything before publishing.`,
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

  const validateBeforeSubmit = () => {
    if (!selectedSocialAccountId) {
      setActionMessage({ severity: "error", text: "Connect and select a publishing account first." });
      return null;
    }
    if (enabledVariants.length === 0) {
      setActionMessage({ severity: "error", text: "Enable at least one platform variant." });
      return null;
    }
    const hasContent = enabledVariants.some((variant) => {
      const definition = getVariantDefinition(variant.key);
      if (definition.format === "carousel") {
        return variant.body.trim() || variant.slides.some(Boolean);
      }
      return variant.body.trim().length > 0;
    });
    if (!hasContent) {
      setActionMessage({
        severity: "error",
        text: composeMode === "manual"
          ? "Write your post content manually or switch to AI-assisted mode."
          : "Generate content or write manually before publishing.",
      });
      return null;
    }

    const selectedAccount = activeSocialAccounts.find((account) => account.id === selectedSocialAccountId);
    if (!selectedAccount) {
      setActionMessage({ severity: "error", text: "Selected social account is unavailable." });
      return null;
    }
    return selectedAccount;
  };

  const saveDraft = () => {
    void (async () => {
      const selectedAccount = validateBeforeSubmit();
      if (!selectedAccount) return;

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        const primaryVariant = enabledVariants[0];
        const primaryDefinition = getVariantDefinition(primaryVariant.key);
        const contentJson = JSON.stringify({
          text: primaryVariant.body,
          brief,
          language,
          useBrandContext,
          imageUrl: imageUrl ?? undefined,
        });

        await createContentPost({
          channelId: selectedAccount.channelId,
          campaignId: null,
          title: primaryVariant.title.trim() || brief.trim() || "Quick post draft",
          contentType: defaultContentType(primaryDefinition.platform),
          contentJson,
          imageUrl,
          prompt: brief.trim() || undefined,
          aiModel: composeMode === "ai" ? "local-ai-backend" : "manual",
          postVariants: toContentPostVariants(enabledVariants, imageUrl),
        });

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

  const publish = () => {
    void (async () => {
      const selectedAccount = validateBeforeSubmit();
      if (!selectedAccount) return;

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        const matchingVariant =
          enabledVariants.find((variant) => getVariantDefinition(variant.key).platform === selectedAccount.platform) ??
          enabledVariants[0];
        const matchingDefinition = getVariantDefinition(matchingVariant.key);

        const contentJson = JSON.stringify({
          text: matchingVariant.body,
          brief,
          language,
          useBrandContext,
          imageUrl: imageUrl ?? undefined,
        });

        const created = await createContentPost({
          channelId: selectedAccount.channelId,
          campaignId: null,
          title: matchingVariant.title.trim() || brief.trim() || "Quick post",
          contentType: defaultContentType(matchingDefinition.platform),
          contentJson,
          imageUrl,
          prompt: brief.trim() || undefined,
          aiModel: composeMode === "ai" ? "local-ai-backend" : "manual",
          postVariants: toContentPostVariants(enabledVariants, imageUrl),
        });

        await transitionContentPostStatus(created.id, { status: ContentStatus.Review });
        await transitionContentPostStatus(created.id, { status: ContentStatus.Approved });
        await publishContentPost(created.id, {
          socialAccountId: selectedAccount.id,
          postVariantId: null,
          idempotencyKey: `generate-publish-${created.id}-${Date.now()}`,
        });

        setActionMessage({ severity: "success", text: "Post queued for publishing successfully." });
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

  const schedule = () => {
    void (async () => {
      const selectedAccount = validateBeforeSubmit();
      if (!selectedAccount) return;

      const scheduledUtc = new Date(scheduledAt);
      if (Number.isNaN(scheduledUtc.getTime()) || scheduledUtc <= new Date()) {
        setActionMessage({ severity: "error", text: "Scheduled time must be in the future." });
        return;
      }

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        const imageUrl = await resolveImageUrl();
        const matchingVariant =
          enabledVariants.find((variant) => getVariantDefinition(variant.key).platform === selectedAccount.platform) ??
          enabledVariants[0];
        const matchingDefinition = getVariantDefinition(matchingVariant.key);

        const contentJson = JSON.stringify({
          text: matchingVariant.body,
          brief,
          language,
          useBrandContext,
          imageUrl: imageUrl ?? undefined,
        });

        const created = await createContentPost({
          channelId: selectedAccount.channelId,
          campaignId: null,
          title: matchingVariant.title.trim() || brief.trim() || "Scheduled post",
          contentType: defaultContentType(matchingDefinition.platform),
          contentJson,
          imageUrl,
          prompt: brief.trim() || undefined,
          aiModel: composeMode === "ai" ? "local-ai-backend" : "manual",
          postVariants: toContentPostVariants(enabledVariants, imageUrl),
        });

        await transitionContentPostStatus(created.id, { status: ContentStatus.Review });
        await transitionContentPostStatus(created.id, { status: ContentStatus.Approved });
        await scheduleContentPost(created.id, {
          socialAccountId: selectedAccount.id,
          postVariantId: null,
          scheduledAt: scheduledUtc.toISOString(),
          idempotencyKey: `generate-schedule-${created.id}-${scheduledUtc.getTime()}`,
        });

        setActionMessage({ severity: "success", text: "Post scheduled successfully." });
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

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Quick Generate</Typography>
        <Typography variant="body2" color="text.secondary">
          Create standalone posts outside campaigns. Write manually or start with AI, adapt per platform, preview, then publish.
        </Typography>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {actionMessage ? <Alert severity={actionMessage.severity}>{actionMessage.text}</Alert> : null}

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1fr) 380px" },
          alignItems: "flex-start",
        }}
      >
        <Stack spacing={2.5}>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    1. How do you want to start?
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Manual mode keeps the editor empty. AI mode fills selected variants from your brief.
                  </Typography>
                </Box>
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
              </Stack>

              <TextField
                multiline
                minRows={3}
                label={composeMode === "ai" ? "Brief for AI" : "Topic or notes (optional)"}
                placeholder={
                  composeMode === "ai"
                    ? "What should this post communicate? Include angle, offer, CTA, or references..."
                    : "Optional notes to keep while writing manually..."
                }
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <TextField
                  select
                  label="Language"
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  sx={{ minWidth: 180 }}
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
                    sx={{ alignSelf: { md: "flex-end" } }}
                  >
                    {aiBusy ? "Generating..." : "Generate selected variants"}
                  </Button>
                ) : null}
              </Stack>

              {aiBusy ? <LinearProgress variant="determinate" value={aiProgress} /> : null}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  2. Platform variants
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Enable the formats you need. Each variant has its own editable copy and preview.
                </Typography>
              </Box>

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

              {enabledVariants.length === 0 ? (
                <Alert severity="info">Enable at least one platform variant to continue.</Alert>
              ) : (
                <>
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

                  <Stack spacing={1.5}>
                    <TextField
                      label="Variant title"
                      value={activeVariant.title}
                      onChange={(event) => updateVariant(activeVariant.key, { title: event.target.value })}
                      placeholder="Internal title or headline"
                    />

                    <TextField
                      multiline
                      minRows={activeDefinition.format === "carousel" ? 4 : 8}
                      label={activeDefinition.format === "carousel" ? "Carousel caption" : "Post content"}
                      value={activeVariant.body}
                      onChange={(event) => updateVariant(activeVariant.key, { body: event.target.value })}
                      placeholder={
                        composeMode === "manual"
                          ? "Write your post here..."
                          : "Generate with AI or edit the draft here..."
                      }
                    />

                    {activeDefinition.format === "carousel" ? (
                      <TextField
                        multiline
                        minRows={6}
                        label="Carousel slides"
                        helperText="Separate slides with a line containing only ---"
                        value={slidesToCsv(activeVariant.slides)}
                        onChange={(event) =>
                          updateVariant(activeVariant.key, { slides: csvToSlides(event.target.value) })
                        }
                      />
                    ) : null}

                    <Typography variant="caption" color="text.secondary">
                      {activeVariant.body.length} characters
                      {activeDefinition.format === "carousel"
                        ? ` · ${activeVariant.slides.filter(Boolean).length} slides`
                        : ""}
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                3. Media
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                <Button component="label" variant="outlined">
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
                    color="error"
                    variant="text"
                    onClick={() => {
                      setImageFile(null);
                      setUploadedImageUrl(null);
                    }}
                  >
                    Remove image
                  </Button>
                ) : null}
              </Stack>
              {imagePreviewUrl ? (
                <Box
                  component="img"
                  src={imagePreviewUrl}
                  alt="Selected media"
                  sx={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
                />
              ) : null}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2.5}>
          <QuickGenerateContextPanel
            brandStudio={brandStudio}
            useBrandContext={useBrandContext}
            onUseBrandContextChange={setUseBrandContext}
          />

          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
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
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Publish
              </Typography>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    void (async () => {
                      try {
                        window.location.href = await getSocialAuthLoginUrl("linkedin");
                      } catch (connectError) {
                        setActionMessage({
                          severity: "error",
                          text: connectError instanceof Error ? connectError.message : "Failed to start LinkedIn auth.",
                        });
                      }
                    })();
                  }}
                >
                  Link LinkedIn
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    void (async () => {
                      try {
                        window.location.href = await getSocialAuthLoginUrl("facebook");
                      } catch (connectError) {
                        setActionMessage({
                          severity: "error",
                          text: connectError instanceof Error ? connectError.message : "Failed to start Facebook auth.",
                        });
                      }
                    })();
                  }}
                >
                  Link Meta / Instagram
                </Button>
              </Stack>

              <TextField
                select
                label="Publishing account"
                value={selectedSocialAccountId}
                onChange={(event) => setSelectedSocialAccountId(Number(event.target.value))}
                helperText="Publishing uses the variant that matches the selected account platform."
                disabled={activeSocialAccounts.length === 0}
              >
                {activeSocialAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.platform} · {account.displayName || account.accountHandle}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="datetime-local"
                label="Schedule time"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={saveDraft} disabled={isSubmitting}>
                  Save draft
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={publish}
                  disabled={isSubmitting || !selectedSocialAccountId}
                >
                  {isSubmitting ? "Processing..." : "Publish now"}
                </Button>
                <Button variant="contained" onClick={schedule} disabled={isSubmitting || !selectedSocialAccountId}>
                  Schedule
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Standalone posts are saved without a campaign. Brand context is only sent to AI when enabled above.
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Stack>
  );
}
