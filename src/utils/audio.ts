export type VoiceGender = 'female' | 'male';

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public voiceGender: VoiceGender = 'female';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMuted = localStorage.getItem('game_sound_muted');
      if (savedMuted !== null) {
        this.isMuted = savedMuted === 'true';
      }

      const savedVoice = localStorage.getItem('ttg_voice_gender') as VoiceGender;
      if (savedVoice === 'female' || savedVoice === 'male') {
        this.voiceGender = savedVoice;
      }

      // Initialize SpeechSynthesis voices
      if ('speechSynthesis' in window) {
        this.loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  private loadVoices() {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.cachedVoices = window.speechSynthesis.getVoices() || [];
      }
    } catch {
      this.cachedVoices = [];
    }
  }

  public setVoiceGender(gender: VoiceGender) {
    this.voiceGender = gender;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ttg_voice_gender', gender);
    }
  }

  public getVoiceGender(): VoiceGender {
    return this.voiceGender;
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('game_sound_muted', String(this.isMuted));
      if (this.isMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
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

  public soundYes(mult: number = 1) {
    this.playTone(587.33 * mult, 0.12, 'sine', 0.12);
    setTimeout(() => {
      this.playTone(880 * mult, 0.2, 'sine', 0.14);
    }, 80);
  }

  public soundNo(mult: number = 1) {
    this.playTone(280 * mult, 0.15, 'sawtooth', 0.1);
    setTimeout(() => {
      this.playTone(220 * mult, 0.2, 'sawtooth', 0.12);
    }, 100);
  }

  public soundHot(mult: number = 1) {
    this.playTone(659.25 * mult, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(783.99 * mult, 0.1, 'sine', 0.12), 70);
    setTimeout(() => this.playTone(987.77 * mult, 0.15, 'sine', 0.14), 140);
  }

  public soundCold(mult: number = 1) {
    this.playTone(440 * mult, 0.1, 'sine', 0.1);
    setTimeout(() => this.playTone(370 * mult, 0.12, 'sine', 0.1), 70);
    setTimeout(() => this.playTone(311.13 * mult, 0.2, 'sine', 0.12), 140);
  }

  public soundBonus() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.18, 'triangle', 0.16);
      }, idx * 80);
    });
  }

  /**
   * Speaks the reaction ("כן", "לא", "חם", "קר") in Hebrew or English
   * using the selected voice gender (female / male).
   */
  public speakReaction(reaction: 'yes' | 'no' | 'hot' | 'cold', lang: 'he' | 'en' = 'he') {
    if (this.isMuted) return;

    // 1. Play musical cue with gender pitch modulation
    const pitchMult = this.voiceGender === 'female' ? 1.15 : 0.85;
    if (reaction === 'yes') this.soundYes(pitchMult);
    else if (reaction === 'no') this.soundNo(pitchMult);
    else if (reaction === 'hot') this.soundHot(pitchMult);
    else if (reaction === 'cold') this.soundCold(pitchMult);

    // 2. Speak spoken word via Web Speech API
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();

      let textToSpeak = '';
      if (lang === 'he') {
        if (reaction === 'yes') textToSpeak = 'כן!';
        else if (reaction === 'no') textToSpeak = 'לא!';
        else if (reaction === 'hot') textToSpeak = 'חם!';
        else if (reaction === 'cold') textToSpeak = 'קר!';
      } else {
        if (reaction === 'yes') textToSpeak = 'Yes!';
        else if (reaction === 'no') textToSpeak = 'No!';
        else if (reaction === 'hot') textToSpeak = 'Hot!';
        else if (reaction === 'cold') textToSpeak = 'Cold!';
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'he' ? 'he-IL' : 'en-US';

      if (this.cachedVoices.length === 0) {
        this.loadVoices();
      }

      const langVoices = this.cachedVoices.filter(v =>
        v.lang.toLowerCase().startsWith(lang === 'he' ? 'he' : 'en')
      );

      if (this.voiceGender === 'female') {
        utterance.pitch = 1.35;
        utterance.rate = 1.05;

        // Try to match a female voice
        const femaleVoice = langVoices.find(v => {
          const n = v.name.toLowerCase();
          return (
            n.includes('female') ||
            n.includes('woman') ||
            n.includes('carmit') ||
            n.includes('sara') ||
            n.includes('samantha') ||
            n.includes('zira') ||
            n.includes('victoria') ||
            n.includes('karen')
          );
        }) || langVoices[0];

        if (femaleVoice) utterance.voice = femaleVoice;
      } else {
        // Male voice
        utterance.pitch = 0.72;
        utterance.rate = 0.95;

        // Try to match a male voice
        const maleVoice = langVoices.find(v => {
          const n = v.name.toLowerCase();
          return (
            n.includes('male') ||
            n.includes('man') ||
            n.includes('david') ||
            n.includes('guy') ||
            n.includes('daniel') ||
            n.includes('george') ||
            n.includes('alex') ||
            n.includes('fred')
          );
        }) || langVoices[0];

        if (maleVoice) utterance.voice = maleVoice;
      }

      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }

  /**
   * Special fanfare and vocal announcement for a correct answer
   */
  public soundCorrectGuess(winnerName?: string, lang: 'he' | 'en' = 'he') {
    // 1. Play grand triumphant fanfare
    this.soundSuccess();
    setTimeout(() => {
      this.soundWin();
    }, 180);

    // 2. Announce the winner's name if speech synthesis is available
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window) || !winnerName) return;

    try {
      setTimeout(() => {
        const text = lang === 'he'
          ? `תשובה נכונה מאת ${winnerName}!`
          : `Correct answer by ${winnerName}!`;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'he' ? 'he-IL' : 'en-US';
        utterance.volume = 1.0;

        if (this.voiceGender === 'female') {
          utterance.pitch = 1.25;
          utterance.rate = 1.05;
        } else {
          utterance.pitch = 0.8;
          utterance.rate = 0.95;
        }

        window.speechSynthesis.speak(utterance);
      }, 450);
    } catch (e) {
      console.warn('Speech announcement error:', e);
    }
  }

  /**
   * Preview a voice type when user changes setting
   */
  public previewVoice(gender: VoiceGender, lang: 'he' | 'en' = 'he') {
    this.setVoiceGender(gender);
    this.speakReaction('yes', lang);
  }
}

export const sounds = new SoundManager();
