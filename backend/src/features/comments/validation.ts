import { z } from 'zod';

// Sanitize helper: strip HTML tags to prevent XSS
const sanitizeText = (val: string) => val.replace(/<[^>]*>/g, '').trim();

export const createCommentSchema = z.object({
  body: z.object({
    content: z
      .string()
      .min(1, 'Comment cannot be empty')
      .max(2000)
      .transform(sanitizeText),
    parentCommentId: z.string().optional(),
  }),
});

export const reactToCommentSchema = z.object({
  body: z.object({
    type: z.enum(['👍', '🧠', '😂', '🔥']),
  }),
});

export const reactToResourceSchema = z.object({
  body: z.object({
    type: z.enum(['🔥', '🧠', '📌', '✅']),
  }),
});

export type CreateCommentDTO = {
  content: string;
  parentCommentId?: string;
  resourceId: string;
  authorId: string;
};
