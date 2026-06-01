import { useMemo } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FileText, Plus } from "lucide-react";
import { useChannelContext } from "../../channels/hooks/useChannelContext";
import { useCampaignContext } from "../hooks/useCampaignContext";
import { useContentPosts } from "../../content-posts/content-posts.queries";
import { campaignPaths } from "../../../shared/lib/routes";
import { StatusChip } from "../../../shared/ui/StatusChip";

function parsePreview(contentJson: string | null | undefined): string {
  if (!contentJson) return "";
  try {
    const parsed = JSON.parse(contentJson) as { text?: string };
    return parsed.text ?? "";
  } catch {
    return contentJson;
  }
}

export function CampaignPostsPage() {
  const navigate = useNavigate();
  const { channelId } = useChannelContext();
  const { campaignId } = useCampaignContext();
  const { data: allPosts = [], isLoading } = useContentPosts();

  const posts = useMemo(
    () =>
      allPosts
        .filter(
          (post) => (post as { campaignId?: number | null }).campaignId === campaignId
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [allPosts, campaignId]
  );

  if (!channelId || !campaignId) return null;

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Posts
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>
            EDITORIAL CONTENT INSIDE THIS CAMPAIGN
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={16} />}
          onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
        >
          New post
        </Button>
      </Stack>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading posts...
        </Typography>
      ) : posts.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center", borderStyle: "dashed" }}>
          <FileText size={22} style={{ opacity: 0.55 }} />
          <Typography variant="h6" sx={{ mt: 1.5 }}>
            No posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
            Draft your first editorial piece. You can adapt it per platform later.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => navigate(campaignPaths.newPost(channelId, campaignId))}
          >
            Create post
          </Button>
        </Paper>
      ) : (
        <Paper>
          <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
            {posts.map((post) => {
              const preview = parsePreview(post.contentJson);
              return (
                <Stack
                  key={post.id}
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{
                    p: 1.75,
                    cursor: "pointer",
                    transition: "background 0.18s",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                  onClick={() => navigate(campaignPaths.post(channelId, campaignId, post.id))}
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
                    {preview ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {preview}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography variant="caption" color="text.disabled" sx={{ whiteSpace: "nowrap" }}>
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </Typography>
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
