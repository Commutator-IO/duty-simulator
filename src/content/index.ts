import { createContext, useContext } from 'react';
import { DEFAULT_LANGUAGE, type Language } from '../lib/i18n';
import type { Copy } from './types';
import { EN } from './en';
import { FR } from './fr';

/**
 * The copy, by language.
 *
 * Both modules are typed as `Copy`, so a key missing from one of them is a
 * compile error rather than an English sentence appearing in the middle of a
 * French page. That is the whole point of the arrangement, and it is why the
 * type is not `Partial`.
 */
export const COPY: Record<Language, Copy> = { en: EN, fr: FR };

const CopyContext = createContext<Copy>(COPY[DEFAULT_LANGUAGE]);

export const CopyProvider = CopyContext.Provider;

/** The copy for the language currently selected. */
export function useCopy(): Copy {
  return useContext(CopyContext);
}
