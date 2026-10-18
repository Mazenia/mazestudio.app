import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Una politica de privacidad por app e idioma: src/content/privacy/<slug>.<lang>.md
const privacy = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/privacy', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    effective: z.string(),
  }),
});

export const collections = { privacy };
