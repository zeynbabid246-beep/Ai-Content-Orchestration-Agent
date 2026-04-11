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
