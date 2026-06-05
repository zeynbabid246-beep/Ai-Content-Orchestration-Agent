import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Sparkles } from "lucide-react";
import { bulkCreateCampaignPosts } from "../campaigns.api";
import { useUpdateCampaign } from "../campaigns.queries";
import { useCampaignContext } from "../hooks/useCampaignContext";
import {
  formatAiError,
  generateCampaignContent,
  generateCampaignPlanning,
  generateCampaignStrategy,
} from "../../ai/ai.api";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useBrandStudio } from "../../brand-studio/hooks/useBrandStudio";
import { CampaignPlanningReviewEditor } from "./CampaignPlanningReviewEditor";
import { CampaignPostReviewList, type ReviewPost } from "./CampaignPostReviewList";
import { CampaignStrategyReviewEditor } from "./CampaignStrategyReviewEditor";
import {
  buildPipelineConfig,
  CampaignStrategyConfigForm,
  defaultStrategyConfig,
  type CampaignStrategyConfig,
} from "./CampaignStrategyConfigForm";
import type { AiPlanningProfile, AiStrategyProfile } from "../lib/campaignAi.types";

interface CampaignPlannerDialogProps {
  open: boolean;
  campaignId: number;
  channelId: number;
  onClose: () => void;
  onCompleted: () => void;
}

const STEPS = ["Configure", "Strategy", "Planning", "Content", "Create"];

export function CampaignPlannerDialog({
  open,
  campaignId,
  channelId,
  onClose,
  onCompleted,
}: CampaignPlannerDialogProps) {
  const { canMutateContent } = useTeamPermissions();
  const { campaign } = useCampaignContext();
  const updateCampaign = useUpdateCampaign();
  const { data: allAccounts = [] } = useSocialAccounts();
  const { data: brandSnapshot } = useBrandStudio();

  const brandOrgId = brandSnapshot?.brandStudio?.parsedProfile.orgId?.trim() ?? "";
  const hasBrand = Boolean(brandOrgId);
  const defaultTheme = campaign?.objective ?? campaign?.description ?? "";

  const [activeStep, setActiveStep] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [strategyConfig, setStrategyConfig] = useState<CampaignStrategyConfig>(() =>
    defaultStrategyConfig(brandOrgId, defaultTheme)
  );
  const [strategyProfile, setStrategyProfile] = useState<AiStrategyProfile | null>(null);
  const [strategyId, setStrategyId] = useState<number | null>(null);
  const [planningProfile, setPlanningProfile] = useState<AiPlanningProfile | null>(null);
  const [planningId, setPlanningId] = useState<number | null>(null);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleOnCreate, setScheduleOnCreate] = useState(false);
  const [accountByPlatform, setAccountByPlatform] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    setStrategyConfig((prev) => ({ ...prev, orgId: brandOrgId, theme: prev.theme || defaultTheme }));
    if (campaign) {
      setCampaignName(campaign.name);
      setDescription(campaign.description ?? campaign.objective ?? "");
    }
  }, [open, brandOrgId, defaultTheme, campaign]);

  const connectedPlatforms = useMemo(() => {
    const platforms = allAccounts
      .filter((a) => a.linkedChannelIds.includes(channelId))
      .map((a) => a.platform)
      .filter((p, i, arr) => arr.indexOf(p) === i);
    return platforms.length > 0 ? platforms : ["LinkedIn"];
  }, [allAccounts, channelId]);

  const channelAccounts = useMemo(
    () => allAccounts.filter((a) => a.linkedChannelIds.includes(channelId)),
    [allAccounts, channelId]
  );

  const pipelineConfig = () =>
    buildPipelineConfig(channelId, strategyConfig, startDate, endDate, connectedPlatforms);

  const canConfigure = hasBrand && strategyConfig.theme.trim() && startDate && endDate;

  if (!canMutateContent) return null;

  const runStrategy = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await generateCampaignStrategy(pipelineConfig());
      const profile = result.strategy as AiStrategyProfile;
      if (result.strategyId) profile.strategy_id = result.strategyId;
      setStrategyProfile(profile);
      setStrategyId(result.strategyId);
      setPlanningProfile(null);
      setPlanningId(null);
      setPosts([]);
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const runPlanning = async () => {
    if (!strategyProfile || !strategyId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateCampaignPlanning({
        config: pipelineConfig(),
        strategyId,
        strategy: strategyProfile,
      });
      const profile = result.planning as AiPlanningProfile;
      if (result.planningId) profile.planning_id = result.planningId;
      setPlanningProfile(profile);
      setPlanningId(result.planningId);
      setPosts([]);
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const runContent = async () => {
    if (!strategyProfile || !strategyId || !planningProfile || !planningId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateCampaignContent({
        config: pipelineConfig(),
        strategyId,
        strategy: strategyProfile,
        planningId,
        planning: planningProfile,
      });
      setPosts(
        result.posts.map((post) => ({
          title: post.title,
          contentJson: post.contentJson,
          contentType: post.contentType,
          scheduledAt: post.scheduledAt,
          platform: post.platform,
        }))
      );
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateCampaignMeta = () => {
    if (!campaign) return;
    updateCampaign.mutate({
      id: campaignId,
      data: {
        name: campaignName.trim() || campaign.name,
        description: description.trim() || undefined,
        channelId: campaign.channelId ?? channelId,
        status: campaign.status,
        objective: description.trim() || campaign.objective || undefined,
        toneOfVoiceOverride: campaign.toneOfVoiceOverride ?? undefined,
        targetAudienceOverride: campaign.targetAudienceOverride ?? undefined,
      },
    });
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await bulkCreateCampaignPosts(
        campaignId,
        posts.map((post) => ({
          title: post.title,
          contentJson: post.contentJson,
          contentType: post.contentType,
          scheduledAt: scheduleOnCreate ? post.scheduledAt : undefined,
          platform: post.platform,
          socialAccountId:
            scheduleOnCreate && accountByPlatform[post.platform]
              ? accountByPlatform[post.platform]
              : undefined,
        }))
      );
      onCompleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign posts.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Campaign planner</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Step {activeStep + 1} of {STEPS.length}: {STEPS[activeStep]}
          </Typography>
          {!hasBrand ? (
            <Alert severity="warning">Import and save Brand Studio first to lock a Brand ID.</Alert>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {activeStep === 0 ? (
            <Stack spacing={2}>
              <CampaignStrategyConfigForm
                value={strategyConfig}
                onChange={setStrategyConfig}
                lockedOrgId={brandOrgId}
                disabled={busy}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Start date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="End date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
            </Stack>
          ) : null}

          {activeStep === 1 ? (
            <Stack spacing={2}>
              <Button variant="outlined" startIcon={<Sparkles size={16} />} onClick={runStrategy} disabled={busy || !canConfigure}>
                {busy ? "Generating…" : strategyProfile ? "Regenerate strategy" : "Generate strategy"}
              </Button>
              {strategyProfile ? (
                <CampaignStrategyReviewEditor strategy={strategyProfile} onChange={setStrategyProfile} disabled={busy} />
              ) : null}
            </Stack>
          ) : null}

          {activeStep === 2 ? (
            <Stack spacing={2}>
              <Button variant="outlined" startIcon={<Sparkles size={16} />} onClick={runPlanning} disabled={busy || !strategyId}>
                {busy ? "Generating…" : planningProfile ? "Regenerate planning" : "Generate planning"}
              </Button>
              {planningProfile ? (
                <CampaignPlanningReviewEditor planning={planningProfile} onChange={setPlanningProfile} disabled={busy} />
              ) : null}
            </Stack>
          ) : null}

          {activeStep === 3 ? (
            <Stack spacing={2}>
              <Button variant="outlined" startIcon={<Sparkles size={16} />} onClick={runContent} disabled={busy || !planningId}>
                {busy ? "Generating…" : posts.length ? "Regenerate content" : "Generate content"}
              </Button>
              {posts.length > 0 ? (
                <CampaignPostReviewList posts={posts} onChange={setPosts} platformOptions={connectedPlatforms} />
              ) : null}
            </Stack>
          ) : null}

          {activeStep === 4 ? (
            <Stack spacing={2}>
              <TextField label="Campaign name" size="small" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} fullWidth />
              <TextField label="Description" size="small" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={2} />
              <Button size="small" variant="text" onClick={handleUpdateCampaignMeta} disabled={updateCampaign.isPending}>
                Update campaign metadata
              </Button>
              <FormControlLabel
                control={<Checkbox checked={scheduleOnCreate} onChange={(e) => setScheduleOnCreate(e.target.checked)} />}
                label="Schedule posts on create"
              />
              {scheduleOnCreate
                ? connectedPlatforms.map((platform) => {
                    const accounts = channelAccounts.filter((a) => a.platform === platform);
                    return (
                      <TextField
                        key={platform}
                        select
                        size="small"
                        label={`${platform} account`}
                        value={accountByPlatform[platform] ?? ""}
                        onChange={(e) =>
                          setAccountByPlatform((prev) => ({ ...prev, [platform]: Number(e.target.value) }))
                        }
                        fullWidth
                      >
                        <MenuItem value="">Draft only</MenuItem>
                        {accounts.map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.displayName || `Account #${a.id}`}
                          </MenuItem>
                        ))}
                      </TextField>
                    );
                  })
                : null}
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 ? <Button onClick={() => setActiveStep((s) => s - 1)}>Back</Button> : null}
        {activeStep < 4 ? (
          <Button
            variant="contained"
            disabled={
              busy ||
              (activeStep === 0 && !canConfigure) ||
              (activeStep === 1 && !strategyProfile) ||
              (activeStep === 2 && !planningProfile) ||
              (activeStep === 3 && posts.length === 0)
            }
            onClick={() => setActiveStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button variant="contained" onClick={handleCreate} disabled={busy || posts.length === 0}>
            Create posts
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
