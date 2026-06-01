import { useMemo } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { FileText } from "lucide-react";
import { useChannelContext } from "../hooks/useChannelContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { StatusChip } from "../../../shared/ui/StatusChip";

export function ChannelContentPage() {
  const { channelId } = useChannelContext();
  const { data: allPosts = [], isLoading } = useContentPosts();

  const posts = useMemo(
    () =>
      allPosts
        .filter((post) => post.channelId === channelId)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [allPosts, channelId]
  );

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="subtitle1" fontWeight={600}>
          Channel content
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
          ALL POSTS IN THIS CHANNEL, ACROSS CAMPAIGNS
        </Typography>
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading posts...
        </Typography>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
          <FileText size={22} style={{ opacity: 0.55 }} />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            No content yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create a campaign and draft posts inside it to see them here.
          </Typography>
        </Paper>
      ) : (
        <Paper>
          <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
            {posts.map((post) => (
              <Stack
                key={post.id}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{ p: 1.75 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {post.title || "Untitled post"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {post.contentType} · Updated{" "}
                    {new Date(post.updatedAt).toLocaleString()}
                  </Typography>
                </Box>
                <StatusChip status={post.status} />
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
