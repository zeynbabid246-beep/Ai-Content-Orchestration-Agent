export interface Channel {
  id: number;
  teamId: string;
  name: string;
  description: string | null;
  branding?: ChannelBranding | null;
  config?: ChannelConfig | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelBranding {
  logoUrl?: string | null;
  theme?: string | null;
  slogan?: string | null;
  tone?: string | null;
  targetAudience?: string | null;
  keywords?: string[];
  contentPillars?: string[];
  mission?: string | null;
  brandSummary?: string | null;
  goal?: string | null;
}

export interface ChannelConfig {
  settingsJson?: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  branding?: ChannelBranding;
  config?: ChannelConfig;
}

export interface UpdateChannelRequest {
  name: string;
  description?: string;
  branding?: ChannelBranding;
  config?: ChannelConfig;
}