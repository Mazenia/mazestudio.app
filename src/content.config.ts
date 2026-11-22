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

// El blog del estudio, uno para todas las apps: src/content/blog/<slug>.<lang>.md.
// `app` etiqueta el post con una app (su slug en src/data/apps.ts): toma sus colores
// y aparece en la pagina de esa app. `translation` es el slug del mismo post en el otro idioma.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({
    title: z.string(),
    /** Titulo para Google y redes si el del post pasa de ~60 caracteres; el H1 sigue siendo `title`. */
    seoTitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    app: z.string().optional(),
    translation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { privacy: policy('./src/content/privacy'), terms: policy('./src/content/terms'), blog };
