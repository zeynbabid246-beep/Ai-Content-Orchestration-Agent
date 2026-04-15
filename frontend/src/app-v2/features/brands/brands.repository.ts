import type { Brand } from "../../shared/types/domain";
import { mockBrands } from "../../mocks/brands";

let inMemoryBrands = [...mockBrands];

export async function getBrands(): Promise<Brand[]> {
  return Promise.resolve(inMemoryBrands);
}

export interface CreateBrandInput {
  name: string;
  voice: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const newBrand: Brand = {
    id: `brand-${Date.now()}`,
    name: input.name.trim(),
    voice: input.voice,
    website: input.website.trim(),
    colors: { primary: input.primaryColor, secondary: input.secondaryColor },
    ownerId: localStorage.getItem("userId") ?? "user-1",
    createdAt: new Date().toISOString(),
  };

  inMemoryBrands = [newBrand, ...inMemoryBrands];
  return Promise.resolve(newBrand);
}

export async function updateBrand(id: string, input: Partial<CreateBrandInput>): Promise<Brand> {
  const index = inMemoryBrands.findIndex((b) => b.id === id);
  if (index === -1) throw new Error("Brand not found");

  const existing = inMemoryBrands[index];
  const updatedBrand: Brand = {
    ...existing,
    ...(input.name && { name: input.name.trim() }),
    ...(input.voice && { voice: input.voice }),
    ...(input.website && { website: input.website.trim() }),
    colors: {
      primary: input.primaryColor || existing.colors.primary,
      secondary: input.secondaryColor || existing.colors.secondary,
    },
  };

  inMemoryBrands[index] = updatedBrand;
  return Promise.resolve(updatedBrand);
}
