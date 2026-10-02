import { CardItem } from '../types/game';

export interface StaticCardItem {
  id: string;
  word: string;
  category: string;
  gender: 'זכר' | 'נקבה';
  imageUrl: string;
}

// 1. Static Closed Repository strictly as specified with verified, direct Unsplash URLs
// Single Source of Truth
export const STATIC_CARDS = [
  { id: '1', word: 'כלב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80' },
  { id: '2', word: 'חתול', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
  { id: '3', word: 'אריה', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1614027164847-1b28caa1401f?auto=format&fit=crop&w=600&q=80' },
  { id: '4', word: 'פיל', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=600&q=80' },
  { id: '5', word: 'צב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=600&q=80' },
  { id: '6', word: 'זאב', category: 'חיות', imageUrl: 'https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&w=600&q=80' },
  { id: '7', word: 'טייס', category: 'מקצועות', imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80' },
  { id: '8', word: 'כבאי', category: 'מקצועות', imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80' },
  { id: '9', word: 'רופא', category: 'מקצועות', imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80' },
  { id: '10', word: 'פיצה', category: 'מאכלים', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
];

export const GAME_CARDS: CardItem[] = STATIC_CARDS.map((c) => ({
  id: c.id,
  word: c.word,
  word_he: c.word,
  word_en: c.word === 'כלב' ? 'DOG' : c.word === 'חתול' ? 'CAT' : c.word === 'אריה' ? 'LION' : c.word === 'פיל' ? 'ELEPHANT' : c.word === 'צב' ? 'TURTLE' : c.word === 'זאב' ? 'WOLF' : c.word === 'טייס' ? 'PILOT' : c.word === 'כבאי' ? 'FIREFIGHTER' : c.word === 'רופא' ? 'DOCTOR' : 'PIZZA',
  wordEn: c.word === 'כלב' ? 'DOG' : c.word === 'חתול' ? 'CAT' : c.word === 'אריה' ? 'LION' : c.word === 'פיל' ? 'ELEPHANT' : c.word === 'צב' ? 'TURTLE' : c.word === 'זאב' ? 'WOLF' : c.word === 'טייס' ? 'PILOT' : c.word === 'כבאי' ? 'FIREFIGHTER' : c.word === 'רופא' ? 'DOCTOR' : 'PIZZA',
  category: c.category,
  category_en: c.category === 'חיות' ? 'Animals' : c.category === 'מקצועות' ? 'Professions' : 'Food',
  categoryEn: c.category === 'חיות' ? 'Animals' : c.category === 'מקצועות' ? 'Professions' : 'Food',
  image: c.imageUrl,
  imageUrl: c.imageUrl,
  fallback: generateCardFallback(c.word, c.category, c.word === 'כלב' ? '🐶' : c.word === 'חתול' ? '🐱' : c.word === 'אריה' ? '🦁' : c.word === 'פיל' ? '🐘' : c.word === 'צב' ? '🐢' : c.word === 'זאב' ? '🐺' : c.word === 'טייס' ? '👨‍✈️' : c.word === 'כבאי' ? '👨‍🚒' : c.word === 'רופא' ? '👨‍⚕️' : '🍕'),
}));

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
