import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createArtist } from "@/api/artists";
import { artistKeys } from "../queryKeys";
import type { CreateArtistValues } from "../schemas";

export function useCreateArtistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateArtistValues) => createArtist(values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: artistKeys.lists() }),
  });
}
