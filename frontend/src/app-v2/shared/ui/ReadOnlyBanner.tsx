import { Alert } from "@mui/material";

export function ReadOnlyBanner() {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      You have view-only access. Creating, editing, and publishing are disabled for your role.
    </Alert>
  );
}
