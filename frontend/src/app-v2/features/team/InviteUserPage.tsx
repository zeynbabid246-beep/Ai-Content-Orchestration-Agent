
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { authStorage } from "../../shared/lib/storage";
import {
  useTeamMembersQuery,
  useInviteMemberMutation,
  useUpdateRoleMutation,
  useRemoveMemberMutation,
} from "./teams.queries";
import type { TeamRole } from "./teams.type";

const ROLE_COLOR: Record<string, "primary" | "secondary" | "info"> = {
  Admin: "info",
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

export function InviteUserPage() {

  const teamRole = authStorage.getTeamRole();
  const isAdmin = teamRole === "Admin";

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [role, setRole] = useState<"Editor" | "Viewer">("Editor");

  const { data: members = [], isLoading, isError } = useTeamMembersQuery();
  const inviteMutation = useInviteMemberMutation();
  const updateRoleMutation = useUpdateRoleMutation();
  const removeMutation = useRemoveMemberMutation();

  const handleInvite = () => {
    const value = emailOrUsername.trim();
    if (!value) return;
    // Backend's InviteUserDto.Username field accepts both username and email
    // because GetUserByUsernameOrEmailAsync searches by either
    inviteMutation.mutate(
      { username: value, role },
      {
        onSuccess: () => {
          setEmailOrUsername("");
        },
      }
    );
  };

  const handleRoleChange = (targetUserId: string, newRole: TeamRole) => {
    updateRoleMutation.mutate({ targetUserId, role: newRole });
  };

  const handleRemove = (targetUserId: string) => {
    removeMutation.mutate(targetUserId);
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Team Members</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          INVITE AND MANAGE YOUR WORKSPACE COLLABORATORS
        </Typography>
      </Box>

      {/* ── Invite Form (Admin only) ── */}
      {isAdmin && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary" }}>
            Invite a new member by email address or username
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              fullWidth
              label="Email or Username"
              placeholder="colleague@company.com or username"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                // Reset mutation state when user starts typing again
                if (inviteMutation.isError || inviteMutation.isSuccess) {
                  inviteMutation.reset();
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              error={inviteMutation.isError}
              helperText={
                inviteMutation.isError
                  ? (inviteMutation.error as Error).message
                  : "Enter the registered email or username of the user you want to invite"
              }
            />
            <TextField
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as "Editor" | "Viewer")}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="Editor">Editor</MenuItem>
              <MenuItem value="Viewer">Viewer</MenuItem>
            </TextField>
            <Button
              variant="contained"
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !emailOrUsername.trim()}
              sx={{ minWidth: 120 }}
            >
              {inviteMutation.isPending ? "Inviting..." : "Invite"}
            </Button>
          </Stack>

          {inviteMutation.isSuccess && (
            <Alert severity="success" sx={{ mt: 1.5 }} onClose={() => inviteMutation.reset()}>
              User invited successfully! They have been added to the team.
            </Alert>
          )}
        </Paper>
      )}

      {/* ── Members Table ── */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">Failed to load team members.</Alert>
      ) : members.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" mb={1}>
            No team members yet
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Invite collaborators using the form above to get started.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined At</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.userId} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          bgcolor: getAvatarColor(member.userId),
                          width: 36,
                          height: 36,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(member.username)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {member.username}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {isAdmin && member.role !== "Admin" ? (
                      <TextField
                        select
                        size="small"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value as TeamRole)
                        }
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="Editor">Editor</MenuItem>
                        <MenuItem value="Viewer">Viewer</MenuItem>
                      </TextField>
                    ) : (
                      <Chip
                        size="small"
                        label={member.role}
                        color={ROLE_COLOR[member.role] ?? "default"}
                        sx={{ borderRadius: 1 }}
                      />
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {new Date(member.joinedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  </TableCell>

                  {isAdmin && (
                    <TableCell align="right">
                      {member.role !== "Admin" && (
                        <Button
                          color="error"
                          size="small"
                          onClick={() => handleRemove(member.userId)}
                          disabled={removeMutation.isPending}
                        >
                          Remove
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}