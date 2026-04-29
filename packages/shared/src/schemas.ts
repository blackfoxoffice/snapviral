import { z } from 'zod';

export const youtubeUrlRegex =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+(\S*)?$/i;

export const languageSchema = z.enum(['ta', 'en', 'hi']);
export const inputModeSchema = z.enum(['urls', 'script', 'topic', 'research']);
export const imageStyleSchema = z.enum(['cartoon', 'illustrated', 'realistic', 'ultra_realistic']);

export const durationSchema = z
  .number()
  .int()
  .refine((v) => [10, 20, 30, 45, 60].includes(v), {
    message: 'Duration must be 10, 20, 30, 45, or 60 seconds',
  });

export const createProjectSchema = z
  .object({
    title: z.string().min(1).max(200),
    topic: z.string().max(500).optional().nullable(),
    language: languageSchema,
    duration_seconds: durationSchema,
    input_mode: inputModeSchema,
    source_urls: z.array(z.string().regex(youtubeUrlRegex)).max(5).optional().nullable(),
    user_script: z.string().max(12000).optional().nullable(),
    voice_id: z.string().max(100).optional().nullable(),
    image_style: imageStyleSchema.optional().default('realistic'),
  })
  .superRefine((v, ctx) => {
    if (v.input_mode === 'urls') {
      if (!v.source_urls || v.source_urls.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['source_urls'],
          message: 'At least one YouTube URL is required',
        });
      }
    }
    if (v.input_mode === 'script') {
      if (!v.user_script || v.user_script.trim().length < 50) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['user_script'],
          message: 'Paste at least a short paragraph (50+ characters)',
        });
      }
    }
    if (v.input_mode === 'topic' || v.input_mode === 'research') {
      if (!v.topic || v.topic.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['topic'],
          message: 'Topic is required',
        });
      }
    }
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const signupSchema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(32).optional().nullable(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const scriptOutputSchema = z.object({
  title: z.string(),
  hook: z.string(),
  scenes: z
    .array(
      z.object({
        narration: z.string(),
        visual_prompt: z.string(),
      }),
    )
    .min(2)
    .max(12),
  cta: z.string(),
});
