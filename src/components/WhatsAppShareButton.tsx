import React from 'react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface WhatsAppShareButtonProps {
  pin: string;
  language?: Language;
  variant?: 'large' | 'compact';
  className?: string;
  onShared?: () => void;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export const WhatsAppShareButton: React.FC<WhatsAppShareButtonProps> = ({
  pin,
  language = 'he',
  variant = 'large',
  className = '',
  onShared,
}) => {
  const isEn = language === 'en';
  const currentLang = language;

  // Use the dynamic real URL where the application is currently running
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?pin=${pin}&lang=${currentLang}`
    : `/?pin=${pin}&lang=${currentLang}`;

  const shareText = isEn
    ? `🎮 *Invitation to "Time To Guess" Live Game!* ⏱️\n\nHey! I just opened a live room.\n🔑 *Room PIN Code:* *${pin}*\n\n👇 *Click here to join instantly:*\n${shareUrl}\n\nJoin now and let's play! 🚀`
    : `🎮 *הזמנה למשחק ״הזמן לנחש״ (Time To Guess)!* ⏱️\n\nהיי! פתחתי חדר משחק רשת חי ומגניב.\n🔑 *קוד ה-PIN של החדר:* *${pin}*\n\n👇 *להצטרפות מהירה בלחיצה אחת:*\n${shareUrl}\n\nמחכים לך, כנס/י עכשיו! 🚀`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleShareClick = () => {
    sounds.soundSuccess();
    onShared?.();
  };

  if (variant === 'compact') {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleShareClick}
        className={`btn-3d btn-3d-whatsapp relative group inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer animate-whatsapp-pulse ${className}`}
        title={isEn ? 'Share with top card to WhatsApp' : 'שתף/י בוואטסאפ עם כרטיס עליון'}
      >
        <span className="shimmer-sweep" />
        <WhatsAppIcon className="w-4 h-4 fill-white shrink-0 drop-shadow" />
        <span className="font-extrabold tracking-wide">{isEn ? 'WhatsApp' : 'שליחה בוואטסאפ'}</span>
      </a>
    );
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleShareClick}
      className={`btn-3d btn-3d-whatsapp relative group w-full py-3.5 px-5 text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer animate-whatsapp-pulse ${className}`}
    >
      {/* 3D Shimmer sweep light */}
      <span className="shimmer-sweep" />

      {/* WhatsApp Official Logo with White Badge */}
      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform">
        <WhatsAppIcon className="w-5 h-5 fill-white drop-shadow-md" />
      </div>

      <span className="tracking-wide drop-shadow-sm font-black">
        {isEn ? 'Share via WhatsApp (with App Card)' : 'שתף/י בוואטסאפ (עם כרטיס האפליקציה)'}
      </span>

      <span className="text-xs px-2 py-0.5 rounded-full bg-white/25 font-black uppercase tracking-wider text-emerald-100 hidden sm:inline-block shadow-sm">
        {isEn ? 'Card 🃏' : 'כרטיס 🃏'}
      </span>
    </a>
  );
};
