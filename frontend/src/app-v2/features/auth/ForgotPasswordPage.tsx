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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #eff6ff 0%, #dbeafe 30%, #e0f2fe 60%, #f0f9ff 100%)",
        p: 2,
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 450,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          boxShadow: "0 20px 60px rgba(37,99,235,0.10), 0 4px 20px rgba(0,0,0,0.06)",
          border: "1px solid",
          borderColor: "rgba(37,99,235,0.10)",
        }}
      >
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
