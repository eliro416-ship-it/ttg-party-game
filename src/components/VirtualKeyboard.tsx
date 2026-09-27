import React from 'react';
import { HEBREW_KEYBOARD_ROWS } from '../utils/hebrewKeyboard';
import { Delete, Lightbulb } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface VirtualKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace: () => void;
  onHintClick?: () => void;
  canHint?: boolean;
  disabled?: boolean;
  language?: Language;
}

const ENGLISH_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onLetterPress,
  onBackspace,
  onHintClick,
  canHint = true,
  disabled = false,
  language = 'he',
}) => {
  const isEn = language === 'en';
  const rows = isEn ? ENGLISH_KEYBOARD_ROWS : HEBREW_KEYBOARD_ROWS;

  const handleKey = (letter: string) => {
    if (disabled) return;
    sounds.soundKeypress();
    onLetterPress(letter);
  };

  const handleDelete = () => {
    if (disabled) return;
    sounds.soundDelete();
    onBackspace();
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-2 select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5 my-1 sm:my-1.5">
          {rowIndex === 2 && onHintClick && (
            <button
              type="button"
              onClick={onHintClick}
              disabled={!canHint || disabled}
              title={isEn ? 'Get a hint (one letter)' : 'קבל רמז (אות אחת)'}
              className={`btn-3d flex items-center justify-center px-2.5 sm:px-3 h-10 sm:h-12 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                canHint && !disabled
                  ? 'btn-3d-dark text-amber-300 border-amber-500/40 shadow-[0_3px_0_#78350f]'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-50'
              }`}
            >
              <Lightbulb className={`w-3.5 h-3.5 ${isEn ? 'mr-1' : 'ml-1'} text-amber-400`} />
              <span>{isEn ? 'Hint' : 'רמז'}</span>
            </button>
          )}

          {row.map((char) => (
            <button
              key={char}
              type="button"
              disabled={disabled}
              onClick={() => handleKey(char)}
              className="btn-3d flex-1 max-w-[34px] sm:max-w-[42px] h-10 sm:h-12 flex items-center justify-center btn-3d-dark rounded-xl text-base sm:text-xl font-black text-white touch-manipulation cursor-pointer active:bg-pink-500/40"
            >
              {char}
            </button>
          ))}

          {rowIndex === 2 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleDelete}
              title={isEn ? 'Backspace' : 'מחק אות'}
              className="btn-3d flex items-center justify-center px-2.5 sm:px-3.5 h-10 sm:h-12 btn-3d-dark rounded-xl text-rose-300 font-bold transition-all cursor-pointer border-rose-500/30 shadow-[0_3px_0_#881337]"
            >
              <Delete className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
