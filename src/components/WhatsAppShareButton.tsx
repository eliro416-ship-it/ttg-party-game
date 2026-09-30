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

  const getDirectMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?pin=${pin}`;
    return encodeURIComponent(
      `בואו לשחק איתי ב-Time To Guess! 🎮\nקוד החדר (PIN): ${pin}\nלהצטרפות ישירה: ${shareUrl}`
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
          `בואו לשחק איתי ב-Time To Guess! 🎮\nקוד החדר (PIN): ${pin}\nלהצטרפות ישירה: ${shareUrl}`
        );
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      }
    } catch (err) {
      // Fallback
      window.location.href = directWhatsappUrl;
    }

    onShared?.();
  };

  // 1. Icon-only variant for top bars
  if (variant === 'icon') {
    return (
      <a
        href={directWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleShareClick}
        className={`btn-3d btn-3d-whatsapp h-9 w-9 min-w-[36px] rounded-xl flex items-center justify-center cursor-pointer shadow-md shrink-0 border border-emerald-300/40 hover:scale-105 active:scale-95 transition-all ${className}`}
        title={isEn ? 'Share via WhatsApp' : 'ווטסאפ'}
      >
        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#25D366] shadow-sm">
          <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
        </div>
      </a>
    );
  }

  // 2. Compact variant for the 3-button room management row (alongside "העתק קוד" and "QR וקישור")
  if (variant === 'compact') {
    return (
      <a
        href={directWhatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleShareClick}
        className={`btn-3d btn-3d-whatsapp relative group w-full h-[42px] flex items-center justify-center gap-1.5 px-2 text-white font-bold text-xs rounded-xl cursor-pointer animate-whatsapp-pulse whitespace-nowrap shadow-md ${className}`}
        title={isEn ? 'Share room via WhatsApp' : 'שתף קוד חדר בווטסאפ'}
      >
        <span className="shimmer-sweep" />
        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[#25D366] shrink-0 shadow-sm">
          <WhatsAppIcon className="w-3 h-3 fill-[#25D366]" />
        </div>
        <span className="font-bold text-xs tracking-wide whitespace-nowrap">
          {isEn ? 'WhatsApp' : 'ווטסאפ'}
        </span>
      </a>
    );
  }

  // 3. Large variant for modals
  return (
    <a
      href={directWhatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleShareClick}
      className={`btn-3d btn-3d-whatsapp relative group w-full py-3.5 px-5 text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer animate-whatsapp-pulse ${className}`}
    >
      <span className="shimmer-sweep" />
      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#25D366] shadow-md shrink-0 group-hover:scale-110 transition-transform">
        <WhatsAppIcon className="w-5 h-5 fill-[#25D366]" />
      </div>
      <span className="tracking-wide drop-shadow-sm font-black">
        {isEn ? 'Share via WhatsApp' : 'שתף/י קישור בווטסאפ'}
      </span>
      <span className="text-xs px-2 py-0.5 rounded-full bg-white/25 font-black tracking-wider text-emerald-100 hidden sm:inline-block shadow-sm">
        {isEn ? 'Direct 🚀' : 'ישיר 🚀'}
      </span>
    </a>
  );
};
