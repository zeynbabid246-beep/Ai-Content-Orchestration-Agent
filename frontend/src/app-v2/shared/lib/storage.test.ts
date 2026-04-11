import { describe, it, expect, beforeEach } from "vitest";
import { authStorage } from "./storage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves access token", () => {
    authStorage.setTokens("test-access-token", "test-refresh-token");
    expect(authStorage.getAccessToken()).toBe("test-access-token");
  });

  it("stores and retrieves username", () => {
    authStorage.setUser("user-123", "testuser");
    expect(authStorage.getUsername()).toBe("testuser");
  });

  it("clears all stored data", () => {
    authStorage.setTokens("access", "refresh");
    authStorage.setUser("id", "name");
    authStorage.clear();
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getUsername()).toBeNull();
  });

  it("returns null when no token is stored", () => {
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getUsername()).toBeNull();
  });
});
