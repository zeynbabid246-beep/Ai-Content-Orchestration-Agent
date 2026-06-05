import { Box, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface WorkspaceEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function WorkspaceEmptyState({
  icon,
  title,
  description,
  action,
}: WorkspaceEmptyStateProps) {
  return (
    <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
      {icon ? (
        <Box sx={{ display: "flex", justifyContent: "center", opacity: 0.55, mb: 1.5 }}>
          {icon}
        </Box>
      ) : null}
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: action ? 2.5 : 0 }}>
        {description}
      </Typography>
      {action ? <Stack direction="row" justifyContent="center">{action}</Stack> : null}
    </Paper>
  );
}
