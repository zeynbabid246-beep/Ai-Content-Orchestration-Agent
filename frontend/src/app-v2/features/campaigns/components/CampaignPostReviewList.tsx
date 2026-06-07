import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { platformToContentType } from "../../ai/ai.api";
import {
  buildPostContentJson,
  extractCreativeAssets,
  formatGeneratedContentPreview,
  parsePostText,
} from "../lib/formatGeneratedContent";

export type ReviewPost = {
  title: string;
  contentJson: string;
  contentType: string;
  scheduledAt: string;
  platform: string;
};

interface CampaignPostReviewListProps {
  posts: ReviewPost[];
  onChange: (posts: ReviewPost[]) => void;
  platformOptions: string[];
}

export function CampaignPostReviewList({
  posts,
  onChange,
  platformOptions,
}: CampaignPostReviewListProps) {
  const updatePost = (index: number, patch: Partial<ReviewPost>) => {
    const next = posts.map((post, i) => (i === index ? { ...post, ...patch } : post));
    onChange(next);
  };

  if (posts.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No proposed posts yet. Run AI generation first.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" color="text.secondary">
        {posts.length} post{posts.length !== 1 ? "s" : ""} generated
      </Typography>
      {posts.map((post, index) => {
        const body = parsePostText(post.contentJson);
        const preview = formatGeneratedContentPreview(post.contentJson);
        const assets = extractCreativeAssets(post.contentJson, post.platform);
        const scheduledLocal = post.scheduledAt
          ? new Date(post.scheduledAt).toISOString().slice(0, 16)
          : "";

        return (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  #{index + 1}
                </Typography>
                <Chip label={post.contentType || "Post"} size="small" variant="outlined" />
                <Chip label={post.platform} size="small" variant="outlined" />
              </Stack>
              <TextField
                size="small"
                label="Title"
                value={post.title}
                onChange={(e) => updatePost(index, { title: e.target.value })}
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  size="small"
                  select
                  label="Platform"
                  value={post.platform}
                  onChange={(e) => {
                    const platform = e.target.value;
                    updatePost(index, {
                      platform,
                      contentType: platformToContentType(platform),
                    });
                  }}
                  sx={{ minWidth: 160 }}
                >
                  {platformOptions.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  size="small"
                  label="Schedule"
                  type="datetime-local"
                  value={scheduledLocal}
                  onChange={(e) => {
                    const iso = e.target.value
                      ? new Date(e.target.value).toISOString()
                      : post.scheduledAt;
                    updatePost(index, { scheduledAt: iso });
                  }}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              {/* Creative asset thumbnails */}
              {assets.posterUrl ? (
                <Box sx={{ maxWidth: 200 }}>
                  <Box
                    component="img"
                    src={assets.posterUrl}
                    alt="Generated poster"
                    sx={{
                      width: "100%",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </Box>
              ) : null}
              {assets.carouselAssets.length > 0 ? (
                <Stack direction="row" spacing={1} sx={{ overflowX: "auto" }}>
                  {assets.carouselAssets.map((url, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={url}
                      alt={`Carousel slide ${i + 1}`}
                      sx={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ))}
                </Stack>
              ) : null}
              {assets.creativeError ? (
                <Alert severity="warning" variant="outlined" sx={{ py: 0.5 }}>
                  {assets.creativeError}
                </Alert>
              ) : null}

              {preview && preview !== body ? (
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {preview.slice(0, 500)}
                  {preview.length > 500 ? "..." : ""}
                </Typography>
              ) : null}
              <TextField
                size="small"
                label="Edit preview text"
                multiline
                minRows={3}
                value={body}
                onChange={(e) =>
                  updatePost(index, {
                    contentJson: buildPostContentJson(e.target.value, post.contentJson),
                  })
                }
                fullWidth
              />
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}
