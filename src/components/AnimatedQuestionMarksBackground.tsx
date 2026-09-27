import React, { useMemo } from 'react';

interface QuestionMarkItem {
  id: number;
  top: string;
  left: string;
  size: string;
  color: string;
  glow: string;
  animation: string;
  duration: string;
  delay: string;
  opacity: number;
  rotate: string;
}

export const AnimatedQuestionMarksBackground: React.FC = () => {
  // Pre-configured positions and styles to ensure deterministic rendering and optimal, vibrant distribution
  const marks = useMemo<QuestionMarkItem[]>(() => [
    // Top-left sector
    { id: 1, top: '4%', left: '7%', size: 'text-5xl sm:text-6xl', color: '#FD79A8', glow: 'rgba(253,121,168,0.6)', animation: 'floatQM1', duration: '6s', delay: '0s', opacity: 0.38, rotate: '-12deg' },
    { id: 2, top: '15%', left: '14%', size: 'text-3xl sm:text-4xl', color: '#00F0FF', glow: 'rgba(0,240,255,0.6)', animation: 'driftWaveQM', duration: '7.5s', delay: '1.2s', opacity: 0.42, rotate: '15deg' },
    { id: 3, top: '8%', left: '24%', size: 'text-2xl sm:text-3xl', color: '#FFD200', glow: 'rgba(255,210,0,0.6)', animation: 'wobbleQM', duration: '5s', delay: '2.5s', opacity: 0.35, rotate: '-8deg' },
    { id: 4, top: '26%', left: '5%', size: 'text-6xl sm:text-7xl', color: '#A855F7', glow: 'rgba(168,85,247,0.6)', animation: 'floatSpinQM', duration: '11s', delay: '0.8s', opacity: 0.34, rotate: '10deg' },
    { id: 5, top: '22%', left: '19%', size: 'text-2xl sm:text-3xl', color: '#00FF85', glow: 'rgba(0,255,133,0.55)', animation: 'pulseGlowQM', duration: '4.5s', delay: '1.5s', opacity: 0.45, rotate: '-14deg' },

    // Top-right sector
    { id: 6, top: '5%', left: '72%', size: 'text-3xl sm:text-4xl', color: '#38BDF8', glow: 'rgba(56,189,248,0.6)', animation: 'floatQM1', duration: '7s', delay: '1.8s', opacity: 0.38, rotate: '14deg' },
    { id: 7, top: '3%', left: '88%', size: 'text-7xl sm:text-8xl', color: '#FF007F', glow: 'rgba(255,0,127,0.65)', animation: 'floatQM3', duration: '8.5s', delay: '0.5s', opacity: 0.38, rotate: '-16deg' },
    { id: 8, top: '16%', left: '80%', size: 'text-4xl sm:text-5xl', color: '#FFD200', glow: 'rgba(255,210,0,0.6)', animation: 'pulseGlowQM', duration: '5.2s', delay: '2.1s', opacity: 0.42, rotate: '8deg' },
    { id: 9, top: '28%', left: '92%', size: 'text-3xl sm:text-4xl', color: '#00FF85', glow: 'rgba(0,255,133,0.55)', animation: 'wobbleQM', duration: '6.2s', delay: '1.5s', opacity: 0.36, rotate: '-10deg' },
    { id: 10, top: '24%', left: '70%', size: 'text-2xl sm:text-3xl', color: '#C084FC', glow: 'rgba(192,132,252,0.55)', animation: 'driftWaveQM', duration: '8s', delay: '3.2s', opacity: 0.35, rotate: '12deg' },

    // Middle-left sector
    { id: 11, top: '40%', left: '3%', size: 'text-6xl sm:text-8xl', color: '#FF5722', glow: 'rgba(255,87,34,0.6)', animation: 'floatQM3', duration: '9s', delay: '2s', opacity: 0.32, rotate: '-18deg' },
    { id: 12, top: '48%', left: '12%', size: 'text-3xl sm:text-4xl', color: '#6C5CE7', glow: 'rgba(108,92,231,0.6)', animation: 'floatSpinQM', duration: '12s', delay: '3.4s', opacity: 0.4, rotate: '12deg' },
    { id: 13, top: '58%', left: '4%', size: 'text-4xl sm:text-5xl', color: '#00F0FF', glow: 'rgba(0,240,255,0.6)', animation: 'wobbleQM', duration: '5.5s', delay: '0.4s', opacity: 0.36, rotate: '-15deg' },
    { id: 14, top: '36%', left: '18%', size: 'text-2xl sm:text-3xl', color: '#F43F5E', glow: 'rgba(244,63,94,0.55)', animation: 'pulseGlowQM', duration: '4.8s', delay: '1.9s', opacity: 0.4, rotate: '20deg' },

    // Middle-right sector
    { id: 15, top: '38%', left: '84%', size: 'text-5xl sm:text-6xl', color: '#00FF85', glow: 'rgba(0,255,133,0.6)', animation: 'floatQM2', duration: '7.2s', delay: '0.4s', opacity: 0.35, rotate: '14deg' },
    { id: 16, top: '50%', left: '94%', size: 'text-5xl sm:text-7xl', color: '#FD79A8', glow: 'rgba(253,121,168,0.6)', animation: 'driftWaveQM', duration: '8.2s', delay: '2.8s', opacity: 0.35, rotate: '-8deg' },
    { id: 17, top: '58%', left: '80%', size: 'text-3xl sm:text-4xl', color: '#FFD200', glow: 'rgba(255,210,0,0.6)', animation: 'floatSpinQM', duration: '10s', delay: '1.3s', opacity: 0.38, rotate: '16deg' },
    { id: 18, top: '44%', left: '74%', size: 'text-2xl sm:text-3xl', color: '#A855F7', glow: 'rgba(168,85,247,0.55)', animation: 'wobbleQM', duration: '5.8s', delay: '2.4s', opacity: 0.38, rotate: '-12deg' },

    // Bottom-left sector
    { id: 19, top: '68%', left: '6%', size: 'text-5xl sm:text-6xl', color: '#FFD200', glow: 'rgba(255,210,0,0.6)', animation: 'floatQM1', duration: '7s', delay: '1.1s', opacity: 0.38, rotate: '16deg' },
    { id: 20, top: '80%', left: '14%', size: 'text-7xl sm:text-8xl', color: '#A855F7', glow: 'rgba(168,85,247,0.6)', animation: 'floatSpinQM', duration: '13s', delay: '2.2s', opacity: 0.36, rotate: '-14deg' },
    { id: 21, top: '92%', left: '5%', size: 'text-3xl sm:text-4xl', color: '#00F0FF', glow: 'rgba(0,240,255,0.6)', animation: 'pulseGlowQM', duration: '4.6s', delay: '0.9s', opacity: 0.38, rotate: '10deg' },
    { id: 22, top: '74%', left: '22%', size: 'text-3xl sm:text-4xl', color: '#FF5722', glow: 'rgba(255,87,34,0.55)', animation: 'driftWaveQM', duration: '8s', delay: '3.7s', opacity: 0.35, rotate: '-12deg' },
    { id: 23, top: '88%', left: '26%', size: 'text-4xl sm:text-5xl', color: '#00FF85', glow: 'rgba(0,255,133,0.55)', animation: 'wobbleQM', duration: '6.4s', delay: '1.7s', opacity: 0.36, rotate: '18deg' },

    // Bottom-right sector
    { id: 24, top: '68%', left: '92%', size: 'text-5xl sm:text-6xl', color: '#00FF85', glow: 'rgba(0,255,133,0.6)', animation: 'floatQM2', duration: '7.4s', delay: '1.4s', opacity: 0.38, rotate: '-15deg' },
    { id: 25, top: '78%', left: '78%', size: 'text-6xl sm:text-7xl', color: '#E84393', glow: 'rgba(232,67,147,0.65)', animation: 'driftWaveQM', duration: '8.8s', delay: '0.7s', opacity: 0.4, rotate: '18deg' },
    { id: 26, top: '88%', left: '88%', size: 'text-4xl sm:text-5xl', color: '#FFD200', glow: 'rgba(255,210,0,0.6)', animation: 'pulseGlowQM', duration: '5s', delay: '2.9s', opacity: 0.38, rotate: '-8deg' },
    { id: 27, top: '72%', left: '68%', size: 'text-3xl sm:text-4xl', color: '#38BDF8', glow: 'rgba(56,189,248,0.55)', animation: 'floatSpinQM', duration: '9.5s', delay: '3.3s', opacity: 0.36, rotate: '12deg' },
    { id: 28, top: '92%', left: '72%', size: 'text-5xl sm:text-6xl', color: '#A855F7', glow: 'rgba(168,85,247,0.6)', animation: 'wobbleQM', duration: '6s', delay: '1.2s', opacity: 0.35, rotate: '-14deg' },

    // Central & ambient perimeter (depth layering behind the glass card)
    { id: 29, top: '10%', left: '46%', size: 'text-4xl sm:text-5xl', color: '#FD79A8', glow: 'rgba(253,121,168,0.5)', animation: 'pulseGlowQM', duration: '5.2s', delay: '2.1s', opacity: 0.3, rotate: '-10deg' },
    { id: 30, top: '88%', left: '50%', size: 'text-4xl sm:text-6xl', color: '#00F0FF', glow: 'rgba(0,240,255,0.5)', animation: 'driftWaveQM', duration: '8.6s', delay: '1.6s', opacity: 0.32, rotate: '14deg' },
    { id: 31, top: '34%', left: '26%', size: 'text-2xl sm:text-3xl', color: '#FFE600', glow: 'rgba(255,230,0,0.5)', animation: 'floatSpinQM', duration: '10.5s', delay: '0.2s', opacity: 0.28, rotate: '20deg' },
    { id: 32, top: '36%', left: '66%', size: 'text-2xl sm:text-3xl', color: '#FF5722', glow: 'rgba(255,87,34,0.5)', animation: 'wobbleQM', duration: '6.8s', delay: '2.7s', opacity: 0.28, rotate: '-15deg' },
    { id: 33, top: '60%', left: '32%', size: 'text-3xl sm:text-4xl', color: '#00FF85', glow: 'rgba(0,255,133,0.5)', animation: 'floatQM1', duration: '7.6s', delay: '1.4s', opacity: 0.25, rotate: '8deg' },
    { id: 34, top: '64%', left: '62%', size: 'text-3xl sm:text-4xl', color: '#A855F7', glow: 'rgba(168,85,247,0.5)', animation: 'pulseGlowQM', duration: '5.5s', delay: '3.1s', opacity: 0.26, rotate: '-12deg' },

    // Additional spark question marks in new rainbow neon colors
    { id: 35, top: '2%', left: '38%', size: 'text-xl sm:text-2xl', color: '#F43F5E', glow: 'rgba(244,63,94,0.6)', animation: 'wobbleQM', duration: '4.8s', delay: '0.3s', opacity: 0.4, rotate: '15deg' },
    { id: 36, top: '3%', left: '58%', size: 'text-xl sm:text-2xl', color: '#10B981', glow: 'rgba(16,185,129,0.6)', animation: 'driftWaveQM', duration: '6.5s', delay: '1.9s', opacity: 0.4, rotate: '-10deg' },
    { id: 37, top: '96%', left: '36%', size: 'text-2xl sm:text-3xl', color: '#FB923C', glow: 'rgba(251,146,60,0.6)', animation: 'pulseGlowQM', duration: '4.2s', delay: '2.3s', opacity: 0.38, rotate: '12deg' },
    { id: 38, top: '95%', left: '60%', size: 'text-2xl sm:text-3xl', color: '#38BDF8', glow: 'rgba(56,189,248,0.6)', animation: 'floatQM2', duration: '6.9s', delay: '0.6s', opacity: 0.38, rotate: '-16deg' },
    { id: 39, top: '18%', left: '2%', size: 'text-3xl sm:text-4xl', color: '#E11D48', glow: 'rgba(225,29,72,0.6)', animation: 'floatSpinQM', duration: '9s', delay: '1.1s', opacity: 0.35, rotate: '18deg' },
    { id: 40, top: '14%', left: '95%', size: 'text-3xl sm:text-4xl', color: '#F59E0B', glow: 'rgba(245,158,11,0.6)', animation: 'wobbleQM', duration: '5.2s', delay: '2.7s', opacity: 0.38, rotate: '-14deg' },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-purple-600/20 rounded-full blur-[110px]" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-600/20 rounded-full blur-[130px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-600/15 rounded-full blur-[150px]" />

      {/* 40 Rich Animated Multi-Colored Question Marks */}
      {marks.map((m) => (
        <span
          key={m.id}
          className={`absolute font-black ${m.size} select-none transition-transform`}
          style={{
            top: m.top,
            left: m.left,
            color: m.color,
            opacity: m.opacity,
            textShadow: `0 0 16px ${m.glow}, 0 0 32px ${m.glow}`,
            transform: `rotate(${m.rotate})`,
            animation: `${m.animation} ${m.duration} ease-in-out infinite`,
            animationDelay: m.delay,
            willChange: 'transform, opacity',
          }}
        >
          ?
        </span>
      ))}
    </div>
  );
};
