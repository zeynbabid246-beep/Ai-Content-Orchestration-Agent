import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
<<<<<<< HEAD
  Skeleton,
=======
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
} from "@mui/material";
import { GoldButton } from "../../../shared/ui/GoldButton";
import { PlusIcon } from "../../../shared/ui/icons";
import type { Brand } from "../../../shared/types/domain";

<<<<<<< HEAD
interface Props {
=======
interface BrandSidebarProps {
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
  brands: Brand[] | undefined;
  isLoading: boolean;
  selectedBrandId: string | null;
  onSelectBrand: (brand: Brand) => void;
  onCreateNew: () => void;
}

<<<<<<< HEAD
export function BrandSidebar({
  brands,
  isLoading,
  selectedBrandId,
  onSelectBrand,
  onCreateNew,
}: Props) {
  return (
    <Box sx={{ width: 260, pr: 3, flexShrink: 0 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "text.secondary",
          mb: 1.5,
        }}
      >
        Your Brands
      </Typography>

      <List disablePadding sx={{ mb: 2 }}>
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} height={52} sx={{ borderRadius: 1, mb: 0.5 }} />
          ))
        ) : brands?.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: "text.secondary", py: 1 }}>
            No brands yet
          </Typography>
        ) : (
          brands?.map((brand) => (
            <ListItem key={brand.id} disablePadding sx={{ mb: 0.5 }}>
=======
export function BrandSidebar({ brands, isLoading, selectedBrandId, onSelectBrand, onCreateNew }: BrandSidebarProps) {
  return (
    <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0, borderRight: { md: "1px solid rgba(255,255,255,0.05)" }, pr: { md: 3 } }}>
      <Typography variant="h6" sx={{ mb: 2, color: "text.primary" }}>
        Your Brands
      </Typography>
      <List sx={{ mb: 3 }}>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">Loading...</Typography>
        ) : brands?.length ? (
          brands.map((brand) => (
            <ListItem disablePadding key={brand.id} sx={{ mb: 1 }}>
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
              <ListItemButton
                selected={selectedBrandId === brand.id}
                onClick={() => onSelectBrand(brand)}
                sx={{
<<<<<<< HEAD
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 1,
                  "&.Mui-selected": {
                    background: "rgba(212,175,122,0.08)",
                    borderLeft: "2px solid",
                    borderColor: "primary.main",
                  },
                  "&:hover": {
                    background: "rgba(255,255,255,0.04)",
=======
                  borderRadius: 2,
                  border: "1px solid transparent",
                  "&.Mui-selected": {
                    background: "rgba(212,175,122,0.1)",
                    borderColor: "rgba(212,175,122,0.3)",
                    "&:hover": { background: "rgba(212,175,122,0.15)" },
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
                  },
                }}
              >
                <ListItemText
                  primary={brand.name}
                  secondary={brand.website}
<<<<<<< HEAD
                  primaryTypographyProps={{
                    fontSize: 13,
                    fontWeight: selectedBrandId === brand.id ? 500 : 400,
                    color: "text.primary",
                    noWrap: true,
                  }}
                  secondaryTypographyProps={{
                    fontSize: 11,
                    color: "text.secondary",
                    noWrap: true,
                  }}
=======
                  primaryTypographyProps={{ sx: { fontWeight: selectedBrandId === brand.id ? 600 : 400, fontSize: "0.95rem" } }}
                  secondaryTypographyProps={{ noWrap: true, sx: { fontSize: "0.75rem", opacity: 0.7 } }}
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
                />
              </ListItemButton>
            </ListItem>
          ))
<<<<<<< HEAD
        )}
      </List>

      <GoldButton
        variant="ghost"
        fullWidth
        startIcon={<PlusIcon />}
        onClick={onCreateNew}
        sx={{ justifyContent: "flex-start", fontSize: 13 }}
      >
        Add new brand
      </GoldButton>
    </Box>
  );
}
=======
        ) : (
          <Typography variant="body2" color="text.secondary">No brands found.</Typography>
        )}
      </List>
      <GoldButton variant="ghost" fullWidth startIcon={<PlusIcon />} onClick={onCreateNew}>
        Add New Brand
      </GoldButton>
    </Box>
  );
}
>>>>>>> 94c211d4692970b7d7b0eb9fa2e63ece12876746
