import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },
    secondary: { main: "#0f172a" },
    success: { main: "#16a34a" },
    warning: { main: "#ca8a04" },
    error: { main: "#dc2626" },
    info: { main: "#0284c7" },
    text: {
      primary: "#0f172a",
      secondary: "#475569",
    },
    divider: "#e2e8f0",
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Outfit", system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: "none",
      letterSpacing: 0.2,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(248,250,252,0.92)",
        },
      },
    },
  },
});
