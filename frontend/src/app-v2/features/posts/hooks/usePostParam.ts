import { useParams } from "react-router-dom";

export function usePostParam(): number | null {
  const { postId } = useParams<{ postId?: string }>();
  if (!postId || postId === "new") return null;
  const id = Number(postId);
  return Number.isFinite(id) && id > 0 ? id : null;
}
