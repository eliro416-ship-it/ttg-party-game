import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, MessageCircle, Smartphone } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  language?: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, pin, language = 'he' }) => {
  const isEn = language === 'en';
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Build the direct invitation link
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?pin=${pin}`
    : `https://app?pin=${pin}`;

  const shareText = isEn
    ? `🃏 Join my "Time to Guess" game room!\nRoom PIN: ${pin}\nQuick join link:\n${inviteUrl}`
    : `🃏 בואו לשחק איתי ב״הזמן לנחש״ (Time To Guess)!\nקוד החדר: ${pin}\nלהצטרפות מהירה לחצו כאן:\n${inviteUrl}`;

  // Generate QR Code
  useEffect(() => {
    if (isOpen && inviteUrl) {
      QRCode.toDataURL(inviteUrl, {
        width: 220,
        margin: 2,
        color: {
          dark: '#1E1B4B',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [isOpen, inviteUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    sounds.soundSuccess();
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    sounds.soundSuccess();
    setTimeout(() => setCopiedPin(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isEn ? 'Time to Guess 🃏' : 'הזמן לנחש 🃏',
          text: isEn ? `Join my game! Room PIN: ${pin}` : `בואו לשחק איתי! קוד PIN של החדר: ${pin}`,
          url: inviteUrl,
        });
        sounds.soundSuccess();
      } catch {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="bg-gradient-to-b from-[#2D1454] to-[#1E1B4B] border border-white/20 rounded-3xl p-6 w-full max-w-sm sm:max-w-md shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300">
            <Share2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isEn ? 'Share Game Room' : 'שיתוף חדר המשחק'}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 mb-5">
          {isEn ? 'Invite friends and family to join your room in seconds!' : 'הזמן חברים ומשפחה להצטרף לחדר שלך בשניות!'}
        </p>

        {/* PIN Code Highlight Box */}
        <div className="bg-white/5 border border-white/15 rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className={isEn ? 'text-left' : 'text-right'}>
            <span className="text-[11px] font-bold text-slate-400 block">
              {isEn ? 'Room PIN Code:' : 'קוד ה-PIN של החדר:'}
            </span>
            <span className="text-2xl font-black text-amber-300 font-mono tracking-widest">{pin}</span>
          </div>

          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white border border-white/15 transition-all cursor-pointer"
          >
            {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPin ? (isEn ? 'Copied!' : 'הועתק!') : (isEn ? 'Copy PIN' : 'העתק קוד')}</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg mx-auto mb-4 border-4 border-pink-500/30">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for PIN ${pin}`}
              className="w-40 h-40 object-contain rounded-lg"
            />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
              {isEn ? 'Generating QR Code...' : 'מייצר קוד QR...'}
            </div>
          )}
        </div>

        <div className="text-xs text-pink-300 flex items-center justify-center gap-1.5 mb-5 font-semibold">
          <Smartphone className="w-4 h-4 text-pink-400" />
          <span>{isEn ? 'Scan with your camera for instant join' : 'סרקו עם מצלמת הטלפון להצטרפות ישירה'}</span>
        </div>

        {/* Action Share Buttons */}
        <div className="space-y-2.5">
          {/* WhatsApp Share */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sounds.soundSuccess()}
            className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>{isEn ? 'Share via WhatsApp' : 'שתף בוואטסאפ (WhatsApp)'}</span>
          </a>

          {/* Copy Direct Link */}
          <button
            onClick={handleCopyLink}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 active:scale-98 text-white font-bold rounded-2xl border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            <span>{copiedLink ? (isEn ? 'Link copied!' : 'הקישור הועתק בהצלחה!') : (isEn ? 'Copy Direct Link' : 'העתק קישור ישיר לחדר')}</span>
          </button>

          {/* Native Web Share API if available */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 bg-purple-600/30 hover:bg-purple-600/50 active:scale-98 text-purple-200 font-bold rounded-2xl border border-purple-500/40 text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{isEn ? 'More Sharing Options' : 'שיתוף נוסף דרך אפליקציות המכשיר'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
