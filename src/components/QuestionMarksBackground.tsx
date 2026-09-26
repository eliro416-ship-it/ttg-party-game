import React, { useState, useCallback, useEffect } from 'react';

interface FloatingQuestionMark {
  id: string;
  x: number; // percentage
  y: number; // percentage
  size: number; // pixels
  colorScheme: 'pink' | 'purple' | 'cyan' | 'yellow' | 'coral' | 'lime';
  animationType: 'gentle' | 'bob' | 'sway';
  animationDuration: number; // seconds
  delay: number; // seconds
  opacity: number;
  rotation: number; // initial deg
  isBadge?: boolean;
}

// Preset question marks strategically placed around the viewport and directly behind the center card
const PRESET_MARKS: FloatingQuestionMark[] = [
  // Directly behind center card area (prominent, vibrant, visible through glass)
  { id: 'qm-center-1', x: 48, y: 18, size: 54, colorScheme: 'pink', animationType: 'bob', animationDuration: 8.5, delay: 0, opacity: 0.88, rotation: 12 },
  { id: 'qm-center-2', x: 38, y: 34, size: 48, colorScheme: 'cyan', animationType: 'sway', animationDuration: 10, delay: 1.2, opacity: 0.85, rotation: -15 },
  { id: 'qm-center-3', x: 62, y: 38, size: 58, colorScheme: 'yellow', animationType: 'gentle', animationDuration: 9, delay: 2.1, opacity: 0.9, rotation: 14, isBadge: true },
  { id: 'qm-center-4', x: 44, y: 52, size: 62, colorScheme: 'purple', animationType: 'sway', animationDuration: 11, delay: 0.5, opacity: 0.85, rotation: -10 },
  { id: 'qm-center-5', x: 58, y: 64, size: 50, colorScheme: 'lime', animationType: 'bob', animationDuration: 9.5, delay: 1.8, opacity: 0.88, rotation: 18 },
  { id: 'qm-center-6', x: 36, y: 72, size: 46, colorScheme: 'coral', animationType: 'gentle', animationDuration: 10.5, delay: 0.9, opacity: 0.85, rotation: -12 },
  { id: 'qm-center-7', x: 52, y: 84, size: 52, colorScheme: 'pink', animationType: 'sway', animationDuration: 8, delay: 1.5, opacity: 0.9, rotation: 8 },

  // Top left cluster
  { id: 'qm-1', x: 8, y: 12, size: 76, colorScheme: 'pink', animationType: 'bob', animationDuration: 9, delay: 0, opacity: 0.9, rotation: -12 },
  { id: 'qm-2', x: 22, y: 10, size: 42, colorScheme: 'cyan', animationType: 'sway', animationDuration: 12, delay: 1.5, opacity: 0.8, rotation: 15 },
  { id: 'qm-3', x: 14, y: 26, size: 36, colorScheme: 'yellow', animationType: 'gentle', animationDuration: 8, delay: 0.8, opacity: 0.75, rotation: -8 },

  // Top right cluster
  { id: 'qm-4', x: 88, y: 14, size: 84, colorScheme: 'cyan', animationType: 'sway', animationDuration: 10, delay: 0.5, opacity: 0.9, rotation: 14 },
  { id: 'qm-5', x: 76, y: 8, size: 44, colorScheme: 'purple', animationType: 'gentle', animationDuration: 11, delay: 2, opacity: 0.8, rotation: -18 },
  { id: 'qm-6', x: 84, y: 28, size: 38, colorScheme: 'coral', animationType: 'bob', animationDuration: 8.5, delay: 1, opacity: 0.75, rotation: 10 },

  // Middle left
  { id: 'qm-7', x: 6, y: 48, size: 60, colorScheme: 'yellow', animationType: 'gentle', animationDuration: 13, delay: 1.2, opacity: 0.85, rotation: -16, isBadge: true },
  { id: 'qm-8', x: 18, y: 62, size: 40, colorScheme: 'pink', animationType: 'sway', animationDuration: 9.5, delay: 2.5, opacity: 0.75, rotation: 22 },

  // Middle right
  { id: 'qm-9', x: 92, y: 50, size: 64, colorScheme: 'purple', animationType: 'bob', animationDuration: 10.5, delay: 0.7, opacity: 0.85, rotation: 18, isBadge: true },
  { id: 'qm-10', x: 80, y: 66, size: 38, colorScheme: 'lime', animationType: 'gentle', animationDuration: 8, delay: 1.8, opacity: 0.75, rotation: -14 },

  // Bottom left cluster
  { id: 'qm-11', x: 10, y: 84, size: 72, colorScheme: 'coral', animationType: 'sway', animationDuration: 11, delay: 1.1, opacity: 0.9, rotation: 12 },
  { id: 'qm-12', x: 24, y: 88, size: 44, colorScheme: 'purple', animationType: 'bob', animationDuration: 8.5, delay: 2.2, opacity: 0.8, rotation: -20 },
  { id: 'qm-13', x: 6, y: 70, size: 32, colorScheme: 'cyan', animationType: 'gentle', animationDuration: 9, delay: 0.3, opacity: 0.7, rotation: 8 },

  // Bottom right cluster
  { id: 'qm-14', x: 86, y: 86, size: 80, colorScheme: 'pink', animationType: 'gentle', animationDuration: 10, delay: 1.4, opacity: 0.9, rotation: -15 },
  { id: 'qm-15', x: 72, y: 88, size: 42, colorScheme: 'yellow', animationType: 'sway', animationDuration: 12.5, delay: 0.9, opacity: 0.8, rotation: 16 },
  { id: 'qm-16', x: 94, y: 72, size: 34, colorScheme: 'cyan', animationType: 'bob', animationDuration: 7.5, delay: 2.1, opacity: 0.75, rotation: -10 },
];

interface ClickBurst {
  id: number;
  x: number;
  y: number;
  colorScheme: 'pink' | 'purple' | 'cyan' | 'yellow' | 'coral';
  rotation: number;
}

export const QuestionMarksBackground: React.FC = () => {
  const [bursts, setBursts] = useState<ClickBurst[]>([]);

  // Spawn fun question marks when user clicks on background
  const handleBackgroundClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only spawn if click was directly on background or container
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const colors: ('pink' | 'purple' | 'cyan' | 'yellow' | 'coral')[] = ['pink', 'purple', 'cyan', 'yellow', 'coral'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomRot = Math.floor(Math.random() * 40) - 20;

    const newBurst: ClickBurst = {
      id: Date.now() + Math.random(),
      x,
      y,
      colorScheme: randomColor,
      rotation: randomRot,
    };

    setBursts((prev) => [...prev.slice(-15), newBurst]);
  }, []);

  // Clean up bursts
  useEffect(() => {
    if (bursts.length === 0) return;
    const timer = setTimeout(() => {
      setBursts((prev) => prev.filter((b) => Date.now() - b.id < 1200));
    }, 1200);
    return () => clearTimeout(timer);
  }, [bursts]);

  // Color gradient definitions and drop shadows
  const getColors = (scheme: string) => {
    switch (scheme) {
      case 'pink':
        return {
          from: '#FD79A8',
          to: '#E84393',
          glow: 'rgba(253, 121, 168, 0.55)',
          drop: '#FD79A8',
        };
      case 'purple':
        return {
          from: '#A29BFE',
          to: '#6C5CE7',
          glow: 'rgba(108, 92, 231, 0.55)',
          drop: '#A29BFE',
        };
      case 'cyan':
        return {
          from: '#00CEC9',
          to: '#00B894',
          glow: 'rgba(0, 206, 201, 0.55)',
          drop: '#00CEC9',
        };
      case 'yellow':
        return {
          from: '#FFEAA7',
          to: '#FDCB6E',
          glow: 'rgba(253, 203, 110, 0.55)',
          drop: '#FDCB6E',
        };
      case 'coral':
        return {
          from: '#FAB1A0',
          to: '#FF7675',
          glow: 'rgba(255, 118, 117, 0.55)',
          drop: '#FF7675',
        };
      case 'lime':
      default:
        return {
          from: '#55EFC4',
          to: '#00B894',
          glow: 'rgba(85, 239, 196, 0.55)',
          drop: '#55EFC4',
        };
    }
  };

  return (
    <div
      onClick={handleBackgroundClick}
      className="fixed inset-0 overflow-hidden pointer-events-auto select-none z-0"
      aria-hidden="true"
    >
      {/* SVG Gradient definitions */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id="qm-grad-pink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#FD79A8" />
            <stop offset="100%" stopColor="#E84393" />
          </linearGradient>
          <linearGradient id="qm-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF" stopOpacity="0.7" />
            <stop offset="35%" stopColor="#A29BFE" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
          <linearGradient id="qm-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0FFFF" />
            <stop offset="30%" stopColor="#00CEC9" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
          <linearGradient id="qm-grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9E6" />
            <stop offset="25%" stopColor="#FFEAA7" />
            <stop offset="100%" stopColor="#FDCB6E" />
          </linearGradient>
          <linearGradient id="qm-grad-coral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF0EE" />
            <stop offset="30%" stopColor="#FAB1A0" />
            <stop offset="100%" stopColor="#FF7675" />
          </linearGradient>
          <linearGradient id="qm-grad-lime" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8FFF8" />
            <stop offset="30%" stopColor="#55EFC4" />
            <stop offset="100%" stopColor="#00B894" />
          </linearGradient>
        </defs>
      </svg>

      {/* Atmospheric glowing ambient nebulae */}
      <div className="absolute top-[-5%] left-[-5%] w-[42vw] h-[42vw] max-w-[500px] max-h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] h-[45vw] max-w-[550px] max-h-[550px] bg-pink-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[5%] w-[35vw] h-[35vw] max-w-[400px] max-h-[400px] bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[35vw] h-[35vw] max-w-[380px] max-h-[380px] bg-amber-500/10 rounded-full blur-[110px] pointer-events-none" />

      {/* Floating Question Marks */}
      {PRESET_MARKS.map((mark) => {
        const colors = getColors(mark.colorScheme);
        const animClass =
          mark.animationType === 'bob'
            ? 'animate-float-bob'
            : mark.animationType === 'sway'
            ? 'animate-float-sway'
            : 'animate-float-gentle';

        return (
          <div
            key={mark.id}
            className={`absolute pointer-events-none ${animClass}`}
            style={{
              left: `${mark.x}%`,
              top: `${mark.y}%`,
              animationDuration: `${mark.animationDuration}s`,
              animationDelay: `${mark.delay}s`,
              opacity: mark.opacity,
              transform: `translate(-50%, -50%) rotate(${mark.rotation}deg)`,
              filter: `drop-shadow(0 0 ${Math.round(mark.size * 0.22)}px ${colors.glow})`,
            }}
          >
            {mark.isBadge ? (
              // Glassmorphic Glowing Badge Question Mark
              <div
                className="rounded-3xl border border-white/25 flex items-center justify-center backdrop-blur-md shadow-2xl relative overflow-hidden group"
                style={{
                  width: `${mark.size * 1.15}px`,
                  height: `${mark.size * 1.15}px`,
                  background: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(0,0,0,0.4))`,
                  boxShadow: `0 10px 30px -5px ${colors.glow}, inset 0 1px 1px rgba(255,255,255,0.4)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${colors.from}, transparent 70%)`,
                  }}
                />
                <span
                  className="font-black select-none leading-none tracking-tight relative z-10"
                  style={{
                    fontSize: `${mark.size * 0.72}px`,
                    background: `linear-gradient(135deg, #FFF, ${colors.from}, ${colors.to})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: `drop-shadow(0 2px 8px ${colors.glow})`,
                  }}
                >
                  ?
                </span>
              </div>
            ) : (
              // Pure SVG Vibrant Vector Question Mark
              <svg
                width={mark.size}
                height={mark.size * 1.3}
                viewBox="0 0 100 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
              >
                {/* Subtle back ambient glow shape */}
                <path
                  d="M 50 15 C 28 15, 14 28, 14 48 C 14 54, 18 58, 26 58 C 34 58, 38 52, 38 48 C 38 38, 43 32, 50 32 C 59 32, 65 37, 65 44 C 65 52, 58 58, 50 66 C 42 74, 38 82, 38 94 L 38 98 C 38 103, 42 107, 48 107 C 54 107, 58 103, 58 98 L 58 95 C 58 87, 63 81, 70 74 C 79 65, 86 56, 86 44 C 86 26, 70 15, 50 15 Z"
                  fill={colors.from}
                  opacity="0.25"
                  filter="blur(6px)"
                />

                {/* Question mark top loop */}
                <path
                  d="M 50 15 C 28 15, 14 28, 14 48 C 14 54, 18 58, 26 58 C 34 58, 38 52, 38 48 C 38 38, 43 32, 50 32 C 59 32, 65 37, 65 44 C 65 52, 58 58, 50 66 C 42 74, 38 82, 38 94 L 38 98 C 38 103, 42 107, 48 107 C 54 107, 58 103, 58 98 L 58 95 C 58 87, 63 81, 70 74 C 79 65, 86 56, 86 44 C 86 26, 70 15, 50 15 Z"
                  fill={`url(#qm-grad-${mark.colorScheme})`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1.5"
                />

                {/* Question mark dot */}
                <circle
                  cx="48"
                  cy="120"
                  r="8.5"
                  fill={`url(#qm-grad-${mark.colorScheme})`}
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="1.5"
                />

                {/* Highlight gleam on top loop */}
                <path
                  d="M 45 22 C 32 23, 22 32, 22 44"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            )}
          </div>
        );
      })}

      {/* Floating mini sparkles (✦, ·) */}
      <div className="absolute top-[18%] left-[45%] text-pink-300 text-xs animate-ping opacity-30 pointer-events-none">✦</div>
      <div className="absolute top-[65%] left-[8%] text-cyan-300 text-sm animate-pulse opacity-40 pointer-events-none">✦</div>
      <div className="absolute top-[82%] right-[35%] text-yellow-300 text-xs animate-ping opacity-30 pointer-events-none">✦</div>
      <div className="absolute top-[35%] right-[12%] text-purple-300 text-sm animate-pulse opacity-40 pointer-events-none">✦</div>

      {/* Click Interactive Bursts */}
      {bursts.map((burst) => {
        const colors = getColors(burst.colorScheme);
        return (
          <div
            key={burst.id}
            className="absolute pointer-events-none text-2xl font-black select-none"
            style={{
              left: `${burst.x}px`,
              top: `${burst.y}px`,
              animation: 'floatUpFade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              transform: `translate(-50%, -50%) rotate(${burst.rotation}deg)`,
              color: colors.from,
              textShadow: `0 0 15px ${colors.glow}`,
            }}
          >
            ?
          </div>
        );
      })}
    </div>
  );
};
