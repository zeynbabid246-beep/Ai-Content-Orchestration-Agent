/**
 * Deterministic helpers used to render entity avatars/cards (Channels, Campaigns, etc.).
 * Kept in a non-component file so React Fast Refresh stays component-only.
 */
const PALETTE = [
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#db2777",
  "#0A66C2",
  "#E1306C",
  "#1877F2",
  "#f59e0b",
  "#22c55e",
  "#6366f1",
  "#ef4444",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getEntityColor(seed: string | number): string {
  const key = typeof seed === "number" ? String(seed) : seed;
  return PALETTE[hashString(key) % PALETTE.length];
}

export function getEntityInitials(name: string): string {
  return (
    name
      .split(/[\s_-]+/)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  );
}
