import { useMutation } from "@tanstack/react-query";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "./auth.api";
import { PasswordField } from "../../shared/ui/PasswordField";
import { ROUTES } from "../../shared/lib/routes";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const tokenFromQuery = searchParams.get("token") ?? "";

  const [email, setEmail] = useState(emailFromQuery);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validationError = useMemo(() => {
    if (!email.trim() || !tokenFromQuery) return "Invalid or expired reset link.";
    if (!newPassword) return "New password is required.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    return null;
  }, [email, tokenFromQuery, newPassword, confirmPassword]);

  const mutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setTimeout(() => navigate(ROUTES.login, { replace: true }), 2000);
    },
  });

  const handleSubmit = () => {
    if (validationError) return;
    mutation.mutate({
      email,
      token: tokenFromQuery,
      newPassword,
    });
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 450, p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">Reset password</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a new password for your account.
          </Typography>

          {validationError && <Alert severity="warning">{validationError}</Alert>}
          {mutation.isError && (
            <Alert severity="error">{(mutation.error as Error).message}</Alert>
          )}
          {mutation.isSuccess && (
            <Alert severity="success">
              {mutation.data.message} Redirecting to sign in…
            </Alert>
          )}

          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={Boolean(emailFromQuery)}
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={mutation.isPending || Boolean(validationError)}
          >
            {mutation.isPending ? "Saving..." : "Reset password"}
          </Button>

          <Typography variant="body2" color="text.secondary">
            <RouterLink to={ROUTES.login}>Back to sign in</RouterLink>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
