import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getTeamActivity } from "./teams.api";

const ACTION_LABELS: Record<string, string> = {
  MemberInvited: "Member invited",
  InvitationRevoked: "Invitation revoked",
  InvitationAccepted: "Invitation accepted",
  MemberRemoved: "Member removed",
  MemberRoleChanged: "Member role changed",
  PostCreated: "Post created",
  PostPublished: "Post published",
  PostScheduled: "Post scheduled",
  ChannelCreated: "Channel created",
  ChannelDeleted: "Channel deleted",
  SocialAccountConnected: "Social account connected",
};

export function TeamActivityPanel() {
  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["team", "activity"],
    queryFn: () => getTeamActivity(50),
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load team activity.</Alert>;
  }

  if (data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No activity recorded yet.</Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>When</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Details</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                {new Date(event.createdAt).toLocaleString("en-GB")}
              </TableCell>
              <TableCell>{ACTION_LABELS[event.action] ?? event.action}</TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {event.entityType ? `${event.entityType}` : "—"}
                  {event.entityId ? ` #${event.entityId}` : ""}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
