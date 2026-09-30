import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles, Check } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Language } from '../types/game';
import { sounds } from '../utils/audio';

interface PWAInstallBannerProps {
  language?: Language;
  className?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  language = 'he',
  className = '',
}) => {
  const isEn = language === 'en';
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside installed standalone PWA, hide prompt
  if (isInstalled) {
    return null;
  }

  // Handle standard install prompt on Chromium / Android / Desktop
  const handleInstallClick = async () => {
    sounds.soundSuccess();
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  // Only display if installable or iOS device
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      <div className={`w-full max-w-sm mt-3 animate-fadeIn ${className}`} dir={isEn ? 'ltr' : 'rtl'}>
        {isInstallable ? (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="btn-3d btn-3d-cyan w-full py-3.5 px-4 text-white font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98 transition-all"
            title={isEn ? 'Install App to Home Screen' : 'התקן את האפליקציה למסך הבית'}
          >
            <span className="shimmer-sweep" />
            <Download className="w-5 h-5 text-cyan-100 drop-shadow shrink-0" strokeWidth={2.4} />
            <span className="tracking-wide">
              {isEn ? '📲 Install App to Home Screen' : '📲 התקן את האפליקציה למסך הבית'}
            </span>
          </button>
        ) : isIOS ? (
          <button
            type="button"
            onClick={() => {
              sounds.soundKeypress();
              setShowIOSGuide(true);
            }}
            className="btn-3d btn-3d-cyan w-full py-3.5 px-4 text-white font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98 transition-all"
            title={isEn ? 'Install App on iPhone' : 'התקן את האפליקציה באייפון'}
          >
            <span className="shimmer-sweep" />
            <Smartphone className="w-5 h-5 text-cyan-100 drop-shadow shrink-0" strokeWidth={2.4} />
            <span className="tracking-wide">
              {isEn ? '📲 Install App to Home Screen' : '📲 התקן את האפליקציה למסך הבית'}
            </span>
          </button>
        ) : null}
      </div>

      {/* iOS Safari Guided Installation Modal */}
      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          dir={isEn ? 'ltr' : 'rtl'}
        >
          <div className="bg-gradient-to-b from-[#2D1454] to-[#1E1B4B] border border-cyan-400/40 rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl text-center relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mx-auto mb-3 text-cyan-300 shadow-md">
              <Smartphone className="w-7 h-7" strokeWidth={2.2} />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white mb-1">
              {isEn ? 'Install on iPhone / iPad' : 'התקנה באייפון / אייפד 📲'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 font-medium">
              {isEn ? 'Play as a native full-screen app anytime' : 'שחקו כאפליקציה מלאה ומהירה במסך מלא'}
            </p>

            <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 text-xs sm:text-sm text-slate-200 text-right leading-relaxed" dir="rtl">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-pink-500/25 border border-pink-400/40 flex items-center justify-center text-pink-300 font-black shrink-0 text-xs mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  {isEn ? (
                    <span>Tap the <strong>Share button</strong> at the bottom of the screen ⎋ in Safari.</span>
                  ) : (
                    <span>לחצו על כפתור השיתוף בתחתית המסך <strong>⎋</strong> (סמל הריבוע עם החץ למעלה בספארי).</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-purple-300 font-black shrink-0 text-xs mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  {isEn ? (
                    <span>Scroll down and select <strong>"Add to Home Screen" ⊞</strong>.</span>
                  ) : (
                    <span>גללו מעט מטה בתפריט ובחרו <strong>"הוסף למסך הבית" ⊞</strong>.</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-black shrink-0 text-xs mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  {isEn ? (
                    <span>Tap <strong>"Add"</strong> in the top right corner to install!</span>
                  ) : (
                    <span>לחצו על <strong>"הוסף"</strong> בפינה העליונה — והאפליקציה תותקן במסך הבית!</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                sounds.soundKeypress();
                setShowIOSGuide(false);
              }}
              className="btn-3d btn-3d-cyan w-full py-3.5 rounded-xl text-white font-black text-sm cursor-pointer shadow-lg"
            >
              {isEn ? 'Got it, thanks! 👍' : 'הבנתי, תודה! 👍'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
