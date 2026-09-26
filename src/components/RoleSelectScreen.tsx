import React from 'react';
import { Crown, Gamepad2, Volume2, VolumeX, Globe, Film, Trophy, Download } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { translations } from '../utils/translations';
import { InstallAppButton } from './InstallAppButton';

interface RoleSelectScreenProps {
  onOpenHost: () => void;
  onOpenPlayer: () => void;
  onOpenLeaderboard?: () => void;
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
  onOpenLeaderboard,
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
          className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          title={isEn ? 'Switch to Hebrew' : 'עבור לאנגלית'}
        >
          <Globe className="w-3.5 h-3.5 text-pink-400" />
          <span>{t.langBtn}</span>
        </button>

        <button
          onClick={onToggleMute}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 border border-white/15 transition-all cursor-pointer"
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
      <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-4 leading-relaxed">
        {t.sub}
      </p>

      {/* Quick Rules Card - Transparent Glass */}
      <div className={`w-full max-w-sm bg-black/20 backdrop-blur-[2px] border border-white/15 rounded-2xl p-4 mb-5 shadow-lg ${isEn ? 'text-left' : 'text-right'}`}>
        <h3 className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5 mb-2.5">
          <span>{t.rulesTitle}</span>
        </h3>
        <ul className="space-y-2 text-[11px] sm:text-xs text-slate-200 leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-base leading-none">🖼️</span>
            <div dangerouslySetInnerHTML={{ __html: t.r1 }} />
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base leading-none">❓</span>
            <div dangerouslySetInnerHTML={{ __html: t.r2 }} />
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base leading-none">⏱️</span>
            <div dangerouslySetInnerHTML={{ __html: t.r3.replace('{seconds}', durationLabel) }} />
          </li>
          <li className="flex items-start gap-2">
            <span className="text-base leading-none">🔄</span>
            <div dangerouslySetInnerHTML={{ __html: t.r4 }} />
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3 max-w-sm">
        <button
          onClick={() => {
            sounds.soundKeypress();
            onOpenHost();
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-[#6C5CE7] to-[#8E44AD] hover:from-[#5d4ce6] hover:to-[#8239a1] active:scale-98 text-white font-extrabold text-base sm:text-lg rounded-2xl border border-white/25 shadow-xl shadow-purple-900/40 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Crown className="w-5 h-5 text-yellow-300 drop-shadow" />
          <span>{t.btnHost}</span>
        </button>

        <button
          onClick={() => {
            sounds.soundKeypress();
            onOpenPlayer();
          }}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-[#FD79A8] to-[#E84393] hover:from-[#fc659a] hover:to-[#d83584] active:scale-98 text-white font-extrabold text-base sm:text-lg rounded-2xl border border-white/25 shadow-xl shadow-pink-900/40 flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Gamepad2 className="w-5 h-5 text-white" />
          <span>{t.btnPlayer}</span>
        </button>

        {onOpenLeaderboard && (
          <button
            onClick={() => {
              sounds.soundKeypress();
              onOpenLeaderboard();
            }}
            className="w-full py-3 px-5 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 hover:from-amber-500/40 hover:to-yellow-500/35 active:scale-98 text-amber-200 hover:text-white font-extrabold text-sm sm:text-base rounded-2xl border border-amber-400/40 shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <Trophy className="w-5 h-5 text-amber-300 drop-shadow" />
            <span>{isEn ? 'Leaderboard & Top Champions 🏆' : '🏆 טבלת האלופים ושיאים'}</span>
          </button>
        )}

        {/* Direct PWA App Installation Button */}
        <div className="pt-1">
          <InstallAppButton language={language} variant="banner" />
        </div>

        {onOpenVideo && (
          <button
            onClick={() => {
              sounds.soundKeypress();
              onOpenVideo();
            }}
            className="w-full py-2.5 px-4 bg-white/[0.08] hover:bg-white/[0.14] active:scale-98 text-pink-300 hover:text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/15 shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Film className="w-4 h-4 text-pink-400" />
            <span>{isEn ? 'Watch Intro Video 🎬' : '🎬 צפה בסרטון הסבר ופתיח'}</span>
          </button>
        )}

        {/* Standalone Single File Download for GitHub */}
        <a
          href="/download-standalone"
          download="index.html"
          className="w-full py-2.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 active:scale-98 text-emerald-300 hover:text-white font-bold text-xs sm:text-sm rounded-2xl border border-emerald-500/30 shadow flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{isEn ? 'Download Standalone index.html (for GitHub)' : '📥 הורד קובץ index.html עצמאי ל-GitHub'}</span>
        </a>
      </div>

      {/* Bottom feature pill */}
      <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-400">
        <span>⏱️ {durationLabel}</span>
        <span>•</span>
        <span>👥 {isEn ? 'Live Multiplayer' : 'משחק מרובה משתתפים'}</span>
        <span>•</span>
        <span>✨ {isEn ? 'Instant PIN Room' : 'הצטרפות מהירה'}</span>
      </div>
    </div>
  );
};
