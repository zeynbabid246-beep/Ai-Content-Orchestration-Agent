import { Box, Button, Stack, Typography } from "@mui/material";
import { ImagePlus } from "lucide-react";

interface PostMasterImageUploadProps {
  previewUrl: string | null;
  requiresForInstagram?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
}

export function PostMasterImageUpload({
  previewUrl,
  requiresForInstagram = false,
  disabled = false,
  uploading = false,
  onFileSelect,
  onRemove,
}: PostMasterImageUploadProps) {
  const hasImage = Boolean(previewUrl);

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Typography variant="subtitle2" fontWeight={600}>
          Shared image
        </Typography>
        {requiresForInstagram ? (
          <Typography variant="caption" color="warning.main">
            Required for Instagram
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Optional — used in previews and Instagram posts
          </Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<ImagePlus size={14} />}
          disabled={disabled || uploading}
        >
          {hasImage ? "Change image" : "Add image"}
          <input
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={disabled || uploading}
            onChange={(event) => {
              onFileSelect(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
        </Button>
        {hasImage ? (
          <Button
            size="small"
            color="error"
            onClick={onRemove}
            disabled={disabled || uploading}
          >
            Remove
          </Button>
        ) : null}
      </Stack>

      {uploading ? (
        <Typography variant="caption" color="text.secondary">
          Uploading image…
        </Typography>
      ) : null}

      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt="Post media preview"
          sx={{
            width: "100%",
            maxHeight: 220,
            objectFit: "cover",
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
      ) : null}
    </Stack>
  );
}
