import {
  Box,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { platformToContentType } from "../../ai/ai.api";
import {
  buildPostContentJson,
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
      {posts.map((post, index) => {
        const body = parsePostText(post.contentJson);
        const preview = formatGeneratedContentPreview(post.contentJson);
        const scheduledLocal = post.scheduledAt
          ? new Date(post.scheduledAt).toISOString().slice(0, 16)
          : "";

        return (
          <Paper key={index} variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Title"
                value={post.title}
                onChange={(e) => updatePost(index, { title: e.target.value })}
                fullWidth
              />
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
              {preview && preview !== body ? (
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {preview.slice(0, 500)}
                  {preview.length > 500 ? "…" : ""}
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
