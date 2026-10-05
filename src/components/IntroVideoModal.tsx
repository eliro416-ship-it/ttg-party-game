import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Language } from '../types/game';
import { sounds } from '../utils/audio';

export interface IntroVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  onTransitionToDashboard?: () => void;
  onTransitionToGame?: () => void;
  onUpdateVideoUrl?: (newUrl: string) => void;
  language?: Language;
}

interface ParsedVideo {
  type: 'cloudinary' | 'direct' | 'youtube' | 'vimeo' | 'iframe' | 'none';
  directSrc: string;
  embedSrc: string;
  cloudName?: string;
  publicId?: string;
}

export function parseVideoUrl(url: string): ParsedVideo {
  if (!url) return { type: 'none', directSrc: '', embedSrc: '' };

  const clean = url.trim();

  // Cloudinary embed or player url
  try {
    if (clean.includes('player.cloudinary.com') || clean.includes('cloudinary.com/embed')) {
      const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
      const cloudName = parsed.searchParams.get('cloud_name');
      const publicId = parsed.searchParams.get('public_id');
      if (cloudName && publicId) {
        return {
          type: 'cloudinary',
          cloudName,
          publicId,
          directSrc: `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`,
          embedSrc: clean.includes('autoplay') ? clean : `${clean}${clean.includes('?') ? '&' : '?'}autoplay=true`,
        };
      }
    }
  } catch {
    // fallback regex below
  }

  const cldEmbedMatch = clean.match(/player\.cloudinary\.com\/embed\/?\?(?:.*&)?cloud_name=([^&]+).*(?:&)?public_id=([^&#]+)/i);
  if (cldEmbedMatch) {
    const cloudName = cldEmbedMatch[1];
    const publicId = cldEmbedMatch[2];
    return {
      type: 'cloudinary',
      cloudName,
      publicId,
      directSrc: `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`,
      embedSrc: clean.includes('autoplay') ? clean : `${clean}${clean.includes('?') ? '&' : '?'}autoplay=true`,
    };
  }

  const cldUploadMatch = clean.match(/res\.cloudinary\.com\/([^/]+)\/video\/upload\/(?:v\d+\/)?([^.]+)(?:\.mp4)?/i);
  if (cldUploadMatch) {
    const cloudName = cldUploadMatch[1];
    const publicId = cldUploadMatch[2];
    return {
      type: 'cloudinary',
      cloudName,
      publicId,
      directSrc: `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}.mp4`,
      embedSrc: `https://player.cloudinary.com/embed/?cloud_name=${cloudName}&public_id=${publicId}&autoplay=true`,
    };
  }

  // Direct MP4 / WebM / OGG
  if (/\.(mp4|webm|ogg)($|\?)/i.test(clean)) {
    return {
      type: 'direct',
      directSrc: clean,
      embedSrc: clean,
    };
  }

  // YouTube
  const ytMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      directSrc: '',
      embedSrc: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&enablejsapi=1`,
    };
  }

  // Vimeo
  const vimeoMatch = clean.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      directSrc: '',
      embedSrc: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
    };
  }

  // Default iframe
  return {
    type: 'iframe',
    directSrc: '',
    embedSrc: clean,
  };
}

export const IntroVideoModal: React.FC<IntroVideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  onTransitionToDashboard,
  onTransitionToGame,
  language = 'he',
}) => {
  const isEn = language === 'en';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [needsSoundTap, setNeedsSoundTap] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const parsed = useMemo(() => parseVideoUrl(videoUrl), [videoUrl]);

  // Reset isPlaying when opened or url changes
  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
    }
  }, [isOpen, videoUrl]);

  // Safety fallback: reveal video gracefully after 2.5s even if event is delayed by mobile browser
  useEffect(() => {
    if (!isOpen || isPlaying) return;
    const timer = setTimeout(() => {
      setIsPlaying(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, isPlaying]);

  // Transition to dashboard handler (Skip button or natural onEnded)
  const handleTransition = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    sounds.soundSuccess();
    if (onTransitionToDashboard) {
      onTransitionToDashboard();
    } else if (onTransitionToGame) {
      onTransitionToGame();
    } else {
      onClose();
    }
  }, [onTransitionToDashboard, onTransitionToGame, onClose]);

  const handleSkip = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    sounds.soundKeypress();
    handleTransition();
  }, [handleTransition]);

  // Autoplay attempt when opened
  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = isMuted;
    video.defaultMuted = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Autoplay started successfully
        })
        .catch(() => {
          // Autoplay was blocked by browser policy; ensure muted and try again
          video.muted = true;
          video.defaultMuted = true;
          setIsMuted(true);
          setNeedsSoundTap(true);
          video.play().catch(() => {});
        });
    }
  }, [isOpen, videoUrl, parsed.directSrc, isMuted]);

  // Fallback timer for iframe embeds (e.g. YouTube) where onEnded doesn't fire across origins
  useEffect(() => {
    if (!isOpen) return;
    if (!parsed.directSrc && parsed.embedSrc) {
      const timer = setTimeout(() => {
        handleTransition();
      }, 10500); // 10.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, parsed.directSrc, parsed.embedSrc, handleTransition]);

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      setNeedsSoundTap(false);
    }
  };

  const handleTapScreen = () => {
    if (needsSoundTap && videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
      setIsMuted(false);
      setNeedsSoundTap(false);
    }
  };

  if (!isOpen) return null;

  const SPARKLES = [
    { top: '20%', left: '26%', size: 'w-2 h-2', delay: '0s' },
    { top: '24%', right: '22%', size: 'w-2.5 h-2.5', delay: '0.4s' },
    { top: '38%', left: '16%', size: 'w-1.5 h-1.5', delay: '0.8s' },
    { top: '48%', right: '18%', size: 'w-2 h-2', delay: '1.2s' },
    { bottom: '34%', left: '22%', size: 'w-2.5 h-2.5', delay: '0.6s' },
    { bottom: '26%', right: '25%', size: 'w-1.5 h-1.5', delay: '1s' },
    { top: '16%', right: '38%', size: 'w-2 h-2', delay: '0.3s' },
    { bottom: '22%', left: '38%', size: 'w-2 h-2', delay: '0.9s' },
  ];

  return (
    <div
      onClick={handleTapScreen}
      className="fixed inset-0 z-50 bg-[#0a0818] flex items-center justify-center overflow-hidden m-0 p-0 select-none cursor-pointer"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        inset: 0,
      }}
      dir={isEn ? 'ltr' : 'rtl'}
    >
      {/* 1. מסך הטעינה המעוצב החדש - מוצג תמיד מעל הכל עד שהווידאו מנגן בפועל */}
      {!isPlaying && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0818] transition-opacity duration-700">
          {/* נקודות זוהר צהוב/זהב עדינות */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {SPARKLES.map((s, idx) => (
              <div
                key={idx}
                className={`absolute ${s.size} rounded-full bg-gradient-to-tr from-amber-300 via-yellow-200 to-white shadow-[0_0_12px_rgba(251,191,36,0.9)] animate-pulse`}
                style={{
                  top: s.top,
                  left: s.left,
                  right: s.right,
                  bottom: s.bottom,
                  animationDelay: s.delay,
                  animationDuration: '2.2s',
                }}
              />
            ))}
          </div>

          {/* תוכן מסך הטעינה החדש עם ההילה והלוגו */}
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-40 animate-pulse" />
            <img 
              src="https://res.cloudinary.com/afjcyngg/image/upload/v1791185883/IMG-20261005-WA0001.jpg" 
              alt="TTG" 
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain relative z-10 rounded-3xl shadow-[0_0_50px_rgba(59,130,246,0.35),0_0_80px_rgba(236,72,153,0.25)]"
            />
          </div>
          
          <div className="flex flex-col items-center gap-2 mt-8 z-10">
            <div className="w-28 h-1 rounded-full bg-white/10 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full w-full animate-pulse" />
            </div>
            <span className="text-[11px] font-medium tracking-widest uppercase text-purple-300/70">
              {isEn ? 'Loading Experience...' : 'טוען חוויה...'}
            </span>
          </div>
        </div>
      )}

      {/* 2. אלמנט הווידאו - מוסתר הרמטית (visibility: hidden ו-opacity: 0) עד שהווידאו ממש מנגן */}
      {parsed.directSrc ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          loop={false}
          src={parsed.directSrc}
          preload="auto"
          onEnded={handleTransition}
          onPlaying={() => setIsPlaying(true)}
          style={{
            visibility: isPlaying ? 'visible' : 'hidden',
            opacity: isPlaying ? 1 : 0,
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            inset: 0,
            objectFit: 'cover',
          }}
          className="w-full h-full object-cover transition-opacity duration-500 relative z-10"
        />
      ) : (
        <iframe
          src={parsed.embedSrc}
          title="Cloudinary Intro Video"
          onLoad={() => setIsPlaying(true)}
          style={{
            visibility: isPlaying ? 'visible' : 'hidden',
            opacity: isPlaying ? 1 : 0,
            width: '100vw',
            height: '100vh',
            position: 'fixed',
            inset: 0,
          }}
          className="w-full h-full border-0 transition-opacity duration-500 relative z-10"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      )}

      {/* 3. FLOATING CORNER CONTROLS */}
      <div className={`fixed top-4 ${isEn ? 'right-4' : 'left-4'} z-[10000] flex items-center gap-2 pointer-events-auto`}>
        {/* Subtle Mute / Unmute Toggle */}
        <button
          type="button"
          onClick={handleToggleMute}
          className="p-2 sm:px-3 sm:py-2 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white/90 border border-white/20 backdrop-blur-md shadow-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs"
          title={isMuted ? (isEn ? 'Unmute' : 'הפעל סאונד') : (isEn ? 'Mute' : 'השתק')}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              {needsSoundTap && (
                <span className="text-[11px] font-bold text-rose-300">
                  {isEn ? 'Tap for sound' : 'לחץ לסאונד'}
                </span>
              )}
            </>
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
        </button>

        {/* Small floating SKIP BUTTON */}
        <button
          type="button"
          onClick={handleSkip}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-black/70 hover:bg-black/90 active:scale-95 text-white font-extrabold text-xs sm:text-sm border border-white/25 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-all hover:border-pink-500/60 hover:text-pink-200"
          title={isEn ? 'Skip' : 'דלג'}
        >
          <span>{isEn ? 'Skip' : 'דלג'}</span>
          <SkipForward className="w-3.5 h-3.5 fill-white" />
        </button>
      </div>
    </div>
  );
};
