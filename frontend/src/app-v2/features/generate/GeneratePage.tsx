import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

type Toggles = { hashtags: boolean; cta: boolean; emoji: boolean; stats: boolean };

export function GeneratePage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("LinkedIn Post");
  const [language, setLanguage] = useState("English");
  const [audience, setAudience] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [toggles, setToggles] = useState<Toggles>({ hashtags: true, cta: true, emoji: false, stats: false });

  const generate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic first.");
      return;
    }
    setError("");
    setLoading(true);
    setProgress(15);
    setOutput("");
    try {
      setTimeout(() => setProgress(50), 350);
      setTimeout(() => setProgress(85), 900);
      setTimeout(() => {
        setOutput(`Generated ${platform} content in ${language} for: ${topic}${audience ? `\nAudience: ${audience}` : ""}`);
        setProgress(100);
        setLoading(false);
      }, 1300);
    } catch {
      setError("Failed to generate content.");
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" >AI Content Generator</Typography>
        <Typography variant="body2" color="text.secondary">Create platform-optimized content in seconds</Typography>
      </Box>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Stack spacing={2} sx={{ flex: 2 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              {error ? <Alert severity="error">{error}</Alert> : null}
              <TextField multiline minRows={4} label="Topic / Brief" value={topic} onChange={(event) => setTopic(event.target.value)} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField select label="Platform" value={platform} onChange={(event) => setPlatform(event.target.value)} fullWidth>
                  {["LinkedIn Post", "Instagram Post", "Facebook Post", "Twitter / X", "Blog Article", "Instagram Story"].map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </TextField>
                <TextField select label="Language" value={language} onChange={(event) => setLanguage(event.target.value)} fullWidth>
                  {["English", "French", "Arabic", "Spanish", "German"].map((item) => (
                    <MenuItem key={item} value={item}>{item}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <TextField label="Target audience (optional)" value={audience} onChange={(event) => setAudience(event.target.value)} />
              <Button variant="contained" onClick={generate} disabled={loading}>{loading ? "Generating..." : "Generate with AI"}</Button>
              <LinearProgress variant="determinate" value={progress} />
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Typography variant="h6">Generated content</Typography>
              <TextField multiline minRows={8} value={output} placeholder="Generated content will appear here..." />
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => navigator.clipboard.writeText(output)} disabled={!output}>Copy</Button>
                <Button variant="outlined" onClick={() => navigate("/app/content-feed")} disabled={!output}>Save Draft</Button>
                <Button variant="contained" onClick={() => navigate("/app/social-media")} disabled={!output}>Publish</Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2} sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Tone</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {["Professional", "Playful", "Luxurious", "Bold", "Minimalist", "Technical"].map((tone) => <Chip key={tone} label={tone} />)}
            </Stack>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Include in content</Typography>
            <FormControlLabel control={<Switch checked={toggles.hashtags} onChange={() => setToggles((prev) => ({ ...prev, hashtags: !prev.hashtags }))} />} label="Hashtags" />
            <FormControlLabel control={<Switch checked={toggles.cta} onChange={() => setToggles((prev) => ({ ...prev, cta: !prev.cta }))} />} label="Call to Action" />
            <FormControlLabel control={<Switch checked={toggles.emoji} onChange={() => setToggles((prev) => ({ ...prev, emoji: !prev.emoji }))} />} label="Emojis" />
            <FormControlLabel control={<Switch checked={toggles.stats} onChange={() => setToggles((prev) => ({ ...prev, stats: !prev.stats }))} />} label="Statistics" />
          </Paper>
        </Stack>
      </Stack>
    </Stack>
  );
}
