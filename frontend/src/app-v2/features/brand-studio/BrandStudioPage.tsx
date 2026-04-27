import { useState, useRef } from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  LinearProgress,
  Alert,
  Snackbar,
} from "@mui/material";

import { Section } from "../../shared/ui/Section";
import { GoldButton } from "../../shared/ui/GoldButton";
import { UploadIcon } from "../../shared/ui/icons";
import {
  configureBrandAPI,
  analyzeBrandAPI,
  type BrandAnalyzeResult,
} from "../../features/brands/brands.repository";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ColorBox({ value, onChange }: any) {
  return (
    <Box
      sx={{
        width: 50,
        height: 50,
        borderRadius: 1.5,
        background: value,
        border: "2px solid rgba(212,175,122,0.2)",
        position: "relative",
      }}
    >
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
      />
    </Box>
  );
}

function UploadBox({ label, value, onChange }: any) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
  };

  return (
    <Box>
      <Typography sx={{ mb: 1 }}>{label}</Typography>
      <Box
        onClick={() => inputRef.current?.click()}
        sx={{
          width: "100%",
          height: 120,
          border: "1px dashed rgba(212,175,122,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {value ? (
          <Box component="img" src={value} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <UploadIcon />
        )}
      </Box>
      <input hidden ref={inputRef} type="file" onChange={handleUpload} />
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BrandStudioPage() {
  // ── Website
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scraping, setScraping] = useState(false);

  // ── Identity
  const [brandName, setBrandName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logomark, setLogomark] = useState<string | null>(null);

  // ── Business
  const [contactEmail, setContactEmail] = useState("");
  const [businessOverview, setBusinessOverview] = useState("");

  // ── Strategy
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [pillars, setPillars] = useState("");
  const [keyMessages, setKeyMessages] = useState("");
  const [valueProp, setValueProp] = useState("");

  // ── Visual
  const [font, setFont] = useState("");
  const [primary, setPrimary] = useState(["#111111", "#d4af7a", "#999999"]);
  const [secondary, setSecondary] = useState(["#eeeeee", "#cccccc", "#aaaaaa"]);
  const [detectedImages, setDetectedImages] = useState<(string | null)[]>([null, null, null]);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [analysisSummary, setAnalysisSummary] = useState("");

  // ── UI state
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Derive a stable org_id from the brand name (or fallback)
  const orgId = brandName.trim().toLowerCase().replace(/\s+/g, "_") || `brand_${Date.now()}`;

  // ─── Populate form from AI analysis result ──────────────────────────────────
  function applyAnalysisResult(result: BrandAnalyzeResult) {
    if (result.brand_name) setBrandName(result.brand_name);
    if (result.tone_of_voice?.length) setTone(result.tone_of_voice.join(", "));
    if (result.audience_signals?.length) setAudience(result.audience_signals.join(", "));
    if (result.content_pillars?.length) setPillars(result.content_pillars.join(", "));
    if (result.brand_summary) {
      setBusinessOverview(result.brand_summary);
      setAnalysisSummary(result.brand_summary);
    }
    if (result.typography) setFont(result.typography);
    if (result.colors?.primary) {
      setPrimary((prev) => [result.colors!.primary!, prev[1], prev[2]]);
    }
    if (result.colors?.secondary) {
      setSecondary((prev) => [result.colors!.secondary!, prev[1], prev[2]]);
    }
  }

  // ─── Scrape with AI ─────────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!websiteUrl) return;
    setScraping(true);
    try {
      // Step 1 – configure (registers the brand on the backend)
      await configureBrandAPI({
        org_id: orgId,
        website_url: websiteUrl,
        brand_name: brandName || "Unknown",
        tone: tone || "",
        primary_color: primary[0],
        secondary_color: secondary[0],
        typography: font || "",
        email: contactEmail || "",
        business_info: businessOverview || "",
      });

      // Step 2 – analyze (scrapes website and returns brand DNA)
      const result = await analyzeBrandAPI({ org_id: orgId, website_url: websiteUrl });
      applyAnalysisResult(result);

      setToast({ open: true, message: "Brand scraped successfully ✨", severity: "success" });
    } catch (err: any) {
      console.error("Scrape error:", err);
      setToast({ open: true, message: `Scrape failed: ${err.message}`, severity: "error" });
    } finally {
      setScraping(false);
    }
  };

  // ─── Save Changes ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await configureBrandAPI({
        org_id: orgId,
        website_url: websiteUrl,
        brand_name: brandName,
        tone,
        primary_color: primary[0],
        secondary_color: secondary[0],
        typography: font,
        email: contactEmail,
        business_info: businessOverview,
      });

      setToast({ open: true, message: "Brand saved successfully!", severity: "success" });
    } catch (err: any) {
      console.error("Save error:", err);
      setToast({ open: true, message: `Save failed: ${err.message}`, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>

      {/* ── Website ── */}
      <Section title="Website">
        <TextField
          fullWidth
          placeholder="https://yourcompany.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
        />

        <Box
          onClick={handleScrape}
          sx={{
            mt: 2,
            px: 2,
            py: 1,
            display: "inline-flex",
            borderRadius: 1.5,
            border: "1px solid rgba(212,175,122,0.4)",
            cursor: scraping ? "not-allowed" : "pointer",
            fontSize: 12,
            color: "#d4af7a",
            opacity: scraping ? 0.6 : 1,
          }}
        >
          {scraping ? "Scraping…" : "Scrape with AI ✨"}
        </Box>

        {scraping && <LinearProgress sx={{ mt: 2 }} />}
      </Section>

      {/* ── Identity ── */}
      <Section title="Identity">
        <Stack spacing={2}>
          <TextField label="Brand Name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          <TextField label="Slogan" value={slogan} onChange={(e) => setSlogan(e.target.value)} fullWidth />
          <UploadBox label="Logo" value={logo} onChange={setLogo} />
          <UploadBox label="Logomark" value={logomark} onChange={setLogomark} />
        </Stack>
      </Section>

      {/* ── Business Details ── */}
      <Section title="Business Details">
        <Stack spacing={2}>
          <TextField label="Contact Email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          <TextField
            label="Business Overview"
            multiline
            rows={3}
            value={businessOverview}
            onChange={(e) => setBusinessOverview(e.target.value)}
          />
          <TextField
            label="Website URL"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </Stack>
      </Section>

      {/* ── Brand Strategy ── */}
      <Section title="Brand Strategy">
        <Stack spacing={2}>
          <TextField label="Tone of Voice" value={tone} onChange={(e) => setTone(e.target.value)} />
          <TextField label="Audience Signals" value={audience} onChange={(e) => setAudience(e.target.value)} />
          <TextField label="Content Pillars" value={pillars} onChange={(e) => setPillars(e.target.value)} />
          <TextField
            label="Key Messages"
            multiline
            rows={2}
            value={keyMessages}
            onChange={(e) => setKeyMessages(e.target.value)}
          />
          <TextField
            label="Value Proposition"
            multiline
            rows={2}
            value={valueProp}
            onChange={(e) => setValueProp(e.target.value)}
          />
        </Stack>
      </Section>

      {/* ── Visual Brand Identity ── */}
      <Section title="Visual Brand Identity">
        <Stack spacing={3}>
          <TextField label="Font Family" value={font} onChange={(e) => setFont(e.target.value)} />

          <Box sx={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Box>
              <Typography>Primary Colors</Typography>
              <Stack direction="row" spacing={2}>
                {primary.map((c, i) => (
                  <ColorBox
                    key={i}
                    value={c}
                    onChange={(v: string) => {
                      const next = [...primary];
                      next[i] = v;
                      setPrimary(next);
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <Typography>Secondary Colors</Typography>
              <Stack direction="row" spacing={2}>
                {secondary.map((c, i) => (
                  <ColorBox
                    key={i}
                    value={c}
                    onChange={(v: string) => {
                      const next = [...secondary];
                      next[i] = v;
                      setSecondary(next);
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Box>

          <Box>
            <Typography>Image Detection</Typography>
            <Stack direction="row" spacing={2}>
              {detectedImages.map((img, i) => (
                <UploadBox
                  key={i}
                  label={`Image ${i + 1}`}
                  value={img}
                  onChange={(v: string) => {
                    const next = [...detectedImages];
                    next[i] = v;
                    setDetectedImages(next);
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Analysis summary — auto-populated from AI scrape */}
          <TextField
            label="Analysis Summary"
            multiline
            rows={4}
            fullWidth
            value={analysisSummary}
            onChange={(e) => setAnalysisSummary(e.target.value)}
            InputProps={{ readOnly: !analysisSummary }}
            placeholder="Will be filled automatically after Scrape with AI ✨"
          />

          <UploadBox label="Screenshot" value={screenshot} onChange={setScreenshot} />
        </Stack>
      </Section>

      {/* ── Save ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
        <GoldButton onClick={handleSave} loading={saving}>
          Save Changes
        </GoldButton>
      </Box>

      {/* ── Toast notifications ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}