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

// Subcomponent: Strictly isolated text node for the timer seconds
// ZERO global setState — only this tiny text re-renders on the second tick!
const CountdownText: React.FC<{
  roundStatus: 'waiting' | 'active' | 'ended';
  roundEndsAt: number;
  turnDuration: number;
  onTimeUp: () => void;
  onWarningChange?: (isWarning: boolean) => void;
}> = React.memo(({ roundStatus, roundEndsAt, turnDuration, onTimeUp, onWarningChange }) => {
  const [displaySeconds, setDisplaySeconds] = useState<number>(() => {
    if (roundStatus === 'active' && roundEndsAt > Date.now()) {
      return Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
    }
    return turnDuration;
  });

  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const onWarningChangeRef = useRef(onWarningChange);
  onWarningChangeRef.current = onWarningChange;

  const isHandledRef = useRef<boolean>(false);
  const lastTickedSecondRef = useRef<number>(-1);

  // Reset handled flag whenever a new round starts or endsAt changes
  useEffect(() => {
    if (roundStatus === 'active') {
      isHandledRef.current = false;
      lastTickedSecondRef.current = -1;
    }
  }, [roundStatus, roundEndsAt]);

  useEffect(() => {
    if (roundStatus !== 'active' || !roundEndsAt || roundEndsAt <= Date.now()) {
      setDisplaySeconds(turnDuration);
      lastTickedSecondRef.current = -1;
      onWarningChangeRef.current?.(false);
      return;
    }

    const checkSeconds = () => {
      const msRemaining = roundEndsAt - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(msRemaining / 1000));

      setDisplaySeconds((prev) => (prev !== remainingSeconds ? remainingSeconds : prev));

      const isWarn = remainingSeconds <= 4 && remainingSeconds > 0;
      onWarningChangeRef.current?.(isWarn);

      if (remainingSeconds <= 4 && remainingSeconds > 0 && lastTickedSecondRef.current !== remainingSeconds) {
        lastTickedSecondRef.current = remainingSeconds;
        sounds.soundTick();
      }

      if (remainingSeconds === 0 && !isHandledRef.current) {
        isHandledRef.current = true;
        onWarningChangeRef.current?.(false);
        onTimeUpRef.current();
      }
    };

    checkSeconds();
    const interval = setInterval(checkSeconds, 200);

    return () => clearInterval(interval);
  }, [roundStatus, roundEndsAt, turnDuration]);

  if (roundStatus === 'waiting') {
    return (
      <span className="font-mono font-black text-xs sm:text-sm tracking-tight tabular-nums select-none text-amber-300">
        {turnDuration === 60 ? '1m' : `${turnDuration}s`}
      </span>
    );
  }

  const isWarn = displaySeconds <= 4 && displaySeconds > 0;

  return (
    <span
      className={`font-mono font-black text-xs sm:text-sm tracking-tight tabular-nums select-none ${
        isWarn ? 'text-rose-400 font-extrabold' : 'text-white'
      }`}
    >
      {displaySeconds}s
    </span>
  );
});

CountdownText.displayName = 'CountdownText';

export const GameTimer: React.FC<GameTimerProps> = React.memo(({
  roundStatus,
  roundEndsAt,
  turnDuration,
  isEn,
  onTimeUp,
  showTimerPicker = false,
  onToggleTimerPicker,
}) => {
  const [isWarning, setIsWarning] = useState<boolean>(false);

  return (
    <div
      className={`flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border shadow-xl transition-colors ${
        isWarning ? 'border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 'border-white/20'
      }`}
    >
      <TimerIcon
        className={`w-3.5 h-3.5 ${
          roundStatus === 'waiting'
            ? 'text-amber-400'
            : isWarning
            ? 'text-rose-400'
            : 'text-emerald-400'
        }`}
        strokeWidth={2.4}
      />

      <CountdownText
        roundStatus={roundStatus}
        roundEndsAt={roundEndsAt}
        turnDuration={turnDuration}
        onTimeUp={onTimeUp}
        onWarningChange={setIsWarning}
      />

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

