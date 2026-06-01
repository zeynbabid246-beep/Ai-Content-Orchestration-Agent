import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileEdit, Sparkles } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../../campaigns/hooks/useCampaignContext";
import {
  useContentPost,
  useCreateContentPost,
  usePublishContentPost,
  useScheduleContentPost,
  useTransitionContentPostStatus,
  useUpdateContentPost,
} from "../../content-posts/content-posts.queries";
import {
  ContentStatus,
  ContentType,
  SocialPlatform,
  type ContentPostVariant,
} from "../../content-posts/content-posts.types";
import type { SocialAccount } from "../../social-media/social-accounts.types";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useBrandStudio } from "../../brand-studio/hooks/useBrandStudio";
import { PageHeader } from "../../../shared/ui/PageHeader";
import { campaignPaths, channelPaths, ROUTES } from "../../../shared/lib/routes";
import { AiContextStack } from "../components/AiContextStack";
import { VariantsPanel } from "../components/VariantsPanel";
import { PublishingOptionsPanel } from "../components/PublishingOptionsPanel";
import { EditorialStatePanel } from "../components/EditorialStatePanel";
import { usePostParam } from "../hooks/usePostParam";

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

function variantsIncludingAccountPlatform(
  current: ContentPostVariant[],
  account: SocialAccount,
  editorTitle: string,
  editorBody: string
): ContentPostVariant[] {
  if (current.some((v) => v.platform === account.platform)) {
    return current;
  }
  return [
    ...current,
    {
      platform: account.platform,
      title: editorTitle.trim() || "Post",
      contentJson: JSON.stringify({ text: editorBody, platform: account.platform }),
    },
  ];
}

function defaultContentType(platform: SocialPlatform | null): ContentType {
  switch (platform) {
    case SocialPlatform.LinkedIn:
      return ContentType.LinkedInPost;
    case SocialPlatform.Facebook:
      return ContentType.FacebookPost;
    case SocialPlatform.Instagram:
      return ContentType.InstagramPost;
    default:
      return ContentType.LinkedInPost;
  }
}

export function PostEditorPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const { channelId, channel } = useChannelContext();
  const { campaignId, campaign } = useCampaignContext();
  const postId = usePostParam();
  const isNew = postId === null;

  const postQuery = useContentPost(postId ?? 0);
  const { data: brandStudioSnapshot } = useBrandStudio();
  const { data: allAccounts = [] } = useSocialAccounts();

  const createMutation = useCreateContentPost();
  const updateMutation = useUpdateContentPost();
  const transitionMutation = useTransitionContentPostStatus();
  const scheduleMutation = useScheduleContentPost();
  const publishMutation = usePublishContentPost();

  const post = isNew ? null : postQuery.data ?? null;
  const isLoadingPost = !isNew && postQuery.isLoading;

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [body, setBody] = useState("");
  const [variants, setVariants] = useState<ContentPostVariant[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | "">("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ severity: "success" | "error" | "info"; text: string } | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [savedBody, setSavedBody] = useState("");

  // Hydrate when editing an existing post (one-time sync from server-fetched post into editor state).
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
    setVariants(post.postVariants ?? []);
    setSavedTitle(post.title);
    setSavedBody(parsed.text ?? "");
    setHydrated(true);
  }, [post, isNew, hydrated]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const channelAccounts = useMemo(
    () => allAccounts.filter((account) => account.channelId === channelId),
    [allAccounts, channelId]
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!channelAccounts.length) {
      setSelectedAccountId("");
      return;
    }
    setSelectedAccountId((current) => {
      if (current && channelAccounts.some((account) => account.id === current)) {
        return current;
      }
      return channelAccounts[0].id;
    });
  }, [channelAccounts]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!channelId || !campaignId) return null;

  const isDirty = isNew
    ? title.length > 0 || body.length > 0
    : title !== savedTitle || body !== savedBody;

  const status = post?.status ?? null;
  const isApproved = status === ContentStatus.Approved;
  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    transitionMutation.isPending ||
    scheduleMutation.isPending ||
    publishMutation.isPending;

  const handleAddVariant = (platform: SocialPlatform) => {
    setVariants((prev) => [
      ...prev,
      {
        platform,
        title: title || "Variant",
        contentJson: JSON.stringify({ text: body, platform }),
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
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
          campaignId: campaignId ?? undefined,
        });

        const parsed = JSON.parse(result.contentJson) as { text?: string };
        const draft = parsed.text?.trim() ?? result.contentJson;
        setBody((current) => (current.trim() ? `${current}\n\n${draft}` : draft));
        setAiProgress(100);
        setStatusMessage({ severity: "success", text: "AI draft inserted into editor." });
      } catch (error) {
        setStatusMessage({
          severity: "error",
          text: error instanceof Error ? error.message : "AI generation failed.",
        });
      } finally {
        setAiBusy(false);
      }
    })();
  };

  const buildContentJson = () =>
    JSON.stringify({
      text: body,
      prompt,
      channelId,
      campaignId,
    });

  const handleSave = () => {
    setStatusMessage(null);
    const contentJson = buildContentJson();
    const contentType = defaultContentType(
      channelAccounts[0]?.platform ?? null
    );

    if (isNew) {
      createMutation.mutate(
        {
          channelId,
          campaignId,
          title: title.trim() || "Untitled post",
          contentType,
          contentJson,
          prompt: prompt.trim() || undefined,
          aiModel: "manual",
          postVariants: variants,
        },
        {
          onSuccess: (created) => {
            navigate(campaignPaths.post(channelId, campaignId, created.id), {
              replace: true,
            });
            setStatusMessage({ severity: "success", text: "Draft saved." });
          },
          onError: (error) =>
            setStatusMessage({
              severity: "error",
              text: error instanceof Error ? error.message : "Failed to save draft.",
            }),
        }
      );
      return;
    }

    if (!post) return;
    updateMutation.mutate(
      {
        id: post.id,
        data: {
          channelId,
          campaignId,
          title: title.trim() || "Untitled post",
          contentType: post.contentType,
          contentJson,
          status: post.status,
          prompt: prompt.trim() || undefined,
          aiModel: post.aiModel,
          postVariants: variants,
        },
      },
      {
        onSuccess: () => {
          setSavedBody(body);
          setSavedTitle(title);
          setStatusMessage({ severity: "success", text: "Draft saved." });
        },
        onError: (error) =>
          setStatusMessage({
            severity: "error",
            text: error instanceof Error ? error.message : "Failed to save draft.",
          }),
      }
    );
  };

  const handleTransition = (next: ContentStatus) => {
    if (!post) {
      setStatusMessage({ severity: "info", text: "Save the draft first." });
      return;
    }
    transitionMutation.mutate(
      { id: post.id, data: { status: next } },
      {
        onSuccess: () =>
          setStatusMessage({
            severity: "success",
            text: `Post moved to ${next}.`,
          }),
        onError: (error) =>
          setStatusMessage({
            severity: "error",
            text: error instanceof Error ? error.message : "Transition failed.",
          }),
      }
    );
  };

  /** Persist editor + ensure a saved variant for the selected account (required by the publishing API / worker). */
  const persistBeforePublishing = async () => {
    if (!post || selectedAccountId === "") return;
    const account = channelAccounts.find((a) => a.id === selectedAccountId);
    if (!account) {
      throw new Error("Selected publishing account was not found for this channel.");
    }

    const nextVariants = variantsIncludingAccountPlatform(variants, account, title, body);
    if (nextVariants.length !== variants.length) {
      setVariants(nextVariants);
    }

    await updateMutation.mutateAsync({
      id: post.id,
      data: {
        channelId,
        campaignId,
        title: title.trim() || "Untitled post",
        contentType: post.contentType,
        contentJson: buildContentJson(),
        status: post.status,
        prompt: prompt.trim() || undefined,
        aiModel: post.aiModel,
        postVariants: nextVariants,
      },
    });
    setSavedBody(body);
    setSavedTitle(title);
  };

  const handleSchedule = async () => {
    if (!post || !selectedAccountId) return;
    const scheduledUtc = new Date(scheduledAt);
    if (Number.isNaN(scheduledUtc.getTime()) || scheduledUtc <= new Date()) {
      setStatusMessage({ severity: "error", text: "Scheduled time must be in the future." });
      return;
    }
    setStatusMessage(null);
    try {
      await persistBeforePublishing();
      await scheduleMutation.mutateAsync({
        id: post.id,
        data: {
          socialAccountId: selectedAccountId,
          postVariantId: null,
          scheduledAt: scheduledUtc.toISOString(),
          idempotencyKey: `post-${post.id}-${scheduledUtc.getTime()}`,
        },
      });
      setStatusMessage({ severity: "success", text: "Post scheduled successfully." });
    } catch (error) {
      setStatusMessage({
        severity: "error",
        text: error instanceof Error ? error.message : "Scheduling failed.",
      });
    }
  };

  const handlePublishNow = async () => {
    if (!post || !selectedAccountId) return;
    setStatusMessage(null);
    try {
      await persistBeforePublishing();
      await publishMutation.mutateAsync({
        id: post.id,
        data: {
          socialAccountId: selectedAccountId,
          postVariantId: null,
          idempotencyKey: `publish-${post.id}-${Date.now()}`,
        },
      });
      setStatusMessage({ severity: "success", text: "Publish requested." });
    } catch (error) {
      setStatusMessage({
        severity: "error",
        text: error instanceof Error ? error.message : "Publishing failed.",
      });
    }
  };

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
          channel && campaign
            ? [
                { label: "Channels", to: ROUTES.channels },
                { label: channel.name, to: channelPaths.overview(channel.id) },
                { label: campaign.name, to: campaignPaths.posts(channel.id, campaign.id) },
                { label: isNew ? "New post" : post?.title || "Post" },
              ]
            : []
        }
        eyebrow={isNew ? "NEW POST" : "EDIT POST"}
        title={isNew ? "Compose new post" : post?.title || "Edit post"}
        subtitle={
          campaign
            ? `Editorial workspace inside campaign "${campaign.name}". Publishing actions are separated from editorial state.`
            : undefined
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="text"
              size="small"
              startIcon={<ArrowLeft size={14} />}
              onClick={() => navigate(campaignPaths.posts(channelId, campaignId))}
            >
              Back to posts
            </Button>
          </Stack>
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
          alignItems: "flex-start",
        }}
      >
        <Stack spacing={2}>
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
                  Prompt & context
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                What should the AI know to draft this post?
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <TextField
                multiline
                minRows={3}
                placeholder="Topic, angle, key messaging, references..."
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />

              {aiBusy ? <LinearProgress variant="determinate" value={aiProgress} /> : null}

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Sparkles size={14} />}
                  onClick={handleAiGenerate}
                  disabled={aiBusy || !prompt.trim()}
                >
                  {aiBusy ? "Generating..." : "Generate with AI"}
                </Button>
              </Stack>
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
                Editor
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              <TextField
                fullWidth
                placeholder="Post title..."
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                inputProps={{ style: { fontSize: 18, fontWeight: 600 } }}
              />
              <TextField
                fullWidth
                multiline
                minRows={14}
                placeholder="Write your post here, or use 'Generate with AI' above..."
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {body.length} characters{isDirty ? " · unsaved changes" : ""}
                </Typography>
                {statusMessage ? (
                  <Alert
                    severity={statusMessage.severity}
                    onClose={() => setStatusMessage(null)}
                    sx={{ py: 0, fontSize: 12 }}
                  >
                    {statusMessage.text}
                  </Alert>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <AiContextStack
            brandStudioName={
              brandStudioSnapshot?.brandStudio?.parsedProfile.brandName ??
              brandStudioSnapshot?.brandStudio?.parsedProfile.websiteUrl ??
              null
            }
            channelName={channel?.name ?? null}
            campaignName={campaign?.name ?? null}
            campaignObjective={campaign?.description ?? null}
          />

          <EditorialStatePanel
            status={status}
            isDirty={isDirty}
            busy={busy}
            canSubmit={title.trim().length > 0 && body.trim().length > 0}
            onSaveDraft={handleSave}
            onSubmitReview={() => handleTransition(ContentStatus.Review)}
            onApprove={() => handleTransition(ContentStatus.Approved)}
          />

          <VariantsPanel
            variants={variants}
            onAddVariant={handleAddVariant}
            onRemoveVariant={handleRemoveVariant}
          />

          <PublishingOptionsPanel
            disabled={isNew || !post}
            approved={isApproved}
            publishedAt={post?.publishedAt ?? null}
            scheduledAt={scheduledAt}
            onScheduledAtChange={setScheduledAt}
            selectedAccountId={selectedAccountId}
            onSelectedAccountIdChange={setSelectedAccountId}
            accounts={channelAccounts}
            onSchedule={handleSchedule}
            onPublishNow={handlePublishNow}
            busy={busy}
            message={
              statusMessage &&
              ["Publish", "Schedul"].some((keyword) => statusMessage.text.includes(keyword))
                ? { severity: statusMessage.severity, text: statusMessage.text }
                : null
            }
          />
        </Stack>
      </Box>
    </>
  );
}
