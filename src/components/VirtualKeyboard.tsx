import React from 'react';
import { HEBREW_KEYBOARD_ROWS } from '../utils/hebrewKeyboard';
import { Delete, Lightbulb, RotateCcw } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface VirtualKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace: () => void;
  onClearAll?: () => void;
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
  onClearAll,
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

  const handleClear = () => {
    if (disabled || !onClearAll) return;
    sounds.soundDelete();
    onClearAll();
  };

  // Uniform key dimensions: every single letter key has identical width and height across all rows
  const KEY_STYLE: React.CSSProperties = {
    width: 'calc((100% - 36px) / 10)',
    maxWidth: '40px',
  };

  return (
    <div className="w-full max-w-[440px] mx-auto mt-2 select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top Action Bar: Hint and optional Clear button */}
      {(onHintClick || onClearAll) && (
        <div className="flex items-center justify-between px-1 mb-2">
          {onHintClick && (
            <button
              type="button"
              onClick={onHintClick}
              disabled={!canHint || disabled}
              title={isEn ? 'Get a hint' : 'קבל רמז'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                canHint && !disabled
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 active:scale-95 shadow-amber-500/10'
                  : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{isEn ? 'Get Hint' : '💡 קבל רמז'}</span>
            </button>
          )}

          {onClearAll && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              title={isEn ? 'Clear all letters' : 'נקה הכל'}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 bg-white/5 hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/10"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isEn ? 'Clear' : 'נקה'}</span>
            </button>
          )}
        </div>
      )}

      {/* Keyboard Rows */}
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1 my-1">
          {/* Row 3 in English: Backspace on one side if needed */}
          {isEn && rowIndex === 2 && (
            <div style={KEY_STYLE} className="flex-none invisible" />
          )}

          {/* Letter Keys - Frosted milky glass background with black font */}
          {row.map((char) => (
            <button
              key={char}
              type="button"
              disabled={disabled}
              onClick={() => handleKey(char)}
              style={KEY_STYLE}
              className="flex-none h-11 sm:h-12 flex items-center justify-center bg-white/75 hover:bg-white/90 active:bg-white backdrop-blur-md border border-white/80 active:scale-90 rounded-xl text-lg sm:text-xl font-black text-slate-900 shadow-md shadow-black/15 transition-all touch-manipulation cursor-pointer"
            >
              {char}
            </button>
          ))}

          {/* Backspace Key in Row 3 (Index 2): Frosted milky glass style */}
          {rowIndex === 2 && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleDelete}
              style={KEY_STYLE}
              title={isEn ? 'Backspace' : 'מחק אות'}
              className="flex-none h-11 sm:h-12 flex items-center justify-center bg-white/75 hover:bg-rose-100/90 active:bg-rose-200 backdrop-blur-md border border-white/80 active:scale-90 rounded-xl text-rose-700 transition-all touch-manipulation cursor-pointer shadow-md shadow-black/15"
            >
              <Delete className="w-5 sm:w-6 h-5 sm:h-6 stroke-[2.5]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
