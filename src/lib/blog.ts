// Ayudas del blog: los posts publicados de un idioma, mas nuevos primero.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { BlogLang } from '../data/apps';

export type Post = CollectionEntry<'blog'>;
export const BLOG_LANGS: BlogLang[] = ['en', 'es', 'pt'];
/** Codigo para hreflang y el atributo lang. */
export const langTag: Record<BlogLang, string> = { en: 'en', es: 'es', pt: 'pt-BR' };
export const langName: Record<BlogLang, string> = { en: 'English', es: 'Español', pt: 'Português' };

export const postSlug = (p: Post) => p.id.replace(/\.(en|es|pt)$/, '');
export const postLang = (p: Post): BlogLang => (p.id.endsWith('.es') ? 'es' : p.id.endsWith('.pt') ? 'pt' : 'en');
export const blogPath = (lang: BlogLang, slug = '') => `${lang === 'en' ? '' : `/${lang}`}/blog/${slug ? `${slug}/` : ''}`;

export async function getPosts(lang: BlogLang, app?: string): Promise<Post[]> {
  const all = await getCollection('blog', (p) => !p.data.draft && postLang(p) === lang && (!app || p.data.app === app));
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** El mismo post en cada idioma. Se agrupan por el slug ingles: el post ingles
 *  apunta a su traduccion espanola, y los demas apuntan al ingles. */
export async function alternatesOf(post: Post): Promise<Partial<Record<BlogLang, string>>> {
  const all = await getCollection('blog', (p) => !p.data.draft);
  const lang = postLang(post);
  const en = lang === 'en' ? post
    : all.find((p) => postLang(p) === 'en' && (postSlug(p) === post.data.translation || p.data.translation === postSlug(post)));
  const out: Partial<Record<BlogLang, string>> = { [lang]: blogPath(lang, postSlug(post)) };
  if (!en) return out;
  out.en = blogPath('en', postSlug(en));
  for (const p of all) {
    const l = postLang(p);
    if (l === 'en' || out[l]) continue;
    if (p.data.translation === postSlug(en) || (en.data.translation && postSlug(p) === en.data.translation)) out[l] = blogPath(l, postSlug(p));
  }
  return out;
}

export const blogAlternates: Record<BlogLang, string> = { en: '/blog/', es: '/es/blog/', pt: '/pt/blog/' };

export const formatDate = (d: Date, lang: BlogLang) =>
  new Intl.DateTimeFormat(langTag[lang], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
