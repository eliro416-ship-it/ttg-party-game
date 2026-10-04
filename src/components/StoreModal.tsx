import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Crown,
  ShieldCheck,
  RotateCcw,
  Eye,
  Sparkles,
} from 'lucide-react';
import { CardPack, getAllPacks, resetPacks, getUnlockedPackIds } from '../data/packs';
import { ALL_GAME_CARDS } from '../data/cards';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { SpecialBonusModal } from './SpecialBonusModal';

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
        <div className="w-12 h-12 p-2 rounded-2xl bg-gradient-to-br from-amber-500/20 via-purple-900/60 to-slate-950 border border-amber-400/40 shadow-[0_4px_12px_rgba(245,158,11,0.25)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]">🎁</span>
        </div>
      );
    case 'animals_pro':
      return (
        <div className="w-12 h-12 p-2 rounded-2xl bg-gradient-to-br from-orange-500/20 via-purple-900/60 to-slate-950 border border-orange-400/40 shadow-[0_4px_12px_rgba(249,115,22,0.25)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(249,115,22,0.6)]">🦁</span>
        </div>
      );
    case 'food_and_fun':
      return (
        <div className="w-12 h-12 p-2 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-purple-900/60 to-slate-950 border border-emerald-400/40 shadow-[0_4px_12px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(16,185,129,0.6)]">🍕</span>
        </div>
      );
    case 'pack_vip':
    default:
      return (
        <div className="w-12 h-12 p-2 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-purple-900/60 to-slate-950 border border-yellow-400/40 shadow-[0_4px_12px_rgba(234,179,8,0.3)] flex items-center justify-center shrink-0">
          <span className="text-2xl drop-shadow-[0_2px_8px_rgba(234,179,8,0.7)]">👑</span>
        </div>
      );
  }
};

const FloatingCardsBackground: React.FC<{ opacityClass?: string }> = ({
  opacityClass = 'opacity-25',
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
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [bonusTargetPack, setBonusTargetPack] = useState<CardPack | null>(null);
  const [bonusSuccessToast, setBonusSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshPacks();
      setInspectingPack(null);
      setIsBonusModalOpen(false);
      setBonusTargetPack(null);
    }
  }, [isOpen]);

  const refreshPacks = () => {
    const loaded = getAllPacks();
    setPacks(loaded);
  };

  if (!isOpen) return null;

  // חישוב קפדני: 10 קלפים כברירת מחדל, ו-20 בדיוק אם מומש הבונוס
  const hasClaimedBonus = typeof localStorage !== 'undefined' && localStorage.getItem('ttg_bonus_claimed') === 'true';
  const totalUnlockedCards = hasClaimedBonus ? 20 : 10;
  const isAllVipUnlocked = getUnlockedPackIds().includes('pack_vip');

  const handleOpenCheckout = (pack: CardPack) => {
    sounds.soundKeypress();
    if (pack.isUnlocked) return;

    if (hasClaimedBonus) {
      setBonusSuccessToast(
        isEn
          ? "You've already received 10 free cards! The remaining packs will unlock upon payment system launch."
          : "כבר קיבלת 10 קלפים במתנה! שאר החבילות ייפתחו עם השקת מערכת התשלומים."
      );
      setTimeout(() => setBonusSuccessToast(null), 4500);
      return;
    }

    setBonusTargetPack(pack);
    setIsBonusModalOpen(true);
  };

  const handleBuyVip = () => {
    sounds.soundKeypress();

    if (hasClaimedBonus) {
      setBonusSuccessToast(
        isEn
          ? "You've already received 10 free cards! The remaining packs will unlock upon payment system launch."
          : "כבר קיבלת 10 קלפים במתנה! שאר החבילות ייפתחו עם השקת מערכת התשלומים."
      );
      setTimeout(() => setBonusSuccessToast(null), 4500);
      return;
    }

    const vipPack = packs.find((p) => p.id === 'pack_vip');
    setBonusTargetPack(vipPack || null);
    setIsBonusModalOpen(true);
  };

  const handleBonusSuccess = (packTitle: string) => {
    refreshPacks();
    if (onPacksUpdated) {
      onPacksUpdated();
    }
    setBonusSuccessToast(
      isEn
        ? `Awesome! 10 new cards were added to your game pool (20 active cards total) 🎉`
        : `מעולה! 10 קלפים חדשים נוספו למאגר שלך (סך הכל 20 קלפים פעילים) 🎉`
    );
    setTimeout(() => {
      setBonusSuccessToast(null);
    }, 5000);
  };

  const handleResetForTesting = () => {
    sounds.soundKeypress();
    resetPacks();
    refreshPacks();
    if (onPacksUpdated) onPacksUpdated();
    setBonusSuccessToast(
      isEn ? 'Packs reset to default 10 cards' : 'המאגר אופס ל-10 קלפי ברירת מחדל'
    );
    setTimeout(() => setBonusSuccessToast(null), 3000);
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        width: '100vw',
        height: '100dvh',
      }}
      className="fixed inset-0 z-50 w-screen h-[100dvh] bg-[#0c0f17]/95 backdrop-blur-md flex flex-col justify-start items-stretch overflow-hidden select-none text-white"
      onClick={(e) => e.stopPropagation()}
      dir={isEn ? 'ltr' : 'rtl'}
    >
      {/* רקע קלפים מרחפים בעדינות */}
      <FloatingCardsBackground opacityClass="opacity-25" />

      {/* ================= LAYER 1: PACK INSPECTION (FULL-SCREEN ISOLATED MODAL) ================= */}
      {inspectingPack ? (
        <div
          className="absolute inset-0 z-30 bg-[#0c0f17] flex flex-col w-full h-full select-none animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* סרגל עליון נעול ואטום */}
          <div className="flex-shrink-0 w-full bg-[#121626] border-b border-purple-500/20 px-4 py-3 flex items-center justify-between shadow-xl z-20">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{inspectingPack.icon}</span>
              <div>
                <h2 className="text-base font-black text-amber-300 leading-tight">
                  {inspectingPack.title}
                </h2>
                <span className="text-[11px] text-slate-400">
                  {inspectingPack.id === 'pack_vip'
                    ? (isEn ? 'All 30 cards included' : 'כל 30 הקלפים כלולים')
                    : (isEn ? '10 cards included in this pack' : '10 קלפים כלולים בחבילה זו')}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sounds.soundKeypress();
                setInspectingPack(null);
              }}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs active:scale-90 cursor-pointer hover:text-white"
              title={isEn ? 'Back to Store' : 'חזרה לחנות'}
            >
              ✕
            </button>
          </div>

          {/* שטח גלילה נקי לקלפים בלבד */}
          <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
            <div className="grid grid-cols-2 gap-3 pb-8 max-w-md mx-auto">
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
                      {card.category} • {card.word.length} {isEn ? 'letters' : 'אותיות'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* סרגל תחתון נעול: כפתור רכישה (אם נעולה) או חיווי פעיל */}
          {!inspectingPack.isUnlocked ? (
            <div className="flex-shrink-0 w-full bg-[#131826] border-t border-purple-500/20 p-3.5 flex items-center justify-between shadow-2xl z-20">
              <div>
                <div className="text-[10px] text-slate-400">{isEn ? 'One-time price' : 'מחיר חד-פעמי'}</div>
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
                className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md active:scale-95 transition-transform cursor-pointer ${
                  hasClaimedBonus
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                    : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-105'
                }`}
              >
                {hasClaimedBonus
                  ? (isEn ? 'Available on Full Launch 🔒' : 'בקרוב בהשקה הרשמית 🔒')
                  : (isEn ? 'Claim Free Bonus Pack 🎁' : 'פתיחה במתנה 🎁')}
              </button>
            </div>
          ) : (
            <div className="flex-shrink-0 w-full bg-[#131826] border-t border-purple-500/20 p-3.5 flex items-center justify-between shadow-2xl z-20">
              <div className="text-xs font-bold text-slate-300">{isEn ? 'Pack Status' : 'סטטוס חבילה'}</div>
              <div className="px-4 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 font-bold text-xs flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                <span>{isEn ? 'Pack Active & Unlocked ✓' : 'החבילה פתוחה ופעילה ✓'}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================= LAYER 2: MAIN STORE VIEW ================= */
        <div className="flex flex-col w-full h-full overflow-hidden">
          {/* סרגל עליון קבוע ונעול לרוחב 100% */}
          <div className="flex-shrink-0 w-full bg-[#121626] border-b border-purple-500/20 px-4 py-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="text-xl">💎</span>
              <span className="text-sm font-black text-amber-300">
                {isEn ? 'Card Packs Store' : 'חנות חבילות הקלפים'}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sounds.soundKeypress();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs active:scale-90 cursor-pointer hover:text-white"
              title={isEn ? 'Close' : 'סגור'}
            >
              ✕
            </button>
          </div>

          {/* הודעת הצלחה / התראה אם נפתחו כרטיסים */}
          {bonusSuccessToast && (
            <div className="flex-shrink-0 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs py-2.5 px-4 text-center shadow-lg flex items-center justify-center gap-2 animate-fadeIn z-30">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{bonusSuccessToast}</span>
            </div>
          )}

          {/* שטח תוכן נגלל שתופס 100% רוחב */}
          <div className="flex-1 w-full max-w-md mx-auto overflow-y-auto px-4 py-4 space-y-4 overscroll-contain relative z-10">
            {/* Header: תיאור ומצב מאגר מדויק (10 או 20 קלפים) */}
            <div className="text-center pt-1">
              <p className="text-xs text-purple-200/80 font-medium">
                Time To Guess Premium Edition
              </p>

              {upsellReason ? (
                <p className="text-xs text-amber-300 font-bold mt-1 bg-amber-500/15 py-1 px-3.5 rounded-full inline-block border border-amber-500/30 shadow-sm mx-auto">
                  {upsellReason}
                </p>
              ) : (
                <p className="text-[11px] text-slate-300 max-w-xs mx-auto mt-1 leading-relaxed">
                  {isEn
                    ? 'Expand your game with over 100 verified HD photos, animals, foods, and professions!'
                    : 'שדרגו את המשחק עם מעל 100 תמונות HD מאומתות, חיות מרתקות, מאכלים ומקצועות!'}
                </p>
              )}

              {/* סרגל סטטוס VIP ומספר קלפים פעילים - מציג 10 או בדיוק 20 */}
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <div className="px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center gap-1.5 text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={3} />
                  <span className="font-bold">
                    {isEn ? 'Unlocked Cards in Pool:' : 'קלפים פתוחים במאגר:'}
                  </span>
                  <span className="font-black text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]">
                    {totalUnlockedCards}
                  </span>
                </div>

                {hasClaimedBonus ? (
                  <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isEn ? '20 Cards Active' : 'בונוס 20 קלפים פעיל ✔️'}</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isEn ? 'Standard Edition (10 Cards)' : 'גרסה רגילה (10 קלפים)'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* כרטיס מגה פאק VIP / מתנת הבונוס ברוחב מלא w-full */}
            <div className="w-full relative rounded-3xl p-4 sm:p-5 border border-amber-400/40 bg-gradient-to-b from-[#191834]/95 to-[#100f24]/95 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-3">
              <div className="flex items-center justify-between w-full">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black">
                  <span>
                    {hasClaimedBonus
                      ? (isEn ? 'Bonus Claimed (20/20 in Deck) ✔️' : 'מימשת את מתנת 10 הקלפים הנוספים (20/20 פעילים במאגר) ✔️')
                      : (isEn ? 'Special Gift Available' : 'מתנה מיוחדת זמינה')}
                  </span>
                  <span>{hasClaimedBonus ? '✔️' : '🎁'}</span>
                </div>
                <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-lg">
                  👑
                </div>
              </div>

              <div className="text-right">
                <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 leading-snug">
                  {hasClaimedBonus
                    ? (isEn ? 'Bonus Active: 20 Cards in Your Deck!' : 'מימשת את מתנת 10 הקלפים הנוספים (20/20 פעילים במאגר) ✔️')
                    : (isEn ? 'VIP Mega Pack – Get 10 Bonus Cards Now!' : 'מגה פאק VIP – כל המאגרים לתמיד')}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {hasClaimedBonus
                    ? (isEn
                        ? 'Your 10 free bonus cards are active in every match! Remaining packs will unlock upon full store launch.'
                        : '10 קלפי הבונוס שלך פעילים בכל משחק! שאר החבילות ייפתחו במערכת התשלומים.')
                    : (isEn
                        ? 'Unlocks all cards, animals, professions, foods, and global expansions! Try 10 cards free now.'
                        : 'פותח את כל הקלפים, חיות, מקצועות, מאכלים והרחבות עולמיות! קבלו 10 קלפים נוספים במתנה כבר עכשיו.')}
                </p>
              </div>

              {hasClaimedBonus ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.soundKeypress();
                    setBonusSuccessToast(
                      isEn
                        ? "You've already received 10 free cards! The remaining packs will unlock upon payment system launch."
                        : "כבר קיבלת 10 קלפים במתנה! שאר החבילות ייפתחו עם השקת מערכת התשלומים."
                    );
                    setTimeout(() => setBonusSuccessToast(null), 4500);
                  }}
                  className="w-full mt-1 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isEn ? 'Bonus Active on Your Account 🎁' : 'הבונוס כבר פעיל בחשבונך 🎁'}</span>
                  <span>✔️</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyVip();
                  }}
                  className="w-full mt-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
                >
                  <span>{isEn ? 'Claim 10 Free Bonus Cards! 🚀' : 'פתחו לי 10 קלפים במתנה! 🚀'}</span>
                  <span>🎁</span>
                </button>
              )}
            </div>

            {/* כרטיסי החבילות ברוחב מלא w-full */}
            <div className="w-full space-y-4">
              {packs.filter((p) => p.id !== 'pack_vip').map((pack) => (
                <div
                  key={pack.id}
                  className={`w-full relative flex flex-col justify-between p-4 sm:p-5 rounded-3xl border ${
                    pack.isUnlocked
                      ? 'border-emerald-500/40 bg-[#121626]/95'
                      : 'border-purple-500/30 bg-[#121626]/95'
                  } shadow-[0_8px_24px_rgba(0,0,0,0.6)]`}
                >
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
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border border-yellow-200 shadow-sm shrink-0">
                          {pack.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mb-2 leading-relaxed font-normal">
                      {pack.subtitle}
                    </p>

                    {/* Preview Thumbnail Row - קוביית +6 עוד במלואה ללא חיתוך + 4 תמונות ממוזערות */}
                    <div className="w-full flex items-center justify-start gap-2 px-1 py-1 overflow-x-visible mb-2">
                      {/* קוביית +6 עוד במלואה ללא חיתוך */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sounds.soundKeypress();
                          setInspectingPack(pack);
                        }}
                        className="w-14 h-14 flex-shrink-0 rounded-xl border border-dashed border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20 flex flex-col items-center justify-center text-amber-300 font-bold active:scale-95 transition-transform cursor-pointer shadow-sm"
                        title={isEn ? `View all ${pack.cardCount} cards` : 'צפה בכל הקלפים'}
                      >
                        <span className="text-xs">+{pack.cardCount > 4 ? pack.cardCount - 4 : 6}</span>
                        <span className="text-[9px]">{isEn ? 'more' : 'עוד'}</span>
                      </button>

                      {/* 4 תמונות ממוזערות */}
                      {pack.cards.slice(0, 4).map((card) => (
                        <div
                          key={card.id}
                          className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-sm relative"
                          title={card.word}
                        >
                          <img
                            src={card.imageUrl || card.image}
                            alt={card.word}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] text-center font-black text-amber-200 truncate px-0.5 py-0.5">
                            {card.word}
                          </div>
                        </div>
                      ))}
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

                  {/* Footer Action */}
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
                      <div className="flex items-center gap-1.5 text-xs font-black text-white bg-gradient-to-b from-emerald-500 to-emerald-700 px-3.5 py-2 rounded-xl border-t border-t-emerald-300/40 border-emerald-600 shadow-[0_4px_0_#065f46] select-none">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        <span>{isEn ? 'Active & Ready' : 'פתוח ופעיל ✓'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCheckout(pack);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          hasClaimedBonus
                            ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-200/90 shadow-sm'
                            : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none hover:brightness-105'
                        }`}
                      >
                        <span>
                          {hasClaimedBonus
                            ? (isEn ? 'Available on Full Launch 🔒' : 'בקרוב בהשקה הרשמית 🔒')
                            : (isEn ? 'Get 10 Cards Free' : 'קבל 10 קלפים במתנה')}
                        </span>
                        <span>{hasClaimedBonus ? '🔒' : '🎁'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom actions & Test Mode Restore */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400 pb-8">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  {isEn
                    ? 'Safe & instant unlock | Works permanently offline & online'
                    : 'פתיחה מיידית ומאובטחת | נשמר לצמיתות בדפדפן ובמכשיר'}
                </span>
              </div>

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
            </div>
          </div>
        </div>
      )}

      {/* Special Bonus Gift Modal for Pre-Launch Market Validation */}
      <SpecialBonusModal
        isOpen={isBonusModalOpen}
        onClose={() => setIsBonusModalOpen(false)}
        onSuccess={handleBonusSuccess}
        language={language}
        targetPack={bonusTargetPack}
      />
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
