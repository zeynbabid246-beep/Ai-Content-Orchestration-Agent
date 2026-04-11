import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { type ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateBrandMutation } from "./brands.queries";

const defaultModel = {
  name: "",
  voice: "Professional",
  website: "",
  primaryColor: "#0F172A",
  secondaryColor: "#6366F1",
};

export function CreateBrandPage() {
  const navigate = useNavigate();
  const [model, setModel] = useState(defaultModel);
  const mutation = useCreateBrandMutation();

  const update = (field: keyof typeof model) => (event: ChangeEvent<HTMLInputElement>) => {
    setModel((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const submit = () => {
    if (!model.name.trim() || !model.website.trim()) return;
    mutation.mutate(model, {
      onSuccess: () => navigate("/app/brands"),
    });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontFamily: "Cormorant Garamond, serif" }}>
        Create Brand
      </Typography>

      {mutation.isError ? <Alert severity="error">{(mutation.error as Error).message}</Alert> : null}

      <Card sx={{ maxWidth: 800 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField label="Brand name" value={model.name} onChange={update("name")} />
            <TextField label="Website" value={model.website} onChange={update("website")} />
            <TextField label="Brand voice" value={model.voice} onChange={update("voice")} />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField label="Primary color" value={model.primaryColor} onChange={update("primaryColor")} />
              <TextField label="Secondary color" value={model.secondaryColor} onChange={update("secondaryColor")} />
            </Box>
            <Button variant="contained" onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save brand"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
