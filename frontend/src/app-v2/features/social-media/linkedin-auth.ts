/**
 * This file acts as the mock "LinkedIn Token File".
 * It stores the token configuration and exposes methods to authenticate.
 */

interface LinkedInTokenInfo {
  accessToken: string;
  expiresIn: number;
  scopes: string[];
}

let mockToken: LinkedInTokenInfo | null = null;

export async function connectLinkedIn(): Promise<LinkedInTokenInfo> {
  // Simulate API delay for OAuth flow
  return new Promise((resolve) => {
    setTimeout(() => {
      mockToken = {
        accessToken: "mock_linkedin_token_ey123...",
        expiresIn: 3600,
        scopes: ["w_member_social", "r_liteprofile"]
      };
      resolve(mockToken);
    }, 1000);
  });
}

export function getLinkedInToken(): LinkedInTokenInfo | null {
  return mockToken;
}
