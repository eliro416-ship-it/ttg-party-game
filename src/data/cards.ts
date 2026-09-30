import { CardItem } from "../types/game";
import rawCardsData from "./cardsData.json";

export interface RawCardData {
  id: number;
  word: string;
  category: string;
  gender: string;
  imageUrl: string;
}

export const CARDS_DATA: RawCardData[] = rawCardsData as RawCardData[];

export function generateCardFallback(word: string, category: string, emoji: string, colorStart = "#4f46e5", colorEnd = "#7c3aed"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${colorStart}"/>
        <stop offset="100%" stop-color="${colorEnd}"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.35"/>
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

export function shuffleDeck<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const CATEGORIES = [
  "הכל",
  "חיות",
  "אוכל",
  "חפצים",
  "מקצועות",
  "ספורט"
];

const CARD_META: Record<string, { en: string; catEn: string; emoji: string; hintHe: string; hintEn: string }> = {
  "צב": {
    "en": "TURTLE",
    "catEn": "Animals",
    "emoji": "🐢",
    "hintHe": "זוחל איטי עם שריון מגן קשיח",
    "hintEn": "Slow reptile with a hard protective shell"
  },
  "זאב": {
    "en": "WOLF",
    "catEn": "Animals",
    "emoji": "🐺",
    "hintHe": "טורף יער שחי בלהקה ונובח אל הירח",
    "hintEn": "Wild canine predator that howls at the moon"
  },
  "כלב": {
    "en": "DOG",
    "catEn": "Animals",
    "emoji": "🐶",
    "hintHe": "חברו הטוב ביותר של האדם, נובח ומכשכש בזנב",
    "hintEn": "Man best friend that barks and wags tail"
  },
  "נמר": {
    "en": "LEOPARD",
    "catEn": "Animals",
    "emoji": "🐆",
    "hintHe": "חתול בר מנומר ומהיר שמטפס על עצים",
    "hintEn": "Spotted wild cat known for agility and tree climbing"
  },
  "אריה": {
    "en": "LION",
    "catEn": "Animals",
    "emoji": "🦁",
    "hintHe": "מלך החיות בעל רעמה גדולה ושואג בסוואנה",
    "hintEn": "King of beasts with a thick mane and loud roar"
  },
  "חתול": {
    "en": "CAT",
    "catEn": "Animals",
    "emoji": "🐱",
    "hintHe": "חיית מחמד פרוותית שמגרגרת וצדה עכברים",
    "hintEn": "Furry pet that purrs and catches mice"
  },
  "דוב": {
    "en": "BEAR",
    "catEn": "Animals",
    "emoji": "🐻",
    "hintHe": "יונק גדול וחזק שאוהב דבש וישן שנת חורף",
    "hintEn": "Large mammal that loves honey and hibernates"
  },
  "פיל": {
    "en": "ELEPHANT",
    "catEn": "Animals",
    "emoji": "🐘",
    "hintHe": "היונק היבשתי הגדול בעולם עם חדק ארוך",
    "hintEn": "Largest land mammal with a long flexible trunk"
  },
  "סוס": {
    "en": "HORSE",
    "catEn": "Animals",
    "emoji": "🐴",
    "hintHe": "חיה אצילית ומהירה עם פרסות ורעמה שרוכבים עליה",
    "hintEn": "Noble galloping animal with hooves and mane"
  },
  "גמל": {
    "en": "CAMEL",
    "catEn": "Animals",
    "emoji": "🐪",
    "hintHe": "ספינת המדבר בעל דבשת אחת או שתיים",
    "hintEn": "Ship of the desert with humps that stores fat"
  },
  "גירפה": {
    "en": "GIRAFFE",
    "catEn": "Animals",
    "emoji": "🦒",
    "hintHe": "החיה הגבוהה בעולם עם צוואר ארוך שמגיעה לענפי עצים",
    "hintEn": "Tallest mammal on earth with a very long neck"
  },
  "קוף": {
    "en": "MONKEY",
    "catEn": "Animals",
    "emoji": "🐵",
    "hintHe": "אוהב לקפוץ בין עצים ולאכול בננות",
    "hintEn": "Agile primate that swings through branches and eats fruit"
  },
  "זברה": {
    "en": "ZEBRA",
    "catEn": "Animals",
    "emoji": "🦓",
    "hintHe": "קרובת משפחה של הסוס עם פסים שחורים ולבנים",
    "hintEn": "Equine mammal with black and white stripes"
  },
  "דולפין": {
    "en": "DOLPHIN",
    "catEn": "Animals",
    "emoji": "🐬",
    "hintHe": "יונק ימי חכם במיוחד שאוהב לקפוץ מעל המים",
    "hintEn": "Highly intelligent marine mammal that leaps above waves"
  },
  "שועל": {
    "en": "FOX",
    "catEn": "Animals",
    "emoji": "🦊",
    "hintHe": "טורף קטן וחכם עם פרווה כתומה וזנב עבות",
    "hintEn": "Clever wild canine with bushy tail and reddish fur"
  },
  "פינגווין": {
    "en": "PENGUIN",
    "catEn": "Animals",
    "emoji": "🐧",
    "hintHe": "עוף ימי שחור-לבן שלא עף אבל שוחה מצוין בקרח",
    "hintEn": "Flightless aquatic bird suited for icy waters"
  },
  "ארנב": {
    "en": "RABBIT",
    "catEn": "Animals",
    "emoji": "🐰",
    "hintHe": "חיה קטנה עם אוזניים ארוכות שאוהבת גזר",
    "hintEn": "Small fluffy animal with long ears that hops"
  },
  "ינשוף": {
    "en": "OWL",
    "catEn": "Animals",
    "emoji": "🦉",
    "hintHe": "ציפור לילה חכמה עם עיניים גדולות שמסתובבת 270 מעלות",
    "hintEn": "Nocturnal bird of prey with large eyes and silent flight"
  },
  "פנדה": {
    "en": "PANDA",
    "catEn": "Animals",
    "emoji": "🐼",
    "hintHe": "דוב שחור ולבן מסין שאוהב לאכול במבוק",
    "hintEn": "Black and white bear from China that loves eating bamboo"
  },
  "פיצה": {
    "en": "PIZZA",
    "catEn": "Food",
    "emoji": "🍕",
    "hintHe": "בצק עגול אפוי עם גבינה מותכת ורוטב עגבניות",
    "hintEn": "Baked dough with tomato sauce and melted cheese"
  },
  "המבורגר": {
    "en": "BURGER",
    "catEn": "Food",
    "emoji": "🍔",
    "hintHe": "קציצה עסיסית בתוך לחמנייה עגולה עם חסה ועגבנייה",
    "hintEn": "Beef patty in a sesame bun with lettuce and tomato"
  },
  "תפוח": {
    "en": "APPLE",
    "catEn": "Food",
    "emoji": "🍎",
    "hintHe": "פרי עגול ומתוק, אדום או ירוק, שצומח על עץ",
    "hintEn": "Crisp round fruit that can be red, green, or yellow"
  },
  "בננה": {
    "en": "BANANA",
    "catEn": "Food",
    "emoji": "🍌",
    "hintHe": "פרי צהוב ומעוקל שקולפים לפני שאוכלים",
    "hintEn": "Curved yellow fruit rich in potassium that you peel"
  },
  "אבטיח": {
    "en": "WATERMELON",
    "catEn": "Food",
    "emoji": "🍉",
    "hintHe": "פרי קיץ ענק, ירוק מבחוץ ואדום ומתוק מבפנים",
    "hintEn": "Large summer fruit with green rind and juicy red flesh"
  },
  "גלידה": {
    "en": "ICE CREAM",
    "catEn": "Food",
    "emoji": "🍦",
    "hintHe": "קינוח קפוא ומתוק בגביע או בכוס במגוון טעמים",
    "hintEn": "Sweet frozen dessert served in a cone or cup"
  },
  "שוקולד": {
    "en": "CHOCOLATE",
    "catEn": "Food",
    "emoji": "🍫",
    "hintHe": "ממתק חום ומתוק העשוי מפולי קקאו",
    "hintEn": "Sweet confectionery treat made from roasted cocoa beans"
  },
  "עוגה": {
    "en": "CAKE",
    "catEn": "Food",
    "emoji": "🎂",
    "hintHe": "מאפה מתוק וחגיגי לימי הולדת שמקשטים בנרות",
    "hintEn": "Sweet baked dessert topped with frosting for celebrations"
  },
  "סושי": {
    "en": "SUSHI",
    "catEn": "Food",
    "emoji": "🍣",
    "hintHe": "מאכל יפני מסורתי של אורז עטוף באצה ודג נא",
    "hintEn": "Japanese dish of seasoned rice rolled with fish and nori"
  },
  "פסטה": {
    "en": "PASTA",
    "catEn": "Food",
    "emoji": "🍝",
    "hintHe": "אטריות מבושלות מקמח חיטה ברוטב עגבניות או שמנת",
    "hintEn": "Italian noodles served with tomato sauce or cream"
  },
  "תות": {
    "en": "STRAWBERRY",
    "catEn": "Food",
    "emoji": "🍓",
    "hintHe": "פרי יער אדום ומתוק בצורת לב עם גרגרים קטנים",
    "hintEn": "Bright red sweet berry with external tiny seeds"
  },
  "קפה": {
    "en": "COFFEE",
    "catEn": "Food",
    "emoji": "☕",
    "hintHe": "משקה חם ומעורר העשוי מפולים קלויים",
    "hintEn": "Brewed hot beverage from roasted coffee beans"
  },
  "גיטרה": {
    "en": "GUITAR",
    "catEn": "Objects",
    "emoji": "🎸",
    "hintHe": "כלי נגינה בעל שישה מיתרים ותיבת תהודה",
    "hintEn": "Stringed musical instrument played with fingers or pick"
  },
  "שעון": {
    "en": "WATCH",
    "catEn": "Objects",
    "emoji": "⌚",
    "hintHe": "מכשיר המודד ומציג את שעות היום, על היד או הקיר",
    "hintEn": "Timepiece worn on wrist or hung on wall"
  },
  "טלפון": {
    "en": "PHONE",
    "catEn": "Objects",
    "emoji": "📱",
    "hintHe": "מכשיר אלקטרוני חכם לשיחות, הודעות וגלישה",
    "hintEn": "Handheld electronic device for calls and apps"
  },
  "ספר": {
    "en": "BOOK",
    "catEn": "Objects",
    "emoji": "📖",
    "hintHe": "דפים כתובים או מודפסים הכרוכים יחד לקריאה",
    "hintEn": "Bound set of printed pages for reading and learning"
  },
  "מפתח": {
    "en": "KEY",
    "catEn": "Objects",
    "emoji": "🔑",
    "hintHe": "חפץ מתכתי המשמש לפתיחה ונעילה של מנעולים ודלתות",
    "hintEn": "Metal tool used to lock and unlock doors"
  },
  "מצלמה": {
    "en": "CAMERA",
    "catEn": "Objects",
    "emoji": "📷",
    "hintHe": "מכשיר אופטי ללכידת תמונות סטילס ווידאו",
    "hintEn": "Optical device used for capturing photos and videos"
  },
  "מנורה": {
    "en": "LAMP",
    "catEn": "Objects",
    "emoji": "💡",
    "hintHe": "מכשיר חשמלי המפיץ אור בחדר",
    "hintEn": "Electrical lighting device that brightens a room"
  },
  "כיסא": {
    "en": "CHAIR",
    "catEn": "Objects",
    "emoji": "🪑",
    "hintHe": "רהיט המיועד לישיבה של אדם אחד עם משענת",
    "hintEn": "Piece of furniture with a backrest designed for sitting"
  },
  "משקפיים": {
    "en": "GLASSES",
    "catEn": "Objects",
    "emoji": "👓",
    "hintHe": "שתי עדשות במסגרת המונחות על האף לשיפור הראייה",
    "hintEn": "Eyewear with two lenses worn to improve vision"
  },
  "כדור": {
    "en": "BALL",
    "catEn": "Objects",
    "emoji": "⚽",
    "hintHe": "חפץ עגול המשמש למשחקי ספורט כמו כדורגל וכדורסל",
    "hintEn": "Round sphere used in sports and games"
  },
  "רופא": {
    "en": "DOCTOR",
    "catEn": "Professions",
    "emoji": "👨‍⚕️",
    "hintHe": "איש מקצוע מוסמך המרפא חולים ובודק בריאות",
    "hintEn": "Medical professional licensed to treat sick patients"
  },
  "טייס": {
    "en": "PILOT",
    "catEn": "Professions",
    "emoji": "👨‍✈️",
    "hintHe": "מטיס כלי טיס ומטוסים בשמיים מתחנה לתחנה",
    "hintEn": "Trained aviator licensed to operate an aircraft"
  },
  "כבאי": {
    "en": "FIREFIGHTER",
    "catEn": "Professions",
    "emoji": "👨‍🚒",
    "hintHe": "מחלץ לכודים ומכבה שריפות בעזרת זרנוקי מים",
    "hintEn": "Emergency rescuer trained in extinguishing fires"
  },
  "שוטר": {
    "en": "POLICE",
    "catEn": "Professions",
    "emoji": "👮",
    "hintHe": "שומר על החוק והסדר ומגן על האזרחים",
    "hintEn": "Law enforcement officer protecting public safety"
  },
  "שף": {
    "en": "CHEF",
    "catEn": "Professions",
    "emoji": "👨‍🍳",
    "hintHe": "טבח מקצועי ומיומן המכין מנות גורמה במסעדה",
    "hintEn": "Culinary professional skilled in gourmet food cooking"
  },
  "מורה": {
    "en": "TEACHER",
    "catEn": "Professions",
    "emoji": "👩‍🏫",
    "hintHe": "מלמדת ומחנכת תלמידים בבית ספר",
    "hintEn": "Educator instructing students in a classroom"
  },
  "צייר": {
    "en": "PAINTER",
    "catEn": "Professions",
    "emoji": "🎨",
    "hintHe": "אמן היוצר תמונות וציורים באמצעות מכחול וצבעים",
    "hintEn": "Artist creating visual artwork using brushes and pigments"
  },
  "אסטרונאוט": {
    "en": "ASTRONAUT",
    "catEn": "Professions",
    "emoji": "👨‍🚀",
    "hintHe": "אדם שטס בחללית לחלל החיצון ולתחנת החלל",
    "hintEn": "Space explorer trained to travel into outer space"
  }
};

export const DEFAULT_CARDS: CardItem[] = CARDS_DATA.map((card) => {
  const meta = CARD_META[card.word] || {
    en: card.word.toUpperCase(),
    catEn: card.category,
    emoji: "🃏",
    hintHe: `נחשו את המילה בקטגוריית ${card.category}`,
    hintEn: `Guess the word in ${card.category} category`
  };

  return {
    id: String(card.id),
    word: card.word,
    word_he: card.word,
    word_en: meta.en,
    wordEn: meta.en,
    category: card.category,
    category_en: meta.catEn,
    categoryEn: meta.catEn,
    gender: card.gender,
    image: card.imageUrl,
    imageUrl: card.imageUrl,
    fallback: generateCardFallback(card.word, card.category, meta.emoji),
    hint: meta.hintHe,
    hint_en: meta.hintEn,
    hintEn: meta.hintEn
  };
});
