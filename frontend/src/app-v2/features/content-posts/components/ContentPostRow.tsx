import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronRight, Eye, PlayCircle, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusChip } from "../../../shared/ui/StatusChip";
import { postEditorPath } from "../../../shared/lib/routes";
import type { ContentPost } from "../content-posts.types";
import { ContentStatus } from "../content-posts.types";
import { getEffectiveContentStatus } from "../content-posts.display";
import { PLATFORM_COLORS, PLATFORM_LABELS } from "../../posts/utils/variantPreview";

export interface ContentPostRowProps {
  post: ContentPost;
  channelName?: string;
  campaignName?: string;
  showChannel?: boolean;
  showCampaign?: boolean;
  onDelete?: (post: ContentPost) => void;
  onPublish?: (post: ContentPost) => void;
}

function formatWhen(date: string | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ParsedVariantContent {
  text: string;
  imageUrl: string | null;
  slides: string[];
}

function parseVariantFull(contentJson: string | null | undefined): ParsedVariantContent {
  if (!contentJson) return { text: "", imageUrl: null, slides: [] };
  try {
    const parsed = JSON.parse(contentJson) as Record<string, unknown>;

    // Normalized format: { text, imageUrl, slides? }
    if (typeof parsed.text === "string") {
      const slides = Array.isArray(parsed.slides)
        ? (parsed.slides as unknown[]).map((s) => (typeof s === "string" ? s : JSON.stringify(s))).filter(Boolean)
        : [];
      return {
        text: parsed.text,
        imageUrl: typeof parsed.imageUrl === "string" ? parsed.imageUrl : null,
        slides,
      };
    }

    // AI pipeline format: { preview, generated: { text, ... } }
    if (parsed.generated && typeof (parsed.generated as Record<string, unknown>).text === "string") {
      const gen = parsed.generated as Record<string, unknown>;
      const slides = Array.isArray(gen.slides)
        ? (gen.slides as unknown[]).map((s) => (typeof s === "string" ? s : JSON.stringify(s))).filter(Boolean)
        : [];
      return {
        text: gen.text as string,
        imageUrl: typeof gen.imageUrl === "string" ? gen.imageUrl : null,
        slides,
      };
    }

    // Bare preview
    if (typeof parsed.preview === "string") {
      return { text: parsed.preview, imageUrl: null, slides: [] };
    }
  } catch {
    return { text: contentJson, imageUrl: null, slides: [] };
  }
  return { text: "", imageUrl: null, slides: [] };
}

function PostViewDialog({ post, open, onClose }: { post: ContentPost; open: boolean; onClose: () => void }) {
  const variants = post.postVariants ?? [];
  const effectiveStatus = getEffectiveContentStatus(post);
  const sharedImage = post.imageUrl ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 0, pr: 6 }}>
        <Typography variant="h6" sx={{ wordBreak: "break-word" }}>
          {post.title?.trim() || "Untitled post"}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" mt={0.75} flexWrap="wrap">
          <StatusChip status={effectiveStatus} />
          <Chip size="small" label={post.contentType} variant="outlined" sx={{ fontSize: 11 }} />
          {formatWhen(post.createdAt) ? (
            <Typography variant="caption" color="text.secondary">
              Created {formatWhen(post.createdAt)!}
            </Typography>
          ) : null}
          {formatWhen(post.publishedAt) ? (
            <Typography variant="caption" color="text.secondary">
              · Published {formatWhen(post.publishedAt)!}
            </Typography>
          ) : null}
        </Stack>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Shared image */}
        {sharedImage && (
          <Box mb={3}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8, display: "block", mb: 1 }}>
              SHARED IMAGE
            </Typography>
            <Box
              component="img"
              src={sharedImage}
              alt="Post image"
              sx={{
                width: "100%",
                maxHeight: 320,
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Box>
        )}

        {/* Prompt */}
        {post.prompt?.trim() && (
          <Box mb={3}>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.8, display: "block", mb: 0.5 }}>
              BRIEF / PROMPT
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              "{post.prompt.trim()}"
            </Typography>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Variants */}
        {variants.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No platform variants saved on this post.
          </Typography>
        ) : (
          <Stack spacing={3}>
            {variants.map((v) => {
              const { text, imageUrl: variantImage, slides } = parseVariantFull(v.contentJson);
              const color = PLATFORM_COLORS[v.platform] ?? "#64748b";
              const displayImage = variantImage ?? sharedImage;

              return (
                <Box key={v.platform}>
                  {/* Platform header */}
                  <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: alpha(color, 0.15),
                        border: `1.5px solid ${color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color }}>
                        {(PLATFORM_LABELS[v.platform] ?? v.platform).slice(0, 2).toUpperCase()}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {PLATFORM_LABELS[v.platform] ?? v.platform}
                    </Typography>
                    {slides.length > 0 && (
                      <Chip size="small" label={`Carousel · ${slides.length} slides`} sx={{ fontSize: 11 }} />
                    )}
                  </Stack>

                  {/* Variant image (if different from shared) */}
                  {displayImage && displayImage !== sharedImage && (
                    <Box mb={1.5}>
                      <Box
                        component="img"
                        src={displayImage}
                        alt="Variant image"
                        sx={{
                          width: "100%",
                          maxHeight: 240,
                          objectFit: "cover",
                          borderRadius: 1.5,
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </Box>
                  )}

                  {/* Main text */}
                  {text ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: alpha(color, 0.04),
                        borderColor: alpha(color, 0.2),
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      <Typography variant="body2" lineHeight={1.75}>
                        {text}
                      </Typography>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      (empty content)
                    </Typography>
                  )}

                  {/* Carousel slides */}
                  {slides.length > 0 && (
                    <Stack spacing={1} mt={1.5}>
                      {slides.map((slide, i) => (
                        <Paper
                          key={i}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            bgcolor: "action.hover",
                            borderLeft: `3px solid ${color}`,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                            Slide {i + 1}
                          </Typography>
                          <Typography variant="body2">{slide}</Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  <Divider sx={{ mt: 3 }} />
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ContentPostRow({
  post,
  channelName,
  campaignName,
  showChannel = false,
  showCampaign = true,
  onDelete,
  onPublish,
}: ContentPostRowProps) {
  const navigate = useNavigate();
  const channelId = post.channelId;
  const canOpen = channelId != null;
  const [viewOpen, setViewOpen] = useState(false);

  const effectiveStatus = getEffectiveContentStatus(post);
  const meta: string[] = [];
  if (showChannel && channelName) meta.push(channelName);
  if (showCampaign && campaignName) meta.push(campaignName);
  const updated = formatWhen(post.updatedAt);
  if (updated) meta.push(`Updated ${updated}`);
  const scheduled = formatWhen(post.scheduledAt);
  if (scheduled && effectiveStatus === ContentStatus.Scheduled) meta.push(`Scheduled ${scheduled}`);

  const platformVariants = (post.postVariants ?? []).filter(
    (variant) => PLATFORM_LABELS[variant.platform] != null
  );

  const isPublishable =
    effectiveStatus === ContentStatus.Draft ||
    effectiveStatus === ContentStatus.Ready;

  const isDeleted = effectiveStatus === ContentStatus.Deleted;

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-action]")) return;
    if (!canOpen || channelId == null) {
      setViewOpen(true);
      return;
    }
    navigate(postEditorPath(channelId, post.id, post.campaignId ?? null));
  };

  return (
    <>
      <Stack
        component={Paper}
        variant="outlined"
        direction="row"
        alignItems="center"
        spacing={2}
        onClick={handleRowClick}
        sx={{
          p: 1.75,
          cursor: "pointer",
          transition: "border-color 0.18s, background 0.18s",
          "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {post.title?.trim() || "Untitled post"}
          </Typography>
          {meta.length > 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {meta.join(" · ")}
            </Typography>
          ) : null}
          {platformVariants.length > 0 ? (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
              {platformVariants.map((variant) => {
                const color = PLATFORM_COLORS[variant.platform];
                return (
                  <Chip
                    key={variant.platform}
                    size="small"
                    label={PLATFORM_LABELS[variant.platform]}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      bgcolor: alpha(color, 0.12),
                      color,
                      borderColor: alpha(color, 0.35),
                    }}
                    variant="outlined"
                  />
                );
              })}
            </Stack>
          ) : null}
        </Box>

        <StatusChip status={effectiveStatus} />

        {/* Action buttons */}
        <Stack direction="row" spacing={0.25} data-action="true" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View full content">
            <IconButton size="small" onClick={() => setViewOpen(true)} data-action="true">
              <Eye size={15} />
            </IconButton>
          </Tooltip>

          {onPublish && isPublishable ? (
            <Tooltip title="Publish now">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onPublish(post)}
                data-action="true"
              >
                <PlayCircle size={15} />
              </IconButton>
            </Tooltip>
          ) : null}

          {onDelete && !isDeleted ? (
            <Tooltip title="Delete post">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(post)}
                data-action="true"
              >
                <Trash2 size={15} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>

        {canOpen ? <ChevronRight size={16} style={{ opacity: 0.45, flexShrink: 0 }} /> : null}
      </Stack>

      <PostViewDialog post={post} open={viewOpen} onClose={() => setViewOpen(false)} />
    </>
  );
}

export function ContentPostRowSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 1.75 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ flex: 1 }}>
          <Box sx={{ height: 14, width: "55%", bgcolor: "action.hover", borderRadius: 0.5, mb: 0.75 }} />
          <Box sx={{ height: 10, width: "35%", bgcolor: "action.hover", borderRadius: 0.5 }} />
        </Box>
        <Box sx={{ width: 64, height: 22, bgcolor: "action.hover", borderRadius: 1 }} />
      </Stack>
    </Paper>
  );
}
