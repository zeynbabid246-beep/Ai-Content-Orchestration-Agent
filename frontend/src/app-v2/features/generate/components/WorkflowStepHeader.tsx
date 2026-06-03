import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface WorkflowStepHeaderProps {
  step: number;
  title: string;
  description?: string;
}

export function WorkflowStepHeader({ step, title, description }: WorkflowStepHeaderProps) {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 2 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 700,
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: "primary.main",
        }}
      >
        {step}
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
