// Las apps del estudio. La portada, las paginas de cada app y sus politicas de
// privacidad salen de aqui: para sumar una app nueva, se agrega una entrada
// (y, si tiene pagina propia, su componente en src/apps/<slug>/).

export type Lang = 'en' | 'es';
/** El blog tiene un idioma mas que el resto del sitio. */
export type BlogLang = Lang | 'pt';
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
  /** El nombre en otro idioma, si cambia (Tolli Study es Tolli Estudio en espanol). Usar appName(). */
  localName?: Partial<Record<BlogLang, string>>;
  status: Status;
  platforms: string;
  icon: string;
  tagline: Record<Lang, string> & { pt?: string };
  /** Si la app vive en otro dominio (Dear Wander), la portada enlaza ahi y no hay pagina aqui. */
  externalUrl?: string;
  /** Enlaces de tienda cuando existan. */
  playUrl?: string;
  appStoreUrl?: string;
  theme?: AppTheme;
  /** Imagen para compartir (og:image) de su pagina y de sus posts, por idioma. El portugues usa la inglesa. */
  og?: Record<Lang, string>;
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
      en: 'Your screen time companion.',
      es: 'Tu compañera para el tiempo en pantalla.',
      pt: 'Sua companhia para o tempo de tela.',
    },
    externalUrl: 'https://dearwander.com',
    hover: { bg: '#F3DDBA', ink: '#3B2A1E' },
  },
  {
    slug: 'tolli',
    name: 'Tolli',
    status: 'live',
    playUrl: 'https://play.google.com/store/apps/details?id=app.tolli',
    platforms: 'Android',
    icon: '/img/tolli-icon.png',
    og: { en: '/img/tolli-og.png', es: '/img/tolli-og-es.png' },
    tagline: {
      en: 'A little bell that dings every few minutes so you keep track of time.',
      es: 'Una campanita que suena cada pocos minutos para que no pierdas la noción del tiempo.',
      pt: 'Um sininho que toca a cada poucos minutos para você não perder a noção do tempo.',
    },
    theme: {
      bg: '#F4C230', surface: '#FFF8E6', ink: '#1E1A16', muted: '#5B5148', accent: '#E2482E', onAccent: '#FFFFFF',
      display: "'Fredoka', 'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif",
    },
    hover: { bg: '#F4C230', ink: '#1E1A16' },
    nameFont: "'Fredoka', sans-serif",
  },
  {
    slug: 'tolli-study',
    name: 'Tolli Study',
    localName: { es: 'Tolli Estudio' },
    status: 'soon',
    platforms: 'Android',
    icon: '/img/tolli-study-icon.png',
    tagline: {
      en: 'Flashcard questions in your pomodoro breaks, with cards your own AI makes.',
      es: 'Preguntas de repaso en las pausas del pomodoro, con tarjetas que arma tu IA.',
      pt: 'Perguntas de revisão nas pausas do pomodoro, com cartões feitos pela sua IA.',
    },
    // Los colores de Pizarra, el estilo con que abre la app; el coral es el de Tolli en el icono.
    theme: {
      bg: '#AFBDD6', surface: '#F5F7FB', ink: '#1A2236', muted: '#2F3A52', accent: '#EE7A5C', onAccent: '#1A2236',
      display: "'Fredoka', 'DM Sans', system-ui, sans-serif", body: "'DM Sans', system-ui, sans-serif",
    },
    hover: { bg: '#AFBDD6', ink: '#1A2236' },
    nameFont: "'Fredoka', sans-serif",
  },
];

/** Las apps con pagina propia en este sitio. */
export const appsWithPage = apps.filter((a) => !a.externalUrl && a.status !== 'building');

export const statusLabel: Record<Status, Record<BlogLang, string>> = {
  live: { en: 'Available', es: 'Disponible', pt: 'Disponível' },
  soon: { en: 'Coming soon', es: 'Pronto', pt: 'Em breve' },
  building: { en: 'On the way', es: 'En camino', pt: 'A caminho' },
};

/** El nombre de la app en un idioma. */
export const appName = (app: App, lang: BlogLang) => app.localName?.[lang] ?? app.name;

// Las paginas de las apps solo existen en ingles y espanol: en portugues se enlaza la inglesa.
export const appPath = (app: App, lang: BlogLang, sub = '') =>
  `${lang === 'es' ? '/es' : ''}/${app.slug}/${sub ? `${sub}/` : ''}`;
