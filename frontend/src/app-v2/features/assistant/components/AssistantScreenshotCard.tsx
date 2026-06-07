import { Box, Typography } from "@mui/material";
import type { AssistantScreenshot } from "../assistant.types";
import { ASSISTANT_COLORS } from "../assistant.i18n";

type Props = {
  screenshot: AssistantScreenshot;
  rtl?: boolean;
};

export function AssistantScreenshotCard({ screenshot, rtl = false }: Props) {
  return (
    <Box
      sx={{
        border: `1px solid ${ASSISTANT_COLORS.border}`,
        borderRadius: "12px",
        overflow: "hidden",
        bgcolor: ASSISTANT_COLORS.surface,
        mb: 1,
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      <Box
        component="img"
        src={screenshot.url}
        alt={screenshot.title}
        sx={{
          width: "100%",
          height: 120,
          objectFit: "cover",
          display: "block",
          bgcolor: ASSISTANT_COLORS.bg,
        }}
      />
      <Box sx={{ px: 1.25, py: 1 }}>
        <Typography variant="caption" fontWeight={700} color={ASSISTANT_COLORS.text} display="block">
          {screenshot.title}
        </Typography>
        {screenshot.description ? (
          <Typography variant="caption" color={ASSISTANT_COLORS.muted} display="block" mt={0.25}>
            {screenshot.description}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
