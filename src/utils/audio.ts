class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    const saved = localStorage.getItem('game_sound_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('game_sound_muted', String(this.isMuted));
    return this.isMuted;
  }

  public playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio error catch
    }
  }

  public soundKeypress() {
    this.playTone(550, 0.04, 'sine', 0.05);
  }

  public soundDelete() {
    this.playTone(320, 0.06, 'triangle', 0.06);
  }

  public soundTick() {
    this.playTone(420, 0.04, 'triangle', 0.08);
  }

  public soundWarning() {
    this.playTone(700, 0.07, 'sawtooth', 0.07);
  }

  public soundSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.22, 'triangle', 0.14);
      }, idx * 110);
    });
  }

  public soundError() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.playTone(180, 0.28, 'sawtooth', 0.12);
    setTimeout(() => {
      this.playTone(140, 0.35, 'sawtooth', 0.14);
    }, 120);
  }

  public soundHint() {
    this.playTone(880, 0.12, 'sine', 0.1);
    setTimeout(() => {
      this.playTone(1174.66, 0.2, 'sine', 0.1);
    }, 90);
  }

  public soundWin() {
    const ctx = this.getContext();
    if (!ctx) return;
    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.18 },
      { f: 1046.5, d: 0.4 },
    ];
    melody.forEach((note, i) => {
      setTimeout(() => {
        this.playTone(note.f, note.d, 'triangle', 0.15);
      }, i * 140);
    });
  }

  public soundYes() {
    this.playTone(587.33, 0.12, 'sine', 0.12);
    setTimeout(() => {
      this.playTone(880, 0.2, 'sine', 0.14);
    }, 80);
  }

  public soundNo() {
    this.playTone(280, 0.15, 'sawtooth', 0.1);
    setTimeout(() => {
      this.playTone(220, 0.2, 'sawtooth', 0.12);
    }, 100);
  }

  public soundHot() {
    this.playTone(659.25, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(783.99, 0.1, 'sine', 0.12), 70);
    setTimeout(() => this.playTone(987.77, 0.15, 'sine', 0.14), 140);
  }

  public soundCold() {
    this.playTone(440, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(370, 0.12, 'sine', 0.1), 70);
    setTimeout(() => this.playTone(311.13, 0.2, 'sine', 0.12), 140);
  }
}

export const sounds = new SoundManager();
