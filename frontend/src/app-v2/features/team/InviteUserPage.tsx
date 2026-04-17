import { useState } from "react";

import {
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
} from "@mui/material";

type Member = {
  id: number;
  name: string;
  email: string;
  role: "Editor" | "Viewer" | "Admin" ;
  status: "Accepted" | "Pending";
  initials: string;
  customColor: string;
};

const AVATAR_COLORS = ["primary.main", "secondary.main", "info.main", "warning.main"] as const;
const ROLE_COLOR = { Editor: "primary", Viewer: "secondary", Admin: "info" } as const;

const INITIAL_MEMBERS: Member[] = [
  { id: 1, name: "Siwar Attia", email: "siwar@acme.io", role: "Editor", status: "Accepted", initials: "SA", customColor: AVATAR_COLORS[0] },
  { id: 2, name: "Nawal", email: "nawal@acme.io", role: "Viewer", status: "Pending", initials: "NA", customColor: AVATAR_COLORS[1] },
];

function getInitials(email: string) {
  const name = email.split("@")[0].replace(/[._]/g, " ").trim();
  return name.split(" ").map((word) => word[0] || "").join("").toUpperCase().slice(0, 2) || "??";
}
function getDisplayName(email: string) {
  return email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

let colorIdx = 2;
let memberId = 10;

export function InviteUserPage() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Member["role"]>("Editor");
  const [error, setError] = useState("");

  const handleInvite = () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    const color = AVATAR_COLORS[colorIdx++ % AVATAR_COLORS.length];
    setMembers((prev) => [
      ...prev,
      { id: memberId++, name: getDisplayName(email), email: email.trim(), role, status: "Pending", initials: getInitials(email), customColor: color },
    ]);
    setEmail("");
  };

  const handleRemove = (id: number) => setMembers((prev) => prev.filter((member) => member.id !== id));

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" >Team Members</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          INVITE AND MANAGE YOUR WORKSPACE COLLABORATORS
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label="Email address"
            placeholder="colleague@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={Boolean(error)}
            helperText={error || ""}
            onKeyDown={(event) => event.key === "Enter" && handleInvite()}
          />
          <TextField select label="Role" value={role} onChange={(event) => setRole(event.target.value as Member["role"])} sx={{ minWidth: 180 }}>
            <MenuItem value="Editor">Editor</MenuItem>
            <MenuItem value="Viewer">Viewer</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Commenter">Commenter</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleInvite}>Invite</Button>
        </Stack>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Member</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: member.customColor, color: "background.default" }}>{member.initials}</Avatar>
                    <Typography variant="body2" fontWeight={500}>{member.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell><Chip size="small" color={ROLE_COLOR[member.role]} label={member.role} sx={{ borderRadius: 1 }} /></TableCell>
                <TableCell><Chip size="small" color={member.status === "Accepted" ? "success" : "secondary"} label={member.status} sx={{ borderRadius: 1 }} /></TableCell>
                <TableCell align="right"><Button color="error" onClick={() => handleRemove(member.id)}>Remove</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
