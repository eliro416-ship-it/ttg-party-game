import React, { useMemo } from 'react';

interface QuestionMarkItem {
  id: number;
  top: string;
  left: string;
  size: string;
  colorClass: 'q-pink' | 'q-cyan' | 'q-yellow' | 'q-green';
  animation: string;
  duration: string;
  delay: string;
  rotate: string;
}

interface AnimatedQuestionMarksBackgroundProps {
  theme?: 'sky-3d' | 'cosmic-dark';
}

export const AnimatedQuestionMarksBackground: React.FC<AnimatedQuestionMarksBackgroundProps> = () => {
  // Deterministic vibrant 3D question marks distributed across the screen using user classes
  const marks = useMemo<QuestionMarkItem[]>(() => [
    // Top-left sector
    { id: 1, top: '4%', left: '7%', size: 'text-5xl sm:text-6xl', colorClass: 'q-pink', animation: 'floatQM1', duration: '6s', delay: '0s', rotate: '-12deg' },
    { id: 2, top: '15%', left: '14%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'driftWaveQM', duration: '7.5s', delay: '1.2s', rotate: '15deg' },
    { id: 3, top: '7%', left: '25%', size: 'text-3xl sm:text-4xl', colorClass: 'q-yellow', animation: 'wobbleQM', duration: '5s', delay: '2.5s', rotate: '-8deg' },
    { id: 4, top: '26%', left: '5%', size: 'text-6xl sm:text-7xl', colorClass: 'q-green', animation: 'floatSpinQM', duration: '11s', delay: '0.8s', rotate: '10deg' },
    { id: 5, top: '22%', left: '19%', size: 'text-3xl sm:text-4xl', colorClass: 'q-pink', animation: 'pulseGlowQM', duration: '4.5s', delay: '1.5s', rotate: '-14deg' },

    // Top-right sector
    { id: 6, top: '5%', left: '72%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'floatQM1', duration: '7s', delay: '1.8s', rotate: '14deg' },
    { id: 7, top: '3%', left: '88%', size: 'text-7xl sm:text-8xl', colorClass: 'q-pink', animation: 'floatQM3', duration: '8.5s', delay: '0.5s', rotate: '-16deg' },
    { id: 8, top: '16%', left: '80%', size: 'text-4xl sm:text-5xl', colorClass: 'q-yellow', animation: 'pulseGlowQM', duration: '5.2s', delay: '2.1s', rotate: '8deg' },
    { id: 9, top: '28%', left: '92%', size: 'text-4xl sm:text-5xl', colorClass: 'q-green', animation: 'wobbleQM', duration: '6.2s', delay: '1.5s', rotate: '-10deg' },
    { id: 10, top: '24%', left: '70%', size: 'text-3xl sm:text-4xl', colorClass: 'q-cyan', animation: 'driftWaveQM', duration: '8s', delay: '3.2s', rotate: '12deg' },

    // Middle-left sector
    { id: 11, top: '40%', left: '3%', size: 'text-6xl sm:text-8xl', colorClass: 'q-yellow', animation: 'floatQM3', duration: '9s', delay: '2s', rotate: '-18deg' },
    { id: 12, top: '48%', left: '12%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'floatSpinQM', duration: '12s', delay: '3.4s', rotate: '12deg' },
    { id: 13, top: '58%', left: '4%', size: 'text-5xl sm:text-6xl', colorClass: 'q-pink', animation: 'wobbleQM', duration: '5.5s', delay: '0.4s', rotate: '-15deg' },
    { id: 14, top: '36%', left: '18%', size: 'text-3xl sm:text-4xl', colorClass: 'q-green', animation: 'pulseGlowQM', duration: '4.8s', delay: '1.9s', rotate: '20deg' },

    // Middle-right sector
    { id: 15, top: '38%', left: '84%', size: 'text-5xl sm:text-6xl', colorClass: 'q-green', animation: 'floatQM2', duration: '7.2s', delay: '0.4s', rotate: '14deg' },
    { id: 16, top: '50%', left: '94%', size: 'text-6xl sm:text-7xl', colorClass: 'q-pink', animation: 'driftWaveQM', duration: '8.2s', delay: '2.8s', rotate: '-8deg' },
    { id: 17, top: '58%', left: '80%', size: 'text-4xl sm:text-5xl', colorClass: 'q-yellow', animation: 'floatSpinQM', duration: '10s', delay: '1.3s', rotate: '16deg' },
    { id: 18, top: '44%', left: '74%', size: 'text-3xl sm:text-4xl', colorClass: 'q-cyan', animation: 'wobbleQM', duration: '5.8s', delay: '2.4s', rotate: '-12deg' },

    // Bottom-left sector
    { id: 19, top: '68%', left: '6%', size: 'text-5xl sm:text-6xl', colorClass: 'q-yellow', animation: 'floatQM1', duration: '7s', delay: '1.1s', rotate: '16deg' },
    { id: 20, top: '80%', left: '14%', size: 'text-7xl sm:text-8xl', colorClass: 'q-pink', animation: 'floatSpinQM', duration: '13s', delay: '2.2s', rotate: '-14deg' },
    { id: 21, top: '92%', left: '5%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'pulseGlowQM', duration: '4.6s', delay: '0.9s', rotate: '10deg' },
    { id: 22, top: '74%', left: '22%', size: 'text-4xl sm:text-5xl', colorClass: 'q-green', animation: 'driftWaveQM', duration: '8s', delay: '3.7s', rotate: '-12deg' },
    { id: 23, top: '88%', left: '26%', size: 'text-5xl sm:text-6xl', colorClass: 'q-pink', animation: 'wobbleQM', duration: '6.4s', delay: '1.7s', rotate: '18deg' },

    // Bottom-right sector
    { id: 24, top: '68%', left: '92%', size: 'text-5xl sm:text-6xl', colorClass: 'q-green', animation: 'floatQM2', duration: '7.4s', delay: '1.4s', rotate: '-15deg' },
    { id: 25, top: '78%', left: '78%', size: 'text-6xl sm:text-7xl', colorClass: 'q-pink', animation: 'driftWaveQM', duration: '8.8s', delay: '0.7s', rotate: '18deg' },
    { id: 26, top: '88%', left: '88%', size: 'text-4xl sm:text-5xl', colorClass: 'q-yellow', animation: 'pulseGlowQM', duration: '5s', delay: '2.9s', rotate: '-8deg' },
    { id: 27, top: '72%', left: '68%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'floatSpinQM', duration: '9.5s', delay: '3.3s', rotate: '12deg' },
    { id: 28, top: '92%', left: '72%', size: 'text-5xl sm:text-6xl', colorClass: 'q-green', animation: 'wobbleQM', duration: '6s', delay: '1.2s', rotate: '-14deg' },

    // Central sector (Behind and around central panel)
    { id: 29, top: '12%', left: '46%', size: 'text-5xl sm:text-6xl', colorClass: 'q-pink', animation: 'pulseGlowQM', duration: '5.2s', delay: '2.1s', rotate: '-10deg' },
    { id: 30, top: '84%', left: '50%', size: 'text-5xl sm:text-7xl', colorClass: 'q-cyan', animation: 'driftWaveQM', duration: '8.6s', delay: '1.6s', rotate: '14deg' },
    { id: 31, top: '32%', left: '28%', size: 'text-4xl sm:text-5xl', colorClass: 'q-yellow', animation: 'floatSpinQM', duration: '10.5s', delay: '0.2s', rotate: '20deg' },
    { id: 32, top: '34%', left: '64%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'wobbleQM', duration: '6.8s', delay: '2.7s', rotate: '-15deg' },
    { id: 33, top: '48%', left: '34%', size: 'text-5xl sm:text-6xl', colorClass: 'q-pink', animation: 'floatQM1', duration: '7.6s', delay: '1.4s', rotate: '8deg' },
    { id: 34, top: '52%', left: '62%', size: 'text-5xl sm:text-6xl', colorClass: 'q-yellow', animation: 'pulseGlowQM', duration: '5.5s', delay: '3.1s', rotate: '-12deg' },
    { id: 35, top: '64%', left: '36%', size: 'text-4xl sm:text-5xl', colorClass: 'q-green', animation: 'driftWaveQM', duration: '8.2s', delay: '2s', rotate: '14deg' },
    { id: 36, top: '66%', left: '62%', size: 'text-4xl sm:text-5xl', colorClass: 'q-cyan', animation: 'wobbleQM', duration: '7s', delay: '0.8s', rotate: '-16deg' },

    // Perimeter highlights
    { id: 37, top: '2%', left: '38%', size: 'text-3xl sm:text-4xl', colorClass: 'q-pink', animation: 'wobbleQM', duration: '4.8s', delay: '0.3s', rotate: '15deg' },
    { id: 38, top: '2%', left: '60%', size: 'text-3xl sm:text-4xl', colorClass: 'q-cyan', animation: 'driftWaveQM', duration: '6.5s', delay: '1.9s', rotate: '-10deg' },
    { id: 39, top: '96%', left: '36%', size: 'text-3xl sm:text-4xl', colorClass: 'q-yellow', animation: 'pulseGlowQM', duration: '4.2s', delay: '2.3s', rotate: '12deg' },
    { id: 40, top: '95%', left: '60%', size: 'text-3xl sm:text-4xl', colorClass: 'q-pink', animation: 'floatQM2', duration: '6.9s', delay: '0.6s', rotate: '-16deg' },
  ], []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. Volumetric clouds background layer according to user CSS */}
      <div className="clouds-layer clouds-bg" />

      {/* 2. 3D Question marks without white glow */}
      {marks.map((m) => (
        <span
          key={m.id}
          className={`q-mark ${m.colorClass} ${m.size}`}
          style={{
            top: m.top,
            left: m.left,
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
