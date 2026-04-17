import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send this to an error reporting service
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            p: 3,
          }}
        >
          <Paper sx={{ p: 5, maxWidth: 520, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom color="error.main">
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error occurred. You can try reloading the page or going back.
            </Typography>
            {this.state.error && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: "rgba(255,0,0,0.06)",
                  border: "1px solid rgba(255,0,0,0.15)",
                  textAlign: "left",
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontFamily: "monospace", wordBreak: "break-word" }}>
                  {this.state.error.message}
                </Typography>
              </Paper>
            )}
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="outlined" onClick={this.handleReset}>
                Try again
              </Button>
              <Button variant="contained" onClick={this.handleReload}>
                Reload page
              </Button>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
