import { z } from "zod";

// -----------------------------
// Payload (what you send to API)
// -----------------------------
export const SigninPayloadSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SigninPayload = z.infer<typeof SigninPayloadSchema>;