import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { login } from "./auth.api";
import { ROUTES } from "../../shared/lib/routes";
import { PasswordField } from "../../shared/ui/PasswordField";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate(ROUTES.dashboard, { replace: true }),
  });

  const handleSubmit = () => {
    if (!email.trim() || !password) {
      setFieldError("Email and password are required.");
      return;
    }
    setFieldError(null);
    mutation.mutate({ email, password });
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 450, p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Sign in</Typography>
          <Typography variant="body2" color="text.secondary">
            Access your enterprise workspace.
          </Typography>

          {fieldError && <Alert severity="warning">{fieldError}</Alert>}
          {mutation.isError && (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          )}

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          />

          <Typography variant="body2" sx={{ textAlign: "right" }}>
            <RouterLink to={ROUTES.forgotPassword}>Forgot password?</RouterLink>
          </Typography>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <Typography variant="body2" color="text.secondary">
            No account?{" "}
            <RouterLink to={ROUTES.register}>Create one</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}