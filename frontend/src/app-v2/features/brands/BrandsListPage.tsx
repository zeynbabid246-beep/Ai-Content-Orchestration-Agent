import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useBrandsQuery } from "./brands.queries";
import { EmptyState, ErrorState, LoadingState } from "../../shared/ui/QueryState";

export function BrandsListPage() {
  const { data, isLoading, isError, error } = useBrandsQuery();

  if (isLoading) return <LoadingState label="Loading brands..." />;
  if (isError) return <ErrorState message={(error as Error).message} />;
  if (!data?.length) {
    return (
      <Stack spacing={3}>
        <EmptyState title="No brands yet" description="Create your first brand to start publishing content." />
        <Button component={RouterLink} to="/app/brands/new" variant="contained" sx={{ width: "fit-content" }}>
          Create brand
        </Button>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" sx={{ fontFamily: "Cormorant Garamond, serif" }}>
          Brands
        </Typography>
        <Button component={RouterLink} to="/app/brands/new" variant="contained">
          Create brand
        </Button>
      </Stack>

      <Stack spacing={2}>
        {data.map((brand) => (
          <Card key={brand.id}>
            <CardContent>
              <Typography variant="h6">{brand.name}</Typography>
              <Typography variant="body2" color="text.secondary">{brand.website}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Voice: {brand.voice}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="caption">Primary: {brand.colors.primary}</Typography>
                <Typography variant="caption">Secondary: {brand.colors.secondary}</Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}
