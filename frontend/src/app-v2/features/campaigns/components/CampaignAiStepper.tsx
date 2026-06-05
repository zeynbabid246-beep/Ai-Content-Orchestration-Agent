import { Step, StepLabel, Stepper } from "@mui/material";
import type { CampaignStepStatus } from "../../ai/ai.api";

interface CampaignAiStepperProps {
  strategy: string;
  planning: string;
  campaign: string;
  busy?: boolean;
}

function stepError(status: string) {
  return status === "failed";
}

function stepCompleted(status: string) {
  return status === "completed";
}

export function CampaignAiStepper({
  strategy,
  planning,
  campaign,
  busy = false,
}: CampaignAiStepperProps) {
  const activeStep =
    stepCompleted(campaign) ? 2 : stepCompleted(planning) ? 1 : stepCompleted(strategy) ? 0 : busy ? 0 : -1;

  return (
    <Stepper activeStep={activeStep >= 0 ? activeStep : 0}>
      <Step completed={stepCompleted(strategy)} active={busy && !stepCompleted(strategy)}>
        <StepLabel error={stepError(strategy)}>Generate strategy</StepLabel>
      </Step>
      <Step completed={stepCompleted(planning)} active={busy && stepCompleted(strategy) && !stepCompleted(planning)}>
        <StepLabel error={stepError(planning)}>Generate planning</StepLabel>
      </Step>
      <Step completed={stepCompleted(campaign)} active={busy && stepCompleted(planning) && !stepCompleted(campaign)}>
        <StepLabel error={stepError(campaign)}>Generate campaign content</StepLabel>
      </Step>
    </Stepper>
  );
}

export function stepsFromSuggestion(s: {
  strategy: CampaignStepStatus;
  planning: CampaignStepStatus;
  campaign: CampaignStepStatus;
}) {
  return {
    strategy: s.strategy.status,
    planning: s.planning.status,
    campaign: s.campaign.status,
  };
}
