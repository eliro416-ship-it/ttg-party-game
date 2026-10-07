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
      {/* סרגל עליון משודרג */}
      <div className="top-nav-bar">
        <div className="top-icons-group">
          <button
            className="top-btn"
            id="musicBtn"
            aria-label="Music"
            type="button"
            onClick={handleToggleMusic}
            title={isMusicPlaying ? 'Mute Music' : 'Play Music'}
          >
            🎵
          </button>
          <button
            className="top-btn"
            id="soundBtn"
            aria-label="Sound"
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              onToggleMute();
            }}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            className="top-btn"
            id="shareBtn"
            aria-label="Share"
            type="button"
            onClick={handleWhatsAppShare}
            title={isEn ? 'Share' : 'שיתוף'}
          >
            🔗
          </button>
          <button
            className="top-btn"
            id="galleryBtn"
            aria-label="Gallery"
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              if (onOpenCardsGallery) onOpenCardsGallery();
            }}
            title={isEn ? 'Gallery' : 'מאגר תמונות'}
          >
            🖼️
          </button>
          <button
            className="top-btn"
            id="videoBtn"
            aria-label="Video"
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              if (onOpenVideo) onOpenVideo();
            }}
            title={isEn ? 'Video' : 'סרטון פתיחה'}
          >
            🎬
          </button>
          <button
            className="top-btn"
            id="gemsBtn"
            aria-label="Gems"
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              if (onOpenStore) onOpenStore();
            }}
            title={isEn ? 'Store' : 'חנות יהלומים'}
          >
            💎
          </button>
        </div>
        <button
          className="lang-pill"
          id="langBtn"
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            onToggleLanguage();
          }}
          title={isEn ? 'עבור לעברית' : 'Switch to English'}
        >
          <span>🌐</span>
          <span>{isEn ? 'English' : 'עברית'}</span>
        </button>
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

      {/* שני כפתורי אבני חן */}
      <div className="dual-gem-container">
        <button
          className="gem-btn gem-emerald btn-green"
          id="hostBtn"
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            onOpenHost();
          }}
          title={isEn ? 'Host Game' : 'פתח משחק כמארח'}
        >
          <span className="gem-facet" />
          <span className="gem-label">👑 {isEn ? 'Host' : 'מארח'}</span>
        </button>
        <button
          className="gem-btn gem-amethyst btn-purple"
          id="joinBtn"
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            onOpenPlayer();
          }}
          title={isEn ? 'Join as Player' : 'הצטרף כשחקן'}
        >
          <span className="gem-facet" />
          <span className="gem-label">🎮 {isEn ? 'Join' : 'משתתף'}</span>
        </button>
      </div>

      {/* PWA Install Banner */}
      <div className="w-full max-w-[420px]">
        <PWAInstallBanner language={language} />
      </div>

      {/* כפתור זהב יחיד למאגר הקלפים - האלמנט התחתון ביותר */}
      <div className="bottom-gold-container">
        <button
          className="gold-shop-btn btn-blue"
          id="cardStoreBtn"
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            if (onOpenCardsGallery) {
              onOpenCardsGallery();
            } else if (onOpenStore) {
              onOpenStore();
            }
          }}
          title={isEn ? 'Card Gallery & Shop' : 'למאגר ולחנות הקלפים'}
        >
          <span className="gold-shine" />
          <span className="gold-text">🎴 {isEn ? 'Card Gallery & Shop 🛒' : 'למאגר ולחנות הקלפים 🛒'}</span>
        </button>
      </div>
    </div>
  );
};
