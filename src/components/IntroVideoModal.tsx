import React, { useState, useMemo } from 'react';
import { X, Play, Video, ExternalLink, Settings2, Check, Film } from 'lucide-react';
import { Language } from '../types/game';
import { sounds } from '../utils/audio';

interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  onUpdateVideoUrl?: (newUrl: string) => void;
  language?: Language;
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  onUpdateVideoUrl,
  language = 'he',
}) => {
  const isEn = language === 'en';
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [inputUrl, setInputUrl] = useState(videoUrl);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Convert various video URLs (YouTube, Vimeo, direct) into embeddable format
  const embedInfo = useMemo(() => {
    if (!videoUrl) return { type: 'none', src: '' };

    const clean = videoUrl.trim();

    // YouTube watch or short links
    const ytMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube',
        src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&enablejsapi=1`,
      };
    }

    // Vimeo
    const vimeoMatch = clean.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo',
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      };
    }

    // Direct MP4 / WebM
    if (/\.(mp4|webm|ogg)($|\?)/i.test(clean)) {
      return {
        type: 'direct',
        src: clean,
      };
    }

    // Default iframe fallback
    return {
      type: 'iframe',
      src: clean,
    };
  }, [videoUrl]);

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.soundKeypress();
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('ttg_hide_intro_video', 'true');
    }
    onClose();
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateVideoUrl && inputUrl.trim()) {
      onUpdateVideoUrl(inputUrl.trim());
      sounds.soundSuccess();
      setIsEditingUrl(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      dir={isEn ? 'ltr' : 'rtl'}
    >
      <div className="bg-gradient-to-b from-[#251347] via-[#1B113B] to-[#0D0B24] border border-white/20 rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 w-full max-w-xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative text-center">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 text-slate-400 hover:text-white rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer z-20`}
          title={isEn ? 'Close' : 'סגור'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30">
            <Film className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-300">
            {isEn ? 'Welcome to Time to Guess!' : 'ברוכים הבאים ל-Time to Guess!'}
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-3.5 max-w-md mx-auto">
          {isEn
            ? 'Watch this quick video to learn how to play and host games with your friends!'
            : 'צפו בסרטון הקצר כדי לגלות איך משחקים, מארחים ומנחשים יחד עם חברים!'}
        </p>

        {/* Video Player Frame (16:9 Aspect Ratio) */}
        <div className="w-full relative aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black mb-3.5 group">
          {embedInfo.type === 'youtube' || embedInfo.type === 'vimeo' || embedInfo.type === 'iframe' ? (
            <iframe
              src={embedInfo.src}
              title="Game Intro Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : embedInfo.type === 'direct' ? (
            <video
              src={embedInfo.src}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-white/5">
              <Video className="w-12 h-12 mb-2 text-pink-400 opacity-60" />
              <p className="text-xs sm:text-sm">
                {isEn ? 'No video URL specified yet' : 'עדיין לא הוגדר קישור לסרטון'}
              </p>
            </div>
          )}
        </div>

        {/* Change Video URL Form (Collapsible) */}
        {isEditingUrl ? (
          <form onSubmit={handleSaveUrl} className="w-full mb-3.5 p-3 bg-white/5 border border-white/10 rounded-2xl animate-fadeIn text-right">
            <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span>{isEn ? 'Paste YouTube / MP4 Video URL:' : 'הדבק קישור לסרטון (יוטיוב / MP4):'}</span>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer"
              >
                {isEn ? 'Cancel' : 'ביטול'}
              </button>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 bg-black/40 border border-white/20 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEn ? 'Save' : 'שמור'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between px-1 mb-3.5 text-xs text-slate-400">
            {/* Don't show again toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300 hover:text-white transition-all">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-white/30 text-pink-500 focus:ring-pink-500 bg-white/10 cursor-pointer"
              />
              <span>{isEn ? "Don't show automatically on start" : "אל תציג אוטומטית בכניסה"}</span>
            </label>

            {/* Change URL trigger */}
            {onUpdateVideoUrl && (
              <button
                type="button"
                onClick={() => {
                  setInputUrl(videoUrl);
                  setIsEditingUrl(true);
                }}
                className="flex items-center gap-1 text-[11px] text-pink-300 hover:text-pink-200 underline cursor-pointer"
              >
                <Settings2 className="w-3 h-3" />
                <span>{isEn ? 'Change Video' : 'החלף סרטון'}</span>
              </button>
            )}
          </div>
        )}

        {/* Action Button: Got It / Let's Play */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 active:scale-98 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>{isEn ? "Let's Play!" : 'הבנתי, בואו נתחיל לשחק!'}</span>
        </button>
      </div>
    </div>
  );
};
