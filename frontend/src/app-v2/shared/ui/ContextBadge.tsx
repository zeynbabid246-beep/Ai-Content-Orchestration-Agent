import { Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface ContextBadgeProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  tone?: "default" | "primary" | "secondary" | "muted";
}

export function ContextBadge({ icon, label, value, tone = "default" }: ContextBadgeProps) {
  const theme = useTheme();
  const colorMap = {
    default: theme.palette.text.primary,
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    muted: theme.palette.text.secondary,
  } as const;
  const accent = colorMap[tone];

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{
        px: 1.25,
        py: 0.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: alpha(accent, 0.3),
        bgcolor: alpha(accent, 0.06),
        minWidth: 0,
      }}
    >
      {icon ? (
        <Stack alignItems="center" justifyContent="center" sx={{ color: accent }}>
          {icon}
        </Stack>
      ) : null}
      <Stack spacing={0} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.8,
            lineHeight: 1.2,
            fontSize: 9.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: accent,
            fontWeight: 600,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: 220,
          }}
        >
          {value}
        </Typography>
      </Stack>
    </Stack>
  );
}
