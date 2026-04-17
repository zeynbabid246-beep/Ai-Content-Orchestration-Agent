import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Skeleton,
} from "@mui/material";
import { GoldButton } from "../../../shared/ui/GoldButton";
import { PlusIcon } from "../../../shared/ui/icons";
import type { Brand } from "../../../shared/types/domain";

interface Props {
  brands: Brand[] | undefined;
  isLoading: boolean;
  selectedBrandId: string | null;
  onSelectBrand: (brand: Brand) => void;
  onCreateNew: () => void;
}

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
              <ListItemButton
                selected={selectedBrandId === brand.id}
                onClick={() => onSelectBrand(brand)}
                sx={{
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
                  },
                }}
              >
                <ListItemText
                  primary={brand.name}
                  secondary={brand.website}
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
                />
              </ListItemButton>
            </ListItem>
          ))
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
