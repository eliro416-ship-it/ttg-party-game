import { CardItem } from '../types/game';

export interface StaticCardItem {
  id: string;
  word: string;
  category: string;
  gender: 'זכר' | 'נקבה';
  imageUrl: string;
}

// 1. Static Closed Repository strictly as specified with tested, direct Unsplash URLs
export const GAME_CARDS: CardItem[] = [
  // חיות
  {
    id: 'c1',
    word: 'גמל',
    word_he: 'גמל',
    word_en: 'CAMEL',
    wordEn: 'CAMEL',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('גמל', 'חיות', '🐪'),
    hint: 'ספינת המדבר בעלת דבשת שמותאמת לתנאי יובש',
    hint_en: 'Desert animal with humps',
    hintEn: 'Desert animal with humps',
  },
  {
    id: 'c2',
    word: 'כלב',
    word_he: 'כלב',
    word_en: 'DOG',
    wordEn: 'DOG',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('כלב', 'חיות', '🐶'),
    hint: 'חברו הטוב ביותר של האדם, נובח ומכשכש בזנב',
    hint_en: 'Man best friend that barks and wags tail',
    hintEn: 'Man best friend that barks and wags tail',
  },
  {
    id: 'c3',
    word: 'חתול',
    word_he: 'חתול',
    word_en: 'CAT',
    wordEn: 'CAT',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('חתול', 'חיות', '🐱'),
    hint: 'חיית מחמד פרוותית שמגרגרת וצדה עכברים',
    hint_en: 'Furry pet that purrs and catches mice',
    hintEn: 'Furry pet that purrs and catches mice',
  },
  {
    id: 'c4',
    word: 'אריה',
    word_he: 'אריה',
    word_en: 'LION',
    wordEn: 'LION',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('אריה', 'חיות', '🦁'),
    hint: 'מלך החיות בעל רעמה גדולה ושואג בסוואנה',
    hint_en: 'King of beasts with a thick mane and roar',
    hintEn: 'King of beasts with a thick mane and roar',
  },
  {
    id: 'c5',
    word: 'זאב',
    word_he: 'זאב',
    word_en: 'WOLF',
    wordEn: 'WOLF',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1564865878688-9a244444042a?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('זאב', 'חיות', '🐺'),
    hint: 'טורף יער שחי בלהקה ונובח אל הירח',
    hint_en: 'Wild canine predator that howls at the moon',
    hintEn: 'Wild canine predator that howls at the moon',
  },
  {
    id: 'c6',
    word: 'צב',
    word_he: 'צב',
    word_en: 'TURTLE',
    wordEn: 'TURTLE',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('צב', 'חיות', '🐢'),
    hint: 'זוחל איטי עם שריון מגן קשיח על גבו',
    hint_en: 'Slow reptile with a hard protective shell',
    hintEn: 'Slow reptile with a hard protective shell',
  },
  {
    id: 'c7',
    word: 'פיל',
    word_he: 'פיל',
    word_en: 'ELEPHANT',
    wordEn: 'ELEPHANT',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('פיל', 'חיות', '🐘'),
    hint: 'היונק היבשתי הגדול בעולם עם חדק ארוך וחטים',
    hint_en: 'Largest land mammal with a long trunk',
    hintEn: 'Largest land mammal with a long trunk',
  },
  {
    id: 'c-tiger',
    word: 'נמר',
    word_he: 'נמר',
    word_en: 'TIGER',
    wordEn: 'TIGER',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=600&q=80',
    fallback: generateCardFallback('נמר', 'חיות', '🐅'),
    hint: 'טורף ממשפחת החתוליים בעל פסים שחורים ופרווה כתומה',
    hint_en: 'Striped feline predator of the jungle',
    hintEn: 'Striped feline predator of the jungle',
  },
  {
    id: 'c8',
    word: 'סוס',
    word_he: 'סוס',
    word_en: 'HORSE',
    wordEn: 'HORSE',
    category: 'חיות',
    category_en: 'Animals',
    categoryEn: 'Animals',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1534773728080-33d31da27ae5?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1534773728080-33d31da27ae5?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('סוס', 'חיות', '🐴'),
    hint: 'חיה אצילית ומהירה עם פרסות ורעמה שרוכבים עליה',
    hint_en: 'Noble galloping animal with hooves and mane',
    hintEn: 'Noble galloping animal with hooves and mane',
  },

  // מקצועות
  {
    id: 'c9',
    word: 'טייס',
    word_he: 'טייס',
    word_en: 'PILOT',
    wordEn: 'PILOT',
    category: 'מקצועות',
    category_en: 'Professions',
    categoryEn: 'Professions',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('טייס', 'מקצועות', '👨‍✈️'),
    hint: 'מטיס כלי טיס ומטוסים בשמיים',
    hint_en: 'Trained aviator licensed to operate an aircraft',
    hintEn: 'Trained aviator licensed to operate an aircraft',
  },
  {
    id: 'c10',
    word: 'רופא',
    word_he: 'רופא',
    word_en: 'DOCTOR',
    wordEn: 'DOCTOR',
    category: 'מקצועות',
    category_en: 'Professions',
    categoryEn: 'Professions',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('רופא', 'מקצועות', '👨‍⚕️'),
    hint: 'איש מקצוע מוסמך המרפא חולים ובודק בריאות',
    hint_en: 'Medical professional treating patients',
    hintEn: 'Medical professional treating patients',
  },
  {
    id: 'c11',
    word: 'כבאי',
    word_he: 'כבאי',
    word_en: 'FIREFIGHTER',
    wordEn: 'FIREFIGHTER',
    category: 'מקצועות',
    category_en: 'Professions',
    categoryEn: 'Professions',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('כבאי', 'מקצועות', '👨‍🚒'),
    hint: 'מחלץ לכודים ומכבה שריפות בעזרת זרנוקי מים',
    hint_en: 'Emergency rescuer trained in extinguishing fires',
    hintEn: 'Emergency rescuer trained in extinguishing fires',
  },
  {
    id: 'c12',
    word: 'שוטר',
    word_he: 'שוטר',
    word_en: 'POLICE',
    wordEn: 'POLICE',
    category: 'מקצועות',
    category_en: 'Professions',
    categoryEn: 'Professions',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('שוטר', 'מקצועות', '👮'),
    hint: 'שומר על החוק והסדר ומגן על האזרחים',
    hint_en: 'Law enforcement officer protecting order',
    hintEn: 'Law enforcement officer protecting order',
  },
  {
    id: 'c13',
    word: 'טבח',
    word_he: 'טבח',
    word_en: 'CHEF',
    wordEn: 'CHEF',
    category: 'מקצועות',
    category_en: 'Professions',
    categoryEn: 'Professions',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('טבח', 'מקצועות', '👨‍🍳'),
    hint: 'טבח מקצועי ומיומן המכין מנות גורמה במסעדה',
    hint_en: 'Professional cook preparing delicious meals',
    hintEn: 'Professional cook preparing delicious meals',
  },

  // מאכלים
  {
    id: 'c14',
    word: 'פיצה',
    word_he: 'פיצה',
    word_en: 'PIZZA',
    wordEn: 'PIZZA',
    category: 'מאכלים',
    category_en: 'Food',
    categoryEn: 'Food',
    gender: 'נקבה',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('פיצה', 'מאכלים', '🍕'),
    hint: 'בצק עגול אפוי עם גבינה מותכת ורוטב עגבניות',
    hint_en: 'Baked dough with tomato sauce and cheese',
    hintEn: 'Baked dough with tomato sauce and cheese',
  },
  {
    id: 'c15',
    word: 'תפוח',
    word_he: 'תפוח',
    word_en: 'APPLE',
    wordEn: 'APPLE',
    category: 'מאכלים',
    category_en: 'Food',
    categoryEn: 'Food',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('תפוח', 'מאכלים', '🍎'),
    hint: 'פרי עגול ומתוק, אדום או ירוק, שצומח על עץ',
    hint_en: 'Crisp round fruit that can be red or green',
    hintEn: 'Crisp round fruit that can be red or green',
  },
  {
    id: 'c16',
    word: 'המבורגר',
    word_he: 'המבורגר',
    word_en: 'BURGER',
    wordEn: 'BURGER',
    category: 'מאכלים',
    category_en: 'Food',
    categoryEn: 'Food',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('המבורגר', 'מאכלים', '🍔'),
    hint: 'קציצה עסיסית בתוך לחמנייה עגולה עם חסה ועגבנייה',
    hint_en: 'Beef patty in a round bun with lettuce',
    hintEn: 'Beef patty in a round bun with lettuce',
  },

  // חפצים
  {
    id: 'c17',
    word: 'שעון',
    word_he: 'שעון',
    word_en: 'WATCH',
    wordEn: 'WATCH',
    category: 'חפצים',
    category_en: 'Objects',
    categoryEn: 'Objects',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('שעון', 'חפצים', '⌚'),
    hint: 'מכשיר המודד ומציג את שעות היום, על היד או הקיר',
    hint_en: 'Timepiece worn on wrist or hung on wall',
    hintEn: 'Timepiece worn on wrist or hung on wall',
  },
  {
    id: 'c18',
    word: 'גיטרה',
    word_he: 'גיטרה',
    word_en: 'GUITAR',
    wordEn: 'GUITAR',
    category: 'חפצים',
    category_en: 'Objects',
    categoryEn: 'Objects',
    gender: 'נקבה',
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('גיטרה', 'חפצים', '🎸'),
    hint: 'כלי נגינה בעל שישה מיתרים ותיבת תהודה',
    hint_en: 'Stringed musical instrument with six strings',
    hintEn: 'Stringed musical instrument with six strings',
  },
  {
    id: 'c19',
    word: 'ספר',
    word_he: 'ספר',
    word_en: 'BOOK',
    wordEn: 'BOOK',
    category: 'חפצים',
    category_en: 'Objects',
    categoryEn: 'Objects',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('ספר', 'חפצים', '📖'),
    hint: 'דפים כתובים או מודפסים הכרוכים יחד לקריאה',
    hint_en: 'Bound pages of printed text for reading',
    hintEn: 'Bound pages of printed text for reading',
  },
  {
    id: 'c20',
    word: 'מפתח',
    word_he: 'מפתח',
    word_en: 'KEY',
    wordEn: 'KEY',
    category: 'חפצים',
    category_en: 'Objects',
    categoryEn: 'Objects',
    gender: 'זכר',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    fallback: generateCardFallback('מפתח', 'חפצים', '🔑'),
    hint: 'חפץ מתכתי המשמש לפתיחה ונעילה של מנעולים ודלתות',
    hint_en: 'Metal tool used to lock and unlock doors',
    hintEn: 'Metal tool used to lock and unlock doors',
  },
];

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
