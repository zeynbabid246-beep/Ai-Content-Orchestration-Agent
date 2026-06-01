import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface EntityCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  accentColor?: string;
  selected?: boolean;
}

export function EntityCard({
  title,
  subtitle,
  leading,
  trailing,
  body,
  footer,
  onClick,
  accentColor,
  selected = false,
}: EntityCardProps) {
  const theme = useTheme();
  const interactive = Boolean(onClick);

  return (
    <Paper
      onClick={onClick}
      sx={{
        p: 2.25,
        height: "100%",
        cursor: interactive ? "pointer" : "default",
        transition: "all 0.18s ease",
        borderColor: selected
          ? accentColor ?? theme.palette.primary.main
          : "divider",
        position: "relative",
        overflow: "hidden",
        ...(interactive
          ? {
              "&:hover": {
                borderColor: accentColor ?? alpha(theme.palette.primary.main, 0.5),
                transform: "translateY(-2px)",
                boxShadow: `0 6px 22px ${alpha(theme.palette.common.black, 0.35)}`,
              },
            }
          : {}),
      }}
    >
      {accentColor ? (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            bgcolor: accentColor,
          }}
        />
      ) : null}

      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          {leading}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{ lineHeight: 1.3, wordBreak: "break-word" }}
            >
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.25 }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {trailing}
        </Stack>

        {body ? <Box>{body}</Box> : null}

        {footer ? (
          <Box
            sx={{
              pt: 1.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            {footer}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}
