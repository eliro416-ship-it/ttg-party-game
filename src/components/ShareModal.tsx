import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, MessageCircle, Smartphone, Sparkles, ExternalLink, Image as ImageIcon } from 'lucide-react';
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
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Build the direct invitation link (includes language to guarantee consistent language for invitees)
  const inviteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?pin=${pin}&lang=${language}`
    : `https://app?pin=${pin}&lang=${language}`;

  // Rich formatted text for WhatsApp & chat apps
  const shareText = isEn
    ? `🃏 *Time to Guess* | Game Room Invite 🎯\n━━━━━━━━━━━━━━━━━━━━━\n🎮 You've been invited to join my live game room!\n🔑 Room PIN: *${pin}*\n\n📲 Tap the link to join directly:\n${inviteUrl}\n━━━━━━━━━━━━━━━━━━━━━`
    : `🃏 *הזמן לנחש* | Time To Guess 🎯\n━━━━━━━━━━━━━━━━━━━━━\n🎮 הוזמנת לחדר משחק ב-Time To Guess!\n🔑 קוד כניסה לחדר: *${pin}*\n\n📲 לחצו על הקישור להצטרפות ישירה:\n${inviteUrl}\n━━━━━━━━━━━━━━━━━━━━━`;

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

  const handleCopyFullMessage = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedMessage(true);
    sounds.soundSuccess();
    setTimeout(() => setCopiedMessage(false), 2200);
  };

  // Unified WhatsApp Share Button - Shares with the app icon image attached
  const handleWhatsAppShareWithImage = async () => {
    sounds.soundKeypress();
    setIsSharing(true);

    try {
      // 1. Try mobile Web Share API with attached app icon image file (without duplicate url param)
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        let fileToShare: File | null = null;
        try {
          const res = await fetch('/pwa-512x512.png');
          if (res.ok) {
            const blob = await res.blob();
            const file = new File([blob], 'time-to-guess.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              fileToShare = file;
            }
          }
        } catch (fileErr) {
          console.warn('Could not prepare icon file for sharing', fileErr);
        }

        const shareData: ShareData = {
          title: isEn ? 'Time to Guess 🃏' : 'הזמן לנחש 🃏',
          text: shareText,
        };
        if (fileToShare) {
          shareData.files = [fileToShare];
        }

        try {
          if (!navigator.canShare || navigator.canShare(shareData)) {
            await navigator.share(shareData);
            sounds.soundSuccess();
            setIsSharing(false);
            return;
          }
        } catch (shareErr: unknown) {
          if ((shareErr as Error)?.name === 'AbortError') {
            // User cancelled share dialog
            setIsSharing(false);
            return;
          }
        }
      }

      // 2. Direct WhatsApp URL fallback (fetches OpenGraph og:image card)
      sounds.soundSuccess();
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error during WhatsApp share:', err);
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="bg-gradient-to-b from-[#2D1454] to-[#1E1B4B] border border-white/20 rounded-3xl p-5 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl relative text-center max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer z-10`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300">
            <Share2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isEn ? 'Share Game Room' : 'שיתוף חדר המשחק'}
          </h2>
        </div>
        <p className="text-xs text-slate-300 mb-3.5">
          {isEn ? 'Invite friends and family to join your room in seconds!' : 'הזמן חברים ומשפחה להצטרף לחדר שלך בשניות!'}
        </p>

        {/* Rich Link Image Card Preview - Top of Message */}
        <div className="w-full bg-gradient-to-r from-purple-950/80 via-black/70 to-pink-950/80 border-2 border-pink-500/40 rounded-2xl p-3 mb-4 shadow-xl text-right flex items-center gap-3 relative overflow-hidden group">
          {/* Subtle glowing ambient spot */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-pink-500/20 rounded-full blur-xl pointer-events-none" />

          {/* Time to Guess Icon Card */}
          <div className="w-16 h-16 sm:w-18 sm:h-18 flex-none rounded-2xl bg-gradient-to-tr from-[#FF7675] via-[#6C5CE7] to-[#00CEC9] p-[3px] shadow-[0_4px_16px_rgba(253,121,168,0.45)] group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-[#110B29] rounded-[13px] flex items-center justify-center relative overflow-hidden">
              <img
                src="/pwa-512x512.png"
                alt="Time to Guess"
                className="w-full h-full object-cover rounded-[13px]"
              />
            </div>
          </div>

          {/* Card Content & Badge */}
          <div className={`flex-1 min-w-0 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-black text-white truncate">
                {isEn ? 'Time to Guess 🃏' : 'Time to Guess | הזמן לנחש'}
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-pink-500/30 text-pink-300 border border-pink-500/40 flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                <span>{isEn ? 'Share Card' : 'כרטיס שיתוף'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 truncate mb-1">
              {isEn ? `Live game room open • PIN: ${pin}` : `חדר משחק פעיל מחכה לך! קוד כניסה: ${pin}`}
            </p>
            <div className="text-[10px] text-pink-300/90 font-mono truncate bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
              <ExternalLink className="w-3 h-3 flex-none text-pink-400" />
              <span className="truncate">{inviteUrl}</span>
            </div>
          </div>
        </div>

        {/* PIN Code Highlight Box */}
        <div className="bg-white/5 border border-white/15 rounded-2xl p-3 mb-3.5 flex items-center justify-between">
          <div className={isEn ? 'text-left' : 'text-right'}>
            <span className="text-[11px] font-bold text-slate-400 block">
              {isEn ? 'Room PIN Code:' : 'קוד ה-PIN של החדר:'}
            </span>
            <span className="text-2xl font-black text-amber-300 font-mono tracking-widest">{pin}</span>
          </div>

          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold text-white border border-white/15 transition-all cursor-pointer shadow-sm"
          >
            {copiedPin ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPin ? (isEn ? 'Copied!' : 'הועתק!') : (isEn ? 'Copy PIN' : 'העתק קוד')}</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-white p-3 rounded-2xl inline-block shadow-lg mx-auto mb-2 border-4 border-pink-500/30">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR Code for PIN ${pin}`}
              className="w-36 h-36 object-contain rounded-lg"
            />
          ) : (
            <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
              {isEn ? 'Generating QR Code...' : 'מייצר קוד QR...'}
            </div>
          )}
        </div>

        <div className="text-xs text-pink-300 flex items-center justify-center gap-1.5 mb-4 font-semibold">
          <Smartphone className="w-4 h-4 text-pink-400" />
          <span>{isEn ? 'Scan with your camera for instant join' : 'סרקו עם מצלמת הטלפון להצטרפות ישירה'}</span>
        </div>

        {/* Action Share Buttons */}
        <div className="space-y-2.5">
          {/* Unified WhatsApp Share Button - Shares with the app icon image attached */}
          <button
            onClick={handleWhatsAppShareWithImage}
            disabled={isSharing}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#25D366] to-[#1ebe5d] hover:from-[#22bf5c] hover:to-[#1aa852] active:scale-98 text-white font-black rounded-2xl shadow-xl shadow-emerald-950/40 flex items-center justify-between transition-all cursor-pointer border border-emerald-400/30 disabled:opacity-75"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-none">
                <MessageCircle className="w-5 h-5 fill-white text-white" />
              </div>
              <div className={isEn ? 'text-left' : 'text-right'}>
                <span className="block text-sm sm:text-base font-black leading-tight">
                  {isEn ? 'Share on WhatsApp' : 'שתף ב-WhatsApp'}
                </span>
                <span className="block text-[11px] text-emerald-100 font-medium">
                  {isEn ? 'With icon image & direct link' : 'כולל תמונת האייקון וקישור מהיר'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-black/20 px-2.5 py-1 rounded-xl border border-white/20 text-xs font-bold text-white flex-none">
              <ImageIcon className="w-3.5 h-3.5 text-yellow-300" />
              <span>{isEn ? '+ Icon' : '+ תמונה'}</span>
            </div>
          </button>

          {/* Copy Direct Link */}
          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 active:scale-98 text-white font-bold rounded-2xl border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs sm:text-sm"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? (isEn ? 'Link copied!' : 'הקישור הועתק בהצלחה!') : (isEn ? 'Copy Direct Link' : 'העתק קישור ישיר לחדר')}</span>
          </button>

          {/* Copy Full Formatted Message Button */}
          <button
            onClick={handleCopyFullMessage}
            className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 active:scale-98 text-slate-200 font-bold rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
          >
            {copiedMessage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMessage ? (isEn ? 'Message copied!' : 'ההודעה המעוצבת הועתקה!') : (isEn ? 'Copy Full Message Text' : 'העתק הודעה מעוצבת לשליחה')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
