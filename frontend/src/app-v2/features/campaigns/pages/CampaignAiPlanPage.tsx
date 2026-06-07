import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useBrandStudio } from "../../brand-studio/hooks/useBrandStudio";
import { useSocialAccounts } from "../../social-media/social-accounts.queries";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";
import { useCampaign } from "../campaigns.queries";
import { campaignPaths, ROUTES } from "../../../shared/lib/routes";
import { useCampaignAiPipeline } from "../hooks/useCampaignAiPipeline";
import { CampaignStrategyConfigForm } from "../components/CampaignStrategyConfigForm";
import { CampaignStrategyReviewEditor } from "../components/CampaignStrategyReviewEditor";
import { CampaignContentDirectionPicker } from "../components/CampaignContentDirectionPicker";
import { CampaignPlanningReviewEditor } from "../components/CampaignPlanningReviewEditor";
import { CampaignPostReviewList } from "../components/CampaignPostReviewList";

const STEP_LABELS = ["Configure", "Strategy", "Planning", "Content", "Confirm"];

export function CampaignAiPlanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { channelId: channelIdParam, campaignId: campaignIdParam } = useParams<{
    channelId: string;
    campaignId: string;
  }>();
  const channelId = Number(channelIdParam);
  const campaignId = Number(campaignIdParam);

  const { canMutateContent } = useTeamPermissions();
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId);
  const { data: brandSnapshot } = useBrandStudio();
  const { data: allAccounts = [] } = useSocialAccounts();

  const brandOrgId = brandSnapshot?.brandStudio?.parsedProfile.orgId?.trim() ?? "";
  const hasBrand = Boolean(brandOrgId);

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

  const pipeline = useCampaignAiPipeline(channelId, connectedPlatforms);

  const [schedulePosts, setSchedulePosts] = useState(false);
  const [accountByPlatform, setAccountByPlatform] = useState<Record<string, number>>({});

  useEffect(() => {
    if (hasBrand) {
      pipeline.initConfig(brandOrgId, campaign?.objective ?? campaign?.description ?? "");
    }
  }, [hasBrand, brandOrgId, campaign?.objective, campaign?.description]);

  const handleFinalize = async () => {
    const success = await pipeline.finalize(campaignId, {
      schedulePosts,
      accountByPlatform: schedulePosts ? accountByPlatform : undefined,
    });
    if (success) {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      navigate(campaignPaths.posts(channelId, campaignId));
    }
  };

  if (!canMutateContent) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">You need Editor or Admin permissions to use AI planning.</Alert>
      </Box>
    );
  }

  if (campaignLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading campaign...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", py: 4, px: 2 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowLeft size={14} />}
            onClick={() => navigate(campaignPaths.overview(channelId, campaignId))}
            sx={{ mb: 1 }}
          >
            Back to campaign
          </Button>
          <Typography variant="h5" fontWeight={700}>
            AI Campaign Planner
          </Typography>
          {campaign ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {campaign.name}
              {campaign.description ? ` — ${campaign.description}` : ""}
            </Typography>
          ) : null}
        </Box>

        {/* Stepper */}
        <Stepper activeStep={pipeline.activeStep} alternativeLabel>
          {STEP_LABELS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Brand preflight */}
        {!hasBrand ? (
          <Alert severity="warning">
            Set up your brand first.{" "}
            <Button component={RouterLink} to={ROUTES.brandStudio} size="small">
              Go to Brand Studio
            </Button>{" "}
            to import a website and save a profile before using AI campaigns.
          </Alert>
        ) : null}

        {pipeline.error ? <Alert severity="error">{pipeline.error}</Alert> : null}

        {/* Step: Configure */}
        {pipeline.currentStep === "configure" ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Campaign configuration</Typography>
              <CampaignStrategyConfigForm
                value={pipeline.strategyConfig}
                onChange={pipeline.setStrategyConfig}
                lockedOrgId={brandOrgId}
                disabled={pipeline.busy}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Start date"
                  type="date"
                  value={pipeline.startDate}
                  onChange={(e) => pipeline.setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={pipeline.busy}
                />
                <TextField
                  label="End date"
                  type="date"
                  value={pipeline.endDate}
                  onChange={(e) => pipeline.setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={pipeline.busy}
                />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {connectedPlatforms.map((p) => (
                  <Chip key={p} label={p} size="small" variant="outlined" />
                ))}
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        {/* Step: Strategy */}
        {pipeline.currentStep === "strategy" ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Marketing strategy</Typography>
              <Button
                variant="outlined"
                startIcon={<Sparkles size={16} />}
                onClick={pipeline.runStrategy}
                disabled={pipeline.busy || !pipeline.canConfigure}
              >
                {pipeline.busy
                  ? "Generating strategy..."
                  : pipeline.strategyProfile
                    ? "Regenerate strategy"
                    : "Generate strategy"}
              </Button>
              {pipeline.strategyProfile ? (
                <>
                  <CampaignStrategyReviewEditor
                    strategy={pipeline.strategyProfile}
                    onChange={pipeline.setStrategyProfile}
                    disabled={pipeline.busy}
                  />
                  {pipeline.contentDirections.length > 0 ? (
                    <CampaignContentDirectionPicker
                      directions={pipeline.contentDirections}
                      selected={pipeline.selectedDirection}
                      onChange={pipeline.setSelectedDirection}
                      disabled={pipeline.busy}
                    />
                  ) : null}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Generate a strategy to see positioning, pillars, and content directions. You can
                  edit the results before proceeding.
                </Typography>
              )}
            </Stack>
          </Paper>
        ) : null}

        {/* Step: Planning */}
        {pipeline.currentStep === "planning" ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Content calendar</Typography>
              <Button
                variant="outlined"
                startIcon={<Sparkles size={16} />}
                onClick={pipeline.runPlanning}
                disabled={pipeline.busy || !pipeline.strategyId}
              >
                {pipeline.busy
                  ? "Generating calendar..."
                  : pipeline.planningProfile
                    ? "Regenerate calendar"
                    : "Generate calendar"}
              </Button>
              {pipeline.planningProfile ? (
                <CampaignPlanningReviewEditor
                  planning={pipeline.planningProfile}
                  onChange={pipeline.setPlanningProfile}
                  disabled={pipeline.busy}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  The calendar builds a 4-week editorial skeleton with topics and content types for
                  each slot. Edit before generating full posts.
                </Typography>
              )}
            </Stack>
          </Paper>
        ) : null}

        {/* Step: Content */}
        {pipeline.currentStep === "content" ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Generate posts</Typography>
              <Button
                variant="outlined"
                startIcon={<Sparkles size={16} />}
                onClick={pipeline.runContent}
                disabled={pipeline.busy || !pipeline.planningId}
              >
                {pipeline.busy
                  ? "Generating posts..."
                  : pipeline.posts.length > 0
                    ? "Regenerate all posts"
                    : "Generate posts"}
              </Button>
              {pipeline.posts.length > 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {pipeline.posts.length} posts generated. Review and edit before adding to the
                    campaign.
                  </Typography>
                  <CampaignPostReviewList
                    posts={pipeline.posts}
                    onChange={pipeline.setPosts}
                    platformOptions={connectedPlatforms}
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Each calendar slot will be filled with full post content (text, slides,
                  infographics, etc.) and visual assets when applicable.
                </Typography>
              )}
            </Stack>
          </Paper>
        ) : null}

        {/* Step: Confirm */}
        {pipeline.currentStep === "confirm" ? (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Typography variant="h6">Review and confirm</Typography>
              <Typography variant="body2" color="text.secondary">
                {pipeline.posts.length} posts will be added to{" "}
                <strong>{campaign?.name ?? "this campaign"}</strong> as drafts.
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={schedulePosts}
                    onChange={(e) => setSchedulePosts(e.target.checked)}
                  />
                }
                label="Schedule posts on create"
              />
              {schedulePosts
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
                          setAccountByPlatform((prev) => ({
                            ...prev,
                            [platform]: Number(e.target.value),
                          }))
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
          </Paper>
        ) : null}

        {/* Navigation */}
        <Stack direction="row" justifyContent="space-between">
          <Button
            variant="text"
            startIcon={<ArrowLeft size={14} />}
            onClick={pipeline.goBack}
            disabled={pipeline.activeStep === 0 || pipeline.busy}
          >
            Back
          </Button>
          {pipeline.currentStep === "confirm" ? (
            <Button
              variant="contained"
              startIcon={<Check size={16} />}
              onClick={handleFinalize}
              disabled={pipeline.busy || pipeline.posts.length === 0}
            >
              {pipeline.busy ? "Creating posts..." : `Create ${pipeline.posts.length} posts`}
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowRight size={14} />}
              onClick={pipeline.goNext}
              disabled={!pipeline.canAdvance || pipeline.busy}
            >
              Continue
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
