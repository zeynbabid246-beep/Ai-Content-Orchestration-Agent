
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authStorage } from "../lib/storage";
import { ROUTES } from "../lib/routes";

export function PublicOnlyRoute() {
  const token = authStorage.getAccessToken();
  const location = useLocation();

  if (token) {
    const params = new URLSearchParams(location.search);
    const inviteToken = params.get("token");

    // Invitation link intended for a new account — guide the logged-in user.
    if (inviteToken) {
      const username = authStorage.getUsername() ?? "your current account";
      const registerHref = `${location.pathname}${location.search}`;

      const handleLogoutAndRegister = () => {
        authStorage.clear();
        window.location.href = registerHref;
      };

      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(145deg, #eff6ff 0%, #dbeafe 30%, #e0f2fe 60%, #f0f9ff 100%)",
            p: 2,
          }}
        >
          <Paper
            sx={{
              width: "100%",
              maxWidth: 480,
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              boxShadow:
                "0 20px 60px rgba(37,99,235,0.10), 0 4px 20px rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: "rgba(37,99,235,0.10)",
            }}
          >
            <Stack spacing={2.5}>
              <Typography variant="h5" fontWeight={600}>
                Invitation link detected
              </Typography>
              <Alert severity="info">
                You are currently signed in as <strong>{username}</strong>. This
                invitation link is for creating a new account. To use it, sign
                out first.
              </Alert>
              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={handleLogoutAndRegister}
                  sx={{ flex: 1 }}
                >
                  Sign out &amp; register
                </Button>
                <Button
                  variant="outlined"
                  href={ROUTES.dashboard}
                  sx={{ flex: 1 }}
                >
                  Stay signed in
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}