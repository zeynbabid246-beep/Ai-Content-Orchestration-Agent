import type { Brand } from "../../shared/types/domain";

// ─── Base URL ─────────────────────────────────────────────────────────────────
const API_BASE = "http://127.0.0.1:8000";

// ─── Input / Response Types ───────────────────────────────────────────────────

export interface CreateBrandInput {
  name: string;
  voice: string;
  website: string;
  primaryColor: string;
  secondaryColor: string;
  org_id?: string;
  tone?: string;
  typography?: string;
  email?: string;
  business_info?: string;
}

export interface BrandConfigurePayload {
  org_id: string;
  website_url: string;
  brand_name: string;
  tone: string;
  primary_color: string;
  secondary_color: string;
  typography: string;
  email: string;
  business_info: string;
}

export interface BrandAnalyzePayload {
  org_id: string;
  website_url: string;
}

export interface BrandAnalyzeResult {
  org_id: string;
  brand_name?: string;
  tone_of_voice?: string[];
  audience_signals?: string[];
  content_pillars?: string[];
  brand_summary?: string;
  colors?: { primary?: string; secondary?: string };
  typography?: string;
  website_url?: string;
  [key: string]: unknown;
}

// ─── Raw API calls ────────────────────────────────────────────────────────────

/** POST /api/brand/configure */
export async function configureBrandAPI(payload: BrandConfigurePayload): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/brand/configure`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`configure failed: ${await res.text()}`);
  return res.json();
}

/** POST /api/brand/analyze */
export async function analyzeBrandAPI(payload: BrandAnalyzePayload): Promise<BrandAnalyzeResult> {
  const res = await fetch(`${API_BASE}/api/brand/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`analyze failed: ${await res.text()}`);
  return res.json();
}

/** GET /api/brand/latest/:org_id */
export async function getLatestBrandAPI(org_id: string): Promise<BrandAnalyzeResult> {
  const res = await fetch(`${API_BASE}/api/brand/latest/${org_id}`);
  if (!res.ok) throw new Error(`getLatest failed: ${await res.text()}`);
  return res.json();
}

// ─── Repository functions (used by React Query hooks) ─────────────────────────

/**
 * Fetches the current brand from the backend using the stored org_id.
 * The friend's API has no "list all brands" endpoint, so we fetch one at a time.
 */
export async function getBrands(): Promise<Brand[]> {
  const org_id = localStorage.getItem("org_id");
  if (!org_id) return [];

  try {
    const result = await getLatestBrandAPI(org_id);
    return [mapAPIResultToBrand(result)];
  } catch {
    return []; // Brand not configured yet — return empty, not an error
  }
}

/** Creates a brand on the backend and returns it as a Brand object */
export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const org_id = input.org_id ?? slugify(input.name);

  await configureBrandAPI({
    org_id,
    website_url: input.website,
    brand_name: input.name,
    tone: input.voice ?? input.tone ?? "",
    primary_color: input.primaryColor,
    secondary_color: input.secondaryColor,
    typography: input.typography ?? "",
    email: input.email ?? "",
    business_info: input.business_info ?? "",
  });

  // Persist org_id so getBrands() can fetch it next time
  localStorage.setItem("org_id", org_id);

  return {
    id: org_id,
    name: input.name.trim(),
    voice: input.voice,
    website: input.website.trim(),
    colors: { primary: input.primaryColor, secondary: input.secondaryColor },
    ownerId: localStorage.getItem("userId") ?? "user-1",
    createdAt: new Date().toISOString(),
  };
}

/** Updates a brand on the backend by merging with current state */
export async function updateBrand(id: string, input: Partial<CreateBrandInput>): Promise<Brand> {
  // Pull current state from backend to fill in missing fields
  const current = await getLatestBrandAPI(id);

  await configureBrandAPI({
    org_id: id,
    website_url: input.website ?? (current.website_url as string) ?? "",
    brand_name: input.name ?? current.brand_name ?? "",
    tone: input.voice ?? input.tone ?? (current.tone_of_voice?.join(", ") ?? ""),
    primary_color: input.primaryColor ?? current.colors?.primary ?? "#000000",
    secondary_color: input.secondaryColor ?? current.colors?.secondary ?? "#ffffff",
    typography: input.typography ?? current.typography ?? "",
    email: input.email ?? "",
    business_info: input.business_info ?? current.brand_summary ?? "",
  });

  return mapAPIResultToBrand({
    ...current,
    brand_name: input.name ?? current.brand_name,
    colors: {
      primary: input.primaryColor ?? current.colors?.primary,
      secondary: input.secondaryColor ?? current.colors?.secondary,
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_") || `brand_${Date.now()}`;
}

function mapAPIResultToBrand(result: BrandAnalyzeResult): Brand {
  return {
    id: result.org_id,
    name: result.brand_name ?? result.org_id,
    voice: result.tone_of_voice?.join(", ") ?? "",
    website: (result.website_url as string) ?? "",
    colors: {
      primary: result.colors?.primary ?? "#000000",
      secondary: result.colors?.secondary ?? "#ffffff",
    },
    ownerId: localStorage.getItem("userId") ?? "user-1",
    createdAt: new Date().toISOString(),
  };
}