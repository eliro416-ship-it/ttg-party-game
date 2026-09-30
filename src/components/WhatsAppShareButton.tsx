import React from 'react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface WhatsAppShareButtonProps {
  pin: string;
  language?: Language;
  variant?: 'large' | 'compact' | 'icon';
  className?: string;
  onShared?: () => void;
}

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4 fill-current' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
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

  const getDirectMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?pin=${pin}`;
    return encodeURIComponent(
      isEn
        ? `Come play Time To Guess with me! 🎮\nRoom PIN: ${pin}\nJoin directly: ${shareUrl}`
        : `בואו לשחק איתי ב-Time To Guess! 🎮\nקוד החדר: ${pin}\nלהצטרפות: ${shareUrl}`
    );
  };

  const directWhatsappUrl = `https://api.whatsapp.com/send?text=${getDirectMessage()}`;

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    sounds.soundSuccess();

    try {
      if (typeof window !== 'undefined') {
        const shareUrl = `${window.location.origin}/?pin=${pin}`;
        const text = encodeURIComponent(
          isEn
            ? `Come play Time To Guess with me! 🎮\nRoom PIN: ${pin}\nJoin directly: ${shareUrl}`
            : `בואו לשחק איתי ב-Time To Guess! 🎮\nקוד החדר: ${pin}\nלהצטרפות: ${shareUrl}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      }
    } catch {
      window.location.href = directWhatsappUrl;
    }

    onShared?.();
  };

  // 1. Icon-only variant for top bars (e.g. next to settings / back)
  if (variant === 'icon') {
    return (
      <a
        href={directWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleShareClick}
        className={`flex items-center justify-center rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md active:scale-95 transition-all cursor-pointer h-9 w-9 min-w-[36px] ${className}`}
        title={isEn ? 'Share via WhatsApp' : 'ווטסאפ'}
        aria-label={isEn ? 'Share via WhatsApp' : 'ווטסאפ'}
      >
        <WhatsAppIcon className="w-5 h-5 fill-white text-white shrink-0" />
      </a>
    );
  }

  // 2. Compact variant for the 3-button room management row (alongside "העתק קוד" and "QR וקישור")
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleShareClick}
        className={`btn-whatsapp-3d flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white font-bold text-xs flex-1 transition-all duration-150 ease-out hover:scale-[1.02] active:translate-y-[3px] cursor-pointer h-[42px] whitespace-nowrap ${className}`}
        style={{
          background: 'linear-gradient(180deg, #2ae06b 0%, #20ba59 100%)',
          boxShadow: '0 4px 0 #15803d, 0 8px 15px rgba(37, 211, 102, 0.35)',
          borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        }}
        title={isEn ? 'WhatsApp' : 'ווטסאפ'}
      >
        <WhatsAppIcon className="w-4 h-4 fill-white drop-shadow shrink-0" />
        <span className="drop-shadow whitespace-nowrap">{isEn ? 'WhatsApp' : 'ווטסאפ'}</span>
      </button>
    );
  }

  // 3. Large variant for modals
  return (
    <a
      href={directWhatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleShareClick}
      className={`relative group w-full py-3.5 px-5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer shadow-lg active:scale-98 transition-all ${className}`}
    >
      <WhatsAppIcon className="w-5 h-5 fill-white text-white shrink-0" />
      <span className="tracking-wide drop-shadow-sm font-black">
        {isEn ? 'Share via WhatsApp' : 'שתף/י קישור בווטסאפ'}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 font-black tracking-wider text-white hidden sm:inline-block shadow-sm">
        {isEn ? 'Direct 🚀' : 'ישיר 🚀'}
      </span>
    </a>
  );
};
