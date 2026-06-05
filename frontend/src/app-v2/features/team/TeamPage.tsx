import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useState } from "react";
import { useTeamPermissions } from "../../shared/hooks/useTeamPermissions";
import { InviteUserPage } from "./InviteUserPage";
import { TeamActivityPanel } from "./TeamActivityPanel";

export function TeamPage() {
  const { canSuperviseTeam } = useTeamPermissions();
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Team
      </Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label="Members" />
        {canSuperviseTeam ? <Tab label="Activity" /> : null}
      </Tabs>
      {tab === 0 ? <InviteUserPage hideTitle /> : null}
      {tab === 1 && canSuperviseTeam ? <TeamActivityPanel /> : null}
    </Box>
  );
}
