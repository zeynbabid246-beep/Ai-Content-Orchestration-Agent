import { Button } from "@mui/material";
import type { ReactNode } from "react";

interface GoldButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "ghost";
  size?: "small" | "medium";
  startIcon?: ReactNode;
  fullWidth?: boolean;
  sx?: any;
}

const styles = {
  primary: {
    background: "linear-gradient(135deg, #d4af7a 0%, #b8893e 100%)",
    color: "#1a0f1e",
    boxShadow: "0 4px 18px rgba(212,175,122,0.25)",
    "&:hover": { opacity: 0.88, transform: "translateY(-1px)", boxShadow: "0 8px 28px rgba(212,175,122,0.35)" },
  },
  ghost: {
    background: "transparent",
    color: "primary.main",
    border: "1px solid rgba(212,175,122,0.35)",
    "&:hover": { background: "rgba(212,175,122,0.08)", borderColor: "primary.main" },
  },
};

export function GoldButton({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  size = "medium",
  startIcon,
  fullWidth,
  sx,
}: GoldButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={startIcon}
      sx={{
        ...(variant === "primary" ? styles.primary : styles.ghost),
        px: size === "small" ? 2 : 3,
        py: size === "small" ? 0.8 : 1.2,
        fontSize: size === "small" ? 10 : 11,
        fontWeight: 500,
        transition: "all 0.2s",
        "&:disabled": { opacity: 0.45 },
        ...sx,
      }}
    >
      {loading ? "Processing…" : children}
    </Button>
  );
}
