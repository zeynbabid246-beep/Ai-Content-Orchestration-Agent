import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Platform = {
  id: string;
  name: string;
  sub: string;
  icon: ReactNode;
  stats: { posts: string; reach: string };
  connected: boolean;
};

const PLATFORMS: Platform[] = [
  { id: "linkedin", name: "LinkedIn", sub: "Professional network", icon: "in", stats: { posts: "24", reach: "8.4k" }, connected: true },
  { id: "instagram", name: "Instagram", sub: "Photo & video sharing", icon: "IG", stats: { posts: "41", reach: "12.1k" }, connected: true },
  { id: "facebook", name: "Facebook", sub: "Social engagement", icon: "f", stats: { posts: "17", reach: "5.2k" }, connected: false },
  
];

export function SocialMediaPage() {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState(PLATFORMS);

  const toggleConnect = (id: string) => {
    setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p)));
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" >Social Media</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1.2 }}>MANAGE YOUR CONNECTED PLATFORMS</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
        {platforms.map((platform) => (
          <Box key={platform.id}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 40, height: 40, borderRadius: 1, display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,0.05)", typography: "caption", border: "1px solid", borderColor: "divider" }}>
                      {platform.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" >{platform.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{platform.sub}</Typography>
                    </Box>
                  </Stack>

                  <Chip size="small" label={platform.connected ? "Connected · Active" : "Not connected"} color={platform.connected ? "success" : "default"} sx={{ width: "fit-content", borderRadius: 1 }} />

                  {platform.connected ? (
                    <>
                      <Stack direction="row" spacing={1}>
                        <Box sx={{ flex: 1, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "rgba(255,255,255,0.02)" }}>
                          <Typography variant="body1" color="primary.main">{platform.stats.posts}</Typography>
                          <Typography variant="caption" color="text.secondary">Posts</Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "rgba(255,255,255,0.02)" }}>
                          <Typography variant="body1" color="primary.main">{platform.stats.reach}</Typography>
                          <Typography variant="caption" color="text.secondary">Reach</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} mt={1}>
                        <Button variant="contained" fullWidth onClick={() => navigate("/generate")}>connect</Button>
                        <Button variant="outlined" fullWidth onClick={() => toggleConnect(platform.id)}>Disconnect</Button>
                      </Stack>
                    </>
                  ) : (
                    <Box mt={1}>
                      <Typography variant="body2" color="text.secondary" mb={2}>Connect this account to start publishing and tracking performance.</Typography>
                      <Button variant="outlined" onClick={() => toggleConnect(platform.id)}>Connect {platform.name}</Button>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}
