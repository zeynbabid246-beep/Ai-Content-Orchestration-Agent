import type { Brand } from "../shared/types/domain";

export const mockBrands: Brand[] = [
  {
    id: "brand-1",
    name: "Consultim IT",
    voice: "Professional",
    colors: { primary: "#0F172A", secondary: "#6366F1" },
    website: "https://consultim-it.com",
    createdAt: "2026-04-01T08:00:00Z",
    ownerId: "user-1",
  },
  {
    id: "brand-2",
    name: "Acme Commerce",
    voice: "Bold",
    colors: { primary: "#1E293B", secondary: "#F59E0B" },
    website: "https://acme-commerce.example",
    createdAt: "2026-04-02T10:30:00Z",
    ownerId: "user-1",
  },
];
