export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  voice: string;
  colors: {
    primary: string;
    secondary: string;
  };
  website: string;
  createdAt: string;
  ownerId: string;
}
