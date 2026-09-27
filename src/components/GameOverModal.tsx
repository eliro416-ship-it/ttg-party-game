import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, Language } from '../types/game';
import { Trophy, RotateCcw, Home, Flame } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  players: Player[];
  totalCardsPlayed: number;
  onRestart: () => void;
  onHome: () => void;
  language?: Language;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  players,
  totalCardsPlayed,
  onRestart,
  onHome,
  language = 'he',
}) => {
  const isEn = language === 'en';

  useEffect(() => {
    if (isOpen) {
      sounds.soundWin();
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 350);
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="bg-gradient-to-b from-[#2D1454] to-[#1E1B4B] border border-white/20 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
            <Trophy className="w-10 h-10 text-slate-900" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-white mb-1">
            {isEn ? 'Game Over! Well Played 🎉' : 'כל הכבוד! סיום משחק 🎉'}
          </h2>
          <p className="text-sm text-slate-300 mb-6">
            {isEn
              ? `Total of ${totalCardsPlayed} cards solved in this session`
              : `נוחשו סה״כ ${totalCardsPlayed} קלפים בסיבוב הזה`}
          </p>

          {/* Winner Spotlight */}
          {winner && (
            <div className="p-4 mb-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-center">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-1">
                {isEn ? '🏆 Grand Champion' : '🏆 המנצח הגדול'}
              </span>
              <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                <span>{winner.avatar}</span>
                <span>{winner.name}</span>
              </div>
              <div className="text-amber-300 font-extrabold text-lg mt-1">
                {winner.score} {isEn ? 'points!' : 'נקודות!'}
              </div>
            </div>
          )}

          {/* Scoreboard */}
          <div className="mb-6 space-y-2 max-h-48 overflow-y-auto pr-1">
            {sortedPlayers.map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  idx === 0
                    ? 'bg-amber-500/15 border-amber-400/30 text-amber-200 font-bold'
                    : 'bg-white/5 border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-slate-400">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                  </span>
                  <span className="text-lg">{player.avatar}</span>
                  <span className="font-semibold text-sm">{player.name}</span>
                  {player.isHost && (
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded-full">
                      {isEn ? 'Host' : 'מארח'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {player.streak > 1 && (
                    <span className="text-xs text-orange-400 flex items-center">
                      <Flame className="w-3.5 h-3.5" />
                      x{player.streak}
                    </span>
                  )}
                  <span className="font-extrabold text-base text-emerald-400">
                    {player.score} {isEn ? 'pts' : 'נק׳'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onRestart}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{isEn ? 'Play Again' : 'שחק שוב'}</span>
            </button>
            <button
              onClick={onHome}
              className="py-3.5 px-4 bg-white/10 hover:bg-white/15 active:scale-95 text-slate-200 font-bold rounded-2xl border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Home className="w-5 h-5" />
              <span>{isEn ? 'Home' : 'תפריט'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
