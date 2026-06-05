import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Copy } from "lucide-react";
import { SocialPlatform, type ContentPostVariant } from "../../content-posts/content-posts.types";
import { PostVariantPreview } from "../../generate/components/PostVariantPreview";
import {
  buildVariantContentJson,
  getPreviewDefinitionForPlatform,
  parseVariantContentJson,
  PLATFORM_LABELS,
} from "../utils/variantPreview";

interface PostVariantsWorkspaceProps {
  selectedPlatforms: SocialPlatform[];
  variants: ContentPostVariant[];
  onVariantsChange: (variants: ContentPostVariant[]) => void;
  masterTitle: string;
  masterBody: string;
  imageUrl: string | null;
  brandName?: string | null;
  disabled?: boolean;
}

function findVariantIndex(variants: ContentPostVariant[], platform: SocialPlatform): number {
  return variants.findIndex((v) => v.platform === platform);
}

export function PostVariantsWorkspace({
  selectedPlatforms,
  variants,
  onVariantsChange,
  masterTitle,
  masterBody,
  imageUrl,
  brandName,
  disabled = false,
}: PostVariantsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<SocialPlatform | false>(
    selectedPlatforms[0] ?? false
  );

  const activePlatform =
    (typeof activeTab === "string" ? activeTab : null) ??
    selectedPlatforms[0] ??
    null;

  const activeIndex = activePlatform != null ? findVariantIndex(variants, activePlatform) : -1;
  const activeVariant = activeIndex >= 0 ? variants[activeIndex] : null;
  const parsed = useMemo(
    () => parseVariantContentJson(activeVariant?.contentJson ?? ""),
    [activeVariant?.contentJson]
  );

  const updateActiveVariant = (text: string, variantTitle?: string) => {
    if (activePlatform == null || activeIndex < 0) return;
    const next = [...variants];
    next[activeIndex] = {
      ...next[activeIndex],
      title: variantTitle ?? next[activeIndex].title,
      contentJson: buildVariantContentJson(
        text,
        activePlatform,
        variantTitle ?? masterTitle,
        imageUrl
      ),
    };
    onVariantsChange(next);
  };

  const applyMasterToAll = () => {
    const next = selectedPlatforms.map((platform) => {
      const existing = variants.find((v) => v.platform === platform);
      return {
        platform,
        title: masterTitle.trim() || "Post",
        contentJson: buildVariantContentJson(masterBody, platform, masterTitle, imageUrl),
        ...(existing && "id" in existing ? {} : {}),
      } as ContentPostVariant;
    });
    onVariantsChange(next);
  };

  if (selectedPlatforms.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
          Platform variants
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Select at least one target platform above to create variants and previews.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          Platform variants & preview
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Copy size={14} />}
          onClick={applyMasterToAll}
          disabled={disabled || !masterBody.trim()}
        >
          Apply master to all
        </Button>
      </Stack>

      <Tabs
        value={activePlatform ?? false}
        onChange={(_, value: SocialPlatform) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, minHeight: 36 }}
      >
        {selectedPlatforms.map((platform) => (
          <Tab
            key={platform}
            value={platform}
            label={PLATFORM_LABELS[platform]}
            sx={{ minHeight: 36, py: 0.5, textTransform: "none" }}
          />
        ))}
      </Tabs>

      {activePlatform != null ? (
        <Stack spacing={2}>
          <TextField
            fullWidth
            multiline
            minRows={5}
            label={`${PLATFORM_LABELS[activePlatform]} copy`}
            value={parsed.text}
            onChange={(e) => updateActiveVariant(e.target.value)}
            disabled={disabled}
            placeholder="Adapt messaging for this platform..."
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Live preview
            </Typography>
            <PostVariantPreview
              definition={getPreviewDefinitionForPlatform(activePlatform)}
              title={parsed.title || masterTitle}
              body={parsed.text}
              slides={parsed.slides}
              imageUrl={imageUrl}
              brandName={brandName}
            />
          </Box>
        </Stack>
      ) : null}
    </Paper>
  );
}
