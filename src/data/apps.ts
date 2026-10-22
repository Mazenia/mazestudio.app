// Las apps del estudio. La portada, las paginas de cada app y sus politicas de
// privacidad salen de aqui: para sumar una app nueva, se agrega una entrada
// (y, si tiene pagina propia, su componente en src/apps/<slug>/).

export type Lang = 'en' | 'es';
export type Status = 'live' | 'soon' | 'building';

export interface AppTheme {
  bg: string; surface: string; ink: string; muted: string; accent: string; onAccent: string;
  /** Tipografia de titulos de la app (debe estar en public/fonts y declarada en Base.astro). */
  display: string;
  body: string;
}

export interface App {
  slug: string;
  name: string;
  status: Status;
  platforms: string;
  icon: string;
  tagline: Record<Lang, string>;
  /** Si la app vive en otro dominio (Dear Wander), la portada enlaza ahi y no hay pagina aqui. */
  externalUrl?: string;
  /** Enlaces de tienda cuando existan. */
  playUrl?: string;
  appStoreUrl?: string;
  theme?: AppTheme;
  /** Color de la fila del indice al pasar por encima. */
  hover: { bg: string; ink: string };
  /** Tipografia del nombre en el indice. */
  nameFont?: string;
}

// Orden de la portada: primero lo que se puede descargar hoy.
export const apps: App[] = [
  {
    slug: 'dear-wander',
    name: 'Dear Wander',
    status: 'live',
    platforms: 'iPhone · Android',
    icon: '/img/dear-wander-icon.png',
    tagline: {
      en: 'A one-minute breath before you open the apps you scroll most.',
      es: 'Una respiración de un minuto antes de abrir las apps donde más haces scroll.',
    },
    externalUrl: 'https://dearwander.com',
    hover: { bg: '#F3DDBA', ink: '#3B2A1E' },
  },
  {
    slug: 'tolli',
    name: 'Tolli',
    status: 'soon',
    platforms: 'Android',
    icon: '/img/tolli-icon.png',
    tagline: {
      en: 'A little bell that dings every few minutes so you keep track of time.',
      es: 'Una campanita que suena cada pocos minutos para que no pierdas la noción del tiempo.',
    },
    theme: {
      bg: '#F4C230', surface: '#FFF8E6', ink: '#1E1A16', muted: '#5B5148', accent: '#E2482E', onAccent: '#FFFFFF',
      display: "'Fredoka', 'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif",
    },
    hover: { bg: '#F4C230', ink: '#1E1A16' },
    nameFont: "'Fredoka', sans-serif",
  },
  {
    slug: 'ringwell',
    name: 'Ringwell',
    status: 'building',
    platforms: 'Android',
    icon: '',
    tagline: {
      en: 'The alarm for people who work rotating shifts.',
      es: 'La alarma para quien trabaja por turnos.',
    },
    hover: { bg: '#0E1724', ink: '#E8EEF3' },
  },
];

/** Las apps con pagina propia en este sitio. */
export const appsWithPage = apps.filter((a) => !a.externalUrl && a.status !== 'building');

export const statusLabel: Record<Status, Record<Lang, string>> = {
  live: { en: 'Available', es: 'Disponible' },
  soon: { en: 'Coming soon', es: 'Pronto' },
  building: { en: 'On the way', es: 'En camino' },
};

export const appPath = (app: App, lang: Lang, sub = '') =>
  `${lang === 'es' ? '/es' : ''}/${app.slug}/${sub ? `${sub}/` : ''}`;
