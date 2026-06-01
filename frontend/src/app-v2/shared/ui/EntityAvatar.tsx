import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { getEntityColor, getEntityInitials } from "../lib/entityVisual";

interface EntityAvatarProps {
  name: string;
  seed?: string | number;
  size?: number;
  color?: string;
  sx?: SxProps<Theme>;
}

export function EntityAvatar({ name, seed, size = 36, color, sx }: EntityAvatarProps) {
  const initials = getEntityInitials(name);
  const bg = color ?? getEntityColor(seed ?? name);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1.25,
        display: "grid",
        placeItems: "center",
        bgcolor: `${bg}22`,
        color: bg,
        border: `1px solid ${bg}55`,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: size < 32 ? "0.65rem" : size < 48 ? "0.75rem" : "0.85rem",
          letterSpacing: 0.3,
        }}
      >
        {initials}
      </Typography>
    </Box>
  );
}
