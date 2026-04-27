import { authStorage } from "../../shared/lib/storage";

export type Profile = {
  userId: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  avatarUrl: string | null;
};

export type UpdateProfilePayload = {
  name: string;
  bio: string;
};


const PROFILE_EXTRA_KEY = "profile_extra";

type ProfileExtra = { bio: string; avatarUrl: string | null };

function getProfileExtra(): ProfileExtra {
  try {
    const raw = localStorage.getItem(PROFILE_EXTRA_KEY);
    return raw ? JSON.parse(raw) : { bio: "", avatarUrl: null };
  } catch {
    return { bio: "", avatarUrl: null };
  }
}

function setProfileExtra(patch: Partial<ProfileExtra>): void {
  const prev = getProfileExtra();
  localStorage.setItem(PROFILE_EXTRA_KEY, JSON.stringify({ ...prev, ...patch }));
}

export function getProfile(): Profile {
  const extra = getProfileExtra();

  return {
    userId:   authStorage.getUserId()  ?? "",
    name:     authStorage.getUsername() ?? "",
    email:    "",           // not stored in authStorage — leave blank until backend exposes it
    role:     authStorage.getTeamRole() ?? "",
    bio:      extra.bio,
    avatarUrl: extra.avatarUrl,
  };
}



export function updateProfile(data: UpdateProfilePayload): Profile {
  const userId = authStorage.getUserId() ?? "";
  authStorage.setUser(userId, data.name.trim());
  setProfileExtra({ bio: data.bio });
  return getProfile();
}


export function saveAvatarUrl(url: string): { url: string } {
  setProfileExtra({ avatarUrl: url });
  return { url };
}