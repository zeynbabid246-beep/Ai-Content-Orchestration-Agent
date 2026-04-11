import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { login } from "./auth.api";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate("/app/brands"),
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
          <Typography variant="h4" sx={{ fontFamily: "Cormorant Garamond, serif" }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Access your enterprise workspace.
          </Typography>

          {fieldError ? <Alert severity="warning">{fieldError}</Alert> : null}
          {mutation.isError ? <Alert severity="error">{(mutation.error as Error).message}</Alert> : null}

          <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>

          <Typography variant="body2" color="text.secondary">
            No account? <RouterLink to="/app/register">Create one</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
