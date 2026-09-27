import React, { useState } from 'react';
import { Player, RoomSettings, Language } from '../types/game';
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
import { WhatsAppShareButton } from './WhatsAppShareButton';

interface HostScreenProps {
  pin: string;
  hasPurchasedLicense: boolean;
  isGeneratingPin?: boolean;
  onPurchaseLicense: () => void;
  onStartGame: () => void;
  onBack: () => void;
  players: Player[];
  onOpenCustomCardModal: () => void;
  onOpenShareModal: () => void;
  customCardsCount: number;
  settings: RoomSettings;
  onUpdateSettings: (newSettings: RoomSettings) => void;
  language?: Language;
  onToggleLanguage?: () => void;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  pin,
  hasPurchasedLicense,
  isGeneratingPin = false,
  onPurchaseLicense,
  onStartGame,
  onBack,
  players,
  onOpenCustomCardModal,
  onOpenShareModal,
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
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = isGeneratingPin || localLoading;

  React.useEffect(() => {
    if (hasPurchasedLicense) {
      setLocalLoading(false);
    }
  }, [hasPurchasedLicense]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    sounds.soundSuccess();
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top navigation */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => {
            sounds.soundKeypress();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
        >
          {isEn ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
          <span>{t.back}</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleLanguage && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onToggleLanguage();
              }}
              className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title={isEn ? 'עבור לעברית' : 'Switch to English'}
            >
              <Globe className="w-3 h-3 text-pink-400" />
              <span>{t.langBtn}</span>
            </button>
          )}

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isEn ? 'Host' : 'מארח/ת'}</span>
          </span>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-300">
        {t.hostTitle}
      </h1>
      <p className="text-xs sm:text-sm text-slate-300 text-center mb-5">
        {t.hostSub}
      </p>

      {/* Step 1: Generate Host Room PIN */}
      {!hasPurchasedLicense ? (
        <div className="w-full bg-white/10 border border-white/15 rounded-3xl p-6 text-center shadow-xl mb-4">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            {isEn ? 'Open Secure Game Room' : 'הפעלת חדר משחק (מארח/ת)'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-xs mx-auto">
            {isEn
              ? 'Generate a unique room PIN and sync unlimited players across devices'
              : 'כולל הפקת קוד PIN, סנכרון משתתפים/ות ללא הגבלה ושליטה מלאה בקצב המשחק'}
          </p>

          {/* Quick Timer Selection before activation */}
          <div className={`bg-black/30 border border-white/10 rounded-2xl p-3 mb-5 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-pink-400" />
                {t.timerSettingsTitle}
              </span>
              <span className="text-xs font-bold text-amber-300">
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
                  className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
            onClick={() => {
              if (isLoading) return;
              setLocalLoading(true);
              sounds.soundSuccess();
              try {
                onPurchaseLicense();
              } catch (err) {
                console.error('Error initiating room creation:', err);
              }
            }}
            disabled={isLoading}
            className={`btn-3d btn-3d-emerald w-full py-4 px-6 text-white font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer transition-all ${
              isLoading ? 'opacity-85 cursor-wait' : ''
            }`}
          >
            <span className="shimmer-sweep" />
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 text-white animate-spin drop-shadow" />
                <span className="tracking-wide">{isEn ? 'Creating Live Room...' : 'מקים חדר חי...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow" />
                <span>{t.btnGetCode}</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Step 2: Ready Room with Generated PIN */
        <div className="w-full bg-white/10 border border-white/20 rounded-3xl p-5 text-center shadow-2xl mb-4">
          <p className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
            {t.pinLabel}
          </p>

          {/* PIN Card display */}
          <div className="relative inline-flex items-center justify-center px-8 py-3 my-2 bg-black/40 border-2 border-dashed border-amber-400/80 rounded-2xl">
            <span className="text-4xl sm:text-5xl font-black text-amber-300 tracking-[0.25em] font-mono select-all">
              {pin}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 mb-4">
            <WhatsAppShareButton pin={pin} language={language} variant="compact" />

            <button
              onClick={handleCopyPin}
              className="btn-3d btn-3d-dark flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.pinCopied : t.copyPin}</span>
            </button>

            <button
              onClick={() => {
                sounds.soundKeypress();
                onOpenShareModal();
              }}
              className="btn-3d btn-3d-pink flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-white cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-pink-100" />
              <span>{isEn ? 'QR / Link' : 'QR וקישור'}</span>
            </button>
          </div>

          {/* Connected players list preview */}
          <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-4 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                {t.connectedPlayers} ({players.length}):
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {isEn ? 'Ready' : 'מוכן'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs font-medium text-white"
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                  {p.isHost && <span className="text-[10px] text-amber-300 font-bold">{isEn ? '(Host)' : '(מארח/ת)'}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Timer Selector */}
          <div className={`mb-4 bg-black/25 border border-white/10 rounded-2xl p-3.5 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center mb-2.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-pink-400" />
                <span>{t.timerSettingsTitle}</span>
              </label>
              <span className="text-xs font-black text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/25 flex items-center gap-1.5 shadow-sm">
                <Timer className="w-3.5 h-3.5 text-amber-300" strokeWidth={2.2} />
                <span>{settings.turnDuration === 60 ? (isEn ? '1 Minute' : 'דקה') : `${settings.turnDuration} ${isEn ? 'sec' : 'שניות'}`}</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { sec: 15, label: t.sec15, note: isEn ? 'Fast' : 'מהיר' },
                { sec: 30, label: t.sec30, note: isEn ? 'Classic' : 'קלאסי' },
                { sec: 45, label: t.sec45, note: isEn ? 'Chill' : 'רגוע' },
                { sec: 60, label: t.sec60, note: isEn ? 'Think' : 'מחשבה' },
              ].map(({ sec, label, note }) => {
                const isSelected = settings.turnDuration === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      sounds.soundKeypress();
                      onUpdateSettings({ ...settings, turnDuration: sec });
                    }}
                    className={`btn-3d py-2.5 px-1.5 rounded-xl text-center flex flex-col items-center justify-center cursor-pointer ${
                      isSelected ? 'btn-3d-timer-active text-white' : 'btn-3d-timer-inactive text-slate-300'
                    }`}
                  >
                    <span className={`text-xs font-black leading-tight ${isSelected ? 'text-pink-200' : 'text-slate-100'}`}>
                      {label}
                    </span>
                    <span className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-pink-300' : 'text-slate-400'}`}>
                      {note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collapsible settings (Categories & Custom Cards) */}
          <div className={`mb-5 ${isEn ? 'text-left' : 'text-right'}`}>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1.5 mb-2 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{showSettings ? (isEn ? 'Hide Categories' : 'הסתר הגדרות קטגוריות') : (isEn ? 'Custom Categories & Cards' : 'התאם קטגוריות וקלפים אישיים')}</span>
            </button>

            {showSettings && (
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/10 space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    {isEn ? 'Categories:' : 'קטגוריות משחק:'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected =
                        settings.selectedCategories.includes('הכל') ||
                        settings.selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleToggleCategory(cat)}
                          className={`btn-3d px-3 py-1.5 text-xs rounded-xl border cursor-pointer font-bold ${
                            isSelected
                              ? 'bg-purple-600/50 border-purple-400 text-purple-100 shadow-[0_3px_0_#4c1d95]'
                              : 'btn-3d-dark text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-slate-300">
                    {isEn ? 'Custom Cards:' : 'קלפים אישיים:'} <span className="font-bold text-pink-400">{customCardsCount}</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenCustomCardModal}
                    className="btn-3d btn-3d-pink flex items-center gap-1 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {t.customCards}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Big Start Game Button with 3D Tactile Arcade & Shimmer Sweep */}
          <button
            onClick={() => {
              sounds.soundSuccess();
              onStartGame();
            }}
            className="btn-3d btn-3d-purple w-full py-4 px-6 text-white font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span className="shimmer-sweep" />
            <Play className="w-5 h-5 fill-white drop-shadow" />
            <span className="tracking-wide font-black">{t.btnStartGame}</span>
          </button>
        </div>
      )}
    </div>
  );
};
