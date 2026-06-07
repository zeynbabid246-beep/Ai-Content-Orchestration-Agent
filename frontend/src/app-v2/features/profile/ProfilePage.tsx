import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  useProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from "./profil.queries";
import { changePassword, logout } from "../auth/auth.api";
import { getMyTeams } from "../team/teams.api";
import { ROUTES } from "../../shared/lib/routes";
import { PasswordField } from "../../shared/ui/PasswordField";
import { useTeamPermissions } from "../../shared/hooks/useTeamPermissions";
import { authStorage } from "../../shared/lib/storage";

type TabValue = "Personal" | "Workspace" | "Security" | "Account";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { canManageTeam } = useTeamPermissions();
  const currentTeamId = authStorage.getTeamId();

  const { data: profile, isLoading, isError, error } = useProfile();
  const { data: teams = [] } = useQuery({
    queryKey: ["my-teams"],
    queryFn: getMyTeams,
  });

  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  const [tab, setTab] = useState<TabValue>("Personal");
  const [saved, setSaved] = useState(false);

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (res) => {
      setPasswordMessage({ severity: "success", text: res.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      setPasswordMessage({ severity: "error", text: err.message });
    },
  });

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setBio(profile.bio);
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  const hasChanges = useMemo(() => {
    if (!profile) return false;
    return username.trim() !== profile.username || bio !== profile.bio;
  }, [profile, username, bio]);

  const initials = username
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleDiscardChanges = () => {
    if (!profile) return;
    setUsername(profile.username);
    setBio(profile.bio);
    setSaved(false);
  };

  const handleSaveChanges = () => {
    updateProfileMutation.mutate(
      { username: username.trim(), bio },
      {
        onSuccess: (updated) => {
          setUsername(updated.username);
          setBio(updated.bio);
          setSaved(true);
        },
      }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarMutation.mutate(file, {
      onSuccess: (res) => setAvatarUrl(res.url),
    });
  };

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError || !profile) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {(error as Error)?.message ?? "Failed to load profile."}
      </Alert>
    );
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 880, mx: "auto", py: 3, px: 2, pb: hasChanges ? 10 : 3 }}>
      <Typography variant="h4" fontWeight={700}>
        My Profile
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <Avatar
            src={avatarUrl ?? undefined}
            sx={{ width: 80, height: 80, fontSize: 28, bgcolor: "primary.main" }}
          >
            {!avatarUrl && (initials || "?")}
          </Avatar>

          <Box flex={1}>
            <Typography variant="h6" fontWeight={600}>
              {profile.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {profile.email}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={1} flexWrap="wrap" useFlexGap>
              <Chip label={profile.teamRole} size="small" color="primary" variant="outlined" />
              <Typography variant="body2" color="text.secondary">
                {profile.teamName}
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              component="label"
              size="small"
              variant="outlined"
              disabled={uploadAvatarMutation.isPending}
            >
              {uploadAvatarMutation.isPending ? "Uploading…" : "Change photo"}
              <input hidden type="file" accept="image/*" onChange={handleAvatarChange} />
            </Button>
            {avatarUrl && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                disabled={removeAvatarMutation.isPending}
                onClick={() =>
                  removeAvatarMutation.mutate(undefined, {
                    onSuccess: () => setAvatarUrl(null),
                  })
                }
              >
                Remove photo
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, value: TabValue) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {(["Personal", "Workspace", "Security", "Account"] as const).map((value) => (
          <Tab key={value} value={value} label={value} />
        ))}
      </Tabs>

      {tab === "Personal" && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
            />
            <TextField
              label="Email"
              value={profile.email || "—"}
              disabled
              fullWidth
              helperText="Email cannot be changed here."
            />
            <TextField
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              inputProps={{ maxLength: 300 }}
              helperText={`${bio.length}/300`}
            />
            <TextField
              label="Member since"
              value={formatDate(profile.memberSince)}
              disabled
              fullWidth
            />

            {updateProfileMutation.isError && (
              <Alert severity="error">{(updateProfileMutation.error as Error).message}</Alert>
            )}

            {saved && !hasChanges && (
              <Alert severity="success" onClose={() => setSaved(false)}>
                Profile updated successfully.
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {tab === "Workspace" && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Current workspace
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {profile.teamName} · {profile.teamRole}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Your teams
              </Typography>
              <Stack spacing={1}>
                {teams.map((team) => (
                  <Stack
                    key={team.teamId}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      py: 1,
                      px: 1.5,
                      borderRadius: 1,
                      bgcolor: team.teamId === currentTeamId ? "action.hover" : undefined,
                    }}
                  >
                    <Box>
                      <Typography fontWeight={500}>{team.teamName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {team.role} · joined {formatDate(team.joinedAt)}
                      </Typography>
                    </Box>
                    {team.teamId === currentTeamId && (
                      <Chip label="Active" size="small" color="primary" />
                    )}
                  </Stack>
                ))}
                {teams.length === 0 && (
                  <Typography color="text.secondary">No teams found.</Typography>
                )}
              </Stack>
            </Box>

            {canManageTeam && (
              <Button component={RouterLink} to={ROUTES.inviteUser} variant="outlined">
                Manage team members
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {tab === "Security" && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Password &amp; security
            </Typography>
            <Divider />
            {passwordMessage && (
              <Alert severity={passwordMessage.severity} onClose={() => setPasswordMessage(null)}>
                {passwordMessage.text}
              </Alert>
            )}
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              disabled={
                changePasswordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                newPassword !== confirmPassword
              }
              onClick={() =>
                changePasswordMutation.mutate({ currentPassword, newPassword })
              }
            >
              {changePasswordMutation.isPending ? "Updating…" : "Update password"}
            </Button>
            <Typography variant="body2" color="text.secondary">
              Forgot your password?{" "}
              <Link component={RouterLink} to={ROUTES.forgotPassword}>
                Reset it here
              </Link>
            </Typography>
          </Stack>
        </Paper>
      )}

      {tab === "Account" && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Account
            </Typography>
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={500}>Sign out</Typography>
                <Typography variant="body2" color="text.secondary">
                  Clears your session and returns you to login.
                </Typography>
              </Box>
              <Button
                color="error"
                variant="outlined"
                onClick={async () => {
                  await logout();
                  navigate(ROUTES.login, { replace: true });
                }}
              >
                Sign out
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      {hasChanges && tab === "Personal" && (
        <Paper
          elevation={4}
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme => theme.zIndex.appBar,
            borderRadius: 0,
            borderTop: "1px solid",
            borderColor: "divider",
            px: { xs: 2, md: 3 },
            py: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ maxWidth: 880, mx: "auto" }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: "auto", display: { xs: "none", sm: "block" } }}>
              You have unsaved changes
            </Typography>
            <Button variant="outlined" color="inherit" onClick={handleDiscardChanges}>
              Discard
            </Button>
            <Button
              variant="contained"
              disabled={updateProfileMutation.isPending || !username.trim()}
              onClick={handleSaveChanges}
            >
              {updateProfileMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
