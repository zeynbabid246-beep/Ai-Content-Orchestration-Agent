import { useState, useRef, useEffect, useCallback } from "react";
import type { Brand } from "../../../shared/types/domain";

const DEFAULTS = {
  brandName: "",
  slogan: "",
  description: "",
  primaryColor: "#0F172A",
  secondaryColor: "#6366F1",
  fontFamily: "Inter",
  brandVoice: "Professional",
  contactEmail: "",
  website: "",
  websiteUrl: "",
};

export function useBrandForm() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(DEFAULTS.brandName);
  const [slogan, setSlogan] = useState(DEFAULTS.slogan);
  const [description, setDescription] = useState(DEFAULTS.description);
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULTS.secondaryColor);
  const [fontFamily, setFontFamily] = useState(DEFAULTS.fontFamily);
  const [brandVoice, setBrandVoice] = useState(DEFAULTS.brandVoice);
  const [contactEmail, setContactEmail] = useState(DEFAULTS.contactEmail);
  const [website, setWebsite] = useState(DEFAULTS.website);
  const [websiteUrl, setWebsiteUrl] = useState(DEFAULTS.websiteUrl);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const selectBrand = useCallback((brand: Brand) => {
    setSelectedBrandId(brand.id);
    setBrandName(brand.name);
    setWebsite(brand.website);
    setWebsiteUrl(brand.website);
    setPrimaryColor(brand.colors?.primary || DEFAULTS.primaryColor);
    setSecondaryColor(brand.colors?.secondary || DEFAULTS.secondaryColor);
    setBrandVoice(brand.voice || DEFAULTS.brandVoice);
    setLogoPreview(brand.logoUrl || null);
    setSlogan(DEFAULTS.slogan);
    setDescription(DEFAULTS.description);
    setContactEmail(DEFAULTS.contactEmail);
    setFontFamily(DEFAULTS.fontFamily);
    setScraped(false);
    setScraping(false);
  }, []);

  const resetForm = useCallback(() => {
    setSelectedBrandId(null);
    setBrandName(DEFAULTS.brandName);
    setWebsite(DEFAULTS.website);
    setWebsiteUrl(DEFAULTS.websiteUrl);
    setPrimaryColor(DEFAULTS.primaryColor);
    setSecondaryColor(DEFAULTS.secondaryColor);
    setBrandVoice(DEFAULTS.brandVoice);
    setLogoPreview(null);
    setSlogan(DEFAULTS.slogan);
    setDescription(DEFAULTS.description);
    setContactEmail(DEFAULTS.contactEmail);
    setFontFamily(DEFAULTS.fontFamily);
    setScraped(false);
    setScraping(false);
  }, []);

  const handleScrape = useCallback(() => {
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
  }, [websiteUrl]);

  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
    },
    [logoPreview],
  );

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
  }, []);

  const getPayload = () => ({
    name: brandName,
    website,
    voice: brandVoice,
    primaryColor,
    secondaryColor,
  });

  const isValid = brandName.trim().length > 0 && website.trim().length > 0;

  return {
    // Selection
    selectedBrandId,
    setSelectedBrandId,
    selectBrand,
    resetForm,

    // Form fields
    brandName, setBrandName,
    slogan, setSlogan,
    description, setDescription,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    fontFamily, setFontFamily,
    brandVoice, setBrandVoice,
    contactEmail, setContactEmail,
    website, setWebsite,
    websiteUrl, setWebsiteUrl,
    logoPreview, setLogoPreview,

    // Scraping
    scraping, scraped, handleScrape,

    // Logo
    fileRef, handleLogoUpload,

    // Save
    saved, showSaved, getPayload, isValid,
  };
}
