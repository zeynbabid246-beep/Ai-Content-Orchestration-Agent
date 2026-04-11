import { createBrand, getBrands } from "./brands.repository";

describe("brands.repository", () => {
  it("returns static brands", async () => {
    const brands = await getBrands();
    expect(brands.length).toBeGreaterThan(0);
  });

  it("creates a brand and returns it", async () => {
    const result = await createBrand({
      name: "New Brand",
      voice: "Professional",
      website: "https://new.example",
      primaryColor: "#111111",
      secondaryColor: "#222222",
    });

    expect(result.id).toContain("brand-");
    expect(result.name).toBe("New Brand");
  });
});
