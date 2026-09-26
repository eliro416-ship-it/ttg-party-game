import React from 'react';
import { X, Smartphone, Share, PlusSquare, MoreVertical, DownloadCloud, CheckCircle2 } from 'lucide-react';
import { Language } from '../types/game';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  language?: Language;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
  language = 'he',
}) => {
  if (!isOpen) return null;
  const isEn = language === 'en';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      dir={isEn ? 'ltr' : 'rtl'}
    >
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#2A1045] to-[#120E2E] border border-white/25 rounded-3xl p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-slate-300 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto mb-3.5 bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 rounded-2xl p-[3px] shadow-lg flex items-center justify-center">
          <div className="w-full h-full bg-[#110B29] rounded-[13px] flex items-center justify-center">
            <Smartphone className="w-7 h-7 text-pink-400" />
          </div>
        </div>

        <h3 className="text-xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-300">
          {isEn ? 'Install Time to Guess' : 'התקנת הזמן לנחש'}
        </h3>
        <p className="text-xs text-slate-300 text-center mb-5 leading-relaxed">
          {isEn
            ? 'Install the full app on your home screen for instant access and full screen mode.'
            : 'התקינו את האפליקציה המלאה ישירות על מסך הבית לגישה מיידית וללא תלות בחנות אפליקציות.'}
        </p>

        {/* Instructions based on platform */}
        <div className="space-y-3 mb-6">
          {isIOS ? (
            <>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.07] border border-white/10">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-none">
                  <Share className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-white mb-0.5">
                    {isEn ? 'Step 1: Tap Share' : 'שלב 1: לחצו על כפתור השיתוף'}
                  </div>
                  <div className="text-slate-300">
                    {isEn
                      ? 'Tap the Share icon at the bottom of Safari browser.'
                      : 'לחצו על סמל השיתוף בתחתית דפדפן ספארי (Safari).'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.07] border border-white/10">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex-none">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-white mb-0.5">
                    {isEn ? 'Step 2: Add to Home Screen' : 'שלב 2: הוספה למסך הבית'}
                  </div>
                  <div className="text-slate-300">
                    {isEn
                      ? 'Scroll down and select "Add to Home Screen".'
                      : 'גללו מטה בתפריט ובחרו ב-"הוסף למסך הבית" (Add to Home Screen).'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.07] border border-white/10">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30 flex-none">
                  <MoreVertical className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-white mb-0.5">
                    {isEn ? 'Step 1: Open Menu' : 'שלב 1: פתחו את תפריט הדפדפן'}
                  </div>
                  <div className="text-slate-300">
                    {isEn
                      ? 'Tap the 3 dots menu (⋮) in Chrome or Edge.'
                      : 'לחצו על 3 הנקודות (⋮) בפינת הדפדפן שלכם (Chrome או Edge).'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.07] border border-white/10">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-none">
                  <DownloadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-white mb-0.5">
                    {isEn ? 'Step 2: Install App' : 'שלב 2: התקנת האפליקציה'}
                  </div>
                  <div className="text-slate-300">
                    {isEn
                      ? 'Select "Install app" or "Add to Home screen".'
                      : 'בחרו ב-"התקן אפליקציה" או "הוסף למסך הבית".'}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-none" />
            <span>
              {isEn
                ? 'Enjoy faster loading, offline play & full screen experience!'
                : 'תיהנו מחוויית מסך מלא, מהירות גבוהה ומשחק חלק!'}
            </span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 active:scale-95 font-extrabold text-sm rounded-xl text-white shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
        >
          {isEn ? 'Got it 👍' : 'הבנתי, תודה 👍'}
        </button>
      </div>
    </div>
  );
};
