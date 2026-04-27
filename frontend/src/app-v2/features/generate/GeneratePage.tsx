import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Select,
  OutlinedInput,
  Chip,
} from "@mui/material";

import { GoldButton } from "../../shared/ui/GoldButton";

const PLATFORMS = [
  "LinkedIn Post",
  "Instagram Post",
  "Facebook Post",
  "Twitter / X",
  "Blog Article",
  "Instagram Story",
];

const LANGUAGES = ["English", "French", "Arabic"];

export function GeneratePage() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [language, setLanguage] = useState("English");
  const [audience, setAudience] = useState("");

  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const generate = () => {
    if (!topic.trim()) {
      setError("Please enter a topic first.");
      return;
    }

    setError("");
    setLoading(true);
    setProgress(10);
    setOutput("");

    setTimeout(() => setProgress(50), 400);
    setTimeout(() => setProgress(85), 900);

    setTimeout(() => {
      setOutput(
        `Topic: ${topic}\nPlatforms: ${platforms.join(
          ", "
        )}\nLanguage: ${language}\nAudience: ${audience}`
      );
      setProgress(100);
      setLoading(false);
    }, 1400);
  };

  const saveDraft = () => {
    const draft = { topic, platforms, language, audience, output };
    localStorage.setItem("draft_content", JSON.stringify(draft));
    alert("Draft saved!");
  };

  const publish = () => {
    alert("Published!");
  };

  const schedule = () => {
    navigate("/app/scheduler");
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">AI Content Generator</Typography>
        <Typography variant="body2" color="text.secondary">
          Create platform-optimized content in seconds
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Stack spacing={2} sx={{ flex: 2 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                multiline
                minRows={4}
                label="Topic / Brief"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />

              <Select
                multiple
                value={platforms}
                onChange={(e) => setPlatforms(e.target.value as string[])}
                input={<OutlinedInput label="Platforms" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {PLATFORMS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>

              <TextField
                select
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <MenuItem key={l} value={l}>
                    {l}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Target Audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />

              <LinearProgress variant="determinate" value={progress} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">What's on your mind</Typography>

              <TextField
                multiline
                minRows={8}
                value={output}
                placeholder="What's on your mind..."
              />

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <GoldButton onClick={generate}>
                  Generate with AI
                </GoldButton>

                <GoldButton onClick={saveDraft}>
                  Save Draft
                </GoldButton>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "success.main",
                    "&:hover": { bgcolor: "success.dark" },
                  }}
                  onClick={publish}
                >
                  Publish
                </Button>

                <GoldButton onClick={schedule}>
                  Schedule
                </GoldButton>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  );
}