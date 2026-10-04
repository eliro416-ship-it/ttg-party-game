import { CardItem } from '../types/game';

export interface StaticCardItem {
  id: string;
  packId: 'starter_free' | 'animals_pro' | 'food_and_fun';
  word: string;
  category: string;
  imageUrl: string;
}

export interface PackMetadata {
  id: 'starter_free' | 'animals_pro' | 'food_and_fun';
  title: string;
  price: string;
  icon: string;
  isFree: boolean;
}

// 1. Definition of Packs
export const ALL_PACKS: PackMetadata[] = [
  { id: 'starter_free', title: 'חבילת בסיס חינם', price: 'חינם', icon: '🎁', isFree: true },
  { id: 'animals_pro', title: 'עולם החיות המורחב', price: '₪7.90', icon: '🦁', isFree: false },
  { id: 'food_and_fun', title: 'מאכלים וחפצים', price: '₪7.90', icon: '🍕', isFree: false }
];

// 2. Complete 30 Verified Cards (100% verified direct Unsplash URLs)
export const ALL_GAME_CARDS: StaticCardItem[] = [
  // --- חבילת בסיס חינמית (10 קלפים מאומתים) ---
  { id: 'f1', packId: 'starter_free', word: 'צב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&auto=format&fit=crop&q=80' },
  { id: 'f2', packId: 'starter_free', word: 'אריה', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&auto=format&fit=crop&q=80' },
  { id: 'f3', packId: 'starter_free', word: 'פיל', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&auto=format&fit=crop&q=80' },
  { id: 'f4', packId: 'starter_free', word: 'כלב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80' },
  { id: 'f5', packId: 'starter_free', word: 'חתול', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80' },
  { id: 'f6', packId: 'starter_free', word: 'רופא', category: 'מקצועות', imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80' },
  { id: 'f7', packId: 'starter_free', word: 'פיצה', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { id: 'f8', packId: 'starter_free', word: 'המבורגר', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { id: 'f9', packId: 'starter_free', word: 'תפוח', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80' },
  { id: 'f10', packId: 'starter_free', word: 'גיטרה', category: 'חפצים', imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600&auto=format&fit=crop&q=80' },

  // --- חבילת פרימיום 1: עולם החיות (10 קלפים נוספים) ---
  { id: 'a_panda', packId: 'animals_pro', word: 'פנדה', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=600&auto=format&fit=crop&q=80' },
  { id: 'a2', packId: 'animals_pro', word: 'נמר', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&auto=format&fit=crop&q=80' },
  { id: 'a3', packId: 'animals_pro', word: 'דוב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80' },
  { id: 'a4', packId: 'animals_pro', word: 'קוף', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=600&auto=format&fit=crop&q=80' },
  { id: 'a5', packId: 'animals_pro', word: 'זברה', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?auto=format&fit=crop&w=600&q=80' },
  { id: 'a6', packId: 'animals_pro', word: 'דולפין', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=600&auto=format&fit=crop&q=80' },
  { id: 'a7', packId: 'animals_pro', word: 'גירפה', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=600&auto=format&fit=crop&q=80' },
  { id: 'a8', packId: 'animals_pro', word: 'פינגווין', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=600&auto=format&fit=crop&q=80' },
  { id: 'a_rabbit', packId: 'animals_pro', word: 'ארנב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=80' },
  { id: 'a10', packId: 'animals_pro', word: 'שועל', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=600&auto=format&fit=crop&q=80' },

  // --- חבילת פרימיום 2: מאכלים וחפצים (10 קלפים נוספים) ---
  { id: 'm1', packId: 'food_and_fun', word: 'גלידה', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=600&auto=format&fit=crop&q=80' },
  { id: 'm2', packId: 'food_and_fun', word: 'בננה', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80' },
  { id: 'm3', packId: 'food_and_fun', word: 'סושי', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80' },
  { id: 'm4', packId: 'food_and_fun', word: 'עוגה', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80' },
  { id: 'm5', packId: 'food_and_fun', word: 'אבטיח', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80' },
  { id: 'm6', packId: 'food_and_fun', word: 'תות', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80' },
  { id: 'm7', packId: 'food_and_fun', word: 'שעון', category: 'חפצים', imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80' },
  { id: 'm8', packId: 'food_and_fun', word: 'מצלמה', category: 'חפצים', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80' },
  { id: 'm9', packId: 'food_and_fun', word: 'משקפיים', category: 'חפצים', imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80' },
  { id: 'm10', packId: 'food_and_fun', word: 'אופניים', category: 'חפצים', imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80' }
];

export const VERIFIED_CARDS = ALL_GAME_CARDS;
export const STATIC_CARDS = ALL_GAME_CARDS;
export const CARDS_POOL = ALL_GAME_CARDS;

const WORD_EN_MAP: Record<string, string> = {
  'צב': 'TURTLE',
  'אריה': 'LION',
  'פיל': 'ELEPHANT',
  'כלב': 'DOG',
  'חתול': 'CAT',
  'רופא': 'DOCTOR',
  'פיצה': 'PIZZA',
  'המבורגר': 'HAMBURGER',
  'תפוח': 'APPLE',
  'גיטרה': 'GUITAR',
  'פנדה': 'PANDA',
  'נמר': 'TIGER',
  'דוב': 'BEAR',
  'קוף': 'MONKEY',
  'זברה': 'ZEBRA',
  'דולפין': 'DOLPHIN',
  'גירפה': 'GIRAFFE',
  'פינגווין': 'PENGUIN',
  'ארנב': 'RABBIT',
  'שועל': 'FOX',
  'גלידה': 'ICE CREAM',
  'בננה': 'BANANA',
  'סושי': 'SUSHI',
  'עוגה': 'CAKE',
  'אבטיח': 'WATERMELON',
  'תות': 'STRAWBERRY',
  'שעון': 'WATCH',
  'מצלמה': 'CAMERA',
  'משקפיים': 'GLASSES',
  'אופניים': 'BICYCLE',
};

const EMOJI_MAP: Record<string, string> = {
  'צב': '🐢',
  'אריה': '🦁',
  'פיל': '🐘',
  'כלב': '🐶',
  'חתול': '🐱',
  'רופא': '👨‍⚕️',
  'פיצה': '🍕',
  'המבורגר': '🍔',
  'תפוח': '🍎',
  'גיטרה': '🎸',
  'פנדה': '🐼',
  'נמר': '🐯',
  'דוב': '🐻',
  'קוף': '🐵',
  'זברה': '🦓',
  'דולפין': '🐬',
  'גירפה': '🦒',
  'פינגווין': '🐧',
  'ארנב': '🐰',
  'שועל': '🦊',
  'גלידה': '🍦',
  'בננה': '🍌',
  'סושי': '🍣',
  'עוגה': '🎂',
  'אבטיח': '🍉',
  'תות': '🍓',
  'שעון': '⌚',
  'מצלמה': '📷',
  'משקפיים': '👓',
  'אופניים': '🚲',
};

export const GAME_CARDS: CardItem[] = ALL_GAME_CARDS.map((c) => ({
  id: c.id,
  packId: c.packId,
  word: c.word,
  word_he: c.word,
  word_en: WORD_EN_MAP[c.word] || c.word,
  wordEn: WORD_EN_MAP[c.word] || c.word,
  category: c.category,
  category_en: c.category === 'חיות' ? 'Animals' : c.category === 'מקצועות' ? 'Professions' : c.category === 'מאכלים' ? 'Food' : 'Objects',
  categoryEn: c.category === 'חיות' ? 'Animals' : c.category === 'מקצועות' ? 'Professions' : c.category === 'מאכלים' ? 'Food' : 'Objects',
  image: c.imageUrl,
  imageUrl: c.imageUrl,
  fallback: generateCardFallback(c.word, c.category, EMOJI_MAP[c.word] || '✨'),
}));

// 1. Definition of Playable Cards according to unlocked packs (strictly 10 or 20 cards)
export function getPlayableCards(unlockedPackIds: string[] = ['starter_free']): CardItem[] {
  const hasClaimed = typeof localStorage !== 'undefined' && localStorage.getItem('ttg_bonus_claimed') === 'true';
  const effectivePacks = hasClaimed ? ['starter_free', 'animals_pro'] : ['starter_free'];
  const allowedPacks = new Set(effectivePacks);

  const cards = GAME_CARDS.filter((card) => {
    const raw = ALL_GAME_CARDS.find((c) => c.id === card.id);
    return raw ? allowedPacks.has(raw.packId) : false;
  });

  return cards.slice(0, hasClaimed ? 20 : 10);
}

// 2. Random Round Card Selector
export function getRandomRoundCard(playableCards: CardItem[], usedCardIds: string[] = []): CardItem {
  const available = playableCards.filter((c) => !usedCardIds.includes(c.id));
  const pool = available.length > 0 ? available : playableCards; // איפוס במקרה שסיימו הכל
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || playableCards[0] || GAME_CARDS[0];
}

// Helper to pick a random card directly from GAME_CARDS
export function getRandomGameCard(): CardItem {
  return GAME_CARDS[Math.floor(Math.random() * GAME_CARDS.length)];
}

// Find card strictly by ID or fallback to first card
export function getGameCardById(id: string | number): CardItem {
  const strId = String(id);
  return GAME_CARDS.find((c) => String(c.id) === strId) || GAME_CARDS[0];
}

export const DEFAULT_CARDS: CardItem[] = GAME_CARDS;

// Helper to generate a high quality, responsive SVG fallback image
export function generateCardFallback(word: string, category: string, emoji: string, colorStart = '#4f46e5', colorEnd = '#7c3aed'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorStart}"/>
        <stop offset="100%" stop-color="${colorEnd}"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" stroke-width="0" stdDeviation="12" flood-opacity="0.35"/>
      </filter>
    </defs>
    <rect width="800" height="600" fill="url(#bg)"/>
    <circle cx="400" cy="270" r="130" fill="rgba(255,255,255,0.12)" filter="url(#shadow)"/>
    <text x="400" y="315" font-size="120" text-anchor="middle" dominant-baseline="central">${emoji}</text>
    <rect x="250" y="440" width="300" height="44" rx="22" fill="rgba(0,0,0,0.3)"/>
    <text x="400" y="468" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="#fbcfe8" text-anchor="middle">${category}</text>
    <text x="400" y="535" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#shadow)">${word}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Fisher-Yates Shuffle Algorithm for uniform, unbiased deck randomness
export function shuffleDeck<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const CATEGORIES = [
  'הכל',
  'חיות',
  'מאכלים',
  'מקצועות',
  'חפצים',
];
