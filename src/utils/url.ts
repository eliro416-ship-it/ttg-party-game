import { Language } from '../types/game';

/**
 * Extracts the room PIN code from the URL (checking both query string and hash query).
 * Handles:
 * - ?pin=8366
 * - &pin=8366
 * - /#/?pin=8366
 * - /#pin=8366
 */
export function getPinFromUrl(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const pin = searchParams.get('pin');
    if (pin && pin.trim()) {
      return pin.trim();
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  if (window.location.hash) {
    try {
      const hash = window.location.hash;
      const qIndex = hash.indexOf('?');
      if (qIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(qIndex));
        const hashPin = hashParams.get('pin');
        if (hashPin && hashPin.trim()) return hashPin.trim();
      }
      const match = hash.match(/[#&?]pin=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).trim();
      }
    } catch (e) {
      // Ignore
    }
  }

  return null;
}

/**
 * Extracts language preference from URL (he | en).
 */
export function getLangFromUrl(): Language | null {
  if (typeof window === 'undefined') return null;

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const lang = searchParams.get('lang');
    if (lang === 'he' || lang === 'en') return lang;
  } catch (e) {}

  if (window.location.hash) {
    try {
      const hash = window.location.hash;
      const match = hash.match(/[#&?]lang=(he|en)/);
      if (match && (match[1] === 'he' || match[1] === 'en')) {
        return match[1] as Language;
      }
    } catch (e) {}
  }

  return null;
}
