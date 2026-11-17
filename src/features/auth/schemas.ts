import { z } from "zod";

const emailFormat = z.email();

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address.")
    .refine((value) => emailFormat.safeParse(value.trim()).success, "Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;
