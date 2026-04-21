export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Backend uses ASP.NET Core default camelCase JSON serialization
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  username: string;
  email: string;
  teamId: string;
  teamRole: string;
  isTeamNameSetupRequired: boolean;
}