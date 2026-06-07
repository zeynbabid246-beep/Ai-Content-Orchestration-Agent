import { Box, Chip } from "@mui/material";
import { ASSISTANT_COLORS } from "../assistant.i18n";

type Props = {
  suggestions: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  rtl?: boolean;
};

export function AssistantQuickReplies({ suggestions, onSelect, disabled = false, rtl = false }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.75,
        mt: 1,
        mb: 0.5,
        direction: rtl ? "rtl" : "ltr",
      }}
    >
      {suggestions.map((text) => (
        <Chip
          key={text}
          label={text}
          size="small"
          disabled={disabled}
          onClick={() => onSelect(text)}
          sx={{
            bgcolor: ASSISTANT_COLORS.bg,
            color: ASSISTANT_COLORS.primaryDark,
            border: `1px solid ${ASSISTANT_COLORS.border}`,
            fontSize: 11.5,
            height: "auto",
            py: 0.5,
            "& .MuiChip-label": { whiteSpace: "normal", lineHeight: 1.35 },
            "&:hover": { bgcolor: "#EDE9FE" },
          }}
        />
      ))}
    </Box>
  );
}
