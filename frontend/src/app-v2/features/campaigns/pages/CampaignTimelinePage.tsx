import { useMemo } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { CalendarRange } from "lucide-react";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { StatusChip } from "../../../shared/ui/StatusChip";

function formatDate(value: string | null | undefined): { day: string; time: string } | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    day: date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" }),
    time: date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function CampaignTimelinePage() {
  const { campaignId } = useCampaignContext();
  const { data: allPosts = [] } = useContentPosts();

  const timeline = useMemo(() => {
    const items = allPosts
      .filter((post) => (post as { campaignId?: number | null }).campaignId === campaignId)
      .filter((post) => post.scheduledAt || post.publishedAt)
      .map((post) => ({
        post,
        when: post.publishedAt ?? post.scheduledAt ?? post.updatedAt,
        kind: post.publishedAt ? "published" : "scheduled",
      }))
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());
    return items;
  }, [allPosts, campaignId]);

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Publishing timeline
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          PAST AND UPCOMING PUBLICATIONS — EDITORIAL VIEW ONLY (retries/failures live in publishing logs)
        </Typography>
      </Box>

      {timeline.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
          <CalendarRange size={22} style={{ opacity: 0.55 }} />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            Nothing scheduled or published yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Once posts in this campaign are scheduled or published, they'll appear here in chronological order.
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2.5 }}>
          <Stack spacing={2.5}>
            {timeline.map(({ post, when, kind }) => {
              const formatted = formatDate(when);
              return (
                <Stack
                  key={post.id}
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  sx={{
                    pb: 2,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    "&:last-of-type": { borderBottom: 0, pb: 0 },
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 96,
                      p: 1,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" fontWeight={600} sx={{ display: "block" }}>
                      {formatted?.day ?? "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatted?.time ?? ""}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {post.title || "Untitled post"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {kind === "published" ? "Published" : "Scheduled"} · {post.contentType}
                    </Typography>
                  </Box>
                  <StatusChip status={post.status} />
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
