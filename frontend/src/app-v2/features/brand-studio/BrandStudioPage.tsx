import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  LinearProgress,
  IconButton,
  Stack,
  InputAdornment,
  Collapse,
} from "@mui/material";

import { useBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation } from "../brands/brands.queries";
import { useBrandForm } from "./hooks/useBrandForm";
import { BrandSidebar } from "./components/BrandSidebar";
import { Section } from "../../shared/ui/Section";
import { GoldButton } from "../../shared/ui/GoldButton";
import { UploadIcon, GlobeIcon, SparkleIcon, InfoIcon, TrashIcon, CheckIcon } from "../../shared/ui/icons";
import { ROUTES } from "../../shared/lib/routes";

const FONTS = ["Cormorant Garamond", "Inter", "DM Sans", "Playfair Display", "Syne", "Neue Haas Grotesk", "Libre Baskerville"];
const VOICES = ["Professional", "Playful", "Luxurious", "Bold", "Minimalist", "Conversational", "Technical"];

// --- Helper Component for the Color Boxes ---
function ColorPickerBox({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: 42,
        height: 42,
        borderRadius: 1.5,
        overflow: "hidden",
        border: "2px solid rgba(212,175,122,0.2)",
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
          top: -10,
          left: -10,
          width: "150%",
          height: "150%",
          cursor: "pointer",
          opacity: 0
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

  // FIX: Define the Ref here in the component to avoid the "Cannot access ref during render" error
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
      updateMutation.mutate(
        { id: form.selectedBrandId, input: payload },
        { onSuccess: () => form.showSaved() },
      );
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
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100%", gap: 3, p: 3 }}>
      <BrandSidebar
        brands={brands}
        isLoading={isBrandsLoading}
        selectedBrandId={form.selectedBrandId}
        onSelectBrand={form.selectBrand}
        onCreateNew={form.resetForm}
      />

      <Box sx={{ flex: 1, maxWidth: 860 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 28, md: 32 }, fontWeight: 300, color: "text.primary", lineHeight: 1.1, letterSpacing: "0.01em" }}>
              Brand Studio
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.24em", textTransform: "uppercase", color: "secondary.main", mt: 0.5, opacity: 0.7 }}>
              {form.selectedBrandId ? `Editing: ${form.brandName || "Untitled Brand"}` : "Create a New Brand"}
            </Typography>
          </Box>
          <Collapse in={form.saved}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1, borderRadius: 1, background: "rgba(212,175,122,0.1)", border: "1px solid rgba(212,175,122,0.3)" }}>
              <CheckIcon />
              <Typography sx={{ fontSize: 11, color: "primary.main", letterSpacing: "0.1em" }}>Changes saved</Typography>
            </Box>
          </Collapse>
        </Box>

        {/* Auto-fill */}
        <Section title="Auto-fill from website" subtitle="Let AI scrape your website and populate your brand settings automatically">
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="https://yourcompany.com"
              value={form.websiteUrl}
              onChange={(e) => form.setWebsiteUrl(e.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ color: "text.secondary", mt: 0.3, opacity: 0.5 }}>
                      <GlobeIcon />
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            <GoldButton onClick={form.handleScrape} loading={form.scraping} startIcon={<SparkleIcon />}>
              Scrape with AI
            </GoldButton>
          </Box>
          {form.scraping && (
            <LinearProgress sx={{ mt: 2, height: 1, background: "rgba(212,175,122,0.1)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #d4af7a, #c5a0cc)" }, borderRadius: 99 }} />
          )}
        </Section>

        {/* Logo Section */}
        <Section title="Logo" badge="2MB MAX">
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                flex: 1, minWidth: 200, minHeight: 130, border: "1px dashed rgba(212,175,122,0.25)",
                borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 1, cursor: "pointer", transition: "all 0.2s", background: "rgba(255,255,255,0.02)",
                "&:hover": { borderColor: "primary.main", background: "rgba(212,175,122,0.04)" }
              }}
            >
              <UploadIcon />
              <Typography sx={{ fontSize: 13 }}>Upload logo</Typography>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={form.handleLogoUpload} />
            </Box>
            
            <Box sx={{ width: 120, height: 120, borderRadius: 2, border: "1px solid rgba(212,175,122,0.15)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {form.logoPreview ? (
                <>
                  <Box component="img" src={form.logoPreview} sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }} />
                  <IconButton size="small" onClick={() => form.setLogoPreview(null)} sx={{ position: "absolute", top: 4, right: 4, color: "#f07a7a" }}>
                    <TrashIcon />
                  </IconButton>
                </>
              ) : <Typography sx={{ fontSize: 10, opacity: 0.3 }}>Preview</Typography>}
            </Box>
          </Box>
        </Section>

        {/* Identity Section with Multi-Color */}
        <Section title="Identity" subtitle="These brand values will be automatically injected into AI prompts">
          <Stack spacing={3}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField label="Brand name" size="small" value={form.brandName} onChange={(e) => form.setBrandName(e.target.value)} />
              <TextField label="Slogan" size="small" value={form.slogan} onChange={(e) => form.setSlogan(e.target.value)} />
            </Box>
            
            <TextField label="Description" size="small" multiline rows={3} value={form.description} onChange={(e) => form.setDescription(e.target.value)} />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 4 }}>
              {/* Primary Palette */}
              <Box>
                <Typography sx={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.secondary", mb: 1.5, opacity: 0.7 }}>
                  Primary Palette (3)
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {form.primaryColors.map((color, index) => (
                    <ColorPickerBox key={`p-${index}`} value={color} onChange={(val) => form.updatePrimaryColor(index, val)} />
                  ))}
                </Stack>
              </Box>

              {/* Secondary Palette */}
              <Box>
                <Typography sx={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.secondary", mb: 1.5, opacity: 0.7 }}>
                  Secondary Palette (3)
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  {form.secondaryColors.map((color, index) => (
                    <ColorPickerBox key={`s-${index}`} value={color} onChange={(val) => form.updateSecondaryColor(index, val)} />
                  ))}
                </Stack>
              </Box>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: 12 }}>Font family</InputLabel>
                <Select value={form.fontFamily} onChange={(e) => form.setFontFamily(e.target.value)} label="Font family">
                  {FONTS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: 12 }}>Brand voice</InputLabel>
                <Select value={form.brandVoice} onChange={(e) => form.setBrandVoice(e.target.value)} label="Brand voice">
                  {VOICES.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Section>

        {/* Contact Section */}
        <Section title="Contact & Web" subtitle="Public-facing information attached to your published content">
          <Stack spacing={2}>
            <TextField label="Contact email" size="small" type="email" value={form.contactEmail} onChange={(e) => form.setContactEmail(e.target.value)} />
            <TextField
              label="Website" size="small" value={form.website} onChange={(e) => form.setWebsite(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><GlobeIcon /></InputAdornment>) }}
            />
          </Stack>
        </Section>

        {/* Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3, pb: 4 }}>
          {form.selectedBrandId && (
            <GoldButton variant="ghost" size="small" onClick={() => navigate(ROUTES.dashboard)}>Discard changes</GoldButton>
          )}
          <GoldButton
            onClick={handleSave}
            size="small"
            loading={createMutation.isPending || updateMutation.isPending}
            disabled={!form.isValid}
          >
            {form.selectedBrandId ? "Save changes" : "Create brand"}
          </GoldButton>
        </Box>
      </Box>
    </Box>
  );
}