
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USERNAME_KEY = "username";
const USER_ID_KEY = "userId";
const TEAM_ID_KEY = "teamId";
const TEAM_ROLE_KEY = "teamRole";
const TEAM_NAME_SETUP_KEY = "isTeamNameSetupRequired";
const EMAIL_KEY = "email";

export const authStorage = {
  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  setUser(userId: string, username: string, email?: string) {
    localStorage.setItem(USER_ID_KEY, userId);
    localStorage.setItem(USERNAME_KEY, username);
    if (email !== undefined) {
      localStorage.setItem(EMAIL_KEY, email);
    }
  },

  setTeam(teamId: string, teamRole: string) {
    localStorage.setItem(TEAM_ID_KEY, teamId);
    localStorage.setItem(TEAM_ROLE_KEY, teamRole);
  },

  setTeamNameSetupRequired(required: boolean) {
    localStorage.setItem(TEAM_NAME_SETUP_KEY, required ? "1" : "0");
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(TEAM_ID_KEY);
    localStorage.removeItem(TEAM_ROLE_KEY);
    localStorage.removeItem(TEAM_NAME_SETUP_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },

  isTeamNameSetupRequired(): boolean {
    return localStorage.getItem(TEAM_NAME_SETUP_KEY) === "1";
  },

  getAccessToken() { 
    const val = localStorage.getItem(ACCESS_TOKEN_KEY); 
    return (val === "undefined" || !val) ? null : val;
  },
  getRefreshToken() { 
    const val = localStorage.getItem(REFRESH_TOKEN_KEY); 
    return (val === "undefined" || !val) ? null : val;
  },
  getUsername() { 
    const val = localStorage.getItem(USERNAME_KEY); 
    return (val === "undefined" || !val) ? null : val;
  },
  getUserId() { 
    const val = localStorage.getItem(USER_ID_KEY); 
    return (val === "undefined" || !val) ? null : val;
  },
  getTeamId() { 
    const val = localStorage.getItem(TEAM_ID_KEY); 
    return (val === "undefined" || !val) ? null : val;
  },
  getTeamRole() { 
    const val = localStorage.getItem(TEAM_ROLE_KEY); 
    return (val === "undefined" || !val) ? null : val;
  },
  getEmail() {
    const val = localStorage.getItem(EMAIL_KEY);
    return (val === "undefined" || !val) ? null : val;
  },
};