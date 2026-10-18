// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// El sitio del estudio: una pagina por app dentro del mismo dominio.
// Mismo esquema que dearwander.com: estatico, barra final siempre, ingles sin prefijo.
export default defineConfig({
  site: 'https://mazestudio.app',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', es: 'es' } } })],
  i18n: { defaultLocale: 'en', locales: ['en', 'es'], routing: { prefixDefaultLocale: false } },
});
