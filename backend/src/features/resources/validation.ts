import { z } from 'zod';

export const uploadResourceSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(500).optional(),
    tags: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return [];
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return val.split(',').map(t => t.trim()).filter(Boolean);
        }
      }),
  }),
});

export type CreateResourceDTO = {
  title: string;
  description?: string;
  tags?: string[];
  file: Express.Multer.File;
  roomId: string;
  uploaderId: string;
  color?: string;
};
