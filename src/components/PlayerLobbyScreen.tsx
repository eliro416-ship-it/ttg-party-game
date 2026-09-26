import React, { useState } from 'react';
import { Player, Language } from '../types/game';
import { translations } from '../utils/translations';
import {
  Users,
  Copy,
  Check,
  LogOut,
  Radio,
  Hourglass,
  Globe,
  Sparkles,
  Trophy
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface PlayerLobbyScreenProps {
  pin: string;
  players: Player[];
  myPlayerId: string;
  turnDuration: number;
  onLeave: () => void;
  onOpenShareModal?: () => void;
  language?: Language;
  onToggleLanguage?: () => void;
  onOpenLeaderboard?: () => void;
}

export const PlayerLobbyScreen: React.FC<PlayerLobbyScreenProps> = ({
  pin,
  players,
  myPlayerId,
  turnDuration,
  onLeave,
  language = 'he',
  onToggleLanguage,
  onOpenLeaderboard,
}) => {
  const t = translations[language];
  const isEn = language === 'en';
  const [copied, setCopied] = useState(false);

  const myPlayer = players.find((p) => p.id === myPlayerId) || {
    id: myPlayerId,
    name: isEn ? 'You' : 'אתה',
    avatar: '🦁',
    score: 0,
    isHost: false,
    streak: 0,
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    sounds.soundSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top action bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => {
            sounds.soundKeypress();
            onLeave();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 text-xs font-semibold transition-all cursor-pointer"
        >
          <LogOut className={`w-3.5 h-3.5 ${isEn ? 'mr-1' : 'ml-1'}`} />
          <span>{t.leaveGame}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenLeaderboard && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onOpenLeaderboard();
              }}
              className="bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/40 text-amber-200 hover:text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={isEn ? 'Global Leaderboard' : 'טבלת שיאים עולמית'}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{isEn ? 'Leaderboard' : 'טבלת שיאים'}</span>
            </button>
          )}

          {onToggleLanguage && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onToggleLanguage();
              }}
              className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <Globe className="w-3 h-3 text-pink-400" />
              <span>{t.langBtn}</span>
            </button>
          )}

          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>PIN: {pin}</span>
          </span>
        </div>
      </div>

      {/* Player greeting card */}
      <div className="w-20 h-20 mx-auto mb-2 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-3xl p-1 shadow-xl flex items-center justify-center animate-bounce">
        <span className="text-4xl">{myPlayer.avatar}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-100 to-pink-300">
        {isEn ? `Welcome, ${myPlayer.name}!` : `ברוך הבא, ${myPlayer.name}!`}
      </h1>
      <p className="text-xs sm:text-sm text-slate-300 text-center mb-4">
        {isEn ? 'You are connected to the live room' : 'התחברת בהצלחה לחדר המשחק החי'}
      </p>

      {/* Waiting for host pulse card */}
      <div className="w-full bg-gradient-to-br from-purple-900/40 via-black/40 to-pink-900/30 border border-purple-500/30 rounded-3xl p-5 text-center shadow-2xl mb-4 relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Hourglass className="w-5 h-5 text-amber-300 animate-spin" />
          <span className="text-sm font-extrabold text-amber-300">
            {isEn ? 'Waiting for host to start...' : 'ממתין למארח/ת שיתחיל את המשחק...'}
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
          {isEn
            ? 'When the host clicks "Start Game", your device will automatically sync into the round!'
            : 'ברגע שהמארח/ת ילחץ על התחלת המשחק, המכשיר שלך יכנס אוטומטית לסיבוב הראשון!'}
        </p>

        {/* PIN Copy quick button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleCopyPin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white border border-white/15 transition-all cursor-pointer shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t.pinCopied : t.copyPin}</span>
          </button>
        </div>
      </div>

      {/* Connected Players list */}
      <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-3 ${isEn ? 'text-left' : 'text-right'}`}>
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            <span>{t.connectedPlayers} ({players.length})</span>
          </span>
          <span className="text-[10px] text-pink-300 bg-pink-500/20 px-2 py-0.5 rounded-full font-bold">
            ⏱️ {turnDuration === 60 ? (isEn ? '1m/turn' : 'דקה לתור') : `${turnDuration}${isEn ? 's' : ' שנ׳'}`}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => {
            const isMe = p.id === myPlayerId;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  isMe
                    ? 'bg-pink-500/25 border-pink-400/40 text-white font-bold'
                    : 'bg-white/5 border-white/10 text-slate-200'
                }`}
              >
                <span className="text-lg">{p.avatar}</span>
                <span className="truncate flex-1">{p.name}</span>
                {p.isHost && (
                  <span className="text-[10px] text-amber-300 bg-amber-400/20 px-1 rounded">
                    👑
                  </span>
                )}
                {isMe && (
                  <span className="text-[10px] text-pink-300">
                    {t.you}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip pill */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        <span>{isEn ? 'Tip: Ask yes/no questions to narrow down the clue!' : 'טיפ: שאלו שאלות של כן/לא כדי לצמצם את האפשרויות!'}</span>
      </div>
    </div>
  );
};
