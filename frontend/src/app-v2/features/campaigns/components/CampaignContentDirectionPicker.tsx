import { Box, Paper, Radio, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface CampaignContentDirectionPickerProps {
  directions: string[];
  selected: string | null;
  onChange: (direction: string) => void;
  disabled?: boolean;
}

export function CampaignContentDirectionPicker({
  directions,
  selected,
  onChange,
  disabled = false,
}: CampaignContentDirectionPickerProps) {
  const theme = useTheme();

  if (directions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No content directions available. Generate a strategy first.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">Choose a content direction</Typography>
      <Typography variant="caption" color="text.secondary">
        The AI proposed {directions.length} direction{directions.length > 1 ? "s" : ""}. Pick the
        one that best fits your campaign vision.
      </Typography>
      {directions.map((direction, index) => {
        const isSelected = selected === direction;
        return (
          <Paper
            key={index}
            variant="outlined"
            component="button"
            type="button"
            onClick={() => !disabled && onChange(direction)}
            sx={{
              p: 2,
              textAlign: "left",
              width: "100%",
              cursor: disabled ? "default" : "pointer",
              borderColor: isSelected ? "primary.main" : "divider",
              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.06) : "transparent",
              "&:hover": disabled
                ? {}
                : { bgcolor: alpha(theme.palette.primary.main, 0.04) },
              transition: "all 0.15s ease",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Radio
                checked={isSelected}
                size="small"
                disabled={disabled}
                sx={{ p: 0, mt: 0.25 }}
                tabIndex={-1}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={isSelected ? 600 : 400}>
                  Direction {index + 1}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {direction}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
