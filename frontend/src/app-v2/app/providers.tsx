import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, StyledEngineProvider } from "@mui/material";
import { PropsWithChildren, useMemo } from "react";
import { appTheme } from "./theme";

export function AppV2Providers({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
        },
      },
    });
  }, []);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
