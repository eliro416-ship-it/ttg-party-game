import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, Smartphone, Image as ImageIcon, QrCode } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { WhatsAppShareButton } from './WhatsAppShareButton';

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
  const [activeTab, setActiveTab] = useState<'card' | 'qr'>('card');

  // Build the dynamic invitation link using the real current application URL
  const currentLang = language;
  const baseUrl = (typeof window !== 'undefined' && window.location.origin.includes('time-to-guess.netlify.app'))
    ? window.location.origin
    : 'https://time-to-guess.netlify.app';
  const shareUrl = `${baseUrl}/?pin=${pin}&lang=${currentLang}`;
  const inviteUrl = shareUrl;

  const shareText = isEn
    ? `🎮 Invitation to "Time to Guess" (Time to Guess)! ⏱️\n\nHey! I'm holding the secret picture in a cool live network room.\n🔑 Room PIN code: ${pin}\n\n👇 Click here to join instantly:\n${shareUrl}`
    : `🎮 הזמנה למשחק "הזמן לנחש" (Time to Guess)! ⏱️\n\nהיי! אני מחזיק/ה בתמונה הסודית בחדר רשת חי ומגניב.\n🔑 קוד ה-PIN של החדר: ${pin}\n\n👇 להצטרפות מהירה בלחיצה אחת:\n${shareUrl}`;

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
        const response = await fetch('/card-preview.png');
        if (response.ok) {
          const blob = await response.blob();
          const file = new File([blob], 'time-to-guess.png', { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: isEn ? 'Time to Guess 🃏' : 'הזמן לנחש 🃏',
              text: shareText,
              files: [file],
            });
            sounds.soundSuccess();
            return;
          }
        }

        await navigator.share({
          title: isEn ? 'Time to Guess 🃏' : 'הזמן לנחש 🃏',
          text: shareText,
        });
        sounds.soundSuccess();
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
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

        {/* Preview Tabs: App Card vs QR Code */}
        <div className="flex items-center justify-center p-1 bg-black/30 rounded-xl mb-4 border border-white/10 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'card'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-pink-200" strokeWidth={2.2} />
            <span>{isEn ? 'App Card' : 'כרטיס האפליקציה'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-pink-200" strokeWidth={2.2} />
            <span>{isEn ? 'QR Code' : 'קוד QR לסריקה'}</span>
          </button>
        </div>

        {/* Card or QR Code Display */}
        {activeTab === 'card' ? (
          <div className="relative inline-block mb-4 group">
            <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-400/50 bg-[#14092A] mx-auto relative">
              <img
                src="/card-preview.png"
                alt="App Card Preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-1.5 inset-x-0 text-center">
                <span className="text-[10px] font-black tracking-wide text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  {isEn ? 'Attached to WhatsApp' : 'מצורף להודעת WhatsApp'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 font-medium">
              {isEn ? 'This top card is shared directly into WhatsApp chats' : 'כרטיס זה מצורף כעת בראש ההודעה בוואטסאפ'}
            </p>
          </div>
        ) : (
          <div>
            <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg mx-auto mb-2 border-4 border-pink-500/30">
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
            <div className="text-xs text-pink-300 flex items-center justify-center gap-1.5 mb-3 font-semibold">
              <Smartphone className="w-4 h-4 text-pink-400" />
              <span>{isEn ? 'Scan with phone camera to join' : 'סרקו עם מצלמת הטלפון להצטרפות ישירה'}</span>
            </div>
          </div>
        )}

        {/* Action Share Buttons */}
        <div className="space-y-3">
          {/* WhatsApp Share with enhanced graphics and animation */}
          <WhatsAppShareButton pin={pin} language={language} variant="large" />

          {/* Copy Direct Link */}
          <button
            onClick={handleCopyLink}
            className="btn-3d btn-3d-dark w-full py-3.5 px-4 text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedLink ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            <span>{copiedLink ? (isEn ? 'Link copied!' : 'הקישור הועתק בהצלחה!') : (isEn ? 'Copy Direct Link' : 'העתק קישור ישיר לחדר')}</span>
          </button>

          {/* Native Web Share API if available */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={handleNativeShare}
              className="btn-3d btn-3d-purple w-full py-3 px-4 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer"
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
