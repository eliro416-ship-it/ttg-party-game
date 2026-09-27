import { Language, VoiceGender } from '../types/game';

class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public voiceGender: VoiceGender = 'female';
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('game_sound_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }

      const savedGender = localStorage.getItem('game_voice_gender');
      if (savedGender === 'male' || savedGender === 'female') {
        this.voiceGender = savedGender;
      }

      this.initVoices();
    }
  }

  private initVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.cachedVoices = window.speechSynthesis.getVoices();
        };
      }
    }
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

  public setVoiceGender(gender: VoiceGender): VoiceGender {
    this.voiceGender = gender;
    if (typeof window !== 'undefined') {
      localStorage.setItem('game_voice_gender', gender);
    }
    return this.voiceGender;
  }

  public toggleVoiceGender(): VoiceGender {
    const next = this.voiceGender === 'female' ? 'male' : 'female';
    return this.setVoiceGender(next);
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

  /**
   * Spoken speech narration with clear Male/Female voice distinction.
   * On mobile devices with only one Hebrew voice:
   * 1. Explicit utterance.lang = 'he-IL' (or 'en-US' for English).
   * 2. Voice filtering via window.speechSynthesis.getVoices() searching for 'he' or 'iw'.
   * 3. When 'male':
   *    - First check for voice containing 'male', 'david', 'guy', or 'he-il-x-iad-local'.
   *    - If not available, use existing Hebrew voice and adjust pitch: 0.65, rate: 0.88.
   * 4. When 'female':
   *    - Set pitch: 1.15, rate: 1.0.
   * 5. cancel() called before every speech, and properties enforced directly on utterance before speak().
   */
  public speakText(text: string, lang: Language = 'he', gender: VoiceGender = this.voiceGender) {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // 5. Cancel previous speech to prevent overlapping responses
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const isEn = lang === 'en';

      // 1. Explicit language configuration (always 'he-IL' for Hebrew)
      utterance.lang = isEn ? 'en-US' : 'he-IL';

      // 2. Retrieve voices, supporting 'he' and 'iw' (common Hebrew locale codes)
      const freshVoices = window.speechSynthesis.getVoices();
      if (freshVoices && freshVoices.length > 0) {
        this.cachedVoices = freshVoices;
      }
      const allVoices = this.cachedVoices.length > 0 ? this.cachedVoices : [];

      const langVoices = allVoices.filter((v) => {
        const vLang = (v.lang || '').toLowerCase();
        const vName = (v.name || '').toLowerCase();
        return isEn
          ? vLang.startsWith('en')
          : (
              vLang.startsWith('he') ||
              vLang.startsWith('iw') ||
              vLang.includes('he-il') ||
              vLang.includes('iw-il') ||
              vName.includes('hebrew') ||
              vName.includes('עברית')
            );
      });

      // 3 & 4. Distinct voice selection and parameter tuning
      if (gender === 'male') {
        // 3. Check for dedicated male voice
        const maleVoice = langVoices.find((v) => {
          const vName = (v.name || '').toLowerCase();
          const vURI = (v.voiceURI || '').toLowerCase();
          return (
            vName.includes('male') ||
            vName.includes('david') ||
            vName.includes('guy') ||
            vName.includes('he-il-x-iad-local') ||
            vURI.includes('male') ||
            vURI.includes('david') ||
            vURI.includes('guy') ||
            vURI.includes('he-il-x-iad-local')
          );
        });

        if (maleVoice) {
          utterance.voice = maleVoice;
        } else if (langVoices.length > 0) {
          utterance.voice = langVoices[0];
        }

        // Apply deep masculine pitch and steady pace
        utterance.pitch = 0.65;
        utterance.rate = 0.88;
      } else {
        // 4. Female voice selection
        const femaleVoice =
          langVoices.find((v) => {
            const vName = (v.name || '').toLowerCase();
            const vURI = (v.voiceURI || '').toLowerCase();
            return (
              /female|carmit|zira|samantha|victoria|karen|siri/i.test(vName) ||
              /female|carmit|zira|siri/i.test(vURI)
            );
          }) || langVoices[0];

        if (femaleVoice) {
          utterance.voice = femaleVoice;
        }

        // Female pitch and rate
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      }

      // Enforce volume and speak directly
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }

  public speakWord(text: string, lang: Language = 'he', gender?: VoiceGender) {
    this.speakText(text, lang, gender || this.voiceGender);
  }

  /**
   * High-clarity Clue Speech:
   * Speaks the response cleanly ("כן", "לא", "חם", "קר") in Hebrew or English
   * without distracting beeps or audio distortion filters.
   */
  public soundClue(
    clue: 'yes' | 'no' | 'hot' | 'cold',
    lang: Language = 'he',
    overrideGender?: VoiceGender
  ) {
    if (this.isMuted) return;
    const gender = overrideGender || this.voiceGender;

    const wordMap: Record<string, { he: string; en: string }> = {
      yes: { he: 'כן', en: 'Yes' },
      no: { he: 'לא', en: 'No' },
      hot: { he: 'חם', en: 'Hot' },
      cold: { he: 'קר', en: 'Cold' },
    };

    const word = wordMap[clue]?.[lang] || clue;
    this.speakText(word, lang, gender);
  }
}

export const sounds = new SoundManager();
