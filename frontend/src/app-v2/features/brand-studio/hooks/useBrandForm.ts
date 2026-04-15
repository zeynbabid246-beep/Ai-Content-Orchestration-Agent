<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react";
=======
import { useState, useRef, useEffect, useCallback } from "react";
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
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

<<<<<<< HEAD
const PRIMARY_COUNT = 3;
const SECONDARY_COUNT = 3;

=======
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
export function useBrandForm() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState(DEFAULTS.brandName);
  const [slogan, setSlogan] = useState(DEFAULTS.slogan);
  const [description, setDescription] = useState(DEFAULTS.description);
<<<<<<< HEAD

  // Multi-color state (Arrays of 3)
  const [primaryColors, setPrimaryColors] = useState<string[]>(
    Array(PRIMARY_COUNT).fill(DEFAULTS.primaryColor)
  );
  const [secondaryColors, setSecondaryColors] = useState<string[]>(
    Array(SECONDARY_COUNT).fill(DEFAULTS.secondaryColor)
  );

=======
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULTS.secondaryColor);
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
  const [fontFamily, setFontFamily] = useState(DEFAULTS.fontFamily);
  const [brandVoice, setBrandVoice] = useState(DEFAULTS.brandVoice);
  const [contactEmail, setContactEmail] = useState(DEFAULTS.contactEmail);
  const [website, setWebsite] = useState(DEFAULTS.website);
  const [websiteUrl, setWebsiteUrl] = useState(DEFAULTS.websiteUrl);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [saved, setSaved] = useState(false);
<<<<<<< HEAD

  // Helper functions to update specific color slots
  const updatePrimaryColor = useCallback((index: number, value: string) => {
    setPrimaryColors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const updateSecondaryColor = useCallback((index: number, value: string) => {
    setSecondaryColors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  // Handle Logo Revocation (Memory cleanup)
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
=======
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
    };
  }, [logoPreview]);

  const selectBrand = useCallback((brand: Brand) => {
    setSelectedBrandId(brand.id);
    setBrandName(brand.name);
    setWebsite(brand.website);
    setWebsiteUrl(brand.website);
<<<<<<< HEAD
    
    // Fill arrays based on the brand's primary/secondary color
    const pColor = brand.colors?.primary || DEFAULTS.primaryColor;
    const sColor = brand.colors?.secondary || DEFAULTS.secondaryColor;
    setPrimaryColors(Array(PRIMARY_COUNT).fill(pColor));
    setSecondaryColors(Array(SECONDARY_COUNT).fill(sColor));

=======
    setPrimaryColor(brand.colors?.primary || DEFAULTS.primaryColor);
    setSecondaryColor(brand.colors?.secondary || DEFAULTS.secondaryColor);
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
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
<<<<<<< HEAD
    setPrimaryColors(Array(PRIMARY_COUNT).fill(DEFAULTS.primaryColor));
    setSecondaryColors(Array(SECONDARY_COUNT).fill(DEFAULTS.secondaryColor));
=======
    setPrimaryColor(DEFAULTS.primaryColor);
    setSecondaryColor(DEFAULTS.secondaryColor);
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
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
<<<<<<< HEAD
      setDescription("Automatically generated description.");
=======
      setDescription("This is an automatically generated description based on the provided website.");
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
      setScraping(false);
      setScraped(true);
    }, 2200);
  }, [websiteUrl]);

<<<<<<< HEAD
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
  }, []);
=======
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (logoPreview && logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
    },
    [logoPreview],
  );
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746

  const showSaved = useCallback(() => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2800);
  }, []);

  const getPayload = () => ({
    name: brandName,
    website,
    voice: brandVoice,
<<<<<<< HEAD
    primaryColors, // Array of 3
    secondaryColors, // Array of 3
=======
    primaryColor,
    secondaryColor,
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
  });

  const isValid = brandName.trim().length > 0 && website.trim().length > 0;

  return {
<<<<<<< HEAD
    selectedBrandId, setSelectedBrandId,
    selectBrand, resetForm,
    brandName, setBrandName,
    slogan, setSlogan,
    description, setDescription,
    primaryColors, updatePrimaryColor,
    secondaryColors, updateSecondaryColor,
=======
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
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
    fontFamily, setFontFamily,
    brandVoice, setBrandVoice,
    contactEmail, setContactEmail,
    website, setWebsite,
    websiteUrl, setWebsiteUrl,
    logoPreview, setLogoPreview,
<<<<<<< HEAD
    scraping, scraped, handleScrape,
    handleLogoUpload,
    saved, showSaved, getPayload, isValid,
  };
}
=======

    // Scraping
    scraping, scraped, handleScrape,

    // Logo
    fileRef, handleLogoUpload,

    // Save
    saved, showSaved, getPayload, isValid,
  };
}
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
