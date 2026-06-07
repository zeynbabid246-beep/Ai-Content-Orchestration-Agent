import { Box, Typography } from "@mui/material";
import { ASSISTANT_COLORS } from "../assistant.i18n";

type Props = {
  role: "user" | "assistant";
  content: string;
  rtl?: boolean;
};

function formatContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .split("\n")
    .map((line, index, arr) => (index < arr.length - 1 ? `${line}\n` : line))
    .join("");
}

export function AssistantMessageBubble({ role, content, rtl = false }: Props) {
  const isUser = role === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-start",
        gap: 1,
        mb: 1.5,
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      {!isUser ? (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: ASSISTANT_COLORS.primary,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          CF
        </Box>
      ) : null}

      <Box
        sx={{
          maxWidth: "82%",
          px: 1.75,
          py: 1.25,
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          bgcolor: isUser ? ASSISTANT_COLORS.primary : ASSISTANT_COLORS.surface,
          color: isUser ? "white" : ASSISTANT_COLORS.text,
          border: isUser ? "none" : `1px solid ${ASSISTANT_COLORS.border}`,
          boxShadow: isUser ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            lineHeight: 1.55,
            fontSize: 13.5,
            textAlign: rtl && !isUser ? "right" : "left",
          }}
        >
          {formatContent(content)}
        </Typography>
      </Box>
    </Box>
  );
}
