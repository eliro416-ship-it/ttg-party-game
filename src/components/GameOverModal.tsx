import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player, Language } from '../types/game';
import { Trophy, RotateCcw, Home, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameOverModalProps {
  isOpen: boolean;
  players: Player[];
  totalCardsPlayed: number;
  onRestart: () => void;
  onHome: () => void;
  onOpenStore?: () => void;
  language?: Language;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  players,
  totalCardsPlayed,
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
  const first = sortedPlayers[0];
  const second = sortedPlayers[1];
  const third = sortedPlayers[2];
  const rest = sortedPlayers.slice(3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <style>{`
        @keyframes winnerParticle1 {
          0%, 100% { transform: translate(-50%, 0) scale(0.8); opacity: 0.3; }
          50% { transform: translate(-50%, -14px) scale(1.2); opacity: 1; }
        }
        @keyframes winnerParticle2 {
          0%, 100% { transform: translateY(0px) scale(1.1); opacity: 0.9; }
          50% { transform: translateY(-16px) scale(0.7); opacity: 0.2; }
        }
        @keyframes winnerParticle3 {
          0%, 100% { transform: translateY(0px) scale(0.9); opacity: 0.3; }
          50% { transform: translateY(-18px) scale(1.3); opacity: 1; }
        }
        @keyframes winnerParticle4 {
          0%, 100% { transform: translateY(0px) scale(1.2); opacity: 0.8; }
          50% { transform: translateY(-12px) scale(0.6); opacity: 0.2; }
        }
        @keyframes winnerParticle5 {
          0%, 100% { transform: translateY(0px) scale(0.7); opacity: 0.4; }
          50% { transform: translateY(-15px) scale(1.1); opacity: 1; }
        }
        .animate-winner-particle-1 { animation: winnerParticle1 2.2s ease-in-out infinite; }
        .animate-winner-particle-2 { animation: winnerParticle2 2.6s ease-in-out infinite 0.3s; }
        .animate-winner-particle-3 { animation: winnerParticle3 2.4s ease-in-out infinite 0.7s; }
        .animate-winner-particle-4 { animation: winnerParticle4 2.8s ease-in-out infinite 0.1s; }
        .animate-winner-particle-5 { animation: winnerParticle5 2.5s ease-in-out infinite 0.9s; }
      `}</style>

      <div className="bg-gradient-to-b from-[#2D1454] to-[#1E1B4B] border border-white/20 rounded-3xl p-5 sm:p-7 w-full max-w-md sm:max-w-lg shadow-2xl text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 sm:w-18 sm:h-18 mx-auto mb-2 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
            <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-slate-900" strokeWidth={2.2} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-white mb-0.5 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow" strokeWidth={2.2} />
            <span>{isEn ? 'Game Over! Well Played' : 'כל הכבוד! סיום משחק'}</span>
            <Sparkles className="w-5 h-5 text-yellow-300 drop-shadow" strokeWidth={2.2} />
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-4 font-medium">
            {isEn
              ? `Total of ${totalCardsPlayed} cards solved in this session`
              : `נוחשו סה״כ ${totalCardsPlayed} קלפים בסיבוב הזה`}
          </p>

          {/* Luxury Gaming Podium (2nd | 1st | 3rd) */}
          <div className="flex items-end justify-center gap-2 sm:gap-3 mb-4 pt-3 px-1">
            {/* 2nd Place (Silver) */}
            {second && (
              <div className="flex-1 flex flex-col items-center max-w-[110px] animate-fadeIn" style={{ animationDelay: '150ms' }}>
                <div className="text-lg sm:text-xl mb-1 drop-shadow-md">🥈</div>
                <div className="relative mb-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-slate-400 via-slate-200 to-white p-[2px] shadow-[0_6px_16px_rgba(148,163,184,0.35)]">
                    <div className="w-full h-full bg-[#1b1938] rounded-[14px] flex items-center justify-center text-2xl sm:text-3xl">
                      {second.avatar}
                    </div>
                  </div>
                </div>
                <div className="font-black text-xs sm:text-sm text-slate-100 truncate w-full text-center px-1">
                  {second.name}
                </div>
                <div className="font-extrabold text-[11px] sm:text-xs text-slate-300 font-mono mb-2">
                  {second.score} {isEn ? 'pts' : 'נק׳'}
                </div>
                {/* Silver Pedestal */}
                <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-slate-300 via-slate-400 to-slate-600 border-t-2 border-x border-slate-100 shadow-[0_8px_20px_rgba(148,163,184,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)] flex flex-col items-center justify-start pt-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900/85 font-mono drop-shadow-sm leading-none">2</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-900 bg-white/75 px-2 py-0.5 rounded-full mt-1.5 shadow-sm">
                    {isEn ? '2nd' : 'מקום 2'}
                  </span>
                </div>
              </div>
            )}

            {/* 1st Place (Gold Winner with Particle Effect) */}
            {first && (
              <div className="flex-1 flex flex-col items-center max-w-[125px] z-10 animate-fadeIn">
                {/* Animated Crown */}
                <div className="text-2xl sm:text-3xl mb-0.5 animate-bounce drop-shadow-[0_2px_8px_rgba(234,179,8,0.7)]">
                  👑
                </div>
                {/* Winner Avatar with Particle Effect */}
                <div className="relative mb-1.5">
                  {/* Subtle Winner Particle Effect */}
                  <div className="absolute -inset-3 pointer-events-none overflow-visible">
                    <span className="absolute -top-3 left-1/2 text-sm animate-winner-particle-1">✨</span>
                    <span className="absolute top-1 -left-2 text-xs animate-winner-particle-2 text-amber-300">⭐</span>
                    <span className="absolute top-2 -right-2 text-xs animate-winner-particle-3 text-yellow-200">🌟</span>
                    <span className="absolute bottom-2 -left-3 text-xs animate-winner-particle-4 text-amber-200">✨</span>
                    <span className="absolute bottom-1 -right-3 text-xs animate-winner-particle-5 text-yellow-300">💫</span>
                  </div>

                  {/* Radiant Glow Aura */}
                  <div className="absolute inset-0 rounded-full bg-amber-400/35 blur-xl animate-pulse pointer-events-none" />

                  {/* Avatar Container */}
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 p-[3px] shadow-[0_0_25px_rgba(245,158,11,0.65)] relative z-10">
                    <div className="w-full h-full bg-[#1b1734] rounded-[13px] flex items-center justify-center text-3xl sm:text-4xl">
                      {first.avatar}
                    </div>
                  </div>
                </div>

                <div className="font-black text-sm sm:text-base text-amber-200 truncate w-full text-center px-1 drop-shadow-sm">
                  {first.name}
                </div>
                <div className="font-extrabold text-xs sm:text-sm text-amber-400 font-mono mb-2">
                  {first.score} {isEn ? 'pts' : 'נק׳'}
                </div>

                {/* Gold Pedestal */}
                <div className="w-full h-28 sm:h-32 rounded-t-2xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 border-t-2 border-x border-amber-100 shadow-[0_12px_30px_rgba(234,179,8,0.5),inset_0_2px_6px_rgba(255,255,255,0.7)] flex flex-col items-center justify-start pt-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-950 font-mono drop-shadow-sm leading-none">1</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 bg-amber-200 px-2.5 py-0.5 rounded-full mt-2 shadow-sm border border-amber-300/80">
                    {isEn ? 'Winner 🥇' : 'אלוף 🥇'}
                  </span>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {third && (
              <div className="flex-1 flex flex-col items-center max-w-[105px] animate-fadeIn" style={{ animationDelay: '300ms' }}>
                <div className="text-lg sm:text-xl mb-1 drop-shadow-md">🥉</div>
                <div className="relative mb-1.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 p-[2px] shadow-[0_6px_14px_rgba(180,83,9,0.35)]">
                    <div className="w-full h-full bg-[#1b1938] rounded-[14px] flex items-center justify-center text-xl sm:text-2xl">
                      {third.avatar}
                    </div>
                  </div>
                </div>
                <div className="font-black text-xs sm:text-sm text-amber-100 truncate w-full text-center px-1">
                  {third.name}
                </div>
                <div className="font-extrabold text-[11px] sm:text-xs text-amber-300 font-mono mb-2">
                  {third.score} {isEn ? 'pts' : 'נק׳'}
                </div>
                {/* Bronze Pedestal */}
                <div className="w-full h-15 sm:h-18 rounded-t-2xl bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border-t-2 border-x border-amber-400 shadow-[0_6px_15px_rgba(180,83,9,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] flex flex-col items-center justify-start pt-2">
                  <span className="text-xl sm:text-2xl font-black text-amber-100 font-mono drop-shadow-sm leading-none">3</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-950 bg-amber-400/90 px-2 py-0.5 rounded-full mt-1.5 shadow-sm">
                    {isEn ? '3rd' : 'מקום 3'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Any remaining players (4th place and below) */}
          {rest.length > 0 && (
            <div className="mb-4 p-2.5 rounded-2xl bg-black/30 border border-white/10 max-h-24 overflow-y-auto space-y-1.5 text-xs">
              {rest.map((player, idx) => (
                <div key={player.id} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold font-mono text-[11px]">{idx + 4}.</span>
                    <span className="text-base">{player.avatar}</span>
                    <span className="font-semibold text-slate-200 text-xs">{player.name}</span>
                    {player.isHost && (
                      <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded-full font-bold">
                        {isEn ? 'Host' : 'מארח/ת'}
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-300 font-mono text-xs">
                    {player.score} {isEn ? 'pts' : 'נק׳'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Upsell Banner to unlock 100+ cards */}
          {onOpenStore && (
            <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-purple-900/50 via-pink-900/40 to-amber-900/40 border border-amber-400/40 shadow-lg flex items-center justify-between gap-2.5">
              <div className="text-right">
                <span className="text-xs font-black text-amber-200 flex items-center gap-1">
                  <span>💎</span>
                  <span>{isEn ? 'Want more fun & variety?' : 'רוצים עוד אקשן וגיוון?'}</span>
                </span>
                <span className="text-[11px] text-slate-300 block">
                  {isEn ? 'Unlock 100+ new cards and packs!' : 'פתחו מעל 100 קלפים וחבילות חדשות!'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.soundKeypress();
                  onOpenStore();
                }}
                className="btn-3d btn-3d-amber px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-950 flex items-center gap-1 cursor-pointer shrink-0 shadow-md hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(180deg, #fde047 0%, #eab308 100%)',
                  boxShadow: '0 3px 0 #a16207, 0 6px 12px rgba(234, 179, 8, 0.35)',
                }}
              >
                <span>{isEn ? 'View Store ⚡' : 'פתח חבילות ⚡'}</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                sounds.soundSuccess();
                onRestart();
              }}
              className="btn-3d btn-3d-emerald flex-1 py-4 px-4 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="shimmer-sweep" />
              <RotateCcw className="w-5 h-5 drop-shadow" />
              <span>{isEn ? 'Play Again' : 'שחק שוב'}</span>
            </button>
            <button
              onClick={() => {
                sounds.soundKeypress();
                onHome();
              }}
              className="btn-3d btn-3d-dark py-4 px-5 text-slate-200 font-extrabold rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
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
