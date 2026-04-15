import { useEffect } from "react";
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

export function BrandStudioPage() {
  const navigate = useNavigate();
  const { data: brands, isLoading: isBrandsLoading } = useBrandsQuery();
  const createMutation = useCreateBrandMutation();
  const updateMutation = useUpdateBrandMutation();
  const form = useBrandForm();

  // Auto-select first brand on load
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
      {/* Sidebar */}
      <BrandSidebar
        brands={brands}
        isLoading={isBrandsLoading}
        selectedBrandId={form.selectedBrandId}
        onSelectBrand={form.selectBrand}
        onCreateNew={form.resetForm}
      />

      {/* Editor */}
      <Box sx={{ flex: 1, maxWidth: 860 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 28, md: 32 },
                fontWeight: 300,
                color: "text.primary",
                lineHeight: 1.1,
                letterSpacing: "0.01em",
              }}
            >
              Brand Studio
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.24em", textTransform: "uppercase", color: "secondary.main", mt: 0.5, opacity: 0.7 }}>
              {form.selectedBrandId ? `Editing: ${form.brandName || "Untitled Brand"}` : "Create a New Brand"}
            </Typography>
          </Box>
          <Collapse in={form.saved}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 1,
                background: "rgba(212,175,122,0.1)",
                border: "1px solid rgba(212,175,122,0.3)",
              }}
            >
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
            <LinearProgress
              sx={{
                mt: 2,
                height: 1,
                background: "rgba(212,175,122,0.1)",
                "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #d4af7a, #c5a0cc)" },
                borderRadius: 99,
              }}
            />
          )}
          {form.scraped && !form.scraping && (
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.06em", opacity: 0.6 }}>
                Content extracted · Model: Gemini Flash ·
              </Typography>
              <Typography
                component="span"
                onClick={form.handleScrape}
                sx={{
                  fontSize: 10,
                  color: "primary.main",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  "&:hover": { opacity: 0.7 },
                }}
              >
                Re-scrape
              </Typography>
            </Box>
          )}
        </Section>

        {/* Logo */}
        <Section title="Logo" badge="2MB MAX">
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box
              onClick={() => form.fileRef.current?.click()}
              sx={{
                flex: 1,
                minWidth: 200,
                minHeight: 130,
                border: "1px dashed rgba(212,175,122,0.25)",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                cursor: "pointer",
                transition: "all 0.2s",
                background: "rgba(255,255,255,0.02)",
                "&:hover": { borderColor: "primary.main", background: "rgba(212,175,122,0.04)", transform: "scale(1.005)" },
              }}
            >
              <Box sx={{ color: "primary.main", opacity: 0.7 }}>
                <UploadIcon />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 400, color: "text.primary", letterSpacing: "0.04em" }}>Upload logo</Typography>
              <Typography sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.06em" }}>PNG, SVG or JPG · Max 2MB</Typography>
              <input ref={form.fileRef} type="file" accept="image/*" hidden onChange={form.handleLogoUpload} />
            </Box>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: 2,
                flexShrink: 0,
                border: "1px solid rgba(212,175,122,0.15)",
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {form.logoPreview ? (
                <>
                  <Box component="img" src={form.logoPreview} alt="logo preview" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }} />
                  <IconButton
                    size="small"
                    onClick={() => form.setLogoPreview(null)}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.5)",
                      color: "#f07a7a",
                      width: 22,
                      height: 22,
                      "&:hover": { background: "rgba(240,122,122,0.15)" },
                    }}
                  >
                    <TrashIcon />
                  </IconButton>
                </>
              ) : (
                <Typography sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.3 }}>
                  Preview
                </Typography>
              )}
            </Box>
          </Box>
        </Section>

        {/* Identity */}
        <Section title="Identity" subtitle="These brand values will be automatically injected into AI prompts when generating content">
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField label="Brand name" size="small" value={form.brandName} onChange={(e) => form.setBrandName(e.target.value)} />
              <TextField label="Slogan" size="small" value={form.slogan} onChange={(e) => form.setSlogan(e.target.value)} />
            </Box>
            <TextField label="Description" size="small" multiline rows={3} value={form.description} onChange={(e) => form.setDescription(e.target.value)} />
            <Divider sx={{ borderColor: "rgba(212,175,122,0.1)" }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {[
                { label: "Primary color", value: form.primaryColor, set: form.setPrimaryColor },
                { label: "Secondary color", value: form.secondaryColor, set: form.setSecondaryColor },
              ].map(({ label, value, set }) => (
                <Box key={label}>
                  <Typography sx={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "text.secondary", mb: 0.8, opacity: 0.7 }}>
                    {label}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(212,175,122,0.2)",
                      borderRadius: 1,
                      px: 1.5,
                      py: 0.8,
                      "&:hover": { borderColor: "rgba(212,175,122,0.45)" },
                      transition: "border-color 0.2s",
                    }}
                  >
                    <Box sx={{ position: "relative", width: 28, height: 28, borderRadius: 1, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                        style={{ position: "absolute", top: -4, left: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)", padding: 0, border: "none", cursor: "pointer", background: "none" }}
                      />
                    </Box>
                    <TextField
                      variant="standard"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      InputProps={{ disableUnderline: true }}
                      sx={{ flex: 1, "& input": { color: "text.primary", fontWeight: 300, fontSize: 13, letterSpacing: "0.05em", p: 0 } }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: 12, letterSpacing: "0.12em", color: "text.secondary", "&.Mui-focused": { color: "primary.main" } }}>Font family</InputLabel>
                <Select value={form.fontFamily} onChange={(e) => form.setFontFamily(e.target.value)} label="Font family">
                  {FONTS.map((f) => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: 12, letterSpacing: "0.12em", color: "text.secondary", "&.Mui-focused": { color: "primary.main" } }}>Brand voice</InputLabel>
                <Select value={form.brandVoice} onChange={(e) => form.setBrandVoice(e.target.value as string)} label="Brand voice">
                  {VOICES.map((v) => (
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: 1.5, background: "rgba(212,175,122,0.07)", border: "1px solid rgba(212,175,122,0.2)" }}>
              <Box sx={{ color: "primary.main", mt: 0.15, flexShrink: 0 }}>
                <InfoIcon />
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 300, color: "text.secondary", lineHeight: 1.65, letterSpacing: "0.02em" }}>
                These brand values — colors, logo, slogan, and voice — will be automatically injected into the AI prompt when generating content, so every output stays on-brand.
              </Typography>
            </Box>
          </Stack>
        </Section>

        {/* Contact & Web */}
        <Section title="Contact & Web" subtitle="Public-facing information attached to your published content">
          <Stack spacing={2}>
            <TextField label="Contact email" size="small" type="email" value={form.contactEmail} onChange={(e) => form.setContactEmail(e.target.value)} />
            <TextField
              label="Website"
              size="small"
              value={form.website}
              onChange={(e) => form.setWebsite(e.target.value)}
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
          </Stack>
        </Section>

        {/* Actions */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3, pb: 4 }}>
          {form.selectedBrandId && (
            <GoldButton variant="ghost" size="small" onClick={() => navigate(ROUTES.dashboard)}>
              Discard changes
            </GoldButton>
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
