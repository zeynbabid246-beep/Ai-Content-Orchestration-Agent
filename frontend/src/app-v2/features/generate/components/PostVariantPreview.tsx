import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Heart, MessageCircle, Repeat2, Send, Share2, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";
import type { QuickVariantDefinition } from "../generate.types";

interface PostVariantPreviewProps {
  definition: QuickVariantDefinition;
  title: string;
  body: string;
  slides: string[];
  imageUrl: string | null;
  brandName?: string | null;
}

function PreviewFrame({
  accent,
  header,
  children,
}: {
  accent: string;
  header: string;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderColor: alpha(accent, 0.35),
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ px: 1.5, py: 1, bgcolor: alpha(accent, 0.08), borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: accent }}>
          {header}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Paper>
  );
}

export function PostVariantPreview({
  definition,
  title,
  body,
  slides,
  imageUrl,
  brandName,
}: PostVariantPreviewProps) {
  const theme = useTheme();
  const author = brandName?.trim() || "Your brand";

  if (definition.key === "linkedin-post") {
    return (
      <PreviewFrame accent="#0A66C2" header="LinkedIn preview">
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: alpha("#0A66C2", 0.15) }} />
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {author}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Just now · 🌐
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {body || "Your LinkedIn post will appear here."}
          </Typography>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Post media"
              sx={{ width: "100%", borderRadius: 1, maxHeight: 220, objectFit: "cover" }}
            />
          ) : null}
          <Stack direction="row" spacing={2} color="text.secondary">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ThumbsUp size={14} />
              <Typography variant="caption">Like</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <MessageCircle size={14} />
              <Typography variant="caption">Comment</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Repeat2 size={14} />
              <Typography variant="caption">Repost</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Send size={14} />
              <Typography variant="caption">Send</Typography>
            </Stack>
          </Stack>
        </Stack>
      </PreviewFrame>
    );
  }

  if (definition.key === "facebook-post") {
    return (
      <PreviewFrame accent="#1877F2" header="Facebook preview">
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: alpha("#1877F2", 0.15) }} />
            <Box>
              <Typography variant="body2" fontWeight={700}>
                {author}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Just now · 🌍
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {body || "Your Facebook post will appear here."}
          </Typography>
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Post media"
              sx={{ width: "100%", borderRadius: 1, maxHeight: 220, objectFit: "cover" }}
            />
          ) : null}
          <Stack direction="row" spacing={2} color="text.secondary">
            <Typography variant="caption">Like</Typography>
            <Typography variant="caption">Comment</Typography>
            <Typography variant="caption">Share</Typography>
          </Stack>
        </Stack>
      </PreviewFrame>
    );
  }

  if (definition.key === "instagram-carousel") {
    const visibleSlides = slides.filter(Boolean);
    return (
      <PreviewFrame accent="#E1306C" header="Instagram carousel preview">
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: alpha("#E1306C", 0.15) }} />
            <Typography variant="body2" fontWeight={700}>
              {author}
            </Typography>
          </Stack>
          <Box
            sx={{
              borderRadius: 1.5,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              bgcolor: alpha(theme.palette.text.primary, 0.03),
            }}
          >
            {imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt="Carousel cover"
                sx={{ width: "100%", maxHeight: 220, objectFit: "cover" }}
              />
            ) : (
              <Box sx={{ p: 2, minHeight: 160, display: "grid", placeItems: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  {visibleSlides[0] || "Slide 1 content"}
                </Typography>
              </Box>
            )}
            <Stack direction="row" spacing={0.75} sx={{ p: 1, overflowX: "auto" }}>
              {(visibleSlides.length ? visibleSlides : ["Slide 1", "Slide 2"]).map((slide, index) => (
                <Chip key={`${slide}-${index}`} size="small" label={`${index + 1}. ${slide.slice(0, 28)}`} />
              ))}
            </Stack>
          </Box>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            <strong>{author}</strong> {body || "Carousel caption goes here."}
          </Typography>
        </Stack>
      </PreviewFrame>
    );
  }

  return (
    <PreviewFrame accent="#E1306C" header="Instagram post preview">
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: alpha("#E1306C", 0.15) }} />
          <Typography variant="body2" fontWeight={700}>
            {author}
          </Typography>
        </Stack>
        <Box
          sx={{
            borderRadius: 1.5,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: alpha(theme.palette.text.primary, 0.03),
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Instagram media"
              sx={{ width: "100%", maxHeight: 260, objectFit: "cover" }}
            />
          ) : (
            <Box sx={{ p: 3, minHeight: 180, display: "grid", placeItems: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Add an image for a richer preview
              </Typography>
            </Box>
          )}
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Heart size={16} />
          <MessageCircle size={16} />
          <Send size={16} />
          <Share2 size={16} style={{ marginLeft: "auto" }} />
        </Stack>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          <strong>{author}</strong> {body || "Your Instagram caption will appear here."}
        </Typography>
        {title ? (
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>
        ) : null}
      </Stack>
    </PreviewFrame>
  );
}
