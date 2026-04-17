import { describe, it, expect } from "vitest";
import { getBrands, createBrand, updateBrand } from "./brands.repository";

describe("brands.repository", () => {
  it("getBrands returns mock data", async () => {
    const brands = await getBrands();
    expect(brands.length).toBeGreaterThanOrEqual(2);
    expect(brands[0]).toHaveProperty("id");
    expect(brands[0]).toHaveProperty("name");
    expect(brands[0]).toHaveProperty("colors");
  });

  it("createBrand adds a new brand", async () => {
    const before = await getBrands();
    const newBrand = await createBrand({
      name: "Test Brand",
      voice: "Playful",
      website: "https://test.com",
      primaryColor: "#111111",
      secondaryColor: "#222222",
    });
    const after = await getBrands();

    expect(newBrand.name).toBe("Test Brand");
    expect(newBrand.voice).toBe("Playful");
    expect(newBrand.colors.primary).toBe("#111111");
    expect(after.length).toBe(before.length + 1);
  });

  it("updateBrand modifies an existing brand", async () => {
    const brands = await getBrands();
    const first = brands[0];
    const updated = await updateBrand(first.id, { name: "Updated Name" });
    expect(updated.name).toBe("Updated Name");
    expect(updated.id).toBe(first.id);
  });

  it("updateBrand throws for unknown id", async () => {
    await expect(updateBrand("unknown-id", { name: "X" })).rejects.toThrow("Brand not found");
  });
});
