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
              className={`flex items-center justify-center px-2.5 sm:px-3 h-10 sm:h-12 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                canHint && !disabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-95'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
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
              className="flex-1 max-w-[34px] sm:max-w-[42px] h-10 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-90 active:bg-pink-500/30 border border-white/15 rounded-xl text-base sm:text-xl font-bold text-white shadow-sm transition-all touch-manipulation cursor-pointer"
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
              className="flex items-center justify-center px-2.5 sm:px-3.5 h-10 sm:h-12 bg-white/10 hover:bg-red-500/20 active:scale-95 border border-white/15 rounded-xl text-rose-300 font-bold transition-all cursor-pointer"
            >
              <Delete className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
