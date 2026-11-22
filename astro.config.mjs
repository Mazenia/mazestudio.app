// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://mazestudio.app';

// La fecha de cada post (o la de su ultima actualizacion) para el <lastmod> del sitemap.
// Solo los posts: para el resto de las paginas no sabemos la fecha real y no se inventa.
const blogDir = new URL('./src/content/blog/', import.meta.url);
const lastmod = new Map();
for (const file of readdirSync(blogDir)) {
  const m = file.match(/^(.+)\.(en|es|pt)\.md$/);
  if (!m) continue;
  const fm = readFileSync(new URL(file, blogDir), 'utf8').split(/^---$/m)[1] ?? '';
  if (/^draft:\s*true/m.test(fm)) continue;
  const date = (fm.match(/^updated:\s*['"]?([\d-]+)/m) ?? fm.match(/^date:\s*['"]?([\d-]+)/m))?.[1];
  const [, slug, lang] = m;
  if (date) lastmod.set(`${site}${lang === 'en' ? '' : `/${lang}`}/blog/${slug}/`, new Date(date).toISOString());
}

// El sitio del estudio: una pagina por app dentro del mismo dominio.
// Mismo esquema que dearwander.com: estatico, barra final siempre, ingles sin prefijo.
export default defineConfig({
  site,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({
    i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es', pt: 'pt-BR' } },
    serialize: (item) => (lastmod.has(item.url) ? { ...item, lastmod: lastmod.get(item.url) } : item),
  })],
  i18n: { defaultLocale: 'en', locales: ['en', 'es', 'pt'], routing: { prefixDefaultLocale: false } },
});
