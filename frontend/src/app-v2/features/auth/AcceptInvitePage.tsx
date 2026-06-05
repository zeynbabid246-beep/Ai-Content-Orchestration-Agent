import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { acceptTeamInvitation } from "./auth.api";
import { authStorage } from "../../shared/lib/storage";
import { ROUTES } from "../../shared/lib/routes";

export function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const mutation = useMutation({
    mutationFn: () => acceptTeamInvitation(token),
    onSuccess: (result) => {
      authStorage.setTeam(String(result.teamId), result.teamRole);
      authStorage.setTeamNameSetupRequired(false);
      window.location.href = ROUTES.dashboard;
    },
  });

  useEffect(() => {
    if (!token) return;
    mutation.mutate();
  }, [token]);

  if (!token) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Invalid invitation link.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "60vh", display: "grid", placeItems: "center" }}>
      <Paper sx={{ p: 4, maxWidth: 420 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Accepting invitation…</Typography>
          {mutation.isPending && <Typography color="text.secondary">Please wait.</Typography>}
          {mutation.isError && (
            <>
              <Alert severity="error">{(mutation.error as Error).message}</Alert>
              <Button variant="contained" onClick={() => navigate(ROUTES.dashboard)}>
                Go to dashboard
              </Button>
            </>
          )}
          {mutation.isSuccess && (
            <Alert severity="success">You joined {mutation.data.teamName}. Redirecting…</Alert>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
