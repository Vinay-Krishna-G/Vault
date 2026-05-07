import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
    profileIdentity: z.object({
      avatar: z.string(),
      color: z.string(),
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});
