import { Box, Paper, Typography, Stack, Button } from "@mui/material";

export function ContentFeedPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" >Content Feed</Typography>
        <Typography variant="body2" color="text.secondary">Review all your scheduled and published content</Typography>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: "center", mt: 4, bgcolor: "background.paper", borderStyle: "dashed" }}>
        <Typography variant="h6" color="text.secondary" sx={{mb: 1 }}>
          Your feed is empty
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          There is no recent content published or drafted yet. Start creating right now to fill up your feed!
        </Typography>
        <Button variant="contained" color="primary">Start Creating</Button>
      </Paper>
    </Stack>
  );
}
