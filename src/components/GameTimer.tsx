import React, { useState, useEffect, useRef } from 'react';
import { Timer as TimerIcon, Settings } from 'lucide-react';
import { sounds } from '../utils/audio';

interface GameTimerProps {
  roundStatus: 'waiting' | 'active' | 'ended';
  roundEndsAt: number;
  turnDuration: number;
  isEn: boolean;
  onTimeUp: () => void;
  showTimerPicker?: boolean;
  onToggleTimerPicker?: () => void;
}

export const GameTimer: React.FC<GameTimerProps> = React.memo(({
  roundStatus,
  roundEndsAt,
  turnDuration,
  isEn,
  onTimeUp,
  showTimerPicker = false,
  onToggleTimerPicker,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (roundStatus === 'active' && roundEndsAt > Date.now()) {
      return Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
    }
    return turnDuration;
  });

  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const isHandledRef = useRef<boolean>(false);

  // Reset handled flag whenever a new round starts
  useEffect(() => {
    if (roundStatus === 'active') {
      isHandledRef.current = false;
    }
  }, [roundStatus, roundEndsAt]);

  useEffect(() => {
    if (roundStatus !== 'active' || !roundEndsAt) {
      setTimeLeft(turnDuration);
      return;
    }

    const updateCountdown = () => {
      const msRemaining = roundEndsAt - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 4 && remainingSeconds > 0) {
        sounds.soundTick();
      }

      if (remainingSeconds === 0 && !isHandledRef.current) {
        isHandledRef.current = true;
        onTimeUpRef.current();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 250);

    return () => clearInterval(interval);
  }, [roundStatus, roundEndsAt, turnDuration]);

  const isWarning = roundStatus === 'active' && timeLeft <= 4 && timeLeft > 0;

  return (
    <div
      className={`flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border shadow-xl transition-all ${
        isWarning ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.6)]' : 'border-white/20'
      }`}
    >
      <TimerIcon
        className={`w-3.5 h-3.5 ${
          roundStatus === 'waiting'
            ? 'text-amber-400'
            : isWarning
            ? 'text-rose-400 animate-pulse'
            : 'text-emerald-400'
        }`}
        strokeWidth={2.4}
      />
      <span
        className={`font-mono font-black text-xs sm:text-sm tracking-tight ${
          roundStatus === 'waiting'
            ? 'text-amber-300'
            : isWarning
            ? 'text-rose-400 animate-ping font-extrabold'
            : 'text-white'
        }`}
      >
        {roundStatus === 'waiting'
          ? turnDuration === 60
            ? '1m'
            : `${turnDuration}s`
          : `${timeLeft}s`}
      </span>

      {onToggleTimerPicker && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            sounds.soundKeypress();
            onToggleTimerPicker();
          }}
          title={isEn ? 'Change turn timer' : 'שנה זמן טיימר'}
          className="text-slate-400 hover:text-pink-300 transition-colors cursor-pointer"
        >
          <Settings className="w-3 h-3" strokeWidth={2} />
        </button>
      )}
    </div>
  );
});

GameTimer.displayName = 'GameTimer';
