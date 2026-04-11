import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({ palette: { mode: "dark" } });

function ThrowingComponent(): React.ReactElement {
  throw new Error("Test explosion");
}

function SafeComponent() {
  return <div>Safe content</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      </ThemeProvider>,
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders error UI when a child throws", () => {
    // Suppress console.error from the thrown error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ThemeProvider theme={theme}>
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      </ThemeProvider>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test explosion")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();

    spy.mockRestore();
  });
});
