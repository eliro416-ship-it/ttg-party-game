import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CardPack, unlockPack } from '../data/packs';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface SpecialBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (packTitle: string) => void;
  language?: Language;
  targetPack?: CardPack | null;
}

export const SpecialBonusModal: React.FC<SpecialBonusModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  language = 'he',
}) => {
  const isEn = language === 'en';

  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState(isEn ? 'United States' : 'ישראל');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const hasClaimedBonus = typeof localStorage !== 'undefined' && localStorage.getItem('ttg_bonus_claimed') === 'true';

  const handleSubmitLead = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (hasClaimedBonus) {
      onClose();
      return;
    }

    const trimmedName = fullName.trim();
    const trimmedCountry = country.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setErrorMessage(isEn ? 'Please enter your full name' : 'נא להזין שם מלא');
      return;
    }
    if (!trimmedCountry) {
      setErrorMessage(isEn ? 'Please enter your country' : 'נא להזין מדינה');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage(isEn ? 'Please enter a valid email address' : 'נא להזין כתובת אימייל תקינה');
      return;
    }

    setIsSubmitting(true);
    sounds.soundKeypress();

    try {
      // 1. שליחה שקטה ברקע ישירות ל-FormSubmit עם מניעת ספאם (Honeypot)
      if (honeypot.trim().length === 0) {
        await fetch('https://formsubmit.co/ajax/eliro416@gmail.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            "שם מלא": trimmedName,
            "מדינה": trimmedCountry || "לא צוין",
            "אימייל": trimmedEmail,
            "_replyto": trimmedEmail,
            "_subject": `🎯 ליד חדש למשחק: ${trimmedName} (${trimmedCountry || 'ישראל'})`,
            "_template": "table",
            "_captcha": "false",
          }),
        }).catch((err) => {
          console.warn('Silent submission network note:', err);
        });
      } else {
        console.warn('Bot detected by honeypot. FormSubmit skipped.');
      }

      // 2. שמירה מקומית כגיבוי ב-localStorage
      const currentLeads = JSON.parse(localStorage.getItem('ttg_early_leads') || '[]');
      currentLeads.push({
        name: trimmedName,
        country: trimmedCountry,
        email: trimmedEmail,
        date: new Date().toISOString(),
      });
      localStorage.setItem('ttg_early_leads', JSON.stringify(currentLeads));
    } catch (error) {
      console.warn('Silent submission fallback:', error);
    } finally {
      setIsSubmitting(false);

      // 3. הגבלת המאגר לבדיוק 20 קלפים: פתיחת 10 קלפי בונוס ושמירת הדגל
      try {
        localStorage.setItem('ttg_bonus_claimed', 'true');
      } catch {}
      unlockPack('animals_pro');

      // Celebration
      sounds.soundSuccess();
      try {
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#fbbf24', '#f59e0b', '#ec4899', '#a855f7', '#10b981'],
        });
      } catch {}

      onSuccess('עולם החיות המורחב');

      // סגירת המודאל בצורה חלקה בתוך המשחק
      onClose();
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
      }}
      className="fixed inset-0 z-[100000] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sounds.soundKeypress();
          onClose();
        }
      }}
      dir={isEn ? 'ltr' : 'rtl'}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl p-5 sm:p-6 border border-amber-400/40 bg-[#0e1220]/95 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.25)] flex flex-col items-center text-center animate-scaleUp text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* כפתור סגירה */}
        <button
          type="button"
          onClick={() => {
            sounds.soundKeypress();
            onClose();
          }}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-xs active:scale-90 hover:text-white cursor-pointer transition-colors"
          title={isEn ? 'Close' : 'סגור'}
        >
          <X className="w-4 h-4" />
        </button>

        {hasClaimedBonus ? (
          /* ================= ALREADY CLAIMED NOTICE ================= */
          <div className="w-full flex flex-col items-center py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.3)] flex items-center justify-center text-3xl mb-3 animate-bounce">
              🎁
            </div>

            <h2 className="text-lg sm:text-xl font-black text-amber-300">
              {isEn ? 'Gift Already Claimed! ✔️' : 'המתנה מומשה בהצלחה! ✔️'}
            </h2>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {isEn
                ? 'You have already claimed your 10 free cards (20/20 active cards in deck)! The remaining packs will unlock upon our full payment system launch.'
                : 'כבר קיבלת 10 קלפים במתנה! שאר החבילות ייפתחו עם השקת מערכת התשלומים.'}
            </p>

            <div className="w-full my-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? '20 Active Cards in Deck' : '20 קלפים פעילים כעת במאגר שלך'}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {isEn ? 'Got it, let’s play! 🎮' : 'הבנתי, בואו נשחק! 🎮'}
            </button>
          </div>
        ) : (
          /* ================= LEAD CAPTURE FORM ================= */
          <div className="w-full flex flex-col items-center">
            {/* Anti-Spam Honeypot Bot-Trap (Hidden from human eyes) */}
            <input
              type="text"
              name="_gotcha"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none', position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* אייקון מתנה תלת-ממדי מונפש */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400/25 via-purple-600/30 to-pink-500/20 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center text-3xl mb-3 animate-bounce">
              🎁
            </div>

            {/* כותרת מבריקה */}
            <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 leading-tight">
              {isEn ? 'Special Gift from Time To Guess!' : 'מתנה מיוחדת מ-Time To Guess!'}
            </h2>

            {/* תיאור */}
            <div className="text-[11px] sm:text-xs text-slate-300 mt-2 leading-relaxed space-y-1">
              <p>
                {isEn
                  ? 'Our official billing system is in final testing and will launch very soon!'
                  : 'מערכת התשלומים הרשמית בהרצה סופית ותיפתח בקרוב מאוד!'}
              </p>
              <p className="text-amber-300 font-bold">
                {isEn
                  ? 'To say thank you, enjoy 10 free premium bonus cards right now!'
                  : 'כדי שלא תחכו – קבלו מאיתנו במתנה 10 קלפי פרימיום נוספים למשחק כבר עכשיו!'}
              </p>
              <p className="text-slate-400 text-[10px]">
                {isEn
                  ? 'Leave your details to be first to know when the full store goes live.'
                  : 'השאירו פרטים ונעדכן אתכם ראשונים כשהחנות המלאה תושק.'}
              </p>
            </div>

            {/* שדות הטופס */}
            <div className="w-full space-y-2.5 my-4">
              <div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isEn ? 'Full Name' : 'שם מלא'}
                  className={`w-full bg-slate-900/90 border border-slate-700 focus:border-amber-400 text-white rounded-xl px-3 py-2.5 text-xs placeholder-slate-500 outline-none transition-all ${
                    isEn ? 'text-left' : 'text-right'
                  }`}
                  dir={isEn ? 'ltr' : 'rtl'}
                  required
                />
              </div>

              <div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={isEn ? 'Country (e.g. USA)' : 'מדינה (לדוגמה: ישראל)'}
                  className={`w-full bg-slate-900/90 border border-slate-700 focus:border-amber-400 text-white rounded-xl px-3 py-2.5 text-xs placeholder-slate-500 outline-none transition-all ${
                    isEn ? 'text-left' : 'text-right'
                  }`}
                  dir={isEn ? 'ltr' : 'rtl'}
                  required
                />
              </div>

              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isEn ? 'Email address' : 'כתובת אימייל'}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-amber-400 text-white rounded-xl px-3 py-2.5 text-xs text-left placeholder-slate-500 outline-none transition-all"
                  dir="ltr"
                  required
                />
              </div>

              {errorMessage && (
                <div className="text-rose-400 text-[11px] font-bold text-center animate-fadeIn">
                  {errorMessage}
                </div>
              )}
            </div>

            {/* כפתור אישור ופתיחת הקלפים */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmitLead()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-[0_4px_0_#b45309] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{isEn ? 'Unlock My 10 Free Cards! 🚀' : 'פתחו לי 10 קלפים במתנה! 🚀'}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
