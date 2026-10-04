import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, Language } from '../types/game';
import { Trophy, RotateCcw, Home, Sparkles, Crown, Loader2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  players: Player[];
  totalCardsPlayed: number;
  isHost?: boolean;
  onRestart: () => void;
  onHome: () => void;
  onOpenStore?: () => void;
  language?: Language;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  players,
  totalCardsPlayed,
  isHost = false,
  onRestart,
  onHome,
  onOpenStore,
  language = 'he',
}) => {
  const isEn = language === 'en';

  useEffect(() => {
    if (isOpen) {
      sounds.soundWin();
      try {
        // Continuous celebratory confetti bursts
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });

        const timer1 = setTimeout(() => {
          confetti({
            particleCount: 90,
            angle: 60,
            spread: 60,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 90,
            angle: 120,
            spread: 60,
            origin: { x: 1 },
          });
        }, 400);

        const timer2 = setTimeout(() => {
          confetti({
            particleCount: 70,
            spread: 100,
            origin: { y: 0.7 },
          });
        }, 900);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const first = sortedPlayers[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto animate-fadeIn select-none"
      dir={isEn ? 'ltr' : 'rtl'}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes floatCrown {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-8px) rotate(4deg) scale(1.08); }
        }
        @keyframes auraPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        .animate-float-crown {
          animation: floatCrown 2.5s ease-in-out infinite;
        }
        .animate-aura-pulse {
          animation: auraPulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Confetti & Aura Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-500/25 via-purple-600/20 to-pink-500/25 rounded-full blur-[100px] animate-aura-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-gradient-to-b from-[#1c1438] via-[#120f26] to-[#0a0c16] border-2 border-amber-400/40 rounded-3xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(234,179,8,0.2)] text-center my-auto flex flex-col gap-4">
        {/* א. כותרת ואפקט ניצחון */}
        <div className="flex flex-col items-center gap-1.5 pt-1">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center mb-1">
            <div className="w-full h-full bg-[#16122e] rounded-[14px] flex items-center justify-center">
              <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_3px_12px_rgba(234,179,8,0.6)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>{isEn ? 'Game Over!' : 'המשחק הסתיים!'}</span>
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </h1>

          <p className="text-xs sm:text-sm text-purple-200/90 font-medium">
            {isEn
              ? `All ${totalCardsPlayed} host cards were played`
              : `שוחקו כל ${totalCardsPlayed} הקלפים של המארח`}
          </p>
        </div>

        {/* ב. הכרזה על המנצח/ת (Winner Spotlight) */}
        {first && (
          <div className="relative rounded-3xl p-5 bg-gradient-to-b from-[#2a1d0f]/90 via-[#1c152a]/90 to-[#100d1e]/90 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45),inset_0_1px_4px_rgba(255,255,255,0.4)] flex flex-col items-center gap-2.5 overflow-hidden">
            {/* Ambient gold glow */}
            <div className="absolute inset-0 bg-radial from-amber-400/15 via-transparent to-transparent pointer-events-none" />

            {/* כתר זהב מונפש מעל שם המנצח/ת */}
            <div className="text-4xl sm:text-5xl animate-float-crown drop-shadow-[0_4px_16px_rgba(245,158,11,0.8)]">
              👑
            </div>

            {/* אווטאר המנצח/ת במסגרת יוקרתית */}
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-[3px] shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                <div className="w-full h-full bg-[#181333] rounded-[13px] flex items-center justify-center text-4xl sm:text-5xl">
                  {first.avatar}
                </div>
              </div>
            </div>

            {/* שם השחקן/ית באותיות גדולות ומודגשות */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-400">
                {isEn ? 'First Place Champion' : 'אלוף המקום הראשון 🥇'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                {first.name}
              </h2>
            </div>

            {/* סך נקודות בעיצוב תגית זהב */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 font-black text-sm sm:text-base shadow-[0_4px_16px_rgba(234,179,8,0.5)]">
              <span>⭐</span>
              <span>
                {first.score || 0} {isEn ? 'Points' : 'נקודות'}
              </span>
            </div>

            {/* כמות ניחושים מדויקים */}
            <div className="text-xs text-amber-200/90 font-bold flex items-center gap-1.5 mt-0.5">
              <span>🎯</span>
              <span>
                {first.correctGuesses ?? Math.floor((first.score || 0) / 10)}{' '}
                {isEn ? 'accurate guesses' : 'ניחושים מדויקים'}
              </span>
            </div>
          </div>
        )}

        {/* ג. פודיום ולוח תוצאות מלא (Leaderboard Table) */}
        <div className="flex flex-col gap-2 text-right">
          <div className="flex items-center justify-between px-1 text-xs font-black text-slate-300">
            <span>{isEn ? 'Final Leaderboard' : 'לוח תוצאות סופי'}</span>
            <span className="text-[11px] text-slate-400 font-normal">
              {sortedPlayers.length} {isEn ? 'participants' : 'משתתפים'}
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {sortedPlayers.map((player, idx) => {
              const rank = idx + 1;
              const guesses = player.correctGuesses ?? Math.floor((player.score || 0) / 10);

              let rankBadge = `${rank}`;
              let rowStyle = 'bg-slate-900/50 border-slate-700/60 text-slate-300';

              if (rank === 1) {
                rankBadge = '🥇';
                rowStyle =
                  'bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-slate-900/70 border-amber-400/80 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]';
              } else if (rank === 2) {
                rankBadge = '🥈';
                rowStyle =
                  'bg-gradient-to-r from-slate-800/70 via-slate-800/40 to-slate-900/70 border-slate-300/80 text-slate-100 shadow-[0_0_12px_rgba(203,213,225,0.2)]';
              } else if (rank === 3) {
                rankBadge = '🥉';
                rowStyle =
                  'bg-gradient-to-r from-amber-950/40 via-stone-900/40 to-slate-900/70 border-amber-600/70 text-amber-300 shadow-[0_0_10px_rgba(180,83,9,0.2)]';
              }

              return (
                <div
                  key={player.id}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition-all ${rowStyle}`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-6 text-center text-sm font-black font-mono">
                      {rankBadge}
                    </span>
                    <span className="text-xl sm:text-2xl">{player.avatar}</span>
                    <div className="flex flex-col text-right truncate">
                      <span className="font-black text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {player.isHost && (
                          <span className="text-[9px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-1.5 py-0.2 rounded-full font-bold">
                            {isEn ? 'Host' : 'מארח/ת'}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        🎯 {guesses} {isEn ? 'guesses' : 'ניחושים'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm shrink-0">
                    <span className="text-amber-300">{player.score || 0}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-medium">
                      {isEn ? 'pts' : 'נק׳'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upsell Store Banner */}
        {onOpenStore && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/50 via-pink-900/40 to-amber-900/40 border border-amber-400/30 flex items-center justify-between gap-2.5">
            <div className="text-right">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                <span>💎</span>
                <span>{isEn ? 'Want more card packs?' : 'רוצים עוד חבילות קלפים?'}</span>
              </span>
              <span className="text-[10px] text-slate-300 block">
                {isEn ? 'Unlock 100+ cards and themes permanently' : 'פתחו מעל 100 קלפים ונושאים חדשים לצמיתות'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                sounds.soundKeypress();
                onOpenStore();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-md active:scale-95 cursor-pointer shrink-0"
            >
              {isEn ? 'Open Store ⚡' : 'חנות קלפים ⚡'}
            </button>
          </div>
        )}

        {/* ד. כפתורי פעולה בתחתית */}
        <div className="pt-1 flex flex-col gap-2 w-full">
          {isHost ? (
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  sounds.soundSuccess();
                  onRestart();
                }}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black text-sm shadow-[0_4px_16px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/50 hover:brightness-105"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isEn ? 'Play Again 🔄' : 'משחק חוזר 🔄'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.soundKeypress();
                  onHome();
                }}
                className="py-3.5 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{isEn ? 'Lobby 🏠' : 'חזרה ללובי 🏠'}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <div className="py-2.5 px-3 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>
                  {isEn
                    ? 'Waiting for host to start a new game...'
                    : 'ממתין למארח להתחלת משחק חדש...'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.soundKeypress();
                  onHome();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-200 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>{isEn ? 'Back to Lobby 🏠' : 'חזרה ללובי 🏠'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
