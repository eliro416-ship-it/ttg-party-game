import React, { useState } from 'react';
import { ExternalLink, Layers, Gift, Flame, Gamepad2 } from 'lucide-react';
import { ALL_GAME_CARDS } from '../data/cards';

interface CardsGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'starter_free' | 'animals_pro' | 'food_and_fun';

export const CardsGalleryModal: React.FC<CardsGalleryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');

  if (!isOpen) return null;

  const starterCount = ALL_GAME_CARDS.filter((c) => c.packId === 'starter_free').length;
  const animalsCount = ALL_GAME_CARDS.filter((c) => c.packId === 'animals_pro').length;
  const foodCount = ALL_GAME_CARDS.filter((c) => c.packId === 'food_and_fun').length;

  const filteredCards = activeTab === 'all'
    ? ALL_GAME_CARDS
    : ALL_GAME_CARDS.filter((c) => c.packId === activeTab);

  const getPackBadge = (packId: string) => {
    switch (packId) {
      case 'starter_free':
        return { text: 'חינם בסיס', bg: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' };
      case 'animals_pro':
        return { text: 'עולם החיות', bg: 'bg-amber-950/80 border-amber-500/50 text-amber-300' };
      case 'food_and_fun':
        return { text: 'מאכלים וחפצים', bg: 'bg-purple-950/80 border-purple-500/50 text-purple-300' };
      default:
        return { text: 'מאומת', bg: 'bg-blue-950/80 border-blue-500/50 text-blue-300' };
    }
  };

  const TABS: {
    id: TabType;
    label: string;
    count: number;
    icon: (isActive: boolean) => React.ReactNode;
  }[] = [
    {
      id: 'all',
      label: 'הכל',
      count: ALL_GAME_CARDS.length,
      icon: (isActive) => (
        <div className={`p-1.5 rounded-lg transition-transform ${isActive ? 'bg-amber-400/20 scale-110' : 'bg-slate-900/60'}`}>
          <Layers size={18} className={isActive ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.7)]' : 'text-slate-400'} />
        </div>
      ),
    },
    {
      id: 'starter_free',
      label: 'בסיס',
      count: starterCount,
      icon: (isActive) => (
        <div className={`p-1.5 rounded-lg transition-transform ${isActive ? 'bg-emerald-400/20 scale-110' : 'bg-slate-900/60'}`}>
          <Gift size={18} className={isActive ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(110,231,183,0.7)]' : 'text-slate-400'} />
        </div>
      ),
    },
    {
      id: 'animals_pro',
      label: 'חיות',
      count: animalsCount,
      icon: (isActive) => (
        <div className={`p-1.5 rounded-lg transition-transform ${isActive ? 'bg-orange-400/20 scale-110' : 'bg-slate-900/60'}`}>
          <Flame size={18} className={isActive ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.7)]' : 'text-slate-400'} />
        </div>
      ),
    },
    {
      id: 'food_and_fun',
      label: 'אוכל/חפצים',
      count: foodCount,
      icon: (isActive) => (
        <div className={`p-1.5 rounded-lg transition-transform ${isActive ? 'bg-purple-400/20 scale-110' : 'bg-slate-900/60'}`}>
          <Gamepad2 size={18} className={isActive ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.7)]' : 'text-slate-400'} />
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#0c0a1d',
        overflowY: 'auto',
        color: '#ffffff',
      }}
      className="overflow-x-hidden w-full max-w-full"
      dir="rtl"
    >
      {/* 2. סרגל עליון מקובע ברוחב מלא עם אייקונים תלת-ממדיים מעוצבים */}
      <div className="w-full sticky top-0 z-50 bg-[#0d1017]/95 backdrop-blur-md border-b border-slate-800/90 p-3 flex flex-col gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        {/* שורת כותרת וכפתור סגירה */}
        <div className="flex items-center justify-between w-full">
          <div>
            <h2 className="text-lg font-black text-yellow-400 leading-tight">מאגר קלפי תמונות</h2>
            <span className="text-[11px] text-slate-400">30 קלפים פעילים במערכת</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/gallery.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold inline-flex items-center gap-1 active:scale-95"
              title="פתח גלריה בחלון נפרד"
            >
              <span>דף נפרד</span>
              <ExternalLink size={12} />
            </a>
            <button 
              onClick={onClose}
              type="button"
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold active:scale-95 cursor-pointer shadow-[0_2px_0_#0f172a]"
            >
              סגור ✕
            </button>
          </div>
        </div>

        {/* גריד 4 כפתורים תלת-ממדיים קבועים ברוחב המסך - ללא גלילה אופקית */}
        <div className="grid grid-cols-4 gap-1.5 w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-b from-purple-600 via-purple-700 to-indigo-800 text-white border-t border-t-white/30 border-purple-400/60 shadow-[0_3px_10px_rgba(168,85,247,0.4)] shadow-[0_3px_0_#3b0764] translate-y-[-1px]'
                    : 'bg-slate-800/90 text-slate-300 border border-slate-700/80 border-t border-t-white/10 shadow-[0_2px_0_#0f172a] hover:bg-slate-700/90 active:translate-y-[1px]'
                }`}
              >
                {tab.icon(isActive)}
                <span className={`text-[11px] font-black mt-1 leading-none ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {tab.label}
                </span>
                <span className={`text-[9px] font-bold mt-0.5 ${isActive ? 'text-purple-200 opacity-90' : 'text-slate-400'}`}>
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid - 100% full width, responsive and steady */}
      <div className="max-w-4xl mx-auto px-4 py-5 w-full">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
          {filteredCards.map((item) => {
            const packBadge = getPackBadge(item.packId);
            return (
              <div
                key={item.id}
                className="bg-[#151233]/90 rounded-2xl overflow-hidden border border-purple-500/25 shadow-xl shadow-purple-950/40 flex flex-col transition-all duration-200 hover:border-purple-400/60"
              >
                {/* 1. התמונה ראשונה בתוך ה-Card */}
                <div className="w-full h-48 bg-slate-950 overflow-hidden relative">
                  <img
                    src={item.imageUrl}
                    alt={item.word}
                    crossOrigin="anonymous"
                    loading="lazy"
                    className="w-full h-48 object-cover object-center bg-slate-900"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Pack Badge on top of image */}
                  <div className="absolute top-2.5 start-2.5">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-md ${packBadge.bg}`}>
                      {packBadge.text}
                    </span>
                  </div>
                </div>

                {/* 2. פרטי הכרטיס שייכים בדיוק לאותה תמונה */}
                <div className="p-4 flex items-center justify-between bg-gradient-to-b from-[#181638] to-[#12102b] border-t border-purple-500/20">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-amber-300 block tracking-wide">
                      {item.word}
                    </span>
                    <span className="text-xs text-purple-200/60 font-medium">
                      {item.word.length} אותיות
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="bg-purple-600/70 border border-purple-400/30 text-xs px-3 py-1 rounded-full text-purple-100 font-bold">
                      {item.category}
                    </span>
                    <span className="text-emerald-400 text-xs block mt-1.5 font-black flex items-center gap-1">
                      ✓ מאומת
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
