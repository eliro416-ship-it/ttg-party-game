// Standard Hebrew keyboard mapping from QWERTY keys
export const EN_TO_HE_MAP: Record<string, string> = {
  q: '/', w: '\'', e: 'ק', r: 'ר', t: 'א', y: 'ט', u: 'ו', i: 'ן', o: 'ם', p: 'פ',
  a: 'ש', s: 'ד', d: 'ג', f: 'כ', g: 'ע', h: 'י', j: 'ח', k: 'ל', l: 'ך', ';': 'ף',
  z: 'ז', x: 'ס', c: 'ב', v: 'ה', b: 'נ', n: 'מ', m: 'צ', ',': 'ת', '.': 'ץ'
};

export const HEBREW_KEYBOARD_ROWS = [
  ['ק', 'ר', 'א', 'ט', 'ו', 'ן', 'ם', 'פ'],
  ['ש', 'ד', 'ג', 'כ', 'ע', 'י', 'ח', 'ל', 'ך', 'ף'],
  ['ז', 'ס', 'ב', 'ה', 'נ', 'מ', 'צ', 'ת', 'ץ']
];

// Helper to convert typed char (whether English key or Hebrew) to Hebrew letter
export function normalizeHebrewInput(char: string): string | null {
  const lower = char.toLowerCase();
  if (EN_TO_HE_MAP[lower]) {
    const mapped = EN_TO_HE_MAP[lower];
    if (/[\u0590-\u05FF]/.test(mapped)) {
      return mapped;
    }
  }
  if (/[\u0590-\u05FF]/.test(char)) {
    return char;
  }
  return null;
}

// Compare letters while optionally tolerating final forms (sofiot)
export function lettersMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const finalsMap: Record<string, string> = {
    'כ': 'ך', 'ך': 'כ',
    'מ': 'ם', 'ם': 'מ',
    'נ': 'ן', 'ן': 'נ',
    'פ': 'ף', 'ף': 'פ',
    'צ': 'ץ', 'ץ': 'צ'
  };
  return finalsMap[a] === b;
}
