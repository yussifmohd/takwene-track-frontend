import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/api/auth";
import { useAuthStore } from "@/stores/authStore";
import type { LoginValues } from "../schemas";

export const AUTH_QUERY_KEY = ["auth"] as const;

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: (values: LoginValues) => login({ email: values.email.trim(), password: values.password }),
    onSuccess: (response) => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      signIn({
        accessToken: response.accessToken,
        expiresAt: response.expiresAt,
        email: response.user.email,
        roles: [...response.user.roles],
      });
    },
  });
}
