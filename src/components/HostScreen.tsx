import React, { useState } from 'react';
import { Player, RoomSettings, Language, HostStep } from '../types/game';
import { CATEGORIES } from '../data/cards';
import { translations } from '../utils/translations';
import {
  Crown,
  CreditCard,
  Copy,
  Check,
  Play,
  ArrowRight,
  ArrowLeft,
  Settings,
  PlusCircle,
  Users,
  Timer,
  Layers,
  Sparkles,
  Share2,
  Globe,
  Loader2
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { WhatsAppShareButton, WhatsAppIcon } from './WhatsAppShareButton';

interface HostScreenProps {
  hostStep?: HostStep;
  setHostStep?: (step: HostStep) => void;
  pin: string;
  hasPurchasedLicense?: boolean;
  isGeneratingPin?: boolean;
  onPurchaseLicense?: () => void;
  onGenerateRoom?: (turnDuration?: number) => void;
  onStartGame: () => void;
  onBack: () => void;
  players: Player[];
  onOpenCustomCardModal: () => void;
  onOpenShareModal: () => void;
  onOpenStore?: () => void;
  customCardsCount: number;
  settings: RoomSettings;
  onUpdateSettings: (newSettings: RoomSettings) => void;
  language?: Language;
  onToggleLanguage?: () => void;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  hostStep,
  setHostStep,
  pin,
  hasPurchasedLicense = false,
  isGeneratingPin = false,
  onPurchaseLicense,
  onGenerateRoom,
  onStartGame,
  onBack,
  players,
  onOpenCustomCardModal,
  onOpenShareModal,
  onOpenStore,
  customCardsCount,
  settings,
  onUpdateSettings,
  language = 'he',
  onToggleLanguage,
}) => {
  const t = translations[language];
  const isEn = language === 'en';
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Determine current active host step ('create' | 'lobby' | 'game')
  const currentStep: HostStep = hostStep || (hasPurchasedLicense ? 'lobby' : 'create');

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    sounds.soundSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    sounds.soundSuccess();
    const shareUrl = `${window.location.origin}/?pin=${pin}`;
    const text = encodeURIComponent(
      isEn
        ? `Come play Time To Guess with me! 🎮\nRoom PIN: ${pin}\nJoin directly: ${shareUrl}`
        : `בואו לשחק איתי ב-Time To Guess! 🎮\nקוד החדר: ${pin}\nלהצטרפות: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleToggleCategory = (cat: string) => {
    sounds.soundKeypress();
    if (cat === 'הכל') {
      onUpdateSettings({ ...settings, selectedCategories: ['הכל'] });
      return;
    }
    let newCats = settings.selectedCategories.filter(c => c !== 'הכל');
    if (newCats.includes(cat)) {
      newCats = newCats.filter(c => c !== cat);
      if (newCats.length === 0) newCats = ['הכל'];
    } else {
      newCats.push(cat);
    }
    onUpdateSettings({ ...settings, selectedCategories: newCats });
  };

  // Handle back button navigation smoothly without jarring screen resets
  const handleBackNavigation = () => {
    sounds.soundKeypress();
    if (currentStep === 'lobby') {
      if (setHostStep) {
        setHostStep('create');
      } else {
        onBack();
      }
    } else {
      onBack();
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between animate-fadeIn select-none overflow-hidden" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top Header Section */}
      <div className="w-full shrink-0">
        {/* Top navigation */}
        <div className="room-top-bar room-header w-full px-2 box-border overflow-hidden flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
          <button
            type="button"
            id={currentStep === 'lobby' ? "settingsBtn" : "backBtn"}
            onClick={handleBackNavigation}
            className={`${currentStep === 'lobby' ? 'settings-btn' : 'back-btn'} flex items-center gap-1.5 cursor-pointer`}
            title={currentStep === 'lobby' ? (isEn ? 'Edit Settings' : 'הגדרות חדר') : t.back}
          >
            {isEn ? <ArrowLeft className="w-3.5 h-3.5 mr-1" /> : <ArrowRight className="w-3.5 h-3.5 ml-1" />}
            <span>{currentStep === 'lobby' ? (isEn ? 'Edit Settings' : 'הגדרות חדר') : t.back}</span>
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onToggleLanguage && (
              <button
                type="button"
                id="langBtn"
                onClick={() => {
                  sounds.soundKeypress();
                  onToggleLanguage();
                }}
                className="lang-btn flex items-center gap-1 cursor-pointer"
                title={isEn ? 'עבור לעברית' : 'Switch to English'}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                <span>{t.langBtn}</span>
              </button>
            )}

            {pin && pin.trim() && (
              <WhatsAppShareButton
                pin={pin}
                language={language}
                variant="icon"
                className="!h-8 !w-8 sm:!h-9 sm:!w-9 !min-w-[32px] sm:!min-w-[36px]"
              />
            )}
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold border border-purple-500/30">
              <Crown className="w-3 h-3 text-yellow-300" />
              <span>{isEn ? 'Host' : 'מארח/ת'}</span>
            </span>
          </div>
        </div>

        <h1 className="text-lg sm:text-2xl font-black text-center mb-0.5 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-300">
          {t.hostTitle}
        </h1>
        <p className="text-[10px] sm:text-xs text-slate-300 text-center mb-1.5 sm:mb-2 line-clamp-1">
          {currentStep === 'create'
            ? (isEn ? 'Step 1: Choose round timer & generate WebSocket room' : 'שלב 1: בחירת טיימר והפקת חדר רשת חי')
            : t.hostSub}
        </p>
      </div>

      {/* Step 1: Generate Host Room PIN (hostStep === 'create') */}
      {currentStep === 'create' ? (
        <div className="host-inner-box w-full flex-1 flex flex-col justify-between rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 text-center shadow-xl mb-1">
          <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
            {isEn ? 'Open Live Game Room (WebSockets)' : 'הפעלת חדר משחק חי (WebSockets)'}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-300 mb-2.5 max-w-xs mx-auto">
            {isEn
              ? 'Generate a unique room PIN and sync unlimited players across devices'
              : 'כולל הפקת קוד PIN, סנכרון משתתפים/ות ללא הגבלה ושליטה מלאה בקצב המשחק'}
          </p>

          {/* Quick Timer Selection before activation */}
          <div className={`timer-selection host-inner-box rounded-xl p-2.5 mb-3 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-pink-400" />
                {t.timerSettingsTitle}
              </span>
              <span className="text-[11px] font-bold text-amber-300">
                {settings.turnDuration === 60 ? (isEn ? '1 Min' : 'דקה') : `${settings.turnDuration}${isEn ? 's' : 'שנ׳'}`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { sec: 15, label: t.sec15 },
                { sec: 30, label: t.sec30 },
                { sec: 45, label: t.sec45 },
                { sec: 60, label: t.sec60 },
              ].map(({ sec, label }) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    sounds.soundKeypress();
                    onUpdateSettings({ ...settings, turnDuration: sec });
                  }}
                  className={`py-1 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    settings.turnDuration === sec
                      ? 'bg-pink-500/30 border-pink-400 text-white shadow-sm ring-1 ring-pink-400/40'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            id="generateRoomBtn"
            onClick={() => {
              sounds.soundSuccess();
              if (onGenerateRoom) {
                onGenerateRoom(settings.turnDuration);
              } else if (onPurchaseLicense) {
                onPurchaseLicense();
              }
              if (setHostStep) {
                setHostStep('lobby');
              }
            }}
            className="btn-generate-room create-room-btn w-full py-3 sm:py-3.5 px-4 text-white font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow shrink-0" />
            <span>{t.btnGetCode}</span>
          </button>
        </div>
      ) : (
        /* Step 2: Ready Room with Generated PIN - Compact No-Scroll Mobile View */
        <div className="host-inner-box w-full flex-1 flex flex-col justify-between rounded-2xl sm:rounded-3xl p-2.5 sm:p-4 text-center shadow-2xl overflow-hidden">
          <div className="w-full flex flex-col items-center">
            {/* PIN Code Label */}
            <p className="text-[10px] sm:text-xs font-bold text-purple-300 uppercase tracking-wider mb-0.5">
              {t.pinLabel}
            </p>

            {/* Compact PIN Card Display */}
            <div className="relative inline-flex items-center justify-center px-4 py-1 sm:px-6 sm:py-1.5 my-1 bg-black/40 border-2 border-dashed border-amber-400/80 rounded-xl shadow-inner">
              <span className="text-3xl sm:text-4xl font-black text-amber-300 tracking-[0.2em] font-mono select-all">
                {pin}
              </span>
            </div>

            {/* 1. שורת שלושת כפתורי השיתוף (העתק, וואטסאפ, QR/קישור) במראה יהלומים */}
            <div className="share-buttons-row share-group">
              {/* Button 1: Copy PIN / קוד */}
              <button
                type="button"
                id="copyPinBtn"
                onClick={handleCopyPin}
                className="share-btn share-copy"
                title={t.copyPin}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-200 shrink-0 inline-block" /> : <Copy className="w-3.5 h-3.5 text-blue-100 shrink-0 inline-block" />}
                <span className="truncate">{copied ? t.pinCopied : (isEn ? 'Copy Code' : 'העתק קוד')}</span>
              </button>

              {/* Button 2: WhatsApp */}
              <button
                type="button"
                id="whatsappShareBtn"
                onClick={handleWhatsAppShare}
                className="share-btn share-whatsapp"
                title={isEn ? 'WhatsApp' : 'ווטסאפ'}
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-white shrink-0 inline-block" />
                <span className="truncate">{isEn ? 'WhatsApp' : 'וואטסאפ'}</span>
              </button>

              {/* Button 3: QR & Link */}
              <button
                type="button"
                id="qrShareBtn"
                onClick={() => {
                  sounds.soundKeypress();
                  onOpenShareModal();
                }}
                className="share-btn share-qr"
                title={isEn ? 'QR & Link' : 'QR וקישור'}
              >
                <Share2 className="w-3.5 h-3.5 text-pink-100 shrink-0 inline-block" />
                <span className="truncate">{isEn ? 'QR & Link' : 'QR / קישור'}</span>
              </button>
            </div>

            {/* 2. רשימת משתתפים מחוברים */}
            <div className={`w-full bg-white/5 border border-white/10 rounded-xl p-2 sm:p-2.5 my-1.5 ${isEn ? 'text-left' : 'text-right'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  {t.connectedPlayers} ({players.length}):
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full font-bold">
                  {isEn ? 'Ready' : 'מוכן'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 max-h-[56px] overflow-y-auto no-scrollbar">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 text-[10px] sm:text-[11px] font-medium text-white"
                  >
                    <span>{p.avatar}</span>
                    <span className="truncate max-w-[80px] sm:max-w-none">{p.name}</span>
                    {p.isHost && <span className="text-[9px] text-amber-300 font-bold">{isEn ? '(Host)' : '(מארח/ת)'}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. שלושת הכפתורים התחתונים כמטילי יהלומים 3D עם אנימציית ברק */}
            {/* כפתור 1: התאם קטגוריות וקלפים אישיים (אבן חן כחולה/ציאן) */}
            <div className="w-full">
              <button
                type="button"
                id="categoriesSettingsBtn"
                onClick={() => setShowSettings(!showSettings)}
                className="room-action-btn action-btn-blue"
                title={showSettings ? (isEn ? 'Hide Categories' : 'הסתר הגדרות קטגוריות') : (isEn ? 'Custom Categories & Cards' : 'התאם קטגוריות וקלפים אישיים')}
              >
                <Settings className="w-5 h-5 shrink-0" />
                <span className="truncate">
                  {showSettings
                    ? (isEn ? 'Hide Categories' : 'הסתר קטגוריות')
                    : (isEn ? 'Custom Categories & Cards' : 'התאם קטגוריות וקלפים אישיים')}
                </span>
              </button>

              {showSettings && (
                <div className="bg-black/40 p-2.5 rounded-2xl border border-white/15 space-y-2 animate-fadeIn mt-1 text-xs max-h-[140px] overflow-y-auto no-scrollbar shadow-inner text-right">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      {isEn ? 'Categories:' : 'קטגוריות משחק:'}
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {CATEGORIES.map((cat) => {
                        const isSelected =
                          settings.selectedCategories.includes('הכל') ||
                          settings.selectedCategories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleToggleCategory(cat)}
                            className={`btn-3d px-2 py-0.5 text-[10px] sm:text-[11px] rounded-lg border cursor-pointer font-bold ${
                              isSelected
                                ? 'bg-purple-600/50 border-purple-400 text-purple-100 shadow-[0_2px_0_#4c1d95]'
                                : 'btn-3d-dark text-slate-300'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-white/10 flex justify-between items-center">
                    <span className="text-[11px] text-slate-300">
                      {isEn ? 'Custom Cards:' : 'קלפים אישיים:'} <span className="font-bold text-pink-400">{customCardsCount}</span>
                    </span>
                    <button
                      type="button"
                      onClick={onOpenCustomCardModal}
                      className="btn-3d btn-3d-pink flex items-center gap-1 px-2.5 py-1 text-white rounded-lg text-[10px] sm:text-[11px] font-bold cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {t.customCards}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* כפתור 2: שדרג חבילות קלפים (אבן חן סגולה עמוקה) */}
          {onOpenStore && (
            <div className="w-full shrink-0">
              <button
                type="button"
                id="upgradePacksBtn"
                onClick={() => {
                  sounds.soundKeypress();
                  onOpenStore();
                }}
                className="room-action-btn action-btn-purple"
                title={isEn ? 'Upgrade Card Packs' : 'שדרג חבילות קלפים'}
              >
                <span className="text-xl shrink-0">💎</span>
                <span className="truncate">
                  {isEn
                    ? '💎 Upgrade Card Packs | Unlock 100+ Photos'
                    : '💎 שדרג חבילות קלפים | פתח 100+ תמונות'}
                </span>
              </button>
            </div>
          )}

          {/* כפתור 3: כפתור הפעולה הנוסף - התחל משחק (אבן חן סגולה עמוקה) */}
          <div className="w-full shrink-0">
            <button
              type="button"
              id="startGameBtn"
              onClick={() => {
                sounds.soundSuccess();
                onStartGame();
              }}
              className="room-action-btn action-btn-purple"
              title={t.btnStartGame}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white drop-shadow shrink-0" />
              <span className="tracking-wide font-black truncate">{t.btnStartGame}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
