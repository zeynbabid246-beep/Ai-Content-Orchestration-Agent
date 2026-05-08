import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTeamMembersQuery } from "./teams.queries";
import type { TeamMember } from "./teams.type";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date?: string) {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Configs ──────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<string, "primary" | "secondary" | "info" | "warning"> = {
  Admin:  "info",
  Editor: "primary",
  Viewer: "secondary",
};

const AVATAR_COLORS = [
  "#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777",
];

function getInitials(username: string) {
  return username
    .replace(/[._@]/g, " ")
    .trim()
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";
}

function getAvatarColor(userId: string) {
  let hash = 0;
  for (const char of userId) hash += char.charCodeAt(0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Summary stats bar ────────────────────────────────────────────────────────

function SummaryBar({ members }: { members: TeamMember[] }) {
  const total  = members.length;
  const admins  = members.filter((m) => m.role === "Admin").length;
  const editors = members.filter((m) => m.role === "Editor").length;
  const viewers = members.filter((m) => m.role === "Viewer").length;

  const stats = [
    { label: "Total Members", value: total,   color: "#a78bfa" },
    { label: "Admins",        value: admins,   color: "#38bdf8" },
    { label: "Editors",       value: editors,  color: "#22c55e" },
    { label: "Viewers",       value: viewers,  color: "#f59e0b" },
  ];

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      {stats.map((s) => (
        <Paper key={s.label} sx={{ p: 2, flex: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ color: s.color }}>
            {s.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8 }}>
            {s.label.toUpperCase()}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function MembersHistoryPage() {
  const { data: members = [], isLoading, isError } = useTeamMembersQuery();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = members.filter((m) => {
    const matchSearch =
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.userId.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load team activity data.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Team Activity
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          TRACK TEAM MEMBERS AND THEIR PARTICIPATION
        </Typography>
      </Box>

      <SummaryBar members={members} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField
          size="small"
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {["All", "Admin", "Editor", "Viewer"].map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined At</TableCell>
              <TableCell>Time Since Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled">No members match your filters.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.userId} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(m.userId),
                          width: 38,
                          height: 38,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(m.username)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {m.username}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={m.role}
                      color={ROLE_COLOR[m.role] ?? "default"}
                      sx={{ borderRadius: 1, fontSize: "0.7rem" }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(m.joinedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {timeAgo(m.joinedAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}