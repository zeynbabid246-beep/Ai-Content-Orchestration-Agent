export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  AccessToken: string;
  RefreshToken: string;
  UserId: string;
  Username: string;
}
