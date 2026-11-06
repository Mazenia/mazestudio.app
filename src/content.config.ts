import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Una politica de privacidad por app e idioma: src/content/privacy/<slug>.<lang>.md,
// y los terminos de uso igual en src/content/terms (solo las apps que los tienen).
const policy = (base: string) => defineCollection({
  loader: glob({ pattern: '*.md', base, generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    effective: z.string(),
  }),
});

export const collections = { privacy: policy('./src/content/privacy'), terms: policy('./src/content/terms') };
