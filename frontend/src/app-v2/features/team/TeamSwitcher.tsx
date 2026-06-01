import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { switchTeam, getMyTeams } from "./teams.api";
import { authStorage } from "../../shared/lib/storage";

export function TeamSwitcher() {
  const queryClient = useQueryClient();
  const currentTeamId = authStorage.getTeamId();

  const { data: teams = [] } = useQuery({
    queryKey: ["my-teams"],
    queryFn: getMyTeams,
  });

  if (teams.length <= 1) {
    return null;
  }

  const handleChange = async (event: SelectChangeEvent<string>) => {
    const teamId = event.target.value;
    const result = await switchTeam(teamId);
    authStorage.setTeam(String(result.teamId), result.teamRole);
    await queryClient.invalidateQueries();
    window.location.reload();
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }}>
      <InputLabel id="team-switcher-label">Team</InputLabel>
      <Select
        labelId="team-switcher-label"
        label="Team"
        value={currentTeamId ?? ""}
        onChange={handleChange}
      >
        {teams.map((team) => (
          <MenuItem key={team.teamId} value={String(team.teamId)}>
            {team.teamName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
