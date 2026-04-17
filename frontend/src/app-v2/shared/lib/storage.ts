const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USERNAME_KEY = "username";
const USER_ID_KEY = "userId";

export const authStorage = {
  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  setUser(userId: string, username: string) {
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(USERNAME_KEY, username);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
  },
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getUsername() {
    return localStorage.getItem(USERNAME_KEY);
  },
};
