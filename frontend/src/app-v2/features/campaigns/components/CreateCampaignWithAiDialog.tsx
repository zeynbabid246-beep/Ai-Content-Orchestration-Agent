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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useBrandStudio } from "../../brand-studio/hooks/useBrandStudio";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import {
  formatAiError,
  generateCampaignContent,
  generateCampaignPlanning,
  generateCampaignStrategy,
  materializeCampaign,
} from "../../ai/ai.api";
import { CampaignPlanningReviewEditor } from "./CampaignPlanningReviewEditor";
import { CampaignPostReviewList, type ReviewPost } from "./CampaignPostReviewList";
import { CampaignStrategyReviewEditor } from "./CampaignStrategyReviewEditor";
import {
  buildPipelineConfig,
  CampaignStrategyConfigForm,
  defaultStrategyConfig,
  type CampaignStrategyConfig,
} from "./CampaignStrategyConfigForm";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { campaignPaths, ROUTES } from "../../../shared/lib/routes";
import type { AiPlanningProfile, AiStrategyProfile } from "../lib/campaignAi.types";

interface CreateCampaignWithAiDialogProps {
  open: boolean;
  channelId: number;
  channelName?: string;
  onClose: () => void;
  onCompleted: () => void;
}

const STEPS = ["Configure", "Strategy", "Planning", "Content", "Finalize", "Schedule"];

export function CreateCampaignWithAiDialog({
  open,
  channelId,
  channelName,
  onClose,
  onCompleted,
}: CreateCampaignWithAiDialogProps) {
  const navigate = useNavigate();
  const { canMutateContent } = useTeamPermissions();
  const { data: brandSnapshot } = useBrandStudio();
  const { data: allAccounts = [] } = useSocialAccounts();

  const brandOrgId = brandSnapshot?.brandStudio?.parsedProfile.orgId?.trim() ?? "";
  const hasBrand = Boolean(brandOrgId);

  const [activeStep, setActiveStep] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [strategyConfig, setStrategyConfig] = useState<CampaignStrategyConfig>(() =>
    defaultStrategyConfig(brandOrgId, channelName ?? "")
  );
  const [strategyProfile, setStrategyProfile] = useState<AiStrategyProfile | null>(null);
  const [strategyId, setStrategyId] = useState<number | null>(null);
  const [planningProfile, setPlanningProfile] = useState<AiPlanningProfile | null>(null);
  const [planningId, setPlanningId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [schedulePosts, setSchedulePosts] = useState(false);
  const [accountByPlatform, setAccountByPlatform] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    setStrategyConfig((prev) => ({
      ...prev,
      orgId: brandOrgId,
      theme: prev.theme || channelName || "",
    }));
  }, [open, brandOrgId, channelName]);

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

  const canConfigure =
    hasBrand &&
    strategyConfig.theme.trim().length > 0 &&
    Boolean(startDate) &&
    Boolean(endDate);

  const reset = () => {
    setActiveStep(0);
    setStartDate("");
    setEndDate("");
    setStrategyConfig(defaultStrategyConfig(brandOrgId, channelName ?? ""));
    setStrategyProfile(null);
    setStrategyId(null);
    setPlanningProfile(null);
    setPlanningId(null);
    setCampaignName("");
    setDescription("");
    setPosts([]);
    setSchedulePosts(false);
    setAccountByPlatform({});
    setError(null);
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose();
  };

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
      setCampaignName(result.campaignName);
      setDescription(result.description);
      setPosts(
        result.posts.map((p) => ({
          title: p.title,
          contentJson: p.contentJson,
          contentType: p.contentType,
          scheduledAt: p.scheduledAt,
          platform: p.platform,
        }))
      );
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleMaterialize = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await materializeCampaign({
        ...pipelineConfig(),
        runSuggest: false,
        campaignName: campaignName.trim() || undefined,
        description: description.trim() || undefined,
        posts: posts.map((p) => ({
          title: p.title,
          contentJson: p.contentJson,
          contentType: p.contentType,
          scheduledAt: p.scheduledAt,
          platform: p.platform,
        })),
        schedulePosts,
        socialAccountIdByPlatform: schedulePosts ? accountByPlatform : undefined,
      });
      onCompleted();
      handleClose();
      navigate(campaignPaths.posts(channelId, result.campaignId));
    } catch (err) {
      setError(formatAiError(err));
    } finally {
      setBusy(false);
    }
  };

  if (!canMutateContent || !open) return null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="overline" color="primary.main">
          AI campaign
        </Typography>
        <Typography variant="h6">Create campaign with AI</Typography>
        {channelName ? (
          <Typography variant="body2" color="text.secondary">
            Channel: {channelName}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Step {activeStep + 1} of {STEPS.length}: {STEPS[activeStep]}
          </Typography>

          {!hasBrand ? (
            <Alert severity="warning">
              Import a website in{" "}
              <Button component={RouterLink} to={ROUTES.brandStudio} size="small">
                Brand Studio
              </Button>{" "}
              and save the profile so a Brand ID (org_id) is set before using AI campaigns.
            </Alert>
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
                  disabled={busy}
                />
                <TextField
                  label="End date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={busy}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Platforms: {connectedPlatforms.join(", ")}
              </Typography>
            </Stack>
          ) : null}

          {activeStep === 1 ? (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Sparkles size={16} />}
                onClick={runStrategy}
                disabled={busy || !canConfigure}
              >
                {busy ? "Generating strategy…" : strategyProfile ? "Regenerate strategy" : "Generate strategy"}
              </Button>
              {strategyProfile ? (
                <CampaignStrategyReviewEditor
                  strategy={strategyProfile}
                  onChange={setStrategyProfile}
                  disabled={busy}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Step 1 produces your marketing strategy (summary, pillars, positioning). Edit it before planning.
                </Typography>
              )}
            </Stack>
          ) : null}

          {activeStep === 2 ? (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Sparkles size={16} />}
                onClick={runPlanning}
                disabled={busy || !strategyProfile || !strategyId}
              >
                {busy ? "Generating planning…" : planningProfile ? "Regenerate planning" : "Generate planning"}
              </Button>
              {planningProfile ? (
                <CampaignPlanningReviewEditor
                  planning={planningProfile}
                  onChange={setPlanningProfile}
                  disabled={busy}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Step 2 builds a weekly calendar (topics and formats only). Edit slots before generating full posts.
                </Typography>
              )}
            </Stack>
          ) : null}

          {activeStep === 3 ? (
            <Stack spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Sparkles size={16} />}
                onClick={runContent}
                disabled={busy || !planningProfile || !planningId}
              >
                {busy ? "Generating campaign content…" : posts.length > 0 ? "Regenerate content" : "Generate content"}
              </Button>
              {posts.length > 0 ? (
                <CampaignPostReviewList
                  posts={posts}
                  onChange={setPosts}
                  platformOptions={connectedPlatforms}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Step 3 fills each planning slot with full post copy (text, carousel slides, infographics, etc.).
                </Typography>
              )}
            </Stack>
          ) : null}

          {activeStep === 4 ? (
            <Stack spacing={2}>
              <TextField
                label="Campaign name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                fullWidth
              />
              <TextField
                label="Description / brief"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
          ) : null}

          {activeStep === 5 ? (
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={schedulePosts}
                    onChange={(e) => setSchedulePosts(e.target.checked)}
                  />
                }
                label="Schedule posts when creating (requires connected accounts)"
              />
              {schedulePosts ? (
                <Stack spacing={1.5}>
                  {connectedPlatforms.map((platform) => {
                    const accounts = channelAccounts.filter((a) => a.platform === platform);
                    return (
                      <TextField
                        key={platform}
                        select
                        size="small"
                        label={`${platform} account`}
                        value={accountByPlatform[platform] ?? ""}
                        onChange={(e) =>
                          setAccountByPlatform((prev) => ({
                            ...prev,
                            [platform]: Number(e.target.value),
                          }))
                        }
                        fullWidth
                      >
                        <MenuItem value="">Skip scheduling for this platform</MenuItem>
                        {accounts.map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.displayName || a.externalAccountId || `Account #${a.id}`}
                          </MenuItem>
                        ))}
                      </TextField>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Posts will be created as drafts unless you schedule them here.
                </Typography>
              )}
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={busy}>
          Cancel
        </Button>
        {activeStep > 0 ? (
          <Button disabled={busy} onClick={() => setActiveStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        {activeStep === 0 ? (
          <Button variant="contained" disabled={busy || !canConfigure} onClick={() => setActiveStep(1)}>
            Continue
          </Button>
        ) : null}
        {activeStep === 1 ? (
          <Button
            variant="contained"
            disabled={busy || !strategyProfile}
            onClick={() => setActiveStep(2)}
          >
            Continue to planning
          </Button>
        ) : null}
        {activeStep === 2 ? (
          <Button
            variant="contained"
            disabled={busy || !planningProfile}
            onClick={() => setActiveStep(3)}
          >
            Continue to content
          </Button>
        ) : null}
        {activeStep === 3 ? (
          <Button variant="contained" disabled={busy || posts.length === 0} onClick={() => setActiveStep(4)}>
            Continue
          </Button>
        ) : null}
        {activeStep === 4 ? (
          <Button variant="contained" disabled={busy} onClick={() => setActiveStep(5)}>
            Continue
          </Button>
        ) : null}
        {activeStep === 5 ? (
          <Button variant="contained" disabled={busy || posts.length === 0} onClick={handleMaterialize}>
            {busy ? "Creating…" : "Create campaign & posts"}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
