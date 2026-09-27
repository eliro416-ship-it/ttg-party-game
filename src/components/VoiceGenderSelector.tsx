import React from 'react';
import { VoiceGender, Language } from '../types/game';
import { sounds } from '../utils/audio';
import { User, Volume2, Sparkles } from 'lucide-react';

interface VoiceGenderSelectorProps {
  voiceGender: VoiceGender;
  onChangeVoiceGender: (gender: VoiceGender) => void;
  language?: Language;
  variant?: 'pill' | 'segmented';
  className?: string;
  previewOnChange?: boolean;
}

export const VoiceGenderSelector: React.FC<VoiceGenderSelectorProps> = ({
  voiceGender,
  onChangeVoiceGender,
  language = 'he',
  variant = 'pill',
  className = '',
  previewOnChange = true,
}) => {
  const isEn = language === 'en';

  const handleSelect = (gender: VoiceGender) => {
    onChangeVoiceGender(gender);
    if (previewOnChange) {
      // Play instant preview sample in the newly selected voice
      sounds.soundClue('yes', language, gender);
    } else {
      sounds.soundKeypress();
    }
  };

  const handleToggle = () => {
    const next = voiceGender === 'female' ? 'male' : 'female';
    handleSelect(next);
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={
          isEn
            ? `Current voice: ${voiceGender === 'female' ? 'Female' : 'Male'}. Click to switch`
            : `קול נוכחי: ${voiceGender === 'female' ? 'נקבה' : 'זכר'}. לחצו להחלפה`
        }
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border shadow-sm ${
          voiceGender === 'female'
            ? 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border-pink-400/40 shadow-pink-900/20'
            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/40 shadow-cyan-900/20'
        } active:scale-95 ${className}`}
      >
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <User className={`w-3 h-3 ${voiceGender === 'female' ? 'text-pink-300' : 'text-cyan-300'}`} strokeWidth={2.2} />
        </div>
        <span className="text-[11px] text-slate-300">
          {isEn ? 'Voice:' : 'קול:'}
        </span>
        <span className="font-extrabold">
          {voiceGender === 'female'
            ? (isEn ? 'Female' : 'נקבה')
            : (isEn ? 'Male' : 'זכר')}
        </span>
        <Volume2 className="w-3 h-3 text-slate-400 opacity-80" strokeWidth={2} />
      </button>
    );
  }

  // Segmented 2-option button
  return (
    <div
      className={`inline-flex items-center p-1 bg-black/40 border border-white/15 rounded-xl shadow-inner ${className}`}
      role="group"
      aria-label={isEn ? 'Select Voice Gender' : 'בחירת סוג קול זכר או נקבה'}
    >
      <button
        type="button"
        onClick={() => handleSelect('female')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
          voiceGender === 'female'
            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-900/40 scale-[1.02]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <User className="w-3.5 h-3.5 text-pink-200" strokeWidth={2.2} />
        <span>{isEn ? 'Female' : 'נקבה'}</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('male')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
          voiceGender === 'male'
            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-900/40 scale-[1.02]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <User className="w-3.5 h-3.5 text-cyan-200" strokeWidth={2.2} />
        <span>{isEn ? 'Male' : 'זכר'}</span>
      </button>
    </div>
  );
};
