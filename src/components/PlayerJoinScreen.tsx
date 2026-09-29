import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  KeyRound,
  User,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { Language } from '../types/game';
import { translations } from '../utils/translations';
import { sounds } from '../utils/audio';

interface PlayerJoinScreenProps {
  onJoin: (pin: string, name: string, avatar: string, onError?: (msg: string) => void) => void;
  onBack: () => void;
  defaultPin?: string;
  isDirectLink?: boolean;
  language: Language;
  onToggleLanguage?: () => void;
}

const AVATARS = ['🦁', '🚀', '🍕', '🎸', '🐬', '👑', '⚡', '🌟', '🦊', '🐼', '🐯', '🦄'];

export const PlayerJoinScreen: React.FC<PlayerJoinScreenProps> = ({
  onJoin,
  onBack,
  defaultPin = '',
  isDirectLink = false,
  language = 'he',
  onToggleLanguage,
}) => {
  const t = translations[language];
  const isEn = language === 'en';

  // Only auto-fill when coming from an explicit direct invite link (?pin=XXXX)
  const initialPin = isDirectLink && defaultPin ? defaultPin.trim() : '';
  const [pin, setPin] = useState(initialPin);
  const [isAutoFilled, setIsAutoFilled] = useState(Boolean(isDirectLink && initialPin));
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Sync if defaultPin or isDirectLink changes
  useEffect(() => {
    if (isDirectLink && defaultPin && defaultPin.trim()) {
      setPin(defaultPin.trim());
      setIsAutoFilled(true);
    } else if (!isDirectLink) {
      setPin('');
      setIsAutoFilled(false);
    }
  }, [defaultPin, isDirectLink]);

  useEffect(() => {
    const savedName = localStorage.getItem('player_name');
    if (savedName) setName(savedName);
    const savedAvatar = localStorage.getItem('player_avatar');
    if (savedAvatar) setSelectedAvatar(savedAvatar);

    // If PIN is auto-filled from direct link, focus the name input;
    // Otherwise in manual entry, focus the PIN input so user can type immediately
    if (isDirectLink && defaultPin && defaultPin.trim()) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } else {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 50);
    }
  }, [isDirectLink, defaultPin]);

  // Validation: Button active ONLY after at least 4 digits PIN and a player name entered
  const isPinValid = pin.trim().length >= 4;
  const isNameValid = name.trim().length >= 1;
  const canSubmit = isPinValid && isNameValid && !isJoining;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!isPinValid) {
      sounds.soundError();
      setError(isEn ? 'Please enter at least 4 digits for the room PIN' : 'אנא הזן/י לפחות 4 ספרות לקוד ה-PIN');
      return;
    }
    if (!isNameValid) {
      sounds.soundError();
      setError(isEn ? 'Please enter your name' : 'אנא הזן/י את שמך כדי שנדע מי משחק/ת');
      return;
    }

    setIsJoining(true);
    try {
      localStorage.setItem('player_name', name.trim());
      localStorage.setItem('player_avatar', selectedAvatar);
      localStorage.setItem('ttg_room_pin', pin.trim());
      localStorage.removeItem('ttg_current_guess');
    } catch (e) {}

    sounds.soundSuccess();
    setError('');

    // Instant transition directly to game screen:
    onJoin(pin.trim(), name.trim(), selectedAvatar, (errMessage?: string) => {
      setIsJoining(false);
      sounds.soundError();
      setError(
        errMessage ||
          (isEn
            ? 'Invalid room PIN code! Ask host for PIN.'
            : 'קוד PIN שגוי! בקש/י את הקוד התקין מהמארח/ת.')
      );
    });
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top back navigation */}
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
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold border border-pink-500/30">
            <Gamepad2 className="w-3.5 h-3.5 text-pink-400" />
            <span>{isEn ? 'Player' : 'משתתף/ת'}</span>
          </span>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-400">
        {t.joinTitle}
      </h1>
      <p className="text-xs sm:text-sm text-slate-300 text-center mb-5">
        {t.joinSub}
      </p>

      {error && (
        <div className="w-full mb-4 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-200 text-xs font-semibold text-center animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {/* PIN Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              {t.labelPin}:
            </label>
            {/* Show badge ONLY when auto-filled from direct link */}
            {isAutoFilled && isDirectLink && pin.length >= 4 && (
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-fadeIn">
                {isEn ? 'PIN auto-filled ✨' : 'הוזן אוטומטית מהקישור ✨'}
              </span>
            )}
          </div>
          <input
            ref={pinInputRef}
            type="text"
            inputMode="numeric"
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
              setPin(val);
              setIsAutoFilled(false);
              setError('');
            }}
            placeholder={isEn ? 'e.g. 7742' : 'למשל: 7742'}
            maxLength={6}
            className="w-full py-3.5 px-4 bg-white/10 border-2 border-white/20 focus:border-pink-500 focus:bg-white/15 rounded-2xl text-center text-2xl font-mono font-bold tracking-widest text-amber-300 placeholder:text-slate-500 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm transition-all focus:outline-none"
          />
        </div>

        {/* Player Name */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-pink-400" />
            {t.labelName}:
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder={isEn ? 'Enter your name' : 'הכנס את שמך'}
            maxLength={18}
            className="w-full py-3.5 px-4 bg-white/10 border-2 border-white/20 focus:border-pink-500 focus:bg-white/15 rounded-2xl text-center text-lg font-bold text-white placeholder:text-slate-500 transition-all focus:outline-none"
          />
        </div>

        {/* Avatar Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1.5">
            {isEn ? 'Choose Avatar:' : 'בחר/י דמות משתתף/ת:'}
          </label>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => {
                  sounds.soundKeypress();
                  setSelectedAvatar(av);
                }}
                className={`btn-3d h-12 rounded-xl text-xl flex items-center justify-center cursor-pointer ${
                  selectedAvatar === av
                    ? 'btn-3d-pink border-2 border-pink-300 scale-105'
                    : 'btn-3d-dark opacity-85 hover:opacity-100'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Submit - active ONLY when at least 4 digits PIN and name are entered */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`btn-3d w-full mt-3 py-4 px-6 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2.5 shadow-lg transition-all ${
            canSubmit
              ? 'btn-3d-pink cursor-pointer active:scale-98 opacity-100'
              : 'bg-white/10 border-2 border-white/15 opacity-40 cursor-not-allowed pointer-events-none text-slate-400'
          }`}
        >
          {canSubmit && <span className="shimmer-sweep" />}
          <Sparkles className="w-5 h-5 text-white drop-shadow" />
          <span>{t.btnJoin}</span>
        </button>
      </form>
    </div>
  );
};
