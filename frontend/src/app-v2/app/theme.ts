import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#d4af7a" },
    secondary: { main: "#c5a0cc" },
    background: {
      default: "#1a0f1e",
      paper: "rgba(26,12,32,0.75)",
    },
  },
  typography: {
    fontFamily: '"Outfit", system-ui, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(212,175,122,0.18)",
          backgroundImage: "none",
        },
      },
    },
  },
});
