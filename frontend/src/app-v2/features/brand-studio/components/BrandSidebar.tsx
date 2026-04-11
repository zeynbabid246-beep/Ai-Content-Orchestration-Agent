import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { GoldButton } from "../../../shared/ui/GoldButton";
import { PlusIcon } from "../../../shared/ui/icons";
import type { Brand } from "../../../shared/types/domain";

interface BrandSidebarProps {
  brands: Brand[] | undefined;
  isLoading: boolean;
  selectedBrandId: string | null;
  onSelectBrand: (brand: Brand) => void;
  onCreateNew: () => void;
}

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
              <ListItemButton
                selected={selectedBrandId === brand.id}
                onClick={() => onSelectBrand(brand)}
                sx={{
                  borderRadius: 2,
                  border: "1px solid transparent",
                  "&.Mui-selected": {
                    background: "rgba(212,175,122,0.1)",
                    borderColor: "rgba(212,175,122,0.3)",
                    "&:hover": { background: "rgba(212,175,122,0.15)" },
                  },
                }}
              >
                <ListItemText
                  primary={brand.name}
                  secondary={brand.website}
                  primaryTypographyProps={{ sx: { fontWeight: selectedBrandId === brand.id ? 600 : 400, fontSize: "0.95rem" } }}
                  secondaryTypographyProps={{ noWrap: true, sx: { fontSize: "0.75rem", opacity: 0.7 } }}
                />
              </ListItemButton>
            </ListItem>
          ))
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
