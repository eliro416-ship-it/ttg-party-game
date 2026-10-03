import { CardItem } from '../types/game';
import { ALL_GAME_CARDS, ALL_PACKS, GAME_CARDS, generateCardFallback } from './cards';

export interface CardPack {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  price: number;
  priceDisplay: string;
  cardCount: number;
  icon: string;
  cards: CardItem[];
  isUnlocked: boolean;
  isFree?: boolean;
}

const STORAGE_KEY = 'unlocked_packs';

// Partition GAME_CARDS by packId
const STARTER_CARDS = GAME_CARDS.filter((c) => {
  const raw = ALL_GAME_CARDS.find((x) => x.id === c.id);
  return raw?.packId === 'starter_free';
});

const ANIMALS_PRO_CARDS = GAME_CARDS.filter((c) => {
  const raw = ALL_GAME_CARDS.find((x) => x.id === c.id);
  return raw?.packId === 'animals_pro';
});

const FOOD_AND_FUN_CARDS = GAME_CARDS.filter((c) => {
  const raw = ALL_GAME_CARDS.find((x) => x.id === c.id);
  return raw?.packId === 'food_and_fun';
});

export const RAW_PACKS_METADATA: Omit<CardPack, 'isUnlocked'>[] = [
  {
    id: 'starter_free',
    title: 'חבילת בסיס חינם',
    subtitle: '10 קלפי יסוד מאומתים ומגוונים לכל המשפחה',
    badge: 'חינם לתמיד 🎁',
    price: 0,
    priceDisplay: 'חינם',
    cardCount: STARTER_CARDS.length,
    icon: '🎁',
    isFree: true,
    cards: STARTER_CARDS
  },
  {
    id: 'animals_pro',
    title: 'עולם החיות המורחב',
    subtitle: '10 חיות בר וים מרהיבות מרחבי הגלובוס באיכות HD',
    badge: 'פופולרי 🦁',
    price: 7.90,
    priceDisplay: '₪7.90',
    cardCount: ANIMALS_PRO_CARDS.length,
    icon: '🦁',
    isFree: false,
    cards: ANIMALS_PRO_CARDS
  },
  {
    id: 'food_and_fun',
    title: 'מאכלים וחפצים',
    subtitle: '10 מאכלים אהובים וחפצים מובילים ומפתיעים',
    badge: 'טעים ומרתק 🍕',
    price: 7.90,
    priceDisplay: '₪7.90',
    cardCount: FOOD_AND_FUN_CARDS.length,
    icon: '🍕',
    isFree: false,
    cards: FOOD_AND_FUN_CARDS
  },
  {
    id: 'pack_vip',
    title: 'מגה פאק VIP - כל 30 הקלפים',
    subtitle: 'כל החבילות פתוחות לתמיד במחיר מיוחד!',
    badge: 'המשתלם ביותר 🔥',
    price: 12.90,
    priceDisplay: '₪12.90',
    cardCount: GAME_CARDS.length,
    icon: '👑',
    isFree: false,
    cards: GAME_CARDS
  }
];

// Read unlocked pack IDs from localStorage
export function getUnlockedPackIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ['starter_free'];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      if (!parsed.includes('starter_free')) parsed.unshift('starter_free');
      return parsed;
    }
  } catch {
    // fallback
  }
  return ['starter_free'];
}

// Unlock a specific pack ID and persist to localStorage
export function unlockPack(packId: string): string[] {
  const current = getUnlockedPackIds();
  const next = new Set(current);
  next.add(packId);

  // If VIP Mega pack is purchased, unlock all packs automatically!
  if (packId === 'pack_vip') {
    next.add('starter_free');
    next.add('animals_pro');
    next.add('food_and_fun');
    next.add('pack_vip');
  }

  const updated = Array.from(next);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // LocalStorage quota or blocked
  }
  return updated;
}

// Check if a pack is unlocked
export function isPackUnlocked(packId: string): boolean {
  const unlocked = getUnlockedPackIds();
  if (unlocked.includes('pack_vip')) return true;
  return unlocked.includes(packId);
}

// Return all packs populated with current unlock status
export function getAllPacks(): CardPack[] {
  const unlocked = getUnlockedPackIds();
  const isVipUnlocked = unlocked.includes('pack_vip');

  return RAW_PACKS_METADATA.map((p) => ({
    ...p,
    isUnlocked: isVipUnlocked || unlocked.includes(p.id)
  }));
}

// Aggregates all unique active cards from currently unlocked packs
export function getActiveUnlockedCards(): CardItem[] {
  const packs = getAllPacks();
  const cardMap = new Map<string, CardItem>();

  for (const pack of packs) {
    if (pack.isUnlocked) {
      for (const card of pack.cards) {
        if (!cardMap.has(card.word)) {
          cardMap.set(card.word, card);
        }
      }
    }
  }

  const result = Array.from(cardMap.values());
  // If for any reason empty, return starter cards
  return result.length > 0 ? result : STARTER_CARDS;
}

// Reset unlocked packs for testing/restoring defaults
export function resetPacks(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['starter_free']));
  } catch {
    // ignore
  }
}
