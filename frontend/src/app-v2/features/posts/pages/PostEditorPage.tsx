import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileEdit, ImageIcon, Sparkles } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../../campaigns/hooks/useCampaignContext";
import {
  contentPostsKeys,
  useContentPost,
  useCreateContentPost,
  useUpdateContentPost,
} from "../../content-posts/content-posts.queries";
import { markContentPostReady } from "../../content-posts/content-posts.api";
import {
  ContentStatus,
  ContentType,
  SocialPlatform,
  type ContentPostVariant,
} from "../../content-posts/content-posts.types";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useBrandStudio } from "../../brand-studio/hooks/useBrandStudio";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { campaignPaths, channelPaths, postEditorPath, ROUTES } from "../../../shared/lib/routes";
import { ReadOnlyBanner } from "../../../shared/ui/ReadOnlyBanner";
import { formatAiError } from "../../ai/ai.api";
import { formatCreativeError, generatePostCreative } from "../../ai/creative.api";
import { extractCreativeAssets } from "../../campaigns/lib/formatGeneratedContent";
import { AiContextStack } from "../components/AiContextStack";
import { SaveStatusPanel, type SaveState } from "../components/SaveStatusPanel";
import { usePostAutosave } from "../hooks/usePostAutosave";
import { PostPlatformTargetsPanel } from "../components/PostPlatformTargetsPanel";
import { PostVariantsWorkspace } from "../components/PostVariantsWorkspace";
import { CampaignPublishDestinationsPanel } from "../components/CampaignPublishDestinationsPanel";
import { usePostParam } from "../hooks/usePostParam";
import {
  mergeVariantsWithImage,
  parseVariantContentJson,
  PLATFORM_LABELS,
  PUBLISHABLE_PLATFORMS,
  syncVariantsForPlatforms,
} from "../utils/variantPreview";
import {
  resolvePublishTargets,
  useMultiPlatformPublish,
} from "../hooks/useMultiPlatformPublish";
import { getReadyPlatforms } from "../utils/publishReadiness";
import { getAccountsForPlatform } from "../../generate/utils/dedupeAccountsByPlatform";
import { uploadGenerateImage } from "../../generate/media.api";
import { PostMasterImageUpload } from "../components/PostMasterImageUpload";

interface PostBodyJson {
  text?: string;
  topic?: string;
  prompt?: string;
}

function safeParseBody(json: string | null | undefined): PostBodyJson {
  if (!json) return {};
  try {
    return JSON.parse(json) as PostBodyJson;
  } catch {
    return { text: json };
  }
}

function defaultContentType(platform: SocialPlatform | null): ContentType {
  switch (platform) {
    case SocialPlatform.LinkedIn:
      return ContentType.LinkedInPost;
    case SocialPlatform.Facebook:
      return ContentType.FacebookPost;
    case SocialPlatform.Instagram:
      return ContentType.InstagramPost;
    case SocialPlatform.Threads:
      return ContentType.Threads;
    default:
      return ContentType.LinkedInPost;
  }
}

export function PostEditorPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { channelId, channel } = useChannelContext();
  const { campaignId: routeCampaignId, campaign } = useCampaignContext();
  const postId = usePostParam();
  const isNew = postId === null;

  const postQuery = useContentPost(postId ?? 0);
  const { data: brandStudioSnapshot } = useBrandStudio();
  const { data: allAccounts = [] } = useSocialAccounts();

  const createMutation = useCreateContentPost();
  const updateMutation = useUpdateContentPost();

  const { canMutateContent } = useTeamPermissions();
  const readOnly = !canMutateContent;

  const post = isNew ? null : postQuery.data ?? null;
  const isLoadingPost = !isNew && postQuery.isLoading;

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [body, setBody] = useState("");
  const [variants, setVariants] = useState<ContentPostVariant[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [selectedByPlatform, setSelectedByPlatform] = useState<
    Partial<Record<SocialPlatform, number>>
  >({});
  const [scheduledAt, setScheduledAt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    severity: "success" | "error" | "info" | "warning";
    text: string;
  } | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [savedBody, setSavedBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [creativeBusy, setCreativeBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [autosaveError, setAutosaveError] = useState<string | null>(null);

  const {
    platformState,
    platformErrors,
    isPublishing,
    publishToTargets,
    scheduleToTargets,
  } = useMultiPlatformPublish({ contentPostId: post?.id ?? null });

  const brandName =
    brandStudioSnapshot?.brandStudio?.parsedProfile.brandName ??
    brandStudioSnapshot?.brandStudio?.parsedProfile.websiteUrl ??
    null;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isNew) {
      setHydrated(true);
      return;
    }
    if (!post || hydrated) return;
    const parsed = safeParseBody(post.contentJson);
    setTitle(post.title);
    setBody(parsed.text ?? "");
    setPrompt(parsed.prompt ?? post.prompt ?? parsed.topic ?? "");
    const loadedVariants = post.postVariants ?? [];
    setVariants(loadedVariants);
    const platforms = loadedVariants
      .map((v) => v.platform)
      .filter((p) => PUBLISHABLE_PLATFORMS.includes(p));
    setSelectedPlatforms(platforms.length > 0 ? platforms : []);
    setSavedTitle(post.title);
    setSavedBody(parsed.text ?? "");
    const persistedImage = post.imageUrl ?? null;
    setUploadedImageUrl(persistedImage);
    setSavedImageUrl(persistedImage);
    setHydrated(true);
  }, [post, isNew, hydrated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(uploadedImageUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, uploadedImageUrl]);

  const effectiveImageUrl = imagePreviewUrl ?? uploadedImageUrl;
  const requiresInstagramImage = selectedPlatforms.includes(SocialPlatform.Instagram);

  const creativePlatformKey = useMemo(() => {
    const platform = selectedPlatforms[0] ?? SocialPlatform.LinkedIn;
    switch (platform) {
      case SocialPlatform.Facebook:
        return "facebook";
      case SocialPlatform.Instagram:
        return "instagram";
      case SocialPlatform.Threads:
        return "threads";
      case SocialPlatform.X:
        return "x";
      case SocialPlatform.LinkedIn:
      default:
        return "linkedin";
    }
  }, [selectedPlatforms]);

  const creativeAssets = useMemo(() => {
    if (!post?.contentJson) return null;
    return extractCreativeAssets(post.contentJson, creativePlatformKey);
  }, [post?.contentJson, creativePlatformKey]);

  const channelAccounts = useMemo(
    () =>
      allAccounts.filter(
        (account) => channelId != null && account.linkedChannelIds.includes(channelId)
      ),
    [allAccounts, channelId]
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSelectedByPlatform((current) => {
      const next = { ...current };
      for (const platform of selectedPlatforms) {
        const accounts = getAccountsForPlatform(channelAccounts, platform);
        if (accounts.length === 1) {
          next[platform] = accounts[0].id;
        } else if (accounts.length > 1 && next[platform] == null) {
          next[platform] = accounts[0].id;
        }
      }
      for (const key of Object.keys(next) as SocialPlatform[]) {
        if (!selectedPlatforms.includes(key)) {
          delete next[key];
        }
      }
      return next;
    });
  }, [channelAccounts, selectedPlatforms]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handlePlatformsChange = useCallback(
    (nextPlatforms: SocialPlatform[]) => {
      const removed = selectedPlatforms.filter((p) => !nextPlatforms.includes(p));
      for (const platform of removed) {
        const variant = variants.find((v) => v.platform === platform);
        const text = variant ? parseVariantContentJson(variant.contentJson).text : "";
        if (text.trim() && !window.confirm(`Remove ${PLATFORM_LABELS[platform]}? Unsaved variant copy will be lost.`)) {
          return;
        }
      }
      setSelectedPlatforms(nextPlatforms);
      setVariants((prev) =>
        mergeVariantsWithImage(
          syncVariantsForPlatforms(nextPlatforms, prev, title, body, effectiveImageUrl),
          effectiveImageUrl
        )
      );
    },
    [selectedPlatforms, variants, title, body, effectiveImageUrl]
  );

  const effectiveCampaignId = routeCampaignId ?? post?.campaignId ?? null;

  const buildContentJson = useCallback(
    () =>
      JSON.stringify({
        text: body,
        prompt,
        channelId,
        campaignId: effectiveCampaignId,
      }),
    [body, prompt, channelId, effectiveCampaignId]
  );

  const resolveImageUrl = useCallback(async (): Promise<string | null> => {
    if (imageFile) {
      const upload = await uploadGenerateImage(imageFile);
      setUploadedImageUrl(upload.url);
      setImageFile(null);
      return upload.url;
    }
    return uploadedImageUrl;
  }, [imageFile, uploadedImageUrl]);

  const imageDirty = imageFile != null || uploadedImageUrl !== savedImageUrl;
  const isDirty = isNew
    ? title.length > 0 || body.length > 0 || variants.length > 0 || imageDirty
    : title !== savedTitle || body !== savedBody || imageDirty;

  const buildAutosavePayload = useCallback(async () => {
    const imageUrl = await resolveImageUrl();
    const syncedVariants = mergeVariantsWithImage(
      syncVariantsForPlatforms(selectedPlatforms, variants, title, body, imageUrl),
      imageUrl
    );
    return {
      channelId: channelId!,
      campaignId: effectiveCampaignId ?? undefined,
      title: title.trim() || "Untitled post",
      contentType: defaultContentType(
        selectedPlatforms[0] ?? channelAccounts[0]?.platform ?? null
      ),
      contentJson: buildContentJson(),
      imageUrl,
      prompt: prompt.trim() || undefined,
      aiModel: post?.aiModel,
      postVariants: syncedVariants,
    };
  }, [
    body,
    buildContentJson,
    channelAccounts,
    channelId,
    effectiveCampaignId,
    post?.aiModel,
    prompt,
    resolveImageUrl,
    selectedPlatforms,
    title,
    variants,
  ]);

  usePostAutosave({
    enabled:
      channelId != null &&
      !readOnly &&
      hydrated &&
      title.trim().length > 0 &&
      body.trim().length > 0,
    isDirty,
    isNew,
    postId: post?.id ?? null,
    buildPayload: buildAutosavePayload,
    onCreate: async (payload) => {
      const created = await createMutation.mutateAsync(payload);
      setSavedTitle(title);
      setSavedBody(body);
      setSavedImageUrl(payload.imageUrl);
      setVariants(payload.postVariants);
      navigate(postEditorPath(channelId!, created.id, effectiveCampaignId), { replace: true });
      return created.id;
    },
    onUpdate: async (postId, payload) => {
      await updateMutation.mutateAsync({ id: postId, data: payload });
      setSavedTitle(title);
      setSavedBody(body);
      setSavedImageUrl(payload.imageUrl);
      setVariants(payload.postVariants);
    },
    onSaveStateChange: (state, error) => {
      setSaveState(state);
      setAutosaveError(error ?? null);
    },
  });

  const navigateAfterOutboundSuccess = useCallback(
    (outcome: "published" | "scheduled") => {
      if (channelId == null) return;
      void queryClient.invalidateQueries({ queryKey: contentPostsKeys.lists() });
      if (post?.id) {
        void queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(post.id) });
      }
      const destination = effectiveCampaignId
        ? `${campaignPaths.posts(channelId, effectiveCampaignId)}?outcome=${outcome}`
        : `${channelPaths.content(channelId)}?outcome=${outcome}`;
      navigate(destination);
    },
    [channelId, effectiveCampaignId, navigate, post?.id, queryClient]
  );

  if (!channelId) return null;

  const status = post?.status ?? null;
  const isPublished = status === ContentStatus.Published;
  const saveRequired = isNew || !post;
  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    isPublishing ||
    imageUploading;

  const handleImageFileSelect = (file: File | null) => {
    if (!file || readOnly) return;
    setImageFile(file);
    setStatusMessage(null);
    void (async () => {
      setImageUploading(true);
      try {
        const upload = await uploadGenerateImage(file);
        setUploadedImageUrl(upload.url);
        setImageFile(null);
        setStatusMessage({ severity: "success", text: "Image uploaded." });
      } catch (error) {
        setImageFile(null);
        setStatusMessage({
          severity: "error",
          text: error instanceof Error ? error.message : "Image upload failed.",
        });
      } finally {
        setImageUploading(false);
      }
    })();
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setUploadedImageUrl(null);
  };

  const handleAiGenerate = () => {
    void (async () => {
      if (!prompt.trim()) {
        setStatusMessage({
          severity: "error",
          text: "Add a prompt or short brief so the AI knows what to draft.",
        });
        return;
      }

      setStatusMessage(null);
      setAiBusy(true);
      setAiProgress(20);

      try {
        const { generatePost } = await import("../../ai/ai.api");
        const result = await generatePost({
          prompt: prompt.trim(),
          channelId: channelId ?? undefined,
          campaignId: effectiveCampaignId ?? undefined,
        });

        const parsed = JSON.parse(result.contentJson) as { text?: string };
        const draft = parsed.text?.trim() ?? result.contentJson;
        setBody((current) => (current.trim() ? `${current}\n\n${draft}` : draft));
        setAiProgress(100);
        setStatusMessage({ severity: "success", text: "AI draft inserted into master editor." });
      } catch (error) {
        setStatusMessage({
          severity: "error",
          text: formatAiError(error),
        });
      } finally {
        setAiBusy(false);
      }
    })();
  };

  const handleGenerateVisual = () => {
    void (async () => {
      if (isNew || !post) {
        setStatusMessage({ severity: "info", text: "Save the draft before generating a visual." });
        return;
      }

      if (isDirty) {
        setStatusMessage({
          severity: "warning",
          text: "Save your draft first so the AI uses your latest copy.",
        });
        return;
      }

      if (!body.trim() && !title.trim()) {
        setStatusMessage({
          severity: "error",
          text: "Add title or body content before generating a visual.",
        });
        return;
      }

      setStatusMessage(null);
      setCreativeBusy(true);

      try {
        const platform = selectedPlatforms[0];
        const result = await generatePostCreative({
          contentPostId: post.id,
          platform,
          language: "English",
          persistToPost: true,
        });

        if (result.posterUrl) {
          setUploadedImageUrl(result.posterUrl);
          setSavedImageUrl(result.posterUrl);
        }

        await queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(post.id) });
        setStatusMessage({
          severity: "success",
          text:
            result.creativeMode === "carousel"
              ? `Carousel visual generated (${result.carouselAssets.length} slide(s)).`
              : "Poster visual generated.",
        });
      } catch (error) {
        setStatusMessage({
          severity: "error",
          text: formatCreativeError(error),
        });
      } finally {
        setCreativeBusy(false);
      }
    })();
  };

  const persistBeforePublishing = async () => {
    if (!post) return;
    const imageUrl = await resolveImageUrl();
    const syncedVariants = mergeVariantsWithImage(
      syncVariantsForPlatforms(selectedPlatforms, variants, title, body, imageUrl),
      imageUrl
    );
    setVariants(syncedVariants);
    await updateMutation.mutateAsync({
      id: post.id,
      data: {
        channelId,
        campaignId: effectiveCampaignId ?? undefined,
        title: title.trim() || "Untitled post",
        contentType: post.contentType,
        contentJson: buildContentJson(),
        imageUrl,
        prompt: prompt.trim() || undefined,
        aiModel: post.aiModel,
        postVariants: syncedVariants,
      },
    });
    if (post.status === ContentStatus.Draft) {
      await markContentPostReady(post.id);
      await queryClient.invalidateQueries({ queryKey: contentPostsKeys.detail(post.id) });
    }
    setSavedBody(body);
    setSavedTitle(title);
    setSavedImageUrl(imageUrl);
  };

  const handleSchedule = async () => {
    if (!post) return;
    const scheduledUtc = new Date(scheduledAt);
    if (Number.isNaN(scheduledUtc.getTime()) || scheduledUtc <= new Date()) {
      setStatusMessage({ severity: "error", text: "Scheduled time must be in the future." });
      return;
    }
    const readyPlatforms = getReadyPlatforms(
      selectedPlatforms,
      variants,
      channelAccounts,
      effectiveImageUrl
    );
    const targets = resolvePublishTargets(
      readyPlatforms,
      selectedByPlatform,
      channelAccounts
    );
    if (targets.length === 0) {
      setStatusMessage({
        severity: "error",
        text: "No platforms are ready to schedule. Add copy, link accounts, and an image for Instagram if needed.",
      });
      return;
    }
    setStatusMessage(null);
    try {
      await persistBeforePublishing();
      const result = await scheduleToTargets(targets, scheduledUtc.toISOString());
      if (result.scheduled === result.total) {
        navigateAfterOutboundSuccess("scheduled");
        return;
      } else {
        setStatusMessage({
          severity: "warning",
          text: `Scheduled ${result.scheduled} of ${result.total}. Check errors below.`,
        });
      }
    } catch (error) {
      setStatusMessage({
        severity: "error",
        text: error instanceof Error ? error.message : "Scheduling failed.",
      });
    }
  };

  const handlePublishNow = async () => {
    if (!post) return;
    const readyPlatforms = getReadyPlatforms(
      selectedPlatforms,
      variants,
      channelAccounts,
      effectiveImageUrl
    );
    const targets = resolvePublishTargets(
      readyPlatforms,
      selectedByPlatform,
      channelAccounts
    );
    if (targets.length === 0) {
      setStatusMessage({
        severity: "error",
        text: "No platforms are ready to publish. Add copy, link accounts, and an image for Instagram if needed.",
      });
      return;
    }
    setStatusMessage(null);
    try {
      await persistBeforePublishing();
      const result = await publishToTargets(targets);
      if (result.published === result.total) {
        navigateAfterOutboundSuccess("published");
        return;
      } else {
        setStatusMessage({
          severity: "warning",
          text: `Published ${result.published} of ${result.total}. See per-platform status below.`,
        });
      }
    } catch (error) {
      setStatusMessage({
        severity: "error",
        text: error instanceof Error ? error.message : "Publishing failed.",
      });
    }
  };

  const publishMessage =
    statusMessage &&
    (statusMessage.text.includes("Publish") ||
      statusMessage.text.includes("Schedul") ||
      statusMessage.text.includes("platform"))
      ? statusMessage
      : null;

  if (isLoadingPost) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={320} />
      </Stack>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={
          channel
            ? [
                { label: "Channels", to: ROUTES.channels },
                { label: channel.name, to: channelPaths.overview(channel.id) },
                ...(campaign && effectiveCampaignId
                  ? [
                      {
                        label: campaign.name,
                        to: campaignPaths.posts(channel.id, effectiveCampaignId),
                      },
                    ]
                  : []),
                { label: isNew ? "New post" : post?.title || "Post" },
              ]
            : []
        }
        eyebrow={isNew ? "NEW POST" : "EDIT POST"}
        title={isNew ? "Compose new post" : post?.title || "Edit post"}
        subtitle={
          campaign
            ? `Editorial workspace inside campaign "${campaign.name}".`
            : "Channel post — assign to a campaign from Settings if needed."
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="text"
              size="small"
              startIcon={<ArrowLeft size={14} />}
              onClick={() =>
                navigate(
                  effectiveCampaignId
                    ? campaignPaths.posts(channelId, effectiveCampaignId)
                    : channelPaths.content(channelId)
                )
              }
            >
              {effectiveCampaignId ? "Back to posts" : "Back to content"}
            </Button>
          </Stack>
        }
      />

      {readOnly ? <ReadOnlyBanner /> : null}

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
          alignItems: "flex-start",
        }}
      >
        <Stack spacing={2}>
          <PostPlatformTargetsPanel
            channelAccounts={channelAccounts}
            selectedPlatforms={selectedPlatforms}
            onSelectedPlatformsChange={handlePlatformsChange}
            disabled={readOnly}
          />

          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: 0.75,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.18),
                    color: "primary.main",
                  }}
                >
                  <Sparkles size={13} />
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Brief & AI draft
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Master copy used across platforms
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <TextField
                multiline
                minRows={3}
                placeholder="Topic, angle, key messaging, references..."
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={readOnly}
              />

              {aiBusy ? <LinearProgress variant="determinate" value={aiProgress} /> : null}

              <Button
                size="small"
                variant="outlined"
                startIcon={<Sparkles size={14} />}
                onClick={handleAiGenerate}
                disabled={readOnly || aiBusy || !prompt.trim()}
                sx={{ alignSelf: "flex-start" }}
              >
                {aiBusy ? "Generating..." : "Generate draft"}
              </Button>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: 0.75,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(theme.palette.secondary.main, 0.18),
                  color: "secondary.main",
                }}
              >
                <FileEdit size={13} />
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Master content
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <TextField
                fullWidth
                placeholder="Post title..."
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={readOnly}
                inputProps={{ style: { fontSize: 18, fontWeight: 600 } }}
              />
              <TextField
                fullWidth
                multiline
                minRows={10}
                placeholder="Write master copy here, or generate a draft above..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={readOnly}
              />
              <Typography variant="caption" color="text.secondary">
                {body.length} characters{isDirty ? " · unsaved changes" : ""}
              </Typography>

              <PostMasterImageUpload
                previewUrl={effectiveImageUrl}
                requiresForInstagram={requiresInstagramImage}
                disabled={readOnly}
                uploading={imageUploading}
                onFileSelect={handleImageFileSelect}
                onRemove={handleRemoveImage}
              />

              {!isNew ? (
                <Stack spacing={1.25}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    startIcon={<ImageIcon size={14} />}
                    onClick={handleGenerateVisual}
                    disabled={readOnly || creativeBusy || aiBusy || isDirty}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {creativeBusy ? "Generating visual..." : "Generate visual"}
                  </Button>
                  {isDirty ? (
                    <Typography variant="caption" color="text.secondary">
                      Save your draft to enable AI visual generation.
                    </Typography>
                  ) : null}
                  {creativeBusy ? <LinearProgress /> : null}
                  {creativeAssets?.posterUrl ? (
                    <Box
                      component="img"
                      src={creativeAssets.posterUrl}
                      alt="AI generated poster"
                      sx={{
                        width: "100%",
                        maxHeight: 220,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    />
                  ) : null}
                  {creativeAssets?.carouselAssets && creativeAssets.carouselAssets.length > 1 ? (
                    <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
                      {creativeAssets.carouselAssets.map((url) => (
                        <Box
                          key={url}
                          component="img"
                          src={url}
                          alt="Carousel slide"
                          sx={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </Stack>
                  ) : null}
                  {creativeAssets?.creativeError ? (
                    <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                      {creativeAssets.creativeError}
                    </Alert>
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </Paper>

          <PostVariantsWorkspace
            selectedPlatforms={selectedPlatforms}
            variants={variants}
            onVariantsChange={setVariants}
            masterTitle={title}
            masterBody={body}
            imageUrl={effectiveImageUrl}
            brandName={brandName}
            disabled={readOnly}
          />

          {statusMessage && !publishMessage ? (
            <Alert
              severity={statusMessage.severity}
              onClose={() => setStatusMessage(null)}
            >
              {statusMessage.text}
            </Alert>
          ) : null}
        </Stack>

        <Stack spacing={2}>
          <AiContextStack
            brandStudioName={brandName}
            channelName={channel?.name ?? null}
            campaignName={campaign?.name ?? null}
            campaignObjective={campaign?.description ?? null}
          />

          <SaveStatusPanel saveState={saveState} errorMessage={autosaveError} />

          <CampaignPublishDestinationsPanel
            saveRequired={saveRequired}
            readOnly={readOnly}
            isPublished={isPublished}
            selectedPlatforms={selectedPlatforms}
            variants={variants}
            channelAccounts={channelAccounts}
            selectedByPlatform={selectedByPlatform}
            onSelectedByPlatformChange={setSelectedByPlatform}
            platformPublishState={platformState}
            platformPublishErrors={platformErrors}
            imageUrl={effectiveImageUrl}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            isPublishing={isPublishing}
            onPublish={handlePublishNow}
            onSchedule={handleSchedule}
            message={publishMessage}
          />
        </Stack>
      </Box>
    </>
  );
}
