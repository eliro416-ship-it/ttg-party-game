/**
 * Web Audio API Background Music Engine
 * Generates an upbeat, charming, continuous looping casual game soundtrack
 * entirely synthesized via Web Audio API with zero external assets.
 */

class BackgroundMusicPlayer {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private isRunning: boolean = false;
  private intervalId: number | null = null;
  private currentStep: number = 0;
  private nextStepTime: number = 0;
  private noiseBuffer: AudioBuffer | null = null;
  private tempo: number = 114; // BPM
  private targetVolume: number = 0.14;
  private listeners: Set<(isPlaying: boolean) => void> = new Set();

  // 8-Bar Chord Progression Root & Pad Frequencies (Hz)
  private readonly barChords = [
    // Bar 0: Cmaj7
    { bass: 130.81, pad: [261.63, 329.63, 392.0, 493.88] },
    // Bar 1: G/B
    { bass: 123.47, pad: [246.94, 293.66, 392.0, 493.88] },
    // Bar 2: Am7
    { bass: 110.0, pad: [220.0, 261.63, 329.63, 392.0] },
    // Bar 3: Em7
    { bass: 82.41, pad: [196.0, 246.94, 329.63, 392.0] },
    // Bar 4: Fmaj7
    { bass: 87.31, pad: [174.61, 220.0, 261.63, 329.63] },
    // Bar 5: C/E
    { bass: 82.41, pad: [196.0, 261.63, 329.63, 392.0] },
    // Bar 6: Dm7
    { bass: 73.42, pad: [174.61, 220.0, 261.63, 349.23] },
    // Bar 7: G7
    { bass: 98.0, pad: [174.61, 246.94, 293.66, 392.0] },
  ];

  // Cheerful Arpeggio / Bell Melody (8 eighth-notes per bar, total 64 notes)
  private readonly melodyNotes: number[][] = [
    // Bar 0: E5, G5, C6, G5, E5, D5, C5, E5
    [659.25, 783.99, 1046.5, 783.99, 659.25, 587.33, 523.25, 659.25],
    // Bar 1: D5, G5, B5, G5, D5, E5, D5, B4
    [587.33, 783.99, 987.77, 783.99, 587.33, 659.25, 587.33, 493.88],
    // Bar 2: C5, E5, A5, E5, C5, D5, E5, A5
    [523.25, 659.25, 880.0, 659.25, 523.25, 587.33, 659.25, 880.0],
    // Bar 3: B4, E5, G5, E5, B4, C5, D5, E5
    [493.88, 659.25, 783.99, 659.25, 493.88, 523.25, 587.33, 659.25],
    // Bar 4: A4, C5, F5, C5, A4, G4, F4, A4
    [440.0, 523.25, 698.46, 523.25, 440.0, 392.0, 349.23, 440.0],
    // Bar 5: G4, C5, E5, C5, G4, F4, E4, G4
    [392.0, 523.25, 659.25, 523.25, 392.0, 349.23, 329.63, 392.0],
    // Bar 6: F4, A4, D5, A4, F4, E4, D4, F4
    [349.23, 440.0, 587.33, 440.0, 349.23, 329.63, 293.66, 349.23],
    // Bar 7: G4, B4, D5, F5, G5, F5, D5, B4
    [392.0, 493.88, 587.33, 698.46, 783.99, 698.46, 587.33, 493.88],
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game_bg_music_enabled');
      // Default to true on initial session, but browser policy requires first gesture
      if (saved !== null) {
        this.isRunning = saved === 'true';
      } else {
        this.isRunning = true;
      }

      // Auto-unlock Web Audio on first user interaction if enabled
      const unlockAudio = () => {
        if (this.isRunning) {
          this.startMusic();
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };

      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
      window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });

      // Handle visibility changes (smooth pause when tab is minimized)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend().catch(() => {});
          }
        } else {
          if (this.isRunning && this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
        }
      });
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public subscribe(listener: (isPlaying: boolean) => void): () => void {
    this.listeners.add(listener);
    listener(this.isRunning);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.isRunning));
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && !this.musicGainNode) {
      this.musicGainNode = this.ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.musicGainNode.connect(this.ctx.destination);
    }
    if (this.ctx && !this.noiseBuffer) {
      // 0.05s White noise buffer for crisp rhythm shakers
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public startMusic(): void {
    const ctx = this.initContext();
    if (!ctx || !this.musicGainNode) return;

    this.isRunning = true;
    localStorage.setItem('game_bg_music_enabled', 'true');
    this.notify();

    // Smooth volume fade-in
    const now = ctx.currentTime;
    this.musicGainNode.gain.cancelScheduledValues(now);
    this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
    this.musicGainNode.gain.linearRampToValueAtTime(this.targetVolume, now + 0.6);

    // If scheduler is already running, just ramping volume is sufficient
    if (this.intervalId !== null) return;

    this.nextStepTime = now + 0.05;
    this.currentStep = 0;

    // Run lookahead scheduler every 25ms
    this.intervalId = window.setInterval(() => {
      this.runScheduler();
    }, 25);
  }

  public stopMusic(): void {
    this.isRunning = false;
    localStorage.setItem('game_bg_music_enabled', 'false');
    this.notify();

    if (this.ctx && this.musicGainNode) {
      const now = this.ctx.currentTime;
      this.musicGainNode.gain.cancelScheduledValues(now);
      this.musicGainNode.gain.setValueAtTime(this.musicGainNode.gain.value, now);
      this.musicGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.4);
    }

    if (this.intervalId !== null) {
      window.setTimeout(() => {
        if (!this.isRunning && this.intervalId !== null) {
          window.clearInterval(this.intervalId);
          this.intervalId = null;
        }
      }, 450);
    }
  }

  public toggleMusic(): boolean {
    if (this.isRunning) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public toggle(): boolean {
    return this.toggleMusic();
  }

  private runScheduler() {
    if (!this.ctx || !this.isRunning) return;

    const scheduleAheadTime = 0.15; // Schedule up to 150ms in advance
    const stepDuration = 60 / this.tempo / 4; // 16th note step in seconds (~0.1316s)

    while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += stepDuration;
      // 8 bars * 16 steps = 128 sixteenth steps per continuous loop
      this.currentStep = (this.currentStep + 1) % 128;
    }
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicGainNode) return;

    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const chord = this.barChords[bar % 8];

    // 1. CHORD PAD (Sustained on beats 1 and 3: steps 0 and 8)
    if (stepInBar === 0 || stepInBar === 8) {
      const padDuration = (60 / this.tempo) * 1.8;
      this.playPad(chord.pad, time, padDuration, 0.07);
    }

    // 2. BASSLINE (Punchy filtered triangle bass on steps 0, 4, 8, 12, 14)
    if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12 || stepInBar === 14) {
      let bassFreq = chord.bass;
      // Add playful octave jump on step 8 & 14
      if (stepInBar === 8 || stepInBar === 14) {
        bassFreq = chord.bass * 2;
      }
      const bassDuration = (60 / this.tempo) * 0.45;
      this.playBass(bassFreq, time, bassDuration, 0.16);
    }

    // 3. SPARKLING BELL MELODY (Plays on eighth-note steps: 0, 2, 4, 6, 8, 10, 12, 14)
    if (stepInBar % 2 === 0) {
      const melodyIndex = stepInBar / 2;
      const freq = this.melodyNotes[bar % 8][melodyIndex];
      if (freq) {
        const chimeDuration = (60 / this.tempo) * 0.45;
        this.playChime(freq, time, chimeDuration, 0.09);
      }
    }

    // 4. SOFT RHYTHMIC PERCUSSION
    // Kick on beats 1 and 3 (step 0 and 8)
    if (stepInBar === 0 || stepInBar === 8) {
      this.playKick(time);
    }
    // Shaker / Hi-Hat on off-beats (steps 2, 6, 10, 14)
    if (stepInBar === 2 || stepInBar === 6 || stepInBar === 10 || stepInBar === 14) {
      this.playShaker(time);
    }
    // Soft snare / clap on beat 2 and 4 (step 4 and 12)
    if (stepInBar === 4 || stepInBar === 12) {
      this.playSnare(time);
    }
  }

  // --- Web Audio Synthesizers ---

  private playChime(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGainNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  private playPad(freqs: number[], time: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGainNode) return;
    try {
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.musicGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, time);
        // Subtle chorusing detune
        osc.detune.setValueAtTime((idx - 1.5) * 5, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(vol / freqs.length, time + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGainNode);

        osc.start(time);
        osc.stop(time + duration + 0.05);
      });
    } catch {}
  }

  private playBass(freq: number, time: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGainNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, time);

      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      osc.stop(time + duration + 0.05);
    } catch {}
  }

  private playKick(time: number) {
    if (!this.ctx || !this.musicGainNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.08);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      osc.connect(gain);
      gain.connect(this.musicGainNode);

      osc.start(time);
      osc.stop(time + 0.1);
    } catch {}
  }

  private playShaker(time: number) {
    if (!this.ctx || !this.musicGainNode || !this.noiseBuffer) return;
    try {
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      source.buffer = this.noiseBuffer;
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGainNode);

      source.start(time);
      source.stop(time + 0.04);
    } catch {}
  }

  private playSnare(time: number) {
    if (!this.ctx || !this.musicGainNode || !this.noiseBuffer) return;
    try {
      // Noise component
      const noise = this.ctx.createBufferSource();
      const noiseFilter = this.ctx.createBiquadFilter();
      const noiseGain = this.ctx.createGain();

      noise.buffer = this.noiseBuffer;
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2800, time);

      noiseGain.gain.setValueAtTime(0.07, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.musicGainNode);

      noise.start(time);
      noise.stop(time + 0.09);

      // Tonal pop component
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.05);

      oscGain.gain.setValueAtTime(0.06, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      osc.connect(oscGain);
      oscGain.connect(this.musicGainNode);

      osc.start(time);
      osc.stop(time + 0.06);
    } catch {}
  }
}

export const bgMusic = new BackgroundMusicPlayer();
