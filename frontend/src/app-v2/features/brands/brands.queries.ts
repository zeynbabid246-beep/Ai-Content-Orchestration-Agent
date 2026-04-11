import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createBrand, type CreateBrandInput, getBrands } from "./brands.repository";

const brandsKey = ["brands"];

export function useBrandsQuery() {
  return useQuery({
    queryKey: brandsKey,
    queryFn: getBrands,
  });
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBrandInput) => createBrand(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandsKey });
    },
  });
}
