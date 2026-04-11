import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { FaInstagram, FaBlogger, FaLinkedin, FaImage, FaFacebook } from "react-icons/fa";

const platforms = [
  { icon: <FaInstagram size={24} />, title: "Instagram Story", subtitle: "Social · Vertical" },
  { icon: <FaBlogger size={24} />, title: "Blog Post", subtitle: "Content · Long-form" },
  { icon: <FaLinkedin size={24} />, title: "LinkedIn Post", subtitle: "Professional · Network" },
  { icon: <FaImage size={24} />, title: "Post Image", subtitle: "Visual · Creative" },
  { icon: <FaFacebook size={24} />, title: "Facebook Post", subtitle: "Social · Engagement" },
  { icon: <FaInstagram size={24} />, title: "Instagram Post", subtitle: "Social · Square" },
];

export function ContentTypePage() {
  return (
    <Stack spacing={4}>
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="h3" sx={{mb: 1 }}>
          Choose Content Type
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a platform and format to get started
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
        {platforms.map((platform, idx) => (
          <Card 
            key={idx} 
            sx={{ 
              transition: "transform 0.2s, box-shadow 0.2s", 
              "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              cursor: "pointer",
              borderRadius: 2
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", p: 4 }}>
              <Box sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: "50%", 
                bgcolor: "rgba(212,175,122,0.1)", 
                color: "primary.main",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                mb: 2
              }}>
                {platform.icon}
              </Box>
              <Typography variant="h6" sx={{mb: 0.5 }}>
                {platform.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {platform.subtitle}
              </Typography>
              
              <Stack direction="row" spacing={2} width="100%">
                <Button variant="outlined" fullWidth>Text</Button>
                <Button variant="contained" fullWidth>Image</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
