/**
 * Language selection.
 *
 * Two languages, no framework. The choice lives in the URL like every other
 * piece of state on this page, and is written there only once the visitor has
 * actually picked one — so a link shared by someone who never touched the
 * switch stays short and opens in whatever language the reader's browser asks
 * for.
 */

export type Language = 'en' | 'fr';

export const LANGUAGES: readonly Language[] = ['en', 'fr'];

/** BCP 47 tags, for `lang` attributes and for `Intl`. */
export const TAGS: Record<Language, string> = { en: 'en', fr: 'fr-FR' };

export const LABELS: Record<Language, string> = { en: 'English', fr: 'Français' };

export const DEFAULT_LANGUAGE: Language = 'en';

export function isLanguage(value: string | null): value is Language {
  return value !== null && (LANGUAGES as readonly string[]).includes(value);
}

/**
 * What the browser asks for, when the URL says nothing. Anything that is not
 * French gets English, which is the language the page was written in.
 */
export function preferred(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  const asked = [navigator.language, ...(navigator.languages ?? [])];
  return asked.some((l) => l?.toLowerCase().startsWith('fr')) ? 'fr' : DEFAULT_LANGUAGE;
}
