import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { forgotPassword } from "./auth.api";
import { ROUTES } from "../../shared/lib/routes";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: forgotPassword,
  });

  const handleSubmit = () => {
    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }
    setFieldError(null);
    mutation.mutate({ email });
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 450, p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Forgot password</Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and we will send you a reset link if an account exists.
          </Typography>

          {fieldError && <Alert severity="warning">{fieldError}</Alert>}
          {mutation.isError && (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          )}
          {mutation.isSuccess && (
            <Alert severity="success">{mutation.data.message}</Alert>
          )}

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          <Button variant="contained" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send reset link"}
          </Button>

          <Typography variant="body2" color="text.secondary">
            <RouterLink to={ROUTES.login}>Back to sign in</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
