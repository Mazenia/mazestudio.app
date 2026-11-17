// Ayudas del blog: los posts publicados de un idioma, mas nuevos primero.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../data/apps';

export type Post = CollectionEntry<'blog'>;

export const postSlug = (p: Post) => p.id.replace(/\.(en|es)$/, '');
export const postLang = (p: Post): Lang => (p.id.endsWith('.es') ? 'es' : 'en');
export const blogPath = (lang: Lang, slug = '') => `${lang === 'es' ? '/es' : ''}/blog/${slug ? `${slug}/` : ''}`;

export async function getPosts(lang: Lang, app?: string): Promise<Post[]> {
  const all = await getCollection('blog', (p) => !p.data.draft && postLang(p) === lang && (!app || p.data.app === app));
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export const formatDate = (d: Date, lang: Lang) =>
  new Intl.DateTimeFormat(lang === 'es' ? 'es' : 'en', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
