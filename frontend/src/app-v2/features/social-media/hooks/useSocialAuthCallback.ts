import { useEffect, useState } from "react";

export type SocialAuthCallbackStatus = {
  severity: "success" | "error";
  message: string;
} | null;

export function useSocialAuthCallback(onSuccess?: () => void, successMessage?: (platform: string | null) => string) {
  const [status, setStatus] = useState<SocialAuthCallbackStatus>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("socialAuthStatus");
    if (!oauthStatus) return;

    const platform = params.get("platform");
    const error = params.get("socialAuthError");

    if (oauthStatus === "success") {
      setStatus({
        severity: "success",
        message: successMessage?.(platform) ?? `${platform ?? "Account"} connected successfully.`,
      });
      onSuccess?.();
    } else {
      setStatus({ severity: "error", message: error ?? "Connection failed." });
    }

    params.delete("socialAuthStatus");
    params.delete("platform");
    params.delete("socialAuthError");
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, "", url);
  }, [onSuccess, successMessage]);

  return { status, setStatus };
}
