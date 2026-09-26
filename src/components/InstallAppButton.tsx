import React, { useState } from 'react';
import { Download, Smartphone, Check, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallGuideModal } from './InstallGuideModal';
import { Language } from '../types/game';
import { sounds } from '../utils/audio';

interface InstallAppButtonProps {
  language?: Language;
  variant?: 'banner' | 'button' | 'compact';
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  language = 'he',
  variant = 'banner',
}) => {
  const { isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const isEn = language === 'en';

  const handleInstallClick = async () => {
    sounds.soundKeypress();
    setIsInstalling(true);

    try {
      const outcome = await install();
      if (outcome === 'accepted') {
        sounds.soundSuccess();
        setJustInstalled(true);
      } else if (outcome === 'manual_needed' || isIOS) {
        setShowGuide(true);
      }
    } catch {
      setShowGuide(true);
    } finally {
      setIsInstalling(false);
    }
  };

  // If already installed
  if (isInstalled || justInstalled) {
    return (
      <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold animate-fadeIn">
        <Check className="w-4 h-4 text-emerald-400" />
        <span>{isEn ? 'App Installed on Home Screen' : 'האפליקציה מותקנת במסך הבית'}</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'banner' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="group relative w-full py-3.5 px-4 bg-gradient-to-r from-[#2A1045]/90 via-[#441368]/90 to-[#2A1045]/90 hover:from-[#37135C] hover:via-[#581788] hover:to-[#37135C] active:scale-98 border-2 border-pink-500/40 hover:border-pink-400 rounded-2xl shadow-xl shadow-purple-950/60 transition-all cursor-pointer overflow-hidden flex items-center justify-between gap-3 text-right"
          dir={isEn ? 'ltr' : 'rtl'}
        >
          {/* Animated glowing streak */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          {/* Left/Right Icon */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-none group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-white group-hover:text-pink-200 transition-colors">
                <span>{isEn ? 'Install App on Phone' : 'התקן את האפליקציה למכשיר'}</span>
                <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              </div>
              <div className="text-[11px] text-pink-200/70 font-medium">
                {isEn ? 'Full screen • No app store needed' : 'מסך מלא • חינם • גישה ישירה'}
              </div>
            </div>
          </div>

          {/* Action pill */}
          <div className="px-3 py-1.5 rounded-xl bg-pink-500/30 border border-pink-400/40 text-pink-200 text-xs font-black flex items-center gap-1 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-sm">
            <span>{isEn ? 'Install' : 'התקנה'}</span>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-pink-500/20 hover:bg-pink-500/35 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5 text-pink-400" />
          <span>{isEn ? 'Install App' : 'התקן אפליקציה'}</span>
        </button>
      )}

      {/* Installation Step-by-Step Guide Modal */}
      <InstallGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
        language={language}
      />
    </>
  );
};
