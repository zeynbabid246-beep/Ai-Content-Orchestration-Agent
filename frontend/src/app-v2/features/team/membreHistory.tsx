import { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
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
} from "@mui/material";
import { useMembersQuery } from "./members.queries";
import type { Member, MemberActivity } from "./member.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

const STATUS_CONFIG: Record<string, { color: "success" | "warning" | "error" | "default" | "info" }> = {
  Accepted:  { color: "success" },
  Invited:   { color: "warning" },
  Rejected:  { color: "error"   },
  Suspended: { color: "default" },
};

const ROLE_COLOR: Record<string, "primary" | "secondary" | "info" | "warning"> = {
  Admin:  "info",
  Editor: "primary",
  Viewer: "secondary",
};

const PLATFORM_COLOR: Record<string, string> = {
  LinkedIn:  "#0A66C2",
  Instagram: "#E1306C",
  Facebook:  "#1877F2",
};

const ACTIVITY_ICON: Record<string, string> = {
  LOGIN:          "→",
  LOGOUT:         "←",
  POST_CREATED:   "✎",
  POST_PUBLISHED: "➤",
  INVITE_SENT:    "✉",
};

const ACTIVITY_COLOR: Record<string, string> = {
  LOGIN:          "#22c55e",
  LOGOUT:         "#94a3b8",
  POST_CREATED:   "#a78bfa",
  POST_PUBLISHED: "#f59e0b",
  INVITE_SENT:    "#38bdf8",
};

// ─── Platform chips ───────────────────────────────────────────────────────────

function PlatformChips({ platforms }: { platforms: string[] }) {
  if (platforms.length === 0)
    return <Typography variant="caption" color="text.disabled">None</Typography>;
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {platforms.map((p) => (
        <Chip
          key={p}
          size="small"
          label={p}
          sx={{
            fontSize: "0.65rem",
            height: 20,
            bgcolor: `${PLATFORM_COLOR[p] ?? "#888"}22`,
            color: PLATFORM_COLOR[p] ?? "#888",
            border: `1px solid ${PLATFORM_COLOR[p] ?? "#888"}44`,
            borderRadius: 1,
          }}
        />
      ))}
    </Stack>
  );
}

// ─── Activity timeline item ───────────────────────────────────────────────────

function ActivityItem({ activity, isLast }: { activity: MemberActivity; isLast: boolean }) {
  const icon  = ACTIVITY_ICON[activity.type]  ?? "•";
  const color = ACTIVITY_COLOR[activity.type] ?? "#94a3b8";

  return (
    <Stack direction="row" spacing={2}>
      <Stack alignItems="center">
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: `${color}18`,
            border: `1.5px solid ${color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        {!isLast && (
          <Box sx={{ width: 1.5, flex: 1, bgcolor: "rgba(255,255,255,0.07)", minHeight: 16 }} />
        )}
      </Stack>

      <Box pb={isLast ? 0 : 2} flex={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack spacing={0.3}>
            <Typography variant="body2" fontWeight={500}>
              {activity.description}
            </Typography>
            {activity.platform && (
              <Chip
                size="small"
                label={activity.platform}
                sx={{
                  width: "fit-content",
                  fontSize: "0.6rem",
                  height: 18,
                  bgcolor: `${PLATFORM_COLOR[activity.platform] ?? "#888"}18`,
                  color: PLATFORM_COLOR[activity.platform] ?? "#888",
                  borderRadius: 0.75,
                }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, ml: 2, mt: 0.2 }}>
            {formatDate(activity.timestamp)}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({ member }: { member: Member }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        hover
        sx={{
          "& td": { borderBottom: open ? "none" : undefined },
          bgcolor: open ? "rgba(255,255,255,0.02)" : undefined,
        }}
      >
        <TableCell>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: member.customColor,
                width: 38,
                height: 38,
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              {member.initials}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {member.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {member.email}
              </Typography>
            </Box>
          </Stack>
        </TableCell>

        <TableCell>
          <Chip
            size="small"
            label={member.role}
            color={ROLE_COLOR[member.role] ?? "default"}
            sx={{ borderRadius: 1, fontSize: "0.7rem" }}
          />
        </TableCell>

        <TableCell>
          <Chip
            size="small"
            label={member.status}
            color={STATUS_CONFIG[member.status]?.color ?? "default"}
            sx={{ borderRadius: 1, fontSize: "0.7rem" }}
          />
        </TableCell>

        <TableCell>
          <Typography variant="body2">{formatDate(member.invitedAt)}</Typography>
        </TableCell>

        <TableCell>
          <Stack spacing={0.2}>
            <Typography variant="body2">{timeAgo(member.lastActiveAt)}</Typography>
            {member.lastActiveAt && (
              <Typography variant="caption" color="text.disabled">
                {formatDate(member.lastActiveAt)}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <PlatformChips platforms={member.platformsConnected} />
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
            <Chip
              size="small"
              label={`${member.activity.length} events`}
              sx={{ fontSize: "0.65rem", height: 20, bgcolor: "rgba(255,255,255,0.06)", borderRadius: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              sx={{
                fontSize: "0.75rem",
                color: open ? "primary.main" : "text.secondary",
                transition: "transform 0.2s",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              ▼
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0, border: "none" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                px: 3,
                py: 2.5,
                bgcolor: "rgba(255,255,255,0.015)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Activity History
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {member.activity.length} recorded event{member.activity.length !== 1 ? "s" : ""}
                </Typography>
              </Stack>

              <Stack spacing={0}>
                {member.activity.map((a, i) => (
                  <ActivityItem
                    key={a.id}
                    activity={a}
                    isLast={i === member.activity.length - 1}
                  />
                ))}
              </Stack>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ─── Summary stats bar ────────────────────────────────────────────────────────

function SummaryBar({ members }: { members: Member[] }) {
  const total     = members.length;
  const accepted  = members.filter((m) => m.status === "Accepted").length;
  const pending   = members.filter((m) => m.status === "Invited").length;
  const suspended = members.filter((m) => m.status === "Suspended").length;

  const stats = [
    { label: "Total Invited", value: total,     color: "#a78bfa" },
    { label: "Accepted",      value: accepted,  color: "#22c55e" },
    { label: "Pending",       value: pending,   color: "#f59e0b" },
    { label: "Suspended",     value: suspended, color: "#94a3b8" },
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
  const { data: members = [] } = useMembersQuery();
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter,   setRoleFilter]   = useState("All");

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    const matchRole   = roleFilter   === "All" || m.role   === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Invited Users History
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          TRACK INVITES, LOGINS, AND SOCIAL PLATFORM ACTIVITY
        </Typography>
      </Box>

      <SummaryBar members={members} />

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField
          size="small"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {["All", "Accepted", "Invited", "Rejected", "Suspended"].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
              <TableCell>Status</TableCell>
              <TableCell>Invited At</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell>Platforms</TableCell>
              <TableCell align="right">Activity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.disabled">No members match your filters.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => <MemberRow key={m.id} member={m} />)
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}