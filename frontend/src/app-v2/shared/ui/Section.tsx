import { Box, Chip, Paper, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  badge?: string;
}

export function Section({ title, subtitle, children, badge }: SectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 2.5,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #d4af7a, transparent)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: subtitle ? 0.5 : 2.5 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 400, color: "text.primary", letterSpacing: "0.02em" }}>
          {title}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              background: "rgba(212,175,122,0.12)",
              color: "primary.main",
              border: "1px solid rgba(212,175,122,0.25)",
              height: 20,
              fontSize: 9,
              letterSpacing: "0.1em",
            }}
          />
        )}
      </Box>
      {subtitle && (
        <Typography sx={{ fontSize: 11, color: "text.secondary", letterSpacing: "0.08em", mb: 2.5, fontWeight: 300 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  );
}
