import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Upload, Check, RefreshCw, Film } from 'lucide-react';
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
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [inputUrl, setInputUrl] = useState(videoUrl);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When opening, reset fade state and play video
  useEffect(() => {
    if (isOpen) {
      setIsFadingOut(false);
      setVideoError(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy might catch it if not muted
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [isOpen, videoUrl]);

  // Determine if URL is YouTube / Vimeo / Direct
  const embedInfo = useMemo(() => {
    const clean = (videoUrl || '/intro.mp4').trim();

    // YouTube watch or short links
    const ytMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return {
        type: 'youtube' as const,
        src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&enablejsapi=1`,
      };
    }

    // Vimeo
    const vimeoMatch = clean.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return {
        type: 'vimeo' as const,
        src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      };
    }

    // Direct MP4 / WebM / blob / relative path
    return {
      type: 'direct' as const,
      src: clean,
    };
  }, [videoUrl]);

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.soundKeypress();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (dontShowAgain && typeof window !== 'undefined') {
      localStorage.setItem('ttg_hide_intro_video', 'true');
    }
    // Smooth fade out transition matching CSS
    setIsFadingOut(true);
    setTimeout(() => {
      onClose();
      setIsFadingOut(false);
    }, 600);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateVideoUrl && inputUrl.trim()) {
      onUpdateVideoUrl(inputUrl.trim());
      sounds.soundSuccess();
      setShowSettings(false);
      setVideoError(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateVideoUrl) {
      const objectUrl = URL.createObjectURL(file);
      onUpdateVideoUrl(objectUrl);
      sounds.soundSuccess();
      setShowSettings(false);
      setVideoError(false);
    }
  };

  const toggleMute = () => {
    sounds.soundKeypress();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div
      id="intro-video-overlay"
      className={isFadingOut ? 'hidden' : ''}
      dir={isEn ? 'ltr' : 'rtl'}
    >
      {/* כפתור דלג / Skip */}
      <button
        type="button"
        className="skip-btn"
        onClick={handleClose}
      >
        {isEn ? 'Skip / דלג ✕' : 'דלג / Skip ✕'}
      </button>

      {/* בקרי שליטה עליונים (קול, הגדרות, החלפת סרטון) */}
      <div className="absolute top-6 right-5 flex items-center gap-2 z-[10001]">
        {/* Toggle Sound */}
        {embedInfo.type === 'direct' && (
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 bg-black/65 hover:bg-white/20 text-white rounded-full border border-white/30 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
            title={isMuted ? (isEn ? 'Unmute' : 'הפעל צליל') : (isEn ? 'Mute' : 'השתק')}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-pink-300" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        )}

        {/* Settings / Change Video */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-black/65 hover:bg-white/20 text-white rounded-full border border-white/30 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          title={isEn ? 'Change Video' : 'החלף סרטון'}
        >
          <Settings className="w-4 h-4 text-yellow-300" />
        </button>
      </div>

      {/* נגן הוידאו - גודל מותאם אישית למכשיר */}
      <div className="w-full h-full max-w-[480px] flex items-center justify-center relative overflow-hidden">
        {embedInfo.type === 'direct' ? (
          <video
            ref={videoRef}
            id="intro-player"
            playsInline
            autoPlay
            muted={isMuted}
            onEnded={handleClose}
            onError={() => {
              // If external link fails, fallback to local downloaded copy /intro.mp4
              if (embedInfo.src !== '/intro.mp4' && videoRef.current) {
                videoRef.current.src = '/intro.mp4';
                videoRef.current.play().catch(() => {});
              } else {
                setVideoError(true);
              }
            }}
            src={embedInfo.src}
            className="w-full h-full object-cover"
            {...{ 'webkit-playsinline': 'true' }}
          >
            <source src={embedInfo.src} type="video/mp4" />
            <source src="/intro.mp4" type="video/mp4" />
            {isEn ? 'Your browser does not support video playback.' : 'הדפדפן שלך אינו תומך בניגון וידאו.'}
          </video>
        ) : (
          <iframe
            src={embedInfo.src}
            title="Intro Video"
            className="w-full h-full border-0 object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}

        {/* גיבוי במקרה של שגיאה בטעינת קובץ וידאו מקומי */}
        {videoError && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
            <Film className="w-12 h-12 text-pink-400 mb-3 animate-pulse" />
            <h3 className="text-lg font-bold text-white mb-2">
              {isEn ? 'Intro Video Not Found' : 'סרטון הפתיחה לא נמצא'}
            </h3>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">
              {isEn
                ? 'Upload your intro.mp4 video file or enter a YouTube/MP4 URL to play it.'
                : 'באפשרותך להעלות קובץ וידאו intro.mp4 או להזין קישור מיוטיוב.'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Upload className="w-4 h-4" />
                <span>{isEn ? 'Upload Video' : 'בחר קובץ מהמחשב'}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {isEn ? 'Continue to App' : 'המשך לאפליקציה'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* חלונית הגדרות להחלפת סרטון או העלאת קובץ (Overlay Settings) */}
      {showSettings && (
        <div className="absolute inset-x-4 top-20 max-w-md mx-auto bg-[#1a0f30]/95 border border-white/20 rounded-2xl p-4 shadow-2xl backdrop-blur-xl z-[10002] animate-fadeIn text-right">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h4 className="font-extrabold text-sm text-yellow-300">
              {isEn ? 'Intro Video Settings' : 'הגדרות סרטון פתיחה'}
            </h4>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* העלאת קובץ וידאו */}
          <div className="mb-3">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isEn ? 'Upload video file (intro.mp4):' : 'העלה קובץ וידאו מהמכשיר (intro.mp4):'}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-dashed border-white/30 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4 text-pink-400" />
              <span>{isEn ? 'Select MP4 File...' : 'בחר קובץ סרטון מהמכשיר...'}</span>
            </button>
          </div>

          {/* או הדבקת קישור */}
          <form onSubmit={handleSaveUrl} className="mb-3">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isEn ? 'Or paste video link (YouTube / MP4 URL):' : 'או הדבק קישור (יוטיוב או קובץ MP4):'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="/intro.mp4 או https://..."
                className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-pink-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:brightness-110 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isEn ? 'Save' : 'שמור'}</span>
              </button>
            </div>
          </form>

          {/* כפתור החזרה לסרטון ברירת מחדל */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                if (onUpdateVideoUrl) {
                  onUpdateVideoUrl('/intro.mp4');
                  setInputUrl('/intro.mp4');
                  sounds.soundSuccess();
                  setShowSettings(false);
                }
              }}
              className="text-pink-300 hover:text-pink-200 flex items-center gap-1 underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isEn ? 'Reset to default intro.mp4' : 'איפוס ל-intro.mp4 ברירת מחדל'}</span>
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-pink-500 bg-white/10 border-white/30 cursor-pointer"
              />
              <span>{isEn ? "Don't show on start" : "אל תציג בכניסה"}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
