export type BrandImportStatus = "queued" | "processing" | "completed" | "failed";

export interface BrandVisualIdentity {
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColors: string[];
  secondaryColors: string[];
  fontFamilies: string[];
  imageUrls: string[];
  visualStyle: string | null;
  heroText: string | null;
  ctaTexts: string[];
  screenshotPath: string | null;
  renderMode: string | null;
  hasLogo: boolean;
  hasImages: boolean;
}

export interface BrandVoiceGuidelines {
  do: string[];
  dont: string[];
}

export interface BrandParsedProfile {
  orgId: string | null;
  websiteUrl: string | null;
  brandName: string | null;
  brandSummary: string | null;
  slogan: string | null;
  valueProposition: string[];
  toneOfVoice: string[];
  audienceSignals: string[];
  contentPillars: string[];
  visualIdentity: BrandVisualIdentity;
  keyMessages: string[];
  businessInfo: string | null;
  email: string | null;
}

export interface BrandEnrichedProfile {
  brandPersonality: string[];
  brandArchetype: string | null;
  positioningStatement: string | null;
  voiceGuidelines: BrandVoiceGuidelines;
  messagingPriorities: string[];
  visualDirectionNotes: string | null;
  linkedInVoice: string | null;
  adCopyStyle: string | null;
  orgId: string | null;
  websiteUrl: string | null;
}

export interface BrandStudioDefaultConfig {
  toneOfVoice: string | null;
  targetAudience: string | null;
  contentPillars: string[];
  mission: string | null;
  brandSummary: string | null;
  preferredCampaignObjective: string | null;
}

export interface TeamBrandStudio {
  id: number;
  teamId: string;
  parsedProfile: BrandParsedProfile;
  enrichedProfile: BrandEnrichedProfile;
  defaultConfig: BrandStudioDefaultConfig;
  createdAt: string;
  updatedAt: string;
  latestImportJob: BrandImportJob | null;
}

export interface BrandImportJob {
  id: number;
  teamBrandStudioId: number;
  status: BrandImportStatus;
  websiteUrl: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface BrandStudioSnapshot {
  brandStudio: TeamBrandStudio | null;
}

export interface CreateBrandImportRequest {
  websiteUrl: string;
}

export interface CreateManualBrandStudioRequest {
  parsedProfile: BrandParsedProfile;
  enrichedProfile?: BrandEnrichedProfile;
  defaultConfig?: BrandStudioDefaultConfig;
}

export interface CreateBrandImportResponse {
  brandStudio: TeamBrandStudio;
  job: BrandImportJob;
}

export interface UpdateBrandStudioRequest {
  parsedProfile?: Partial<BrandParsedProfile> & {
    visualIdentity?: Partial<BrandVisualIdentity>;
  };
  enrichedProfile?: Partial<BrandEnrichedProfile> & {
    voiceGuidelines?: Partial<BrandVoiceGuidelines>;
  };
  defaultConfig?: Partial<BrandStudioDefaultConfig>;
}

export const emptyVisualIdentity = (): BrandVisualIdentity => ({
  logoUrl: null,
  faviconUrl: null,
  primaryColors: [],
  secondaryColors: [],
  fontFamilies: [],
  imageUrls: [],
  visualStyle: null,
  heroText: null,
  ctaTexts: [],
  screenshotPath: null,
  renderMode: null,
  hasLogo: false,
  hasImages: false,
});

export const emptyVoiceGuidelines = (): BrandVoiceGuidelines => ({
  do: [],
  dont: [],
});

export const emptyParsedProfile = (): BrandParsedProfile => ({
  orgId: null,
  websiteUrl: null,
  brandName: null,
  brandSummary: null,
  slogan: null,
  valueProposition: [],
  toneOfVoice: [],
  audienceSignals: [],
  contentPillars: [],
  visualIdentity: emptyVisualIdentity(),
  keyMessages: [],
  businessInfo: null,
  email: null,
});

export const emptyEnrichedProfile = (): BrandEnrichedProfile => ({
  brandPersonality: [],
  brandArchetype: null,
  positioningStatement: null,
  voiceGuidelines: emptyVoiceGuidelines(),
  messagingPriorities: [],
  visualDirectionNotes: null,
  linkedInVoice: null,
  adCopyStyle: null,
  orgId: null,
  websiteUrl: null,
});
