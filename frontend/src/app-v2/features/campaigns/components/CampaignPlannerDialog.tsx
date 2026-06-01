import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { bulkCreateCampaignPosts } from "../campaigns.api";
import { suggestCampaign } from "../../ai/ai.api";
import { useTeamPermissions } from "../../../shared/hooks/useTeamPermissions";

type PlannerPost = {
  title: string;
  contentJson: string;
  contentType: string;
  scheduledAt?: string;
  platform?: string;
};

interface CampaignPlannerDialogProps {
  open: boolean;
  campaignId: number;
  channelId: number;
  onClose: () => void;
  onCompleted: () => void;
}

export function CampaignPlannerDialog({
  open,
  campaignId,
  channelId,
  onClose,
  onCompleted,
}: CampaignPlannerDialogProps) {
  const { canMutateContent } = useTeamPermissions();
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [posts, setPosts] = useState<PlannerPost[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepState, setStepState] = useState<{
    strategy: string;
    planning: string;
    campaign: string;
    correlationId?: string;
    errors: string[];
  }>({
    strategy: "pending",
    planning: "pending",
    campaign: "pending",
    errors: [],
  });

  if (!canMutateContent) {
    return null;
  }

  const handleSuggest = async () => {
    setBusy(true);
    setError(null);
    try {
      setStepState({
        strategy: "running",
        planning: "pending",
        campaign: "pending",
        errors: [],
      });
      const suggestion = await suggestCampaign({
        channelId,
        goal,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        platforms: ["LinkedIn", "Facebook"],
      });
      setStepState({
        strategy: suggestion.strategy.status,
        planning: suggestion.planning.status,
        campaign: suggestion.campaign.status,
        correlationId: suggestion.correlationId,
        errors: suggestion.errors,
      });
      setPosts(
        suggestion.posts.map((post) => ({
          title: post.title,
          contentJson: post.contentJson,
          contentType: post.contentType,
          scheduledAt: post.scheduledAt,
          platform: post.platform,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suggest campaign.");
      setStepState((prev) => ({ ...prev, strategy: "failed", errors: [err instanceof Error ? err.message : "Unknown error"] }));
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      await bulkCreateCampaignPosts(campaignId, posts);
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
          <TextField label="Campaign goal" value={goal} onChange={(e) => setGoal(e.target.value)} fullWidth />
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
          <Button variant="outlined" onClick={handleSuggest} disabled={busy || !goal || !startDate || !endDate}>
            Suggest posts with AI
          </Button>
          <Stepper activeStep={stepState.campaign === "completed" ? 2 : stepState.planning === "completed" ? 1 : stepState.strategy === "completed" ? 0 : 0}>
            <Step completed={stepState.strategy === "completed"}>
              <StepLabel error={stepState.strategy === "failed"}>Generate strategy</StepLabel>
            </Step>
            <Step completed={stepState.planning === "completed"}>
              <StepLabel error={stepState.planning === "failed"}>Generate planning</StepLabel>
            </Step>
            <Step completed={stepState.campaign === "completed"}>
              <StepLabel error={stepState.campaign === "failed"}>Generate campaign</StepLabel>
            </Step>
          </Stepper>
          {stepState.correlationId ? (
            <Typography variant="caption" color="text.secondary">
              Request ID: {stepState.correlationId}
            </Typography>
          ) : null}
          {stepState.errors.length > 0 ? (
            <Alert severity="warning">
              {stepState.errors.join(" | ")}
            </Alert>
          ) : null}
          {posts.length > 0 ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2">{posts.length} proposed posts</Typography>
              {posts.map((post, index) => (
                <Typography key={index} variant="body2" color="text.secondary">
                  {post.title} · {post.platform} · {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "Draft"}
                </Typography>
              ))}
            </Stack>
          ) : null}
          {(stepState.strategy === "failed" || stepState.planning === "failed" || stepState.campaign === "failed") ? (
            <Button variant="text" onClick={handleSuggest} disabled={busy}>
              Retry failed step
            </Button>
          ) : null}
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleCreate} disabled={busy || posts.length === 0}>
          Create posts
        </Button>
      </DialogActions>
    </Dialog>
  );
}
