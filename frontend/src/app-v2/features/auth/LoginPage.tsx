import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
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
          maxWidth: 440,
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
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Welcome back — access your workspace.
            </Typography>
          </Box>

          <Divider />

          {fieldError && <Alert severity="warning">{fieldError}</Alert>}
          {mutation.isError && (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          )}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          <Typography variant="body2" sx={{ textAlign: "right", mt: -1 }}>
            <RouterLink to={ROUTES.forgotPassword}>Forgot password?</RouterLink>
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            sx={{ borderRadius: 2, py: 1.25 }}
          >
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            No account?{" "}
            <RouterLink to={ROUTES.register}>Create one</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
