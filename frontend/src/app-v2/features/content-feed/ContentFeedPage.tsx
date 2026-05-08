import { Box, Paper, Typography, Stack, Button, CircularProgress, Card, CardContent, Chip } from "@mui/material";
import { useContentPosts } from "../content-posts/content-posts.queries";
import { ContentStatus, ContentType } from "../content-posts/content-posts.types";

const getStatusLabel = (status: ContentStatus) => {
  switch (status) {
    case ContentStatus.Draft: return "Draft";
    case ContentStatus.Review: return "Review";
    case ContentStatus.Approved: return "Approved";
    case ContentStatus.Scheduled: return "Scheduled";
    case ContentStatus.Published: return "Published";
    case ContentStatus.Archived: return "Archived";
    default: return "Unknown";
  }
};

const getStatusColor = (status: ContentStatus) => {
  switch (status) {
    case ContentStatus.Draft: return "default";
    case ContentStatus.Review: return "info";
    case ContentStatus.Approved: return "success";
    case ContentStatus.Scheduled: return "warning";
    case ContentStatus.Published: return "success";
    case ContentStatus.Archived: return "default";
    default: return "default";
  }
};

const getContentTypeLabel = (type: ContentType) => {
  switch (type) {
    case ContentType.BlogPost: return "Blog Post";
    case ContentType.TwitterThread: return "Twitter Thread";
    case ContentType.LinkedInPost: return "LinkedIn Post";
    case ContentType.InstagramPost: return "Instagram Post";
    case ContentType.FacebookPost: return "Facebook Post";
    default: return "Post";
  }
};

export function ContentFeedPage() {
  const { data: posts, isLoading, error } = useContentPosts();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Content Feed</Typography>
        <Typography variant="body2" color="text.secondary">Review all your scheduled and published content</Typography>
      </Box>

      {isLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 4, bgcolor: "error.light" }}>
          <Typography color="error.main">Failed to load content feed. Please try again later.</Typography>
        </Paper>
      ) : posts && posts.length > 0 ? (
        <Stack spacing={2}>
          {posts.map((post) => (
            <Card key={post.id} variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6">{post.title || "Untitled Post"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getContentTypeLabel(post.contentType)}
                    </Typography>
                  </Box>
                  <Chip label={getStatusLabel(post.status)} color={getStatusColor(post.status)} size="small" />
                </Stack>
                {post.contentJson && (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 2 }}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(post.contentJson);
                        return parsed.text || "No text available";
                      } catch {
                        return post.contentJson;
                      }
                    })()}
                  </Typography>
                )}
                {post.scheduledAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Scheduled for: {new Date(post.scheduledAt).toLocaleString()}
                  </Typography>
                )}
                {post.publishedAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Published on: {new Date(post.publishedAt).toLocaleString()}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center", mt: 4, bgcolor: "background.paper", borderStyle: "dashed" }}>
          <Typography variant="h6" color="text.secondary" sx={{mb: 1 }}>
            Your feed is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            There is no recent content published or drafted yet. Start creating right now to fill up your feed!
          </Typography>
          <Button variant="contained" color="primary">Start Creating</Button>
        </Paper>
      )}
    </Stack>
  );
}
