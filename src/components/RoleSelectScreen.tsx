import React from 'react';
import { Crown, Gamepad2, Volume2, VolumeX, Globe, Film, ScrollText, Image, HelpCircle, Timer, RefreshCw, Users, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { translations } from '../utils/translations';
import { PWAInstallBanner } from './PWAInstallBanner';

interface RoleSelectScreenProps {
  onOpenHost: () => void;
  onOpenPlayer: () => void;
  onQuickStart?: () => void;
  onOpenVideo?: () => void;
  onOpenCardsGallery?: () => void;
  onOpenStore?: () => void;
  turnDuration?: number;
  isMuted: boolean;
  onToggleMute: () => void;
  language: Language;
  onToggleLanguage: () => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({
  onOpenHost,
  onOpenPlayer,
  onQuickStart,
  onOpenVideo,
  onOpenCardsGallery,
  onOpenStore,
  turnDuration = 15,
  isMuted,
  onToggleMute,
  language = 'he',
  onToggleLanguage,
}) => {
  const t = translations[language];
  const isEn = language === 'en';
  const durationLabel = turnDuration === 60 ? (isEn ? '1 Minute' : 'דקה') : `${turnDuration} ${isEn ? 'seconds' : 'שניות'}`;

  return (
    <div className="w-full flex flex-col items-center text-center animate-fadeIn select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top bar with [ סאונד | סרטון פתיחה | אייקון גלריה/מאגר | אייקון חנות/יהלום | English ] */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 px-1 sm:px-2 pt-2 pb-3 z-20">
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* סאונד */}
          <button
            type="button"
            onClick={onToggleMute}
            className="h-9 w-9 flex-shrink-0 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-200 active:scale-95 transition-all cursor-pointer shadow-sm"
            title={isMuted ? (isEn ? 'Unmute' : 'הפעל סאונד') : (isEn ? 'Mute' : 'השתק סאונד')}
          >
            <span className="text-sm">{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* סרטון פתיחה */}
          {onOpenVideo && (
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenVideo();
              }}
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
              title={isEn ? 'Watch Intro Video' : 'צפייה בסרטון הפתיחה'}
            >
              <div className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-400/40">
                <Film className="w-2.5 h-2.5 text-pink-300" strokeWidth={2.4} />
              </div>
              <span className="font-extrabold">{isEn ? 'Intro' : 'סרטון פתיחה'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* אייקון גלריה / מאגר */}
          {onOpenCardsGallery && (
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenCardsGallery();
              }}
              className="h-9 w-9 flex-shrink-0 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 flex items-center justify-center active:scale-95 transition-all cursor-pointer shadow-sm group"
              title={isEn ? 'Photo Cards' : 'מאגר תמונות'}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#fbbf24" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform"
              >
                <rect width="18" height="18" x="3" y="3" rx="4" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </button>
          )}

          {/* אייקון חנות / יהלום */}
          {onOpenStore && (
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenStore();
              }}
              className="h-9 w-9 flex-shrink-0 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-amber-400/40 flex items-center justify-center active:scale-95 transition-all text-base cursor-pointer shadow-sm group"
              title={isEn ? 'Card Packs Store' : 'חנות חבילות'}
            >
              <span className="drop-shadow-[0_2px_6px_rgba(56,189,248,0.5)] group-hover:scale-110 transition-transform">💎</span>
            </button>
          )}

          {/* שפה English / עברית */}
          <button
            onClick={() => {
              sounds.soundKeypress();
              onToggleLanguage();
            }}
            className="h-9 px-2.5 sm:px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-sm shrink-0"
            title={isEn ? 'Switch to Hebrew' : 'עבור לאנגלית'}
          >
            <Globe className="w-3.5 h-3.5 text-pink-400" />
            <span>{t.langBtn}</span>
          </button>
        </div>
      </div>

      {/* Branded TTG Icon Badge */}
      <div className="w-[86px] h-[86px] mx-auto mb-3 bg-gradient-to-tr from-[#FF7675] via-[#6C5CE7] to-[#00CEC9] rounded-[26px] p-[5px] shadow-[0_10px_25px_rgba(108,92,231,0.45)] hover:scale-105 transition-all duration-300">
        <div className="w-full h-full bg-[#110B29] rounded-[21px] flex flex-col justify-center items-center shadow-inner">
          <span className="text-[26px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-[#FD79A8] leading-none">
            TTG
          </span>
          <span className="text-[9px] font-black text-[#FDCB6E] tracking-wider mt-1">
            TIME TO GUESS
          </span>
        </div>
      </div>

      {/* Title & Subtitle */}
      <h1 className="text-2xl sm:text-3xl font-black mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-300 tracking-tight">
        {t.title}
      </h1>
      <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-3 sm:mb-4 leading-relaxed">
        {t.sub}
      </p>

      {/* Quick Rules Card */}
      <div className={`w-full max-w-sm bg-white/[0.07] border border-white/15 rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 shadow-lg ${isEn ? 'text-left' : 'text-right'}`}>
        <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5 mb-2.5">
          <div className="w-5 h-5 rounded-md bg-amber-400/20 flex items-center justify-center border border-amber-400/30">
            <ScrollText className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.2} />
          </div>
          <span>{t.rulesTitle}</span>
        </h3>
        <ul className="space-y-2 text-[11px] sm:text-xs text-slate-200 leading-relaxed">
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Image className="w-3 h-3 text-purple-300" strokeWidth={2.2} />
            </div>
            <div dangerouslySetInnerHTML={{ __html: t.r1 }} />
          </li>
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-400/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <HelpCircle className="w-3 h-3 text-pink-300" strokeWidth={2.2} />
            </div>
            <div dangerouslySetInnerHTML={{ __html: t.r2 }} />
          </li>
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Timer className="w-3 h-3 text-amber-300" strokeWidth={2.2} />
            </div>
            <div dangerouslySetInnerHTML={{ __html: t.r3.replace('{seconds}', durationLabel) }} />
          </li>
          <li className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <RefreshCw className="w-3 h-3 text-emerald-300" strokeWidth={2.2} />
            </div>
            <div dangerouslySetInnerHTML={{ __html: t.r4 }} />
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3 sm:space-y-3.5 max-w-sm">
        {/* Store / Upgrade Packs Banner Button */}
        {onOpenStore && (
          <button
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              onOpenStore();
            }}
            className="w-full py-2.5 px-3 rounded-2xl font-black text-xs sm:text-sm text-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg border border-amber-400/50 animate-pulse relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #4c1d95 0%, #7e22ce 40%, #b45309 100%)',
              boxShadow: '0 4px 18px rgba(217, 119, 6, 0.35)',
            }}
          >
            <span className="shimmer-sweep" />
            <span className="text-base drop-shadow">💎</span>
            <span className="truncate tracking-wide font-extrabold text-amber-100">
              {isEn
                ? '💎 Upgrade Card Packs | Unlock 100+ New Photos'
                : '💎 שדרג חבילות קלפים | פתח 100+ תמונות חדשות'}
            </span>
          </button>
        )}

        <button
          onClick={() => {
            sounds.soundKeypress();
            onOpenHost();
          }}
          className="btn-3d btn-3d-purple w-full py-4 px-6 text-white font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="shimmer-sweep" />
          <Crown className="w-5 h-5 text-yellow-300 drop-shadow" strokeWidth={2.2} />
          <span className="tracking-wide">{t.btnHost}</span>
        </button>

        <button
          onClick={() => {
            sounds.soundKeypress();
            onOpenPlayer();
          }}
          className="btn-3d btn-3d-pink w-full py-4 px-6 text-white font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-3 cursor-pointer"
        >
          <span className="shimmer-sweep" />
          <Gamepad2 className="w-5 h-5 text-white drop-shadow" strokeWidth={2.2} />
          <span className="tracking-wide">{t.btnPlayer}</span>
        </button>

        {/* PWA Smart Install Prompt */}
        <PWAInstallBanner language={language} />
      </div>

      {/* Bottom feature pill */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5 text-pink-400" strokeWidth={2.2} />
          <span>{durationLabel}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-purple-400" strokeWidth={2.2} />
          <span>{isEn ? 'Live Multiplayer' : 'משחק מרובה משתתפים'}</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.2} />
          <span>{isEn ? 'Instant PIN Room' : 'הצטרפות מהירה'}</span>
        </span>
      </div>
    </div>
  );
};
