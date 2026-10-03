import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Crown,
  ShieldCheck,
  Zap,
  CreditCard,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CardPack, getAllPacks, unlockPack, resetPacks, getUnlockedPackIds } from '../data/packs';
import { ALL_GAME_CARDS } from '../data/cards';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPacksUpdated?: () => void;
  language?: Language;
  upsellReason?: string;
}

const renderPackBadgeIcon = (packId: string) => {
  switch (packId) {
    case 'starter_free':
      return (
        <div className="w-13 h-13 p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-900/60 to-slate-950 border border-amber-400/40 shadow-[0_4px_12px_rgba(245,158,11,0.25)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">🎁</span>
        </div>
      );
    case 'animals_pro':
      return (
        <div className="w-13 h-13 p-2.5 rounded-2xl bg-gradient-to-br from-orange-500/20 via-purple-900/60 to-slate-950 border border-orange-400/40 shadow-[0_4px_12px_rgba(249,115,22,0.25)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(249,115,22,0.6)]">🦁</span>
        </div>
      );
    case 'food_and_fun':
      return (
        <div className="w-13 h-13 p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-purple-900/60 to-slate-950 border border-emerald-400/40 shadow-[0_4px_12px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">🍕</span>
        </div>
      );
    case 'pack_vip':
    default:
      return (
        <div className="w-13 h-13 p-2.5 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-purple-900/60 to-slate-950 border border-yellow-400/40 shadow-[0_4px_12px_rgba(234,179,8,0.3)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(234,179,8,0.7)]">👑</span>
        </div>
      );
  }
};

const FloatingCardsBackground: React.FC<{ opacityClass?: string }> = ({
  opacityClass = 'opacity-30',
}) => {
  const cards = [
    { id: 'f2', word: 'אריה', img: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&auto=format&fit=crop&q=80', left: '3%', duration: '24s', delay: '-3s', rot: '-5deg', size: 'w-18 h-24' },
    { id: 'f7', word: 'פיצה', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', left: '88%', duration: '28s', delay: '-14s', rot: '6deg', size: 'w-20 h-28' },
    { id: 'a6', word: 'דולפין', img: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?w=600&auto=format&fit=crop&q=80', left: '11%', duration: '30s', delay: '-8s', rot: '4deg', size: 'w-16 h-22' },
    { id: 'a_rabbit', word: 'ארנב', img: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=80', left: '80%', duration: '26s', delay: '-21s', rot: '-7deg', size: 'w-18 h-24' },
    { id: 'f1', word: 'צב', img: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=600&auto=format&fit=crop&q=80', left: '6%', duration: '32s', delay: '-17s', rot: '-3deg', size: 'w-16 h-22' },
    { id: 'f8', word: 'המבורגר', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80', left: '84%', duration: '25s', delay: '-5s', rot: '5deg', size: 'w-20 h-26' },
    { id: 'f4', word: 'כלב', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80', left: '15%', duration: '27s', delay: '-23s', rot: '3deg', size: 'w-18 h-24' },
    { id: 'a5', word: 'זברה', img: 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?auto=format&fit=crop&w=600&q=80', left: '76%', duration: '31s', delay: '-11s', rot: '-4deg', size: 'w-16 h-22' },
  ];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden z-0 select-none ${opacityClass}`}>
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(105vh);
            opacity: 0;
          }
          8% {
            opacity: 0.8;
          }
          88% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-20vh);
            opacity: 0;
          }
        }
      `}</style>

      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: card.left,
            top: 0,
            animation: `floatUp ${card.duration} linear infinite`,
            animationDelay: card.delay,
            willChange: 'transform, opacity',
          }}
        >
          <div
            style={{
              transform: `rotate(${card.rot})`,
            }}
            className={`${card.size} rounded-2xl overflow-hidden border border-amber-400/50 bg-slate-950/95 shadow-[0_8px_20px_rgba(0,0,0,0.8),0_0_12px_rgba(245,158,11,0.2)] flex flex-col`}
          >
            <img
              src={card.img}
              alt={card.word}
              crossOrigin="anonymous"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/85 text-[9px] font-black text-amber-300 text-center py-0.5 truncate px-1 border-t border-amber-500/30">
              {card.word}
            </div>
          </div>
        </div>
      ))}

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

export const StoreModal: React.FC<StoreModalProps> = ({
  isOpen,
  onClose,
  onPacksUpdated,
  language = 'he',
  upsellReason,
}) => {
  const isEn = language === 'en';
  const [packs, setPacks] = useState<CardPack[]>([]);
  const [inspectingPack, setInspectingPack] = useState<CardPack | null>(null);
  const [checkoutPack, setCheckoutPack] = useState<CardPack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshPacks();
      setPurchaseSuccess(null);
      setIsProcessing(false);
      setCheckoutPack(null);
      setInspectingPack(null);
    }
  }, [isOpen]);

  const refreshPacks = () => {
    const loaded = getAllPacks();
    setPacks(loaded);
  };

  if (!isOpen) return null;

  const totalUnlockedCards = packs.reduce(
    (sum, p) => (p.isUnlocked ? sum + p.cardCount : sum),
    0
  );
  const isAllVipUnlocked = getUnlockedPackIds().includes('pack_vip');

  const handleOpenCheckout = (pack: CardPack) => {
    sounds.soundKeypress();
    if (pack.isUnlocked) return;
    setCheckoutPack(pack);
    setInspectingPack(null);
    setPurchaseSuccess(null);
    setIsProcessing(false);
  };

  const handleExecutePayment = (method: 'bit' | 'apple_google_pay' | 'card') => {
    if (!checkoutPack) return;
    setIsProcessing(true);
    sounds.soundKeypress();

    setTimeout(() => {
      unlockPack(checkoutPack.id);
      refreshPacks();
      setIsProcessing(false);
      setPurchaseSuccess(checkoutPack.title);

      // Audio & Confetti Celebration
      sounds.soundSuccess();
      try {
        confetti({
          particleCount: 130,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#ec4899', '#a855f7', '#10b981'],
        });
      } catch {
        // ignore
      }

      if (onPacksUpdated) {
        onPacksUpdated();
      }
    }, 900);
  };

  const handleBuyVip = () => {
    sounds.soundKeypress();
    const vipPack = packs.find((p) => p.id === 'pack_vip');
    if (vipPack) handleOpenCheckout(vipPack);
  };

  const handleResetForTesting = () => {
    sounds.soundKeypress();
    resetPacks();
    refreshPacks();
    if (onPacksUpdated) onPacksUpdated();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        overflow: 'hidden',
      }}
      className="flex flex-col w-full h-[100dvh] text-white relative select-none animate-fadeIn bg-[#090b14]/75 backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
      dir={isEn ? 'ltr' : 'rtl'}
    >
      {/* רקע קלפים מרחפים בעדינות */}
      <FloatingCardsBackground opacityClass="opacity-30" />

      {/* ================= LAYER 1: PACK INSPECTION (FULL-SCREEN ISOLATED MODAL) ================= */}
      {inspectingPack ? (
        <div
          className="absolute inset-0 z-50 bg-[#0c0f17] flex flex-col w-full h-full select-none animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* סרגל עליון נעול ואטום */}
          <div className="flex-shrink-0 w-full bg-[#131826] border-b border-purple-500/20 px-4 py-3 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{inspectingPack.icon}</span>
              <div>
                <h2 className="text-base font-black text-amber-300 leading-tight">
                  {inspectingPack.title}
                </h2>
                <span className="text-[11px] text-slate-400">
                  {inspectingPack.id === 'pack_vip'
                    ? 'כל 30 הקלפים כלולים'
                    : '10 קלפים כלולים בחבילה זו'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sounds.soundKeypress();
                setInspectingPack(null); // מחזיר אך ורק לדף החנות!
              }}
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-sm active:scale-90 cursor-pointer hover:text-white"
              title="חזרה לחנות"
            >
              ✕
            </button>
          </div>

          {/* שטח גלילה נקי לקלפים בלבד */}
          <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
            <div className="grid grid-cols-2 gap-3 pb-8 max-w-2xl mx-auto">
              {(inspectingPack.id === 'pack_vip'
                ? ALL_GAME_CARDS
                : ALL_GAME_CARDS.filter((c) => c.packId === inspectingPack.id)
              ).map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl overflow-hidden bg-[#161d2f] border border-slate-800 shadow-md flex flex-col"
                >
                  <div className="w-full h-32 bg-slate-950">
                    <img
                      src={card.imageUrl}
                      alt={card.word}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2.5 text-center bg-[#111624]">
                    <div className="text-sm font-black text-amber-200">{card.word}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {card.category} • {card.word.length} אותיות
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* סרגל תחתון נעול: כפתור רכישה (אם נעולה) או חיווי פעיל */}
          {!inspectingPack.isUnlocked ? (
            <div className="flex-shrink-0 w-full bg-[#131826] border-t border-purple-500/20 p-3.5 flex items-center justify-between shadow-2xl">
              <div>
                <div className="text-[10px] text-slate-400">מחיר חד-פעמי</div>
                <div className="text-sm font-black text-amber-300">
                  {inspectingPack.priceDisplay || `₪${inspectingPack.price}`}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const pack = inspectingPack;
                  setInspectingPack(null);
                  handleOpenCheckout(pack);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-[0_3px_0_#b45309] active:translate-y-[1px] cursor-pointer hover:brightness-105"
              >
                רכישה עכשיו ⚡
              </button>
            </div>
          ) : (
            <div className="flex-shrink-0 w-full bg-[#131826] border-t border-purple-500/20 p-3.5 flex items-center justify-between shadow-2xl">
              <div className="text-xs font-bold text-slate-300">סטטוס חבילה</div>
              <div className="px-4 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                <span>החבילה פתוחה ופעילה ✓</span>
              </div>
            </div>
          )}
        </div>
      ) : checkoutPack ? (
        /* ================= LAYER 2: DEDICATED CHECKOUT VIEW ================= */
        <div
          className="absolute inset-0 z-50 bg-[#090b14]/80 backdrop-blur-md pt-8 pb-4 px-4 overflow-y-auto flex flex-col items-center justify-start select-none animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* רקע קלפים מרחפים בתוך עמוד הרכישה */}
          <FloatingCardsBackground opacityClass="opacity-25" />

          <div className="w-full max-w-lg relative z-10 flex flex-col gap-3">
            {/* בלוק הכותרת העליונה (הקפסולה הסגולה) הממורכז */}
            <div className="relative w-full rounded-2xl border border-purple-500/30 bg-[#121024]/70 p-3 flex items-center justify-center">
              {/* כפתור סגירה מיושר אבסולוטית לשמאל */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.soundKeypress();
                  setCheckoutPack(null);
                  setPurchaseSuccess(null);
                }}
                className="absolute left-3 w-8 h-8 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center justify-center font-bold text-xs active:scale-90 transition-transform cursor-pointer hover:text-white"
                title="חזרה לחנות"
              >
                ✕
              </button>

              {/* כותרת ממורכזת באופן מוחלט במרכז המסגרת */}
              <span className="text-center font-black tracking-widest text-amber-300 text-sm drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]">
                TIME TO GUESS
              </span>
            </div>

            {/* Header Title */}
            <div className="text-center pt-1 pb-1">
              <h2 className="mt-1 text-center text-xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)]">
                {isEn ? 'Complete Pack Purchase' : 'השלמת רכישת חבילת קלפים'}
              </h2>
              <p className="text-xs text-purple-200/80 mt-0.5 font-medium">
                {isEn ? 'Instant permanent unlock for your entire game' : 'פתיחה מיידית וקבועה של החבילה למשחק'}
              </p>
            </div>

            {/* Order Summary Card (Frosted Glass Inline Style) */}
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
              className="rounded-3xl p-5 border border-amber-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] my-3 flex flex-col gap-3.5"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-purple-500/20">
                {renderPackBadgeIcon(checkoutPack.id)}
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{checkoutPack.title}</span>
                  </h3>
                  <p className="text-xs text-amber-300/90 font-bold mt-0.5">
                    ✨ פותח 10 קלפי משחק חדשים לצמיתות!
                  </p>
                </div>
              </div>

              {/* Feature bullets */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>10 תמונות HD מאומתות מרחבי העולם</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>זמין בכל משחק (אונליין ומשחק עם חברים)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>תשלום חד-פעמי (ללא מנוי, ללא חידוש אוטומטי)</span>
                </div>
              </div>

              {/* Total Price row */}
              <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-200">מחיר סופי:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-300 drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)]">
                    {checkoutPack.priceDisplay}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">חד-פעמי</span>
                </div>
              </div>
            </div>

            {/* Success celebration banner or payment methods */}
            {purchaseSuccess ? (
              <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-900/90 to-emerald-950/90 border-2 border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)] text-center animate-fadeIn flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-bounce">
                  <Check className="w-8 h-8 text-emerald-300" strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">החבילה נפתחה בהצלחה! 🎉</h4>
                  <p className="text-xs text-emerald-200 mt-1 font-medium">
                    כל 10 הקלפים החדשים של {checkoutPack.title} זמינים עכשיו במשחק!
                  </p>
                </div>
                <div className="flex gap-2 w-full pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const p = checkoutPack;
                      setCheckoutPack(null);
                      setPurchaseSuccess(null);
                      setInspectingPack(p);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-amber-300 font-bold text-xs border border-amber-400/40 hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
                  >
                    צפה בקלפי החבילה
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCheckoutPack(null);
                      setPurchaseSuccess(null);
                      onClose();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  >
                    המשך למשחק 🎮
                  </button>
                </div>
              </div>
            ) : (
              /* Payment Options */
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-300 px-1">בחר אמצעי תשלום מועדף:</span>

                {/* 1. Bit Payment Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecutePayment('bit');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00A3E0] to-[#0082b8] hover:from-[#00b2f5] hover:to-[#0094d1] text-white font-black text-sm flex items-center justify-between shadow-[0_4px_14px_rgba(0,163,224,0.45)] border-t border-t-white/30 active:scale-98 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#00A3E0] flex items-center justify-center font-black text-base shadow-sm">
                      b
                    </div>
                    <span className="tracking-wide">תשלום מהיר ב-Bit</span>
                  </div>
                  <span className="bg-black/20 px-2.5 py-1 rounded-lg text-xs font-black">
                    {checkoutPack.priceDisplay}
                  </span>
                </button>

                {/* 2. Apple Pay / Google Pay Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExecutePayment('apple_google_pay');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm flex items-center justify-between border-2 border-slate-700/80 shadow-[0_4px_14px_rgba(0,0,0,0.5)] active:scale-98 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg"></span>
                    <span className="tracking-wide">Apple Pay / Google Pay</span>
                  </div>
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-black text-amber-300">
                    {checkoutPack.priceDisplay}
                  </span>
                </button>

                {/* 3. Secure Credit Card Option (Frosted Glass Inline Style) */}
                <div
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                  className="rounded-3xl p-5 border border-purple-500/25 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>תשלום מאובטח בכרטיס אשראי</span>
                    </span>
                    <span className="text-[10px] text-slate-400">ויזה / מאסטרקארד / ישראכרט</span>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-xs text-slate-300 font-mono flex items-center justify-between">
                      <span>•••• •••• •••• 4242</span>
                      <span className="text-[10px] font-sans font-bold text-emerald-400">
                        כרטיס שמור בדפדפן
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="px-3.5 py-2 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-xs text-slate-300 font-mono text-center">
                        12/28
                      </div>
                      <div className="px-3.5 py-2 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-xs text-slate-300 font-mono text-center">
                        CVV: •••
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecutePayment('card');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_4px_0_#b45309] hover:brightness-110 active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>מעבד תשלום מאובטח...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-950" />
                        <span>אישור תשלום {checkoutPack.priceDisplay} ופתיחת החבילה 🔒</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Security line */}
                <div className="flex flex-col items-center justify-center text-center gap-1 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>תשלום מאובטח ומוצפן 256-Bit SSL 🔒</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    העסקה מאושרת מיידית והחבילה תתווסף למאגר הקלפים בכל מכשירי החדר
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= LAYER 3: MAIN STORE VIEW ================= */
        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-start p-4 sm:p-6 pb-20">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#181530]/85 via-[#101222]/85 to-[#0a0c16]/85 border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-[0_16px_45px_rgba(0,0,0,0.8),0_0_50px_rgba(234,179,8,0.1)] relative z-10 backdrop-blur-sm">
            {/* בלוק הכותרת העליונה (הקפסולה הסגולה) הממורכז */}
            <div className="relative w-full rounded-2xl border border-purple-500/30 bg-[#121024]/70 p-3 flex items-center justify-center mb-3">
              {/* כפתור סגירה מיושר אבסולוטית לשמאל */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sounds.soundKeypress();
                  onClose();
                }}
                className="absolute left-3 w-8 h-8 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center justify-center font-bold text-xs active:scale-90 transition-transform cursor-pointer hover:text-white"
                title={isEn ? 'Close' : 'סגור'}
              >
                ✕
              </button>

              {/* כותרת ממורכזת באופן מוחלט במרכז המסגרת */}
              <span className="text-center font-black tracking-widest text-amber-300 text-sm drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]">
                TIME TO GUESS
              </span>
            </div>

            {/* Header: כותרת מבריקה */}
            <div className="text-center pt-1 pb-3 relative">
              <h1 className="text-2xl font-black text-center bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)]">
                {isEn ? 'Card Packs Store' : 'חנות חבילות הקלפים'}
              </h1>
              <p className="text-xs text-center text-purple-200/80 mt-1 font-medium">
                Time To Guess Premium Edition
              </p>

              {upsellReason ? (
                <p className="text-xs text-center text-amber-300 font-bold mt-1.5 bg-amber-500/15 py-1 px-3.5 rounded-full inline-block border border-amber-500/30 shadow-sm mx-auto">
                  {upsellReason}
                </p>
              ) : (
                <p className="text-[11px] text-center text-slate-300 max-w-xs mx-auto mt-1 leading-relaxed">
                  {isEn
                    ? 'Expand your game with over 100 verified HD photos, animals, foods, and professions!'
                    : 'שדרגו את המשחק עם מעל 100 תמונות HD מאומתות, חיות מרתקות, מאכלים ומקצועות!'}
                </p>
              )}

              {/* סרגל סטטוס VIP ומספר קלפים פעילים */}
              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5">
                <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 border border-slate-400/40 text-slate-300 shadow-[0_3px_0_#1e293b,0_4px_10px_rgba(0,0,0,0.4)] flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                  <span className="text-xs font-bold">
                    {isEn ? 'Unlocked Cards:' : 'קלפים פתוחים במאגר:'}
                  </span>
                  <span className="text-xs font-black text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                    {totalUnlockedCards}
                  </span>
                </div>

                {isAllVipUnlocked ? (
                  <div className="px-3.5 py-1.5 rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 border-t border-t-white/50 border-amber-200 shadow-[0_4px_0_#92400e,0_4px_12px_rgba(234,179,8,0.35)] text-amber-950 font-black text-xs flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-950 fill-amber-950" />
                    <span>VIP ACTIVE</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_0_#3b0764]">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isEn ? 'Standard Edition' : 'גרסה רגילה'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* כרטיס מגה פאק VIP */}
            {!isAllVipUnlocked && (
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
                className="relative mb-5 rounded-3xl p-5 border border-amber-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-3"
              >
                {/* שורת תגית עליונה מיושרת לימין ולשמאל */}
                <div className="flex items-center justify-between w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 text-xs font-black shadow-sm">
                    <span>{isEn ? 'Best Value Deal' : 'המשתלם ביותר'}</span>
                    <span>🔥</span>
                  </div>

                  {/* תג כתר VIP מעוצב */}
                  <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shadow-inner">
                    👑
                  </div>
                </div>

                {/* כותרת מגה פאק נקייה וברורה ללא הפרעות */}
                <div className="text-right">
                  <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 leading-snug">
                    {isEn ? 'VIP Mega Pack – All Decks Forever' : 'מגה פאק VIP – כל המאגרים לתמיד'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {isEn
                      ? 'Unlocks all cards, animals, professions, foods, and global expansions with a single click! Saves over 50%.'
                      : 'פותח את כל הקלפים, חיות, מקצועות, מאכלים והרחבות עולמיות בלחיצה אחת! חסכון של מעל 50%.'}
                  </p>
                </div>

                {/* כפתור רכישה תלת-ממדי מובלט */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyVip();
                  }}
                  className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
                >
                  <span>{isEn ? 'Unlock VIP for ₪12.90' : 'פתח VIP ב-₪12.90 בלבד'}</span>
                  <span>⚡</span>
                </button>
              </div>
            )}

            {/* כרטיסי החבילות */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5">
              {packs.filter((p) => p.id !== 'pack_vip').map((pack) => {

                return (
                  <div
                    key={pack.id}
                    className={`relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border border-purple-500/30 bg-[#121626]/90 backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-200 ${
                      pack.isUnlocked
                        ? 'border-emerald-500/40 hover:border-emerald-400/60'
                        : 'border-purple-500/30 hover:border-purple-400/50'
                    }`}
                  >
                    {/* Pack Header */}
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          {renderPackBadgeIcon(pack.id)}
                          <div>
                            <h4 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5 leading-snug">
                              {pack.title}
                            </h4>
                            <span className="text-[11px] text-amber-300/90 font-bold">
                              {pack.cardCount} {isEn ? 'verified cards' : 'קלפים מאומתים'}
                            </span>
                          </div>
                        </div>

                        {pack.badge && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-yellow-200 shadow-[0_2px_0_#92400e,0_2px_8px_rgba(234,179,8,0.35)] shrink-0">
                            {pack.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mb-2 leading-relaxed font-normal">
                        {pack.subtitle}
                      </p>

                      {/* Preview Thumbnail Row - only 4 sample thumbnails + "+6 עוד" */}
                      <div className="flex gap-2 overflow-hidden mb-2 py-1">
                        {pack.cards.slice(0, 4).map((c) => (
                          <div
                            key={c.id}
                            className="w-12 h-14 rounded-xl overflow-hidden border border-slate-400/30 bg-slate-950 shadow-[0_2px_6px_rgba(0,0,0,0.4)] shrink-0 relative"
                            title={c.word}
                          >
                            <img
                              src={c.imageUrl || c.image}
                              alt={c.word}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] text-center font-black text-amber-200 truncate px-0.5 py-0.5">
                              {c.word}
                            </div>
                          </div>
                        ))}
                        {pack.cardCount > 4 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.soundKeypress();
                              setInspectingPack(pack);
                            }}
                            className="w-12 h-14 rounded-xl border border-dashed border-amber-400/50 bg-amber-500/10 hover:bg-amber-500/20 flex flex-col items-center justify-center text-[10px] text-amber-300 font-black shrink-0 shadow-[0_2px_6px_rgba(0,0,0,0.3)] cursor-pointer active:scale-95 transition-all"
                            title="צפה בכל הקלפים"
                          >
                            <span>+{pack.cardCount - 4}</span>
                            <span className="text-[7px] text-amber-200/80 font-bold">עוד</span>
                          </button>
                        )}
                      </div>

                      {/* כפתור צפייה ישיר בכל 10 הקלפים */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.soundKeypress();
                            setInspectingPack(pack);
                          }}
                          className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span className="underline underline-offset-2">
                            {isEn ? `View all ${pack.cardCount} cards` : `צפה בכל ${pack.cardCount} הקלפים`}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Footer Action: כפתור רכישה מובלט בתלת-ממד */}
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-black text-amber-300 drop-shadow-[0_1px_3px_rgba(234,179,8,0.3)]">
                          {pack.priceDisplay}
                        </span>
                        {pack.price > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {isEn ? 'one-time' : 'חד-פעמי'}
                          </span>
                        )}
                      </div>

                      {pack.isUnlocked ? (
                        <div className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-b from-emerald-500 to-emerald-700 px-3.5 py-2 rounded-xl border-t border-t-emerald-300/40 border-emerald-600 shadow-[0_4px_0_#065f46] shadow-emerald-950/40 select-none">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          <span>{isEn ? 'Active & Ready' : 'פתוח ופעיל ✓'}</span>
                        </div>
                      ) : (
                        /* כפתור רכישה תלת-ממדי מובלט */
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCheckout(pack);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer hover:brightness-105"
                        >
                          <span>{isEn ? 'Purchase Now' : 'רכישה עכשיו'}</span>
                          <span className="bg-black/15 px-1.5 py-0.5 rounded-md">
                            {pack.priceDisplay}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom actions & Test Mode Restore */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isEn
                    ? 'Safe & instant unlock | Works permanently offline & online'
                    : 'פתיחה מיידית ומאובטחת | נשמר לצמיתות בדפדפן ובמכשיר'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetForTesting();
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-300 underline flex items-center gap-1 cursor-pointer"
                  title="איפוס חבילות לצורך בדיקה"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>{isEn ? 'Reset Purchases' : 'איפוס לבדיקות'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.soundKeypress();
                    onClose();
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-slate-800/90 border border-slate-700/80 border-t border-t-white/10 shadow-[0_3px_0_#1e293b] hover:bg-slate-700 active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <span>{isEn ? 'Continue Playing' : 'המשך למשחק'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
