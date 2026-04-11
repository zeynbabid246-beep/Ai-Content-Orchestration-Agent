import { describe, it, expect } from "vitest";
import { ROUTES } from "./routes";

describe("ROUTES", () => {
  it("all routes start with /app/", () => {
    for (const [key, path] of Object.entries(ROUTES)) {
      expect(path).toMatch(/^\/app\//);
    }
  });

  it("contains expected critical routes", () => {
    expect(ROUTES.login).toBe("/app/login");
    expect(ROUTES.register).toBe("/app/register");
    expect(ROUTES.dashboard).toBe("/app/dashboard");
    expect(ROUTES.brandStudio).toBe("/app/brand-studio");
  });

  it("has no duplicate paths", () => {
    const paths = Object.values(ROUTES);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });
});
