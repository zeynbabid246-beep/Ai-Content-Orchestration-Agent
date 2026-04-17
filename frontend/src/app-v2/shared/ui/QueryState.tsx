import { Alert, Box, CircularProgress, Typography } from "@mui/material";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <Box sx={{ py: 8, textAlign: "center" }}>
      <CircularProgress size={28} />
      <Typography variant="body2" sx={{ mt: 2 }}>{label}</Typography>
    </Box>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <Alert severity="error">{message}</Alert>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Box sx={{ py: 6, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: 2 }}>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary">{description}</Typography>
    </Box>
  );
}
