import React, { useState, useEffect } from 'react';
import { Share2, Music } from 'lucide-react';
import { sounds } from '../utils/audio';
import { bgMusic } from '../utils/backgroundMusic';
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
  theme?: 'sky-3d' | 'cosmic-dark';
  onToggleTheme?: () => void;
}

export const RoleSelectScreen: React.FC<RoleSelectScreenProps> = ({
  onOpenHost,
  onOpenPlayer,
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
  const durationLabel = turnDuration === 60 ? (isEn ? '1 Minute' : 'דקה') : `${turnDuration} ${isEn ? 'sec' : 'שנ\''} `;

  // Continuous Background Music State & Listener
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(() => bgMusic.getIsPlaying());

  useEffect(() => {
    const unsubscribe = bgMusic.subscribe((playing) => {
      setIsMusicPlaying(playing);
    });
    return unsubscribe;
  }, []);

  const handleToggleMusic = () => {
    sounds.soundKeypress();
    const nextState = bgMusic.toggle();
    setIsMusicPlaying(nextState);
  };

  const handleWhatsAppShare = () => {
    sounds.soundKeypress();
    const shareMessage =
      `יצרנו משחק חברתי חדש בטירוף לסמארטפון – אחד מחזיק בתמונה, כולם חוקרים ומנחשים נגד השעון! 🦁⏱️\n\n` +
      `🎁 *מתנה מיוחדת למצטרפים עכשיו:*\n` +
      `פותחים משחק ומקבלים *10 קלפי פרימיום נוספים במתנה* בלחיצה על החנות!\n\n` +
      `אין צורך בהורדה, נכנסים ישר מהדפדפן ומשחקים:\n` +
      `👉 https://time-to-guess.netlify.app\n\n` +
      `בואו נראה מי הראשון שינחש! 🔥`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center text-center animate-fadeIn select-none relative" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between gap-1 px-1 pt-0 pb-1.5 z-20 max-w-[420px]">
        {/* Left: 🌐 Language Toggle */}
        <button
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            onToggleLanguage();
          }}
          className="pill-item flex items-center gap-1.5 cursor-pointer hover:scale-105 active:translate-y-0.5 transition-all text-xs font-black text-cyan-200 select-none py-1.5 px-3"
          title={isEn ? 'עבור לעברית' : 'Switch to English'}
        >
          <span className="text-sm">🌐</span>
          <span>{isEn ? 'עברית' : 'English'}</span>
        </button>

        {/* Right: 3D Icons (Diamonds, Video, Gallery, Share, Audio SFX, Music) */}
        <div className="flex items-center gap-1.5">
          {/* Store Diamonds */}
          {onOpenStore && (
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenStore();
              }}
              className="top-icon-btn cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              title={isEn ? 'Store' : 'חנות קלפים'}
            >
              💎
            </button>
          )}

          {/* Intro Video */}
          {onOpenVideo && (
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenVideo();
              }}
              className="top-icon-btn cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              title={isEn ? 'Watch intro video' : 'צפייה בסרטון הפתיחה'}
            >
              <span className="text-base">🎬</span>
            </button>
          )}

          {/* Gallery */}
          {onOpenCardsGallery && (
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenCardsGallery();
              }}
              className="top-icon-btn cursor-pointer hover:scale-110 active:scale-95 transition-transform"
              title={isEn ? 'Gallery' : 'מאגר תמונות'}
            >
              🖼️
            </button>
          )}

          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="top-icon-btn cursor-pointer hover:scale-110 active:scale-95 transition-transform text-cyan-400"
            title={isEn ? 'Share' : 'שיתוף'}
          >
            <Share2 className="w-4 h-4 text-cyan-400" strokeWidth={2.6} />
          </button>

          {/* Audio SFX */}
          <button
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              onToggleMute();
            }}
            className="top-icon-btn cursor-pointer hover:scale-110 active:scale-95 transition-transform text-sm"
            title={isMuted ? (isEn ? 'Unmute SFX' : 'הפעל אפקטים') : (isEn ? 'Mute SFX' : 'השתק אפקטים')}
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
          </button>

          {/* Background Music */}
          <button
            type="button"
            onClick={handleToggleMusic}
            className="top-icon-btn cursor-pointer hover:scale-110 active:scale-95 transition-transform text-sm"
            title={isMusicPlaying ? 'Mute Music' : 'Play Music'}
          >
            <Music className={`w-3.5 h-3.5 ${isMusicPlaying ? 'text-pink-400' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>

      {/* 3D Title "TTG TIME TO GUESS" */}
      <div className="relative mx-auto mt-0.5 mb-1 select-none flex flex-col items-center">
        {/* תיקון סדר אותיות הלוגו למניעת היפוך */}
        <div className="logo-title" style={{ direction: 'ltr', display: 'inline-flex', gap: '2px', alignItems: 'center', justifyContent: 'center' }}>
          <span
            className="text-[56px] sm:text-[64px] font-black leading-none select-none tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-[#FFA7C4] via-[#F43F5E] to-[#9F1239]"
            style={{
              fontFamily: "'Rubik', system-ui, sans-serif",
              WebkitTextStroke: '2px #FFFFFF',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.7))',
            }}
          >
            T
          </span>
          <span
            className="text-[56px] sm:text-[64px] font-black leading-none select-none tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-[#BAE6FD] via-[#38BDF8] to-[#0284C7]"
            style={{
              fontFamily: "'Rubik', system-ui, sans-serif",
              WebkitTextStroke: '2px #FFFFFF',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.7))',
            }}
          >
            T
          </span>
          <span
            className="text-[56px] sm:text-[64px] font-black leading-none select-none tracking-normal text-transparent bg-clip-text bg-gradient-to-b from-[#E0E7FF] via-[#818CF8] to-[#4338CA]"
            style={{
              fontFamily: "'Rubik', system-ui, sans-serif",
              WebkitTextStroke: '2px #FFFFFF',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.7))',
            }}
          >
            G
          </span>
        </div>

        <div className="flex items-center justify-center -mt-2 select-none">
          <span
            className="text-[13px] sm:text-[14px] font-black tracking-[0.2em] text-[#FFE4E6] uppercase"
            style={{
              fontFamily: "'Rubik', system-ui, sans-serif",
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            }}
          >
            TIME TO GUESS
          </span>
        </div>
      </div>

      {/* Sub-Headline: "הזמן לנחש" + "נחשו את המילה לפני שהזמן נגמר!" */}
      <div className="mt-0.5 mb-1.5 select-none">
        <h1
          className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight"
          style={{
            fontFamily: "'Rubik', system-ui, sans-serif",
            textShadow: '0 3px 6px rgba(0,0,0,0.7)',
          }}
        >
          {t.title}
        </h1>
        <p
          className="text-xs sm:text-[13px] font-black text-[#FDE047] mt-0.5 tracking-wide"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {isEn ? 'Guess the word before time runs out!' : 'נחשו את המילה לפני שהזמן נגמר!'}
        </p>
      </div>

      {/* 2. לוח החוקים כקלף עבה עם מסגרת עץ + כתר זהב מעל הלוח */}
      <div id="rules-box" className="rules-box rules-card w-full max-w-[420px] text-right">
        {/* כתר זהב מעל הלוח */}
        <div className="crown-top">👑</div>

        {/* כותרת החוקים */}
        <h2>{t.rulesTitle || 'חוקי המשחק בקצרה'}</h2>

        {/* רשימת החוקים בקלף עם טקסט כהה וחד */}
        <ul className="space-y-3 list-none p-0 m-0 text-xs sm:text-[12.5px] leading-relaxed">
          {/* חוק 1: אחד/ת מחזיק/ה בתמונה */}
          <li className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">🎭</span>
            <div>
              <div className="font-black text-[#1E1B4B] text-xs sm:text-[13px]">
                {isEn ? 'One holds the picture:' : 'אחד/ת מחזיק/ה בתמונה:'}
              </div>
              <p className="text-[#3A1B08] font-bold text-[11px] sm:text-xs m-0">
                {isEn
                  ? 'Only they see it and answer questions (secret on server).'
                  : 'רק הוא/היא רואה אותה ועונה לשאלות (הסוד שמור בשרת).'}
              </p>
            </div>
          </li>

          {/* חוק 2: שותף / שואלים/ות ומנחשים/ות */}
          <li className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">🎯</span>
            <div>
              <div className="font-black text-[#6B21A8] text-xs sm:text-[13px]">
                {isEn ? 'Partners / Asking & Guessing:' : 'שותף - שואלים/ות ומנחשים/ות:'}
              </div>
              <p className="text-[#3A1B08] font-bold text-[11px] sm:text-xs m-0">
                {isEn
                  ? 'Other players see blank boxes and investigate.'
                  : 'שאר המשתתפים/ות רואים/ות קוביות ריקות וחוקרים/ות אותו/ה.'}
              </p>
            </div>
          </li>

          {/* חוק 3: המשתתפים */}
          <li className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">⌛</span>
            <div>
              <div className="font-black text-[#B45309] text-xs sm:text-[13px]">
                {isEn ? 'Participants:' : 'המשתתפים:'}
              </div>
              <p className="text-[#3A1B08] font-bold text-[11px] sm:text-xs m-0">
                {isEn
                  ? `${durationLabel} per turn: Real cloud sync! First to type correctly wins a point!`
                  : `${durationLabel} לתור: סנכרון שעון ענן מדויק! הראשון שמקליד נכון זוכה בנקודה!`}
              </p>
            </div>
          </li>

          {/* חוק 4: מנצח */}
          <li className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">🔄</span>
            <div>
              <div className="font-black text-[#047857] text-xs sm:text-[13px]">
                {isEn ? 'Turn Pass & Winner:' : 'מנצח - התור עובר:'}
              </div>
              <p className="text-[#3A1B08] font-bold text-[11px] sm:text-xs m-0">
                {isEn
                  ? 'When time is up or on a correct guess, the picture moves to the next player.'
                  : 'בסיום הזמן או בניחוש מוצלח – התמונה עוברת למשתתף/ת הבא/ה.'}
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* 3. כפתורי 3D Bubble קשיחים עם שולי לחיצה */}
      <div className="w-full max-w-[420px] mt-1 mb-2">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* כפתור סגול: השתתף */}
          <button
            type="button"
            id="btn-purple"
            onClick={() => {
              sounds.soundKeypress();
              onOpenPlayer();
            }}
            className="btn btn-3d btn-purple flex items-center justify-center text-center"
          >
            <span>{isEn ? 'Join' : 'השתתף'}</span>
          </button>

          {/* כפתור ירוק: השחקן 🎮 */}
          <button
            type="button"
            id="btn-green"
            onClick={() => {
              sounds.soundKeypress();
              onOpenHost();
            }}
            className="btn btn-3d btn-green flex items-center justify-center gap-1 text-center"
          >
            <span>{isEn ? 'Host' : 'השחקן'}</span>
            <span>🎮</span>
          </button>

          {/* כפתור תכלת: שותף */}
          <button
            type="button"
            id="btn-blue"
            onClick={() => {
              sounds.soundKeypress();
              if (onOpenStore) onOpenStore();
              else onOpenHost();
            }}
            className="btn btn-3d btn-blue flex items-center justify-center text-center"
          >
            <span>{isEn ? 'Share' : 'שותף'}</span>
          </button>
        </div>

        {/* PWA Install Banner */}
        <PWAInstallBanner language={language} />
      </div>

      {/* 4. שורת הגדרות תחתונה */}
      <div className="bottom-pill-bar w-full max-w-[420px]">
        {/* כפתור גלולה שמאלי: הצטרפות מהירה */}
        <button
          type="button"
          id="btn-fast-join"
          onClick={() => {
            sounds.soundKeypress();
            onOpenPlayer();
          }}
          className="bottom-bar-item pill pill-item text-cyan-200 cursor-pointer active:translate-y-0.5 transition-transform"
        >
          {isEn ? 'Fast PIN Join' : 'הצטרפות מהירה'}
        </button>

        {/* כפתור גלולה אמצעי: משחק מרובה משתתפים */}
        <button
          type="button"
          id="btn-multiplayer"
          onClick={() => {
            sounds.soundKeypress();
            onOpenHost();
          }}
          className="bottom-bar-item pill pill-item text-cyan-200 cursor-pointer active:translate-y-0.5 transition-transform"
        >
          {isEn ? 'Live Multiplayer' : 'משחק מרובה משתתפים'}
        </button>

        {/* גלולה ימנית: זמן תור */}
        <div className="bottom-bar-item pill pill-item text-amber-300 flex items-center gap-1">
          <span>{durationLabel}</span>
          <span>⏱️</span>
        </div>
      </div>
    </div>
  );
};
