import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Stack,
  InputAdornment,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";

import { useBrandsQuery, useCreateBrandMutation, useUpdateBrandMutation } from "../brands/brands.queries";
import type { Brand } from "../../shared/types/domain";

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
  </svg>
);
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

function Section({ title, subtitle, children, badge }: { title: string; subtitle?: string; children: React.ReactNode; badge?: string }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3.5 },
        mb: 2.5,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: "8%",
          right: "8%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #d4af7a, transparent)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: subtitle ? 0.5 : 2.5 }}>
        <Typography sx={{fontSize: 18, fontWeight: 400, color: "text.primary", letterSpacing: "0.02em" }}>
          {title}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              background: "rgba(212,175,122,0.12)",
              color: "primary.main",
              border: "1px solid rgba(212,175,122,0.25)",
              height: 20,
              fontSize: 9,
              letterSpacing: "0.1em",
            }}
          />
        )}
      </Box>
      {subtitle && (
        <Typography sx={{ fontSize: 11, color: "text.secondary", letterSpacing: "0.08em", mb: 2.5, fontWeight: 300 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

function GoldButton({ children, onClick, disabled, loading, variant = "primary", size = "medium", startIcon, fullWidth }: any) {
  const base = {
    primary: {
      background: "linear-gradient(135deg, #d4af7a 0%, #b8893e 100%)",
      color: "#1a0f1e",
      boxShadow: "0 4px 18px rgba(212,175,122,0.25)",
      "&:hover": { opacity: 0.88, transform: "translateY(-1px)", boxShadow: "0 8px 28px rgba(212,175,122,0.35)" },
    },
    ghost: {
      background: "transparent",
      color: "primary.main",
      border: "1px solid rgba(212,175,122,0.35)",
      "&:hover": { background: "rgba(212,175,122,0.08)", borderColor: "primary.main" },
    },
  };
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={startIcon}
      sx={{
        ...(variant === "primary" ? base.primary : base.ghost),
        px: size === "small" ? 2 : 3,
        py: size === "small" ? 0.8 : 1.2,
        fontSize: size === "small" ? 10 : 11,
        fontWeight: 500,
        transition: "all 0.2s",
        "&:disabled": { opacity: 0.45 },
      }}
    >
      {loading ? "Processing…" : children}
    </Button>
  );
}

export function BrandStudioPage() {
  const navigate = useNavigate();
  const { data: brands, isLoading: isBrandsLoading } = useBrandsQuery();
  const createBrandMutation = useCreateBrandMutation();
  const updateBrandMutation = useUpdateBrandMutation();

  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Form states
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [brandName, setBrandName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [description, setDescription] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0F172A");
  const [secondaryColor, setSecondaryColor] = useState("#6366F1");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [brandVoice, setBrandVoice] = useState("Professional");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle default selection when brands load
  useEffect(() => {
    if (brands && brands.length > 0 && !selectedBrandId) {
      handleSelectBrand(brands[0]);
    }
  }, [brands]);

  const handleSelectBrand = (brand: Brand) => {
    setSelectedBrandId(brand.id);
    setBrandName(brand.name);
    setWebsite(brand.website);
    setWebsiteUrl(brand.website);
    setPrimaryColor(brand.colors?.primary || "#0F172A");
    setSecondaryColor(brand.colors?.secondary || "#6366F1");
    setBrandVoice(brand.voice || "Professional");
    setLogoPreview(brand.logoUrl || null);
    
    // reset other fields
    setSlogan("");
    setDescription("");
    setContactEmail("");
    setFontFamily("Inter");
    setScraped(false);
    setScraping(false);
  };

  const handleCreateNew = () => {
    setSelectedBrandId(null);
    setBrandName("");
    setWebsite("");
    setWebsiteUrl("");
    setPrimaryColor("#0F172A");
    setSecondaryColor("#6366F1");
    setBrandVoice("Professional");
    setLogoPreview(null);
    setSlogan("");
    setDescription("");
    setContactEmail("");
    setFontFamily("Inter");
    setScraped(false);
    setScraping(false);
  };

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleScrape = () => {
    if (!websiteUrl) return;
    setScraping(true);
    setScraped(false);
    setTimeout(() => {
      setBrandName("Extracted Brand");
      setSlogan("Extracted slogan from website");
      setDescription("This is an automatically generated description based on the provided website.");
      setScraping(false);
      setScraped(true);
    }, 2200);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = () => {
    if (!brandName.trim() || !website.trim()) return;

    const payload = {
      name: brandName,
      website: website,
      voice: brandVoice,
      primaryColor,
      secondaryColor,
    };

    if (selectedBrandId) {
      updateBrandMutation.mutate(
        { id: selectedBrandId, input: payload },
        {
          onSuccess: () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2800);
          },
        }
      );
    } else {
      createBrandMutation.mutate(payload, {
        onSuccess: (newBrand) => {
          setSelectedBrandId(newBrand.id);
          setSaved(true);
          setTimeout(() => setSaved(false), 2800);
        },
      });
    }
  };

  const fonts = ["Cormorant Garamond", "Inter", "DM Sans", "Playfair Display", "Syne", "Neue Haas Grotesk", "Libre Baskerville"];
  const voices = ["Professional", "Playful", "Luxurious", "Bold", "Minimalist", "Conversational", "Technical"];

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, minHeight: "100%", gap: 3, p: 3 }}>
      {/* Sidebar: Brands List */}
      <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0, borderRight: { md: "1px solid rgba(255,255,255,0.05)" }, pr: { md: 3 } }}>
        <Typography variant="h6" sx={{mb: 2, color: "text.primary" }}>
          Your Brands
        </Typography>
        <List sx={{ mb: 3 }}>
          {isBrandsLoading ? (
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
          ) : brands?.length ? (
            brands.map((brand) => (
              <ListItem disablePadding key={brand.id} sx={{ mb: 1 }}>
                <ListItemButton 
                  selected={selectedBrandId === brand.id} 
                  onClick={() => handleSelectBrand(brand)}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid transparent",
                    "&.Mui-selected": {
                      background: "rgba(212,175,122,0.1)",
                      borderColor: "rgba(212,175,122,0.3)",
                      "&:hover": { background: "rgba(212,175,122,0.15)" }
                    }
                  }}
                >
                  <ListItemText 
                    primary={brand.name} 
                    secondary={brand.website} 
                    primaryTypographyProps={{ sx: { fontWeight: selectedBrandId === brand.id ? 600 : 400, fontSize: '0.95rem' } }}
                    secondaryTypographyProps={{ noWrap: true, sx: { fontSize: '0.75rem', opacity: 0.7 } }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">No brands found.</Typography>
          )}
        </List>
        <GoldButton variant="ghost" fullWidth startIcon={<PlusIcon />} onClick={handleCreateNew}>
          Add New Brand
        </GoldButton>
      </Box>

      {/* Main Content: Brand Editor */}
      <Box sx={{ flex: 1, maxWidth: 860 }}>
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
              {selectedBrandId ? `Editing: ${brandName || 'Untitled Brand'}` : "Create a New Brand"}
            </Typography>
          </Box>
          <Collapse in={saved}>
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

        <Section title="Auto-fill from website" subtitle="Let AI scrape your website and populate your brand settings automatically">
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="https://yourcompany.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
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
            <GoldButton onClick={handleScrape} loading={scraping} startIcon={<SparkleIcon />}>
              Scrape with AI
            </GoldButton>
          </Box>
          {scraping && (
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
          {scraped && !scraping && (
            <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 10, color: "text.secondary", letterSpacing: "0.06em", opacity: 0.6 }}>
                Content extracted · Model: Gemini Flash ·
              </Typography>
              <Typography
                component="span"
                onClick={handleScrape}
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

        <Section title="Logo" badge="2MB MAX">
          <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Box
              onClick={() => fileRef.current?.click()}
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
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
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
              {logoPreview ? (
                <>
                  <Box component="img" src={logoPreview} alt="logo preview" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }} />
                  <IconButton
                    size="small"
                    onClick={() => setLogoPreview(null)}
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

        <Section title="Identity" subtitle="These brand values will be automatically injected into AI prompts when generating content">
          <Stack spacing={2}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField label="Brand name" size="small" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
              <TextField label="Slogan" size="small" value={slogan} onChange={(e) => setSlogan(e.target.value)} />
            </Box>
            <TextField label="Description" size="small" multiline rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Divider sx={{ borderColor: "rgba(212,175,122,0.1)" }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {[
                { label: "Primary color", value: primaryColor, set: setPrimaryColor },
                { label: "Secondary color", value: secondaryColor, set: setSecondaryColor },
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
                <Select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} label="Font family">
                  {fonts.map((f) => (
                    <MenuItem key={f} value={f}>
                      {f}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel sx={{ fontSize: 12, letterSpacing: "0.12em", color: "text.secondary", "&.Mui-focused": { color: "primary.main" } }}>Brand voice</InputLabel>
                <Select value={brandVoice} onChange={(e) => setBrandVoice(e.target.value as string)} label="Brand voice">
                  {voices.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
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

        <Section title="Contact & Web" subtitle="Public-facing information attached to your published content">
          <Stack spacing={2}>
            <TextField label="Contact email" size="small" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            <TextField
              label="Website"
              size="small"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
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

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3, pb: 4 }}>
          {selectedBrandId && (
            <GoldButton variant="ghost" size="small" onClick={() => navigate("/dashboard")}>
              Discard changes
            </GoldButton>
          )}
          <GoldButton 
            onClick={handleSave} 
            size="small" 
            loading={createBrandMutation.isPending || updateBrandMutation.isPending}
            disabled={!brandName.trim() || !website.trim()}
          >
            {selectedBrandId ? "Save changes" : "Create brand"}
          </GoldButton>
        </Box>
      </Box>
    </Box>
  );
}
