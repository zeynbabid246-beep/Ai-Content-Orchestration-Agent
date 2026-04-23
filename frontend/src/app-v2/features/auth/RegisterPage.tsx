import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { register } from "./auth.api";
import { ROUTES } from "../../shared/lib/routes";

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
    mutation.mutate({ username, email, password });
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 500, p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Register</Typography>
          <Typography variant="body2" color="text.secondary">
            Create your ContentFlow enterprise account.
          </Typography>

          {validationError && <Alert severity="warning">{validationError}</Alert>}
          {mutation.isError && (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          )}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={mutation.isPending || Boolean(validationError)}
          >
            {mutation.isPending ? "Creating..." : "Create account"}
          </Button>

          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <RouterLink to={ROUTES.login}>Sign in</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}