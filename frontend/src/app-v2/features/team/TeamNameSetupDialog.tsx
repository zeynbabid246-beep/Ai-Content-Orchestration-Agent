import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { setTeamName } from "./teams.api";
import { authStorage } from "../../shared/lib/storage";

type TeamNameSetupDialogProps = {
  open: boolean;
  teamId: string;
  onComplete?: () => void;
};

export function TeamNameSetupDialog({ open, teamId, onComplete }: TeamNameSetupDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => setTeamName(teamId, name.trim()),
    onSuccess: () => {
      authStorage.setTeamNameSetupRequired(false);
      setCompleted(true);
      onComplete?.();
      void queryClient.invalidateQueries();
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const isOpen = open && !completed;

  return (
    <Dialog open={isOpen} disableEscapeKeyDown>
      <DialogTitle>Name your team</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          As the team owner, choose a name for your workspace before you continue.
        </Alert>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Team name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) mutation.mutate();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          disabled={!name.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving…" : "Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
