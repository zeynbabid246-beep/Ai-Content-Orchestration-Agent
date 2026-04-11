import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const STATS = [
  { label: "Content Published", value: "142" },
  { label: "Campaigns Active", value: "8" },
  { label: "Team Members", value: "24" },
  { label: "AI Tokens Used", value: "91k" },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Siwar Attia");
  const [email, setEmail] = useState("siwarattia700@gmail.com");
  const [role, setRole] = useState("Content Creator");
  const [bio, setBio] = useState("Building AI-powered content workflows that scale.");
  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, push: false, weekly: true });

  const initials = name.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontFamily: "Cormorant Garamond, serif" }}>My Profile</Typography>

      <Paper sx={{ p: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "start", md: "center" }} spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", color: "background.default" }}>{initials}</Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: "Cormorant Garamond, serif", mb: 0.5 }}>{name}</Typography>
              <Typography variant="body2" color="text.secondary">{role}</Typography>
            </Box>
          </Stack>
          <Button variant={editing ? "contained" : "outlined"} onClick={() => setEditing((prev) => !prev)}>
            {editing ? "Stop Editing" : "Edit Profile"}
          </Button>
        </Stack>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {STATS.map((stat) => (
          <Box key={stat.label}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h5" color="primary.main" sx={{ fontFamily: "Cormorant Garamond, serif", mb: 0.5 }}>{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>{stat.label}</Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, value: string) => setTab(value)}>
        {["Overview", "Security", "Preferences", "Danger Zone"].map((item) => <Tab key={item} label={item} value={item} />)}
      </Tabs>

      {tab === "Overview" ? (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField label="Full name" value={name} onChange={(event) => setName(event.target.value)} disabled={!editing} />
            <TextField label="Role" value={role} onChange={(event) => setRole(event.target.value)} disabled={!editing} />
            <TextField label="Email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!editing} />
            <TextField label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} disabled={!editing} multiline minRows={3} />
            {editing ? <Button variant="contained" onClick={() => { setSaved(true); setEditing(false); }}>Save changes</Button> : null}
          </Stack>
        </Paper>
      ) : null}

      {tab === "Security" ? (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <TextField type="password" label="Current password" />
            <TextField type="password" label="New password" />
            <TextField type="password" label="Confirm password" />
            <Button variant="contained">Update password</Button>
          </Stack>
        </Paper>
      ) : null}

      {tab === "Preferences" ? (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Email notifications</Typography>
              <Switch checked={notifications.email} onChange={() => setNotifications((prev) => ({ ...prev, email: !prev.email }))} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Push notifications</Typography>
              <Switch checked={notifications.push} onChange={() => setNotifications((prev) => ({ ...prev, push: !prev.push }))} />
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography>Weekly digest</Typography>
              <Switch checked={notifications.weekly} onChange={() => setNotifications((prev) => ({ ...prev, weekly: !prev.weekly }))} />
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {tab === "Danger Zone" ? (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <Button color="error" variant="outlined" onClick={() => navigate("/login")}>Log out</Button>
            <Button color="secondary" variant="outlined">Export data</Button>
            <Button color="error" variant="contained">Delete account</Button>
          </Stack>
        </Paper>
      ) : null}

      {saved ? <Alert severity="success" onClose={() => setSaved(false)}>Changes saved successfully</Alert> : null}
    </Stack>
  );
}
