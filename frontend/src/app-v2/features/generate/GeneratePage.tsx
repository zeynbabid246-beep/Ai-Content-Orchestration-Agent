import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Select,
  OutlinedInput,
  Chip,
} from "@mui/material";

import { GoldButton } from "../../shared/ui/GoldButton";
import { useSocialAccounts } from "../social-media/social-accounts.queries";
import { getSocialAuthLoginUrl } from "../social-media/social-auth.api";
import { ContentStatus, ContentType, SocialPlatform } from "../content-posts/content-posts.types";
import {
  createContentPost,
  publishContentPost,
  scheduleContentPost,
  transitionContentPostStatus,
} from "../content-posts/content-posts.api";
import { uploadGenerateImage } from "./media.api";

const PLATFORMS = [
  "LinkedIn Post",
  "Instagram Post",
  "Facebook Post",
  "Twitter / X",
  "Blog Article",
  "Instagram Story",
];

const LANGUAGES = ["English", "French", "Arabic"];

export function GeneratePage() {
  const { data: socialAccounts = [], refetch: refetchSocialAccounts } = useSocialAccounts();

  const [topic, setTopic] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [audience, setAudience] = useState("");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState<{ severity: "success" | "error"; text: string } | null>(null);
  const [selectedSocialAccountId, setSelectedSocialAccountId] = useState<number | "">("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
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

  const generate = () => {
    if (!topic.trim()) {
      setError("Please enter a topic first.");
      return;
    }

    setError("");
    setLoading(true);
    setProgress(10);
    setOutput("");

    setTimeout(() => setProgress(50), 400);
    setTimeout(() => setProgress(85), 900);

    setTimeout(() => {
      setOutput(
        `Topic: ${topic}\nPlatforms: ${platforms.join(
          ", "
        )}\nLanguage: ${language}\nAudience: ${audience}`
      );
      setProgress(100);
      setLoading(false);
    }, 1400);
  };

  const saveDraft = () => {
    const draft = { topic, platforms, language, audience, output };
    localStorage.setItem("draft_content", JSON.stringify(draft));
    alert("Draft saved!");
  };

  const publish = () => {
    void (async () => {
      if (!selectedSocialAccountId) {
        setActionMessage({ severity: "error", text: "Connect and select a social account first." });
        return;
      }

      if (!output.trim()) {
        setActionMessage({ severity: "error", text: "Write some content before publishing." });
        return;
      }

      const selectedAccount = activeSocialAccounts.find((account) => account.id === selectedSocialAccountId);
      if (!selectedAccount) {
        setActionMessage({ severity: "error", text: "Selected social account is unavailable." });
        return;
      }

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        let resolvedImageUrl = uploadedImageUrl;
        if (imageFile && !resolvedImageUrl) {
          const upload = await uploadGenerateImage(imageFile);
          resolvedImageUrl = upload.url;
          setUploadedImageUrl(upload.url);
        }

        const contentType =
          selectedAccount.platform === SocialPlatform.Facebook
            ? ContentType.FacebookPost
            : ContentType.LinkedInPost;

        const contentJson = JSON.stringify({
          text: output,
          topic,
          language,
          audience,
          platformHints: platforms,
          imageUrl: resolvedImageUrl ?? undefined,
        });

        const created = await createContentPost({
          channelId: selectedAccount.channelId,
          campaignId: null,
          title: topic.trim() || "Quick post",
          contentType,
          contentJson,
          imageUrl: resolvedImageUrl ?? undefined,
          prompt: topic.trim() || undefined,
          aiModel: "manual",
          postVariants: [
            {
              platform: selectedAccount.platform,
              contentJson,
              title: topic.trim() || "Quick post",
            },
          ],
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
      if (!selectedSocialAccountId) {
        setActionMessage({ severity: "error", text: "Connect and select a social account first." });
        return;
      }

      if (!scheduledAt) {
        setActionMessage({ severity: "error", text: "Choose date and time for scheduling." });
        return;
      }

      if (!output.trim()) {
        setActionMessage({ severity: "error", text: "Write some content before scheduling." });
        return;
      }

      const selectedAccount = activeSocialAccounts.find((account) => account.id === selectedSocialAccountId);
      if (!selectedAccount) {
        setActionMessage({ severity: "error", text: "Selected social account is unavailable." });
        return;
      }

      const scheduledUtc = new Date(scheduledAt);
      if (Number.isNaN(scheduledUtc.getTime()) || scheduledUtc <= new Date()) {
        setActionMessage({ severity: "error", text: "Scheduled time must be in the future." });
        return;
      }

      try {
        setIsSubmitting(true);
        setActionMessage(null);
        let resolvedImageUrl = uploadedImageUrl;
        if (imageFile && !resolvedImageUrl) {
          const upload = await uploadGenerateImage(imageFile);
          resolvedImageUrl = upload.url;
          setUploadedImageUrl(upload.url);
        }

        const contentType =
          selectedAccount.platform === SocialPlatform.Facebook
            ? ContentType.FacebookPost
            : ContentType.LinkedInPost;

        const contentJson = JSON.stringify({
          text: output,
          topic,
          language,
          audience,
          platformHints: platforms,
          imageUrl: resolvedImageUrl ?? undefined,
        });

        const created = await createContentPost({
          channelId: selectedAccount.channelId,
          campaignId: null,
          title: topic.trim() || "Scheduled post",
          contentType,
          contentJson,
          imageUrl: resolvedImageUrl ?? undefined,
          prompt: topic.trim() || undefined,
          aiModel: "manual",
          postVariants: [
            {
              platform: selectedAccount.platform,
              contentJson,
              title: topic.trim() || "Scheduled post",
            },
          ],
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
        <Typography variant="h4">AI Content Generator</Typography>
        <Typography variant="body2" color="text.secondary">
          Create platform-optimized content in seconds
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Stack spacing={2} sx={{ flex: 2 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {actionMessage && <Alert severity={actionMessage.severity}>{actionMessage.text}</Alert>}

              <TextField
                multiline
                minRows={4}
                label="Topic / Brief"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <Select
                multiple
                value={platforms}
                onChange={(e) => setPlatforms(e.target.value as string[])}
                input={<OutlinedInput label="Platforms" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {PLATFORMS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                select
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <MenuItem key={l} value={l}>
                    {l}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Target Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                <Button component="label" variant="outlined">
                  {imageFile ? "Change Image" : "Add Image"}
                  <input
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setImageFile(file);
                      setUploadedImageUrl(null);
                    }}
                  />
                </Button>
                {imageFile && (
                  <Button
                    color="error"
                    variant="text"
                    onClick={() => {
                      setImageFile(null);
                      setUploadedImageUrl(null);
                    }}
                  >
                    Remove Image
                  </Button>
                )}
              </Stack>

              {imagePreviewUrl && (
                <Box
                  component="img"
                  src={imagePreviewUrl}
                  alt="Selected content preview"
                  sx={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 1, border: "1px solid", borderColor: "divider" }}
                />
              )}

              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const url = await getSocialAuthLoginUrl("linkedin");
                      window.location.href = url;
                    } catch (connectError) {
                      setActionMessage({
                        severity: "error",
                        text: connectError instanceof Error ? connectError.message : "Failed to start LinkedIn auth.",
                      });
                    }
                  }}
                >
                  Link LinkedIn
                </Button>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const url = await getSocialAuthLoginUrl("facebook");
                      window.location.href = url;
                    } catch (connectError) {
                      setActionMessage({
                        severity: "error",
                        text: connectError instanceof Error ? connectError.message : "Failed to start Facebook auth.",
                      });
                    }
                  }}
                >
                  Link Facebook
                </Button>
              </Stack>

              <TextField
                select
                label="Publishing account"
                value={selectedSocialAccountId}
                onChange={(event) => setSelectedSocialAccountId(Number(event.target.value))}
                helperText="Select the connected account to publish/schedule this content."
                disabled={activeSocialAccounts.length === 0}
              >
                {activeSocialAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.platform} - {account.displayName || account.accountHandle}
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

              <LinearProgress variant="determinate" value={progress} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">What's on your mind</Typography>

              <TextField
                multiline
                minRows={8}
                value={output}
                onChange={(event) => setOutput(event.target.value)}
                placeholder="What's on your mind..."
              />

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <GoldButton onClick={generate}>
                  Generate with AI
                </GoldButton>

                <GoldButton onClick={saveDraft}>
                  Save Draft
                </GoldButton>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "success.main",
                    "&:hover": { bgcolor: "success.dark" },
                  }}
                  onClick={publish}
                  disabled={isSubmitting || !selectedSocialAccountId}
                >
                  {isSubmitting ? "Processing..." : "Publish"}
                </Button>

                <GoldButton onClick={schedule} disabled={isSubmitting || !selectedSocialAccountId}>
                  {isSubmitting ? "Processing..." : "Schedule"}
                </GoldButton>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  );
}