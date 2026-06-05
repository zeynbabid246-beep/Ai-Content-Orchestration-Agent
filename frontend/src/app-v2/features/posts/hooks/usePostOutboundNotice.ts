import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export interface PostOutboundNotice {
  severity: "success" | "warning";
  text: string;
}

const MESSAGES: Record<string, PostOutboundNotice> = {
  published: {
    severity: "success",
    text: "Post published to all selected platforms.",
  },
  scheduled: {
    severity: "success",
    text: "Post scheduled on all selected platforms.",
  },
};

export function usePostOutboundNotice(): {
  notice: PostOutboundNotice | null;
  dismissNotice: () => void;
  /** Set once when landing from the post editor after publish/schedule. */
  outcome: "published" | "scheduled" | null;
} {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notice, setNotice] = useState<PostOutboundNotice | null>(null);
  const [outcome, setOutcome] = useState<"published" | "scheduled" | null>(null);

  useEffect(() => {
    const param = searchParams.get("outcome");
    if (param !== "published" && param !== "scheduled") return;

    setOutcome(param);
    const message = MESSAGES[param];
    if (message) {
      setNotice(message);
    }

    const next = new URLSearchParams(searchParams);
    next.delete("outcome");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return { notice, dismissNotice: () => setNotice(null), outcome };
}
