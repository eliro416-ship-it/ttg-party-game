import React from 'react';
import { Crown, Gamepad2, Volume2, VolumeX, Globe, Film, ScrollText, Image, HelpCircle, Timer, RefreshCw, Users, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { translations } from '../utils/translations';

interface RoleSelectScreenProps {
  onOpenHost: () => void;
  onOpenPlayer: () => void;
  onQuickStart?: () => void;
  onOpenVideo?: () => void;
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
      {/* Top bar with Language Switcher and Sound Toggle */}
      <div className="w-full flex justify-between items-center mb-4">
        <button
          onClick={() => {
            sounds.soundKeypress();
            onToggleLanguage();
          }}
          className="btn-3d btn-3d-dark text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          title={isEn ? 'Switch to Hebrew' : 'עבור לאנגלית'}
        >
          <Globe className="w-3.5 h-3.5 text-pink-400" />
          <span>{t.langBtn}</span>
        </button>

        <button
          onClick={onToggleMute}
          className="btn-3d btn-3d-dark p-2 rounded-full text-slate-300 cursor-pointer"
          title={isMuted ? (isEn ? 'Unmute' : 'הפעל צלילים') : (isEn ? 'Mute' : 'השתק')}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
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

        {onOpenVideo && (
          <button
            onClick={() => {
              sounds.soundKeypress();
              onOpenVideo();
            }}
            className="btn-3d btn-3d-dark w-full py-3 px-4 text-pink-300 hover:text-white font-extrabold text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Film className="w-4 h-4 text-pink-400" strokeWidth={2.2} />
            <span>{isEn ? 'Watch Intro Video' : 'צפה בסרטון הסבר ופתיח'}</span>
          </button>
        )}
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

      {/* Floating button in the corner to re-watch the intro video at any time */}
      {onOpenVideo && (
        <button
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            onOpenVideo();
          }}
          className="fixed bottom-4 sm:bottom-6 start-4 sm:start-6 z-40 group btn-3d btn-3d-dark px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs font-black text-pink-300 hover:text-white border border-pink-500/40 backdrop-blur-xl shadow-[0_8px_25px_rgba(0,0,0,0.6)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          title={isEn ? 'Watch Intro Video' : 'צפייה חוזרת בסרטון הפתיחה'}
        >
          <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-400/40 group-hover:scale-110 transition-transform">
            <Film className="w-3 h-3 text-pink-300" strokeWidth={2.4} />
          </div>
          <span className="tracking-wide">{isEn ? 'Intro Video' : 'סרטון פתיחה'}</span>
          <span className="text-[11px]">🎬</span>
        </button>
      )}
    </div>
  );
};
