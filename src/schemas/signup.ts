import { z } from "zod";

// -----------------------------
// Payload (what you send to API)
// -----------------------------
export const SignupPayloadSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupPayload = z.infer<typeof SignupPayloadSchema>;