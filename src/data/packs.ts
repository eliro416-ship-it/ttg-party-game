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
    const hasClaimedBonus = typeof localStorage !== 'undefined' && localStorage.getItem('ttg_bonus_claimed') === 'true';
    if (hasClaimedBonus) {
      return ['starter_free', 'animals_pro'];
    }
  } catch {
    // fallback
  }
  return ['starter_free'];
}

// Unlock a specific pack ID and persist to localStorage
export function unlockPack(packId: string): string[] {
  try {
    localStorage.setItem('ttg_bonus_claimed', 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['starter_free', 'animals_pro']));
  } catch {
    // LocalStorage quota or blocked
  }
  return ['starter_free', 'animals_pro'];
}

// Check if a pack is unlocked
export function isPackUnlocked(packId: string): boolean {
  const unlocked = getUnlockedPackIds();
  return unlocked.includes(packId);
}

// Return all packs populated with current unlock status (strictly max 20 cards)
export function getAllPacks(): CardPack[] {
  const unlocked = getUnlockedPackIds();

  return RAW_PACKS_METADATA.map((p) => ({
    ...p,
    isUnlocked: unlocked.includes(p.id)
  }));
}

// Aggregates all unique active cards from currently unlocked packs
export function getActiveUnlockedCards(): CardItem[] {
  const hasClaimed = typeof localStorage !== 'undefined' && localStorage.getItem('ttg_bonus_claimed') === 'true';
  return hasClaimed ? GAME_CARDS.slice(0, 20) : GAME_CARDS.slice(0, 10);
}

// Reset unlocked packs for testing/restoring defaults
export function resetPacks(): void {
  try {
    localStorage.removeItem('ttg_bonus_claimed');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['starter_free']));
  } catch {
    // ignore
  }
}
