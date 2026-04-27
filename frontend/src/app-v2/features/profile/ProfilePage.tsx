import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useProfile, useUpdateProfile, useUploadAvatar } from "./profil.queries";
import { authStorage } from "../../shared/lib/storage";
import { ROUTES } from "../../shared/lib/routes";

// ─── component ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const navigate = useNavigate();

  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();

  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── editable fields ─────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // ── read-only display fields ─────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  // ── notifications (local UI state) ──────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    "Email notifications": true,
    "Push notifications": false,
    "Weekly digest": true,
  });

  // ── sync profile → local state ───────────────────────────────────────────────
  // ✅ FIX: was setname / setemail (lowercase) — now correct setName / setEmail
  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setEmail(profile.email);
    setRole(profile.role);
    setBio(profile.bio);
    setAvatar(profile.avatarUrl);
  }, [profile]);

  // ── avatar upload ────────────────────────────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarMutation.mutate(file, {
      onSuccess: (res) => setAvatar(res.url),
    });
  };

  // ── initials fallback ────────────────────────────────────────────────────────
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) return <Typography sx={{ p: 3 }}>Loading…</Typography>;

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <Stack spacing={3} sx={{ maxWidth: 680, mx: "auto", py: 3, px: 2 }}>
      <Typography variant="h4" fontWeight={700}>
        My Profile
      </Typography>

      {/* ── HEADER CARD ─────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* ✅ FIX: explicit size — was unsized/tiny before */}
          <Avatar
            src={avatar ?? ""}
            sx={{ width: 72, height: 72, fontSize: 26, bgcolor: "primary.main" }}
          >
            {!avatar && (initials || "?")}
          </Avatar>

          <Box flex={1}>
            <Typography variant="h6" fontWeight={600}>
              {name || "—"}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
              {role && (
                <Chip label={role} size="small" color="primary" variant="outlined" />
              )}
            </Stack>
          </Box>

          {editing && (
            <Button
              component="label"
              size="small"
              variant="outlined"
              disabled={uploadAvatarMutation.isPending}
            >
              {uploadAvatarMutation.isPending ? "Uploading…" : "Change Photo"}
              <input hidden type="file" accept="image/*" onChange={handleAvatarChange} />
            </Button>
          )}

          <Button
            size="small"
            variant={editing ? "outlined" : "contained"}
            color={editing ? "inherit" : "primary"}
            onClick={() => { setEditing((p) => !p); setSaved(false); }}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </Stack>
      </Paper>

      {/* ── TABS ────────────────────────────────────────────────────────────── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
      >
        {["Overview", "Security", "Preferences", "Danger Zone"].map((t) => (
          <Tab key={t} value={t} label={t} />
        ))}
      </Tabs>

      {/* ── OVERVIEW ────────────────────────────────────────────────────────── */}
      {tab === "Overview" && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* Editable */}
            <TextField
              label="Name"
              value={name}
              disabled={!editing}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />

            {/* Read-only — comes from auth server, not stored for editing */}
            <TextField
              label="Email"
              value={email || "—"}
              disabled
              fullWidth
              helperText={
                editing ? "Email is managed by your account and cannot be changed here." : ""
              }
            />

            {/* Read-only — assigned by team admin via auth */}
            <TextField
              label="Role"
              value={role || "—"}
              disabled
              fullWidth
              helperText={editing ? "Role is assigned by your team admin." : ""}
            />

            {/* Editable */}
            <TextField
              label="Bio"
              value={bio}
              disabled={!editing}
              onChange={(e) => setBio(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              inputProps={{ maxLength: 300 }}
              helperText={editing ? `${bio.length}/300` : ""}
            />

            {editing && (
              <Button
                variant="contained"
                disabled={updateProfileMutation.isPending || !name.trim()}
                onClick={() =>
                  updateProfileMutation.mutate(
                    { name, bio },
                    { onSuccess: () => { setSaved(true); setEditing(false); } }
                  )
                }
              >
                {updateProfileMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            )}

            {saved && (
              <Alert severity="success" onClose={() => setSaved(false)}>
                Profile updated successfully.
              </Alert>
            )}
          </Stack>
        </Paper>
      )}

      {/* ── SECURITY ────────────────────────────────────────────────────────── */}
      {tab === "Security" && (
        <Paper sx={{ p: 3 }}>
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="h6" fontWeight={600}>
              Password &amp; Security
            </Typography>
            <Divider flexItem />
            <Alert severity="info" sx={{ width: "100%" }}>
              Password change is coming soon. Connect <code>useUpdatePassword</code> in{" "}
              <code>profil.queries.ts</code> to your <code>/profile/password</code> endpoint.
            </Alert>
            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              {[
                "Verify your current password",
                "Set a new password with a strength indicator",
                "Confirm the new password before saving",
              ].map((item) => (
                <li key={item}>
                  <Typography variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                </li>
              ))}
            </Box>
          </Stack>
        </Paper>
      )}

      {/* ── PREFERENCES ─────────────────────────────────────────────────────── */}
      {tab === "Preferences" && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
            Notifications
          </Typography>
          <Stack>
            {(Object.keys(notifications) as Array<keyof typeof notifications>).map((key) => (
              <Stack
                key={key}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ py: 1 }}
              >
                <Typography>{key}</Typography>
                <Switch
                  checked={notifications[key]}
                  onChange={() =>
                    setNotifications((p) => ({ ...p, [key]: !p[key] }))
                  }
                />
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* ── DANGER ZONE ─────────────────────────────────────────────────────── */}
      {tab === "Danger Zone" && (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "error.light" }}>
          <Stack spacing={2}>
            <Typography variant="h6" color="error" fontWeight={600}>
              Danger Zone
            </Typography>
            <Divider />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography fontWeight={500}>Sign out</Typography>
                <Typography variant="body2" color="text.secondary">
                  Clears your session and returns you to login.
                </Typography>
              </Box>
              {/* ✅ FIX: clears ALL authStorage keys before navigating */}
              <Button
                color="error"
                variant="outlined"
                onClick={() => {
                  authStorage.clear();
                  navigate(ROUTES.login, { replace: true });
                }}
              >
                Logout
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}