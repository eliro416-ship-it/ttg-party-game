import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Sparkles, Gamepad2, User, KeyRound, Globe } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';
import { translations } from '../utils/translations';

interface PlayerJoinScreenProps {
  onJoin: (pin: string, name: string, avatar: string, onError: (err: string) => void) => void;
  onBack: () => void;
  defaultPin?: string;
  language?: Language;
  onToggleLanguage?: () => void;
}

const AVATARS = ['🦁', '🚀', '🍕', '🎸', '🐬', '👑', '⚡', '🌟', '🦊', '🐼', '🐯', '🦄'];

export const PlayerJoinScreen: React.FC<PlayerJoinScreenProps> = ({
  onJoin,
  onBack,
  defaultPin = '',
  language = 'he',
  onToggleLanguage,
}) => {
  const t = translations[language];
  const isEn = language === 'en';

  const [pin, setPin] = useState(defaultPin);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('player_name');
    if (savedName) setName(savedName);
    const savedAvatar = localStorage.getItem('player_avatar');
    if (savedAvatar) setSelectedAvatar(savedAvatar);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;

    if (!pin.trim()) {
      sounds.soundError();
      setError(isEn ? 'Please enter a valid room PIN' : 'אנא הזן קוד PIN תקין שקיבלת מהמארח');
      return;
    }
    if (!name.trim()) {
      sounds.soundError();
      setError(isEn ? 'Please enter your name' : 'אנא הזן את שמך כדי שנדע מי משחק');
      return;
    }

    localStorage.setItem('player_name', name.trim());
    localStorage.setItem('player_avatar', selectedAvatar);

    setIsJoining(true);
    setError('');

    onJoin(pin.trim(), name.trim(), selectedAvatar, (errMessage: string) => {
      setIsJoining(false);
      sounds.soundError();
      setError(errMessage || (isEn ? 'Invalid room PIN code! Ask host for PIN.' : 'קוד PIN שגוי! בקש את הקוד התקין מהמארח.'));
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
            <span>{isEn ? 'Player' : 'שחקן'}</span>
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
          <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-amber-400" />
            {t.labelPin}:
          </label>
          <input
            type="text"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
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
            {isEn ? 'Choose Avatar:' : 'בחר דמות שחקן:'}
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
                className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                  selectedAvatar === av
                    ? 'bg-pink-500/40 border-2 border-pink-400 scale-105 shadow-md shadow-pink-500/30'
                    : 'bg-white/5 border border-white/10 hover:bg-white/15 opacity-80 hover:opacity-100'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isJoining}
          className="w-full mt-2 py-4 px-6 bg-gradient-to-r from-[#FD79A8] to-[#E84393] hover:from-[#fc659a] hover:to-[#d83584] active:scale-98 disabled:opacity-60 text-white font-black text-lg rounded-2xl shadow-xl shadow-pink-900/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          {isJoining ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5 text-white" />
          )}
          <span>{isJoining ? (isEn ? 'Connecting...' : 'מתחבר לחדר...') : t.btnJoin}</span>
        </button>
      </form>
    </div>
  );
};
