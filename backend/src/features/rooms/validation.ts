import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(50),
    description: z.string().max(250).optional(),
  }),
});

export const joinRoomSchema = z.object({
  body: z.object({
    joinCode: z.string().length(8),
  }),
});
