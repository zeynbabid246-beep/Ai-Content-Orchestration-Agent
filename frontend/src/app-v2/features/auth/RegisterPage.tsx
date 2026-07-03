import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "./auth.api";
import { ROUTES } from "../../shared/lib/routes";
import { PasswordField } from "../../shared/ui/PasswordField";

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("token") ?? undefined;
  const invitedEmail = searchParams.get("email") ?? "";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validationError = useMemo(() => {
    if (!username.trim() || !email.trim() || !password) return "All fields are required.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }, [username, email, password, confirmPassword]);

  const mutation = useMutation({
    mutationFn: register,
    onSuccess: () => navigate(ROUTES.dashboard, { replace: true }),
  });

  const handleSubmit = () => {
    if (validationError) return;
    mutation.mutate({ username, email, password, inviteToken });
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
          maxWidth: 500,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          boxShadow:
            "0 20px 60px rgba(37,99,235,0.10), 0 4px 20px rgba(0,0,0,0.06)",
          border: "1px solid",
          borderColor: "rgba(37,99,235,0.10)",
        }}
      >
        <Stack spacing={2.5}>
          {/* Brand header */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Box
              component="img"
              src="/logo1.png"
              alt="AiContentFlow"
              sx={{ height: 36, width: 36, objectFit: "contain", borderRadius: 1 }}
            />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              AiContentFlow
            </Typography>
          </Stack>

          <Box>
            <Typography variant="h5" fontWeight={600}>
              Create account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {inviteToken
                ? "You've been invited — create your account to join the team."
                : "Set up your enterprise workspace."}
            </Typography>
          </Box>

          <Divider />

          {validationError && <Alert severity="warning">{validationError}</Alert>}
          {mutation.isError && (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          )}
          {inviteToken && (
            <Alert severity="info">
              Your email is locked to the invitation address.
            </Alert>
          )}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            InputProps={{ readOnly: Boolean(inviteToken) }}
          />
          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={mutation.isPending || Boolean(validationError)}
            sx={{ borderRadius: 2, py: 1.25 }}
          >
            {mutation.isPending ? "Creating..." : "Create account"}
          </Button>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Already have an account?{" "}
            <RouterLink to={ROUTES.login}>Sign in</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
