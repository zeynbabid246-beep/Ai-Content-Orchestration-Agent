import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Divider, LinearProgress,
  IconButton, Stack, InputAdornment, Collapse
} from "@mui/material";

import { useBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation } from "../brands/brands.queries";
import { useBrandForm } from "./hooks/useBrandForm";
import { BrandSidebar } from "./components/BrandSidebar";
import { Section } from "../../shared/ui/Section";
import { GoldButton } from "../../shared/ui/GoldButton";
import { UploadIcon, GlobeIcon, SparkleIcon, InfoIcon, TrashIcon, CheckIcon } from "../../shared/ui/icons";
import { ROUTES } from "../../shared/lib/routes";

const FONTS = ["Inter", "Cormorant Garamond", "Playfair Display", "Syne"];
const VOICES = ["Professional", "Playful", "Luxurious", "Bold"];

// --- Internal Helper Component for Color Slots ---
function ColorPickerBox({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1,
        border: "1px solid rgba(212,175,122,0.3)",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        backgroundColor: value,
        transition: "transform 0.2s",
        "&:hover": { transform: "scale(1.1)", borderColor: "primary.main" }
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: "absolute",
          top: -5, left: -5,
          width: "150%", height: "150%",
          opacity: 0, cursor: "pointer"
        }}
      />
    </Box>
  );
}

export function BrandStudioPage() {
  const navigate = useNavigate();
  const { data: brands, isLoading: isBrandsLoading } = useBrandsQuery();
  const createMutation = useCreateBrandMutation();
  const updateMutation = useUpdateBrandMutation();
  const form = useBrandForm();

  // FIX: Define ref locally to avoid "Ref access during render" error
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (brands && brands.length > 0 && !form.selectedBrandId) {
      form.selectBrand(brands[0]);
    }
  }, [brands]);

  const handleSave = () => {
    if (!form.isValid) return;
    const payload = form.getPayload();
    if (form.selectedBrandId) {
      updateMutation.mutate({ id: form.selectedBrandId, input: payload }, { onSuccess: () => form.showSaved() });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (newBrand) => {
          form.setSelectedBrandId(newBrand.id);
          form.showSaved();
        },
      });
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100%", gap: 3, p: 3 }}>
      <BrandSidebar
        brands={brands}
        isLoading={isBrandsLoading}
        selectedBrandId={form.selectedBrandId}
        onSelectBrand={form.selectBrand}
        onCreateNew={form.resetForm}
      />

      <Box sx={{ flex: 1, maxWidth: 860 }}>
        {/* Logo Section */}
        <Section title="Logo" badge="2MB MAX">
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                flex: 1, height: 130, border: "1px dashed rgba(212,175,122,0.25)",
                borderRadius: 2, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", cursor: "pointer",
                "&:hover": { borderColor: "primary.main", background: "rgba(212,175,122,0.04)" }
              }}
            >
              <UploadIcon />
              <Typography sx={{ fontSize: 13 }}>Upload logo</Typography>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={form.handleLogoUpload} />
            </Box>
            
            {/* Logo Preview */}
            <Box sx={{ width: 120, height: 120, border: "1px solid rgba(212,175,122,0.15)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {form.logoPreview ? (
                <>
                  <img src={form.logoPreview} alt="Preview" style={{ maxWidth: "90%", maxHeight: "90%" }} />
                  <IconButton size="small" onClick={() => form.setLogoPreview(null)} sx={{ position: "absolute", top: 4, right: 4, color: "error.main" }}>
                    <TrashIcon />
                  </IconButton>
                </>
              ) : <Typography sx={{ fontSize: 10, opacity: 0.3 }}>Preview</Typography>}
            </Box>
          </Box>
        </Section>

        {/* Identity Section (With 3-Color Palettes) */}
        <Section title="Identity">
          <Stack spacing={3}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField label="Brand name" size="small" value={form.brandName} onChange={(e) => form.setBrandName(e.target.value)} />
              <TextField label="Slogan" size="small" value={form.slogan} onChange={(e) => form.setSlogan(e.target.value)} />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {/* Primary Palette */}
              <Box>
                <Typography sx={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", mb: 1.5, opacity: 0.7 }}>
                  Primary Palette
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {form.primaryColors.map((color, i) => (
                    <ColorPickerBox key={`p-${i}`} value={color} onChange={(val) => form.updatePrimaryColor(i, val)} />
                  ))}
                </Stack>
              </Box>

              {/* Secondary Palette */}
              <Box>
                <Typography sx={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", mb: 1.5, opacity: 0.7 }}>
                  Secondary Palette
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {form.secondaryColors.map((color, i) => (
                    <ColorPickerBox key={`s-${i}`} value={color} onChange={(val) => form.updateSecondaryColor(i, val)} />
                  ))}
                </Stack>
              </Box>
            </Box>

            <TextField label="Description" multiline rows={3} value={form.description} onChange={(e) => form.setDescription(e.target.value)} />
          </Stack>
        </Section>

        {/* Save Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
          <GoldButton onClick={handleSave} disabled={!form.isValid}>
            {form.selectedBrandId ? "Save Changes" : "Create Brand"}
          </GoldButton>
        </Box>
      </Box>
    </Box>
  );
}